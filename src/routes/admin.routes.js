// routes/productRoutes.js

import { Router } from "express";
import { addProduct, removeProduct, updateProduct, uploadImage, uploadImageUrl, getSections, updateSection } from "../controllers/admin.controller.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = Router();

router.post("/add", addProduct);
router.delete("/remove/:id", removeProduct);
router.put("/update/:id", updateProduct);
router.post("/upload-image", upload.single("image"), uploadImage);
router.post("/upload-image-url", uploadImageUrl);
router.get("/sections", getSections);
router.post("/sections", updateSection);

export default router;