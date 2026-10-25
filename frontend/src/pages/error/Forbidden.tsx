import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button.js';

export const Forbidden: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
        <ShieldAlert className="w-12 h-12" />
      </div>
      <h2 className="text-2xl font-extrabold text-slate-100">Access Denied (403)</h2>
      <p className="text-xs text-slate-400 max-w-sm">
        You do not possess the required organizational role or permissions to access this resource. All unauthorized access attempts are logged in the cryptographic audit trail.
      </p>
      <Link to="/dashboard">
        <Button size="sm" variant="outline">
          <ArrowLeft className="w-4 h-4" />
          Return to Dashboard
        </Button>
      </Link>
    </div>
  );
};
