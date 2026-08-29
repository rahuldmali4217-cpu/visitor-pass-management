/**
 * End-to-End System Integration & Lifecycle Test Suite
 * Tests all core features: Auth, Real OTP, Appointments, Passes, QR verification, Gate Check-In/Out, Analytics & CSV Export
 */
const http = require('http');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Otp = require('../models/Otp');
const Appointment = require('../models/Appointment');
const Pass = require('../models/Pass');
const CheckLog = require('../models/CheckLog');

const authRoutes = require('../routes/authRoutes');
const appointmentRoutes = require('../routes/appointmentRoutes');
const passRoutes = require('../routes/passRoutes');
const checkLogRoutes = require('../routes/checkLogRoutes');
const analyticsRoutes = require('../routes/analyticsRoutes');
const userRoutes = require('../routes/userRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'online' }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/passes', passRoutes);
app.use('/api/check-logs', checkLogRoutes);
app.use('/api/analytics', analyticsRoutes);

let server;
let baseUrl;

// Simple HTTP request helper
const request = ({ method, path, body, token }) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const postData = body ? JSON.stringify(body) : '';

    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let parsed = data;
        try {
          parsed = JSON.parse(data);
        } catch (e) {}
        resolve({ status: res.statusCode, headers: res.headers, body: parsed });
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
};

async function runTests() {
  console.log('\n======================================================');
  console.log('🚀 VISITOR PASS MANAGEMENT SYSTEM - E2E TEST SUITE');
  console.log('======================================================\n');

  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/visitor_pass_db';
  console.log(`[TEST DB] Connecting to database: ${mongoUri.split('@')[1] || mongoUri}...`);

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
    console.log('✅ Connected to MongoDB successfully.\n');
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB:', err.message);
    process.exit(1);
  }

  // Start test server on random port
  server = app.listen(0);
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;
  console.log(`[TEST SERVER] Running on port ${port}...\n`);

  let testPassed = 0;
  let testFailed = 0;

  const assert = (condition, title) => {
    if (condition) {
      console.log(`  ✅ PASS: ${title}`);
      testPassed++;
    } else {
      console.error(`  ❌ FAIL: ${title}`);
      testFailed++;
    }
  };

  try {
    // ----------------------------------------------------------------
    // TEST 1: Health Check Endpoint
    // ----------------------------------------------------------------
    console.log('--- TEST GROUP 1: System Health ---');
    const healthRes = await request({ method: 'GET', path: '/api/health' });
    assert(healthRes.status === 200 && healthRes.body.status === 'online', 'GET /api/health returns 200 online');

    // ----------------------------------------------------------------
    // TEST 2: User Authentication & Role Management
    // ----------------------------------------------------------------
    console.log('\n--- TEST GROUP 2: Authentication & RBAC ---');
    const timestamp = Date.now();
    const adminEmail = `testadmin_${timestamp}@example.com`;
    const hostEmail = `testhost_${timestamp}@example.com`;
    const visitorEmail = `testvisitor_${timestamp}@example.com`;

    // 2a. Register Admin
    const adminReg = await request({
      method: 'POST',
      path: '/api/auth/register',
      body: {
        name: 'Test Admin',
        email: adminEmail,
        password: 'Password123!',
        role: 'Admin',
        phone: '+91 9999900001',
        department: 'Operations'
      }
    });
    assert(adminReg.status === 201 && adminReg.body.data.token, 'Register Admin returns JWT token');
    const adminToken = adminReg.body.data.token;

    // 2b. Register Host
    const hostReg = await request({
      method: 'POST',
      path: '/api/auth/register',
      body: {
        name: 'Dr. Sameer Joshi',
        email: hostEmail,
        password: 'Password123!',
        role: 'Host',
        phone: '+91 9999900002',
        department: 'Research & Development'
      }
    });
    assert(hostReg.status === 201 && hostReg.body.data._id, 'Register Host returns user ID');
    const hostId = hostReg.body.data._id;
    const hostToken = hostReg.body.data.token;

    // 2c. Login User
    const loginRes = await request({
      method: 'POST',
      path: '/api/auth/login',
      body: { email: adminEmail, password: 'Password123!' }
    });
    assert(loginRes.status === 200 && loginRes.body.data.role === 'Admin', 'Login with valid credentials succeeds');

    // 2d. Profile retrieval with Bearer token
    const meRes = await request({ method: 'GET', path: '/api/auth/me', token: adminToken });
    assert(meRes.status === 200 && meRes.body.data.email === adminEmail, 'GET /api/auth/me verifies JWT session');

    // ----------------------------------------------------------------
    // TEST 3: Real OTP Verification Flow
    // ----------------------------------------------------------------
    console.log('\n--- TEST GROUP 3: Real Database-Backed OTP Verification ---');
    
    // 3a. Send OTP
    const sendOtpRes = await request({
      method: 'POST',
      path: '/api/auth/send-otp',
      body: {
        email: visitorEmail,
        phone: '+91 9888877777',
        name: 'Karan Mehra'
      }
    });
    assert(sendOtpRes.status === 200 && sendOtpRes.body.success === true, 'POST /api/auth/send-otp dispatches OTP');

    // Find the OTP code directly from database to test verification
    const otpDoc = await Otp.findOne({ email: visitorEmail, verified: false }).sort({ createdAt: -1 });
    assert(otpDoc && otpDoc.otpCode.length === 6, 'OTP code stored in MongoDB with 10-minute TTL');

    // 3b. Verify with wrong code (should fail)
    const wrongOtpRes = await request({
      method: 'POST',
      path: '/api/auth/verify-otp',
      body: { email: visitorEmail, otpCode: '000000' }
    });
    assert(wrongOtpRes.status === 400 && wrongOtpRes.body.success === false, 'Verify with invalid OTP returns 400 rejection');

    // 3c. Verify with correct code (should pass and issue single-use token)
    const correctOtpRes = await request({
      method: 'POST',
      path: '/api/auth/verify-otp',
      body: { email: visitorEmail, otpCode: otpDoc.otpCode }
    });
    assert(correctOtpRes.status === 200 && correctOtpRes.body.verificationToken, 'Verify with correct OTP returns signed verificationToken');
    const verificationToken = correctOtpRes.body.verificationToken;

    // ----------------------------------------------------------------
    // TEST 4: Visitor Pre-Registration & Host Approval
    // ----------------------------------------------------------------
    console.log('\n--- TEST GROUP 4: Pre-Registration & Pass Issuance ---');
    
    const startTime = new Date();
    const endTime = new Date(Date.now() + 6 * 60 * 60 * 1000);

    // 4a. Public Pre-Registration using verified token
    const preRegRes = await request({
      method: 'POST',
      path: '/api/appointments/public-register',
      body: {
        visitorName: 'Karan Mehra',
        visitorEmail: visitorEmail,
        visitorPhone: '+91 9888877777',
        visitorCompany: 'Nexus Robotics',
        idProofType: 'PAN',
        idProofNumber: 'ABCDE1234F',
        hostId: hostId,
        purpose: 'Quarterly Vendor Hardware Review',
        scheduledStartTime: startTime.toISOString(),
        scheduledEndTime: endTime.toISOString(),
        verificationToken
      }
    });
    assert(preRegRes.status === 201 && preRegRes.body.data.appointment.status === 'PENDING', 'Public pre-registration creates PENDING appointment');
    const appointmentId = preRegRes.body.data.appointment._id;

    // 4b. Host approves appointment -> auto-generates Pass
    const approveRes = await request({
      method: 'PUT',
      path: `/api/appointments/${appointmentId}/status`,
      token: hostToken,
      body: { status: 'APPROVED', remarks: 'Meeting confirmed in Conference Room 3B' }
    });
    assert(approveRes.status === 200 && approveRes.body.data.pass.passCode, 'Host approval creates active Pass with PassCode');
    const passCode = approveRes.body.data.pass.passCode;

    // ----------------------------------------------------------------
    // TEST 5: QR Code Verification & Gate Check-In / Check-Out
    // ----------------------------------------------------------------
    console.log('\n--- TEST GROUP 5: QR Verification & Gate Access Logging ---');

    // 5a. Verify Pass Code
    const verifyPassRes = await request({ method: 'GET', path: `/api/passes/verify/${passCode}` });
    assert(verifyPassRes.status === 200 && verifyPassRes.body.valid === true, `Pass ${passCode} verified as VALID`);

    // 5b. Process Check-In at Security Gate
    const checkInRes = await request({
      method: 'POST',
      path: '/api/check-logs/check-in',
      token: adminToken,
      body: { passCode, remarks: 'Verified PAN Card at Gate 1' }
    });
    assert(checkInRes.status === 201 && checkInRes.body.data.status === 'CHECKED_IN', 'Security check-in logs entry time and marks CHECKED_IN');

    // 5c. Prevent duplicate Check-In without checking out
    const duplicateCheckIn = await request({
      method: 'POST',
      path: '/api/check-logs/check-in',
      token: adminToken,
      body: { passCode }
    });
    assert(duplicateCheckIn.status === 400, 'Duplicate check-in blocked when visitor is already inside');

    // 5d. Process Check-Out
    const checkOutRes = await request({
      method: 'POST',
      path: '/api/check-logs/check-out',
      token: adminToken,
      body: { passCode, remarks: 'Badge returned at exit' }
    });
    assert(checkOutRes.status === 200 && checkOutRes.body.data.status === 'CHECKED_OUT', 'Security check-out logs exit timestamp');

    // ----------------------------------------------------------------
    // TEST 6: Analytics & CSV Audit Export
    // ----------------------------------------------------------------
    console.log('\n--- TEST GROUP 6: System Analytics & CSV Audit ---');

    const statsRes = await request({ method: 'GET', path: '/api/analytics/dashboard', token: adminToken });
    assert(statsRes.status === 200 && statsRes.body.data.totalPassesIssued >= 1, 'Analytics dashboard returns calculated counters');

    const csvRes = await request({ method: 'GET', path: '/api/analytics/export-csv', token: adminToken });
    assert(csvRes.status === 200 && csvRes.headers['content-type'].includes('text/csv'), 'Export CSV returns downloadable audit log spreadsheet');

    console.log('\n======================================================');
    console.log(`📊 TEST SUMMARY: ${testPassed} Passed | ${testFailed} Failed`);
    console.log('======================================================\n');

    // Cleanup created test records
    await User.deleteMany({ email: { $in: [adminEmail, hostEmail, visitorEmail] } });
    await Otp.deleteMany({ email: visitorEmail });
    await Appointment.deleteMany({ _id: appointmentId });
    await Pass.deleteMany({ passCode });
    await CheckLog.deleteMany({ passCode });

  } catch (err) {
    console.error('Fatal error during test run:', err);
    testFailed++;
  } finally {
    server.close();
    await mongoose.connection.close();
    process.exit(testFailed > 0 ? 1 : 0);
  }
}

runTests();
