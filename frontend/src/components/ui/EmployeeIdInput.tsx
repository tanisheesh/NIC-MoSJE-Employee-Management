import React from 'react';

interface EmployeeIdInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
}

const EmployeeIdInput: React.FC<EmployeeIdInputProps> = ({
  label,
  value,
  onChange,
  error,
  placeholder = "001",
  required = false
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Only allow numeric input and limit to 3 digits
    if (/^\d{0,3}$/.test(inputValue)) {
      onChange(inputValue);
    }
  };

  const displayValue = value ? `NIC-${value.padStart(3, '0')}` : '';

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className="text-gray-500 text-sm font-medium">NIC-</span>
        </div>
        <input
          type="text"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          maxLength={3}
          className={`w-full pl-12 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 bg-white ${
            error ? 'border-red-500' : 'border-gray-300'
          }`}
        />
      </div>
      
      {value && (
        <p className="mt-1 text-xs text-gray-600">
          Employee ID will be: <span className="font-medium text-blue-600">{displayValue}</span>
        </p>
      )}
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default EmployeeIdInput;