import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { userApi, OrgUserItem } from '../../services/userApi.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../components/ui/Toast.js';
import { Save, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: OrgUserItem | null;
  onSuccess: () => void;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  user,
  onSuccess,
}) => {
  const { activeOrg } = useAuth();
  const { toast } = useToast();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('STANDARD_USER');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setEmail(user.email);
      setRole(user.role);
      setPassword('');
      setShowPassword(false);
      setError('');
    }
  }, [user]);

  if (!user || !activeOrg) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    if (password.trim() && password.trim().length < 6) {
      setError('Password must be at least 6 characters');
      setIsSubmitting(false);
      return;
    }

    try {
      const payload: { fullName?: string; email?: string; role?: string; password?: string } = {
        fullName: fullName.trim(),
        email: email.trim(),
        role,
      };

      if (password.trim()) {
        payload.password = password.trim();
      }

      await userApi.updateDetails(activeOrg.id, user.userId, payload);

      toast(`Details for ${fullName} updated successfully`, 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update user details');
      toast(err.message || 'Error updating user', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Organization Member"
      description={`Re-correct details, password, and assigned role permissions for ${user.fullName}.`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <Input
          label="Full Name"
          placeholder="e.g. Alice Vance"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />

        <Input
          label="Email Address"
          type="email"
          placeholder="alice@organization.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Password
            </label>
            <span className="text-[11px] text-slate-400">Leave blank to keep existing</span>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter new password (optional)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg bg-slate-900/90 border border-slate-700/80 px-3.5 py-2 pr-10 text-sm text-slate-100 placeholder-slate-500 shadow-sm transition-all focus:border-vault-500 focus:outline-none focus:ring-1 focus:ring-vault-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1"
              tabIndex={-1}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4 text-slate-400" />
              ) : (
                <Eye className="w-4 h-4 text-slate-400" />
              )}
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            Minimum 6 characters. Only fill this field if you want to reset this user's login password.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Assigned Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full rounded-lg bg-slate-900 border border-slate-700/80 px-3.5 py-2 text-sm text-slate-100 focus:border-vault-500 focus:outline-none"
          >
            <option value="STANDARD_USER">Standard User (Access shared files)</option>
            <option value="DOCUMENT_MANAGER">Document Manager (Upload & share files)</option>
            <option value="AUDITOR">Compliance Auditor (Read-only audit inspection)</option>
            <option value="ORG_ADMIN">Organization Administrator (Full manage)</option>
          </select>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" isLoading={isSubmitting}>
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
