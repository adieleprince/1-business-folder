import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // HARDCODED LOGIN FOR TESTING
    if (email === 'royaldynastyfragrances@gmail.com' && password === 'Adiele3566') {
      const token = jwt.sign(
        { userId: "admin", email: email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );
      
      console.log("✅ LOGIN SUCCESSFUL");
      return res.json({
        success: true,
        token,
        user: {
          id: "admin",
          username: "royaldynastyfragrances",
          email: email
        }
      });
    }

    // If credentials don't match
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

// ⚠️ THIS LINE MUST BE AT THE VERY BOTTOM ⚠️
export default router;