import React, { useState, useRef } from 'react';
import { Modal } from '../../components/ui/Modal.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { docApi } from '../../services/docApi.js';
import { useToast } from '../../components/ui/Toast.js';
import { UploadCloud, File, X, AlertCircle } from 'lucide-react';
import { formatBytes } from '../../utils/cn.js';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      setError('File size exceeds the 50MB maximum limit');
      return;
    }

    setSelectedFile(file);
    if (!title) {
      // Default title to base file name without extension
      const cleanName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      setTitle(cleanName);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setError('');
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      setError('File size exceeds the 50MB maximum limit');
      return;
    }

    setSelectedFile(file);
    if (!title) {
      const cleanName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      setTitle(cleanName);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', title || selectedFile.name);
      if (description) formData.append('description', description);

      await docApi.upload(formData);
      toast('Document encrypted and stored in vault', 'success');
      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Failed to upload document');
      toast(err.message || 'Upload error', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setTitle('');
    setDescription('');
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Upload Confidential Document"
      description="Files are stored securely in the private vault with cryptographic SHA-256 integrity verification."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Dropzone */}
        {!selectedFile ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-vault-500/60 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-950/40 hover:bg-slate-900/60 transition-all"
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.docx,.xlsx,.pptx,.txt,.csv,.png,.jpg,.json"
            />
            <div className="w-12 h-12 rounded-xl bg-vault-600/10 border border-vault-500/20 flex items-center justify-center text-vault-400 mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-200">
              Drag & drop your confidential document here
            </p>
            <p className="text-xs text-slate-400 mt-1">
              or <span className="text-vault-400 underline">browse files</span> from your computer
            </p>
            <span className="text-[10px] text-slate-500 mt-3 font-mono">
              Supported: PDF, DOCX, XLSX, TXT, CSV, PNG (Up to 50MB)
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-700 bg-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-vault-600/20 text-vault-400">
                <File className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-slate-100 truncate max-w-[240px]">
                  {selectedFile.name}
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  {formatBytes(selectedFile.size)} • {selectedFile.type || 'Binary'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedFile(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-700/60"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <Input
          label="Document Title"
          placeholder="e.g. Q4 Executive Financial Report"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Description (Optional)
          </label>
          <textarea
            rows={3}
            placeholder="Provide context or classification notes for this document..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg bg-slate-900/90 border border-slate-700/80 px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 shadow-sm transition-all focus:border-vault-500 focus:outline-none focus:ring-1 focus:ring-vault-500"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button type="button" variant="outline" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" isLoading={isUploading}>
            <UploadCloud className="w-4 h-4" />
            Upload Document
          </Button>
        </div>
      </form>
    </Modal>
  );
};
