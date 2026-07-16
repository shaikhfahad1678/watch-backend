import express from "express"
import cookieParser from "cookie-parser";
import cors from "cors"
import compression from "compression"


export const app = express();

app.use(compression());

// origin: process.env.CORS_ORIGIN
// This means:
// Only allow requests coming from the origin stored in .env
// Example :
// CORS_ORIGIN=http://localhost:5173 | * it is not allowed when credentials: true
// So only this frontend can access your backend.

// credentials: true (VERY IMPORTANT)
// This allows:
// Cookies
// Sessions
// Authorization headers
// Without this:
// ❌ Cookies won’t be sent
// ❌ Login breaks

app.use(
  cors({
    // origin: [
    //   "http://localhost:5173",
    //   "https://youtube-copy.vercel.app"
    // ],
    origin:true,
    credentials: true
  })
);
// Middleware	               Handles
// express.json()	           Parses JSON request bodies
// express.urlencoded()	       Parses form data


app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({
    extended: true, 
    limit: "16kb"
}))
app.use(express.static("public"))//--“If the browser asks for a file, look inside the public folder and send it.
app.use(cookieParser())//--Reads data from browser

// Dynamic response URL replacement middleware for resolving localhost:8000 dynamically to the request host
function replaceLocalhostWithHost(obj, host) {
  if (!obj) return obj;
  if (typeof obj === "string") {
    if (obj.includes("http://localhost:8000")) {
      return obj.replace(/http:\/\/localhost:8000/g, `http://${host}`);
    }
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => replaceLocalhostWithHost(item, host));
  }
  if (typeof obj === "object") {
    if (obj instanceof Date || obj instanceof RegExp) return obj;
    if (obj.constructor && obj.constructor.name === "ObjectId") return obj;

    if (typeof obj.toJSON === "function") {
      try {
        return replaceLocalhostWithHost(obj.toJSON(), host);
      } catch (e) {}
    }

    const newObj = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        newObj[key] = replaceLocalhostWithHost(obj[key], host);
      }
    }
    return newObj;
  }
  return obj;
}

app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function (body) {
    const host = req.get("host") || "localhost:8000";
    const newBody = replaceLocalhostWithHost(body, host);
    return originalJson.call(this, newBody);
  };
  next();
});

import userRouter from './routes/user.routes.js' //we imported router as userRouter
import productRouter from './routes/product.routes.js'
import adminRouter from './routes/admin.routes.js'
import blogRouter from './routes/blog.routes.js'
import topListRouter from './routes/topList.routes.js'
import dashboardRouter from './routes/dashboard.routes.js'
//routes declaration
app.use("/api/v1/user", userRouter)
app.use("/api/v1/product",productRouter)
app.use("/api/v1/admin", adminRouter)
app.use("/api/v1/blog", blogRouter)
app.use("/api/v1/top-list", topListRouter)
app.use("/api/v1/dashboard", dashboardRouter)

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  return res.status(statusCode).json({
    success: false,
    message,
    errors: err.error || []
  });
});

//routes declaration
 //we dont use app.get because of router
//This will give http://localhost:8000/api/v1/user/register


//middle ware like app.use runs automatically
//  Client Request
//    ↓
// express.json()        ← parses JSON
//    ↓
// express.urlencoded()  ← parses form data
//    ↓
// express.static()      ← serves files
//    ↓
// cookieParser()        ← reads cookies
//    ↓
// Router
//    ↓
// Controller
