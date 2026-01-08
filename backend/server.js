const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { sequelize } = require('./models');
const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employees');
const notificationRoutes = require('./routes/notifications');
const documentRoutes = require('./routes/documents');
const departmentRoutes = require('./routes/departments');
const positionRoutes = require('./routes/positions');
const registrationRoutes = require('./routes/registration');
const NotificationService = require('./services/notificationService');

// Security middleware
const { 
  securityHeaders, 
  generalLimiter,
  apiLimiter,
  sanitizeInput 
} = require('./middleware/security');

const app = express();

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Security headers
app.use(securityHeaders);

// CORS configuration - restrict to specific origins
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'https://localhost:3000',
      'https://your-domain.gov' // Replace with actual government domain
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Body parsing middleware with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization
app.use(sanitizeInput);

// General rate limiting for non-API routes
app.use('/health', generalLimiter);
app.use('/', generalLimiter);

// API rate limiting (more permissive for API endpoints)
app.use('/api', apiLimiter);

// Health check endpoint (no auth required but limited info)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'employee-management-api'
  });
});

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'NIC-MoSJE Employee Management API' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/positions', positionRoutes);
app.use('/api/registration', registrationRoutes);
app.use('/api/dashboard', require('./routes/dashboard'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error:', error);
  
  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({ 
      error: 'Internal server error',
      requestId: req.id || 'unknown'
    });
  } else {
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      stack: error.stack
    });
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

const PORT = process.env.PORT || 5000;

// Database connection and server startup
async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Sync database models (create tables if they don't exist)
    await sequelize.sync({ alter: false });
    console.log('✅ Database models synchronized');
    
    // Start notification service
    NotificationService.startCronJobs();
    console.log('✅ Notification service started');
    
    // Start server with HTTPS in production
    if (process.env.NODE_ENV === 'production') {
      const https = require('https');
      const fs = require('fs');
      
      // Load SSL certificates
      const options = {
        key: fs.readFileSync(process.env.SSL_KEY_PATH),
        cert: fs.readFileSync(process.env.SSL_CERT_PATH)
      };
      
      https.createServer(options, app).listen(PORT, () => {
        console.log(`🚀 Secure server running on https://localhost:${PORT}`);
      });
    } else {
      app.listen(PORT, () => {
        console.log(`🚀 Development server running on http://localhost:${PORT}`);
        console.log('⚠️  WARNING: Running in development mode without HTTPS');
      });
    }
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

// Start the server
startServer();