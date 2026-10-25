import { api } from './api.js';
import { User, ActiveOrganization, Membership } from '../types/index.js';

export interface LoginResponse {
  user: User;
  activeOrgId: string | null;
  memberships: Membership[];
}

export interface MeResponse {
  user: User;
  activeOrganization: ActiveOrganization | null;
  memberships: Membership[];
}

export const authApi = {
  login: async (email: string, password: string, organizationId?: string, rememberMe?: boolean): Promise<LoginResponse> => {
    const res = await api.post('/auth/login', { email, password, organizationId, rememberMe });
    return res.data.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  getMe: async (): Promise<MeResponse> => {
    const res = await api.get('/auth/me');
    return res.data.data;
  },

  switchOrg: async (organizationId: string) => {
    const res = await api.post('/auth/switch-org', { organizationId });
    return res.data.data;
  },
};
