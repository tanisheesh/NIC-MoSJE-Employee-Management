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
- [🗄️ Database Setup](#️-database-setup)
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


### Technology Stack
- **Backend**: Node.js, Express.js, Sequelize ORM
- **Frontend**: Next.js 16, React 19, TypeScript
- **Database**: MySQL 8.0+
- **Authentication**: JWT with refresh tokens
- **Security**: Helmet.js, bcrypt, XSS protection
- **File Processing**: Sharp, Puppeteer, Mammoth
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

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

### Authentication Flow
1. **Login** → JWT token issued (1-hour expiry)
2. **API Requests** → Token validation on each request
3. **Token Refresh** → Automatic refresh using refresh token
4. **Logout** → Token blacklisted for security
5. **Session Timeout** → Automatic logout after inactivity

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

**Internship Project | 2025-2026**

---