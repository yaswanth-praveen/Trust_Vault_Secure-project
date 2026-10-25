import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditApi } from '../../services/auditApi.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../components/ui/Toast.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { AuditEventDetailsModal } from './AuditEventDetailsModal.js';
import { AuditEvent, VerificationResult } from '../../types/index.js';
import { 
  History, 
  Search, 
  Download, 
  RefreshCw, 
  ShieldCheck, 
  ShieldAlert, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  Loader2
} from 'lucide-react';
import { formatDate } from '../../utils/cn.js';

export const AuditTrail: React.FC = () => {
  const { activeOrg } = useAuth();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['audit-events', activeOrg?.id, searchTerm, outcomeFilter, actionFilter, page],
    queryFn: () =>
      auditApi.list({
        search: searchTerm || undefined,
        outcome: outcomeFilter || undefined,
        action: actionFilter || undefined,
        page,
        limit: 15,
      }),
    enabled: !!activeOrg,
  });

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const result = await auditApi.verify();
      setVerificationResult(result);
      if (result.isValid) {
        toast(`Hash-chain verified: All ${result.totalEvents} events cryptographically sound`, 'success');
      } else {
        toast(`TAMPER DETECTED: Discrepancy at sequence #${result.errorSequence}`, 'error');
      }
      refetch();
    } catch (err: any) {
      toast(err.message || 'Verification failed', 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      const blob = await auditApi.exportCsv();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `trustvault-audit-${activeOrg?.slug || 'export'}-${Date.now()}.csv`;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);
      toast('Audit trail CSV exported', 'success');
    } catch (err: any) {
      toast(err.message || 'Failed to export CSV', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">
            Cryptographic Audit Trail
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Append-only, SHA-256 hash-chained immutable security log for compliance and forensic auditing.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={handleVerify}
            isLoading={isVerifying}
          >
            <RefreshCw className="w-4 h-4" />
            Verify Chain
          </Button>

          <Button size="sm" onClick={handleExportCsv}>
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Verification Result Banner if run */}
      {verificationResult && (
        <Card
          className={`p-4 border ${
            verificationResult.isValid
              ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200'
              : 'bg-rose-950/40 border-rose-800/80 text-rose-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              {verificationResult.isValid ? (
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
              )}
              <div>
                <span className="font-bold">
                  {verificationResult.isValid
                    ? `Integrity Verified: ${verificationResult.totalEvents} blocks checked`
                    : `Integrity Alert: Chain tampered at sequence #${verificationResult.errorSequence}`}
                </span>
                <span className="block text-[11px] opacity-80 font-mono mt-0.5">
                  {verificationResult.isValid
                    ? `Head Hash: ${verificationResult.headHash}`
                    : verificationResult.errorReason}
                </span>
              </div>
            </div>
            <span className="font-mono text-[10px] opacity-60">
              {formatDate(verificationResult.verifiedAt)}
            </span>
          </div>
        </Card>
      )}

      {/* Search and Filters Bar */}
      <Card className="p-3.5 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto flex-1">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by action, resource, metadata..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-vault-500"
            />
          </div>

          <select
            value={outcomeFilter}
            onChange={(e) => {
              setOutcomeFilter(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-auto rounded-lg bg-slate-900 border border-slate-700/80 px-3 py-1.5 text-slate-200 text-xs focus:border-vault-500 focus:outline-none"
          >
            <option value="">All Outcomes</option>
            <option value="SUCCESS">Success Only</option>
            <option value="FAILURE">Failure Only</option>
          </select>

          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-auto rounded-lg bg-slate-900 border border-slate-700/80 px-3 py-1.5 text-slate-200 text-xs focus:border-vault-500 focus:outline-none"
          >
            <option value="">All Actions</option>
            <option value="AUTH_LOGIN_SUCCESS">AUTH_LOGIN_SUCCESS</option>
            <option value="AUTH_LOGIN_FAILED">AUTH_LOGIN_FAILED</option>
            <option value="DOCUMENT_UPLOAD">DOCUMENT_UPLOAD</option>
            <option value="DOCUMENT_DOWNLOAD">DOCUMENT_DOWNLOAD</option>
            <option value="DOCUMENT_PREVIEW">DOCUMENT_PREVIEW</option>
            <option value="DOCUMENT_SHARED">DOCUMENT_SHARED</option>
            <option value="DOCUMENT_SHARE_REVOKED">DOCUMENT_SHARE_REVOKED</option>
            <option value="ROLE_CHANGED">ROLE_CHANGED</option>
            <option value="USER_INVITED">USER_INVITED</option>
            <option value="AUDIT_CHAIN_VERIFICATION">AUDIT_CHAIN_VERIFICATION</option>
          </select>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Total Logged: <span className="text-slate-200 font-semibold">{data?.pagination.total || 0}</span> events
        </div>
      </Card>

      {/* Events Table */}
      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-vault-500" />
          </div>
        ) : !data || data.events.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <History className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-slate-300">No audit events match your filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Seq #</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Actor</th>
                  <th className="py-3.5 px-4">Resource</th>
                  <th className="py-3.5 px-4">Outcome</th>
                  <th className="py-3.5 px-4">Event Hash Link</th>
                  <th className="py-3.5 px-4 text-right">Timestamp (UTC)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data.events.map((event) => (
                  <tr
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-vault-400">
                      #{event.sequenceNumber}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-200">
                      {event.action}
                    </td>

                    <td className="py-3.5 px-4 text-slate-300">
                      <div>{event.actor?.fullName || 'SYSTEM'}</div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[140px]">
                        {event.actor?.email || 'Automated Engine'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {event.resourceType}
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge variant={event.outcome === 'SUCCESS' ? 'success' : 'danger'}>
                        {event.outcome}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                      <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {event.eventHash.substring(0, 12)}...
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-slate-400 text-[11px]">
                      {formatDate(event.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {data && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800 bg-slate-900/40 text-xs">
            <span className="text-slate-400">
              Page {data.pagination.page} of {data.pagination.totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Details modal */}
      <AuditEventDetailsModal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        event={selectedEvent}
      />
    </div>
  );
};
