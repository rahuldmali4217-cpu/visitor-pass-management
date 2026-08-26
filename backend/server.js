// 1. Zaroori packages aur files ko import kar rahe hain
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

// .env file se PORT aur MONGO_URI load karna
dotenv.config();

// MongoDB Database se connection establish karna
connectDB();

const app = express();

// Middlewares: CORS enable karna aur JSON body parse karna
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check API - Check karne ke liye ki backend live hai ya nahi
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date(),
    service: 'Visitor Pass Management System API'
  });
});

// Saare API Routes ko connect kar rahe hain (Auth, Users, Passes, Check-logs, Analytics)
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/passes', require('./routes/passRoutes'));
app.use('/api/check-logs', require('./routes/checkLogRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));

const path = require('path');

// Production mode me React frontend ke static build ko Express se serve karna
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../frontend/dist');
  app.use(express.static(distPath));

  // Agar user direct kisi route par visit kare toh frontend index.html bhejo
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Error handling middleware - Agar koi galat route ya server error aaye toh handle karega
app.use(notFound);
app.use(errorHandler);

// Server ko port par listen karna
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
