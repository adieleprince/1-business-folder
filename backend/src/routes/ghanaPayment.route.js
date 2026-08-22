import express from "express";
import Order from "../models/order.model.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { resolveOrderItems } from "../utils/orderPricing.js";
import { orderConfirmationEmail } from "../email-templates/index.js";
import { sendOrderEmail } from "../config/email.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =========================================
// MULTER CONFIGURATION FOR RECEIPT UPLOADS
// =========================================

const ALLOWED_EXTENSIONS = /\.(jpe?g|png|webp|gif|pdf)$/i;
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf"
];

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "..", "..", "uploads"));
  },
  filename: function (req, file, cb) {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname).toLowerCase();
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const extOk = ALLOWED_EXTENSIONS.test(file.originalname);
  const mimeOk = ALLOWED_MIME_TYPES.includes(file.mimetype);

  if (extOk && mimeOk) {
    return cb(null, true);
  }
  cb(new Error("Invalid file type. Please upload a JPG, PNG, WEBP, GIF, or PDF receipt."));
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB — matches product image uploads
  fileFilter
});

const router = express.Router();

function makeGhanaOrderId() {
  return `rdfg_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

router.post("/", upload.single("receipt"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload your payment receipt."
      });
    }

    const { customerName, phone, address } = req.body;
    const customerEmail = req.body.email;

    if (!customerName || !phone || !customerEmail || !address) {
      return res.status(400).json({
        success: false,
        message: "Full name, phone, email, and address are required."
      });
    }

    let items;
    try {
      items = JSON.parse(req.body.items || "[]");
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        message: "Could not read your cart items. Please refresh the page and try again."
      });
    }

    const pricing = await resolveOrderItems(items, "GHS");
    if (!pricing.ok) {
      return res.status(400).json({ success: false, message: pricing.message });
    }

    const order = await Order.create({
      orderId: makeGhanaOrderId(),
      customerName,
      phone,
      email: customerEmail,
      address,
      amount: pricing.amount,
      currency: "GHS",
      paymentMethod: "Ghana Mobile Money",
      receipt: req.file.filename,
      receiptOriginalName: req.file.originalname,
      items: pricing.items,
      status: "Pending Verification"
    });

    // Send order confirmation to customer + admin
    try {
      const emailContent = orderConfirmationEmail(order);
      await sendOrderEmail({
        to: order.email,
        subject: emailContent.subject,
        html: emailContent.html,
        adminSubject: `[GHANA ORDER] ${emailContent.subject}`
      });
    } catch (emailError) {
      console.error("GHANA ORDER EMAIL ERROR:", emailError);
      // Don't fail the order if email fails
    }

    return res.status(200).json({
      success: true,
      message: "Receipt uploaded successfully.",
      order
    });
  } catch (error) {
    console.error("GHANA PAYMENT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Could not process your payment. Please try again."
    });
  }
});

export default router;