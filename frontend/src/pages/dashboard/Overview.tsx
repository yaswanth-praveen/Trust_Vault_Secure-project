import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext.js';
import { orgApi } from '../../services/orgApi.js';
import { StatCard } from '../../components/common/StatCard.js';
import { AuditIntegrityWidget } from '../../components/common/AuditIntegrityWidget.js';
import { Card } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  UploadCloud, 
  Share2, 
  Users, 
  AlertOctagon, 
  ArrowUpRight,
  ShieldCheck,
  History,
  Loader2
} from 'lucide-react';
import { formatDate } from '../../utils/cn.js';

export const Overview: React.FC = () => {
  const { activeOrg, role } = useAuth();

  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['dashboard-stats', activeOrg?.id],
    queryFn: () => (activeOrg ? orgApi.getStats(activeOrg.id) : null),
    enabled: !!activeOrg,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-vault-500" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-16 text-slate-400">
        <ShieldCheck className="w-12 h-12 mx-auto mb-3 text-slate-500" />
        <h3 className="text-lg font-semibold text-slate-200">No active organization selected</h3>
        <p className="text-sm mt-1">Please select an organization from the top bar to view metrics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">Organization Overview</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time security telemetry, document access metrics, and audit integrity status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/documents">
            <Button size="sm">
              <FileText className="w-4 h-4" />
              Document Vault
            </Button>
          </Link>
          {(role === 'ORG_ADMIN' || role === 'AUDITOR' || role === 'SUPER_ADMIN') && (
            <Link to="/audit">
              <Button size="sm" variant="outline">
                <History className="w-4 h-4" />
                Audit Logs
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Cryptographic Hash Chain Integrity Widget */}
      <AuditIntegrityWidget
        initialStatus={stats.auditIntegrityStatus}
        initialLastVerified={stats.lastVerifiedAt}
        onVerified={refetch}
      />

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Documents"
          value={stats.totalDocuments}
          icon={FileText}
          description="Confidential vault records"
        />
        <StatCard
          title="Recent Uploads"
          value={stats.recentUploads}
          icon={UploadCloud}
          description="Last 7 days"
          variant="success"
        />
        <StatCard
          title="Active Shares"
          value={stats.activeShares}
          icon={Share2}
          description="Enforced permissions"
        />
        <StatCard
          title="Organization Users"
          value={stats.totalUsers}
          icon={Users}
          description="Active identities"
        />
        <StatCard
          title="Failed Attempts"
          value={stats.failedAccessAttempts}
          icon={AlertOctagon}
          description="Unauthorized access"
          variant={stats.failedAccessAttempts > 0 ? 'danger' : 'default'}
        />
      </div>

      {/* Recent Activity Section */}
      <Card>
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-100">Recent Audit Activities</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Append-only cryptographic event sequence for {activeOrg?.name}
            </p>
          </div>
          {(role === 'ORG_ADMIN' || role === 'AUDITOR' || role === 'SUPER_ADMIN') && (
            <Link to="/audit" className="text-xs font-semibold text-vault-400 hover:text-vault-300 flex items-center gap-1">
              View Complete Audit Trail
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        <div className="divide-y divide-slate-800/60">
          {stats.recentAuditActivities.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-500">No activity recorded yet.</p>
          ) : (
            stats.recentAuditActivities.map((event) => (
              <div key={event.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-slate-500 font-semibold">#{event.sequenceNumber}</span>
                  <div>
                    <span className="font-semibold text-slate-200 block">{event.action}</span>
                    <span className="text-[11px] text-slate-400">
                      by {event.actor?.fullName || 'SYSTEM'} • {event.resourceType}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] text-slate-400 hidden sm:inline">
                    {formatDate(event.timestamp)}
                  </span>
                  <Badge variant={event.outcome === 'SUCCESS' ? 'success' : 'danger'}>
                    {event.outcome}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};
