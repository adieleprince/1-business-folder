import express from "express";
import Subscriber from "../models/subscriber.model.js";
import { newsletterLimiter } from "../middleware/rateLimit.middleware.js";

const router = express.Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// =========================================
// SUBSCRIBE TO NEWSLETTER
// Public — stores the email in MongoDB. Does not send a welcome
// email; the site's Resend integration is used for order emails
// only. The response is truthful about what actually happened
// (stored, or already on the list) rather than always claiming
// success.
// =========================================

router.post("/subscribe", newsletterLimiter, async (req, res) => {
  try {
    const email = (req.body?.email || "").toString().trim().toLowerCase();

    if (!email || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address."
      });
    }

    const existing = await Subscriber.findOne({ email });
    if (existing) {
      return res.status(200).json({
        success: true,
        alreadySubscribed: true,
        message: "You're already on the list!"
      });
    }

    await Subscriber.create({ email });

    res.status(201).json({
      success: true,
      message: "You're on the list!"
    });
  } catch (error) {
    console.error("NEWSLETTER SUBSCRIBE ERROR:", error);
    if (error.code === 11000) {
      // Duplicate-key race — someone subscribed with this email a moment ago.
      return res.status(200).json({
        success: true,
        alreadySubscribed: true,
        message: "You're already on the list!"
      });
    }
    res.status(500).json({
      success: false,
      message: "Could not subscribe right now. Please try again."
    });
  }
});

export default router;