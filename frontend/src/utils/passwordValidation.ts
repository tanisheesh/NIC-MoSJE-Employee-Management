export interface PasswordValidation {
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  hasMinLength: boolean;
  hasMaxLength: boolean;
  notRelatedToPersonalInfo: boolean;
  noSequentialChars: boolean;
  noCommonPatterns: boolean;
  isValid: boolean;
}

export const validatePassword = (
  password: string,
  personalInfo?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    username?: string;
    phone?: string;
  }
): PasswordValidation => {
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  const hasMinLength = password.length >= 12; // Increased from 8 to 12
  const hasMaxLength = password.length <= 128;

  // Check for common weak patterns
  const commonPatterns = [
    /(.)\1{2,}/, // Repeated characters (aaa, 111)
    /123456|654321|qwerty|password|admin|letmein/i, // Common passwords
    /^[a-zA-Z]+$/, // Only letters
    /^\d+$/, // Only numbers
  ];
  
  const noCommonPatterns = !commonPatterns.some(pattern => pattern.test(password));

  // Check for sequential characters
  const hasSequential = (str: string): boolean => {
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
  
  const noSequentialChars = !hasSequential(password.toLowerCase());

  let notRelatedToPersonalInfo = true;
  if (personalInfo) {
    const lowerPassword = password.toLowerCase();
    const { firstName, lastName, email, username, phone } = personalInfo;
    
    // Check if password contains personal information
    if (firstName && firstName.length > 2 && lowerPassword.includes(firstName.toLowerCase())) {
      notRelatedToPersonalInfo = false;
    }
    if (lastName && lastName.length > 2 && lowerPassword.includes(lastName.toLowerCase())) {
      notRelatedToPersonalInfo = false;
    }
    if (email) {
      const emailParts = email.toLowerCase().split('@');
      if (emailParts[0] && emailParts[0].length > 2 && lowerPassword.includes(emailParts[0])) {
        notRelatedToPersonalInfo = false;
      }
    }
    if (username && username.length > 2 && lowerPassword.includes(username.toLowerCase())) {
      notRelatedToPersonalInfo = false;
    }
    if (phone && lowerPassword.includes(phone.replace(/\D/g, ''))) {
      notRelatedToPersonalInfo = false;
    }
  }

  const isValid = hasUppercase && 
                  hasLowercase && 
                  hasNumber && 
                  hasSpecialChar && 
                  hasMinLength && 
                  hasMaxLength &&
                  notRelatedToPersonalInfo &&
                  noSequentialChars &&
                  noCommonPatterns;

  return {
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecialChar,
    hasMinLength,
    hasMaxLength,
    notRelatedToPersonalInfo,
    noSequentialChars,
    noCommonPatterns,
    isValid
  };
};

export const getPasswordStrength = (validation: PasswordValidation): 'weak' | 'medium' | 'strong' => {
  const validCount = Object.values(validation).filter(v => v === true).length - 1; // Exclude isValid
  
  if (validCount <= 4) return 'weak';
  if (validCount <= 7) return 'medium';
  return 'strong';
};

export const getPasswordRequirements = (): string[] => {
  return [
    'At least 12 characters long',
    'At least one uppercase letter (A-Z)',
    'At least one lowercase letter (a-z)',
    'At least one number (0-9)',
    'At least one special character (!@#$%^&*)',
    'No more than 128 characters',
    'Must not contain personal information',
    'Must not contain sequential characters (abc, 123)',
    'Must not contain common weak patterns'
  ];
};

export const getPasswordErrors = (validation: PasswordValidation): string[] => {
  const errors: string[] = [];
  
  if (!validation.hasMinLength) errors.push('Password must be at least 12 characters long');
  if (!validation.hasMaxLength) errors.push('Password must not exceed 128 characters');
  if (!validation.hasUppercase) errors.push('Password must contain at least one uppercase letter');
  if (!validation.hasLowercase) errors.push('Password must contain at least one lowercase letter');
  if (!validation.hasNumber) errors.push('Password must contain at least one number');
  if (!validation.hasSpecialChar) errors.push('Password must contain at least one special character');
  if (!validation.notRelatedToPersonalInfo) errors.push('Password must not contain personal information');
  if (!validation.noSequentialChars) errors.push('Password must not contain sequential characters');
  if (!validation.noCommonPatterns) errors.push('Password contains common weak patterns');
  
  return errors;
};