import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";

// Initialize S3 client for Cloudflare R2
let s3Client = null;

const r2Endpoint = process.env.R2_ENDPOINT;
const r2AccessKey = process.env.R2_ACCESS_KEY_ID;
const r2SecretKey = process.env.R2_SECRET_ACCESS_KEY;
const r2BucketName = process.env.R2_BUCKET_NAME;
const r2PublicUrl = process.env.R2_PUBLIC_URL;

if (r2Endpoint && r2AccessKey && r2SecretKey && r2BucketName) {
    s3Client = new S3Client({
        region: "auto",
        endpoint: r2Endpoint,
        credentials: {
            accessKeyId: r2AccessKey,
            secretAccessKey: r2SecretKey,
        },
    });
    console.log("⚡️ Cloudflare R2 connection initialized successfully.");
} else {
    console.log("⚠️ Cloudflare R2 credentials missing. Image uploads will fall back to local storage.");
}

/**
 * Uploads a file to Cloudflare R2 if credentials are set,
 * otherwise falls back to local storage inside public/uploads.
 * 
 * @param {Object} file - The file object from multer
 * @returns {Promise<string>} The public URL of the uploaded image
 */
export const uploadToStorage = async (file, folder = "watches") => {
    if (!file) return null;

    const fileExtension = path.extname(file.originalname);
    const sanitizedFolder = folder.replace(/\/$/, "");
    const key = `${sanitizedFolder}/${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExtension}`;

    // 1. If R2 client is configured, upload to Cloudflare R2
    if (s3Client && r2BucketName) {
        try {
            const fileStream = fs.createReadStream(file.path);
            const command = new PutObjectCommand({
                Bucket: r2BucketName,
                Key: key,
                Body: fileStream,
                ContentType: file.mimetype,
            });

            await s3Client.send(command);

            // Clean up temp file
            fs.unlink(file.path, () => {});

            // Return R2 public URL
            const publicUrl = r2PublicUrl ? r2PublicUrl.replace(/\/$/, "") : r2Endpoint;
            return `${publicUrl}/${key}`;
        } catch (error) {
            console.error("R2 Upload failed, falling back to local storage:", error.message);
        }
    }

    // 2. Fallback to Local Storage
    const permanentUploadDir = `./public/uploads/${sanitizedFolder}`;
    if (!fs.existsSync(permanentUploadDir)) {
        fs.mkdirSync(permanentUploadDir, { recursive: true });
    }

    const localFileName = path.basename(file.path);
    const localDestPath = path.join(permanentUploadDir, localFileName);

    return new Promise((resolve, reject) => {
        fs.rename(file.path, localDestPath, (err) => {
            if (err) {
                // If rename fails, try copying
                fs.copyFile(file.path, localDestPath, (copyErr) => {
                    if (copyErr) {
                        return reject(copyErr);
                    }
                    fs.unlink(file.path, () => {});
                    resolve(`http://localhost:8000/uploads/${sanitizedFolder}/${localFileName}`);
                });
            } else {
                resolve(`http://localhost:8000/uploads/${sanitizedFolder}/${localFileName}`);
            }
        });
    });
};

export const uploadUrlToStorage = async (imageUrl, folder = "watches") => {
    if (!imageUrl) return null;

    try {
        const response = await fetch(imageUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch image from URL: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const contentType = response.headers.get("content-type") || "image/jpeg";
        let extension = ".jpg";
        if (contentType.includes("png")) extension = ".png";
        else if (contentType.includes("webp")) extension = ".webp";
        else if (contentType.includes("gif")) extension = ".gif";

        const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
        const sanitizedFolder = folder.replace(/\/$/, "");
        const key = `${sanitizedFolder}/${filename}`;

        // 1. Upload to Cloudflare R2
        if (s3Client && r2BucketName) {
            const command = new PutObjectCommand({
                Bucket: r2BucketName,
                Key: key,
                Body: buffer,
                ContentType: contentType,
            });

            await s3Client.send(command);

            const publicUrl = r2PublicUrl ? r2PublicUrl.replace(/\/$/, "") : r2Endpoint;
            return `${publicUrl}/${key}`;
        }

        // 2. Fallback to Local Storage
        const permanentUploadDir = `./public/uploads/${sanitizedFolder}`;
        if (!fs.existsSync(permanentUploadDir)) {
            fs.mkdirSync(permanentUploadDir, { recursive: true });
        }

        const localDestPath = path.join(permanentUploadDir, filename);
        await fs.promises.writeFile(localDestPath, buffer);
        return `http://localhost:8000/uploads/${sanitizedFolder}/${filename}`;

    } catch (error) {
        console.error("Failed to upload external image URL to storage:", error.message);
        throw error;
    }
};

export const deleteFromStorage = async (imageUrl) => {
    if (!imageUrl) return;

    // 1. If it's a local storage URL
    if (imageUrl.includes("/uploads/")) {
        try {
            const relativePath = imageUrl.split("/uploads/")[1];
            if (relativePath) {
                const localPath = path.join("./public/uploads", relativePath);
                if (fs.existsSync(localPath)) {
                    fs.unlinkSync(localPath);
                    console.log(`🗑️ Deleted local image: ${localPath}`);
                }
            }
        } catch (error) {
            console.error("Failed to delete local image:", error.message);
        }
        return;
    }

    // 2. Cloudflare R2
    if (s3Client && r2BucketName) {
        try {
            const urlObj = new URL(imageUrl);
            const key = decodeURIComponent(urlObj.pathname.replace(/^\//, ""));
            
            const command = new DeleteObjectCommand({
                Bucket: r2BucketName,
                Key: key
            });

            await s3Client.send(command);
            console.log(`🗑️ Deleted R2 image: ${key}`);
        } catch (error) {
            console.error("Failed to delete image from R2:", error.message);
        }
    }
};
