import React, { useState } from 'react';
import { Eye, EyeOff, Check, X } from 'lucide-react';

interface ConfirmPasswordInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  originalPassword: string;
  error?: string;
  placeholder?: string;
  required?: boolean;
}

const ConfirmPasswordInput: React.FC<ConfirmPasswordInputProps> = ({
  label,
  value,
  onChange,
  originalPassword,
  error,
  placeholder,
  required = false
}) => {
  const [showPassword, setShowPassword] = useState(false);
  
  const passwordsMatch = value === originalPassword;
  const showValidation = value.length > 0;

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
            error ? 'border-red-500' : 
            showValidation ? (passwordsMatch ? 'border-green-500' : 'border-red-500') : 'border-gray-300'
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

      {/* Password Match Indicator */}
      {showValidation && (
        <div className="mt-2 flex items-center space-x-2">
          {passwordsMatch ? (
            <>
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-xs text-green-600">Passwords match</span>
            </>
          ) : (
            <>
              <X className="h-4 w-4 text-red-500" />
              <span className="text-xs text-red-600">Passwords do not match</span>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default ConfirmPasswordInput;