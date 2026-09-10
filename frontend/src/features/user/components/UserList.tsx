import React, { useState } from 'react';
import {
  MoreHorizontal,
  Eye,
  Shield,
  Trash2,
  UserCheck,
  UserX,
  ArrowUpDown,
  Mail,
  Building2,
  Calendar,
} from 'lucide-react';
import { User } from '../types/user.types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { RoleBadge } from '@/components/ui/RoleBadge';

interface UserListProps {
  users: User[];
  isLoading: boolean;
  selectedIds: string[];
  onSelectUser: (id: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onViewUser: (user: User) => void;
  onChangeRole: (user: User) => void;
  onToggleStatus: (user: User) => void;
  onDeleteUser: (user: User) => void;
  viewMode?: 'table' | 'grid';
}

export const UserList: React.FC<UserListProps> = ({
  users,
  isLoading,
  selectedIds,
  onSelectUser,
  onSelectAll,
  onViewUser,
  onChangeRole,
  onToggleStatus,
  onDeleteUser,
  viewMode = 'table',
}) => {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 space-y-4">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div key={n} className="flex items-center justify-between gap-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-200" />
              <div className="space-y-1.5">
                <div className="w-36 h-3.5 bg-slate-200 rounded" />
                <div className="w-48 h-2.5 bg-slate-100 rounded" />
              </div>
            </div>
            <div className="w-20 h-5 bg-slate-200 rounded-full" />
            <div className="w-28 h-3.5 bg-slate-200 rounded" />
            <div className="w-16 h-5 bg-slate-200 rounded-full" />
            <div className="w-20 h-3.5 bg-slate-200 rounded" />
            <div className="w-8 h-8 bg-slate-100 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
          <UserCheck className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-slate-800">No personnel records found</h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          No user accounts matched the selected query, role filter, or department criteria.
        </p>
      </div>
    );
  }

  const allSelected = users.length > 0 && users.every((u) => selectedIds.includes(u.id));

  // --- GRID / CARD VIEW (SECONDARY) ---
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user) => {
          const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'U';
          const isSelected = selectedIds.includes(user.id);

          return (
            <div
              key={user.id}
              className={`bg-white rounded-2xl border p-5 transition-all hover:shadow-xs space-y-4 ${
                isSelected ? 'border-indigo-600 ring-1 ring-indigo-600/20' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => onSelectUser(user.id, e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 border border-indigo-100">
                    {initials}
                  </div>
                  <div className="truncate">
                    <span
                      onClick={() => onViewUser(user)}
                      className="text-xs font-bold text-slate-900 block truncate cursor-pointer hover:text-indigo-600 transition-colors"
                    >
                      {user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email}
                    </span>
                    <span className="text-[11px] text-slate-500 block truncate">{user.email}</span>
                  </div>
                </div>

                <StatusBadge status={user.status || 'APPROVED'} size="sm" />
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Shield className="w-3 h-3 text-slate-400" />
                    Role:
                  </span>
                  <RoleBadge role={user.role} size="sm" />
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3 h-3 text-slate-400" />
                    Dept:
                  </span>
                  <span className="font-medium text-slate-700 truncate max-w-[160px]">
                    {user.department?.name || 'Observational Meteorology'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    Joined:
                  </span>
                  <span className="font-medium text-slate-700">
                    {new Date(user.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onViewUser(user)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  View Details
                </button>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onChangeRole(user)}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
                    title="Change Role"
                  >
                    <Shield className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteUser(user)}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                    title="Delete User"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // --- PRIMARY ENTERPRISE DATA TABLE VIEW ---
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <th className="py-3.5 px-4 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  aria-label="Select all rows"
                />
              </th>
              <th className="py-3.5 px-4">User</th>
              <th className="py-3.5 px-4">Role</th>
              <th className="py-3.5 px-4">Department / Institution</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Joined</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {users.map((user) => {
              const initials =
                `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'U';
              const isSelected = selectedIds.includes(user.id);
              const isMenuOpen = activeMenuId === user.id;

              return (
                <tr
                  key={user.id}
                  className={`hover:bg-slate-50/70 transition-colors group ${
                    isSelected ? 'bg-indigo-50/30' : ''
                  }`}
                >
                  {/* Checkbox */}
                  <td className="py-3 px-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => onSelectUser(user.id, e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      aria-label={`Select ${user.email}`}
                    />
                  </td>

                  {/* User Profile */}
                  <td className="py-3 px-4">
                    <div
                      onClick={() => onViewUser(user)}
                      className="flex items-center gap-3 cursor-pointer group-hover:text-indigo-600"
                    >
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                        {initials}
                      </div>
                      <div className="truncate max-w-[220px]">
                        <span className="font-bold text-slate-900 block truncate group-hover:text-indigo-600 transition-colors">
                          {user.firstName
                            ? `${user.firstName} ${user.lastName || ''}`.trim()
                            : user.email}
                        </span>
                        <span className="text-[11px] text-slate-400 truncate block">
                          {user.email}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Role Badge */}
                  <td className="py-3 px-4">
                    <RoleBadge role={user.role} size="sm" />
                  </td>

                  {/* Department */}
                  <td className="py-3 px-4">
                    <span className="text-slate-600 font-medium truncate max-w-[200px] block">
                      {user.department?.name || 'Observational Meteorology'}
                    </span>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 px-4">
                    <StatusBadge status={user.status || 'APPROVED'} size="sm" />
                  </td>

                  {/* Joined Date */}
                  <td className="py-3 px-4 text-slate-500 font-medium whitespace-nowrap">
                    {new Date(user.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>

                  {/* Actions ⋯ menu */}
                  <td className="py-3 px-4 text-right relative">
                    <button
                      type="button"
                      onClick={() => setActiveMenuId(isMenuOpen ? null : user.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Actions"
                      aria-label="User actions"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {isMenuOpen && (
                      <>
                        <div
                          onClick={() => setActiveMenuId(null)}
                          className="fixed inset-0 z-20"
                        />
                        <div className="absolute right-4 mt-1 w-44 rounded-xl bg-white border border-slate-200 shadow-xl p-1 z-30 space-y-0.5 text-xs text-left animate-in fade-in duration-100">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              onViewUser(user);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer font-medium"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-400" />
                            <span>View Dossier</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              onChangeRole(user);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer font-medium"
                          >
                            <Shield className="w-3.5 h-3.5 text-indigo-500" />
                            <span>Change Role</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              onToggleStatus(user);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer font-medium"
                          >
                            {user.status === 'SUSPENDED' ? (
                              <>
                                <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                                <span>Activate Account</span>
                              </>
                            ) : (
                              <>
                                <UserX className="w-3.5 h-3.5 text-amber-500" />
                                <span>Suspend Account</span>
                              </>
                            )}
                          </button>

                          <div className="my-1 border-t border-slate-100" />

                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              onDeleteUser(user);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer font-medium"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Account</span>
                          </button>
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserList;
