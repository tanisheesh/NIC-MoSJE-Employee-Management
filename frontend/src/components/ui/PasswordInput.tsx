import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { validatePassword, getPasswordStrength, PasswordValidation } from '@/utils/passwordValidation';

interface PasswordInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (validation: PasswordValidation) => void;
  error?: string;
  showValidation?: boolean;
  personalInfo?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
  placeholder?: string;
  required?: boolean;
}

const PasswordInput: React.FC<PasswordInputProps> = ({
  label,
  value,
  onChange,
  onValidationChange,
  error,
  showValidation = true,
  personalInfo,
  placeholder,
  required = false
}) => {
  const [showPassword, setShowPassword] = useState(false);
  
  // Memoize validation to prevent unnecessary recalculations
  const validation = useMemo(() => {
    if (!value) {
      return {
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false,
        hasSpecialChar: false,
        hasMinLength: false,
        hasMaxLength: true,
        notRelatedToPersonalInfo: true,
        noSequentialChars: true,
        noCommonPatterns: true,
        isValid: false
      };
    }
    return validatePassword(value, personalInfo);
  }, [value, personalInfo]);

  // Notify parent of validation changes
  useEffect(() => {
    onValidationChange?.(validation);
  }, [validation, onValidationChange]);

  const strength = getPasswordStrength(validation);

  const getStrengthColor = () => {
    switch (strength) {
      case 'weak': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'strong': return 'bg-green-500';
      default: return 'bg-gray-300';
    }
  };

  const getStrengthWidth = () => {
    switch (strength) {
      case 'weak': return 'w-1/3';
      case 'medium': return 'w-2/3';
      case 'strong': return 'w-full';
      default: return 'w-0';
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 bg-white ${
            error ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>

      {/* Password Strength Indicator */}
      {value && showValidation && (
        <div className="mt-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600">Password Strength:</span>
            <span className={`text-xs font-medium ${
              strength === 'weak' ? 'text-red-600' : 
              strength === 'medium' ? 'text-yellow-600' : 'text-green-600'
            }`}>
              {strength.charAt(0).toUpperCase() + strength.slice(1)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor()} ${getStrengthWidth()}`}></div>
          </div>
        </div>
      )}

      {/* Validation Rules */}
      {value && showValidation && (
        <div className="mt-3 space-y-1">
          <ValidationRule 
            isValid={validation.hasMinLength} 
            text="At least 12 characters" 
          />
          <ValidationRule 
            isValid={validation.hasMaxLength} 
            text="No more than 128 characters" 
          />
          <ValidationRule 
            isValid={validation.hasUppercase} 
            text="One uppercase letter (A-Z)" 
          />
          <ValidationRule 
            isValid={validation.hasLowercase} 
            text="One lowercase letter (a-z)" 
          />
          <ValidationRule 
            isValid={validation.hasNumber} 
            text="One number (0-9)" 
          />
          <ValidationRule 
            isValid={validation.hasSpecialChar} 
            text="One special character (!@#$%^&*)" 
          />
          <ValidationRule 
            isValid={validation.notRelatedToPersonalInfo} 
            text="Not related to personal information" 
          />
          <ValidationRule 
            isValid={validation.noSequentialChars} 
            text="No sequential characters (abc, 123)" 
          />
          <ValidationRule 
            isValid={validation.noCommonPatterns} 
            text="No common weak patterns" 
          />
        </div>
      )}

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

const ValidationRule: React.FC<{ isValid: boolean; text: string }> = ({ isValid, text }) => (
  <div className="flex items-center space-x-2">
    {isValid ? (
      <Check className="h-4 w-4 text-green-500" />
    ) : (
      <X className="h-4 w-4 text-red-500" />
    )}
    <span className={`text-xs ${isValid ? 'text-green-600' : 'text-red-600'}`}>
      {text}
    </span>
  </div>
);

export default PasswordInput;