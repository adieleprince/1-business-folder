import express from "express";
import mongoose from "mongoose";
import Product from "../models/product.model.js";
import multer from "multer";
import path from "path";
import { authenticate, requireAdmin } from "../middleware/auth.middleware.js";
import { notifySubscribers } from "../utils/subscriberMailer.js";
import { uploadBufferToCloudinary, deleteFromCloudinary, cloudinaryConfigured } from "../config/cloudinary.js";

const router = express.Router();

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// =========================================
// MULTER CONFIGURATION FOR IMAGE UPLOADS
// Files are held in memory only, then streamed to Cloudinary.
// Render wipes local disk on every redeploy/restart, so disk storage
// is not safe for production.
// =========================================

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

// =========================================
// GET ALL ACTIVE PRODUCTS
// =========================================

router.get("/", async (req, res) => {
  try {
    const products = await Product.find({ active: true }).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.error("GET PRODUCTS ERROR:", err);
    res.status(500).json({ message: "Could not load products right now. Please try again shortly." });
  }
});

// =========================================
// GET ALL PRODUCTS (INCLUDING INACTIVE) — admin only
// =========================================

router.get("/all", authenticate, requireAdmin, async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.error("GET ALL PRODUCTS ERROR:", err);
    res.status(500).json({ message: "Could not load products right now. Please try again shortly." });
  }
});

// =========================================
// GET SINGLE PRODUCT — admin only (used by the dashboard edit form)
// =========================================

router.get("/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid product ID." });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (err) {
    console.error("GET PRODUCT ERROR:", err);
    res.status(500).json({ message: "Could not load this product. Please try again." });
  }
});

// =========================================
// CREATE PRODUCT (with image upload) — admin only
// =========================================

router.post("/", authenticate, requireAdmin, upload.single("image"), async (req, res) => {
  try {
    let productData;
    try {
      productData = JSON.parse(req.body.data);
    } catch (parseError) {
      return res.status(400).json({ message: "Invalid product data submitted." });
    }

        // If image was uploaded, push it to Cloudinary and store the hosted URL
    if (req.file) {
      if (!cloudinaryConfigured) {
        return res.status(500).json({ message: "Image uploads are not configured on the server. Please contact the site admin." });
      }
      try {
        const result = await uploadBufferToCloudinary(req.file.buffer, {
          folder: "royal-dynasty/products",
          resourceType: "image"
        });
        productData.image = result.secure_url;
        productData.imagePublicId = result.public_id;
      } catch (uploadError) {
        console.error("PRODUCT IMAGE UPLOAD ERROR:", uploadError);
        return res.status(500).json({ message: "Could not upload the product image. Please try again." });
      }
    }

    const product = await Product.create(productData);

    // Respond immediately — the product save is authoritative and must
    // never wait on (or fail because of) subscriber emails.
    res.status(201).json(product);

    if (product.active) {
      notifySubscribers(product, "new").catch((err) =>
        console.error("NEW PRODUCT NOTIFICATION ERROR:", err)
      );
    }
  } catch (err) {
    console.error("CREATE PRODUCT ERROR:", err);
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: "Please check the product details and try again." });
    }
    res.status(500).json({ message: "Could not save the product. Please try again." });
  }
});

// =========================================
// UPDATE PRODUCT (with image upload) — admin only
// =========================================

router.put("/:id", authenticate, requireAdmin, upload.single("image"), async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid product ID." });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    const previousStock = product.stock;

    let updateData;
    try {
      updateData = JSON.parse(req.body.data);
    } catch (parseError) {
      return res.status(400).json({ message: "Invalid product data submitted." });
    }

        // If new image was uploaded, push it to Cloudinary and swap the image field
    let oldImagePublicId = null;
    if (req.file) {
      if (!cloudinaryConfigured) {
        return res.status(500).json({ message: "Image uploads are not configured on the server. Please contact the site admin." });
      }
      try {
        const result = await uploadBufferToCloudinary(req.file.buffer, {
          folder: "royal-dynasty/products",
          resourceType: "image"
        });
        updateData.image = result.secure_url;
        updateData.imagePublicId = result.public_id;
        oldImagePublicId = product.imagePublicId;
      } catch (uploadError) {
        console.error("PRODUCT IMAGE UPLOAD ERROR:", uploadError);
        return res.status(500).json({ message: "Could not upload the product image. Please try again." });
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json(updatedProduct);

    // Clean up the replaced image in Cloudinary — best-effort, never blocks the response
    if (oldImagePublicId) {
      deleteFromCloudinary(oldImagePublicId, "image");
    }

    // Only a genuine "was out of stock, now isn't" transition counts as a
    // restock — this is triggered by the actual update request itself,
    // never by the dashboard simply reloading/re-fetching products.
    if (previousStock === 0 && updatedProduct.stock > 0 && updatedProduct.active) {
      notifySubscribers(updatedProduct, "restock").catch((err) =>
        console.error("RESTOCK NOTIFICATION ERROR:", err)
      );
    }
  } catch (err) {
    console.error("UPDATE PRODUCT ERROR:", err);
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: "Please check the product details and try again." });
    }
    res.status(500).json({ message: "Could not update the product. Please try again." });
  }
});

// =========================================
// DELETE PRODUCT — admin only
// =========================================

router.delete("/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid product ID." });
    }

        const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json({ message: "Product deleted successfully" });

    // Clean up the image in Cloudinary — best-effort, never blocks the response
    if (product.imagePublicId) {
      deleteFromCloudinary(product.imagePublicId, "image");
    }
  } catch (err) {
    console.error("DELETE PRODUCT ERROR:", err);
    res.status(500).json({ message: "Could not delete the product. Please try again." });
  }
});

// =========================================
// UPDATE PRODUCT STATUS (Active/Hidden) — admin only
// =========================================

router.patch("/:id/status", authenticate, requireAdmin, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid product ID." });
    }

    const { active } = req.body;
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { active },
      { new: true, runValidators: true }
    );
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (err) {
    console.error("UPDATE STATUS ERROR:", err);
    res.status(500).json({ message: "Could not update product status. Please try again." });
  }
});

// =========================================
// UPDATE PRODUCT STOCK — admin only
// =========================================

router.patch("/:id/stock", authenticate, requireAdmin, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid product ID." });
    }

    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found" });
    }
    const previousStock = existingProduct.stock;

    const { stock } = req.body;
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { stock },
      { new: true, runValidators: true }
    );
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);

    if (previousStock === 0 && product.stock > 0 && product.active) {
      notifySubscribers(product, "restock").catch((err) =>
        console.error("RESTOCK NOTIFICATION ERROR:", err)
      );
    }
  } catch (err) {
    console.error("UPDATE STOCK ERROR:", err);
    res.status(500).json({ message: "Could not update product stock. Please try again." });
  }
});

export default router;