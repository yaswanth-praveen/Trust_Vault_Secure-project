import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { Card } from '../../components/ui/Card.js';
import { useToast } from '../../components/ui/Toast.js';
import { Lock, Key, ArrowRight, UserCheck } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, user, role, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      await login(email, password, undefined, rememberMe);
      toast('Signed in successfully', 'success');
      navigate('/dashboard');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to sign in. Please check your credentials.');
      toast(err.message || 'Login failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const setDemoCredentials = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage('');
  };

  return (
    <Card className="border-slate-800 bg-slate-900/80 p-7 shadow-2xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-100">Sign in to TrustVault</h2>
        <p className="text-xs text-slate-400 mt-1">
          Enter your organization credentials to access the secure vault.
        </p>
      </div>

      {/* Banner if already authenticated */}
      {isAuthenticated && user && (
        <div className="mb-5 p-3 rounded-xl bg-vault-600/10 border border-vault-500/20 text-xs text-vault-200 flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            <UserCheck className="w-4 h-4 text-vault-400 shrink-0" />
            <span className="truncate">Active: <strong>{user.fullName}</strong> ({role})</span>
          </div>
          <Link
            to="/dashboard"
            className="text-vault-400 hover:text-vault-300 font-semibold flex items-center gap-1 shrink-0 ml-2"
          >
            Dashboard <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {errorMessage && (
        <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <Key className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          placeholder="name@organization.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-vault-600 focus:ring-vault-500"
            />
            <span>Remember session across browser closes</span>
          </label>
        </div>

        <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
          <Lock className="w-4 h-4" />
          Authenticate Session
        </Button>
      </form>

      {/* Demo Credentials Quick-Fill Selector */}
      <div className="mt-6 pt-5 border-t border-slate-800">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2.5">
          Quick Demo Credentials:
        </span>
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setDemoCredentials('admin@acme.com', 'AdminPass123!')}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-left text-slate-300 transition-colors"
          >
            <div className="font-semibold text-slate-100">Acme Org Admin</div>
            <div className="text-[10px] text-slate-400">admin@acme.com</div>
          </button>

          <button
            type="button"
            onClick={() => setDemoCredentials('auditor@acme.com', 'AuditorPass123!')}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-left text-slate-300 transition-colors"
          >
            <div className="font-semibold text-slate-100">Compliance Auditor</div>
            <div className="text-[10px] text-slate-400">auditor@acme.com</div>
          </button>

          <button
            type="button"
            onClick={() => setDemoCredentials('manager@acme.com', 'ManagerPass123!')}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-left text-slate-300 transition-colors"
          >
            <div className="font-semibold text-slate-100">Doc Manager</div>
            <div className="text-[10px] text-slate-400">manager@acme.com</div>
          </button>

          <button
            type="button"
            onClick={() => setDemoCredentials('user@acme.com', 'UserPass123!')}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-left text-slate-300 transition-colors"
          >
            <div className="font-semibold text-slate-100">Standard User</div>
            <div className="text-[10px] text-slate-400">user@acme.com</div>
          </button>

          <button
            type="button"
            onClick={() => setDemoCredentials('superadmin@trustvault.com', 'SuperAdmin123!')}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-left text-slate-300 col-span-2 transition-colors"
          >
            <div className="font-semibold text-slate-100 flex items-center justify-between">
              <span>Super Administrator</span>
              <span className="text-[10px] text-amber-400 uppercase font-mono">Platform</span>
            </div>
            <div className="text-[10px] text-slate-400">superadmin@trustvault.com</div>
          </button>
        </div>
      </div>
    </Card>
  );
};
