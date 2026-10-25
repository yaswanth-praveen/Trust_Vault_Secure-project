import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { 
  Building2, 
  ChevronDown, 
  LogOut, 
  User as UserIcon, 
  ShieldCheck 
} from 'lucide-react';
import { Badge } from '../ui/Badge.js';
import { useToast } from '../ui/Toast.js';

export const TopNav: React.FC = () => {
  const { user, activeOrg, memberships, switchOrg, logout, role } = useAuth();
  const { toast } = useToast();
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);

  const handleSwitchOrg = async (orgId: string) => {
    setIsOrgDropdownOpen(false);
    try {
      await switchOrg(orgId);
      toast('Switched active organization context', 'success');
    } catch (err: any) {
      toast(err.message, 'error');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast('Signed out successfully', 'info');
    } catch (err: any) {
      toast(err.message, 'error');
    }
  };

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 z-20">
      {/* Left: Organization Switcher */}
      <div className="flex items-center gap-4">
        {memberships.length > 1 ? (
          <div className="relative">
            <button
              onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors"
            >
              <Building2 className="w-4 h-4 text-vault-400" />
              <span>{activeOrg?.name || 'Select Organization'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isOrgDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setIsOrgDropdownOpen(false)} 
                />
                <div className="absolute left-0 mt-2 w-64 rounded-xl border border-slate-700 bg-slate-900 p-1.5 shadow-2xl z-40 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Switch Organization
                  </div>
                  {memberships.map((m) => (
                    <button
                      key={m.organizationId}
                      onClick={() => handleSwitchOrg(m.organizationId)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg text-left transition-colors ${
                        m.organizationId === activeOrg?.id
                          ? 'bg-vault-600/20 text-vault-300 font-semibold'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <span className="truncate">{m.organizationName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{m.role}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-semibold text-slate-200">{activeOrg?.name || 'TrustVault Platform'}</span>
          </div>
        )}
      </div>

      {/* Right: User info & Logout */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
            <UserIcon className="w-4 h-4" />
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold text-slate-100">{user?.fullName}</div>
            <div className="text-[11px] text-slate-400 truncate max-w-[150px]">{user?.email}</div>
          </div>
          {role && (
            <Badge 
              variant={
                role === 'SUPER_ADMIN' ? 'danger' :
                role === 'ORG_ADMIN' ? 'warning' :
                role === 'AUDITOR' ? 'info' : 'success'
              }
              className="hidden md:inline-flex text-[10px]"
            >
              {role}
            </Badge>
          )}
        </div>

        <button
          onClick={handleLogout}
          title="Sign out"
          className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
