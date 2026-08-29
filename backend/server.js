// ==========================================
// 1. Zaroori packages import karna
// ==========================================
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

// .env file se variables load karna (jaise PORT, MONGO_URI)
dotenv.config();

// MongoDB database se connect karna
connectDB();

const app = express();

// Middlewares: CORS enable karna aur json data parse karna
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check API: server chal raha hai ya nahi check karne ke liye
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date(),
    service: 'Visitor Pass Management System API'
  });
});

// Saare main API routes connect karna
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/passes', require('./routes/passRoutes'));
app.use('/api/check-logs', require('./routes/checkLogRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));

// Production me React frontend ka build serve karna
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../frontend/dist');
  app.use(express.static(distPath));

  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Server ko port par listen karwana
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
