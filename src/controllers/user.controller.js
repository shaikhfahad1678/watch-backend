import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);



const generateAcessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAcessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }
    } catch (err) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")

    }
}

const registerUser = asyncHandler(async (req, res) => {

    const { email, username, password, fullName } = req.body
    console.log("body:", req.body)


    //validation - check, check is field empty
    if (
        [email, username, password].some((field) =>
            field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    //validation - check, is user exist
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]  //$or is a mongodb operator
    })
    if (existedUser) {
        throw new ApiError(409, "User with email or username already exist")
    }


    //creating entry in database, user-newly created user document
    const user = await User.create({
        email,
        username: username.toLowerCase(),
        password,
        fullName: fullName || username,
    })

    //fetches the user again from database-all fields except password and refreshToken.
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    //validation - If database read failed → throw server error
    if (!createdUser) {
        throw new ApiError(500, "User registration failed")
    }


    //the final step of your API — the response to the client.
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )



})

const loginUser = asyncHandler(async (req, res) => {

    const { email, username, password, isGoogle } = req.body

    if (!(username || email)) {
        throw new ApiError(400, "username or email is required")
    }

    const user = await User.findOne({ //findOne is a mongodb code only work for user
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    const ispasswordValid = isGoogle ? true : await user.isPasswordCorrect(password)

    if (!ispasswordValid) {
        throw new ApiError(401, "Invalid user password")
    }

    const { accessToken, refreshToken } = await generateAcessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).
        select("-password -refreshToken") //---refreshtoken is currently empty

    const options = { //--it will secure the cookie
        httpOnly: true,
        secure: false,
        sameSite: "lax"
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json( //--used mainly for app
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken,
                    refreshToken
                },
                "User logged in successfully"
            )
        )
})

const logoutUser = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
        return res.status(200).json(
            new ApiResponse(200, null, "Already logged out")
        );
    }

    await User.findOneAndUpdate(
        { refreshToken },
        { $unset: { refreshToken: 1 } }
    );

    const options = {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(200, null, "User logged out successfully")
        );
});

// This API endpoint securely generates a new access token (and refresh token) when
//  the old access token expires, using a valid refresh token.

// This function handles the “silent re-login” flow:
// Access token expired →
// Client sends refresh token →
// Server verifies it →
// New access + refresh tokens issued →
// User stays logged in

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.
        refreshToken || req.body.refreshToken
    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        // 1️⃣ Verify refresh token signature & expiry
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        // 2️⃣ Find user
        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        // 3️⃣ Match refresh token with DB
        if (user.refreshToken !== incomingRefreshToken) {
            throw new ApiError(401, "Refresh token expired or already used");
        }

        // 4️⃣ Generate new tokens
        const { accessToken, refreshToken: newRefreshToken } =
            await generateAcessAndRefreshToken(user._id);

        // 5️⃣ Cookie options
        const options = {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
        };

        // 6️⃣ Send response
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token refreshed successfully"
                )
            );

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }

})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "Current user fetched successfully"))
})

const addToCollection = asyncHandler(async (req, res) => {

    const { watchId } = req.body;
    const userId = req.user._id;

    const user = await User.findByIdAndUpdate(
        userId,
        {
            $addToSet: { watchCollection: watchId }
        },
        { new: true }
    ).populate("watchCollection");

    return res.status(200).json(
        new ApiResponse(
            200,
            user.watchCollection,
            "Watch added to collection"
        )
    );

});

const removeFromCollection = asyncHandler(async (req, res) => {

    const { watchId } = req.body;
    const userId = req.user._id;

    const user = await User.findByIdAndUpdate(
        userId,
        {
            $pull: { watchCollection: watchId }
        },
        { new: true }
    ).populate("watchCollection");

    return res.status(200).json(
        new ApiResponse(
            200,
            user.watchCollection,
            "Watch removed from collection"
        )
    );

});

//Limit to 30
const addRecentProduct = asyncHandler(async (req, res) => {

    const { watchId } = req.body;
    const userId = req.user._id;

    await User.findByIdAndUpdate(userId, {
        $pull: { recent_products: watchId }
    });

    const user = await User.findByIdAndUpdate(
        userId,
        {
            $push: {
                recent_products: {
                    $each: [watchId],
                    $position: 0,
                    $slice: 30
                }
            }
        },
        { new: true }
    ).populate("recent_products");

    return res.status(200).json(
        new ApiResponse(
            200,
            user.recent_products,
            "Recent product updated"
        )
    );

});

const googleLogin = asyncHandler(async (req, res) => {
    const { idToken } = req.body;

    if (!idToken) {
        throw new ApiError(400, "Google ID token is required");
    }

    try {
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        
        const { email, name, picture } = payload;

        if (!email) {
            throw new ApiError(400, "Google token does not contain a valid email");
        }

        // Find or create user
        let user = await User.findOne({ email });

        if (!user) {
            // Generate a random username and password
            const username = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "").toLowerCase() + Math.floor(Math.random() * 1000);
            const password = Math.random().toString(36).slice(-10) + "A1!"; // random secure password
            
            user = await User.create({
                email,
                username,
                password,
                fullName: name || email.split("@")[0],
            });
        }

        const { accessToken, refreshToken } = await generateAcessAndRefreshToken(user._id);

        const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

        const options = {
            httpOnly: true,
            secure: false,
            sameSite: "lax"
        };

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        user: loggedInUser,
                        accessToken,
                        refreshToken
                    },
                    "User logged in via Google successfully"
                )
            );
    } catch (err) {
        throw new ApiError(401, err.message || "Google token verification failed");
    }
});

export {
    getCurrentUser,
    refreshAccessToken,
    logoutUser,
    loginUser,
    registerUser,
    addToCollection,
    removeFromCollection,
    addRecentProduct,
    googleLogin,
}