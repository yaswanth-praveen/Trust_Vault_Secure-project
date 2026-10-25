import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { userApi, OrgUserItem } from '../../services/userApi.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../components/ui/Toast.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { InviteUserModal } from './InviteUserModal.js';
import { EditUserModal } from './EditUserModal.js';
import { 
  Users, 
  UserPlus, 
  UserX, 
  UserCheck, 
  Pencil,
  Loader2
} from 'lucide-react';
import { formatDate } from '../../utils/cn.js';

export const UserManagement: React.FC = () => {
  const { activeOrg, user: currentUser } = useAuth();
  const { toast } = useToast();

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<OrgUserItem | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['org-users-management', activeOrg?.id],
    queryFn: () => (activeOrg ? userApi.list(activeOrg.id) : null),
    enabled: !!activeOrg,
  });

  const handleRoleChange = async (member: OrgUserItem, newRole: string) => {
    if (!activeOrg) return;
    try {
      await userApi.updateRole(activeOrg.id, member.userId, newRole);
      toast(`Role for ${member.fullName} updated to ${newRole}`, 'success');
      refetch();
    } catch (err: any) {
      toast(err.message || 'Failed to update user role', 'error');
    }
  };

  const handleStatusToggle = async (member: OrgUserItem) => {
    if (!activeOrg) return;
    const nextStatus = member.membershipStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await userApi.updateStatus(activeOrg.id, member.userId, nextStatus);
      toast(`Membership for ${member.fullName} is now ${nextStatus}`, 'info');
      refetch();
    } catch (err: any) {
      toast(err.message || 'Failed to update user status', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">Organization Users</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage organization members, correct user details, assign role permissions, and control tenant account status.
          </p>
        </div>

        <Button onClick={() => setIsInviteOpen(true)} size="sm">
          <UserPlus className="w-4 h-4" />
          Invite User
        </Button>
      </div>

      {/* Users Table */}
      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-vault-500" />
          </div>
        ) : !data || data.members.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Users className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-slate-300">No members found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Member Name</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Assigned Role</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Joined Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data.members.map((member) => {
                  const isCurrent = member.userId === currentUser?.id;

                  return (
                    <tr key={member.membershipId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-200">
                        {member.fullName}
                        {isCurrent && (
                          <span className="ml-2 text-[10px] text-vault-400 font-normal">
                            (You)
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px]">
                        {member.email}
                      </td>

                      <td className="py-3.5 px-4">
                        <select
                          value={member.role}
                          disabled={isCurrent}
                          onChange={(e) => handleRoleChange(member, e.target.value)}
                          className="rounded-lg bg-slate-900 border border-slate-700/80 px-2.5 py-1 text-slate-200 text-xs font-semibold focus:border-vault-500 focus:outline-none disabled:opacity-60"
                        >
                          <option value="STANDARD_USER">STANDARD_USER</option>
                          <option value="DOCUMENT_MANAGER">DOCUMENT_MANAGER</option>
                          <option value="AUDITOR">AUDITOR</option>
                          <option value="ORG_ADMIN">ORG_ADMIN</option>
                        </select>
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge
                          variant={member.membershipStatus === 'ACTIVE' ? 'success' : 'danger'}
                        >
                          {member.membershipStatus}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                        {formatDate(member.joinedAt)}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedUserForEdit(member)}
                            className="text-[11px] py-1"
                            title="Re-correct user details"
                          >
                            <Pencil className="w-3 h-3 text-vault-400" />
                            Edit
                          </Button>

                          {!isCurrent && (
                            <Button
                              variant={member.membershipStatus === 'ACTIVE' ? 'outline' : 'secondary'}
                              size="sm"
                              onClick={() => handleStatusToggle(member)}
                              className="text-[11px] py-1"
                            >
                              {member.membershipStatus === 'ACTIVE' ? (
                                <>
                                  <UserX className="w-3 h-3 text-rose-400" />
                                  Suspend
                                </>
                              ) : (
                                <>
                                  <UserCheck className="w-3 h-3 text-emerald-400" />
                                  Activate
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Invite Modal */}
      <InviteUserModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onSuccess={refetch}
      />

      {/* Edit User Details Modal */}
      <EditUserModal
        isOpen={!!selectedUserForEdit}
        onClose={() => setSelectedUserForEdit(null)}
        user={selectedUserForEdit}
        onSuccess={refetch}
      />
    </div>
  );
};
