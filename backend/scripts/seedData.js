const { 
  sequelize, 
  Department, 
  Position, 
  DocumentCategory, 
  DocumentType 
} = require('../models');
require('dotenv').config();

async function seedData() {
  try {
    await sequelize.authenticate();
    console.log('Connected to MySQL database');
    
    // Sync models
    await sequelize.sync();
    
    // Check if data already exists
    const existingDepartments = await Department.count();
    if (existingDepartments > 0) {
      console.log('Data already seeded');
      process.exit(0);
    }

    // Seed Departments
    const departments = await Department.bulkCreate([
      {
        name: 'Human Resources',
        description: 'Manages employee relations, recruitment, and organizational development'
      },
      {
        name: 'Information Technology',
        description: 'Handles technology infrastructure, software development, and IT support'
      },
      {
        name: 'Finance & Accounting',
        description: 'Manages financial operations, budgeting, and accounting processes'
      },
      {
        name: 'Marketing & Sales',
        description: 'Handles marketing campaigns, sales operations, and customer relations'
      },
      {
        name: 'Operations',
        description: 'Manages day-to-day operations and process optimization'
      }
    ]);

    console.log('Departments seeded successfully');

    // Seed Positions
    const positions = [
      // HR Department
      { title: 'HR Manager', departmentId: departments[0].id },
      { title: 'HR Executive', departmentId: departments[0].id },
      { title: 'Recruiter', departmentId: departments[0].id },
      { title: 'Training Coordinator', departmentId: departments[0].id },
      { title: 'Payroll Specialist', departmentId: departments[0].id },
      
      // IT Department
      { title: 'IT Manager', departmentId: departments[1].id },
      { title: 'Software Developer', departmentId: departments[1].id },
      { title: 'System Administrator', departmentId: departments[1].id },
      { title: 'Network Engineer', departmentId: departments[1].id },
      { title: 'Database Administrator', departmentId: departments[1].id },
      { title: 'UI/UX Designer', departmentId: departments[1].id },
      
      // Finance Department
      { title: 'Finance Manager', departmentId: departments[2].id },
      { title: 'Accountant', departmentId: departments[2].id },
      { title: 'Financial Analyst', departmentId: departments[2].id },
      { title: 'Accounts Payable Clerk', departmentId: departments[2].id },
      { title: 'Accounts Receivable Clerk', departmentId: departments[2].id },
      
      // Marketing Department
      { title: 'Marketing Manager', departmentId: departments[3].id },
      { title: 'Sales Executive', departmentId: departments[3].id },
      { title: 'Digital Marketing Specialist', departmentId: departments[3].id },
      { title: 'Content Writer', departmentId: departments[3].id },
      { title: 'Graphic Designer', departmentId: departments[3].id },
      
      // Operations Department
      { title: 'Operations Manager', departmentId: departments[4].id },
      { title: 'Project Coordinator', departmentId: departments[4].id },
      { title: 'Quality Assurance Specialist', departmentId: departments[4].id },
      { title: 'Administrative Assistant', departmentId: departments[4].id },
      
      // Common Positions (no department)
      { title: 'CEO', departmentId: null },
      { title: 'COO', departmentId: null },
      { title: 'CTO', departmentId: null },
      { title: 'CFO', departmentId: null },
      { title: 'General Manager', departmentId: null },
      { title: 'Assistant Manager', departmentId: null },
      { title: 'Team Lead', departmentId: null },
      { title: 'Senior Executive', departmentId: null },
      { title: 'Executive', departmentId: null },
      { title: 'Intern', departmentId: null }
    ];

    await Position.bulkCreate(positions);
    console.log('Positions seeded successfully');

    // Seed Document Categories
    const documentCategories = await DocumentCategory.bulkCreate([
      {
        name: 'Personal Documents',
        description: 'Personal identification and address documents',
        folderName: 'personal_documents'
      },
      {
        name: 'Employee Documents',
        description: 'Employment related documents and certificates',
        folderName: 'employee_documents'
      },
      {
        name: 'Medical Documents',
        description: 'Health and medical related documents',
        folderName: 'medical_documents'
      },
      {
        name: 'Financial Documents',
        description: 'Bank details and financial documents',
        folderName: 'financial_documents'
      }
    ]);

    console.log('Document categories seeded successfully');

    // Seed Document Types
    const documentTypes = [
      // Personal Documents
      { name: 'Aadhar Card', categoryId: documentCategories[0].id, requiresApproval: false },
      { name: 'PAN Card', categoryId: documentCategories[0].id, requiresApproval: false },
      { name: 'Passport', categoryId: documentCategories[0].id, requiresApproval: false },
      { name: 'Driving License', categoryId: documentCategories[0].id, requiresApproval: false },
      { name: 'Voter ID', categoryId: documentCategories[0].id, requiresApproval: false },
      { name: 'Address Proof', categoryId: documentCategories[0].id, requiresApproval: false },
      
      // Employee Documents
      { name: 'Resume/CV', categoryId: documentCategories[1].id, requiresApproval: true },
      { name: 'Offer Letter', categoryId: documentCategories[1].id, requiresApproval: false },
      { name: 'Appointment Letter', categoryId: documentCategories[1].id, requiresApproval: false },
      { name: 'Experience Certificate', categoryId: documentCategories[1].id, requiresApproval: false },
      { name: 'Relieving Letter', categoryId: documentCategories[1].id, requiresApproval: false },
      { name: 'Educational Certificates', categoryId: documentCategories[1].id, requiresApproval: false },
      { name: 'Training Certificates', categoryId: documentCategories[1].id, requiresApproval: false },
      
      // Medical Documents
      { name: 'Medical Certificate', categoryId: documentCategories[2].id, requiresApproval: false },
      { name: 'Health Insurance Card', categoryId: documentCategories[2].id, requiresApproval: false },
      { name: 'Vaccination Certificate', categoryId: documentCategories[2].id, requiresApproval: false },
      { name: 'Medical Reports', categoryId: documentCategories[2].id, requiresApproval: false },
      
      // Financial Documents
      { name: 'Bank Account Details', categoryId: documentCategories[3].id, requiresApproval: false },
      { name: 'Salary Slip', categoryId: documentCategories[3].id, requiresApproval: false },
      { name: 'Tax Documents', categoryId: documentCategories[3].id, requiresApproval: false },
      { name: 'Investment Proofs', categoryId: documentCategories[3].id, requiresApproval: false }
    ];

    await DocumentType.bulkCreate(documentTypes);
    console.log('Document types seeded successfully');

    console.log('All data seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedData();