import { Router } from "express";

import {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getCurrentUser,
    addToCollection,
    removeFromCollection,
    addRecentProduct,
    googleLogin
} from "../controllers/user.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

/* ---------- AUTH ---------- */
// register
router.post("/register", registerUser);
// login
router.post("/login", loginUser);
// google login
router.post("/google-login", googleLogin);
// logout
router.post("/logout", verifyJWT, logoutUser);
// refresh token
router.post("/refresh-token", refreshAccessToken);


/* ---------- USER ---------- */
// current logged-in user
router.get("/me", verifyJWT, getCurrentUser);


/* ---------- COLLECTION ---------- */
// add watch to collection
router.post("/collection/add", verifyJWT, addToCollection);
// remove watch from collection
router.post("/collection/remove", verifyJWT, removeFromCollection);


/* ---------- RECENT PRODUCTS ---------- */
// add recently viewed product
router.post("/recent/add", verifyJWT, addRecentProduct);


export default router;