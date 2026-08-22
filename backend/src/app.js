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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

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

export default app;