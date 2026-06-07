import mongoose from "mongoose";

const productSectionSchema = new mongoose.Schema({

  title: {
    type: String,
    required: true
    // Example: "Popular", "Featured", "Trending"
  },

  products: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product"
    }
  ],

  is_active: {
    type: Boolean,
    default: true
  }

}, { timestamps: true });

const ProductSection = mongoose.model("ProductSection", productSectionSchema);

export default ProductSection;