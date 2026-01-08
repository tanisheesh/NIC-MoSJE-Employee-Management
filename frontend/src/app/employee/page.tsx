'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, Edit, Calendar, Phone, Mail, 
  Briefcase, FileText, Key, MapPin, Save, X, Eye, EyeOff
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { isAuthenticated, isEmployee, getUser } from '@/lib/auth';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { INDIAN_STATES } from '@/constants/indianStates';

export default function EmployeeProfile() {
  const router = useRouter();
  const user = getUser();
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editingSections, setEditingSections] = useState({
    contact: false,
    personal: false,
    address: false,
    password: false
  });
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [editForm, setEditForm] = useState({
    email: '',
    personalEmail: '',
    phone: '',
    username: '',
    newPassword: '',
    confirmPassword: '',
    dateOfBirth: '',
    marriageAnniversary: '',
    // Address fields
    address: '',
    landmark: '',
    city: '',
    district: '',
    state: '',
    pincode: ''
  });

  useEffect(() => {
    if (!isAuthenticated() || !isEmployee()) {
      router.push('/login');
      return;
    }

    fetchEmployee();
  }, [router]);

  const fetchEmployee = async () => {
    try {
      const response = await api.get(`/employees/user/${user?.id}`);
      const employeeData = response.data;
      setEmployee(employeeData);
      
      // Initialize edit form with current data
      setEditForm({
        email: employeeData.email || '',
        personalEmail: employeeData.personalEmail || '',
        phone: employeeData.phone || '',
        username: employeeData.username || '',
        newPassword: '',
        confirmPassword: '',
        dateOfBirth: employeeData.dateOfBirth || '',
        marriageAnniversary: employeeData.marriageAnniversary || '',
        address: employeeData.address || '',
        landmark: employeeData.landmark || '',
        city: employeeData.city || '',
        district: employeeData.district || '',
        state: employeeData.state || '',
        pincode: employeeData.pincode || ''
      });
    } catch (error) {
      console.error('Error fetching employee:', error);
      toast.error('Failed to fetch profile data');
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = (password: string) => {
    const errors = [];
    if (password.length < 12) errors.push('At least 12 characters');
    if (!/[A-Z]/.test(password)) errors.push('At least one uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('At least one lowercase letter');
    if (!/\d/.test(password)) errors.push('At least one number');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('At least one special character');
    
    // Check for sequential characters
    const hasSequential = /(.)\1{2,}|012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i.test(password);
    if (hasSequential) errors.push('Cannot contain sequential characters');
    
    // Check for common weak patterns
    const weakPatterns = [
      /password/i, /123456/, /qwerty/i, /admin/i, /welcome/i,
      /letmein/i, /monkey/i, /dragon/i, /master/i, /shadow/i
    ];
    if (weakPatterns.some(pattern => pattern.test(password))) {
      errors.push('Cannot contain common weak patterns');
    }
    
    // Check against personal info
    const personalInfo = [
      employee?.firstName?.toLowerCase(),
      employee?.lastName?.toLowerCase(),
      employee?.email?.toLowerCase(),
      employee?.username?.toLowerCase(),
      employee?.phone
    ].filter(Boolean);
    
    if (personalInfo.some(info => password.toLowerCase().includes(info))) {
      errors.push('Cannot contain personal information');
    }
    
    return errors;
  };

  const handlePasswordChange = (value: string) => {
    setEditForm(prev => ({ ...prev, newPassword: value }));
    setPasswordErrors(validatePassword(value));
  };

  const handleSectionEdit = (section: string) => {
    setEditingSections(prev => ({ ...prev, [section]: true }));
  };

  const handleSectionCancel = (section: string) => {
    setEditingSections(prev => ({ ...prev, [section]: false }));
    // Reset form to original values
    setEditForm({
      email: employee?.email || '',
      personalEmail: employee?.personalEmail || '',
      phone: employee?.phone || '',
      username: employee?.username || '',
      newPassword: '',
      confirmPassword: '',
      dateOfBirth: employee?.dateOfBirth || '',
      marriageAnniversary: employee?.marriageAnniversary || '',
      address: employee?.address || '',
      landmark: employee?.landmark || '',
      city: employee?.city || '',
      district: employee?.district || '',
      state: employee?.state || '',
      pincode: employee?.pincode || ''
    });
    setPasswordErrors([]);
    // Reset password visibility states
    if (section === 'password') {
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    }
  };

  const handleSectionSave = async (section: string) => {
    try {
      let updateData: any = {};

      if (section === 'contact') {
        updateData = {
          email: editForm.email,
          personalEmail: editForm.personalEmail,
          phone: editForm.phone,
          username: editForm.username
        };
      } else if (section === 'personal') {
        updateData = {
          dateOfBirth: editForm.dateOfBirth || null,
          marriageAnniversary: editForm.marriageAnniversary || null
        };
      } else if (section === 'address') {
        // Validate address fields
        const addressFields = [editForm.address, editForm.city, editForm.district, editForm.state, editForm.pincode];
        const hasAnyAddress = addressFields.some(field => field.trim());
        
        if (hasAnyAddress) {
          const requiredFields = [editForm.address, editForm.city, editForm.district, editForm.state, editForm.pincode];
          if (requiredFields.some(field => !field.trim())) {
            toast.error('Please fill all required address fields or leave all empty');
            return;
          }
          
          if (!/^\d{6}$/.test(editForm.pincode)) {
            toast.error('Pincode must be exactly 6 digits');
            return;
          }
        }
        
        updateData = {
          address: editForm.address || null,
          landmark: editForm.landmark || null,
          city: editForm.city || null,
          district: editForm.district || null,
          state: editForm.state || null,
          pincode: editForm.pincode || null
        };
      } else if (section === 'password') {
        if (!editForm.newPassword) {
          toast.error('Please enter a new password');
          return;
        }
        
        if (passwordErrors.length > 0) {
          toast.error('Please fix password validation errors');
          return;
        }
        
        if (editForm.newPassword !== editForm.confirmPassword) {
          toast.error('Passwords do not match');
          return;
        }
        
        updateData = { newPassword: editForm.newPassword };
      }

      await api.put(`/employees/${employee.id}/profile`, updateData);
      toast.success(`${section.charAt(0).toUpperCase() + section.slice(1)} updated successfully`);
      
      setEditingSections(prev => ({ ...prev, [section]: false }));
      
      // Reset password fields
      if (section === 'password') {
        setEditForm(prev => ({ ...prev, newPassword: '', confirmPassword: '' }));
        setPasswordErrors([]);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
      }
      
      // Refresh employee data
      fetchEmployee();
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to update ${section}`);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="My Profile">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My Profile">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-lg">
          <div className="flex items-center">
            <div className="h-16 w-16 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
              <User className="h-8 w-8" />
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-bold">
                {employee?.firstName} {employee?.lastName}
              </h1>
              <p className="text-blue-100">
                NIC-{employee?.employeeId?.padStart(3, '0')} • {employee?.position} • {employee?.department}
              </p>
              <p className="text-blue-200 text-sm">
                Status: <span className="capitalize">{employee?.status}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Contact Details Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Mail className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Contact Details</h3>
            </div>
            {!editingSections.contact ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSectionEdit('contact')}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSectionCancel('contact')}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSectionSave('contact')}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </div>
            )}
          </div>

          {!editingSections.contact ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Official Email</label>
                <p className="text-gray-900">{employee?.email || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Personal Email</label>
                <p className="text-gray-900">{employee?.personalEmail || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <p className="text-gray-900">{employee?.phone || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <p className="text-gray-900">{employee?.username || 'Not provided'}</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Official Email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                required
              />
              <Input
                label="Personal Email"
                type="email"
                value={editForm.personalEmail}
                onChange={(e) => setEditForm(prev => ({ ...prev, personalEmail: e.target.value }))}
              />
              <Input
                label="Phone"
                type="tel"
                value={editForm.phone}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  if (value.length <= 10) {
                    setEditForm(prev => ({ ...prev, phone: value }));
                  }
                }}
                maxLength={10}
                required
              />
              <Input
                label="Username"
                value={editForm.username}
                onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                required
              />
            </div>
          )}
        </div>

        {/* Personal Information Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-green-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
            </div>
            {!editingSections.personal ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSectionEdit('personal')}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSectionCancel('personal')}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSectionSave('personal')}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </div>
            )}
          </div>

          {!editingSections.personal ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <p className="text-gray-900">
                  {employee?.dateOfBirth ? format(new Date(employee.dateOfBirth), 'MMM dd, yyyy') : 'Not provided'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Marriage Anniversary</label>
                <p className="text-gray-900">
                  {employee?.marriageAnniversary ? format(new Date(employee.marriageAnniversary), 'MMM dd, yyyy') : 'Not provided'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Joining Date</label>
                <p className="text-gray-900">
                  {employee?.joiningDate ? format(new Date(employee.joiningDate), 'MMM dd, yyyy') : 'Not provided'}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Date of Birth"
                type="date"
                value={editForm.dateOfBirth}
                onChange={(e) => setEditForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
              />
              <Input
                label="Marriage Anniversary"
                type="date"
                value={editForm.marriageAnniversary}
                onChange={(e) => setEditForm(prev => ({ ...prev, marriageAnniversary: e.target.value }))}
              />
            </div>
          )}
        </div>

        {/* Address Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <MapPin className="h-5 w-5 text-purple-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Address Information</h3>
            </div>
            {!editingSections.address ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSectionEdit('address')}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSectionCancel('address')}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSectionSave('address')}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </div>
            )}
          </div>

          {!editingSections.address ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <p className="text-gray-900">{employee?.address || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Landmark</label>
                <p className="text-gray-900">{employee?.landmark || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <p className="text-gray-900">{employee?.city || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                <p className="text-gray-900">{employee?.district || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <p className="text-gray-900">{employee?.state || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                <p className="text-gray-900">{employee?.pincode || 'Not provided'}</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Address"
                value={editForm.address}
                onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
              />
              <Input
                label="Landmark (Optional)"
                value={editForm.landmark}
                onChange={(e) => setEditForm(prev => ({ ...prev, landmark: e.target.value }))}
              />
              <Input
                label="City"
                value={editForm.city}
                onChange={(e) => setEditForm(prev => ({ ...prev, city: e.target.value }))}
              />
              <Input
                label="District"
                value={editForm.district}
                onChange={(e) => setEditForm(prev => ({ ...prev, district: e.target.value }))}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <select
                  value={editForm.state}
                  onChange={(e) => setEditForm(prev => ({ ...prev, state: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                >
                  <option value="">Select State</option>
                  {INDIAN_STATES.map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
              <Input
                label="Pincode"
                value={editForm.pincode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  if (value.length <= 6) {
                    setEditForm(prev => ({ ...prev, pincode: value }));
                  }
                }}
                maxLength={6}
              />
            </div>
          )}
        </div>

        {/* Password & Security Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Key className="h-5 w-5 text-red-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Password & Security</h3>
            </div>
            {!editingSections.password ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSectionEdit('password')}
              >
                <Edit className="h-4 w-4 mr-2" />
                Change Password
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSectionCancel('password')}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSectionSave('password')}
                  disabled={passwordErrors.length > 0 || !editForm.newPassword}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Update Password
                </Button>
              </div>
            )}
          </div>

          {!editingSections.password ? (
            <p className="text-gray-600">Click "Change Password" to update your password</p>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <Input
                  label="New Password"
                  type={showNewPassword ? "text" : "password"}
                  value={editForm.newPassword}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-8 text-gray-500 hover:text-gray-700"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              
              {editForm.newPassword && (
                <div className="text-sm">
                  <p className="font-medium text-gray-700 mb-2">Password Requirements:</p>
                  <ul className="space-y-1">
                    {[
                      'At least 12 characters',
                      'At least one uppercase letter',
                      'At least one lowercase letter', 
                      'At least one number',
                      'At least one special character',
                      'Cannot contain sequential characters',
                      'Cannot contain common weak patterns',
                      'Cannot contain personal information'
                    ].map((req, index) => (
                      <li key={index} className={`flex items-center ${
                        passwordErrors.includes(req) ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {passwordErrors.includes(req) ? '✗' : '✓'} {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="relative">
                <Input
                  label="Confirm New Password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={editForm.confirmPassword}
                  onChange={(e) => setEditForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-8 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              
              {editForm.confirmPassword && editForm.newPassword !== editForm.confirmPassword && (
                <p className="text-red-600 text-sm">Passwords do not match</p>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}