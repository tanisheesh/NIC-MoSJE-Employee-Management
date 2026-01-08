# 🏛️ NIC-MoSJE Employee Management System

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)

**A comprehensive employee management system developed during internship at National Informatics Centre (NIC) - Ministry of Social Justice & Empowerment (MoSJE)**

*This is a demo repository. The actual production system cannot be revealed due to government security restrictions.*

</div>


## 📋 Table of Contents

- [🎯 Overview](#-overview)
- [✨ Features](#-features)
- [🔒 Security Features](#-security-features)
- [🏗️ Architecture](#️-architecture)
- [🚀 Quick Start](#-quick-start)
- [⚙️ Configuration](#️-configuration)
- [🗄️ Database Setup](#️-database-setup)
- [🔐 Authentication](#-authentication)
- [📁 Project Structure](#-project-structure)
- [🛡️ Security Guidelines](#️-security-guidelines)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)


## 🎯 Overview

The **NIC-MoSJE Employee Management System** is a modern, secure, and scalable web application designed to streamline employee management processes for government organizations. Built with enterprise-grade security features and following government IT standards.

### 🏢 Developed For
- **Organization**: National Informatics Centre (NIC)
- **Ministry**: Ministry of Social Justice & Empowerment (MoSJE)
- **Purpose**: Internship Project (Demo Version)
- **Classification**: Demonstration Repository


## ✨ Features

### 👥 Employee Management
- **Complete CRUD Operations** - Create, read, update, delete employee records
- **Role-based Access Control** - Admin, Employee, and Super Admin roles
- **Profile Management** - Comprehensive employee profiles with personal and professional details
- **Department & Position Management** - Hierarchical organizational structure
- **Status Tracking** - Active, Inactive, and Retired employee status management

### 📄 Document Management
- **Secure File Upload** - Multi-format document support (PDF, DOC, DOCX, Images)
- **Automatic PDF Conversion** - Convert documents to PDF for standardization
- **Document Categories** - Personal, Employee, Medical, and Financial documents
- **Approval Workflow** - Document approval system for sensitive files
- **File Organization** - Structured folder system per employee

### 🔔 Notification System
- **Smart Notifications** - Birthday, work anniversary, and marriage anniversary alerts
- **Leaving Anniversary Tracking** - Track retired employees' anniversaries
- **Automated Scheduling** - Daily cron jobs for notification generation
- **Multi-user Notifications** - Broadcast to relevant stakeholders

### 📊 Dashboard & Analytics
- **Real-time Statistics** - Employee counts, document statistics
- **Department Insights** - Department-wise employee distribution
- **Quick Actions** - Fast access to common operations
- **Responsive Design** - Mobile-friendly interface


## 🔒 Security Features

### 🛡️ Authentication & Authorization
- **JWT-based Authentication** - Secure token-based authentication with 1-hour expiry
- **Refresh Token System** - Automatic token refresh for seamless user experience
- **Account Lockout Protection** - 5 failed attempts trigger 30-minute lockout
- **Role-based Access Control** - Granular permissions based on user roles
- **Session Management** - Secure session handling with automatic timeout

### 🔐 Password Security
- **Advanced Password Policy** - 12+ characters with complexity requirements
- **Password History Tracking** - Prevent reuse of last 5 passwords
- **Sequential Character Detection** - Block common patterns like "123" or "abc"
- **Personal Information Validation** - Prevent use of personal data in passwords
- **Secure Password Hashing** - bcrypt with 12 rounds for maximum security

### 🛡️ Data Protection
- **Input Sanitization** - XSS protection with comprehensive input cleaning
- **SQL Injection Prevention** - Parameterized queries with Sequelize ORM
- **Data Encryption** - AES-256-GCM encryption for sensitive data
- **Secure File Handling** - File type validation and secure storage
- **CORS Protection** - Restricted cross-origin requests

### 🚨 Security Monitoring
- **Comprehensive Audit Logging** - All security events logged with timestamps
- **Rate Limiting** - API endpoint protection against abuse
- **Security Headers** - Helmet.js for security headers implementation
- **Failed Login Tracking** - Monitor and alert on suspicious activities
- **Request Validation** - Comprehensive input validation on all endpoints

### 🔒 Infrastructure Security
- **Environment Variable Protection** - Secure configuration management
- **SSL/TLS Support** - HTTPS enforcement in production
- **Database Security** - Encrypted connections and secure credentials
- **File Upload Security** - Magic number validation and size limits
- **Error Handling** - Secure error messages without information leakage


## 🏗️ Architecture

### Backend (Node.js + Express)
```
backend/
├── config/          # Database and configuration
├── middleware/      # Security, auth, and logging middleware
├── models/          # Sequelize database models
├── routes/          # API route handlers
├── services/        # Business logic services
├── utils/           # Utility functions and helpers
├── scripts/         # Database initialization scripts
└── uploads/         # Secure file storage
```

### Frontend (Next.js + TypeScript)
```
frontend/
├── src/
│   ├── app/         # Next.js app router pages
│   ├── components/  # Reusable UI components
│   ├── lib/         # API client and utilities
│   ├── utils/       # Helper functions
│   └── constants/   # Application constants
├── public/          # Static assets
└── styles/          # Global styles
```

### Technology Stack
- **Backend**: Node.js, Express.js, Sequelize ORM
- **Frontend**: Next.js 16, React 19, TypeScript
- **Database**: MySQL 8.0+
- **Authentication**: JWT with refresh tokens
- **Security**: Helmet.js, bcrypt, XSS protection
- **File Processing**: Sharp, Puppeteer, Mammoth
- **Styling**: Tailwind CSS
- **Icons**: Lucide React


## 🚀 Quick Start

### Prerequisites
- **Node.js** 18.0 or higher
- **MySQL** 8.0 or higher
- **npm** or **yarn** package manager

### 1. Clone Repository
```bash
git clone https://github.com/your-username/nic-mosje-employee-management.git
cd nic-mosje-employee-management
```

### 2. Install Dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Environment Configuration
```bash
# Backend environment
cp backend/.env.example backend/.env

# Frontend environment
cp frontend/.env.example frontend/.env.local
```

### 4. Database Setup
```bash
cd backend

# Initialize database
npm run init-db

# Seed initial data
npm run seed-data

# Create admin user
npm run create-admin
```

### 5. Start Development Servers
```bash
# Start backend (Terminal 1)
cd backend
npm run dev

# Start frontend (Terminal 2)
cd frontend
npm run dev
```

### 6. Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## ⚙️ Configuration

### Backend Environment Variables (.env)
```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=employee_management
DB_USER=your_db_user
DB_PASSWORD=your_secure_db_password

# JWT Configuration
JWT_SECRET=your_very_long_and_secure_jwt_secret_key_here_minimum_32_characters

# Encryption Configuration
ENCRYPTION_KEY=your_encryption_key_for_sensitive_data_32_chars_min

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@domain.com
EMAIL_PASS=your_app_password

# SSL Configuration (Production)
SSL_KEY_PATH=/path/to/your/ssl/private.key
SSL_CERT_PATH=/path/to/your/ssl/certificate.crt

# Environment
NODE_ENV=development
PORT=5000

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Security Settings
SESSION_SECRET=your_session_secret_key_here
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=500
```

### Frontend Environment Variables (.env.local)
```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Security Configuration
NEXT_PUBLIC_ENABLE_HTTPS=false
NEXT_PUBLIC_SECURE_COOKIES=false

# Environment
NODE_ENV=development
```

### Security Configuration Guidelines
- **JWT_SECRET**: Minimum 32 characters, use cryptographically secure random string
- **ENCRYPTION_KEY**: 32+ characters for AES-256 encryption
- **SESSION_SECRET**: Unique secret for session management
- **Database Credentials**: Use strong passwords with special characters
- **SSL Certificates**: Required for production deployment


## 🗄️ Database Setup

### Automatic Setup (Recommended)
```bash
cd backend

# 1. Create database
npm run init-db

# 2. Create tables and seed data
npm run seed-data

# 3. Create admin user
npm run create-admin
```

### Manual Setup
```sql
-- Create database
CREATE DATABASE employee_management;
USE employee_management;

-- Tables will be created automatically by Sequelize
-- Run the application once to generate tables
```

### Default Data Seeded
- **5 Departments**: HR, IT, Finance, Marketing, Operations
- **34 Positions**: Various roles across departments
- **4 Document Categories**: Personal, Employee, Medical, Financial
- **21 Document Types**: Comprehensive document classification
- **1 Admin User**: admin@company.com / AdminPassword123!

### Database Schema
```
Users (Authentication)
├── Employees (Profile Data)
│   ├── Documents (File Management)
│   └── Notifications (Alert System)
├── Departments (Organization)
├── Positions (Job Roles)
├── DocumentCategories (Classification)
├── DocumentTypes (File Types)
└── PendingRegistrations (Approval Workflow)
```

## 🔐 Authentication

### User Roles & Permissions

#### 🔴 Super Admin
- **Full System Access** - Complete administrative control
- **User Management** - Create, modify, delete any user
- **System Configuration** - Modify system settings
- **Audit Access** - View all security logs and reports

#### 🟡 Admin
- **Employee Management** - Full CRUD operations on employee data
- **Document Approval** - Approve/reject document uploads
- **Department Management** - Manage departments and positions
- **Notification Management** - Configure notification settings

#### 🟢 Employee
- **Profile Management** - Update personal information
- **Document Upload** - Upload personal documents
- **View Access** - Access own data and notifications
- **Limited Modification** - Update specific profile fields only

### Authentication Flow
1. **Login** → JWT token issued (1-hour expiry)
2. **API Requests** → Token validation on each request
3. **Token Refresh** → Automatic refresh using refresh token
4. **Logout** → Token blacklisted for security
5. **Session Timeout** → Automatic logout after inactivity

### Password Requirements
- ✅ Minimum 12 characters
- ✅ At least one uppercase letter (A-Z)
- ✅ At least one lowercase letter (a-z)
- ✅ At least one number (0-9)
- ✅ At least one special character (!@#$%^&*)
- ✅ No sequential characters (abc, 123)
- ✅ No common weak patterns (password, admin)
- ✅ No personal information (name, email, phone)

## 📁 Project Structure

```
nic-mosje-employee-management/
├── 📁 backend/                 # Node.js Backend
│   ├── 📁 config/             # Database configuration
│   ├── 📁 middleware/         # Security & auth middleware
│   │   ├── 🔒 auth.js         # JWT authentication
│   │   ├── 🛡️ security.js     # Security headers & rate limiting
│   │   └── 📝 auditLogger.js  # Security event logging
│   ├── 📁 models/             # Database models
│   │   ├── 👤 User.js         # User authentication model
│   │   ├── 👥 Employee.js     # Employee profile model
│   │   ├── 🏢 Department.js   # Department model
│   │   ├── 💼 Position.js     # Job position model
│   │   ├── 📄 Document.js     # Document management model
│   │   └── 🔔 Notification.js # Notification system model
│   ├── 📁 routes/             # API endpoints
│   │   ├── 🔐 auth.js         # Authentication routes
│   │   ├── 👥 employees.js    # Employee management
│   │   ├── 📄 documents.js    # Document handling
│   │   ├── 🔔 notifications.js # Notification system
│   │   └── 📊 dashboard.js    # Dashboard data
│   ├── 📁 services/           # Business logic
│   │   └── 🔔 notificationService.js # Notification processing
│   ├── 📁 utils/              # Utility functions
│   │   ├── 🔒 encryption.js   # Data encryption utilities
│   │   ├── 🔑 passwordValidation.js # Password security
│   │   └── 📁 secureFileUpload.js # File handling security
│   ├── 📁 scripts/            # Database scripts
│   │   ├── 🗄️ initDatabase.js # Database initialization
│   │   ├── 🌱 seedData.js     # Initial data seeding
│   │   └── 👤 createAdmin.js  # Admin user creation
│   ├── 📁 uploads/            # Secure file storage
│   ├── 📁 logs/               # Security audit logs
│   ├── 🔧 server.js           # Express server entry point
│   ├── 📦 package.json        # Backend dependencies
│   └── 🔒 .env.example        # Environment template
├── 📁 frontend/               # Next.js Frontend
│   ├── 📁 src/
│   │   ├── 📁 app/            # Next.js app router
│   │   │   ├── 🔐 login/      # Authentication pages
│   │   │   ├── 👤 admin/      # Admin dashboard
│   │   │   ├── 👥 employee/   # Employee portal
│   │   │   └── 🏠 page.tsx    # Landing page
│   │   ├── 📁 components/     # Reusable UI components
│   │   │   ├── 📁 ui/         # Base UI components
│   │   │   ├── 📁 layout/     # Layout components
│   │   │   └── 📁 forms/      # Form components
│   │   ├── 📁 lib/            # Client libraries
│   │   │   ├── 🌐 api.ts      # API client configuration
│   │   │   └── 🔐 auth.ts     # Client-side authentication
│   │   ├── 📁 utils/          # Utility functions
│   │   └── 📁 constants/      # Application constants
│   ├── 📁 public/             # Static assets
│   ├── 🎨 tailwind.config.js  # Styling configuration
│   ├── 📦 package.json        # Frontend dependencies
│   └── 🔒 .env.example        # Environment template
├── 📄 README.md               # Project documentation
├── 🚫 .gitignore              # Git ignore rules
└── 📋 SECURITY.md             # Security guidelines
```

## 🛡️ Security Guidelines

### 🔒 For Developers

#### Environment Security
- ❌ **Never commit** `.env` files to version control
- ✅ **Always use** `.env.example` for templates
- ✅ **Rotate secrets** regularly in production
- ✅ **Use strong passwords** for all accounts

#### Code Security
- ✅ **Validate all inputs** on both client and server
- ✅ **Sanitize user data** before database operations
- ✅ **Use parameterized queries** to prevent SQL injection
- ✅ **Implement proper error handling** without information leakage

#### File Security
- ✅ **Validate file types** using magic numbers, not extensions
- ✅ **Limit file sizes** to prevent DoS attacks
- ✅ **Scan uploaded files** for malware (when possible)
- ✅ **Store files securely** outside web root

### 🏢 For Deployment

#### Production Checklist
- [ ] SSL/TLS certificates configured
- [ ] Environment variables secured
- [ ] Database connections encrypted
- [ ] Rate limiting enabled
- [ ] Security headers implemented
- [ ] Audit logging configured
- [ ] Backup strategy implemented
- [ ] Monitoring and alerting setup

#### Security Monitoring
- 📊 **Monitor failed login attempts**
- 🚨 **Alert on suspicious activities**
- 📝 **Regular security audits**
- 🔄 **Automated vulnerability scanning**


## 🤝 Contributing

### Development Guidelines
1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Follow** coding standards and security practices
4. **Test** thoroughly before committing
5. **Commit** changes (`git commit -m 'Add amazing feature'`)
6. **Push** to branch (`git push origin feature/amazing-feature`)
7. **Open** a Pull Request

### Code Standards
- ✅ **TypeScript** for type safety
- ✅ **ESLint** for code quality
- ✅ **Prettier** for code formatting
- ✅ **Security-first** approach
- ✅ **Comprehensive testing**

### Security Requirements
- 🔒 All new features must include security considerations
- 🛡️ Input validation required for all user inputs
- 📝 Security events must be logged
- 🔍 Code review required for security-related changes


## 📄 License

This project is developed as a **demonstration repository** for the internship program at **National Informatics Centre (NIC)** under the **Ministry of Social Justice & Empowerment (MoSJE)**.

### Important Notes
- 🏛️ **Government Project**: Developed for NIC-MoSJE
- 🎓 **Educational Purpose**: Internship demonstration project
- 🔒 **Restricted Access**: Actual production system is classified
- 📋 **Demo Version**: This repository contains demonstration code only

### Disclaimer
This is a **demo repository** created to showcase development skills and project structure. The actual production system used by the Government of India cannot be revealed due to security and confidentiality restrictions.

---

<div align="center">

### 🏛️ Developed with ❤️ for National Informatics Centre (NIC)
### Ministry of Social Justice & Empowerment, Government of India

**Internship Project | 2024-2025**

---

*For any queries regarding this demonstration project, please contact the development team.*

</div>