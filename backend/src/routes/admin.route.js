import express from "express";
import Order from "../models/order.model.js";
import Product from "../models/product.model.js";

const router = express.Router();

// =========================================
// ADMIN DASHBOARD STATISTICS
// =========================================

router.get("/stats", async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: "Pending Verification" });
    const verifiedOrders = await Order.countDocuments({ status: "Verified" });
    const deliveredOrders = await Order.countDocuments({ status: "Delivered" });
    const completedOrders = await Order.countDocuments({ status: "Completed" });
    const cancelledOrders = await Order.countDocuments({ status: "Cancelled" });

    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ active: true });
    const lowStockProducts = await Product.countDocuments({ stock: { $lt: 10, $gt: 0 } });
    const outOfStockProducts = await Product.countDocuments({ stock: 0, active: true });

    res.json({
      success: true,
      data: {
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          verified: verifiedOrders,
          delivered: deliveredOrders,
          completed: completedOrders,
          cancelled: cancelledOrders
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