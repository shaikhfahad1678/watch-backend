import Watch from "../models/product.model.js";
import Brand from "../models/brand.model.js";
import { User } from "../models/user.model.js";
import ProductSection from "../models/product.section.js";
import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const getAllProducts = asyncHandler(async (req, res) => {
    const { category, limit } = req.query;
    const query = {};

    if (category) {
        const catLower = category.toLowerCase();
        if (catLower === "female" || catLower === "women") {
            query.$or = [
                { category: { $regex: /female|women/i } },
                { gender: "Women" }
            ];
        } else if (catLower === "luxury" || catLower === "luxary") {
            query.$or = [
                { category: { $regex: /luxury|luxary/i } },
                { description: { $regex: /luxury|luxary/i } },
                { brand: { $regex: /rolex|seiko/i } },
                { price: { $gte: 5000 } }
            ];
        } else if (catLower === "smart watch" || catLower === "smartwatch") {
            query.$or = [
                { category: { $regex: /smart/i } },
                { description: { $regex: /smart/i } }
            ];
        } else {
            query.category = { $regex: new RegExp(category, "i") };
        }
    }

    let findQuery = Watch.find(query).select("-keywords");

    if (limit) {
        findQuery = findQuery.limit(parseInt(limit));
    }

    const products = await findQuery;

    return res.status(200).json(
        new ApiResponse(
            200,
            products,
            "Products fetched successfully"
        )
    );
});

const getProductById = asyncHandler(async (req, res) => {

    const { id } = req.params;

    const product = await Watch.findById(id);

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    return res.status(200).json(
        new ApiResponse(200, product, "Product fetched successfully")
    );

});

const getAllBrands = asyncHandler(async (req, res) => {

    const brands = await Brand.find();

    return res.status(200).json(
        new ApiResponse(
            200,
            brands,
            "Brands fetched successfully"
        )
    );

});

const getProductsByBrand = asyncHandler(async (req, res) => {

    const { brandId } = req.params;
    const brandObj = await Brand.findById(brandId);
    if (!brandObj) {
        throw new ApiError(404, "Brand not found");
    }

    const products = await Watch.find({ brand: brandObj.brand_name });

    return res.status(200).json(
        new ApiResponse(200, products, "Products fetched by brand")
    );

});

const increaseView = asyncHandler(async (req, res) => {

    const { id } = req.params;

    await Watch.findByIdAndUpdate(id, {
        $inc: { views: 1 }
    });

    return res.status(200).json(
        new ApiResponse(200, {}, "View updated")
    );

});



// Helper function to calculate Levenshtein distance between two words
function getEditDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1  // deletion
          )
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

const searchProducts = asyncHandler(async (req, res) => {
    const { q } = req.query;

    if (!q || !q.trim()) {
        const products = await Watch.find().select("-keywords");
        return res.status(200).json(new ApiResponse(200, products, "Search results"));
    }

    const allProducts = await Watch.find();
    const queryTokens = q.toLowerCase().split(/\s+/).filter(Boolean);

    const matches = allProducts.filter((product) => {
        const searchableText = [
            product.brand || "",
            product.model_name || "",
            product.description || "",
            product.category || "",
            product.gender || "",
            ...(product.keywords || [])
        ].join(" ").toLowerCase();

        const words = searchableText.split(/[^a-zA-Z0-9]+/).filter(Boolean);

        // Every token in query must fuzzy match at least one word in the product text
        return queryTokens.every((token) => {
            return words.some((word) => {
                if (word.includes(token) || token.includes(word)) return true;
                const distance = getEditDistance(token, word);
                const maxDistance = token.length > 4 ? 2 : 1;
                return distance <= maxDistance;
            });
        });
    });

    return res.status(200).json(
        new ApiResponse(200, matches, "Search results")
    );
});

const getSectionProducts = asyncHandler(async (req, res) => {

  const { title } = req.params;

  const section = await ProductSection.findOne({ title })
    .populate({
      path: "products",
      select: "-keywords"
    });

  return res.status(200).json(
    new ApiResponse(200, section, "Section fetched")
  );

});

export {
    getAllProducts,
    getAllBrands,
    getProductById,
    getProductsByBrand,
    increaseView,
    searchProducts,
    getSectionProducts
};