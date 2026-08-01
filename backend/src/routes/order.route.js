import express from "express";
import Order from "../models/order.model.js";
import { sendOrderEmail } from "../config/email.js";
import {
  orderConfirmationEmail,
  paymentVerifiedEmail,
  orderDeliveredEmail,
  orderCompletedEmail,
  orderCancelledEmail
} from "../email-templates/index.js";

const router = express.Router();

// =========================================
// GET ALL ORDERS
// =========================================

router.get("/", async (req, res) => {
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
// CREATE ORDER
// =========================================

router.post("/", async (req, res) => {
  try {
    const order = await Order.create(req.body);
    
    console.log("NEW ORDER SAVED TO DATABASE:", order);

    // Send order confirmation to customer + admin
    try {
      const email = orderConfirmationEmail(order);
      await sendOrderEmail({
        to: order.email,
        subject: email.subject,
        html: email.html,
        adminSubject: `[NEW ORDER] ${email.subject}`
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
// UPDATE ORDER STATUS
// =========================================

router.patch("/:id", async (req, res) => {
  try {
    const { status } = req.body;
    
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { returnDocument: 'after' }
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
// DELETE ORDER
// =========================================

router.delete("/:id", async (req, res) => {
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
// DELETE ALL ORDERS
// =========================================

router.delete("/", async (req, res) => {
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