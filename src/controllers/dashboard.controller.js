import Watch from "../models/product.model.js";
import Blog from "../models/blog.model.js";
import TopList from "../models/topList.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const getDashboardStats = asyncHandler(async (req, res) => {
  const totalProducts = await Watch.countDocuments();
  const totalBlogs = await Blog.countDocuments();
  const totalTopLists = await TopList.countDocuments();
  
  const totalAnalog = await Watch.countDocuments({
    display_type: { $regex: /analog/i }
  });
  
  const totalDigital = await Watch.countDocuments({
    display_type: { $regex: /digital|amoled/i }
  });

  // 1. Gender stats
  const dbGenderStats = await Watch.aggregate([
    { $group: { _id: "$gender", count: { $sum: 1 } } }
  ]);
  const gender = {
    Unisex: 0,
    Men: 0,
    Women: 0
  };
  dbGenderStats.forEach(item => {
    if (item._id && gender.hasOwnProperty(item._id)) {
      gender[item._id] = item.count;
    }
  });

  // 2. Brand stats
  const brands = await Watch.aggregate([
    { $group: { _id: "$brand", count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]).then(results => results.map(b => ({ brand: b._id || "Unknown", count: b.count })));

  // 3. Price range stats
  const dbPriceStats = await Watch.aggregate([
    {
      $bucket: {
        groupBy: "$price",
        boundaries: [0, 1000, 2000, 3000, 5000, 7000, 10000, 15000, 20000],
        default: "Above 20000",
        output: {
          count: { $sum: 1 }
        }
      }
    }
  ]);

  const priceRanges = {
    "Below 1000": 0,
    "1000-2000": 0,
    "2000-3000": 0,
    "3000-5000": 0,
    "5000-7000": 0,
    "7000-10000": 0,
    "10000-15000": 0,
    "15000-20000": 0,
    "Above 20000": 0
  };

  const boundaryMap = {
    0: "Below 1000",
    1000: "1000-2000",
    2000: "2000-3000",
    3000: "3000-5000",
    5000: "5000-7000",
    7000: "7000-10000",
    10000: "10000-15000",
    15000: "15000-20000",
    "Above 20000": "Above 20000"
  };

  dbPriceStats.forEach(item => {
    const label = boundaryMap[item._id];
    if (label) {
      priceRanges[label] = item.count;
    }
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalProducts,
        totalAnalog,
        totalDigital,
        totalBlogs,
        totalTopLists,
        gender,
        brands,
        priceRanges
      },
      "Dashboard statistics fetched successfully"
    )
  );
});
