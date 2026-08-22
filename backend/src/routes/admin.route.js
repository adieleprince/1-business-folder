import express from "express";
import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import { authenticate, requireAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

// Every route in this file is admin-only.
router.use(authenticate, requireAdmin);

// =========================================
// ADMIN DASHBOARD STATISTICS
// =========================================

router.get("/stats", async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingPaymentOrders = await Order.countDocuments({ status: "Pending Payment" });
    const pendingOrders = await Order.countDocuments({ status: "Pending Verification" });
    const paidOrders = await Order.countDocuments({ status: "Paid" });
    const completedOrders = await Order.countDocuments({ status: "Completed" });
    const cancelledOrders = await Order.countDocuments({ status: "Cancelled" });
    const failedOrders = await Order.countDocuments({ status: "Failed" });

    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ active: true });
    const lowStockProducts = await Product.countDocuments({ stock: { $lt: 10, $gt: 0 } });
    const outOfStockProducts = await Product.countDocuments({ stock: 0, active: true });

    res.json({
      success: true,
      data: {
        orders: {
          total: totalOrders,
          pendingPayment: pendingPaymentOrders,
          pending: pendingOrders,
          paid: paidOrders,
          completed: completedOrders,
          cancelled: cancelledOrders,
          failed: failedOrders
        },
        products: {
          total: totalProducts,
          active: activeProducts,
          lowStock: lowStockProducts,
          outOfStock: outOfStockProducts
        }
      }
    });
  } catch (error) {
    console.error("ADMIN STATS ERROR:", error);
    res.status(500).json({ message: "Failed to fetch dashboard statistics" });
  }
});

// =========================================
// GET RECENT ORDERS
// =========================================

router.get("/recent-orders", async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      orders: orders
    });
  } catch (error) {
    console.error("RECENT ORDERS ERROR:", error);
    res.status(500).json({ message: "Failed to fetch recent orders" });
  }
});

export default router;