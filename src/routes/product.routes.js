import { Router } from "express";
import {
    getAllProducts,
    getAllBrands,
    getProductById,
    getProductsByBrand,
    increaseView,
    searchProducts,
    getSectionProducts
} from "../controllers/product.controller.js";

const router = Router();

router.get("/", getAllProducts);
router.get("/brands", getAllBrands);
router.get("/search", searchProducts);
router.get("/section/:title", getSectionProducts);
router.get("/brand/:brandId", getProductsByBrand);
router.post("/view/:id", increaseView);
router.get("/:id", getProductById);

export default router;
