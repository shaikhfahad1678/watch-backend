import { Router } from "express";
import {
  getAllTopLists,
  getTopListById,
  addTopList,
  updateTopList,
  removeTopList
} from "../controllers/topList.controller.js";

const router = Router();

// Public routes
router.get("/", getAllTopLists);
router.get("/:id", getTopListById);

// Admin routes
router.post("/add", addTopList);
router.put("/update/:id", updateTopList);
router.delete("/remove/:id", removeTopList);

export default router;
