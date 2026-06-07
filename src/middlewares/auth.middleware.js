//it verify you are login or not by using access token then-- router.route("/profile").post(profile)
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {

    const token =
        req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "");
    console.log("Cookies received:", req.cookies);
    console.log("Token:", token);
    console.log("Secret:", process.env.ACCESS_TOKEN_SECRET);



    if (!token) {
        throw new ApiError(401, "Access token is missing");
    }

    try {
        const decodedToken = jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET
        );

        const user = await User.findById(decodedToken.id)
            .select("-password -refreshToken")
            .populate("watchCollection");
        console.log(user);


        if (!user) {
            throw new ApiError(401, "Invalid access token");
        }

        req.user = user;
        next();

    } catch (error) {
        throw new ApiError(401, "Invalid or expired access token");
    }
});
