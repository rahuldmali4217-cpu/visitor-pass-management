// User model aur JWT package import kar rahe hain
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// User ID se JWT secure token generate karne ka helper function (Valid for 30 days)
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretvisitorpasskey12345', {
    expiresIn: '30d'
  });
};

// 1. Naye user ko register karna (Admin, Host, Security, ya Visitor)
// POST /api/auth/register
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, phone, department } = req.body;

    // Check karo ki email pehle se registered toh nahi hai
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    // Naya user database me create karo
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'Visitor',
      phone: phone || '',
      department: department || 'General'
    });

    // Successfully register hone par user details aur token return karo
    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        department: user.department,
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. User Login API - Email aur Password verify karke JWT token dena
// POST /api/auth/login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // Database me user find karo aur password match karo
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated' });
    }

    // Login successful hone par JWT token return karo
    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        department: user.department,
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Logged-in user ki profile fetch karna
// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe
};
