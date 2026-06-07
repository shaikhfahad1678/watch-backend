import mongoose from "mongoose";
import Blog from "../models/blog.model.js";
import { uploadUrlToStorage, deleteFromStorage } from "../utils/upload.service.js";

// Get all blogs
export const getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ created_at: -1 });
    return res.status(200).json({
      success: true,
      blogs
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get a single blog by ID or Slug
export const getBlogById = async (req, res) => {
  try {
    const { id } = req.params;
    let blog;
    if (mongoose.isValidObjectId(id)) {
      blog = await Blog.findById(id);
    }
    if (!blog) {
      blog = await Blog.findOne({ slug: id });
    }
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found"
      });
    }
    return res.status(200).json({
      success: true,
      blog
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Add a new blog (Admin)
export const addBlog = async (req, res) => {
  try {
    const data = { ...req.body };
    const { title, images } = data;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Blog title is required"
      });
    }

    // Generate slug from title for image path R2 grouping
    const slug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    // Process and upload external image URLs to R2
    const uploadedImages = [];
    if (Array.isArray(images)) {
      for (const imgUrl of images) {
        if (!imgUrl || !imgUrl.trim()) continue;
        
        const cleanUrl = imgUrl.trim();
        const r2PublicUrl = process.env.R2_PUBLIC_URL || "";
        
        const isExternal = cleanUrl.startsWith("http") && 
          !cleanUrl.includes("/uploads/blogs/") && 
          (r2PublicUrl === "" || !cleanUrl.includes(r2PublicUrl));

        if (isExternal) {
          try {
            const r2Url = await uploadUrlToStorage(cleanUrl, `blogs/${slug}`);
            uploadedImages.push(r2Url);
          } catch (err) {
            console.error(`Failed to upload blog image ${cleanUrl} to R2:`, err.message);
            uploadedImages.push(cleanUrl); // Fallback to original URL
          }
        } else {
          uploadedImages.push(cleanUrl);
        }
      }
    }

    data.images = uploadedImages;
    data.slug = slug;

    const blog = new Blog(data);
    await blog.save();

    return res.status(201).json({
      success: true,
      message: "Blog added successfully",
      blog
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update an existing blog (Admin)
export const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const data = { ...req.body };
    const { title, images } = data;

    const existingBlog = await Blog.findById(id);
    if (!existingBlog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found"
      });
    }

    // Determine title for slug
    const finalTitle = title || existingBlog.title || "blog";
    const slug = finalTitle
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    // Process images
    const uploadedImages = [];
    if (Array.isArray(images)) {
      for (const imgUrl of images) {
        if (!imgUrl || !imgUrl.trim()) continue;

        const cleanUrl = imgUrl.trim();
        const r2PublicUrl = process.env.R2_PUBLIC_URL || "";

        const isExternal = cleanUrl.startsWith("http") && 
          !cleanUrl.includes("/uploads/blogs/") && 
          (r2PublicUrl === "" || !cleanUrl.includes(r2PublicUrl));

        if (isExternal) {
          try {
            const r2Url = await uploadUrlToStorage(cleanUrl, `blogs/${slug}`);
            uploadedImages.push(r2Url);
          } catch (err) {
            console.error(`Failed to upload updated blog image ${cleanUrl} to R2:`, err.message);
            uploadedImages.push(cleanUrl);
          }
        } else {
          uploadedImages.push(cleanUrl);
        }
      }
    }

    data.images = uploadedImages;
    data.slug = slug;

    // Optional: Clean up images that were deleted during editing
    if (existingBlog.images && existingBlog.images.length > 0) {
      const remainingImageSet = new Set(uploadedImages);
      for (const oldImg of existingBlog.images) {
        if (oldImg && !remainingImageSet.has(oldImg)) {
          await deleteFromStorage(oldImg).catch(err => 
            console.error("Failed to delete unused image from storage:", err.message)
          );
        }
      }
    }

    const updatedBlog = await Blog.findByIdAndUpdate(id, data, { new: true, runValidators: true });

    return res.status(200).json({
      success: true,
      message: "Blog updated successfully",
      blog: updatedBlog
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Remove a blog (Admin)
export const removeBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found"
      });
    }

    // Delete associated images from storage
    if (blog.images && blog.images.length > 0) {
      for (const imgUrl of blog.images) {
        if (imgUrl) {
          await deleteFromStorage(imgUrl).catch(err => 
            console.error("Failed to delete blog image during removal:", err.message)
          );
        }
      }
    }

    await Blog.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Blog deleted successfully"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
