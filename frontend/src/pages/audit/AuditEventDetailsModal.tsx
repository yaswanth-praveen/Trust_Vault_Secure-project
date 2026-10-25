import React from 'react';
import { Modal } from '../../components/ui/Modal.js';
import { Badge } from '../../components/ui/Badge.js';
import { AuditEvent } from '../../types/index.js';
import { formatDate } from '../../utils/cn.js';
import { ShieldCheck, Hash, User, Calendar, Network, Code } from 'lucide-react';

interface AuditEventDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: AuditEvent | null;
}

export const AuditEventDetailsModal: React.FC<AuditEventDetailsModalProps> = ({
  isOpen,
  onClose,
  event,
}) => {
  if (!event) return null;

  let parsedMetadata: any = null;
  if (event.metadata) {
    try {
      parsedMetadata = JSON.parse(event.metadata);
    } catch {
      parsedMetadata = event.metadata;
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Audit Record #${event.sequenceNumber}`}
      description="Cryptographically signed, append-only immutable event record."
      maxWidth="xl"
    >
      <div className="space-y-4 text-xs">
        {/* Top Summary */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800">
          <div className="flex items-center gap-2">
            <span className="font-mono text-vault-400 font-bold text-sm">
              #{event.sequenceNumber}
            </span>
            <span className="font-bold text-slate-100 text-sm">{event.action}</span>
          </div>
          <Badge variant={event.outcome === 'SUCCESS' ? 'success' : 'danger'}>
            {event.outcome}
          </Badge>
        </div>

        {/* 2-column info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 flex items-center gap-1.5 mb-1 text-[11px] uppercase tracking-wider font-semibold">
              <User className="w-3.5 h-3.5 text-vault-400" />
              Actor / Initiator
            </span>
            <div className="font-semibold text-slate-200">
              {event.actor?.fullName || 'SYSTEM OPERATION'}
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              {event.actor?.email || event.actorId || 'N/A'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 flex items-center gap-1.5 mb-1 text-[11px] uppercase tracking-wider font-semibold">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              UTC Timestamp
            </span>
            <div className="font-mono text-slate-200">{formatDate(event.timestamp)}</div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
              {new Date(event.timestamp).toISOString()}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 flex items-center gap-1.5 mb-1 text-[11px] uppercase tracking-wider font-semibold">
              <Hash className="w-3.5 h-3.5 text-emerald-400" />
              Resource Scope
            </span>
            <div className="font-semibold text-slate-200">{event.resourceType}</div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
              ID: {event.resourceId || 'NONE'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 flex items-center gap-1.5 mb-1 text-[11px] uppercase tracking-wider font-semibold">
              <Network className="w-3.5 h-3.5 text-blue-400" />
              Client Network Origin
            </span>
            <div className="font-mono text-slate-200">IP: {event.ipAddress || 'Internal'}</div>
            <div className="text-[10px] text-slate-500 font-mono truncate mt-0.5">
              {event.userAgent || 'Internal API Service'}
            </div>
          </div>
        </div>

        {/* Cryptographic Hash Chain Linkage */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
          <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Cryptographic SHA-256 Hash Chain Link
          </span>

          <div>
            <span className="text-[10px] text-slate-500 uppercase font-mono block">Previous Hash:</span>
            <code className="text-[11px] text-slate-400 font-mono bg-slate-900 px-2 py-1 rounded block truncate border border-slate-850">
              {event.previousHash}
            </code>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 uppercase font-mono block">Event Hash:</span>
            <code className="text-[11px] text-vault-300 font-mono bg-slate-900 px-2 py-1 rounded block truncate border border-slate-850">
              {event.eventHash}
            </code>
          </div>
        </div>

        {/* Metadata JSON */}
        {parsedMetadata && (
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5 text-slate-400" />
              Event Payload & Metadata
            </span>
            <pre className="p-3 rounded-xl bg-slate-950 text-slate-300 font-mono text-[11px] overflow-x-auto border border-slate-800">
              {JSON.stringify(parsedMetadata, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </Modal>
  );
};
