'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  User, Edit, Trash2, Calendar, Phone, Mail, Users, 
  Briefcase, FileText, Plus, CheckCircle, XCircle, 
  AlertTriangle, Eye, EyeOff, Key, MapPin
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import DocumentModal from '@/components/ui/DocumentModal';
import DocumentViewer from '@/components/ui/DocumentViewer';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { isAuthenticated, isAdmin } from '@/lib/auth';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import Cookies from 'js-cookie';
import { INDIAN_STATES } from '@/constants/indianStates';

export default function EmployeeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editingSections, setEditingSections] = useState({
    contact: false,
    employee: false,
    personal: false,
    address: false,
    password: false
  });
  const [departments, setDepartments] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [filteredPositions, setFilteredPositions] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [documentCategories, setDocumentCategories] = useState<any[]>([]);
  const [documentTypes, setDocumentTypes] = useState<any[]>([]);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState<any>(null);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<any>(null);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [editForm, setEditForm] = useState({
    email: '',
    personalEmail: '',
    phone: '',
    username: '',
    newPassword: '',
    confirmPassword: '',
    departmentId: '',
    positionId: '',
    dateOfBirth: '',
    marriageAnniversary: '',
    joiningDate: '',
    leavingDate: '',
    currentlyWorking: true,
    // Address fields
    address: '',
    landmark: '',
    city: '',
    district: '',
    state: '',
    pincode: ''
  });

  useEffect(() => {
    if (!isAuthenticated() || !isAdmin()) {
      router.push('/login');
      return;
    }

    if (params.id) {
      fetchEmployee();
      fetchDepartments();
      fetchPositions();
      fetchDocuments();
      fetchDocumentCategories();
      fetchDocumentTypes();
    }
  }, [router, params.id]);

  useEffect(() => {
    if (editForm.departmentId) {
      const filtered = positions.filter(pos => 
        pos.departmentId === parseInt(editForm.departmentId) || pos.departmentId === null
      );
      setFilteredPositions(filtered);
      
      // Reset position if current position doesn't belong to selected department
      if (editForm.positionId && !filtered.find(p => p.id === parseInt(editForm.positionId))) {
        setEditForm(prev => ({ ...prev, positionId: '' }));
      }
    } else {
      setFilteredPositions(positions.filter(pos => pos.departmentId === null));
    }
  }, [editForm.departmentId, positions]);

  const fetchEmployee = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/employees/${params.id}`);
      const emp = response.data;
      setEmployee(emp);
      
      // Initialize edit form
      setEditForm({
        email: emp.email || '',
        personalEmail: emp.personalEmail || '',
        phone: emp.phone || '',
        username: emp.username || emp.user?.username || '',
        newPassword: '',
        confirmPassword: '',
        departmentId: emp.departmentId || '',
        positionId: emp.positionId || '',
        dateOfBirth: emp.dateOfBirth || '',
        marriageAnniversary: emp.marriageAnniversary || '',
        joiningDate: emp.joiningDate || '',
        leavingDate: emp.leavingDate || '',
        currentlyWorking: !emp.leavingDate,
        // Address fields
        address: emp.address || '',
        landmark: emp.landmark || '',
        city: emp.city || '',
        district: emp.district || '',
        state: emp.state || '',
        pincode: emp.pincode || ''
      });
    } catch (error) {
      toast.error('Failed to fetch employee details');
      router.push('/admin/employees');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments');
      setDepartments(response.data);
    } catch (error) {
      console.error('Failed to fetch departments');
    }
  };

  const fetchPositions = async () => {
    try {
      const response = await api.get('/positions');
      setPositions(response.data);
    } catch (error) {
      console.error('Failed to fetch positions');
    }
  };

  const fetchDocuments = async () => {
    try {
      const response = await api.get(`/documents/employee/${params.id}`);
      setDocuments(response.data);
    } catch (error) {
      console.error('Failed to fetch documents');
    }
  };

  const fetchDocumentCategories = async () => {
    try {
      const response = await api.get('/documents/categories');
      setDocumentCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch document categories');
    }
  };

  const fetchDocumentTypes = async () => {
    try {
      const response = await api.get('/documents/types');
      setDocumentTypes(response.data);
    } catch (error) {
      console.error('Failed to fetch document types');
    }
  };

  const handleSave = async () => {
    try {
      const updateData = {
        ...editForm,
        leavingDate: editForm.currentlyWorking ? null : editForm.leavingDate
      };
      
      await api.put(`/employees/${employee.id}`, updateData);
      toast.success('Employee updated successfully');
      setEditing(false);
      fetchEmployee();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update employee');
    }
  };

  const handleSectionEdit = (section: string) => {
    setEditingSections(prev => ({ ...prev, [section]: true }));
  };

  const handleSectionCancel = (section: string) => {
    setEditingSections(prev => ({ ...prev, [section]: false }));
    
    // Reset password visibility states when cancelling password section
    if (section === 'password') {
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    }
    
    // Reset form to current employee data
    setEditForm({
      email: employee.email || '',
      personalEmail: employee.personalEmail || '',
      phone: employee.phone || '',
      username: employee.username || employee.user?.username || '',
      newPassword: '',
      confirmPassword: '',
      departmentId: employee.departmentId || '',
      positionId: employee.positionId || '',
      dateOfBirth: employee.dateOfBirth || '',
      marriageAnniversary: employee.marriageAnniversary || '',
      joiningDate: employee.joiningDate || '',
      leavingDate: employee.leavingDate || '',
      currentlyWorking: !employee.leavingDate,
      // Address fields
      address: employee.address || '',
      landmark: employee.landmark || '',
      city: employee.city || '',
      district: employee.district || '',
      state: employee.state || '',
      pincode: employee.pincode || ''
    });
  };

  const handleSectionSave = async (section: string) => {
    try {
      let updateData: any = {};
      
      // Only include fields relevant to the section being edited
      if (section === 'contact') {
        if (!editForm.email || !editForm.username || !editForm.phone) {
          toast.error('Official email, username, and phone number are required');
          return;
        }
        if (editForm.phone.length !== 10) {
          toast.error('Phone number must be exactly 10 digits');
          return;
        }
        updateData = {
          email: editForm.email,
          personalEmail: editForm.personalEmail || null,
          phone: editForm.phone,
          username: editForm.username
        };
      } else if (section === 'password') {
        if (editForm.newPassword !== editForm.confirmPassword) {
          toast.error('Passwords do not match');
          return;
        }
        if (!editForm.newPassword) {
          toast.error('New password is required');
          return;
        }
        if (passwordErrors.length > 0) {
          toast.error('Please fix password validation errors');
          return;
        }
        
        // Use dedicated password reset endpoint
        await api.put(`/employees/${employee.id}/reset-password`, {
          newPassword: editForm.newPassword
        });
        toast.success('Password reset successfully');
        setEditingSections(prev => ({ ...prev, [section]: false }));
        setEditForm(prev => ({ ...prev, newPassword: '', confirmPassword: '' }));
        setShowNewPassword(false);
        setShowConfirmPassword(false);
        return; // Early return to avoid the general update call
      } else if (section === 'employee') {
        updateData = {
          departmentId: editForm.departmentId || null,
          positionId: editForm.positionId || null
        };
      } else if (section === 'personal') {
        // Check if leaving date is set and automatically set status to retired
        const leavingDate = editForm.currentlyWorking ? null : editForm.leavingDate || null;
        let status = employee.status; // Keep current status by default
        
        if (leavingDate) {
          const today = new Date();
          const leaving = new Date(leavingDate);
          if (leaving <= today) {
            status = 'retired';
          }
        } else if (employee.status === 'retired') {
          // If removing leaving date, change from retired to active
          status = 'active';
        }
        
        updateData = {
          dateOfBirth: editForm.dateOfBirth || null,
          marriageAnniversary: editForm.marriageAnniversary || null,
          joiningDate: editForm.joiningDate || null,
          leavingDate: leavingDate,
          status: status
        };
      } else if (section === 'address') {
        // Address validation: if any field is filled, all required fields must be filled
        const addressFields = [editForm.address, editForm.city, editForm.district, editForm.state, editForm.pincode];
        const hasAnyAddressData = addressFields.some(field => field && field.trim() !== '');
        
        if (hasAnyAddressData) {
          // Check required fields
          if (!editForm.address || !editForm.city || !editForm.district || !editForm.state || !editForm.pincode) {
            toast.error('Please fill all address fields: Address, City, District, State, and Pincode');
            return;
          }
          
          // Validate pincode
          if (editForm.pincode.length !== 6 || !/^\d{6}$/.test(editForm.pincode)) {
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
      }
      
      await api.put(`/employees/${employee.id}`, updateData);
      toast.success('Employee updated successfully');
      setEditingSections(prev => ({ ...prev, [section]: false }));
      fetchEmployee();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update employee');
    }
  };

  const handleDocumentSuccess = () => {
    fetchDocuments();
    setShowDocumentModal(false);
    setSelectedDocument(null);
    setSelectedDocumentType(null);
  };

  const validatePassword = (password: string) => {
    const errors: string[] = [];
    
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
    if (employee) {
      const personalInfo = [
        employee.firstName?.toLowerCase(),
        employee.lastName?.toLowerCase(),
        employee.email?.toLowerCase(),
        employee.username?.toLowerCase() || employee.user?.username?.toLowerCase(),
        employee.phone
      ].filter(Boolean);
      
      const lowerPassword = password.toLowerCase();
      
      for (const info of personalInfo) {
        if (info && info.length > 2 && lowerPassword.includes(info)) {
          if (info === employee.firstName?.toLowerCase()) {
            errors.push('Password must not contain your first name');
          } else if (info === employee.lastName?.toLowerCase()) {
            errors.push('Password must not contain your last name');
          } else if (info === employee.email?.toLowerCase().split('@')[0]) {
            errors.push('Password must not contain your email username');
          } else if (info === employee.username?.toLowerCase() || info === employee.user?.username?.toLowerCase()) {
            errors.push('Password must not contain your username');
          } else if (info === employee.phone) {
            errors.push('Password must not contain your phone number');
          }
          break;
        }
      }
    }
    
    // Check for sequential characters
    const hasSequential = (str: string) => {
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
    
    return errors;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value;
    setEditForm(prev => ({ ...prev, newPassword: password }));
    
    if (password) {
      const errors = validatePassword(password);
      setPasswordErrors(errors);
    } else {
      setPasswordErrors([]);
    }
  };

  const handleDocumentDownload = async (documentId: number) => {
    try {
      const response = await api.get(`/documents/download/${documentId}`, {
        responseType: 'blob'
      });
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from response headers or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'document';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to download document');
    }
  };

  const handleDocumentView = async (document: any) => {
    try {
      // Simply set the document for the viewer - it will handle the API call internally
      setViewingDocument(document);
      setShowDocumentViewer(true);
    } catch (error) {
      console.error('Document view error:', error);
      toast.error('Failed to open document');
    }
  };

  const getDocumentStatus = (doc: any) => {
    if (!doc) return 'not-added';
    
    if (doc.expiryDate) {
      const expiryDate = new Date(doc.expiryDate);
      const today = new Date();
      if (expiryDate < today) return 'expired';
    }
    
    return 'added';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'added':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'expired':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'added':
        return 'Added';
      case 'expired':
        return 'Expired';
      default:
        return 'Not Added';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'added':
        return 'text-green-600 bg-green-50';
      case 'expired':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const handleStatusToggle = async () => {
    const newStatus = employee.status === 'active' ? 'inactive' : 'active';
    
    try {
      await api.put(`/employees/${employee.id}`, { status: newStatus });
      toast.success(`Employee status changed to ${newStatus.toUpperCase()}`);
      fetchEmployee();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update employee status');
    }
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/employees/${employee.id}`);
      toast.success('Employee and all associated files deleted successfully');
      router.push('/admin/employees');
    } catch (error) {
      toast.error('Failed to delete employee');
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Employee Details">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!employee) {
    return (
      <DashboardLayout title="Employee Details">
        <div className="text-center py-12">
          <p className="text-gray-500">Employee not found</p>
          <Button onClick={() => router.push('/admin/employees')} className="mt-4">
            Back to Employees
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // Group documents by category
  const documentsByCategory = documentCategories.map(category => {
    const categoryTypes = documentTypes.filter(type => type.categoryId === category.id);
    const categoryDocs = categoryTypes.map(type => {
      const doc = documents.find(d => d.documentTypeId === type.id);
      return {
        type,
        document: doc,
        status: getDocumentStatus(doc)
      };
    });
    
    return {
      category,
      documents: categoryDocs
    };
  });

  return (
    <DashboardLayout title="Employee Details">
      <div className="max-w-7xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                <User className="h-8 w-8 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">
                  {employee.firstName} {employee.lastName}
                </h1>
                <p className="text-gray-600 break-words">{employee.positionInfo?.title || 'No Position'} • {employee.departmentInfo?.name || 'No Department'}</p>
                <p className="text-sm text-gray-500">Employee ID: NIC-{employee.employeeId?.padStart(3, '0')}</p>
                <div className="flex items-center mt-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    employee.status === 'active' 
                      ? 'bg-green-100 text-green-800'
                      : employee.status === 'inactive'
                      ? 'bg-yellow-100 text-yellow-800'
                      : employee.status === 'retired'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {employee.status === 'active' ? 'ACTIVE' : 
                     employee.status === 'inactive' ? 'INACTIVE' : 
                     employee.status === 'retired' ? 'RETIRED' : 
                     employee.status?.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant={employee.status === 'active' ? 'outline' : 'primary'}
                onClick={handleStatusToggle}
                className="w-full sm:w-auto"
              >
                {employee.status === 'active' ? 'Set Inactive' : 'Set Active'}
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                className="w-full sm:w-auto"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>

        {/* Contact Details Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <h3 className="text-lg font-semibold text-gray-900">Contact Details</h3>
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
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSectionSave('contact')}
                >
                  Save
                </Button>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Official Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Official Email <span className="text-red-500">*</span>
              </label>
              {editingSections.contact ? (
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter official email"
                  required
                />
              ) : (
                <div className="flex items-center">
                  <Mail className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                  <span className="text-gray-900 break-all">{employee.email || 'Not set'}</span>
                </div>
              )}
            </div>

            {/* Personal Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Personal Email</label>
              {editingSections.contact ? (
                <Input
                  type="email"
                  value={editForm.personalEmail}
                  onChange={(e) => setEditForm(prev => ({ ...prev, personalEmail: e.target.value }))}
                  placeholder="Enter personal email (optional)"
                />
              ) : (
                <div className="flex items-center">
                  <Mail className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                  <span className="text-gray-900 break-all">{employee.personalEmail || 'Not set'}</span>
                </div>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              {editingSections.contact ? (
                <Input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                    if (value.length <= 10) {
                      setEditForm(prev => ({ ...prev, phone: value }));
                    }
                  }}
                  placeholder="Enter 10-digit phone number"
                  maxLength={10}
                  required
                />
              ) : (
                <div className="flex items-center">
                  <Phone className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                  <span className="text-gray-900">{employee.phone || 'Not set'}</span>
                </div>
              )}
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username <span className="text-red-500">*</span>
              </label>
              {editingSections.contact ? (
                <Input
                  value={editForm.username}
                  onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Enter username for login"
                  required
                />
              ) : (
                <div className="flex items-center">
                  <User className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                  <span className="text-gray-900 break-all">{employee.username || employee.user?.username || 'Not set'}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Password Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <h3 className="text-lg font-semibold text-gray-900">Password & Security</h3>
            {!editingSections.password ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSectionEdit('password')}
              >
                <Edit className="h-4 w-4 mr-2" />
                Reset Password
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSectionCancel('password')}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSectionSave('password')}
                >
                  Update Password
                </Button>
              </div>
            )}
          </div>
          
          {editingSections.password ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? 'text' : 'password'}
                      value={editForm.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter new password"
                      className="pr-10"
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={editForm.confirmPassword}
                      onChange={(e) => setEditForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Confirm new password"
                      className="pr-10"
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {editForm.confirmPassword && editForm.newPassword !== editForm.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
                  )}
                </div>
              </div>

              {/* Real-time Password Validation */}
              {editForm.newPassword && (
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
              {!editForm.newPassword && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">Password Requirements:</h4>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• At least 12 characters long</li>
                    <li>• Contains uppercase and lowercase letters</li>
                    <li>• Contains at least one number</li>
                    <li>• Contains at least one special character</li>
                    <li>• Should not contain personal information</li>
                    <li>• Should not contain sequential characters (abc, 123, etc.)</li>
                    <li>• Should not contain common weak patterns</li>
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center">
              <Key className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
              <span className="text-gray-500">••••••••</span>
              <span className="ml-4 text-sm text-gray-600">Click "Reset Password" to change</span>
            </div>
          )}
        </div>

        {/* Employee Info Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <h3 className="text-lg font-semibold text-gray-900">Employee Info</h3>
            {!editingSections.employee ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSectionEdit('employee')}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSectionCancel('employee')}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSectionSave('employee')}
                >
                  Save
                </Button>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              {editingSections.employee ? (
                <Select
                  value={editForm.departmentId}
                  onChange={(value) => setEditForm(prev => ({ ...prev, departmentId: value.toString() }))}
                  options={departments.map(dept => ({ value: dept.id, label: dept.name }))}
                  placeholder="Select department"
                />
              ) : (
                <div className="flex items-center">
                  <Users className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                  <span className="text-gray-900">{employee.departmentInfo?.name || 'Not set'}</span>
                </div>
              )}
            </div>

            {/* Position */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
              {editingSections.employee ? (
                <Select
                  value={editForm.positionId}
                  onChange={(value) => setEditForm(prev => ({ ...prev, positionId: value.toString() }))}
                  options={filteredPositions.map(pos => ({ value: pos.id, label: pos.title }))}
                  placeholder="Select position"
                  disabled={!editForm.departmentId}
                />
              ) : (
                <div className="flex items-center">
                  <Briefcase className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                  <span className="text-gray-900">{employee.positionInfo?.title || 'Not set'}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Personal Info Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <h3 className="text-lg font-semibold text-gray-900">Personal Info</h3>
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
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSectionSave('personal')}
                >
                  Save
                </Button>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              {editingSections.personal ? (
                <Input
                  type="date"
                  value={editForm.dateOfBirth}
                  onChange={(e) => setEditForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                />
              ) : (
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                  <span className="text-gray-900">
                    {employee.dateOfBirth ? format(new Date(employee.dateOfBirth), 'MMMM dd, yyyy') : 'Not set'}
                  </span>
                </div>
              )}
            </div>

            {/* Date of Marriage */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Marriage</label>
              {editingSections.personal ? (
                <Input
                  type="date"
                  value={editForm.marriageAnniversary}
                  onChange={(e) => setEditForm(prev => ({ ...prev, marriageAnniversary: e.target.value }))}
                />
              ) : (
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                  <span className="text-gray-900">
                    {employee.marriageAnniversary ? format(new Date(employee.marriageAnniversary), 'MMMM dd, yyyy') : 'Not set'}
                  </span>
                </div>
              )}
            </div>

            {/* Date of Joining */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Joining Organization</label>
              {editingSections.personal ? (
                <Input
                  type="date"
                  value={editForm.joiningDate}
                  onChange={(e) => setEditForm(prev => ({ ...prev, joiningDate: e.target.value }))}
                />
              ) : (
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                  <span className="text-gray-900">
                    {employee.joiningDate ? format(new Date(employee.joiningDate), 'MMMM dd, yyyy') : 'Not set'}
                  </span>
                </div>
              )}
            </div>

            {/* Date of Leaving */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1 gap-2">
                <label className="block text-sm font-medium text-gray-700">Date of Leaving</label>
                {editingSections.personal && (
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="currentlyWorking"
                      checked={editForm.currentlyWorking}
                      onChange={(e) => setEditForm(prev => ({ 
                        ...prev, 
                        currentlyWorking: e.target.checked,
                        leavingDate: e.target.checked ? '' : prev.leavingDate
                      }))}
                      className="mr-2"
                    />
                    <label htmlFor="currentlyWorking" className="text-sm text-gray-700">
                      Currently Working
                    </label>
                  </div>
                )}
              </div>
              {editingSections.personal ? (
                <Input
                  type="date"
                  value={editForm.leavingDate}
                  onChange={(e) => setEditForm(prev => ({ ...prev, leavingDate: e.target.value }))}
                  disabled={editForm.currentlyWorking}
                  className={editForm.currentlyWorking ? 'bg-gray-100 cursor-not-allowed' : ''}
                />
              ) : (
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                  <span className="text-gray-900">
                    {employee.leavingDate ? format(new Date(employee.leavingDate), 'MMMM dd, yyyy') : 'Currently Working'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Address Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <h3 className="text-lg font-semibold text-gray-900">Address Information</h3>
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
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSectionSave('address')}
                >
                  Save
                </Button>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              {editingSections.address ? (
                <Input
                  value={editForm.address}
                  onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Enter full address"
                />
              ) : (
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                  <span className="text-gray-900">{employee.address || 'Not set'}</span>
                </div>
              )}
            </div>

            {/* Landmark */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Landmark (Optional)</label>
              {editingSections.address ? (
                <Input
                  value={editForm.landmark}
                  onChange={(e) => setEditForm(prev => ({ ...prev, landmark: e.target.value }))}
                  placeholder="Enter landmark"
                />
              ) : (
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                  <span className="text-gray-900">{employee.landmark || 'Not set'}</span>
                </div>
              )}
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              {editingSections.address ? (
                <Input
                  value={editForm.city}
                  onChange={(e) => setEditForm(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Enter city"
                />
              ) : (
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                  <span className="text-gray-900">{employee.city || 'Not set'}</span>
                </div>
              )}
            </div>

            {/* District */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
              {editingSections.address ? (
                <Input
                  value={editForm.district}
                  onChange={(e) => setEditForm(prev => ({ ...prev, district: e.target.value }))}
                  placeholder="Enter district"
                />
              ) : (
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                  <span className="text-gray-900">{employee.district || 'Not set'}</span>
                </div>
              )}
            </div>

            {/* State */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              {editingSections.address ? (
                <Select
                  value={editForm.state}
                  onChange={(value) => setEditForm(prev => ({ ...prev, state: value.toString() }))}
                  options={INDIAN_STATES.map(state => ({ value: state, label: state }))}
                  placeholder="Select state"
                />
              ) : (
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                  <span className="text-gray-900">{employee.state || 'Not set'}</span>
                </div>
              )}
            </div>

            {/* Pincode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
              {editingSections.address ? (
                <Input
                  value={editForm.pincode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                    if (value.length <= 6) {
                      setEditForm(prev => ({ ...prev, pincode: value }));
                    }
                  }}
                  placeholder="Enter 6-digit pincode"
                  maxLength={6}
                />
              ) : (
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                  <span className="text-gray-900">{employee.pincode || 'Not set'}</span>
                </div>
              )}
            </div>
          </div>

          {editingSections.address && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> If you fill any address field, all fields except Landmark must be completed.
              </p>
            </div>
          )}
        </div>

        {/* Documents Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
            <p className="text-sm text-gray-600">Click the + button next to any document type to upload</p>
          </div>

          <div className="space-y-6">
            {documentsByCategory.map(({ category, documents: categoryDocs }) => (
              <div key={category.id}>
                <h4 className="text-md font-medium text-gray-800 mb-3">{category.name}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {categoryDocs.map(({ type, document, status }) => (
                    <div
                      key={type.id}
                      className="border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900 break-words pr-2">{type.name}</span>
                        {getStatusIcon(status)}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(status)}`}>
                          {getStatusText(status)}
                        </span>
                        
                        <div className="flex space-x-1">
                          {document && (
                            <button
                              onClick={() => handleDocumentView(document)}
                              className="text-blue-600 hover:text-blue-800"
                              title="View Document"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedDocument(document);
                              setSelectedDocumentType(type);
                              setShowDocumentModal(true);
                            }}
                            className="text-gray-600 hover:text-gray-800"
                            title={document ? "Update Document" : "Add Document"}
                          >
                            {document ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      
                      {document && document.expiryDate && (
                        <div className="mt-2 text-xs text-gray-500">
                          Expires: {format(new Date(document.expiryDate), 'MMM dd, yyyy')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Document Modal */}
        <DocumentModal
          isOpen={showDocumentModal}
          onClose={() => {
            setShowDocumentModal(false);
            setSelectedDocument(null);
            setSelectedDocumentType(null);
          }}
          employeeId={employee.id}
          employeeName={`${employee.firstName} ${employee.lastName}`}
          existingDocument={selectedDocument}
          preSelectedType={selectedDocumentType}
          onSuccess={handleDocumentSuccess}
        />

        {/* Document Viewer */}
        <DocumentViewer
          isOpen={showDocumentViewer}
          onClose={() => {
            setShowDocumentViewer(false);
            setViewingDocument(null);
          }}
          document={viewingDocument}
        />

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={confirmDelete}
          title="Delete Employee"
          message={`Are you sure you want to delete ${employee?.firstName} ${employee?.lastName}? This action will permanently remove the employee record and all associated files. This cannot be undone.`}
          confirmText="Delete Employee"
          cancelText="Cancel"
          variant="danger"
        />
      </div>
    </DashboardLayout>
  );
}