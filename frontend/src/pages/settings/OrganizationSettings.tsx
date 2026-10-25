import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { orgApi } from '../../services/orgApi.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../components/ui/Toast.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { Badge } from '../../components/ui/Badge.js';
import { Building2, Save, Shield, Hash, Loader2 } from 'lucide-react';

export const OrganizationSettings: React.FC = () => {
  const { activeOrg, role, refreshProfile } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { data: org, isLoading, refetch } = useQuery({
    queryKey: ['org-settings', activeOrg?.id],
    queryFn: async () => {
      if (!activeOrg) return null;
      const res = await orgApi.getById(activeOrg.id);
      setName(res.name);
      return res;
    },
    enabled: !!activeOrg,
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrg) return;

    setIsSaving(true);
    try {
      await orgApi.update(activeOrg.id, { name });
      toast('Organization settings updated and audited', 'success');
      refetch();
      refreshProfile();
    } catch (err: any) {
      toast(err.message || 'Failed to update organization settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const isOrgAdmin = role === 'ORG_ADMIN' || role === 'SUPER_ADMIN';

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-vault-500" />
      </div>
    );
  }

  if (!org) return null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">
          Organization Settings
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Tenant profile, data isolation boundaries, and organizational policies.
        </p>
      </div>

      <Card className="space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-vault-600/10 border border-vault-500/20 text-vault-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">{org.name}</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">Slug: {org.slug}</p>
            </div>
          </div>
          <Badge variant={org.status === 'ACTIVE' ? 'success' : 'danger'}>
            {org.status}
          </Badge>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Organization Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!isOrgAdmin}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] block mb-1">
                Unique Tenant ID (UUID)
              </span>
              <code className="text-vault-300 font-mono text-[11px] block truncate">
                {org.id}
              </code>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] block mb-1">
                Data Isolation Scope
              </span>
              <span className="text-slate-200 font-semibold flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                Strict Multi-Tenant Scoped
              </span>
            </div>
          </div>

          {isOrgAdmin && (
            <div className="flex justify-end pt-3 border-t border-slate-800">
              <Button type="submit" size="sm" isLoading={isSaving}>
                <Save className="w-4 h-4" />
                Save Changes
              </Button>
            </div>
          )}
        </form>
      </Card>
    </div>
  );
};
