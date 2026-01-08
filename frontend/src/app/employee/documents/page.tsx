'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, Plus, Eye, Edit, CheckCircle, XCircle, 
  AlertTriangle, Calendar, User
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import DocumentModal from '@/components/ui/DocumentModal';
import DocumentViewer from '@/components/ui/DocumentViewer';
import { isAuthenticated, isEmployee, getUser } from '@/lib/auth';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface DocumentType {
  id: number;
  name: string;
  categoryId: number;
  document?: any;
  hasApproved?: boolean;
  hasPending?: boolean;
  hasRejected?: boolean;
  allDocuments?: any[];
}

interface DocumentCategory {
  id: number;
  name: string;
  description: string;
  types: DocumentType[];
}

export default function EmployeeDocumentsPage() {
  const router = useRouter();
  const user = getUser();
  const [documents, setDocuments] = useState<any[]>([]);
  const [documentCategories, setDocumentCategories] = useState<any[]>([]);
  const [documentTypes, setDocumentTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState<any>(null);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<any>(null);

  useEffect(() => {
    if (!isAuthenticated() || !isEmployee()) {
      router.push('/login');
      return;
    }

    fetchDocuments();
    fetchDocumentCategories();
    fetchDocumentTypes();
  }, [router]);

  const fetchDocuments = async () => {
    try {
      const response = await api.get('/documents/my-documents');
      setDocuments(response.data);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  const fetchDocumentCategories = async () => {
    try {
      const response = await api.get('/documents/categories');
      setDocumentCategories(response.data);
    } catch (error) {
      console.error('Error fetching document categories:', error);
    }
  };

  const fetchDocumentTypes = async () => {
    try {
      const response = await api.get('/documents/types');
      setDocumentTypes(response.data);
    } catch (error) {
      console.error('Error fetching document types:', error);
    }
  };

  const handleAddDocument = (documentType: any) => {
    setSelectedDocumentType(documentType);
    setSelectedDocument(null);
    setShowDocumentModal(true);
  };

  const handleEditDocument = (document: any) => {
    setSelectedDocument(document);
    setSelectedDocumentType(document.documentType);
    setShowDocumentModal(true);
  };

  const handleViewDocument = (document: any) => {
    setViewingDocument(document);
    setShowDocumentViewer(true);
  };

  const handleModalClose = () => {
    setShowDocumentModal(false);
    setSelectedDocument(null);
    setSelectedDocumentType(null);
    fetchDocuments();
  };

  const getDocumentStatus = (document: any) => {
    if (document.status === 'approved') {
      return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', text: 'Approved' };
    } else if (document.status === 'pending') {
      return { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-100', text: 'Pending Approval' };
    } else if (document.status === 'rejected') {
      return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', text: 'Rejected' };
    }
    return { icon: AlertTriangle, color: 'text-gray-600', bg: 'bg-gray-100', text: 'Unknown' };
  };

  const getDocumentsByCategory = () => {
    const grouped = documentCategories.map(category => ({
      ...category,
      types: documentTypes
        .filter(type => type.categoryId === category.id)
        .map(type => {
          // Find all documents for this type (approved and pending)
          const typeDocuments = documents.filter(doc => doc.documentTypeId === type.id);
          const approvedDoc = typeDocuments.find(doc => doc.status === 'approved');
          const pendingDoc = typeDocuments.find(doc => doc.status === 'pending');
          const rejectedDoc = typeDocuments.find(doc => doc.status === 'rejected');
          
          // Show the most relevant document (pending > approved > rejected)
          const primaryDoc = pendingDoc || approvedDoc || rejectedDoc;
          
          return {
            ...type,
            document: primaryDoc,
            hasApproved: !!approvedDoc,
            hasPending: !!pendingDoc,
            hasRejected: !!rejectedDoc,
            allDocuments: typeDocuments
          };
        })
    }));
    return grouped;
  };

  if (loading) {
    return (
      <DashboardLayout title="My Documents">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My Documents">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Documents</h1>
            <p className="text-gray-600">Manage your personal documents and certificates</p>
          </div>
        </div>

        {/* Document Categories */}
        <div className="space-y-6">
          {getDocumentsByCategory().map((category) => (
            <div key={category.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                <p className="text-sm text-gray-600">{category.description}</p>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {category.types.map((type: DocumentType) => {
                    const document = type.document;
                    const status = document ? getDocumentStatus(document) : null;
                    
                    return (
                      <div key={type.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{type.name}</h4>
                            {document && (
                              <div className="flex items-center mt-1 space-x-2">
                                {status && (
                                  <>
                                    <status.icon className={`h-4 w-4 ${status.color} mr-1`} />
                                    <span className={`text-xs px-2 py-1 rounded-full ${status.bg} ${status.color}`}>
                                      {status.text}
                                    </span>
                                  </>
                                )}
                                {type.hasApproved && type.hasPending && (
                                  <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-600">
                                    Update Pending
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {document ? (
                          <div className="space-y-2">
                            {document.issueDate && (
                              <p className="text-xs text-gray-600">
                                <Calendar className="h-3 w-3 inline mr-1" />
                                Issue: {format(new Date(document.issueDate), 'MMM dd, yyyy')}
                              </p>
                            )}
                            {document.expiryDate && (
                              <p className="text-xs text-gray-600">
                                <Calendar className="h-3 w-3 inline mr-1" />
                                Expiry: {format(new Date(document.expiryDate), 'MMM dd, yyyy')}
                              </p>
                            )}
                            
                            {type.hasApproved && type.hasPending && (
                              <p className="text-xs text-blue-600 font-medium">
                                You have submitted an updated version for approval
                              </p>
                            )}
                            
                            <div className="flex space-x-2 mt-3">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewDocument(document)}
                                className="flex-1"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditDocument(document)}
                                className="flex-1"
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                {type.hasPending ? 'Update' : 'Edit'}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center">
                            <p className="text-sm text-gray-500 mb-3">Not uploaded</p>
                            <Button
                              size="sm"
                              onClick={() => handleAddDocument(type)}
                              className="w-full"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Upload
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Document Modal */}
        {showDocumentModal && (
          <DocumentModal
            isOpen={showDocumentModal}
            onClose={handleModalClose}
            document={selectedDocument}
            preSelectedType={selectedDocumentType}
            isEmployee={true}
          />
        )}

        {/* Document Viewer */}
        {showDocumentViewer && viewingDocument && (
          <DocumentViewer
            document={viewingDocument}
            onClose={() => setShowDocumentViewer(false)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}