import mongoose from "mongoose";

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true
  },
  slug: {
    type: String,
    index: true
  },
  descrip: {
    type: String
  },
  author: {
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
  excerpt: {
    type: String
  },
  images: [String],
  tag: {
    type: String
  },
  pros: [String],
  cons: [String],
  links: [
    {
      label: String,
      url: String
    }
  ],
  keyPoints: [String]
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });

const Blog = mongoose.model("Blog", blogSchema);

export default Blog;
