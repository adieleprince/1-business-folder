import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { isValidEmail, sanitizeText } from '../utils/validation.js';
import { loginLimiter } from '../middleware/rateLimit.middleware.js';

const router = express.Router();

// =============================================
// REGISTER ROUTE
// =============================================
router.post('/register', loginLimiter, async (req, res) => {
  try {
    const email = sanitizeText(req.body?.email, 200).toLowerCase();
    const username = sanitizeText(req.body?.username, 60);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    // 1. Check if user already exists
    // (email/username are guaranteed plain, length-capped strings above,
    // so this can never be tricked into a MongoDB operator injection.)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    // 1b. Check if username is already taken
    const existingUsername = await User.findOne({ username: username.toLowerCase() });
    if (existingUsername) {
      return res.status(400).json({ success: false, message: 'Username already taken' });
    }
    
    // 3. Create and save the new user
    const newUser = new User({
      username,
      email,
      password,
      isAdmin: false // Regular customers are not admins
    });

    await newUser.save();

    // 4. Return success
    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      user: { id: newUser._id, username: newUser.username, email: newUser.email }
    });

  } catch (error) {
    console.error('REGISTER ERROR:', error);
    res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
  }
});

// =============================================
// LOGIN ROUTE
// =============================================
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const email = sanitizeText(req.body?.email, 200).toLowerCase();
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // 1. Search database
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // 2. Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // 3. Generate JWT Token
    const token = jwt.sign(
      { userId: user._id, email: user.email, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });

  } catch (error) {
    console.error('LOGIN ERROR:', error);
    res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
});

export default router;