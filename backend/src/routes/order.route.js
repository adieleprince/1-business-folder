import express from "express";
import Order from "../models/order.model.js";
import { sendOrderEmail } from "../config/email.js";
import { resolveOrderItems } from "../utils/orderPricing.js";
import { authenticate, requireAdmin } from "../middleware/auth.middleware.js";
import {
  orderConfirmationEmail,
  paymentVerifiedEmail,
  orderDeliveredEmail,
  orderCompletedEmail,
  orderCancelledEmail
} from "../email-templates/index.js";

const router = express.Router();

const MANUAL_ORDER_STATUSES = ["Pending Verification", "Paid", "Completed", "Cancelled"];

function makeManualOrderId() {
  return `rdfm_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

// =========================================
// GET ALL ORDERS — admin only (contains customer PII)
// =========================================

router.get("/", authenticate, requireAdmin, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.status(200).json({
      message: "Orders retrieved successfully",
      count: orders.length,
      orders: orders
    });
  } catch (error) {
    console.error("GET ORDERS ERROR:", error);
    res.status(500).json({
      message: "Failed to retrieve orders",
      error: error.message
    });
  }
});

// =========================================
// CREATE ORDER (manual/admin-only — not used by the Paystack or Ghana
// checkout flows, which create their own orders directly through their
// own public routes. Hardened the same way: items are priced from our
// own product/bundle catalog, never trusted from the client.)
// =========================================

router.post("/", authenticate, requireAdmin, async (req, res) => {
  try {
    const { customerName, phone, email, address, currency, items, paymentMethod, status } = req.body;

    if (!customerName || !phone || !email || !address) {
      return res.status(400).json({
        message: "customerName, phone, email, and address are required."
      });
    }

    const pricing = await resolveOrderItems(items, currency);
    if (!pricing.ok) {
      return res.status(400).json({ message: pricing.message });
    }

    const safeStatus = MANUAL_ORDER_STATUSES.includes(status) ? status : "Pending Verification";

    const order = await Order.create({
      orderId: makeManualOrderId(),
      customerName,
      phone,
      email,
      address,
      items: pricing.items,
      amount: pricing.amount,
      currency: pricing.currency,
      paymentMethod: paymentMethod || "Manual",
      status: safeStatus
    });

    console.log("NEW ORDER SAVED TO DATABASE:", order._id);

    // Send order confirmation to customer + admin
    try {
      const emailContent = orderConfirmationEmail(order);
      await sendOrderEmail({
        to: order.email,
        subject: emailContent.subject,
        html: emailContent.html,
        adminSubject: `[NEW ORDER] ${emailContent.subject}`
      });
    } catch (emailError) {
      console.error("ORDER CONFIRMATION EMAIL ERROR:", emailError);
      // Don't fail the order if email fails
    }

    res.status(201).json({
      message: "Order received and saved successfully",
      order: order
    });
  } catch (error) {
    console.error("ORDER SAVE ERROR:", error);
    res.status(500).json({
      message: "Failed to save order",
      error: error.message
    });
  }
});

// =========================================
// UPDATE ORDER STATUS — admin only
// =========================================

router.patch("/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Send appropriate email based on status change
    let emailTemplate = null;
    let statusLabel = '';

    switch (status) {
      case "Verified":
      case "Paid":
        emailTemplate = paymentVerifiedEmail;
        statusLabel = 'PAYMENT VERIFIED';
        break;

      case "Delivered":
        emailTemplate = orderDeliveredEmail;
        statusLabel = 'ORDER DELIVERED';
        break;

      case "Completed":
        emailTemplate = orderCompletedEmail;
        statusLabel = 'ORDER COMPLETED';
        break;

      case "Cancelled":
        emailTemplate = orderCancelledEmail;
        statusLabel = 'ORDER CANCELLED';
        break;
    }

    if (emailTemplate) {
      try {
        const email = emailTemplate(updatedOrder);
        await sendOrderEmail({
          to: updatedOrder.email,
          subject: email.subject,
          html: email.html,
          adminSubject: `[${statusLabel}] ${email.subject}`
        });
      } catch (emailError) {
        console.error("STATUS UPDATE EMAIL ERROR:", emailError);
        // Don't fail the status update if email fails
      }
    }

    res.status(200).json({
      message: "Order status updated successfully",
      order: updatedOrder
    });
  } catch (error) {
    console.error("UPDATE ORDER ERROR:", error);
    res.status(500).json({
      message: "Failed to update order status",
      error: error.message
    });
  }
});

// =========================================
// DELETE ORDER — admin only
// =========================================

router.delete("/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("DELETE ORDER ERROR:", error);
    res.status(500).json({
      message: "Failed to delete order",
      error: error.message
    });
  }
});

// =========================================
// DELETE ALL ORDERS — admin only
// =========================================

router.delete("/", authenticate, requireAdmin, async (req, res) => {
  try {
    await Order.deleteMany({});
    res.status(200).json({ message: "All orders deleted successfully" });
  } catch (error) {
    console.error("DELETE ALL ORDERS ERROR:", error);
    res.status(500).json({
      message: "Failed to delete all orders",
      error: error.message
    });
  }
});

export default router;