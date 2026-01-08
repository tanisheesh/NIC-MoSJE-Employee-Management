const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const mammoth = require('mammoth');
const puppeteer = require('puppeteer');
const PDFDocument = require('pdfkit');
const { promisify } = require('util');

// Create uploads directory structure
const createEmployeeDirectories = (employeeId, employeeName) => {
  const baseDir = path.join(__dirname, '../uploads');
  const employeeDir = path.join(baseDir, `${employeeId}_${employeeName.replace(/\s+/g, '_')}`);
  
  const categories = [
    'personal_documents',
    'employee_documents', 
    'medical_documents',
    'financial_documents'
  ];

  // Create base uploads directory if it doesn't exist
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }

  // Create employee directory if it doesn't exist
  if (!fs.existsSync(employeeDir)) {
    fs.mkdirSync(employeeDir, { recursive: true });
  }

  // Create category directories
  categories.forEach(category => {
    const categoryDir = path.join(employeeDir, category);
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true });
    }
  });

  return employeeDir;
};

// Convert various file types to PDF
const convertToPdf = async (inputPath, outputPath, mimeType) => {
  console.log(`🔄 Starting conversion: ${mimeType} -> PDF`);
  console.log(`📁 Input: ${inputPath}`);
  console.log(`📁 Output: ${outputPath}`);
  
  try {
    if (mimeType === 'application/pdf') {
      console.log('✅ Already PDF, copying...');
      fs.copyFileSync(inputPath, outputPath);
      console.log('✅ PDF copy completed');
      return outputPath;
    }
    
    if (mimeType.startsWith('image/')) {
      console.log('🖼️ Converting image to PDF...');
      
      // Get image dimensions first
      const image = sharp(inputPath);
      const metadata = await image.metadata();
      console.log('📏 Image dimensions:', metadata.width, 'x', metadata.height);
      
      // Create PDF document with proper page size
      const doc = new PDFDocument({
        size: [metadata.width || 612, metadata.height || 792],
        margin: 0
      });
      
      // Create write stream
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);
      
      // Add image to PDF
      doc.image(inputPath, 0, 0, {
        width: metadata.width,
        height: metadata.height
      });
      
      // End the document
      doc.end();
      
      // Wait for completion
      await new Promise((resolve, reject) => {
        stream.on('finish', () => {
          console.log('✅ Image to PDF conversion completed');
          resolve();
        });
        stream.on('error', (err) => {
          console.error('❌ Stream error:', err);
          reject(err);
        });
        doc.on('error', (err) => {
          console.error('❌ PDF document error:', err);
          reject(err);
        });
      });
      
      return outputPath;
    }
    
    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      console.log('📄 Converting DOCX to PDF...');
      
      try {
        // Convert DOCX to HTML using mammoth
        const docxBuffer = fs.readFileSync(inputPath);
        const result = await mammoth.convertToHtml({ buffer: docxBuffer });
        const htmlContent = result.value;
        
        console.log('✅ DOCX converted to HTML');
        
        // Convert HTML to PDF using puppeteer
        const browser = await puppeteer.launch({ 
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        
        // Set HTML content
        await page.setContent(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { 
                font-family: Arial, sans-serif; 
                margin: 20px; 
                line-height: 1.6;
              }
            </style>
          </head>
          <body>
            ${htmlContent}
          </body>
          </html>
        `);
        
        // Generate PDF
        await page.pdf({
          path: outputPath,
          format: 'A4',
          margin: {
            top: '20px',
            right: '20px',
            bottom: '20px',
            left: '20px'
          }
        });
        
        await browser.close();
        console.log('✅ DOCX to PDF conversion completed');
        return outputPath;
        
      } catch (docxError) {
        console.error('❌ DOCX conversion error:', docxError);
        throw new Error(`DOCX conversion failed: ${docxError.message}`);
      }
    }
    
    throw new Error(`❌ Unsupported file type: ${mimeType}`);
    
  } catch (error) {
    console.error('💥 Conversion failed:', error);
    throw error; // Re-throw to stop the upload process
  }
};

// Delete old file if exists
const deleteOldFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`Deleted old file: ${filePath}`);
  }
};
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  const mimetype = allowedMimeTypes.includes(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only JPG, PNG, PDF, and DOCX files are allowed!'));
  }
};

// Configure multer storage - simple temp storage
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

module.exports = {
  upload,
  createEmployeeDirectories,
  deleteOldFile,
  convertToPdf
};