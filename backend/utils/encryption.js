const crypto = require('crypto');

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

// Generate encryption key from environment variable
const getEncryptionKey = () => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is required');
  }
  
  // Ensure key is exactly 32 bytes
  return crypto.scryptSync(key, 'salt', KEY_LENGTH);
};

// Encrypt sensitive data
const encrypt = (text) => {
  if (!text) return null;
  
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipher(ALGORITHM, key);
    cipher.setAAD(Buffer.from('additional-data'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    // Combine iv, tag, and encrypted data
    return iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

// Decrypt sensitive data
const decrypt = (encryptedData) => {
  if (!encryptedData) return null;
  
  try {
    const key = getEncryptionKey();
    const parts = encryptedData.split(':');
    
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const tag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipher(ALGORITHM, key);
    decipher.setAAD(Buffer.from('additional-data'));
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

// Hash sensitive data (one-way)
const hash = (data) => {
  if (!data) return null;
  
  return crypto.createHash('sha256').update(data).digest('hex');
};

// Generate secure random token
const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Encrypt PII fields in employee data
const encryptEmployeeData = (employeeData) => {
  const sensitiveFields = [
    'phone', 
    'dateOfBirth', 
    'marriageAnniversary',
    'street',
    'city',
    'state',
    'zipCode',
    'emergencyContactName',
    'emergencyContactPhone'
  ];
  
  const encrypted = { ...employeeData };
  
  sensitiveFields.forEach(field => {
    if (encrypted[field]) {
      encrypted[field] = encrypt(encrypted[field].toString());
    }
  });
  
  return encrypted;
};

// Decrypt PII fields in employee data
const decryptEmployeeData = (encryptedData) => {
  const sensitiveFields = [
    'phone', 
    'dateOfBirth', 
    'marriageAnniversary',
    'street',
    'city',
    'state',
    'zipCode',
    'emergencyContactName',
    'emergencyContactPhone'
  ];
  
  const decrypted = { ...encryptedData };
  
  sensitiveFields.forEach(field => {
    if (decrypted[field]) {
      try {
        decrypted[field] = decrypt(decrypted[field]);
      } catch (error) {
        console.error(`Failed to decrypt field ${field}:`, error);
        // Keep original value if decryption fails (for backward compatibility)
      }
    }
  });
  
  return decrypted;
};

module.exports = {
  encrypt,
  decrypt,
  hash,
  generateSecureToken,
  encryptEmployeeData,
  decryptEmployeeData
};