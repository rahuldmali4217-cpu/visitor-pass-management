// ==========================================
// Authentication & OTP Controller
// ==========================================
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Otp = require('../models/Otp');
const { sendOtpEmail } = require('../utils/emailSender');
const { sendSMS } = require('../utils/smsSender');

const getJwtSecret = () => process.env.JWT_SECRET || 'visitor_pass_jwt_secret_2026';

// User login ke baad JWT token banane ka helper function
const generateToken = (id) => {
  return jwt.sign({ id }, getJwtSecret(), { expiresIn: '30d' });
};

// OTP verify hone ke baad temporary token generate karna
const generateOtpToken = (email) => {
  return jwt.sign({ email, purpose: 'PRE_REGISTRATION_VERIFIED' }, getJwtSecret(), { expiresIn: '15m' });
};

// 1. Visitor pre-registration ke liye 6-digit OTP bhejna
const sendOtp = async (req, res) => {
  try {
    const { email, phone, name } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address zaroori hai' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // 6 digit ka random number generate karna
    const otpCode = crypto.randomInt(100000, 999999).toString();

    // Purane unverified OTP ko delete karna
    await Otp.deleteMany({ email: cleanEmail, verified: false });

    // Database me naya OTP record save karna (10 min me auto-expire hoga)
    await Otp.create({
      email: cleanEmail,
      phone: phone || '',
      otpCode,
      purpose: 'PRE_REGISTRATION'
    });

    // Email par OTP send karna
    const emailResult = await sendOtpEmail(cleanEmail, otpCode, name);

    // Agar phone number hai toh SMS gateway se alert bhejna
    if (phone) {
      await sendSMS({
        toPhone: phone,
        message: `Aapka Visitor Pass OTP hai: ${otpCode}. Ye 10 minute tak valid hai.`
      });
    }

    res.json({
      success: true,
      message: `OTP successfully sent to ${cleanEmail}`,
      previewUrl: emailResult.previewUrl || null,
      devOtp: process.env.NODE_ENV !== 'production' || emailResult.previewUrl ? otpCode : undefined
    });
  } catch (error) {
    console.error('sendOtp error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. User ke enter kiye hue OTP ko verify karna
const verifyOtp = async (req, res) => {
  try {
    const { email, otpCode } = req.body;

    if (!email || !otpCode) {
      return res.status(400).json({ success: false, message: 'Email aur OTP dono enter karein' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanOtp = otpCode.toString().trim();

    // Latest unverified OTP record dhoondhna
    const otpRecord = await Otp.findOne({
      email: cleanEmail,
      verified: false
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'OTP expire ho chuka hai ya galat hai. Naya OTP mangwayein.'
      });
    }

    // Maximum 5 wrong attempts check karna
    if (otpRecord.attempts >= 5) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(429).json({
        success: false,
        message: 'Jyada bar galat OTP enter kiya gaya hai. Naya code request karein.'
      });
    }

    // OTP match check karna
    if (otpRecord.otpCode !== cleanOtp) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({
        success: false,
        message: `Galat OTP code! Aapke paas ${5 - otpRecord.attempts} attempt bache hain.`
      });
    }

    // Match hone par verified mark karna
    otpRecord.verified = true;
    await otpRecord.save();

    // Signed verification token return karna
    const verificationToken = generateOtpToken(cleanEmail);

    res.json({
      success: true,
      message: 'OTP successfully verify ho gaya',
      verificationToken
    });
  } catch (error) {
    console.error('verifyOtp error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Naye User ka Registration (Admin/Host/Security/Visitor)
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, phone, department } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Sabhi required fields bharna zaroori hai' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check karna ki email pehle se registered toh nahi hai
    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Is email se account pehle se bana hua hai' });
    }

    // Naya user database me create karna (password model me automatically hash hoga)
    const user = await User.create({
      name,
      email: cleanEmail,
      password,
      role: role || 'Visitor',
      phone: phone || '',
      department: department || 'General'
    });

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
    console.error('registerUser error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. User Login Handler (Email aur password verify karna)
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email aur Password enter karein' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail }).select('+password');

    // Password compare karna bcrypt ke sath
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Galat email ya password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Aapka account deactivate kar diya gaya hai' });
    }

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
    console.error('loginUser error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Logged in user ka profile lena
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
  sendOtp,
  verifyOtp,
  registerUser,
  loginUser,
  getMe
};
