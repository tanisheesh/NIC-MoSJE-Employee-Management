const { Sequelize } = require('sequelize');
require('dotenv').config();

// Validate required environment variables
const requiredEnvVars = ['DB_NAME', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET'];
requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});

const sequelize = new Sequelize(
  process.env.DB_NAME || 'employee_management',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? false : false, // Disable logging for cleaner output
    
    // Enhanced security configuration
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: true
      } : false,
      connectTimeout: 5000
    },
    
    pool: {
      max: process.env.NODE_ENV === 'production' ? 20 : 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
      evict: 1000,
      handleDisconnects: true
    },
    
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: true,
      paranoid: false, // Disable soft deletes to avoid deletedAt column requirement
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    },
    
    // Query timeout
    query: {
      timeout: 10000
    },
    
    // Retry configuration
    retry: {
      match: [
        /ETIMEDOUT/,
        /EHOSTUNREACH/,
        /ECONNRESET/,
        /ECONNREFUSED/,
        /ETIMEDOUT/,
        /ESOCKETTIMEDOUT/,
        /EHOSTUNREACH/,
        /EPIPE/,
        /EAI_AGAIN/,
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/
      ],
      max: 3
    },
    
    // Benchmark queries in development
    benchmark: false
  }
);

module.exports = sequelize;