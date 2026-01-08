import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import api from '@/lib/api';

interface DocumentViewerProps {
  isOpen?: boolean;
  onClose: () => void;
  document: any;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  isOpen = true,
  onClose,
  document
}) => {
  const [documentUrl, setDocumentUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (document && (isOpen !== false)) {
      loadDocument();
    }
  }, [document, isOpen]);

  const loadDocument = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch the document as a blob with proper authentication
      const response = await api.get(`/documents/view/${document.id}`, {
        responseType: 'blob'
      });
      
      // Create a blob URL for the document
      const blob = new Blob([response.data], { type: document.mimeType || 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      setDocumentUrl(url);
    } catch (error: any) {
      console.error('Failed to load document:', error);
      setError('Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Clean up the blob URL
    if (documentUrl) {
      URL.revokeObjectURL(documentUrl);
      setDocumentUrl('');
    }
    onClose();
  };

  if (!document || isOpen === false) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {document?.documentType?.name || 'Document'}
            </h3>
            <p className="text-sm text-gray-600">
              {document?.employee?.firstName} {document?.employee?.lastName}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Document Content */}
        <div className="flex-1 p-4">
          <div className="w-full h-full bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center">
            {loading ? (
              <div className="text-gray-500">Loading document...</div>
            ) : error ? (
              <div className="text-red-500">{error}</div>
            ) : documentUrl ? (
              // Always display as PDF since all documents are converted to PDF
              <iframe
                src={documentUrl}
                className="w-full h-full border-0"
                title="Document Viewer"
              />
            ) : (
              <div className="text-gray-500">No document to display</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;