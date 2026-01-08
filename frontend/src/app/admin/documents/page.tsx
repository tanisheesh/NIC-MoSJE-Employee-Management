'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Eye, Check, X, Clock, Search, Filter } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import DocumentViewer from '@/components/ui/DocumentViewer';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { isAuthenticated, isAdmin } from '@/lib/auth';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function AdminDocumentsPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<number | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [documentToReject, setDocumentToReject] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (!isAuthenticated() || !isAdmin()) {
      router.push('/login');
      return;
    }

    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [employeesRes, pendingRes] = await Promise.all([
        api.get('/employees'),
        api.get('/documents/pending-approvals')
      ]);

      setEmployees(employeesRes.data.employees);
      setPendingApprovals(pendingRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeeDocuments = async (employeeId: string) => {
    try {
      const response = await api.get(`/documents/employee/${employeeId}`);
      setDocuments(response.data);
    } catch (error) {
      toast.error('Failed to fetch employee documents');
    }
  };

  const handleViewDocument = (document: any) => {
    setViewingDocument(document);
    setShowDocumentViewer(true);
  };

  const handleApproval = async (documentId: number, status: 'approved' | 'rejected', reason?: string) => {
    try {
      await api.put(`/documents/${documentId}/approve`, {
        status,
        rejectionReason: reason
      });
      
      toast.success(`Document ${status} successfully`);
      fetchData();
      
      if (selectedEmployee) {
        fetchEmployeeDocuments(selectedEmployee);
      }
    } catch (error) {
      toast.error(`Failed to ${status} document`);
    }
  };

  const handleRejectDocument = (documentId: number) => {
    setDocumentToReject(documentId);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const confirmReject = () => {
    if (documentToReject) {
      handleApproval(documentToReject, 'rejected', rejectionReason || undefined);
      setShowRejectModal(false);
      setDocumentToReject(null);
      setRejectionReason('');
    }
  };

  const handleDeleteDocument = (documentId: number) => {
    setDocumentToDelete(documentId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!documentToDelete) return;

    try {
      await api.delete(`/documents/${documentToDelete}`);
      toast.success('Document deleted successfully');
      
      if (selectedEmployee) {
        fetchEmployeeDocuments(selectedEmployee);
      }
      fetchData();
    } catch (error) {
      toast.error('Failed to delete document');
    } finally {
      setDocumentToDelete(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Document Management">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Document Management">
      <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All Documents
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'pending'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pending Approvals ({pendingApprovals.length})
            </button>
          </nav>
        </div>

        {activeTab === 'pending' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Pending Document Approvals
              </h3>
              
              {pendingApprovals.length === 0 ? (
                <p className="text-gray-600">No pending approvals</p>
              ) : (
                <div className="space-y-4">
                  {pendingApprovals.map((doc: any) => (
                    <div key={doc.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start space-x-3">
                            <FileText className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div className="min-w-0 flex-1">
                              <h4 className="font-medium text-gray-900 truncate">
                                {doc.documentType.name}
                              </h4>
                              <p className="text-sm text-gray-600 truncate">
                                {doc.employee.firstName} {doc.employee.lastName} (NIC-{doc.employee.employeeId?.padStart(3, '0')})
                              </p>
                              <p className="text-xs text-gray-500">
                                Uploaded on {format(new Date(doc.createdAt), 'MMM dd, yyyy')}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDocument(doc)}
                            className="w-full sm:w-auto"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleApproval(doc.id, 'approved')}
                            className="w-full sm:w-auto"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleRejectDocument(doc.id)}
                            className="w-full sm:w-auto"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'all' && (
          <>
            {/* Employee Selection */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-end space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Employee
                  </label>
                  <select
                    value={selectedEmployee}
                    onChange={(e) => {
                      setSelectedEmployee(e.target.value);
                      if (e.target.value) {
                        fetchEmployeeDocuments(e.target.value);
                      } else {
                        setDocuments([]);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  >
                    <option value="" className="text-gray-500">Select an employee...</option>
                    {employees.map((emp: any) => (
                      <option key={emp.id} value={emp.id} className="text-gray-900">
                        {emp.firstName} {emp.lastName} (NIC-{emp.employeeId?.padStart(3, '0')})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Documents List */}
            {selectedEmployee && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-4 sm:p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Employee Documents
                  </h3>
                  
                  {documents.length === 0 ? (
                    <p className="text-gray-600">No documents found for this employee</p>
                  ) : (
                    <div className="space-y-4">
                      {documents.map((doc: any) => (
                        <div key={doc.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start space-x-3">
                                <FileText className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div className="min-w-0 flex-1">
                                  <h4 className="font-medium text-gray-900 break-words">
                                    {doc.documentType.name}
                                  </h4>
                                  <p className="text-sm text-gray-600 break-words">
                                    Category: {doc.documentType.category.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Uploaded on {format(new Date(doc.createdAt), 'MMM dd, yyyy')}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3 flex-shrink-0">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full text-center ${
                                doc.status === 'approved' 
                                  ? 'bg-green-100 text-green-800'
                                  : doc.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {doc.status?.toUpperCase()}
                              </span>
                              
                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewDocument(doc)}
                                  className="w-full sm:w-auto"
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                                
                                {doc.status === 'pending' && (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => handleApproval(doc.id, 'approved')}
                                      className="w-full sm:w-auto"
                                    >
                                      <Check className="h-4 w-4 mr-1" />
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="danger"
                                      onClick={() => handleRejectDocument(doc.id)}
                                      className="w-full sm:w-auto"
                                    >
                                      <X className="h-4 w-4 mr-1" />
                                      Reject
                                    </Button>
                                  </>
                                )}
                                
                                <Button
                                  size="sm"
                                  variant="danger"
                                  onClick={() => handleDeleteDocument(doc.id)}
                                  className="w-full sm:w-auto"
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </div>
                          
                          {doc.rejectionReason && (
                            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                              <p className="text-sm text-red-800 break-words">
                                <strong>Rejection Reason:</strong> {doc.rejectionReason}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Document Viewer */}
      {showDocumentViewer && viewingDocument && (
        <DocumentViewer
          document={viewingDocument}
          onClose={() => setShowDocumentViewer(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="Delete Document"
        message="Are you sure you want to delete this document? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 py-6">
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md border border-gray-300">
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Reject Document
                </h3>
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="p-4 sm:p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason (Optional)
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                    rows={3}
                    placeholder="Enter reason for rejection..."
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 p-4 sm:p-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  onClick={confirmReject}
                  className="flex-1"
                >
                  Reject Document
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}