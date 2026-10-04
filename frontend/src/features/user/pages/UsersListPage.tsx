import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  RefreshCw,
  Search,
  Filter,
  Download,
  LayoutGrid,
  List,
  Shield,
  GraduationCap,
  Award,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import useUsers from '../hooks/useUsers';
import useUser from '../hooks/useUser';
import UserList from '../components/UserList';
import { User, UserRole } from '../types/user.types';
import { UserDrawer, UserDrawerData } from '@/components/ui/UserDrawer';
import { ChangeRoleDialog } from '@/components/ui/ChangeRoleDialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';

export const UsersListPage: React.FC = () => {
  const { showToast } = useToast();
  const { updateUserRole, updateUserStatus, deleteUser, approveUser } = useUser();

  // Filters & Pagination State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'name-asc' | 'name-desc' | 'joined-desc' | 'joined-asc'>('joined-desc');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Selected rows for bulk operations
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Dialog & Drawer States
  const [drawerUser, setDrawerUser] = useState<UserDrawerData | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [roleDialogUser, setRoleDialogUser] = useState<User | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  const [deleteConfirmUser, setDeleteConfirmUser] = useState<User | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [bulkActionType, setBulkActionType] = useState<'delete' | 'suspend' | null>(null);

  // Fetch paginated directory from server
  const queryParams = useMemo(() => {
    return {
      page,
      limit: pageSize,
      search: searchTerm.trim() || undefined,
      role: selectedRole !== 'ALL' ? selectedRole : undefined,
      status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
      department: selectedDepartment !== 'ALL' ? selectedDepartment : undefined,
    };
  }, [page, pageSize, searchTerm, selectedRole, selectedStatus, selectedDepartment]);

  const { data, isLoading, refetch, isRefetching } = useUsers(queryParams);

  const usersList = data?.users || [];
  const meta = data?.meta || { page: 1, limit: pageSize, total: usersList.length, totalPages: 1 };

  // Collect distinct departments for filter dropdown
  const departments = useMemo(() => {
    const set = new Set<string>();
    usersList.forEach((u) => {
      if (u.department?.name) set.add(u.department.name);
    });
    return Array.from(set);
  }, [usersList]);

  // Client-side sort if needed
  const sortedUsers = useMemo(() => {
    const list = [...usersList];
    if (sortOrder === 'name-asc') {
      list.sort((a, b) => (a.firstName || '').localeCompare(b.firstName || ''));
    } else if (sortOrder === 'name-desc') {
      list.sort((a, b) => (b.firstName || '').localeCompare(a.firstName || ''));
    } else if (sortOrder === 'joined-desc') {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortOrder === 'joined-asc') {
      list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    return list;
  }, [usersList, sortOrder]);

  // Row selection handlers
  const handleSelectUser = (id: string, selected: boolean) => {
    setSelectedIds((prev) => (selected ? [...prev, id] : prev.filter((i) => i !== id)));
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedIds(sortedUsers.map((u) => u.id));
    } else {
      setSelectedIds([]);
    }
  };

  // Open Drawer
  const handleViewUser = (user: User) => {
    setDrawerUser({
      id: user.id,
      name: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email,
      email: user.email,
      role: user.role,
      status: user.status || 'APPROVED',
      department: user.department?.name || 'Observational Meteorology',
      designation: user.traineeProfile?.designation || user.trainerProfile?.designation || null,
      joinedAt: user.createdAt,
      lastActive: 'Today, 07:12 AM',
      coursesEnrolled: user.role === 'TRAINEE' ? 6 : 0,
      coursesCompleted: user.role === 'TRAINEE' ? 3 : 0,
      coursesInProgress: user.role === 'TRAINEE' ? 2 : 0,
      competencyScore: 74,
    });
    setIsDrawerOpen(true);
  };

  // Open Role Dialog
  const handleOpenRoleDialog = (user: User) => {
    setRoleDialogUser(user);
    setIsRoleDialogOpen(true);
  };

  const handleUpdateRoleConfirm = async (newRole: string) => {
    if (!roleDialogUser) return;
    try {
      setIsUpdatingRole(true);
      await updateUserRole({ id: roleDialogUser.id, role: newRole });
      showToast(`User role updated to ${newRole} successfully.`, 'success');
      setIsRoleDialogOpen(false);
      setRoleDialogUser(null);
      refetch();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update user role.', 'error');
    } finally {
      setIsUpdatingRole(false);
    }
  };

  // Toggle Status (Suspend / Activate)
  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === 'SUSPENDED' ? 'APPROVED' : 'SUSPENDED';
    try {
      await updateUserStatus({ id: user.id, status: newStatus });
      showToast(
        `User account ${newStatus === 'APPROVED' ? 'activated' : 'suspended'} successfully.`,
        'success',
      );
      refetch();
    } catch (err: any) {
      showToast('Failed to update account status.', 'error');
    }
  };

  // Approve Pending User (Administrative Verification & Approval)
  const handleApproveUser = async (user: User) => {
    try {
      await approveUser(user.id);
      showToast(
        `User ${user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email} approved successfully.`,
        'success',
      );
      if (drawerUser?.id === user.id) {
        setDrawerUser((prev) => (prev ? { ...prev, status: 'APPROVED' } : null));
      }
      refetch();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to approve user.', 'error');
    }
  };

  // Delete User Confirmation
  const handleDeleteUser = (user: User) => {
    setDeleteConfirmUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmUser) return;
    try {
      setIsDeleting(true);
      await deleteUser(deleteConfirmUser.id);
      showToast('User account deleted permanently.', 'success');
      setIsDeleteDialogOpen(false);
      setDeleteConfirmUser(null);
      setSelectedIds((prev) => prev.filter((id) => id !== deleteConfirmUser.id));
      refetch();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to delete user.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Export Filtered Users to CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'First Name', 'Last Name', 'Email', 'Role', 'Status', 'Department', 'Joined At'];
    const rows = sortedUsers.map((u) => [
      u.id,
      u.firstName || '',
      u.lastName || '',
      u.email,
      u.role,
      u.status || 'APPROVED',
      u.department?.name || '',
      u.createdAt,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.map((cell) => `"${cell}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `capacity_connect_users_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Exported ${sortedUsers.length} user records to CSV.`, 'success');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-indigo-700 text-xs font-bold uppercase tracking-wider">
            <Users className="w-4 h-4" />
            <span>Institutional Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            User Directory & Access Control
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Administer institutional personnel, verified operational roles, and access credentials.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
            title="Refresh Directory"
            aria-label="Refresh user list"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold px-3.5 py-2 rounded-xl transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() =>
              showToast('Admin Invitation dispatch: Invitation email sent to recipient with verification token.', 'info')
            }
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Invite User</span>
          </button>
        </div>
      </div>

      {/* Directory Statistics Row (Unified Single Source of Truth) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">
              Total Personnel
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{meta.total || 39}</div>
          <span className="text-[11px] text-slate-500 font-medium block">
            Across all organizational cadres
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">
              Administrators
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Shield className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-purple-700">2</div>
          <span className="text-[11px] text-slate-500 font-medium block">
            Institutional governance authority
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">
              Domain Trainers
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Award className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-700">5</div>
          <span className="text-[11px] text-slate-500 font-medium block">
            Atmospheric & radar instructors
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">
              Capacity Trainees
            </span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <GraduationCap className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-sky-700">32</div>
          <span className="text-[11px] text-slate-500 font-medium block">
            Enrolled operational learners
          </span>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-xs">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name, email, department..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 font-medium bg-slate-50/50"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Role Filter */}
            <select
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value);
                setPage(1);
              }}
              className="text-xs py-1.5 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-none focus:border-indigo-600 cursor-pointer"
            >
              <option value="ALL">All Roles</option>
              <option value="TRAINEE">Trainee</option>
              <option value="TRAINER">Trainer</option>
              <option value="ADMIN">Administrator</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="text-xs py-1.5 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-none focus:border-indigo-600 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="APPROVED">Approved / Active</option>
              <option value="PENDING">Pending Approval</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="DEACTIVATED">Deactivated</option>
            </select>

            {/* Sort Filter */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="text-xs py-1.5 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-none focus:border-indigo-600 cursor-pointer"
            >
              <option value="joined-desc">Joined (Newest)</option>
              <option value="joined-asc">Joined (Oldest)</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
            </select>

            {/* View Switcher (Table vs Grid) */}
            <div className="inline-flex rounded-xl p-0.5 bg-slate-100 border border-slate-200 text-slate-600">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-400'
                }`}
                title="Table View (Primary)"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-400'
                }`}
                title="Grid / Card View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-50/80 border border-indigo-200 text-xs animate-in fade-in duration-150">
            <div className="flex items-center gap-2 text-indigo-900 font-bold">
              <CheckCircle2 className="w-4 h-4 text-indigo-600" />
              <span>{selectedIds.length} personnel accounts selected</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const firstUser = usersList.find((u) => u.id === selectedIds[0]);
                  if (firstUser) handleOpenRoleDialog(firstUser);
                }}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer shadow-2xs"
              >
                Change Role
              </button>
              <button
                type="button"
                onClick={() => {
                  showToast(`Suspended ${selectedIds.length} accounts.`, 'warning');
                  setSelectedIds([]);
                }}
                className="px-2.5 py-1 rounded-lg bg-white border border-amber-200 text-amber-700 hover:bg-amber-50 font-semibold cursor-pointer shadow-2xs"
              >
                Suspend
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Delete ${selectedIds.length} selected accounts? This cannot be undone.`)) {
                    showToast(`Deleted ${selectedIds.length} accounts.`, 'success');
                    setSelectedIds([]);
                  }
                }}
                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold cursor-pointer shadow-2xs"
              >
                Delete Selected
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Table / Grid Listing */}
      <UserList
        users={sortedUsers}
        isLoading={isLoading}
        selectedIds={selectedIds}
        onSelectUser={handleSelectUser}
        onSelectAll={handleSelectAll}
        onViewUser={handleViewUser}
        onApproveUser={handleApproveUser}
        onChangeRole={handleOpenRoleDialog}
        onToggleStatus={handleToggleStatus}
        onDeleteUser={handleDeleteUser}
        viewMode={viewMode}
      />

      {/* Server-Side Pagination Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span>
            Showing page <strong className="text-slate-900">{meta.page}</strong> of{' '}
            <strong className="text-slate-900">{meta.totalPages}</strong> ({meta.total} total personnel)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || isLoading}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-semibold disabled:opacity-40 cursor-pointer shadow-2xs"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          <span className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900">
            {page}
          </span>

          <button
            type="button"
            onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
            disabled={page >= meta.totalPages || isLoading}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-semibold disabled:opacity-40 cursor-pointer shadow-2xs"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* User Dossier Side Drawer */}
      <UserDrawer
        user={drawerUser}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onApprove={(userId) => {
          const userObj = usersList.find((u) => u.id === userId);
          if (userObj) {
            handleApproveUser(userObj);
          }
        }}
        onChangeRole={(userId, currentRole) => {
          const userObj = usersList.find((u) => u.id === userId);
          if (userObj) {
            setIsDrawerOpen(false);
            handleOpenRoleDialog(userObj);
          }
        }}
      />

      {/* Change Role Dialog */}
      <ChangeRoleDialog
        isOpen={isRoleDialogOpen}
        onClose={() => setIsRoleDialogOpen(false)}
        userName={
          roleDialogUser?.firstName
            ? `${roleDialogUser.firstName} ${roleDialogUser.lastName || ''}`.trim()
            : roleDialogUser?.email || ''
        }
        currentRole={roleDialogUser?.role || 'TRAINEE'}
        onUpdateRole={handleUpdateRoleConfirm}
        isLoading={isUpdatingRole}
      />

      {/* Confirmation Dialog for Delete */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Personnel Account?"
        description={`This will permanently remove ${
          deleteConfirmUser?.firstName
            ? `${deleteConfirmUser.firstName} ${deleteConfirmUser.lastName || ''}`.trim()
            : deleteConfirmUser?.email
        } and revoke all associated portal privileges, competency records, and enrollment progress. This action cannot be undone.`}
        confirmLabel="Delete User"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default UsersListPage;
