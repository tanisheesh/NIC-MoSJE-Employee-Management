'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, FileText, UserPlus, TrendingUp, Check, X } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { isAuthenticated, isAdmin } from '@/lib/auth';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  pendingDocuments: number;
  pendingRegistrations: number;
}

interface PendingRegistration {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  createdAt: string;
}

interface PendingDocument {
  id: number;
  documentType: {
    name: string;
  };
  employee: {
    firstName: string;
    lastName: string;
    employeeId: string;
  };
  createdAt: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    pendingDocuments: 0,
    pendingRegistrations: 0
  });
  const [pendingRegistrations, setPendingRegistrations] = useState<PendingRegistration[]>([]);
  const [pendingDocuments, setPendingDocuments] = useState<PendingDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<PendingRegistration | null>(null);
  const [approvalForm, setApprovalForm] = useState({
    employeeId: '',
    phone: ''
  });

  useEffect(() => {
    if (!isAuthenticated() || !isAdmin()) {
      router.push('/login');
      return;
    }

    fetchDashboardData();
  }, [router]);

  const fetchDashboardData = async () => {
    try {
      const [employeesRes, registrationsRes, documentsRes] = await Promise.all([
        api.get('/employees?limit=1'),
        api.get('/registration/pending'),
        api.get('/documents/pending-approvals')
      ]);

      setStats({
        totalEmployees: employeesRes.data.total || 0,
        activeEmployees: employeesRes.data.total || 0,
        pendingDocuments: documentsRes.data.length || 0,
        pendingRegistrations: registrationsRes.data.length || 0
      });

      setPendingRegistrations(registrationsRes.data.slice(0, 5));
      setPendingDocuments(documentsRes.data.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRegistration = (registration: PendingRegistration) => {
    setSelectedRegistration(registration);
    setApprovalForm({ employeeId: '', phone: '' });
    setShowApprovalModal(true);
  };

  const handleRejectRegistration = async (registration: PendingRegistration) => {
    if (!confirm(`Are you sure you want to reject and delete the registration request from ${registration.firstName} ${registration.lastName}?`)) {
      return;
    }

    try {
      await api.post(`/registration/reject/${registration.id}`);
      toast.success('Registration rejected and deleted successfully');
      fetchDashboardData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject registration');
    }
  };

  const handleSubmitApproval = async () => {
    if (!selectedRegistration) return;

    if (!approvalForm.employeeId || !approvalForm.phone) {
      toast.error('Employee ID and phone number are required');
      return;
    }

    if (!/^\d{3}$/.test(approvalForm.employeeId)) {
      toast.error('Employee ID must be exactly 3 digits');
      return;
    }

    if (!/^\d{10}$/.test(approvalForm.phone)) {
      toast.error('Phone number must be exactly 10 digits');
      return;
    }

    try {
      await api.post(`/registration/approve/${selectedRegistration.id}`, approvalForm);
      toast.success('Registration approved successfully');
      setShowApprovalModal(false);
      setSelectedRegistration(null);
      fetchDashboardData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve registration');
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Admin Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Employees</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalEmployees}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Employees</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeEmployees}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Document Approvals</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingDocuments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <UserPlus className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Account Approvals</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingRegistrations}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/admin/employees/add')}
              className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <Users className="h-6 w-6 text-blue-600 mb-2" />
              <h4 className="font-medium text-gray-900">Add New Employee</h4>
              <p className="text-sm text-gray-600">Create a new employee profile</p>
            </button>

            <button
              onClick={() => router.push('/admin/employees')}
              className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <Users className="h-6 w-6 text-green-600 mb-2" />
              <h4 className="font-medium text-gray-900">Manage Employees</h4>
              <p className="text-sm text-gray-600">View and edit employee records</p>
            </button>

            <button
              onClick={() => router.push('/admin/documents')}
              className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <FileText className="h-6 w-6 text-purple-600 mb-2" />
              <h4 className="font-medium text-gray-900">Manage Documents</h4>
              <p className="text-sm text-gray-600">Handle employee documents and approvals</p>
            </button>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Account Approvals */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Approval Pending</h3>
            {pendingRegistrations.length > 0 ? (
              <div className="space-y-3">
                {pendingRegistrations.map((registration) => (
                  <div key={registration.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {registration.firstName} {registration.lastName}
                      </p>
                      <p className="text-sm text-gray-600 truncate">{registration.email}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(registration.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <Button
                        size="sm"
                        onClick={() => handleApproveRegistration(registration)}
                        className="px-3 py-1"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleRejectRegistration(registration)}
                        className="px-3 py-1"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No pending account approvals.</p>
            )}
          </div>

          {/* Document Approvals */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Document Approval Pending</h3>
            {pendingDocuments.length > 0 ? (
              <div className="space-y-3">
                {pendingDocuments.map((document) => (
                  <div key={document.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{document.documentType.name}</p>
                      <p className="text-sm text-gray-600 truncate">
                        {document.employee.firstName} {document.employee.lastName} (NIC-{document.employee.employeeId?.padStart(3, '0')})
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(document.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push('/admin/documents')}
                      className="ml-4"
                    >
                      Review
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No pending document approvals.</p>
            )}
          </div>
        </div>

        {/* Approval Modal */}
        {showApprovalModal && selectedRegistration && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 py-6">
              <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6 border border-gray-300">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Approve Registration
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Approving: {selectedRegistration.firstName} {selectedRegistration.lastName}
                </p>
                
                <div className="space-y-4">
                  <Input
                    label="Employee ID (3 digits)"
                    value={approvalForm.employeeId}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 3) {
                        setApprovalForm(prev => ({ ...prev, employeeId: value }));
                      }
                    }}
                    placeholder="001"
                    maxLength={3}
                    required
                  />
                  
                  <Input
                    label="Phone Number (10 digits)"
                    value={approvalForm.phone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 10) {
                        setApprovalForm(prev => ({ ...prev, phone: value }));
                      }
                    }}
                    placeholder="9876543210"
                    maxLength={10}
                    required
                  />
                </div>

                <div className="flex space-x-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setShowApprovalModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitApproval}
                    className="flex-1"
                  >
                    Approve
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}