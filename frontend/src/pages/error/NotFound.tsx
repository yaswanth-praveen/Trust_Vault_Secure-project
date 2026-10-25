import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button.js';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="p-4 rounded-2xl bg-slate-800 text-slate-400 border border-slate-700">
        <FileQuestion className="w-12 h-12" />
      </div>
      <h2 className="text-2xl font-extrabold text-slate-100">Page Not Found (404)</h2>
      <p className="text-xs text-slate-400 max-w-sm">
        The requested vault resource or path does not exist.
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
