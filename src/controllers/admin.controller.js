// controllers/productController.js

import Watch from "../models/product.model.js";
import ProductSection from "../models/product.section.js";

export const addProduct = async (req, res) => {
  try {
    const data = req.body;

    // basic validation
    if (!data.model_name || !data.price) {
      return res.status(400).json({
        success: false,
        message: "Model name and price are required"
      });
    }

    // ensure only one main image
    if (data.images && data.images.length > 0) {
      let hasMain = data.images.some(img => img.is_main);

      if (!hasMain) {
        data.images[0].is_main = true;
      }
    }

    const product = new Watch(data);
    await product.save();

    res.status(201).json({
      success: true,
      message: "Product added successfully",
      product
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const removeProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Watch.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    // Delete the product document from database
    await Watch.findByIdAndDelete(id);

    // Delete associated images from Cloudflare R2 or local storage
    if (product.images && product.images.length > 0) {
      for (const img of product.images) {
        if (img.url) {
          await deleteFromStorage(img.url);
        }
      }
    }

    res.json({
      success: true,
      message: "Product and its images deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // basic validation
    if (!data.model_name || !data.price) {
      return res.status(400).json({
        success: false,
        message: "Model name and price are required"
      });
    }

    // ensure only one main image
    if (data.images && data.images.length > 0) {
      let hasMain = data.images.some(img => img.is_main);

      if (!hasMain) {
        data.images[0].is_main = true;
      }
    }

    const product = await Watch.findByIdAndUpdate(id, data, { new: true, runValidators: true });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    res.json({
      success: true,
      message: "Product updated successfully",
      product
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

import { uploadToStorage, uploadUrlToStorage, deleteFromStorage } from "../utils/upload.service.js";

export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided"
      });
    }

    const { folder } = req.body;
    const imageUrl = await uploadToStorage(req.file, folder);

    return res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      url: imageUrl
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const uploadImageUrl = async (req, res) => {
  try {
    const { url, folder } = req.body;
    if (!url) {
      return res.status(400).json({
        success: false,
        message: "No image URL provided"
      });
    }

    const imageUrl = await uploadUrlToStorage(url, folder);

    return res.status(200).json({
      success: true,
      message: "Image uploaded from URL successfully",
      url: imageUrl
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getSections = async (req, res) => {
  try {
    const sections = await ProductSection.find().populate("products");
    return res.status(200).json({
      success: true,
      sections
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const updateSection = async (req, res) => {
  try {
    const { title, products } = req.body;
    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Section title is required"
      });
    }

    const section = await ProductSection.findOneAndUpdate(
      { title },
      { title, products: products || [] },
      { new: true, upsert: true }
    ).populate("products");

    return res.status(200).json({
      success: true,
      message: `${title} section updated successfully`,
      section
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};