import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card } from '../ui/Card.js';
import { Button } from '../ui/Button.js';
import { auditApi } from '../../services/auditApi.js';
import { useToast } from '../ui/Toast.js';
import { VerificationResult } from '../../types/index.js';
import { formatDate } from '../../utils/cn.js';

interface AuditIntegrityWidgetProps {
  initialStatus: 'VALID' | 'CORRUPTED' | 'PENDING_FIRST_VERIFY';
  initialLastVerified: string | null;
  onVerified?: () => void;
}

export const AuditIntegrityWidget: React.FC<AuditIntegrityWidgetProps> = ({
  initialStatus,
  initialLastVerified,
  onVerified,
}) => {
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(false);
  const [status, setStatus] = useState(initialStatus);
  const [lastVerified, setLastVerified] = useState(initialLastVerified);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const result = await auditApi.verify();
      setVerificationResult(result);
      setStatus(result.isValid ? 'VALID' : 'CORRUPTED');
      setLastVerified(result.verifiedAt);

      if (result.isValid) {
        toast(`Hash-chain verified: ${result.totalEvents} blocks intact`, 'success');
      } else {
        toast(`INTEGRITY FAILURE: Tampering detected at sequence #${result.errorSequence}`, 'error');
      }
      onVerified?.();
    } catch (err: any) {
      toast(err.message, 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  const isHealthy = status === 'VALID';
  const isCorrupted = status === 'CORRUPTED';

  return (
    <Card className="border-vault-500/30 bg-gradient-to-br from-slate-900 via-slate-900/90 to-vault-950/20">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl border ${
              isHealthy
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : isCorrupted
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}
          >
            {isHealthy ? (
              <ShieldCheck className="w-6 h-6" />
            ) : isCorrupted ? (
              <ShieldAlert className="w-6 h-6" />
            ) : (
              <AlertTriangle className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-bold text-slate-100">Audit Trail Cryptographic Integrity</h4>
              <span
                className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded border ${
                  isHealthy
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : isCorrupted
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}
              >
                {status}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Linear SHA-256 hash-chain linking each event to the Genesis block
            </p>
          </div>
        </div>

        <Button
          onClick={handleVerify}
          isLoading={isVerifying}
          size="sm"
          variant={isHealthy ? 'primary' : 'danger'}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Verify Hash Chain
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-xs">
        <div>
          <span className="text-slate-400 block mb-1">Chain Verification Status</span>
          <span className="font-semibold text-slate-200 flex items-center gap-1.5">
            {isHealthy ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Valid & Tamper-Evident
              </>
            ) : isCorrupted ? (
              <>
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                Chain Inconsistency Detected
              </>
            ) : (
              'Verification Pending'
            )}
          </span>
        </div>

        <div>
          <span className="text-slate-400 block mb-1">Last Cryptographic Check</span>
          <span className="font-mono text-slate-300">
            {lastVerified ? formatDate(lastVerified) : 'Never verified'}
          </span>
        </div>

        <div>
          <span className="text-slate-400 block mb-1">Latest Verified Sequence</span>
          <span className="font-mono text-slate-300">
            {verificationResult?.lastSequenceNumber 
              ? `#${verificationResult.lastSequenceNumber} blocks intact` 
              : 'Genesis Block Linked'}
          </span>
        </div>
      </div>

      {verificationResult?.headHash && (
        <div className="mt-3 pt-3 border-t border-slate-800/80">
          <span className="text-[11px] text-slate-400 font-mono block">
            Current Head Hash: <span className="text-slate-300">{verificationResult.headHash}</span>
          </span>
        </div>
      )}

      {verificationResult && !verificationResult.isValid && (
        <div className="mt-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-mono">
          🚨 {verificationResult.errorReason}
        </div>
      )}
    </Card>
  );
};
