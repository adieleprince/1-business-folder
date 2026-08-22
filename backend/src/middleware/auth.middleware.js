import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

// =========================================
// AUTHENTICATE
// Verifies the JWT sent in the Authorization header
// ("Authorization: Bearer <token>") and attaches the
// matching user to req.user. The user is re-fetched from
// the database on every request (not just decoded from the
// token) so a revoked/demoted account loses access
// immediately, without waiting for the token to expire.
// =========================================
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please log in."
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    } catch (verifyError) {
      if (verifyError.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Session expired. Please log in again."
        });
      }
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token."
      });
    }

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists."
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("AUTH MIDDLEWARE ERROR:", error);
    return res.status(401).json({
      success: false,
      message: "Invalid authentication token."
    });
  }
};

// =========================================
// REQUIRE ADMIN
// Use AFTER `authenticate`. Blocks any authenticated user
// whose isAdmin flag (from the freshly-loaded database
// record, not the token payload) is not true.
// =========================================
export const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: "Admin access required."
    });
  }
  next();
};