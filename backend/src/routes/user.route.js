import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

const router = express.Router();

// =============================================
// REGISTER ROUTE
// =============================================
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 1. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    // 1b. Check if username is already taken
    const existingUsername = await User.findOne({ username: username.toLowerCase().trim() });
    if (existingUsername) {
      return res.status(400).json({ success: false, message: 'Username already taken' });
    }
    
    // 3. Create and save the new user
    const newUser = new User({
      username,
      email: email.toLowerCase().trim(),
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
    res.status(500).json({ success: false, message: 'Registration failed', error: error.message });
  }
});

// =============================================
// LOGIN ROUTE (100% Secure)
// =============================================
// =============================================
// LOGIN ROUTE (DEBUG MODE)
// =============================================
router.post('/login', async (req, res) => {
  try {
    const email = req.body?.email?.toString().trim().toLowerCase() || '';
    const password = String(req.body?.password || '');

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // 1. Search database
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`❌ User not found for email: ${email}`);
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    console.log("=========================================");
    console.log(`✅ User found: ${user.email}`);
    console.log(`🔑 Input password: "${password}"`);
    console.log(`🔒 Stored hash: ${user.password}`);

    // 2. Compare passwords
    let isPasswordValid = false;
    try {
      isPasswordValid = await bcrypt.compare(password, user.password);
    } catch (err) {
      console.error("🔥 BCRYPT CRASHED:", err.message);
    }

    console.log(`✅ bcrypt.compare result: ${isPasswordValid}`);
    console.log("=========================================");

    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // 3. Generate JWT Token
    const token = jwt.sign(
      { userId: user._id, email: user.email, isAdmin: user.isAdmin },
      process.env.JWT_SECRET || 'your-secret-key',
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
    res.status(500).json({ success: false, message: 'Login failed', error: error.message });
  }
});

export default router;