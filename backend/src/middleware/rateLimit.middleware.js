import rateLimit from "express-rate-limit";

function makeLimiter({ windowMs, max, message }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message },
    handler: (req, res, next, options) => {
      res.status(options.statusCode).json(options.message);
    }
  });
}

// Login/register — brute-force and mass-account-creation protection.
// Generous enough that a real person mistyping their password a few
// times is never blocked.
export const loginLimiter = makeLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: "Too many attempts. Please wait a few minutes and try again."
});

// Order-creation endpoints (Paystack initialize, Ghana receipt upload) —
// prevents a script from flooding the store with fake orders.
export const orderCreationLimiter = makeLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  message: "Too many requests. Please try again in a little while."
});

// Newsletter subscribe — light abuse prevention.
export const newsletterLimiter = makeLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: "Too many requests. Please try again in a little while."
});