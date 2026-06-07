import "./config/env.js";
import connectDB from "./db/index.js";
import { app } from "./app.js"

connectDB()
    .then(async () => {
        // Run slug generation migrations for existing records
        try {
            const { default: Blog } = await import("./models/blog.model.js");
            const { default: TopList } = await import("./models/topList.model.js");

            const blogs = await Blog.find({ $or: [{ slug: { $exists: false } }, { slug: "" }, { slug: null }] });
            for (const blog of blogs) {
                if (blog.title) {
                    blog.slug = blog.title
                        .toLowerCase()
                        .trim()
                        .replace(/[^a-z0-9]/g, "-")
                        .replace(/-+/g, "-")
                        .replace(/^-|-$/g, "");
                    await blog.save();
                    console.log(`Migrated blog: "${blog.title}" -> ${blog.slug}`);
                }
            }

            const lists = await TopList.find({ $or: [{ slug: { $exists: false } }, { slug: "" }, { slug: null }] });
            for (const list of lists) {
                if (list.title) {
                    list.slug = list.title
                        .toLowerCase()
                        .trim()
                        .replace(/[^a-z0-9]/g, "-")
                        .replace(/-+/g, "-")
                        .replace(/^-|-$/g, "");
                    await list.save();
                    console.log(`Migrated top list: "${list.title}" -> ${list.slug}`);
                }
            }
            console.log("⚡️ Slugs migration check completed successfully.");
        } catch (migErr) {
            console.error("Slug migration error:", migErr);
        }

        app.listen(process.env.PORT || 5000, () => {
            console.log(`server is runninng at port : ${process.env.PORT}`);
        })
    })
    .catch((err) => {
        console.log(`Failed to connect to server: ${process.env.PORT || 5000} `);
        console.log(err)
    })