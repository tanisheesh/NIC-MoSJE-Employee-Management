const express = require('express');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const { 
  Document, 
  DocumentType, 
  DocumentCategory, 
  Employee, 
  User 
} = require('../models');
const { auth, adminAuth } = require('../middleware/auth');
const { upload, deleteOldFile, createEmployeeDirectories, convertToPdf } = require('../utils/secureFileUpload');

const router = express.Router();

// Get all document categories and types
router.get('/categories', auth, async (req, res) => {
  try {
    const categories = await DocumentCategory.findAll({
      where: { isActive: true },
      include: [{
        model: DocumentType,
        as: 'documentTypes',
        where: { isActive: true },
        required: false
      }]
    });

    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all document types
router.get('/types', auth, async (req, res) => {
  try {
    const { categoryId } = req.query;
    
    const whereClause = { isActive: true };
    if (categoryId) {
      whereClause.categoryId = categoryId;
    }
    
    const types = await DocumentType.findAll({
      where: whereClause,
      include: [{
        model: DocumentCategory,
        as: 'category',
        attributes: ['id', 'name']
      }],
      order: [['name', 'ASC']]
    });

    res.json(types);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get employee documents
router.get('/employee/:employeeId', auth, async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    // Check permissions
    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    if (req.user.role !== 'admin' && employee.userId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const documents = await Document.findAll({
      where: { employeeId },
      include: [
        {
          model: DocumentType,
          as: 'documentType',
          include: [{
            model: DocumentCategory,
            as: 'category'
          }]
        },
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'email']
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current employee's documents (for employee dashboard)
router.get('/my-documents', auth, async (req, res) => {
  try {
    // Find employee by user ID
    const employee = await Employee.findOne({
      where: { userId: req.user.id }
    });
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee profile not found' });
    }

    const documents = await Document.findAll({
      where: { 
        employeeId: employee.id,
        status: { [Op.in]: ['approved', 'pending', 'rejected'] } // Show all statuses for employee
      },
      include: [
        {
          model: DocumentType,
          as: 'documentType',
          include: [{
            model: DocumentCategory,
            as: 'category'
          }]
        },
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'email']
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Upload document (with PDF conversion)
router.post('/upload', auth, upload.single('document'), async (req, res) => {
  try {
    const {
      employeeId,
      documentTypeId,
      issueDate,
      expiryDate
    } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    let employee;
    
    if (req.user.role === 'admin') {
      // Admin uploading for an employee
      if (!employeeId) {
        return res.status(400).json({ message: 'Employee ID is required for admin uploads' });
      }
      
      employee = await Employee.findByPk(employeeId);
      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }
    } else {
      // Employee uploading for themselves
      employee = await Employee.findOne({
        where: { userId: req.user.id }
      });
      
      if (!employee) {
        return res.status(404).json({ message: 'Employee profile not found' });
      }
    }

    // Get document type
    const documentType = await DocumentType.findByPk(documentTypeId, {
      include: [{
        model: DocumentCategory,
        as: 'category'
      }]
    });
    
    if (!documentType) {
      return res.status(404).json({ message: 'Document type not found' });
    }

    // Create employee directories if they don't exist
    const employeeName = `${employee.firstName}_${employee.lastName}`;
    createEmployeeDirectories(`NIC-${employee.employeeId}`, employeeName);

    // Determine status and file naming based on user role
    let status = 'approved';
    let fileName = `${employeeName}_${documentType.name}.pdf`;
    
    if (req.user.role !== 'admin') {
      // Employee upload - requires approval
      status = 'pending';
      fileName = `${employeeName}_${documentType.name}_approval.pdf`;
    }
    
    // Create directory path
    const employeeDir = path.join('uploads', `NIC-${employee.employeeId}_${employeeName}`);
    const categoryDir = path.join(employeeDir, documentType.category.folderName);
    const finalPath = path.join(categoryDir, fileName);

    // Ensure directory exists
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true });
    }

    // For admin uploads, check if document already exists and delete old one
    if (req.user.role === 'admin') {
      const existingDocument = await Document.findOne({
        where: {
          employeeId: employee.id,
          documentTypeId,
          status: 'approved'
        }
      });

      if (existingDocument) {
        // Delete old file
        deleteOldFile(existingDocument.filePath);
        // Delete old record
        await existingDocument.destroy();
      }
    } else {
      // For employee uploads, check if there's already a pending approval for this document type
      const existingPending = await Document.findOne({
        where: {
          employeeId: employee.id,
          documentTypeId,
          status: 'pending'
        }
      });

      if (existingPending) {
        // Delete the old pending document and replace with new one
        deleteOldFile(existingPending.filePath);
        await existingPending.destroy();
      }
    }

    // Convert file to PDF and move to final location
    console.log('🚀 Starting file conversion process...');
    console.log('📂 Input file:', req.file.path);
    console.log('📂 Output file:', finalPath);
    console.log('🏷️ MIME type:', req.file.mimetype);
    
    try {
      await convertToPdf(req.file.path, finalPath, req.file.mimetype);
      console.log('✅ File successfully converted and saved as PDF');
    } catch (conversionError) {
      console.error('❌ CONVERSION ERROR DETAILS:', conversionError);
      console.error('❌ Error stack:', conversionError.stack);
      // Delete the temporary file
      deleteOldFile(req.file.path);
      return res.status(500).json({ 
        message: 'File conversion to PDF failed', 
        error: conversionError.message,
        details: conversionError.stack
      });
    }
    
    // Verify the PDF file was created
    if (!fs.existsSync(finalPath)) {
      console.error('❌ PDF file was not created at:', finalPath);
      deleteOldFile(req.file.path);
      return res.status(500).json({ message: 'PDF file creation failed' });
    }
    
    // Verify it's actually a PDF file
    const pdfBuffer = fs.readFileSync(finalPath);
    if (!pdfBuffer.toString('ascii', 0, 4).includes('PDF')) {
      console.error('❌ Created file is not a valid PDF');
      deleteOldFile(finalPath);
      deleteOldFile(req.file.path);
      return res.status(500).json({ message: 'Invalid PDF file created' });
    }
    
    console.log('✅ PDF file verified successfully');
    
    // Delete the temporary file
    deleteOldFile(req.file.path);

    // Create document record - ALWAYS PDF
    const document = await Document.create({
      employeeId: employee.id,
      documentTypeId,
      fileName, // This includes _approval suffix for employee uploads
      originalName: req.file.originalname, // Keep original name for reference
      filePath: finalPath, // This points to the PDF file
      fileSize: fs.statSync(finalPath).size, // Get actual PDF file size
      mimeType: 'application/pdf', // ALWAYS PDF
      uploadedBy: req.user.id,
      status,
      approvedBy: req.user.role === 'admin' ? req.user.id : null,
      approvedAt: req.user.role === 'admin' ? new Date() : null,
      issueDate: issueDate || null,
      expiryDate: expiryDate || null
    });

    console.log('✅ Database record created for PDF document:', document.id);

    const populatedDocument = await Document.findByPk(document.id, {
      include: [
        {
          model: DocumentType,
          as: 'documentType',
          include: [{
            model: DocumentCategory,
            as: 'category'
          }]
        },
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'email']
        }
      ]
    });

    res.status(201).json(populatedDocument);
  } catch (error) {
    console.error('Document upload error:', error);
    // Delete uploaded file if database operation fails
    if (req.file) {
      deleteOldFile(req.file.path);
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// View document (inline display) - uses session authentication
router.get('/view/:id', auth, async (req, res) => {
  try {
    console.log('View request received for document:', req.params.id);
    console.log('User:', req.user ? req.user.email : 'No user');

    const document = await Document.findByPk(req.params.id, {
      include: [{
        model: Employee,
        as: 'employee'
      }, {
        model: DocumentType,
        as: 'documentType',
        include: [{
          model: DocumentCategory,
          as: 'category'
        }]
      }]
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check permissions - Admin can access all, employees can only access their own
    const canView = req.user.role === 'admin' || document.employee.userId === req.user.id;
    if (!canView) {
      console.log(`View access denied: User ${req.user.id} (role: ${req.user.role}) tried to view document ${document.id} belonging to employee ${document.employee.userId}`);
      return res.status(403).json({ message: 'Access denied. You can only view your own documents.' });
    }

    if (!fs.existsSync(document.filePath)) {
      console.log(`File not found for viewing: ${document.filePath}`);
      return res.status(404).json({ message: 'File not found on server' });
    }

    // Set proper headers for inline viewing (always PDF now)
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN'); // Security header
    
    // Log access for security audit
    console.log(`Document view: User ${req.user.id} (${req.user.role}) viewed document ${document.id} (${document.documentType.name}) for employee ${document.employee.firstName} ${document.employee.lastName}`);
    
    // Send file for inline viewing
    res.sendFile(path.resolve(document.filePath));
  } catch (error) {
    console.error('Document view error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete document
router.delete('/:id', auth, async (req, res) => {
  try {
    const document = await Document.findByPk(req.params.id, {
      include: [{
        model: Employee,
        as: 'employee'
      }]
    });
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check permissions - admin can delete any document, employee can only delete their own
    if (req.user.role !== 'admin' && document.employee.userId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Delete file from filesystem
    deleteOldFile(document.filePath);

    // Delete record from database
    await document.destroy();

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update document metadata (dates only)
router.put('/:id', auth, async (req, res) => {
  try {
    const { issueDate, expiryDate } = req.body;
    
    const document = await Document.findByPk(req.params.id, {
      include: [{
        model: Employee,
        as: 'employee'
      }]
    });
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check permissions - admin can update any document, employee can only update their own
    if (req.user.role !== 'admin' && document.employee.userId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await document.update({
      issueDate: issueDate || null,
      expiryDate: expiryDate || null
    });

    const updatedDocument = await Document.findByPk(document.id, {
      include: [
        {
          model: DocumentType,
          as: 'documentType',
          include: [{
            model: DocumentCategory,
            as: 'category'
          }]
        },
        {
          model: Employee,
          as: 'employee'
        }
      ]
    });

    res.json(updatedDocument);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Approve/Reject document (Admin only)
router.put('/:id/approve', adminAuth, async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const document = await Document.findByPk(req.params.id, {
      include: [
        {
          model: Employee,
          as: 'employee'
        },
        {
          model: DocumentType,
          as: 'documentType',
          include: [{
            model: DocumentCategory,
            as: 'category'
          }]
        }
      ]
    });
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (status === 'approved') {
      // Check if there's an existing approved document of the same type
      const existingApproved = await Document.findOne({
        where: {
          employeeId: document.employeeId,
          documentTypeId: document.documentTypeId,
          status: 'approved',
          id: { [Op.ne]: document.id }
        }
      });

      // If approving, rename file from _approval to normal name
      if (document.fileName.includes('_approval')) {
        const employeeName = `${document.employee.firstName}_${document.employee.lastName}`;
        const newFileName = `${employeeName}_${document.documentType.name}.pdf`;
        
        const employeeDir = path.join('uploads', `NIC-${document.employee.employeeId}_${employeeName}`);
        const categoryDir = path.join(employeeDir, document.documentType.category.folderName);
        const newFilePath = path.join(categoryDir, newFileName);
        
        // Delete existing approved document if it exists
        if (existingApproved) {
          deleteOldFile(existingApproved.filePath);
          await existingApproved.destroy();
        }
        
        // Rename the approval file to normal name
        if (fs.existsSync(document.filePath)) {
          fs.renameSync(document.filePath, newFilePath);
          
          // Update document record with new file info
          await document.update({
            fileName: newFileName,
            filePath: newFilePath,
            status,
            approvedBy: req.user.id,
            approvedAt: new Date(),
            rejectionReason: null
          });
        } else {
          return res.status(404).json({ message: 'Document file not found' });
        }
      } else {
        // Document doesn't have _approval suffix, just update status
        await document.update({
          status,
          approvedBy: req.user.id,
          approvedAt: new Date(),
          rejectionReason: null
        });
      }
    } else {
      // Rejected - delete the approval file and record
      if (document.fileName.includes('_approval')) {
        // Delete the approval file
        deleteOldFile(document.filePath);
        // Delete the document record
        await document.destroy();
        
        res.json({ message: 'Document rejected and deleted successfully' });
        return;
      } else {
        // Document doesn't have _approval suffix, just update status
        await document.update({
          status,
          approvedBy: req.user.id,
          approvedAt: new Date(),
          rejectionReason: rejectionReason || 'No reason provided'
        });
      }
    }

    const updatedDocument = await Document.findByPk(document.id, {
      include: [
        {
          model: DocumentType,
          as: 'documentType',
          include: [{
            model: DocumentCategory,
            as: 'category'
          }]
        },
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'email']
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'email']
        }
      ]
    });

    res.json(updatedDocument);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get pending approvals (Admin only)
router.get('/pending-approvals', adminAuth, async (req, res) => {
  try {
    const pendingDocuments = await Document.findAll({
      where: { status: 'pending' },
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'firstName', 'lastName', 'employeeId']
        },
        {
          model: DocumentType,
          as: 'documentType',
          include: [{
            model: DocumentCategory,
            as: 'category'
          }]
        },
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'email']
        }
      ],
      order: [['createdAt', 'ASC']]
    });

    res.json(pendingDocuments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;