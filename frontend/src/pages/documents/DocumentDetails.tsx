import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { docApi } from '../../services/docApi.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { useToast } from '../../components/ui/Toast.js';
import { DocumentSharingModal } from './DocumentSharingModal.js';
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  Trash2, 
  FileText, 
  Copy, 
  Check, 
  ShieldCheck, 
  Calendar, 
  User, 
  HardDrive,
  Loader2
} from 'lucide-react';
import { formatBytes, formatDate } from '../../utils/cn.js';

export const DocumentDetails: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['document-details', documentId],
    queryFn: () => (documentId ? docApi.getById(documentId) : null),
    enabled: !!documentId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-vault-500" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-16 space-y-4">
        <FileText className="w-12 h-12 text-slate-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-200">Document Not Accessible</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          You either do not have permission to view this document or it has been removed.
        </p>
        <Button variant="outline" size="sm" onClick={() => navigate('/documents')}>
          <ArrowLeft className="w-4 h-4" />
          Back to Document Library
        </Button>
      </div>
    );
  }

  const { document, isOwner, sharePermission } = data;

  const handleCopyHash = () => {
    navigator.clipboard.writeText(document.fileHashSha256);
    setCopiedHash(true);
    toast('SHA-256 hash copied to clipboard', 'info');
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const { blob, filename } = await docApi.downloadBlob(document.id);
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = filename;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);
      toast('Document download initiated', 'success');
    } catch (err: any) {
      toast(err.message || 'Download failed', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this document and revoke all shares?')) {
      return;
    }

    try {
      await docApi.delete(document.id);
      toast('Document deleted from vault', 'success');
      navigate('/documents');
    } catch (err: any) {
      toast(err.message || 'Failed to delete document', 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* Navigation header */}
      <div className="flex items-center justify-between">
        <Link
          to="/documents"
          className="text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Documents
        </Link>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsShareModalOpen(true)}>
            <Share2 className="w-4 h-4" />
            Manage Shares
          </Button>

          <Button size="sm" onClick={handleDownload} isLoading={isDownloading}>
            <Download className="w-4 h-4" />
            Download
          </Button>

          {isOwner && (
            <Button variant="danger" size="sm" onClick={handleDelete}>
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Main Metadata Card */}
      <Card className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-vault-600/10 border border-vault-500/20 flex items-center justify-center text-vault-400 shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">{document.title}</h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{document.originalFilename}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="info">{sharePermission}</Badge>
            {document.isArchived && <Badge variant="warning">Archived</Badge>}
          </div>
        </div>

        {document.description && (
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Description / Notes
            </h4>
            <p className="text-sm text-slate-300 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/80">
              {document.description}
            </p>
          </div>
        )}

        {/* Metadata Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 flex items-center gap-1.5 mb-1">
              <User className="w-3.5 h-3.5 text-vault-400" />
              Uploaded By
            </span>
            <span className="font-semibold text-slate-200">
              {document.uploader?.fullName || 'Internal User'}
            </span>
            <span className="block text-[11px] text-slate-500 truncate mt-0.5">
              {document.uploader?.email}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 flex items-center gap-1.5 mb-1">
              <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
              File Size & Format
            </span>
            <span className="font-semibold text-slate-200 font-mono">
              {formatBytes(document.fileSizeBytes)}
            </span>
            <span className="block text-[11px] text-slate-500 font-mono truncate mt-0.5">
              {document.mimeType}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 flex items-center gap-1.5 mb-1">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              Upload Timestamp
            </span>
            <span className="font-semibold text-slate-200 font-mono">
              {formatDate(document.createdAt)}
            </span>
            <span className="block text-[11px] text-slate-500 font-mono mt-0.5">
              Updated: {formatDate(document.updatedAt)}
            </span>
          </div>
        </div>

        {/* Cryptographic SHA-256 Digest Section */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Cryptographic Integrity Digest (SHA-256)
            </span>
            <button
              onClick={handleCopyHash}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              {copiedHash ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Digest</span>
                </>
              )}
            </button>
          </div>
          <code className="text-xs text-vault-300 font-mono bg-slate-900 px-3 py-2 rounded-lg block truncate border border-slate-800">
            {document.fileHashSha256}
          </code>
        </div>
      </Card>

      {/* Sharing modal */}
      <DocumentSharingModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        document={document}
        onSuccess={refetch}
      />
    </div>
  );
};
