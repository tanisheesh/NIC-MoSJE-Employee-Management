'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PasswordInput from '@/components/ui/PasswordInput';
import EmployeeIdInput from '@/components/ui/EmployeeIdInput';
import ConfirmPasswordInput from '@/components/ui/ConfirmPasswordInput';
import { isAuthenticated, isAdmin } from '@/lib/auth';
import api from '@/lib/api';
import { PasswordValidation } from '@/utils/passwordValidation';

interface EmployeeForm {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export default function AddEmployeePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidation | null>(null);
  
  const { register, handleSubmit, formState: { errors }, watch } = useForm<EmployeeForm>();
  
  const [firstName, lastName, email, username, phone] = watch(['firstName', 'lastName', 'email', 'username', 'phone']);

  useEffect(() => {
    if (!isAuthenticated() || !isAdmin()) {
      router.push('/login');
      return;
    }
  }, [router]);

  // Stable callback for password validation
  const handlePasswordValidationChange = useCallback((validation: PasswordValidation) => {
    setPasswordValidation(validation);
  }, []);

  // Memoize personal info object to prevent unnecessary re-renders
  const personalInfo = useMemo(() => ({
    firstName: firstName || '',
    lastName: lastName || '',
    email: email || '',
    username: username || '',
    phone: phone || ''
  }), [firstName, lastName, email, username, phone]);

  const onSubmit = async (data: EmployeeForm) => {
    // Validate employee ID
    if (!employeeId || employeeId.length !== 3) {
      toast.error('Employee ID must be exactly 3 digits');
      return;
    }

    // Validate phone number
    if (!data.phone || data.phone.length !== 10) {
      toast.error('Phone number must be exactly 10 digits');
      return;
    }

    // Validate password
    if (!passwordValidation?.isValid) {
      toast.error('Please ensure password meets all requirements');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      
      const employeeData = {
        employeeId: employeeId, // Store only the 3-digit number
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        username: data.username,
        phone: data.phone,
        password: password,
        // Personal info fields are optional and can be updated later
        department: 'General', // Default department
        position: 'Employee' // Default position
      };

      const response = await api.post('/employees', employeeData);
      const createdEmployee = response.data;
      
      toast.success('Employee added successfully!');
      
      // Redirect to the created employee's detail page
      router.push(`/admin/employees/${createdEmployee.id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add employee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Add New Employee">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Add New Employee</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Create a new employee account with basic information</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Employee Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <EmployeeIdInput
                  label="Employee ID"
                  value={employeeId}
                  onChange={setEmployeeId}
                  placeholder="001"
                  required
                />
                
                <Input
                  label="Username"
                  {...register('username', { required: 'Username is required' })}
                  error={errors.username?.message}
                  placeholder="Enter username for login"
                  required
                />
                
                <Input
                  label="First Name"
                  {...register('firstName', { required: 'First name is required' })}
                  error={errors.firstName?.message}
                  placeholder="Enter first name"
                  required
                />
                
                <Input
                  label="Last Name"
                  {...register('lastName', { required: 'Last name is required' })}
                  error={errors.lastName?.message}
                  placeholder="Enter last name"
                  required
                />
                
                <Input
                  label="Email"
                  type="email"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  error={errors.email?.message}
                  placeholder="Enter email address"
                  required
                />
                
                <Input
                  label="Phone"
                  type="tel"
                  {...register('phone', { 
                    required: 'Phone is required',
                    pattern: {
                      value: /^\d{10}$/,
                      message: 'Phone number must be exactly 10 digits'
                    }
                  })}
                  error={errors.phone?.message}
                  placeholder="Enter 10-digit phone number"
                  maxLength={10}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                    e.target.value = value;
                  }}
                  required
                />
              </div>
            </div>

            {/* Account Information */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <PasswordInput
                  label="Initial Password"
                  value={password}
                  onChange={setPassword}
                  onValidationChange={handlePasswordValidationChange}
                  personalInfo={personalInfo}
                  placeholder="Enter a secure password"
                  required
                />
                
                <ConfirmPasswordInput
                  label="Confirm Password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  originalPassword={password}
                  placeholder="Re-enter the password"
                  required
                />
              </div>
              <p className="text-xs sm:text-sm text-gray-600 mt-3 leading-relaxed">
                The employee can update their profile and change this password after their first login.
              </p>
            </div>

            {/* Information Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
              <h4 className="text-xs sm:text-sm font-medium text-blue-900 mb-2">Additional Information</h4>
              <p className="text-xs sm:text-sm text-blue-800 leading-relaxed">
                Other details like date of birth, department, position, and personal information can be added and updated 
                after the employee account is created. The employee will be able to update their personal 
                information through their profile page.
              </p>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/employees')}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                loading={loading}
                disabled={!passwordValidation?.isValid || password !== confirmPassword || !employeeId || employeeId.length !== 3}
                className="w-full sm:w-auto order-1 sm:order-2"
              >
                Add Employee
              </Button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}