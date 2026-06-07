import mongoose from "mongoose"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken";


const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true,
    },
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        index: true,
    },


    password: {
        type: String,
        required: [true, 'Password is required']
    },

    refreshToken: {
        type: String
    },

    watchCollection: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Watch"
        }
    ],

    recent_products: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Watch"
        }
    ]


}, { timestamps: true }
)

//This is middle ware:If it uses .pre() or .post() → Middleware
//                    If it uses .methods → Schema Method

userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;

    this.password = await bcrypt.hash(this.password, 10);
});

//Password check method -Used during login
// Compares:
// password entered by user (plain text)
// password stored in DB (hashed)
//bcrypt.compare():Hashes the entered password, Compares it with stored hash,Returns true or false
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

//Access token generator
userSchema.methods.generateAcessToken = function () {
    return jwt.sign(
        {
            id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

//Refresh token generator
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            id: this._id,

        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}



export const User = mongoose.model("User", userSchema)