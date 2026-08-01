import express from "express";

const router = express.Router();

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_CALLBACK_URL =
  process.env.PAYSTACK_CALLBACK_URL || "http://localhost:5500/checkout.html";

function makeReference() {
  return `rdf_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

router.post("/initialize", async (req, res) => {
  try {
    const { email, amount, currency = "NGN" } = req.body;

    if (!PAYSTACK_SECRET_KEY) {
      return res.status(500).json({
        success: false,
        message: "Missing PAYSTACK_SECRET_KEY in .env"
      });
    }

    if (!email || !amount) {
      return res.status(400).json({
        success: false,
        message: "Email and amount are required"
      });
    }

    const normalizedCurrency = currency === "GHS" ? "GHS" : "NGN";
    const amountInSubunit = Math.round(Number(amount) * 100);

    const reference = makeReference();

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        amount: amountInSubunit,
        currency: normalizedCurrency,
        reference,
        callback_url: PAYSTACK_CALLBACK_URL
      })
    });

    const data = await response.json();

    if (!response.ok || !data.status) {
      return res.status(400).json({
        success: false,
        message: data.message || "Failed to initialize payment"
      });
    }

    return res.status(200).json({
      success: true,
      authorization_url: data.data.authorization_url,
      access_code: data.data.access_code,
      reference: data.data.reference
    });
  } catch (error) {
    console.error("PAYSTACK INITIALIZE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Could not initialize payment"
    });
  }
});

router.get("/verify/:reference", async (req, res) => {
  try {
    if (!PAYSTACK_SECRET_KEY) {
      return res.status(500).json({
        success: false,
        message: "Missing PAYSTACK_SECRET_KEY in .env"
      });
    }

    const { reference } = req.params;

    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
        }
      }
    );

    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error) {
    console.error("PAYSTACK VERIFY ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Could not verify payment"
    });
  }
});

export default router;