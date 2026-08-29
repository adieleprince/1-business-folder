import express from "express";
import Order from "../models/order.model.js";
import multer from "multer";
import { resolveOrderItems } from "../utils/orderPricing.js";
import { orderConfirmationEmail } from "../email-templates/index.js";
import { sendOrderEmail } from "../config/email.js";
import { isValidEmail, sanitizeText } from "../utils/validation.js";
import { orderCreationLimiter } from "../middleware/rateLimit.middleware.js";
import { uploadBufferToCloudinary, deleteFromCloudinary, cloudinaryConfigured } from "../config/cloudinary.js";

// =========================================
// MULTER CONFIGURATION FOR RECEIPT UPLOADS
// Files are held in memory only, then streamed to Cloudinary.
// Render wipes local disk on every redeploy/restart, so disk storage
// is not safe for production.
// =========================================

const ALLOWED_EXTENSIONS = /\.(jpe?g|png|webp|gif|pdf)$/i;
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf"
];

const storage = multer.memoryStorage();

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

router.post("/", orderCreationLimiter, upload.single("receipt"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload your payment receipt."
      });
    }

    const customerName = sanitizeText(req.body.customerName, 150);
    const phone = sanitizeText(req.body.phone, 40);
    const customerEmail = sanitizeText(req.body.email, 200).toLowerCase();
    const address = sanitizeText(req.body.address, 500);

    if (!customerName || !phone || !customerEmail || !address) {
      return res.status(400).json({
        success: false,
        message: "Full name, phone, email, and address are required."
      });
    }

    if (!isValidEmail(customerEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address."
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

    if (!cloudinaryConfigured) {
      return res.status(500).json({
        success: false,
        message: "Receipt uploads are not configured on the server. Please contact support."
      });
    }

    let uploadResult;
    try {
      uploadResult = await uploadBufferToCloudinary(req.file.buffer, {
        folder: "royal-dynasty/receipts",
        resourceType: "auto"
      });
    } catch (uploadError) {
      console.error("RECEIPT UPLOAD ERROR:", uploadError);
      return res.status(500).json({
        success: false,
        message: "Could not upload your receipt. Please try again."
      });
    }

    let order;
    try {
      order = await Order.create({
        orderId: makeGhanaOrderId(),
        customerName,
        phone,
        email: customerEmail,
        address,
        amount: pricing.amount,
        currency: "GHS",
        paymentMethod: "Ghana Mobile Money",
        receipt: uploadResult.secure_url,
        receiptPublicId: uploadResult.public_id,
        receiptOriginalName: req.file.originalname,
        items: pricing.items,
        status: "Pending Verification"
      });
    } catch (createError) {
      // Order failed to save — clean up the orphaned Cloudinary upload
      deleteFromCloudinary(uploadResult.public_id, uploadResult.resource_type);
      throw createError;
    }

    // Send order confirmation to customer + admin. sendOrderEmail() already
    // catches its own errors and never rejects, but it's guarded with a hard
    // timeout as well so a slow/unresponsive SMTP connection can never leave
    // this request (and the frontend's "Submitting..." button) hanging — the
    // order has already been saved above regardless of whether this email
    // step succeeds, times out, or fails outright.
    try {
      const emailContent = orderConfirmationEmail(order);
      const emailTimeout = new Promise((resolve) =>
        setTimeout(() => resolve({ timedOut: true }), 25000)
      );
      const emailResult = await Promise.race([
        sendOrderEmail({
          to: order.email,
          subject: emailContent.subject,
          html: emailContent.html,
          adminSubject: `[GHANA ORDER] ${emailContent.subject}`
        }),
        emailTimeout
      ]);
      if (emailResult && emailResult.timedOut) {
        console.error("GHANA ORDER EMAIL ERROR: timed out sending order confirmation");
      }
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