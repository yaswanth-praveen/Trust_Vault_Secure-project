import { api } from './api.js';
import { Organization, DashboardStats } from '../types/index.js';

export const orgApi = {
  list: async (): Promise<Organization[]> => {
    const res = await api.get('/organizations');
    return res.data.data.organizations;
  },

  getById: async (orgId: string): Promise<Organization> => {
    const res = await api.get(`/organizations/${orgId}`);
    return res.data.data.organization;
  },

  create: async (data: { name: string; slug: string }): Promise<Organization> => {
    const res = await api.post('/organizations', data);
    return res.data.data.organization;
  },

  update: async (orgId: string, data: { name?: string; status?: 'ACTIVE' | 'SUSPENDED' }): Promise<Organization> => {
    const res = await api.patch(`/organizations/${orgId}`, data);
    return res.data.data.organization;
  },

  getStats: async (orgId: string): Promise<DashboardStats> => {
    const res = await api.get(`/organizations/${orgId}/stats`);
    return res.data.data.stats;
  },
};
