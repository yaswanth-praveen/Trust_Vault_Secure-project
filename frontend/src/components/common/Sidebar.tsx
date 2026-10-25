import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  FileText, 
  Users, 
  History, 
  Settings, 
  Building2,
  Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { cn } from '../../utils/cn.js';

export const Sidebar: React.FC = () => {
  const { user, role, activeOrg } = useAuth();

  const isSuperAdmin = user?.isSuperAdmin;
  const isOrgAdmin = role === 'ORG_ADMIN';
  const isAuditor = role === 'AUDITOR';

  const navItems = [
    {
      label: 'Overview',
      path: '/dashboard',
      icon: LayoutDashboard,
      visible: true,
    },
    {
      label: 'Documents Vault',
      path: '/documents',
      icon: FileText,
      visible: true,
    },
    {
      label: 'Organization Users',
      path: '/users',
      icon: Users,
      visible: isSuperAdmin || isOrgAdmin,
    },
    {
      label: 'Cryptographic Audit',
      path: '/audit',
      icon: History,
      visible: isSuperAdmin || isOrgAdmin || isAuditor,
    },
    {
      label: 'Organization Settings',
      path: '/settings',
      icon: Settings,
      visible: isSuperAdmin || isOrgAdmin,
    },
    {
      label: 'Platform Organizations',
      path: '/superadmin/organizations',
      icon: Building2,
      visible: isSuperAdmin,
    },
  ];

  return (
    <aside className="w-64 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col min-h-screen">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-vault-600 to-vault-400 flex items-center justify-center text-white shadow-md shadow-vault-600/30">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <span className="font-bold text-base text-slate-100 tracking-tight flex items-center gap-1.5">
            TrustVault
            <span className="text-[10px] bg-vault-500/10 text-vault-400 border border-vault-500/20 px-1.5 py-0.2 rounded font-mono font-semibold">
              v1.0
            </span>
          </span>
          <p className="text-[11px] text-slate-400 font-medium">Confidential Document Vault</p>
        </div>
      </div>

      {/* Active Organization Context */}
      {activeOrg && (
        <div className="p-4 mx-3 my-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            <Building2 className="w-3.5 h-3.5 text-vault-400" />
            <span>Active Tenant</span>
          </div>
          <div className="text-sm font-semibold text-slate-200 truncate">{activeOrg.name}</div>
          <div className="text-[11px] text-slate-400 font-mono mt-0.5">Role: <span className="text-vault-400 font-medium">{role}</span></div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navItems
          .filter((item) => item.visible)
          .map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group',
                  isActive
                    ? 'bg-vault-600 text-white shadow-sm shadow-vault-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
                )
              }
            >
              <item.icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
              <span>{item.label}</span>
            </NavLink>
          ))}
      </nav>

      {/* Security Status Footer */}
      <div className="p-4 border-t border-slate-800 mt-auto">
        <div className="flex items-center gap-2 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-lg font-mono">
          <Lock className="w-3.5 h-3.5 shrink-0" />
          <span>Zero-Trust Enforced</span>
        </div>
      </div>
    </aside>
  );
};
