import { api } from './api.js';
import { DocumentShare } from '../types/index.js';

export const shareApi = {
  list: async (documentId: string): Promise<DocumentShare[]> => {
    const res = await api.get(`/documents/${documentId}/shares`);
    return res.data.data.shares;
  },

  create: async (
    documentId: string,
    data: {
      grantedToUserId?: string;
      permission: string;
      expiresAt?: string;
    }
  ): Promise<DocumentShare> => {
    const res = await api.post(`/documents/${documentId}/shares`, data);
    return res.data.data.share;
  },

  update: async (
    documentId: string,
    shareId: string,
    data: {
      permission?: string;
      expiresAt?: string | null;
    }
  ): Promise<DocumentShare> => {
    const res = await api.patch(`/documents/${documentId}/shares/${shareId}`, data);
    return res.data.data.share;
  },

  revoke: async (documentId: string, shareId: string): Promise<void> => {
    await api.delete(`/documents/${documentId}/shares/${shareId}`);
  },
};
