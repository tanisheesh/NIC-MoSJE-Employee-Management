import React, { useState, useEffect } from 'react';
import { X, Upload, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import Button from './Button';
import Input from './Input';
import Select from './Select';
import ConfirmModal from './ConfirmModal';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId?: string;
  employeeName?: string;
  existingDocument?: any;
  preSelectedType?: any;
  onSuccess?: () => void;
  document?: any;
  isEmployee?: boolean;
}

interface DocumentCategory {
  id: number;
  name: string;
}

interface DocumentType {
  id: number;
  name: string;
  categoryId: number;
}

interface FormData {
  categoryId: string;
  typeId: string;
  file: File | null;
  issueDate: string;
  expiryDate: string;
}

interface FormErrors {
  categoryId?: string;
  typeId?: string;
  file?: string;
}

const DocumentModal: React.FC<DocumentModalProps> = ({
  isOpen,
  onClose,
  employeeId,
  employeeName,
  existingDocument,
  preSelectedType,
  onSuccess,
  document,
  isEmployee = false
}) => {
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [filteredTypes, setFilteredTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    categoryId: '',
    typeId: '',
    file: null,
    issueDate: '',
    expiryDate: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      fetchDocumentTypes();
      
      // Add escape key handler
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      
      window.document.addEventListener('keydown', handleEscape);
      
      if (existingDocument) {
        setFormData({
          categoryId: existingDocument.documentType?.categoryId?.toString() || '',
          typeId: existingDocument.documentTypeId?.toString() || '',
          file: null,
          issueDate: existingDocument.issueDate || '',
          expiryDate: existingDocument.expiryDate || ''
        });
      } else if (preSelectedType) {
        // Pre-select the category and type when adding a new document
        setFormData({
          categoryId: preSelectedType.categoryId?.toString() || '',
          typeId: preSelectedType.id?.toString() || '',
          file: null,
          issueDate: '',
          expiryDate: ''
        });
      } else {
        setFormData({
          categoryId: '',
          typeId: '',
          file: null,
          issueDate: '',
          expiryDate: ''
        });
      }
      
      return () => {
        window.document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, existingDocument, preSelectedType, onClose]);

  useEffect(() => {
    if (formData.categoryId) {
      const filtered = documentTypes.filter(type => 
        type.categoryId === parseInt(formData.categoryId)
      );
      setFilteredTypes(filtered);
      
      // Reset type selection if current type doesn't belong to selected category
      if (formData.typeId && !filtered.find(t => t.id === parseInt(formData.typeId))) {
        setFormData(prev => ({ ...prev, typeId: '' }));
      }
    } else {
      setFilteredTypes([]);
      setFormData(prev => ({ ...prev, typeId: '' }));
    }
  }, [formData.categoryId, documentTypes]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/documents/categories');
      setCategories(response.data);
    } catch (error) {
      toast.error('Failed to fetch document categories');
    }
  };

  const fetchDocumentTypes = async () => {
    try {
      const response = await api.get('/documents/types');
      setDocumentTypes(response.data);
    } catch (error) {
      toast.error('Failed to fetch document types');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, file }));
      setErrors(prev => ({ ...prev, file: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};

    // If we have a preSelectedType, we don't need to validate category/type selection
    if (!preSelectedType) {
      if (!formData.categoryId) newErrors.categoryId = 'Category is required';
      if (!formData.typeId) newErrors.typeId = 'Document type is required';
    }
    
    // Only require a file for new documents, not for existing document updates
    if (!existingDocument && !formData.file) newErrors.file = 'File is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      if (existingDocument || document) {
        const docToUpdate = existingDocument || document;
        
        // For existing documents, check if we're only updating dates or also replacing the file
        if (formData.file) {
          // File replacement: delete old document and create new one
          const formDataToSend = new FormData();
          
          if (isEmployee) {
            // Employee uploading - no employeeId needed, will be determined from auth
            const documentTypeId = preSelectedType ? preSelectedType.id.toString() : formData.typeId;
            formDataToSend.append('documentTypeId', documentTypeId);
            formDataToSend.append('document', formData.file);
            
            if (formData.issueDate) {
              formDataToSend.append('issueDate', formData.issueDate);
            }
            
            if (formData.expiryDate) {
              formDataToSend.append('expiryDate', formData.expiryDate);
            }

            await api.delete(`/documents/${docToUpdate.id}`);
            await api.post('/documents/upload', formDataToSend, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
          } else {
            // Admin uploading
            formDataToSend.append('employeeId', employeeId!);
            const documentTypeId = preSelectedType ? preSelectedType.id.toString() : formData.typeId;
            formDataToSend.append('documentTypeId', documentTypeId);
            formDataToSend.append('document', formData.file);
            
            if (formData.issueDate) {
              formDataToSend.append('issueDate', formData.issueDate);
            }
            
            if (formData.expiryDate) {
              formDataToSend.append('expiryDate', formData.expiryDate);
            }

            await api.delete(`/documents/${docToUpdate.id}`);
            await api.post('/documents/upload', formDataToSend, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
          }
          
          toast.success('Document updated successfully');
        } else {
          // Date-only update: just update the document metadata
          const updateData = {
            issueDate: formData.issueDate || null,
            expiryDate: formData.expiryDate || null
          };
          
          await api.put(`/documents/${docToUpdate.id}`, updateData, {
            headers: { 'Content-Type': 'application/json' }
          });
          toast.success('Document dates updated successfully');
        }
      } else {
        // New document upload
        const formDataToSend = new FormData();
        
        if (isEmployee) {
          // Employee uploading - no employeeId needed, will be determined from auth
          const documentTypeId = preSelectedType ? preSelectedType.id.toString() : formData.typeId;
          formDataToSend.append('documentTypeId', documentTypeId);
          formDataToSend.append('document', formData.file!);
          
          if (formData.issueDate) {
            formDataToSend.append('issueDate', formData.issueDate);
          }
          
          if (formData.expiryDate) {
            formDataToSend.append('expiryDate', formData.expiryDate);
          }

          await api.post('/documents/upload', formDataToSend, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          
          toast.success('Document uploaded successfully and sent for approval');
        } else {
          // Admin uploading
          formDataToSend.append('employeeId', employeeId!);
          const documentTypeId = preSelectedType ? preSelectedType.id.toString() : formData.typeId;
          formDataToSend.append('documentTypeId', documentTypeId);
          formDataToSend.append('document', formData.file!);
          
          if (formData.issueDate) {
            formDataToSend.append('issueDate', formData.issueDate);
          }
          
          if (formData.expiryDate) {
            formDataToSend.append('expiryDate', formData.expiryDate);
          }

          await api.post('/documents/upload', formDataToSend, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          
          toast.success('Document added successfully');
        }
      }
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save document');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!existingDocument) return;
    
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!existingDocument) return;

    try {
      setLoading(true);
      await api.delete(`/documents/${existingDocument.id}`);
      toast.success('Document deleted successfully');
      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete document');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const selectedCategory = categories.find(c => c.id === parseInt(formData.categoryId));
  const selectedType = documentTypes.find(t => t.id === parseInt(formData.typeId)) || preSelectedType;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-6">
        {/* Modal panel - no background overlay */}
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden border border-gray-300">
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {existingDocument ? 'Update Document' : 'Add Document'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              aria-label="Close modal"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {!isEmployee && (
                <div className="text-sm text-gray-600 mb-4">
                  Employee: <span className="font-medium">{employeeName}</span>
                </div>
              )}

              {preSelectedType ? (
                // Show selected document type (read-only)
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="text-sm font-medium text-gray-700">Document Type</div>
                  <div className="text-lg font-semibold text-gray-900">{preSelectedType.name}</div>
                  <div className="text-xs text-gray-500">
                    Category: {categories.find(c => c.id === preSelectedType.categoryId)?.name}
                  </div>
                </div>
              ) : (
                // Show dropdowns for category and type selection
                <>
                  <Select
                    label="Document Category"
                    value={formData.categoryId}
                    onChange={(value) => setFormData(prev => ({ ...prev, categoryId: value.toString() }))}
                    options={categories.map(cat => ({ value: cat.id, label: cat.name }))}
                    placeholder="Select category"
                    error={errors.categoryId}
                    required
                  />

                  <Select
                    label="Document Type"
                    value={formData.typeId}
                    onChange={(value) => setFormData(prev => ({ ...prev, typeId: value.toString() }))}
                    options={filteredTypes.map(type => ({ value: type.id, label: type.name }))}
                    placeholder="Select document type"
                    error={errors.typeId}
                    required
                    disabled={!formData.categoryId}
                  />
                </>
              )}

              {(existingDocument || document) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-blue-500 mr-2" />
                    <span className="text-sm text-blue-800">
                      Document exists. Upload a new file to replace it, or just update the dates below.
                      {isEmployee && " (Replacement will require admin approval)"}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Document File {!(existingDocument || document) && <span className="text-red-500">*</span>}
                  {(existingDocument || document) && <span className="text-gray-500">(optional - leave empty to keep current file)</span>}
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                        <span>{(existingDocument || document) ? 'Replace file' : 'Upload a file'}</span>
                        <input
                          type="file"
                          className="sr-only"
                          onChange={handleFileChange}
                          accept=".pdf,.docx,.jpg,.jpeg,.png"
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PDF, DOCX, JPG, PNG up to 5MB (all files will be converted to PDF)
                    </p>
                    {formData.file && (
                      <p className="text-sm text-green-600 font-medium">
                        Selected: {formData.file.name}
                      </p>
                    )}
                    {(existingDocument || document) && !formData.file && (
                      <p className="text-sm text-gray-600 font-medium">
                        Current file will be kept
                      </p>
                    )}
                  </div>
                </div>
                {errors.file && (
                  <p className="mt-1 text-sm text-red-600">{errors.file}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Issue Date"
                  type="date"
                  value={formData.issueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, issueDate: e.target.value }))}
                />
                
                <Input
                  label="Expiry Date"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                />
              </div>

              {(selectedType || preSelectedType) && !isEmployee && (
                <div className="text-xs text-gray-500">
                  File will be saved as: {employeeName}_{(selectedType || preSelectedType)?.name}
                </div>
              )}

              {isEmployee && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="text-sm text-yellow-800">
                    <strong>Note:</strong> All document uploads require admin approval before being added to your profile.
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pt-4 border-t border-gray-200 space-y-3 sm:space-y-0">
                <div>
                  {(existingDocument || document) && !isEmployee && (
                    <Button
                      type="button"
                      variant="danger"
                      onClick={handleDelete}
                      loading={loading}
                      className="w-full sm:w-auto"
                    >
                      Delete Document
                    </Button>
                  )}
                </div>
                
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    loading={loading}
                    className="w-full sm:w-auto"
                  >
                    {(existingDocument || document) ? 'Update' : (isEmployee ? 'Upload for Approval' : 'Add')} Document
                  </Button>
                </div>
              </div>
            </form>
        </div>
      </div>

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
    </div>
  );
};

export default DocumentModal;