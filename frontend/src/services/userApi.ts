import { api } from './api.js';

export interface OrgUserItem {
  membershipId: string;
  userId: string;
  fullName: string;
  email: string;
  role: string;
  membershipStatus: string;
  userStatus: string;
  joinedAt: string;
}

export const userApi = {
  list: async (orgId: string): Promise<{ members: OrgUserItem[]; invitations: any[] }> => {
    const res = await api.get(`/organizations/${orgId}/users`);
    return res.data.data;
  },

  invite: async (
    orgId: string,
    data: { email: string; fullName: string; role: string }
  ) => {
    const res = await api.post(`/organizations/${orgId}/invitations`, data);
    return res.data.data;
  },

  updateRole: async (orgId: string, userId: string, role: string) => {
    const res = await api.patch(`/organizations/${orgId}/users/${userId}/role`, { role });
    return res.data.data;
  },

  updateStatus: async (orgId: string, userId: string, status: 'ACTIVE' | 'SUSPENDED') => {
    const res = await api.patch(`/organizations/${orgId}/users/${userId}/status`, { status });
    return res.data.data;
  },

  updateDetails: async (
    orgId: string,
    userId: string,
    data: { fullName?: string; email?: string; role?: string; password?: string }
  ) => {
    const res = await api.patch(`/organizations/${orgId}/users/${userId}`, data);
    return res.data.data;
  },
};
