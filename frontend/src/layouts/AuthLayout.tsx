import React from 'react';
import { Outlet } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-vault-600/10 blur-[120px] pointer-events-none rounded-full" />
      
      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-vault-600 to-vault-400 flex items-center justify-center text-white shadow-xl shadow-vault-600/30 mb-3">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">TrustVault</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            Multi-Tenant Confidential Document Vault with Real Tamper-Evident Audit Trail
          </p>
        </div>

        <Outlet />
      </div>
    </div>
  );
};
