import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { docApi } from '../../services/docApi.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../components/ui/Toast.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { DocumentUploadModal } from './DocumentUploadModal.js';
import { DocumentSharingModal } from './DocumentSharingModal.js';
import { Document } from '../../types/index.js';
import { 
  FileText, 
  UploadCloud, 
  Search, 
  Download, 
  Share2, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { formatBytes, formatDate } from '../../utils/cn.js';

export const DocumentList: React.FC = () => {
  const { role, activeOrg } = useAuth();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedDocForShare, setSelectedDocForShare] = useState<Document | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['documents', activeOrg?.id, searchTerm, page],
    queryFn: () =>
      docApi.list({
        search: searchTerm || undefined,
        page,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }),
    enabled: !!activeOrg,
  });

  const handleDownload = async (doc: Document) => {
    try {
      const { blob, filename } = await docApi.downloadBlob(doc.id);
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = filename;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);
      toast('Document downloaded successfully', 'success');
    } catch (err: any) {
      toast(err.message || 'Download failed', 'error');
    }
  };

  const handleDelete = async (docId: string) => {
    if (!window.confirm('Are you sure you want to delete this document from the vault?')) return;
    try {
      await docApi.delete(docId);
      toast('Document removed from vault', 'success');
      refetch();
    } catch (err: any) {
      toast(err.message || 'Failed to delete document', 'error');
    }
  };

  const canUpload = role === 'ORG_ADMIN' || role === 'DOCUMENT_MANAGER' || role === 'STANDARD_USER' || role === 'SUPER_ADMIN';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">Documents Vault</h1>
          <p className="text-xs text-slate-400 mt-1">
            End-to-end encrypted storage with tenant isolation and granular access permissions.
          </p>
        </div>

        {canUpload && (
          <Button onClick={() => setIsUploadOpen(true)} size="sm">
            <UploadCloud className="w-4 h-4" />
            Upload Document
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search documents by name or title..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-vault-500"
          />
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Total: <span className="text-slate-200 font-semibold">{data?.pagination.total || 0}</span> documents
        </div>
      </Card>

      {/* Documents Table */}
      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-vault-500" />
          </div>
        ) : !data || data.documents.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <FileText className="w-10 h-10 mx-auto text-slate-600" />
            <p className="text-sm font-semibold text-slate-300">No documents found</p>
            <p className="text-xs text-slate-500">
              {searchTerm ? 'Try adjusting your search criteria' : 'Upload your first confidential document to get started'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Document Title</th>
                  <th className="py-3.5 px-4">Format</th>
                  <th className="py-3.5 px-4">Size</th>
                  <th className="py-3.5 px-4">Uploader</th>
                  <th className="py-3.5 px-4">Uploaded Date</th>
                  <th className="py-3.5 px-4">Active Shares</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data.documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <Link
                        to={`/documents/${doc.id}`}
                        className="font-semibold text-slate-200 hover:text-vault-400 flex items-center gap-2 group"
                      >
                        <FileText className="w-4 h-4 text-vault-400 shrink-0 group-hover:scale-110 transition-transform" />
                        <span className="truncate max-w-[220px]">{doc.title}</span>
                      </Link>
                      <span className="text-[10px] text-slate-500 font-mono block truncate max-w-[220px] mt-0.5">
                        {doc.originalFilename}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge variant="neutral" className="text-[10px]">
                        {doc.mimeType.split('/')[1] || 'FILE'}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {formatBytes(doc.fileSizeBytes)}
                    </td>

                    <td className="py-3.5 px-4 text-slate-300">
                      <div>{doc.uploader?.fullName || 'Internal User'}</div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[140px]">
                        {doc.uploader?.email}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {formatDate(doc.createdAt)}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                        <Share2 className="w-3 h-3 text-vault-400" />
                        {doc.activeSharesCount || 0}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleDownload(doc)}
                          title="Authorized Download"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-vault-400 hover:bg-slate-800 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setSelectedDocForShare(doc)}
                          title="Manage Document Permissions"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-vault-400 hover:bg-slate-800 transition-colors"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>

                        <Link
                          to={`/documents/${doc.id}`}
                          title="View Details & Checksum"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-vault-400 hover:bg-slate-800 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>

                        {(role === 'ORG_ADMIN' || role === 'DOCUMENT_MANAGER' || role === 'SUPER_ADMIN') && (
                          <button
                            onClick={() => handleDelete(doc.id)}
                            title="Delete Document"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {data && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800 bg-slate-900/40 text-xs">
            <span className="text-slate-400">
              Page {data.pagination.page} of {data.pagination.totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Upload and Share Modals */}
      <DocumentUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={refetch}
      />

      <DocumentSharingModal
        isOpen={!!selectedDocForShare}
        onClose={() => setSelectedDocForShare(null)}
        document={selectedDocForShare}
        onSuccess={refetch}
      />
    </div>
  );
};
