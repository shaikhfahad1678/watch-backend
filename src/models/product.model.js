import mongoose from "mongoose";

const productSchema = new mongoose.Schema({

  brand: {
    type:String,
    index: true,
  },

  gender: {
    type: String,
    enum: ["Unisex", "Men", "Women"],
    default: "Unisex",
    set: (v) => {
      if (!v || v === "") return "Unisex";
      const clean = String(v).trim();
      if (/^men$/i.test(clean) || /^male$/i.test(clean) || /^man$/i.test(clean)) return "Men";
      if (/^women$/i.test(clean) || /^female$/i.test(clean) || /^woman$/i.test(clean)) return "Women";
      if (/^unisex$/i.test(clean)) return "Unisex";
      return "Unisex";
    }
  },

  model_name: {
    type: String,
    trim: true
  },

  description: {
    type: String
  },

  speciality: {
    type: String
  },

  views: {
    type: Number,
    default: 0
  },

  price: {
    type: Number,
    index: true,
  },

  dial_size_cm: {
    type: Number
  },

  dial_shape: {
    type: String
  },

  case_material: {
    type: String
  },

  strap_material: {
    type: String
  },

  movement_type: {
    type: String
  },

  water_resistance_m: {
    type: String
  },

  glass_type: {
    type: String
  },

  display_type: {
    type: String
  },

  screen_size_in: {
    type: String
  },

  battery_life_days: {
    type: String
  },
  
  bluetooth_calling: {
    type: String,
    enum: ["Yes", "No"],
    default: "No",
    set: (v) => {
      if (!v || v === "" || v === "N/A" || v === "None" || v === "No" || v === "false" || v === false) return "No";
      if (v === "Yes" || v === "true" || v === true || String(v).toLowerCase().includes("yes") || String(v).toLowerCase().includes("support")) return "Yes";
      return "No";
    }
  },

  color: {
    type: String
  },

  weight_g: {
    type: Number
  },

  release_year: {
    type: Number
  },


  custom_links: [
    {
      label: String,
      url: String
    }
  ],

  videos: [String],
  shorts: [String],

  images: [
    {
      url: String,
      is_main: {
        type: Boolean,
        default: false
      }
    }
  ],

  category: {
    type: String,
    index: true
  },

  rating: {
    type: Number,
    default: 0
  },

  num_reviews: {
    type: Number,
    default: 0
  },

  keywords: [String],

  sensors: [String],

  thickness_mm: {
    type: Number
  }

}, { timestamps: { createdAt: "created_at", updatedAt: false } });

const Watch = mongoose.model("Product", productSchema);

export default Watch;