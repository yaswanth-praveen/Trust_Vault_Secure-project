import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { orgApi } from '../../services/orgApi.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../components/ui/Toast.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { Badge } from '../../components/ui/Badge.js';
import { Modal } from '../../components/ui/Modal.js';
import { Organization } from '../../types/index.js';
import { 
  Building2, 
  Plus, 
  ShieldCheck, 
  Users, 
  FileText, 
  History, 
  Power, 
  Loader2,
  AlertCircle 
} from 'lucide-react';
import { formatDate } from '../../utils/cn.js';
import { Navigate } from 'react-router-dom';

export const OrganizationManagement: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgSlug, setNewOrgSlug] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Super Admin route guard
  if (!user?.isSuperAdmin) {
    return <Navigate to="/403" replace />;
  }

  const { data: orgs, isLoading, refetch } = useQuery({
    queryKey: ['superadmin-orgs'],
    queryFn: () => orgApi.list(),
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await orgApi.create({ name: newOrgName, slug: newOrgSlug });
      toast(`Organization ${newOrgName} initialized with Genesis audit block`, 'success');
      setNewOrgName('');
      setNewOrgSlug('');
      setIsCreateOpen(false);
      refetch();
    } catch (err: any) {
      setError(err.message || 'Failed to create organization');
      toast(err.message || 'Error creating organization', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (org: Organization) => {
    const nextStatus = org.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await orgApi.update(org.id, { status: nextStatus });
      toast(`Organization status changed to ${nextStatus}`, 'info');
      refetch();
    } catch (err: any) {
      toast(err.message || 'Failed to update status', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">
            Platform Organizations
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Super Administrator platform overview: provision, monitor and suspend tenant organizations.
          </p>
        </div>

        <Button onClick={() => setIsCreateOpen(true)} size="sm">
          <Plus className="w-4 h-4" />
          Create Organization
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-vault-500" />
          </div>
        ) : !orgs || orgs.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Building2 className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-slate-300">No organizations found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Organization Name</th>
                  <th className="py-3.5 px-4">Slug Identifier</th>
                  <th className="py-3.5 px-4">Total Users</th>
                  <th className="py-3.5 px-4">Documents</th>
                  <th className="py-3.5 px-4">Audit Records</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {orgs.map((org) => (
                  <tr key={org.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-200 block">{org.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{org.id}</span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-vault-400">
                      {org.slug}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {org._count?.memberships || 0}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {org._count?.documents || 0}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {org._count?.auditEvents || 0}
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge variant={org.status === 'ACTIVE' ? 'success' : 'danger'}>
                        {org.status}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Button
                        size="sm"
                        variant={org.status === 'ACTIVE' ? 'outline' : 'secondary'}
                        onClick={() => handleToggleStatus(org)}
                        className="text-[11px] py-1"
                      >
                        <Power className="w-3 h-3" />
                        {org.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create Org Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Provision New Organization"
        description="Creates an isolated multi-tenant environment with an initialized cryptographic audit chain."
        maxWidth="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <Input
            label="Organization Name"
            placeholder="e.g. Wayne Enterprises"
            value={newOrgName}
            onChange={(e) => {
              setNewOrgName(e.target.value);
              if (!newOrgSlug) {
                setNewOrgSlug(
                  e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-|-$/g, '')
                );
              }
            }}
            required
          />

          <Input
            label="Slug Identifier"
            placeholder="e.g. wayne-ent"
            value={newOrgSlug}
            onChange={(e) => setNewOrgSlug(e.target.value)}
            helperText="Used for unique tenant identification (lowercase alphanumeric and hyphens)"
            required
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting}>
              <Plus className="w-4 h-4" />
              Provision Organization
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
