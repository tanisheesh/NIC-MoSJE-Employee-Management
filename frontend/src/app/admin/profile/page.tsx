'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Key, Edit, Save, X } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { isAuthenticated, isAdmin, getUser } from '@/lib/auth';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminProfilePage() {
  const router = useRouter();
  const user = getUser();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState({
    personal: false,
    password: false
  });
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!isAuthenticated() || !isAdmin()) {
      router.push('/login');
      return;
    }
  }, [router]);

  useEffect(() => {
    // Initialize form with user data - separate useEffect to avoid infinite loop
    if (user) {
      setFormData(prev => ({
        ...prev,
        firstName: user.profile?.firstName || '',
        lastName: user.profile?.lastName || '',
        email: user.email || '',
        username: user.username || ''
      }));
    }
  }, []); // Empty dependency array since user data doesn't change

  const validatePassword = (password: string) => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    // Check if password contains personal information
    const personalInfo = [
      formData.firstName?.toLowerCase(),
      formData.lastName?.toLowerCase(),
      formData.email?.toLowerCase(),
      formData.username?.toLowerCase()
    ].filter(Boolean);
    
    const lowerPassword = password.toLowerCase();
    
    for (const info of personalInfo) {
      if (info && info.length > 2 && lowerPassword.includes(info)) {
        errors.push('Password should not contain personal information');
        break;
      }
    }
    
    return errors;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value;
    setFormData(prev => ({ ...prev, newPassword: password }));
    
    if (password) {
      const errors = validatePassword(password);
      setPasswordErrors(errors);
    } else {
      setPasswordErrors([]);
    }
  };

  const handlePersonalInfoSave = async () => {
    try {
      setLoading(true);
      
      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        username: formData.username
      };

      await api.put('/auth/profile', updateData);
      toast.success('Profile updated successfully');
      setEditing(prev => ({ ...prev, personal: false }));
      
      // Refresh the page to update the user data
      window.location.reload();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSave = async () => {
    try {
      if (formData.newPassword !== formData.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }

      if (passwordErrors.length > 0) {
        toast.error('Please fix password validation errors');
        return;
      }

      setLoading(true);
      
      await api.put('/auth/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      
      toast.success('Password updated successfully');
      setEditing(prev => ({ ...prev, password: false }));
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      setPasswordErrors([]);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = (section: 'personal' | 'password') => {
    setEditing(prev => ({ ...prev, [section]: false }));
    
    if (section === 'personal') {
      // Reset to original values
      setFormData(prev => ({
        ...prev,
        firstName: user?.profile?.firstName || '',
        lastName: user?.profile?.lastName || '',
        email: user?.email || '',
        username: user?.username || ''
      }));
    } else {
      // Reset password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      setPasswordErrors([]);
    }
  };

  return (
    <DashboardLayout title="Admin Profile">
      <div className="max-w-4xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              <User className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                {user?.profile?.firstName} {user?.profile?.lastName}
              </h1>
              <p className="text-gray-600">System Administrator</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
            {!editing.personal ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(prev => ({ ...prev, personal: true }))}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCancel('personal')}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handlePersonalInfoSave}
                  loading={loading}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              {editing.personal ? (
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="Enter first name"
                  required
                />
              ) : (
                <div className="flex items-center">
                  <User className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                  <span className="text-gray-900">{user?.profile?.firstName || 'Not set'}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              {editing.personal ? (
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Enter last name"
                  required
                />
              ) : (
                <div className="flex items-center">
                  <User className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                  <span className="text-gray-900">{user?.profile?.lastName || 'Not set'}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              {editing.personal ? (
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                  required
                />
              ) : (
                <div className="flex items-center">
                  <Mail className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                  <span className="text-gray-900 break-all">{user?.email || 'Not set'}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username <span className="text-red-500">*</span>
              </label>
              {editing.personal ? (
                <Input
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Enter username"
                  required
                />
              ) : (
                <div className="flex items-center">
                  <User className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                  <span className="text-gray-900 break-all">{user?.username || 'Not set'}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Password & Security */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <h3 className="text-lg font-semibold text-gray-900">Password & Security</h3>
            {!editing.password ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(prev => ({ ...prev, password: true }))}
              >
                <Edit className="h-4 w-4 mr-2" />
                Change Password
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCancel('password')}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handlePasswordSave}
                  loading={loading}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Update Password
                </Button>
              </div>
            )}
          </div>
          
          {editing.password ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="password"
                    value={formData.currentPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder="Enter current password"
                    required
                  />
                </div>

                <div></div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="password"
                    value={formData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter new password"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirm new password"
                    required
                  />
                  {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
                  )}
                </div>
              </div>

              {/* Real-time Password Validation */}
              {formData.newPassword && (
                <div className={`border rounded-lg p-3 ${
                  passwordErrors.length === 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}>
                  <h4 className={`text-sm font-medium mb-2 ${
                    passwordErrors.length === 0 ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {passwordErrors.length === 0 ? '✓ Password Requirements Met' : 'Password Requirements:'}
                  </h4>
                  {passwordErrors.length > 0 ? (
                    <ul className="text-xs text-red-700 space-y-1">
                      {passwordErrors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-green-800">All password requirements are satisfied</p>
                  )}
                </div>
              )}

              {/* Password Requirements Guide */}
              {!formData.newPassword && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">Password Requirements:</h4>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• At least 8 characters long</li>
                    <li>• Contains uppercase and lowercase letters</li>
                    <li>• Contains at least one number</li>
                    <li>• Contains at least one special character</li>
                    <li>• Should not contain personal information</li>
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center">
              <Key className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
              <span className="text-gray-500">••••••••</span>
              <span className="ml-4 text-sm text-gray-600">Click "Change Password" to update</span>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}