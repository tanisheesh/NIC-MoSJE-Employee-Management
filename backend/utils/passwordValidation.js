const validatePassword = (password, personalInfo = {}) => {
  const errors = [];
  
  // Check minimum length (increased to 12 for government systems)
  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long');
  }
  
  // Check maximum length
  if (password.length > 128) {
    errors.push('Password must not exceed 128 characters');
  }
  
  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  // Check for lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  // Check for number
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  // Check for special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  // Check for common weak patterns
  const commonPatterns = [
    /(.)\1{2,}/, // Repeated characters (aaa, 111)
    /123456|654321|qwerty|password|admin|letmein/i, // Common passwords
    /^[a-zA-Z]+$/, // Only letters
    /^\d+$/, // Only numbers
  ];
  
  commonPatterns.forEach(pattern => {
    if (pattern.test(password)) {
      errors.push('Password contains common weak patterns');
    }
  });
  
  // Check if password contains personal information
  const lowerPassword = password.toLowerCase();
  if (personalInfo) {
    const { firstName, lastName, email, username, phone } = personalInfo;
    
    if (firstName && firstName.length > 2 && lowerPassword.includes(firstName.toLowerCase())) {
      errors.push('Password must not contain your first name');
    }
    if (lastName && lastName.length > 2 && lowerPassword.includes(lastName.toLowerCase())) {
      errors.push('Password must not contain your last name');
    }
    if (email) {
      const emailParts = email.toLowerCase().split('@');
      if (emailParts[0] && emailParts[0].length > 2 && lowerPassword.includes(emailParts[0])) {
        errors.push('Password must not contain your email username');
      }
    }
    if (username && username.length > 2 && lowerPassword.includes(username.toLowerCase())) {
      errors.push('Password must not contain your username');
    }
    if (phone && lowerPassword.includes(phone.replace(/\D/g, ''))) {
      errors.push('Password must not contain your phone number');
    }
  }
  
  // Check for sequential characters
  const hasSequential = (str) => {
    for (let i = 0; i < str.length - 2; i++) {
      const char1 = str.charCodeAt(i);
      const char2 = str.charCodeAt(i + 1);
      const char3 = str.charCodeAt(i + 2);
      
      if (char2 === char1 + 1 && char3 === char2 + 1) {
        return true; // Found sequential characters like abc or 123
      }
    }
    return false;
  };
  
  if (hasSequential(password.toLowerCase())) {
    errors.push('Password must not contain sequential characters (abc, 123, etc.)');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

// Password history tracking (in production, store in database)
const passwordHistory = new Map();

const checkPasswordHistory = (userId, newPassword) => {
  const history = passwordHistory.get(userId) || [];
  const bcrypt = require('bcryptjs');
  
  // Check against last 5 passwords
  for (const oldPasswordHash of history) {
    if (bcrypt.compareSync(newPassword, oldPasswordHash)) {
      return false; // Password was used before
    }
  }
  
  return true; // Password is new
};

const addToPasswordHistory = (userId, passwordHash) => {
  const history = passwordHistory.get(userId) || [];
  history.unshift(passwordHash);
  
  // Keep only last 5 passwords
  if (history.length > 5) {
    history.splice(5);
  }
  
  passwordHistory.set(userId, history);
};

// Password expiration tracking
const passwordExpiration = new Map();
const PASSWORD_EXPIRY_DAYS = 90;

const isPasswordExpired = (userId) => {
  const lastChanged = passwordExpiration.get(userId);
  if (!lastChanged) return false;
  
  const expiryDate = new Date(lastChanged);
  expiryDate.setDate(expiryDate.getDate() + PASSWORD_EXPIRY_DAYS);
  
  return new Date() > expiryDate;
};

const updatePasswordExpiration = (userId) => {
  passwordExpiration.set(userId, new Date());
};

const getDaysUntilExpiry = (userId) => {
  const lastChanged = passwordExpiration.get(userId);
  if (!lastChanged) return null;
  
  const expiryDate = new Date(lastChanged);
  expiryDate.setDate(expiryDate.getDate() + PASSWORD_EXPIRY_DAYS);
  
  const today = new Date();
  const diffTime = expiryDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

module.exports = {
  validatePassword,
  checkPasswordHistory,
  addToPasswordHistory,
  isPasswordExpired,
  updatePasswordExpiration,
  getDaysUntilExpiry,
  PASSWORD_EXPIRY_DAYS
};