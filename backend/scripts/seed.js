const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Visitor = require('../models/Visitor');
const Appointment = require('../models/Appointment');
const Pass = require('../models/Pass');
const CheckLog = require('../models/CheckLog');

dotenv.config();

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/visitor_pass_db';
    
    try {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
      console.log('Connected to Local MongoDB for seeding...');
    } catch (localErr) {
      console.log('Local MongoDB not running. Using In-Memory MongoDB for seeding demo data...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const memoryUri = mongoServer.getUri();
      await mongoose.connect(memoryUri);
      console.log('Connected to In-Memory MongoDB...');
    }

    // Clear existing data
    await User.deleteMany({});
    await Visitor.deleteMany({});
    await Appointment.deleteMany({});
    await Pass.deleteMany({});
    await CheckLog.deleteMany({});

    console.log('Cleared old database records.');

    // 1. Create System Users for 4 Roles
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

    console.log('Created 5 Seed Users across 4 Roles.');

    // 2. Create Sample Visitors
    await Visitor.create({
      userId: visitorUser._id,
      name: visitorUser.name,
      email: visitorUser.email,
      phone: visitorUser.phone,
      company: 'TCS Innovation Hub',
      idProofType: 'Aadhaar',
      idProofNumber: 'XXXX-XXXX-1234'
    });

    // 3. Create Sample Appointments
    const now = new Date();
    const startTime = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago
    const endTime = new Date(now.getTime() + 6 * 60 * 60 * 1000);   // in 6 hours

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

    const appointment2 = await Appointment.create({
      visitor: {
        name: 'Neha Gupta',
        email: 'neha@vendor.com',
        phone: '+91 9812345678',
        company: 'Apex Solutions',
        idProofType: 'PAN',
        idProofNumber: 'ABCDE1234F'
      },
      host: host2._id,
      purpose: 'Vendor Software Demonstration',
      scheduledStartTime: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
      scheduledEndTime: new Date(now.getTime() + 26 * 60 * 60 * 1000),
      status: 'PENDING',
      requestedBy: 'VISITOR'
    });

    console.log('Created 2 Appointments (1 APPROVED, 1 PENDING).');

    // 4. Create Pass for Approved Appointment
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

    console.log('Created Seed Pass: VP-DEMO01');

    // 5. Create CheckLog for checked-in visitor
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

    console.log('Created Seed CheckLog (Amit Patel checked-in).');

    console.log('\n--- SEED COMPLETED SUCCESSFULLY ---');
    console.log('User Accounts Created:');
    console.log('1. Admin    : admin@example.com    / password123');
    console.log('2. Security : security@example.com / password123');
    console.log('3. Host     : host@example.com     / password123');
    console.log('4. Visitor  : visitor@example.com  / password123');
    console.log('------------------------------------\n');

    process.exit(0);
  } catch (error) {
    console.error('Error Seeding Database:', error);
    process.exit(1);
  }
};

seedData();
