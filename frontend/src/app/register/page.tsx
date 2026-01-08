'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { User, Mail, Key, ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PasswordInput from '@/components/ui/PasswordInput';
import ConfirmPasswordInput from '@/components/ui/ConfirmPasswordInput';
import PublicNavbar from '@/components/layout/PublicNavbar';
import PublicFooter from '@/components/layout/PublicFooter';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { PasswordValidation } from '@/utils/passwordValidation';

interface RegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidation | null>(null);
  
  const { register, handleSubmit, formState: { errors }, watch } = useForm<RegisterForm>();
  
  const [firstName, lastName, email, username] = watch(['firstName', 'lastName', 'email', 'username']);

  // Stable callback for password validation
  const handlePasswordValidationChange = useCallback((validation: PasswordValidation) => {
    setPasswordValidation(validation);
  }, []);

  // Memoize personal info object to prevent unnecessary re-renders
  const personalInfo = useMemo(() => ({
    firstName: firstName || '',
    lastName: lastName || '',
    email: email || '',
    username: username || ''
  }), [firstName, lastName, email, username]);

  const onSubmit = async (data: RegisterForm) => {
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
      
      const registrationData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        username: data.username,
        password: password
      };

      await api.post('/registration/register', registrationData);
      
      toast.success('Registration request submitted successfully! Please wait for admin approval.');
      
      // Redirect to login page
      router.push('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicNavbar />
      
      <div className="flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-center text-2xl sm:text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Submit a registration request for admin approval
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-6 sm:py-8 px-4 sm:px-6 lg:px-10 shadow sm:rounded-lg">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              </div>

              {/* Email */}
              <Input
                label="Email Address"
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

              {/* Username */}
              <Input
                label="Username"
                {...register('username', { required: 'Username is required' })}
                error={errors.username?.message}
                placeholder="Choose a username"
                required
              />

              {/* Password */}
              <PasswordInput
                label="Password"
                value={password}
                onChange={setPassword}
                onValidationChange={handlePasswordValidationChange}
                personalInfo={personalInfo}
                placeholder="Create a secure password"
                required
              />

              {/* Confirm Password */}
              <ConfirmPasswordInput
                label="Confirm Password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                originalPassword={password}
                placeholder="Re-enter your password"
                required
              />

              {/* Information Note */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Registration Process</h4>
                <p className="text-sm text-blue-800 leading-relaxed">
                  Your registration request will be sent to the administrator for approval. 
                  You will be able to login once your account is approved and an employee ID is assigned to you.
                </p>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                loading={loading}
                disabled={!passwordValidation?.isValid || password !== confirmPassword}
                className="w-full"
              >
                Submit Registration Request
              </Button>
            </form>

            {/* Back to Login */}
            <div className="mt-6">
              <button
                onClick={() => router.push('/login')}
                className="w-full flex justify-center items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <PublicFooter />
    </div>
  );
}