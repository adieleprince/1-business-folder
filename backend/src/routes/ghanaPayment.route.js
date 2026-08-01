import express from "express";
import Order from "../models/order.model.js";
import multer from "multer";
import path from "path";
import { orderConfirmationEmail } from "../email-templates/index.js";
import { sendOrderEmail } from "../config/email.js";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1E9) +
      path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });
const router = express.Router();

router.post("/", upload.single("receipt"), async (req, res) => {
  try {
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    const items = JSON.parse(req.body.items).map(item => ({
      name: item.name,
      quantity: item.quantity,
      price: item.priceGHS
    }));

    const numericAmount = parseFloat(req.body.amount.replace(/[^\d.]/g, ""));

    const order = await Order.create({
      orderId: req.body.orderId,
      customerName: req.body.customerName,
      phone: req.body.phone,
      email: req.body.email,
      address: req.body.address,
      amount: numericAmount,
      currency: "GHS",
      paymentMethod: "Ghana Mobile Money",
      receipt: req.file.filename,
      receiptOriginalName: req.file.originalname,
      items,
      status: "Pending Verification"
    });

    // Send order confirmation to customer + admin
    try {
      const email = orderConfirmationEmail(order);
      await sendOrderEmail({
        to: order.email,
        subject: email.subject,
        html: email.html,
        adminSubject: `[GHANA ORDER] ${email.subject}`
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
      message: error.message
    });
  }
});

export default router;