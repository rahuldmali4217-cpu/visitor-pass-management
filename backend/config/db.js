const mongoose = require('mongoose');
const User = require('../models/User');
const Visitor = require('../models/Visitor');
const Appointment = require('../models/Appointment');
const Pass = require('../models/Pass');
const CheckLog = require('../models/CheckLog');

let mongoServer;

const autoSeedIfEmpty = async () => {
  try {
    const count = await User.countDocuments();
    if (count === 0) {
      console.log('Database empty. Auto-seeding demo accounts...');

      const admin = await User.create({
        name: 'System Admin',
        email: 'admin@example.com',
        password: 'password123',
        role: 'Admin',
        phone: '+91 9876543210',
        department: 'IT Infrastructure'
      });

      const security = await User.create({
        name: 'Main Gate Security',
        email: 'security@example.com',
        password: 'password123',
        role: 'Security',
        phone: '+91 9876543211',
        department: 'Security & Safety'
      });

      const host1 = await User.create({
        name: 'Rajesh Sharma (HR Manager)',
        email: 'host@example.com',
        password: 'password123',
        role: 'Host',
        phone: '+91 9876543212',
        department: 'Human Resources'
      });

      const host2 = await User.create({
        name: 'Priya Verma (Tech Lead)',
        email: 'priya@example.com',
        password: 'password123',
        role: 'Host',
        phone: '+91 9876543213',
        department: 'Software Engineering'
      });

      const visitorUser = await User.create({
        name: 'Amit Patel',
        email: 'visitor@example.com',
        password: 'password123',
        role: 'Visitor',
        phone: '+91 9876543214',
        department: 'General'
      });

      await Visitor.create({
        userId: visitorUser._id,
        name: visitorUser.name,
        email: visitorUser.email,
        phone: visitorUser.phone,
        company: 'TCS Innovation Hub',
        idProofType: 'Aadhaar',
        idProofNumber: 'XXXX-XXXX-1234'
      });

      const now = new Date();
      const startTime = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      const endTime = new Date(now.getTime() + 6 * 60 * 60 * 1000);

      const appointment1 = await Appointment.create({
        visitor: {
          name: 'Amit Patel',
          email: 'visitor@example.com',
          phone: '+91 9876543214',
          company: 'TCS Innovation Hub',
          idProofType: 'Aadhaar',
          idProofNumber: 'XXXX-XXXX-1234'
        },
        host: host1._id,
        purpose: 'Job Interview for Senior Developer position',
        scheduledStartTime: startTime,
        scheduledEndTime: endTime,
        status: 'APPROVED',
        requestedBy: 'VISITOR'
      });

      const pass1 = await Pass.create({
        passCode: 'VP-DEMO01',
        appointment: appointment1._id,
        visitorName: 'Amit Patel',
        visitorEmail: 'visitor@example.com',
        visitorPhone: '+91 9876543214',
        visitorCompany: 'TCS Innovation Hub',
        host: host1._id,
        purpose: 'Job Interview for Senior Developer position',
        validFrom: startTime,
        validUntil: endTime,
        status: 'ACTIVE',
        qrCodeData: 'VP-DEMO01',
        createdBy: host1._id
      });

      await CheckLog.create({
        pass: pass1._id,
        passCode: pass1.passCode,
        visitorName: pass1.visitorName,
        hostName: host1.name,
        checkInTime: startTime,
        checkedInBy: security._id,
        status: 'CHECKED_IN',
        remarks: 'Verified Aadhaar ID Proof at Gate 1'
      });

      console.log('✅ Auto-Seeding Complete! Demo accounts ready.');
    }
  } catch (err) {
    console.error('Error during auto-seed:', err.message);
  }
};

const dns = require('dns');

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/visitor_pass_db';

  try {
    const conn = await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 8000 });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    await autoSeedIfEmpty();
  } catch (error) {
    // If SRV DNS lookup failed, retry with public DNS
    if (error.message && error.message.includes('querySrv')) {
      try {
        dns.setServers(['8.8.8.8', '1.1.1.1']);
        const conn = await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 8000 });
        console.log(`MongoDB Connected (via DNS fallback): ${conn.connection.host}`);
        await autoSeedIfEmpty();
        return;
      } catch (dnsErr) {
        console.error('DNS Fallback MongoDB connection failed:', dnsErr.message);
      }
    }

    console.warn(`Local/Atlas MongoDB connection failed (${error.message}). Starting In-Memory Database...`);
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoServer = await MongoMemoryServer.create();
      const inMemoryUri = mongoServer.getUri();
      const conn = await mongoose.connect(inMemoryUri);
      console.log(`In-Memory MongoDB Connected: ${conn.connection.host}`);
      await autoSeedIfEmpty();
    } catch (memErr) {
      console.error(`Failed to start In-Memory MongoDB: ${memErr.message}`);
    }
  }
};

module.exports = connectDB;
