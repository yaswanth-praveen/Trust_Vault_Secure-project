import React, { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '../../components/ui/Modal.js';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { shareApi } from '../../services/shareApi.js';
import { userApi } from '../../services/userApi.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../components/ui/Toast.js';
import { Document } from '../../types/index.js';
import { 
  Share2, 
  UserCheck, 
  Clock, 
  Trash2, 
  Globe, 
  AlertCircle, 
  Loader2, 
  Calendar, 
  Check, 
  X 
} from 'lucide-react';
import { formatDate } from '../../utils/cn.js';

interface DocumentSharingModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document | null;
  onSuccess?: () => void;
}

export const DocumentSharingModal: React.FC<DocumentSharingModalProps> = ({
  isOpen,
  onClose,
  document,
  onSuccess,
}) => {
  const { activeOrg } = useAuth();
  const { toast } = useToast();

  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [permission, setPermission] = useState<string>('VIEW');
  const [activePreset, setActivePreset] = useState<'never' | '24h' | '7d' | '30d' | 'custom'>('never');
  const [customDate, setCustomDate] = useState<string>('');
  const [customTime, setCustomTime] = useState<string>('23:59');
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const dateInputRef = useRef<HTMLInputElement>(null);
  const timeInputRef = useRef<HTMLInputElement>(null);

  const openDatePicker = () => {
    try {
      dateInputRef.current?.showPicker();
    } catch {
      dateInputRef.current?.focus();
    }
  };

  const openTimePicker = () => {
    try {
      timeInputRef.current?.showPicker();
    } catch {
      timeInputRef.current?.focus();
    }
  };

  // Fetch document shares
  const { data: shares, isLoading: isLoadingShares, refetch: refetchShares } = useQuery({
    queryKey: ['document-shares', document?.id],
    queryFn: () => (document ? shareApi.list(document.id) : []),
    enabled: !!document && isOpen,
  });

  // Fetch organization members to choose from
  const { data: orgUsers } = useQuery({
    queryKey: ['org-users', activeOrg?.id],
    queryFn: async () => {
      if (!activeOrg) return { members: [], invitations: [] };
      return userApi.list(activeOrg.id);
    },
    enabled: !!activeOrg && isOpen,
  });

  if (!document) return null;

  const todayStr = new Date().toISOString().split('T')[0];

  const handlePresetSelect = (preset: 'never' | '24h' | '7d' | '30d' | 'custom') => {
    setActivePreset(preset);
    setError('');

    if (preset === 'never') {
      setExpiresAt('');
      setCustomDate('');
      return;
    }

    const now = new Date();
    let targetDate = new Date();

    if (preset === '24h') {
      targetDate.setDate(now.getDate() + 1);
    } else if (preset === '7d') {
      targetDate.setDate(now.getDate() + 7);
    } else if (preset === '30d') {
      targetDate.setDate(now.getDate() + 30);
    } else if (preset === 'custom') {
      if (!customDate) {
        targetDate.setDate(now.getDate() + 7);
        setCustomDate(targetDate.toISOString().split('T')[0]);
      }
      return;
    }

    const dateStr = targetDate.toISOString().split('T')[0];
    const timeStr = `${String(targetDate.getHours()).padStart(2, '0')}:${String(targetDate.getMinutes()).padStart(2, '0')}`;
    setCustomDate(dateStr);
    setCustomTime(timeStr);
    setExpiresAt(targetDate.toISOString());
  };

  const handleCustomDateChange = (date: string, time: string) => {
    setCustomDate(date);
    setCustomTime(time);
    setActivePreset('custom');

    if (date) {
      const combined = new Date(`${date}T${time || '23:59'}`);
      setExpiresAt(combined.toISOString());
    } else {
      setExpiresAt('');
      setActivePreset('never');
    }
  };

  const handleClearExpiration = () => {
    setActivePreset('never');
    setCustomDate('');
    setExpiresAt('');
  };

  const handleCreateShare = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      let finalExpiresAt: string | undefined = undefined;

      if (expiresAt) {
        finalExpiresAt = new Date(expiresAt).toISOString();
      } else if (activePreset === 'custom' && customDate) {
        finalExpiresAt = new Date(`${customDate}T${customTime || '23:59'}`).toISOString();
      }

      await shareApi.create(document.id, {
        grantedToUserId: selectedUserId || undefined,
        permission,
        expiresAt: finalExpiresAt,
      });

      toast('Share permission granted and recorded in audit trail', 'success');
      setSelectedUserId('');
      handleClearExpiration();
      refetchShares();
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Failed to grant share permission');
      toast(err.message || 'Share creation error', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async (shareId: string) => {
    try {
      await shareApi.revoke(document.id, shareId);
      toast('Share revoked successfully', 'info');
      refetchShares();
      onSuccess?.();
    } catch (err: any) {
      toast(err.message || 'Failed to revoke share', 'error');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Access & Document Permissions"
      description={`Configuring access controls for "${document.title}"`}
      maxWidth="xl"
    >
      <div className="space-y-6">
        {/* Share Form */}
        <form onSubmit={handleCreateShare} className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-4">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Share2 className="w-3.5 h-3.5 text-vault-400" />
            Grant New Permission
          </h4>

          {error && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Recipient User Select */}
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
                Recipient
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full rounded-lg bg-slate-900 border border-slate-700/80 px-3 py-2 text-slate-100 text-xs focus:border-vault-500 focus:outline-none"
              >
                <option value="">Organization-Wide (All Members)</option>
                {orgUsers?.members
                  ?.filter((m) => m.userId !== document.uploaderId)
                  ?.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.fullName} ({m.email}) - {m.role}
                    </option>
                  ))}
              </select>
            </div>

            {/* Permission Level */}
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
                Permission Level
              </label>
              <select
                value={permission}
                onChange={(e) => setPermission(e.target.value)}
                className="w-full rounded-lg bg-slate-900 border border-slate-700/80 px-3 py-2 text-slate-100 text-xs focus:border-vault-500 focus:outline-none"
              >
                <option value="VIEW">VIEW (Preview Only)</option>
                <option value="DOWNLOAD">DOWNLOAD (Preview + Download)</option>
                <option value="EDIT_METADATA">EDIT_METADATA (Edit Details)</option>
                <option value="SHARE">SHARE (Grant Shares to Others)</option>
                <option value="MANAGE_PERMISSIONS">MANAGE_PERMISSIONS (Full Admin)</option>
              </select>
            </div>

            {/* Professional Date Selection & Expiration Controls */}
            <div className="space-y-2 sm:col-span-2 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-slate-300 font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-vault-400" />
                  Access Expiration Date
                </label>
                {expiresAt && (
                  <button
                    type="button"
                    onClick={handleClearExpiration}
                    className="text-[10px] text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors"
                  >
                    <X className="w-3 h-3" />
                    Reset to Indefinite
                  </button>
                )}
              </div>

              {/* Quick Preset Selector Buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'never', label: 'Indefinite (No Expiry)' },
                  { id: '24h', label: '24 Hours' },
                  { id: '7d', label: '7 Days' },
                  { id: '30d', label: '30 Days' },
                  { id: 'custom', label: 'Custom Date...' },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handlePresetSelect(preset.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      activePreset === preset.id
                        ? 'bg-vault-600 text-white shadow-sm shadow-vault-600/30'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Date & Time Picker Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {/* Single Date Picker Button & Input */}
                <div className="relative">
                  <span className="text-[10px] text-slate-400 block mb-1 font-semibold uppercase">
                    Select Date
                  </span>
                  <div className="relative flex items-center group">
                    <input
                      ref={dateInputRef}
                      type="date"
                      min={todayStr}
                      value={customDate}
                      onChange={(e) => handleCustomDateChange(e.target.value, customTime)}
                      onClick={openDatePicker}
                      className="w-full rounded-lg bg-slate-900 border border-slate-700/80 pl-3 pr-10 py-2 text-slate-100 text-xs focus:border-vault-500 focus:outline-none [color-scheme:dark] cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:top-0 [&::-webkit-calendar-picker-indicator]:bottom-0 [&::-webkit-calendar-picker-indicator]:w-10 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:z-10"
                    />
                    <button
                      type="button"
                      onClick={openDatePicker}
                      tabIndex={-1}
                      title="Open calendar picker"
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-slate-400 group-hover:text-vault-400 group-hover:bg-slate-800 hover:text-vault-400 hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center cursor-pointer pointer-events-none sm:pointer-events-auto"
                    >
                      <Calendar className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Single Time Picker Button & Input */}
                <div className="relative">
                  <span className="text-[10px] text-slate-400 block mb-1 font-semibold uppercase">
                    Select Time (24h)
                  </span>
                  <div className="relative flex items-center group">
                    <input
                      ref={timeInputRef}
                      type="time"
                      value={customTime}
                      onChange={(e) => handleCustomDateChange(customDate, e.target.value)}
                      onClick={openTimePicker}
                      className="w-full rounded-lg bg-slate-900 border border-slate-700/80 pl-3 pr-10 py-2 text-slate-100 text-xs focus:border-vault-500 focus:outline-none [color-scheme:dark] cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:top-0 [&::-webkit-calendar-picker-indicator]:bottom-0 [&::-webkit-calendar-picker-indicator]:w-10 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:z-10"
                    />
                    <button
                      type="button"
                      onClick={openTimePicker}
                      tabIndex={-1}
                      title="Open time picker"
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-slate-400 group-hover:text-vault-400 group-hover:bg-slate-800 hover:text-vault-400 hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center cursor-pointer pointer-events-none sm:pointer-events-auto"
                    >
                      <Clock className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Active Expiration Human-Readable Confirmation Banner */}
              {expiresAt ? (
                <div className="p-2.5 rounded-lg bg-vault-600/10 border border-vault-500/20 text-vault-300 text-[11px] flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5 text-vault-400 shrink-0" />
                    Access will automatically expire on: <strong>{formatDate(expiresAt)}</strong>
                  </span>
                  <Badge variant="warning" className="text-[10px]">
                    Time-Limited
                  </Badge>
                </div>
              ) : (
                <span className="text-[10px] text-slate-500 block">
                  Indefinite access: Permissions remain active until explicitly revoked.
                </span>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" size="sm" isLoading={isSubmitting}>
              <UserCheck className="w-3.5 h-3.5" />
              Add Share Grant
            </Button>
          </div>
        </form>

        {/* Existing Shares Table */}
        <div>
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center justify-between">
            <span>Existing Shares & Grants</span>
            <span className="text-[11px] text-slate-500 lowercase font-mono">
              {shares?.length || 0} active/historical records
            </span>
          </h4>

          {isLoadingShares ? (
            <div className="py-8 flex justify-center text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin text-vault-500" />
            </div>
          ) : !shares || shares.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6 border border-slate-800/80 rounded-xl bg-slate-950/30">
              This document is private to the uploader and organization administrators.
            </p>
          ) : (
            <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
              {shares.map((share) => (
                <div key={share.id} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-800 text-slate-300">
                      {share.grantedToUser ? (
                        <UserCheck className="w-4 h-4 text-vault-400" />
                      ) : (
                        <Globe className="w-4 h-4 text-emerald-400" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-200">
                        {share.grantedToUser ? share.grantedToUser.fullName : 'Organization-Wide Access'}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-vault-400">{share.permission}</span>
                        {share.expiresAt && (
                          <span className="flex items-center gap-1 text-slate-400 font-mono text-[10px]">
                            <Clock className="w-3 h-3" />
                            Expires: {formatDate(share.expiresAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        share.status === 'ACTIVE'
                          ? 'success'
                          : share.status === 'EXPIRED'
                          ? 'warning'
                          : 'danger'
                      }
                    >
                      {share.status}
                    </Badge>

                    {share.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleRevoke(share.id)}
                        title="Revoke access"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
