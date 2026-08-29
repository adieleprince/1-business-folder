import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from 'url';
import multer from 'multer';
import orderRouter from "./routes/order.route.js";
import adminRouter from "./routes/admin.route.js";
import testEmailRouter from "./routes/test-email.route.js";
import paymentRouter from "./routes/payment.route.js";
import ghanaPaymentRouter from "./routes/ghanaPayment.route.js";
import productRouter from "./routes/product.route.js";
import userRouter from "./routes/user.route.js";
import newsletterRouter from "./routes/newsletter.route.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ============================================================
// TRUST PROXY (Render)
// ============================================================
// Render puts every web service behind a single reverse proxy/load
// balancer, which sets X-Forwarded-For with the real client IP. Express
// (and req.ip / express-rate-limit, which key off it) ignore that header
// by default, so without this, express-rate-limit v8 throws
// ERR_ERL_UNEXPECTED_X_FORWARDED_FOR as soon as it sees an XFF header it
// isn't configured to trust. Trusting exactly 1 hop tells Express to use
// the first (client) IP in X-Forwarded-For while still not trusting
// anything a client could spoof beyond that one hop. This must be set
// before any express-rate-limit middleware runs (all rate limiters are
// mounted on routers required below), so it stays at the very top.
app.set('trust proxy', 1);

// ============================================================
// CORS
// ============================================================
// Set ALLOWED_ORIGINS in .env to a comma-separated list of the exact
// frontend origin(s) allowed to call this API in production, e.g.
// ALLOWED_ORIGINS=https://royaldynastyfragrance.com
// If it's not set, requests from any origin are accepted (so local
// development keeps working with zero setup), but a warning is logged
// so this isn't missed when deploying.
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
  : null;

if (!allowedOrigins) {
  console.warn("⚠️  ALLOWED_ORIGINS is not set in .env — accepting requests from any origin. Set it before deploying to production.");
}

const corsOptions = {
  origin: function (origin, callback) {
    // Requests with no Origin header (curl, Postman, server-to-server) are
    // allowed through; the routes themselves are protected separately
    // where it matters.
    if (!origin) return callback(null, true);
    if (!allowedOrigins || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
  }
};

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/payments", paymentRouter);
app.use("/api/v1/test-email", testEmailRouter);
app.use("/api/v1/ghana-payment", ghanaPaymentRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/newsletter", newsletterRouter);

app.get("/", (req, res) => {
  res.send("Royal Dynasty Fragrance backend is running!");
});

// Error handling middleware for multer errors
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  if (err.message && err.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  next(err);
});

// A rejected CORS origin lands here (thrown from the corsOptions.origin
// function above).
app.use((err, req, res, next) => {
  if (err.message && err.message.includes('not allowed by CORS')) {
    return res.status(403).json({
      success: false,
      message: 'This origin is not permitted to access this API.'
    });
  }
  next(err);
});

// Malformed JSON request bodies (e.g. a broken client request) land here —
// express.json() throws this before any route handler ever runs.
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed' || err instanceof SyntaxError) {
    return res.status(400).json({
      success: false,
      message: 'The request could not be read. Please check your input and try again.'
    });
  }
  next(err);
});

// Final safety net. Every route already handles its own errors, but if
// anything unexpected ever reaches here, never let a raw error (which can
// include stack traces or internal details) reach the client.
app.use((err, req, res, next) => {
  console.error("UNHANDLED ERROR:", err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).json({
    success: false,
    message: 'Something went wrong on our end. Please try again.'
  });
});

export default app;