import { Router } from "express";
import {
  getAllBlogs,
  getBlogById,
  addBlog,
  updateBlog,
  removeBlog
} from "../controllers/blog.controller.js";

const router = Router();

// Public routes
router.get("/", getAllBlogs);
router.get("/:id", getBlogById);

// Admin / Management routes
router.post("/add", addBlog);
router.put("/update/:id", updateBlog);
router.delete("/remove/:id", removeBlog);

export default router;
