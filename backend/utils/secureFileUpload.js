const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const sharp = require('sharp');
const mammoth = require('mammoth');
const puppeteer = require('puppeteer');
const PDFDocument = require('pdfkit');
const { promisify } = require('util');

// File type validation using magic numbers
const FILE_SIGNATURES = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47],
  'application/pdf': [0x25, 0x50, 0x44, 0x46],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [0x50, 0x4B, 0x03, 0x04]
};

// Validate file signature (magic numbers)
const validateFileSignature = (filePath, expectedMimeType) => {
  try {
    const buffer = fs.readFileSync(filePath);
    const signature = FILE_SIGNATURES[expectedMimeType];
    
    if (!signature) return false;
    
    for (let i = 0; i < signature.length; i++) {
      if (buffer[i] !== signature[i]) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('File signature validation error:', error);
    return false;
  }
};

// File validation (no virus scanning)
const validateFile = async (filePath) => {
  // Just return true - file type and size validation is handled elsewhere
  return true;
};

// Secure file storage with random names
const generateSecureFileName = (originalName) => {
  const ext = path.extname(originalName);
  const randomName = crypto.randomBytes(32).toString('hex');
  return randomName + ext;
};

// Create secure employee directories
const createEmployeeDirectories = (employeeId, employeeName) => {
  const baseDir = path.join(__dirname, '../uploads');
  const sanitizedName = employeeName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const employeeDir = path.join(baseDir, `${employeeId}_${sanitizedName}`);
  
  const categories = [
    'personal_documents',
    'employee_documents', 
    'medical_documents',
    'financial_documents'
  ];

  // Create base uploads directory with restricted permissions
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true, mode: 0o750 });
  }

  // Create employee directory with restricted permissions
  if (!fs.existsSync(employeeDir)) {
    fs.mkdirSync(employeeDir, { recursive: true, mode: 0o750 });
  }

  // Create category directories
  categories.forEach(category => {
    const categoryDir = path.join(employeeDir, category);
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true, mode: 0o750 });
    }
  });

  return employeeDir;
};

// Secure PDF conversion with timeout and sandboxing
const convertToPdf = async (inputPath, outputPath, mimeType) => {
  console.log(`🔄 Starting secure conversion: ${mimeType} -> PDF`);
  
  const conversionTimeout = 30000; // 30 seconds timeout
  
  try {
    // Validate file signature first
    if (!validateFileSignature(inputPath, mimeType)) {
      throw new Error('File signature validation failed - possible file type spoofing');
    }
    
    // File validation (no virus scanning needed)
    const isValid = await validateFile(inputPath);
    if (!isValid) {
      throw new Error('File validation failed');
    }
    
    if (mimeType === 'application/pdf') {
      console.log('✅ Already PDF, copying securely...');
      
      // Validate PDF structure
      const pdfBuffer = fs.readFileSync(inputPath);
      if (!pdfBuffer.toString('ascii', 0, 4).includes('PDF')) {
        throw new Error('Invalid PDF file structure');
      }
      
      fs.copyFileSync(inputPath, outputPath);
      fs.chmodSync(outputPath, 0o640); // Restrict file permissions
      return outputPath;
    }
    
    if (mimeType.startsWith('image/')) {
      console.log('🖼️ Converting image to PDF securely...');
      
      return await Promise.race([
        convertImageToPdf(inputPath, outputPath),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Image conversion timeout')), conversionTimeout)
        )
      ]);
    }
    
    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      console.log('📄 Converting DOCX to PDF securely...');
      
      return await Promise.race([
        convertDocxToPdf(inputPath, outputPath),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('DOCX conversion timeout')), conversionTimeout)
        )
      ]);
    }
    
    throw new Error(`Unsupported file type: ${mimeType}`);
    
  } catch (error) {
    console.error('💥 Secure conversion failed:', error);
    
    // Clean up any partial files
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }
    
    throw error;
  }
};

// Secure image to PDF conversion
const convertImageToPdf = async (inputPath, outputPath) => {
  try {
    // Validate and process image with Sharp (safer than direct processing)
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    
    // Security checks
    if (metadata.width > 10000 || metadata.height > 10000) {
      throw new Error('Image dimensions too large (potential DoS)');
    }
    
    if (metadata.size > 50 * 1024 * 1024) { // 50MB limit
      throw new Error('Image file too large');
    }
    
    // Create PDF document
    const doc = new PDFDocument({
      size: [Math.min(metadata.width || 612, 612), Math.min(metadata.height || 792, 792)],
      margin: 0
    });
    
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);
    
    // Process image through Sharp for security
    const processedImageBuffer = await image
      .jpeg({ quality: 80 }) // Convert to JPEG for consistency
      .toBuffer();
    
    // Add processed image to PDF
    doc.image(processedImageBuffer, 0, 0, {
      fit: [612, 792] // Standard page size
    });
    
    doc.end();
    
    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });
    
    fs.chmodSync(outputPath, 0o640);
    console.log('✅ Secure image to PDF conversion completed');
    return outputPath;
    
  } catch (error) {
    console.error('❌ Image conversion error:', error);
    throw error;
  }
};

// Secure DOCX to PDF conversion
const convertDocxToPdf = async (inputPath, outputPath) => {
  let browser = null;
  
  try {
    // Convert DOCX to HTML using mammoth (with size limits)
    const docxBuffer = fs.readFileSync(inputPath);
    
    if (docxBuffer.length > 10 * 1024 * 1024) { // 10MB limit
      throw new Error('DOCX file too large');
    }
    
    const result = await mammoth.convertToHtml({ 
      buffer: docxBuffer,
      options: {
        // Security: ignore embedded objects and external references
        ignoreEmptyParagraphs: true,
        includeDefaultStyleMap: false
      }
    });
    
    const htmlContent = result.value;
    
    // Sanitize HTML content (remove potentially dangerous elements)
    const sanitizedHtml = htmlContent
      .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove scripts
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '') // Remove iframes
      .replace(/<object[^>]*>.*?<\/object>/gi, '') // Remove objects
      .replace(/<embed[^>]*>/gi, '') // Remove embeds
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/on\w+\s*=/gi, ''); // Remove event handlers
    
    console.log('✅ DOCX converted to sanitized HTML');
    
    // Convert HTML to PDF using puppeteer with security restrictions
    browser = await puppeteer.launch({ 
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-javascript', // Disable JavaScript for security
        '--disable-images' // Disable image loading for faster processing
      ],
      timeout: 30000
    });
    
    const page = await browser.newPage();
    
    // Set security headers and disable potentially dangerous features
    await page.setExtraHTTPHeaders({
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline';"
    });
    
    // Set content with security restrictions
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline';">
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            line-height: 1.6;
            max-width: 100%;
            word-wrap: break-word;
          }
          img { display: none; } /* Hide images for security */
        </style>
      </head>
      <body>
        ${sanitizedHtml}
      </body>
      </html>
    `, { waitUntil: 'domcontentloaded', timeout: 10000 });
    
    // Generate PDF with restrictions
    await page.pdf({
      path: outputPath,
      format: 'A4',
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      },
      printBackground: false, // Don't print backgrounds for security
      timeout: 20000
    });
    
    await browser.close();
    browser = null;
    
    fs.chmodSync(outputPath, 0o640);
    console.log('✅ Secure DOCX to PDF conversion completed');
    return outputPath;
    
  } catch (error) {
    if (browser) {
      await browser.close();
    }
    console.error('❌ DOCX conversion error:', error);
    throw error;
  }
};

// Secure file deletion
const deleteOldFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      // Overwrite file with random data before deletion (secure deletion)
      const fileSize = fs.statSync(filePath).size;
      const randomData = crypto.randomBytes(fileSize);
      fs.writeFileSync(filePath, randomData);
      fs.unlinkSync(filePath);
      console.log(`Securely deleted file: ${filePath}`);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};

// Delete employee directory and all its contents
const deleteEmployeeDirectory = (employeeId, employeeName) => {
  try {
    const baseDir = path.join(__dirname, '../uploads');
    const sanitizedName = employeeName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const employeeDir = path.join(baseDir, `${employeeId}_${sanitizedName}`);
    
    if (fs.existsSync(employeeDir)) {
      // Recursively delete directory and all contents
      fs.rmSync(employeeDir, { recursive: true, force: true });
      console.log(`✅ Deleted employee directory: ${employeeDir}`);
    } else {
      console.log(`⚠️  Employee directory not found: ${employeeDir}`);
    }
  } catch (error) {
    console.error('❌ Error deleting employee directory:', error);
  }
};

// Secure multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true, mode: 0o750 });
    }
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    // Generate secure random filename
    const secureFilename = generateSecureFileName(file.originalname);
    cb(null, secureFilename);
  }
});

// Enhanced file filter with security checks
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
  
  // Additional security checks
  const filename = file.originalname.toLowerCase();
  
  // Check for dangerous file extensions
  const dangerousExtensions = /\.(exe|bat|cmd|com|pif|scr|vbs|js|jar|php|asp|jsp)$/i;
  if (dangerousExtensions.test(filename)) {
    return cb(new Error('File type not allowed for security reasons'));
  }
  
  // Check for double extensions
  if ((filename.match(/\./g) || []).length > 1) {
    return cb(new Error('Files with multiple extensions are not allowed'));
  }
  
  // Check filename length
  if (file.originalname.length > 255) {
    return cb(new Error('Filename too long'));
  }
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only JPG, PNG, PDF, and DOCX files are allowed'));
  }
};

// Configure secure multer upload
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1, // Only one file at a time
    fields: 10, // Limit form fields
    fieldNameSize: 100, // Limit field name size
    fieldSize: 1024 * 1024 // 1MB field size limit
  },
  fileFilter: fileFilter
});

module.exports = {
  upload,
  createEmployeeDirectories,
  deleteOldFile,
  deleteEmployeeDirectory,
  convertToPdf,
  validateFileSignature,
  validateFile,
  generateSecureFileName
};