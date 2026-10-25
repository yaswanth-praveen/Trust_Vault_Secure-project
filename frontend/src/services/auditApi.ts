import { api } from './api.js';
import { AuditEvent, VerificationResult } from '../types/index.js';

export const auditApi = {
  list: async (params?: {
    search?: string;
    actorId?: string;
    action?: string;
    resourceType?: string;
    outcome?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{ events: AuditEvent[]; pagination: any }> => {
    const res = await api.get('/audit-events', { params });
    return res.data.data;
  },

  getById: async (eventId: string): Promise<AuditEvent> => {
    const res = await api.get(`/audit-events/${eventId}`);
    return res.data.data.event;
  },

  verify: async (): Promise<VerificationResult> => {
    const res = await api.post('/audit-events/verify');
    return res.data.data;
  },

  exportCsv: async (): Promise<Blob> => {
    const res = await api.get('/audit-events/export', { responseType: 'blob' });
    return res.data;
  },
};
