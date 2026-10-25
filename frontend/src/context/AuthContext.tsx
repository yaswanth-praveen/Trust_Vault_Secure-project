import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, ActiveOrganization, Membership, UserRole } from '../types/index.js';
import { authApi } from '../services/authApi.js';

interface AuthContextType {
  user: User | null;
  activeOrg: ActiveOrganization | null;
  memberships: Membership[];
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, orgId?: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  switchOrg: (orgId: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [activeOrg, setActiveOrg] = useState<ActiveOrganization | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionVerified, setSessionVerified] = useState<boolean>(() => {
    return sessionStorage.getItem('trustvault_active_session') === 'true';
  });

  const refreshProfile = async () => {
    try {
      // Only restore user profile if this browser session was actively authenticated
      if (sessionStorage.getItem('trustvault_active_session') === 'true') {
        const data = await authApi.getMe();
        setUser(data.user);
        setActiveOrg(data.activeOrganization);
        setMemberships(data.memberships);
        setSessionVerified(true);
      } else {
        setUser(null);
        setActiveOrg(null);
        setMemberships([]);
        setSessionVerified(false);
      }
    } catch {
      setUser(null);
      setActiveOrg(null);
      setMemberships([]);
      setSessionVerified(false);
      sessionStorage.removeItem('trustvault_active_session');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  const login = async (email: string, password: string, orgId?: string, rememberMe?: boolean) => {
    setIsLoading(true);
    try {
      await authApi.login(email, password, orgId, rememberMe);
      sessionStorage.setItem('trustvault_active_session', 'true');
      setSessionVerified(true);
      const data = await authApi.getMe();
      setUser(data.user);
      setActiveOrg(data.activeOrganization);
      setMemberships(data.memberships);
    } catch (error) {
      sessionStorage.removeItem('trustvault_active_session');
      setSessionVerified(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      sessionStorage.removeItem('trustvault_active_session');
      setSessionVerified(false);
      setUser(null);
      setActiveOrg(null);
      setMemberships([]);
    }
  };

  const switchOrg = async (orgId: string) => {
    setIsLoading(true);
    try {
      await authApi.switchOrg(orgId);
      const data = await authApi.getMe();
      setUser(data.user);
      setActiveOrg(data.activeOrganization);
      setMemberships(data.memberships);
    } finally {
      setIsLoading(false);
    }
  };

  const role = user?.isSuperAdmin ? 'SUPER_ADMIN' : (activeOrg?.role || null);

  return (
    <AuthContext.Provider
      value={{
        user,
        activeOrg,
        memberships,
        role,
        isAuthenticated: !!user && sessionVerified,
        isLoading,
        login,
        logout,
        switchOrg,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
