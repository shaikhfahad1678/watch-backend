import mongoose from "mongoose";
import TopList from "../models/topList.model.js";
import { uploadUrlToStorage, deleteFromStorage } from "../utils/upload.service.js";

// Get all curated lists
export const getAllTopLists = async (req, res) => {
  try {
    const lists = await TopList.find().sort({ created_at: -1 });
    return res.status(200).json({
      success: true,
      lists
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get a curated list by ID or Slug
export const getTopListById = async (req, res) => {
  try {
    const { id } = req.params;
    let list;
    if (mongoose.isValidObjectId(id)) {
      list = await TopList.findById(id);
    }
    if (!list) {
      list = await TopList.findOne({ slug: id });
    }
    if (!list) {
      return res.status(404).json({
        success: false,
        message: "Curated list not found"
      });
    }
    return res.status(200).json({
      success: true,
      list
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Add a new curated list (Admin)
export const addTopList = async (req, res) => {
  try {
    const data = { ...req.body };
    const { title, topImage, items } = data;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Title is required"
      });
    }

    const slug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    const r2PublicUrl = process.env.R2_PUBLIC_URL || "";

    // 1. Process topImage
    if (topImage && topImage.trim().startsWith("http")) {
      const cleanUrl = topImage.trim();
      const isExternal = !cleanUrl.includes("/uploads/toplists/") && 
        (r2PublicUrl === "" || !cleanUrl.includes(r2PublicUrl));

      if (isExternal) {
        try {
          data.topImage = await uploadUrlToStorage(cleanUrl, `toplists/${slug}`);
        } catch (err) {
          console.error("Failed to upload topImage to R2:", err.message);
        }
      }
    }

    // 2. Process list items
    if (Array.isArray(items)) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.image && item.image.trim().startsWith("http")) {
          const cleanItemUrl = item.image.trim();
          const isItemExternal = !cleanItemUrl.includes("/uploads/toplists/") && 
            (r2PublicUrl === "" || !cleanItemUrl.includes(r2PublicUrl));

          if (isItemExternal) {
            try {
              item.image = await uploadUrlToStorage(cleanItemUrl, `toplists/${slug}`);
            } catch (err) {
              console.error(`Failed to upload list item ${i} image to R2:`, err.message);
            }
          }
        }
      }
    }

    data.slug = slug;
    const newList = new TopList(data);
    await newList.save();

    return res.status(201).json({
      success: true,
      message: "Curated list added successfully",
      list: newList
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update curated list (Admin)
export const updateTopList = async (req, res) => {
  try {
    const { id } = req.params;
    const data = { ...req.body };
    const { title, topImage, items } = data;

    const existingList = await TopList.findById(id);
    if (!existingList) {
      return res.status(404).json({
        success: false,
        message: "Curated list not found"
      });
    }

    const finalTitle = title || existingList.title || "curated-list";
    const slug = finalTitle
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    const r2PublicUrl = process.env.R2_PUBLIC_URL || "";

    // 1. Process topImage
    if (topImage && topImage.trim().startsWith("http")) {
      const cleanUrl = topImage.trim();
      const isExternal = !cleanUrl.includes("/uploads/toplists/") && 
        (r2PublicUrl === "" || !cleanUrl.includes(r2PublicUrl));

      if (isExternal) {
        try {
          data.topImage = await uploadUrlToStorage(cleanUrl, `toplists/${slug}`);
        } catch (err) {
          console.error("Failed to upload topImage to R2:", err.message);
        }
      }
    }

    // 2. Process list items
    if (Array.isArray(items)) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.image && item.image.trim().startsWith("http")) {
          const cleanItemUrl = item.image.trim();
          const isItemExternal = !cleanItemUrl.includes("/uploads/toplists/") && 
            (r2PublicUrl === "" || !cleanItemUrl.includes(r2PublicUrl));

          if (isItemExternal) {
            try {
              item.image = await uploadUrlToStorage(cleanItemUrl, `toplists/${slug}`);
            } catch (err) {
              console.error(`Failed to upload updated list item ${i} image to R2:`, err.message);
            }
          }
        }
      }
    }

    // 3. Clean up deleted images from R2
    const currentImages = new Set();
    if (data.topImage) currentImages.add(data.topImage);
    if (Array.isArray(items)) {
      items.forEach(item => { if (item.image) currentImages.add(item.image); });
    }

    if (existingList.topImage && !currentImages.has(existingList.topImage)) {
      await deleteFromStorage(existingList.topImage).catch(err => console.error(err.message));
    }
    if (existingList.items && existingList.items.length > 0) {
      for (const oldItem of existingList.items) {
        if (oldItem.image && !currentImages.has(oldItem.image)) {
          await deleteFromStorage(oldItem.image).catch(err => console.error(err.message));
        }
      }
    }

    data.slug = slug;
    const updatedList = await TopList.findByIdAndUpdate(id, data, { new: true, runValidators: true });

    return res.status(200).json({
      success: true,
      message: "Curated list updated successfully",
      list: updatedList
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Remove curated list (Admin)
export const removeTopList = async (req, res) => {
  try {
    const { id } = req.params;
    const list = await TopList.findById(id);
    if (!list) {
      return res.status(404).json({
        success: false,
        message: "Curated list not found"
      });
    }

    // Delete associated images
    if (list.topImage) {
      await deleteFromStorage(list.topImage).catch(err => console.error(err.message));
    }
    if (list.items && list.items.length > 0) {
      for (const item of list.items) {
        if (item.image) {
          await deleteFromStorage(item.image).catch(err => console.error(err.message));
        }
      }
    }

    await TopList.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Curated list deleted successfully"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
