import { api } from './api.js';
import { Document } from '../types/index.js';

export const docApi = {
  list: async (params?: {
    search?: string;
    mimeType?: string;
    isArchived?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ documents: Document[]; pagination: any }> => {
    const res = await api.get('/documents', { params });
    return res.data.data;
  },

  getById: async (documentId: string): Promise<{ document: Document; isOwner: boolean; sharePermission: string }> => {
    const res = await api.get(`/documents/${documentId}`);
    return res.data.data;
  },

  upload: async (formData: FormData): Promise<{ document: Document }> => {
    const res = await api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  update: async (documentId: string, data: { title?: string; description?: string; isArchived?: boolean }) => {
    const res = await api.patch(`/documents/${documentId}`, data);
    return res.data.data;
  },

  delete: async (documentId: string): Promise<void> => {
    await api.delete(`/documents/${documentId}`);
  },

  downloadBlob: async (documentId: string): Promise<{ blob: Blob; filename: string }> => {
    const res = await api.get(`/documents/${documentId}/download`, {
      responseType: 'blob',
    });
    
    // Extract filename from Content-Disposition if present
    const disposition = res.headers['content-disposition'];
    let filename = `document-${documentId}`;
    if (disposition && disposition.indexOf('filename=') !== -1) {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match?.[1]) filename = match[1];
    }

    return { blob: res.data, filename };
  },

  getPreviewUrl: (documentId: string): string => {
    return `/api/documents/${documentId}/preview`;
  },
};
