import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { userApi } from '../../services/userApi.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../components/ui/Toast.js';
import { UserPlus, AlertCircle } from 'lucide-react';

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const InviteUserModal: React.FC<InviteUserModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { activeOrg } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('STANDARD_USER');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!activeOrg) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await userApi.invite(activeOrg.id, {
        email,
        fullName,
        role,
      });

      toast(`Invitation sent to ${email}`, 'success');
      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Failed to send invitation');
      toast(err.message || 'Invitation error', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setFullName('');
    setRole('STANDARD_USER');
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Invite Organization Member"
      description={`Add a new member to ${activeOrg.name} with assigned role permissions.`}
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
          placeholder="e.g. Eleanor Vance"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />

        <Input
          label="Email Address"
          type="email"
          placeholder="eleanor@organization.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Organization Role
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
          <Button type="button" variant="outline" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" isLoading={isSubmitting}>
            <UserPlus className="w-4 h-4" />
            Send Invitation
          </Button>
        </div>
      </form>
    </Modal>
  );
};
