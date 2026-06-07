import mongoose from "mongoose";

const listItemSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true
  },
  description: {
    type: String
  },
  image: {
    type: String
  },
  price: {
    type: String
  },
  link: {
    type: String
  },
  pros: [String],
  cons: [String]
});

const topListSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true
  },
  slug: {
    type: String,
    index: true
  },
  description: {
    type: String
  },
  pros: [String],
  cons: [String],
  topImage: {
    type: String
  },
  date: {
    type: String
  },
  readTime: {
    type: String
  },
  category: {
    type: String
  },
  tag: {
    type: String
  },
  items: [listItemSchema]
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });

const TopList = mongoose.model("TopList", topListSchema);

export default TopList;
