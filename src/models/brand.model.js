import mongoose from "mongoose";

const brandSchema = new mongoose.Schema({

  brand_name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },

   description: {
    type: String,
    
  },

  country: {
    type: String,
    trim: true
  },

  founded_year: {
    type: Number
  }

}, { timestamps: true });

const Brand = mongoose.model("Brand", brandSchema);

export default Brand;