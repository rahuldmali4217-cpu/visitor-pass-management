const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Otp = require('../models/Otp');
const { sendOtpEmail } = require('../utils/emailSender');
const { sendSMS } = require('../utils/smsSender');

const getJwtSecret = () => process.env.JWT_SECRET || 'visitor_pass_jwt_secret_2026';

// helper to create jwt session token
const generateToken = (id) => {
  return jwt.sign({ id }, getJwtSecret(), { expiresIn: '30d' });
};

// helper to create temporary token after verifying otp
const generateOtpToken = (email) => {
  return jwt.sign({ email, purpose: 'PRE_REGISTRATION_VERIFIED' }, getJwtSecret(), { expiresIn: '15m' });
};

// 1. send 6-digit otp for visitor pre-registration
const sendOtp = async (req, res) => {
  try {
    const { email, phone, name } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // generate random 6-digit number
    const otpCode = crypto.randomInt(100000, 999999).toString();

    // remove any old unverified otp for this email
    await Otp.deleteMany({ email: cleanEmail, verified: false });

    // save new otp to database
    await Otp.create({
      email: cleanEmail,
      phone: phone || '',
      otpCode,
      purpose: 'PRE_REGISTRATION'
    });

    // send email with otp
    const emailResult = await sendOtpEmail(cleanEmail, otpCode, name);

    // send sms if phone number provided
    if (phone) {
      await sendSMS({
        toPhone: phone,
        message: `Your Visitor Pass OTP is ${otpCode}. Valid for 10 minutes.`
      });
    }

    res.json({
      success: true,
      message: `OTP sent to ${cleanEmail}`,
      previewUrl: emailResult.previewUrl || null,
      devOtp: process.env.NODE_ENV !== 'production' || emailResult.previewUrl ? otpCode : undefined
    });
  } catch (error) {
    console.error('Error in sendOtp:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. verify 6-digit otp code entered by user
const verifyOtp = async (req, res) => {
  try {
    const { email, otpCode } = req.body;

    if (!email || !otpCode) {
      return res.status(400).json({ success: false, message: 'Email and OTP code are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanOtp = otpCode.toString().trim();

    // find latest unverified otp
    const otpRecord = await Otp.findOne({
      email: cleanEmail,
      verified: false
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'OTP expired or not found. Please request a new code.'
      });
    }

    // check attempt limit
    if (otpRecord.attempts >= 5) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(429).json({
        success: false,
        message: 'Too many incorrect attempts. Please request a new OTP.'
      });
    }

    // check if otp matches
    if (otpRecord.otpCode !== cleanOtp) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({
        success: false,
        message: `Invalid OTP code. ${5 - otpRecord.attempts} attempt(s) left.`
      });
    }

    // mark otp as verified
    otpRecord.verified = true;
    await otpRecord.save();

    const verificationToken = generateOtpToken(cleanEmail);

    res.json({
      success: true,
      message: 'OTP verified successfully',
      verificationToken
    });
  } catch (error) {
    console.error('Error in verifyOtp:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. register a new user
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, phone, department } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // check if user already exists
    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    // create user in database
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
    console.error('Error in registerUser:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. login user with email and password
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please enter email and password' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail }).select('+password');

    // check user and compare password
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
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
    console.error('Error in loginUser:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. get logged in user profile
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
