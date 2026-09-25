import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
  rolePermissionService,
  ALL_PERMISSIONS,
  DEFAULT_ROLES,
  PermissionDefinition,
} from '../../services/rolePermissionService';
import { userService, CreateUserData } from '../../services/userService';
import { staffService } from '../../services/staffAndParentService';
import { printerService } from '../../services/printerService';
import { RoleDefinition, PermissionKey, UserRole, UserProfile, Staff } from '../../types';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import {
  ShieldCheck,
  Shield,
  PlusCircle,
  Edit2,
  Trash2,
  Check,
  Search,
  Users,
  Lock,
  Unlock,
  CheckSquare,
  Square,
  Sparkles,
  Layers,
  Filter,
  Eye,
  EyeOff,
  Sliders,
  Key,
  KeyRound,
  UserPlus,
  RefreshCw,
  Copy,
  Printer,
  FileText,
  AlertTriangle,
  UserCheck,
  UserX,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

interface RolesPermissionsViewProps {
  onNavigate?: (view: string) => void;
}

export const RolesPermissionsView: React.FC<RolesPermissionsViewProps> = ({ onNavigate }) => {
  const { school, switchRole } = useAuth();
  const { showToast } = useToast();

  // Navigation Tabs: matrix | cards | users
  const [activeTab, setActiveTab] = useState<'matrix' | 'cards' | 'users'>('matrix');

  // Roles State
  const [roles, setRoles] = useState<RoleDefinition[]>(DEFAULT_ROLES);
  const [loadingRoles, setLoadingRoles] = useState<boolean>(true);
  const [roleSearch, setRoleSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Matrix Filter State
  const [permSearch, setPermSearch] = useState<string>('');
  const [moduleFilter, setModuleFilter] = useState<string>('ALL');
  const [updatingCell, setUpdatingCell] = useState<{ roleId: string; permKey: string } | null>(null);

  // Users State
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [userSearch, setUserSearch] = useState<string>('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('ALL');

  // Modals
  // 1. Role Create / Edit Modal
  const [isRoleModalOpen, setIsRoleModalOpen] = useState<boolean>(false);
  const [editingRole, setEditingRole] = useState<RoleDefinition | null>(null);
  const [roleForm, setRoleForm] = useState<{
    name: string;
    code: string;
    description: string;
    category: RoleDefinition['category'];
    permissions: PermissionKey[];
  }>({
    name: '',
    code: '',
    description: '',
    category: 'CUSTOM',
    permissions: [],
  });
  const [savingRole, setSavingRole] = useState<boolean>(false);

  // 2. Create User Login Modal
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState<boolean>(false);
  const [userForm, setUserForm] = useState<{
    fullName: string;
    username: string;
    email: string;
    phone: string;
    role: string;
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
    staffId?: string;
    tempPassword: string;
    showPassword: boolean;
    printSlipImmediately: boolean;
  }>({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    role: 'TEACHER',
    status: 'ACTIVE',
    staffId: '',
    tempPassword: `Glcm@${Math.floor(1000 + Math.random() * 9000)}`,
    showPassword: true,
    printSlipImmediately: true,
  });
  const [savingUser, setSavingUser] = useState<boolean>(false);

  // 3. Reset Password Modal
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState<boolean>(false);
  const [selectedUserForReset, setSelectedUserForReset] = useState<UserProfile | null>(null);
  const [newPassword, setNewPassword] = useState<string>('');
  const [showNewPassword, setShowNewPassword] = useState<boolean>(true);
  const [copiedResetPass, setCopiedResetPass] = useState<boolean>(false);
  const [savingResetPass, setSavingResetPass] = useState<boolean>(false);

  // 4. Credential Slip Preview Modal
  const [isSlipModalOpen, setIsSlipModalOpen] = useState<boolean>(false);
  const [slipUser, setSlipUser] = useState<UserProfile | null>(null);
  const [slipPassword, setSlipPassword] = useState<string>('');

  useEffect(() => {
    if (!school?.id) return;
    loadRoles();
    loadUsers();
  }, [school?.id]);

  const loadRoles = async () => {
    setLoadingRoles(true);
    try {
      const data = await rolePermissionService.getRoles(school!.id);
      setRoles(data);
    } catch (e: any) {
      showToast('Error loading roles: ' + e.message, 'error');
    } finally {
      setLoadingRoles(false);
    }
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const [uData, sData] = await Promise.all([
        userService.getUsers(school?.id),
        school?.id ? staffService.getStaff(school.id) : Promise.resolve([]),
      ]);
      setUsers(uData);
      setStaffList(sData);
    } catch (e: any) {
      showToast('Error loading users: ' + e.message, 'error');
    } finally {
      setLoadingUsers(false);
    }
  };

  // -------------------------------------------------------------
  // ROLE MATRIX INTERACTIVE TOGGLES
  // -------------------------------------------------------------
  const handleToggleCell = async (role: RoleDefinition, perm: PermissionDefinition) => {
    if (role.code === 'SUPER_ADMIN') {
      showToast('Super Administrator holds immutable system privileges.', 'info');
      return;
    }

    const schoolId = school?.id;
    if (!schoolId) return;

    const isGranted = role.permissions.includes(perm.key);
    const updatedPerms = isGranted
      ? role.permissions.filter((p) => p !== perm.key)
      : [...role.permissions, perm.key];

    // Optimistic Update
    setUpdatingCell({ roleId: role.id, permKey: perm.key });
    setRoles((prev) =>
      prev.map((r) => (r.id === role.id ? { ...r, permissions: updatedPerms } : r))
    );

    try {
      await rolePermissionService.toggleRolePermission(schoolId, role, perm.key);
      showToast(
        isGranted
          ? `Revoked "${perm.label}" from ${role.name}`
          : `Granted "${perm.label}" to ${role.name}`,
        'success'
      );
    } catch (err: any) {
      showToast('Failed to update permission: ' + err.message, 'error');
      // Revert on error
      await loadRoles();
    } finally {
      setUpdatingCell(null);
    }
  };

  const handleToggleModuleForRole = async (role: RoleDefinition, moduleName: string) => {
    if (role.code === 'SUPER_ADMIN') {
      showToast('Super Administrator permissions cannot be modified.', 'info');
      return;
    }

    const schoolId = school?.id;
    if (!schoolId) return;

    const modulePerms = ALL_PERMISSIONS.filter((p) => p.module === moduleName).map((p) => p.key);
    const allSelected = modulePerms.every((key) => role.permissions.includes(key));
    const grantAll = !allSelected;

    let updatedPerms: PermissionKey[];
    if (grantAll) {
      updatedPerms = Array.from(new Set([...role.permissions, ...modulePerms]));
    } else {
      updatedPerms = role.permissions.filter((k) => !modulePerms.includes(k));
    }

    // Optimistic update
    setRoles((prev) =>
      prev.map((r) => (r.id === role.id ? { ...r, permissions: updatedPerms } : r))
    );

    try {
      await rolePermissionService.toggleModuleForRole(schoolId, role, moduleName, grantAll);
      showToast(
        grantAll
          ? `Granted all ${modulePerms.length} ${moduleName} permissions to ${role.name}`
          : `Revoked ${moduleName} permissions from ${role.name}`,
        'success'
      );
    } catch (err: any) {
      showToast('Error updating module permissions: ' + err.message, 'error');
      await loadRoles();
    }
  };

  // -------------------------------------------------------------
  // ROLE CREATE / EDIT HANDLERS
  // -------------------------------------------------------------
  const handleOpenCreateRoleModal = () => {
    setEditingRole(null);
    setRoleForm({
      name: '',
      code: '',
      description: '',
      category: 'CUSTOM',
      permissions: ['STUDENTS_VIEW', 'ATTENDANCE_VIEW'],
    });
    setIsRoleModalOpen(true);
  };

  const handleOpenEditRoleModal = (role: RoleDefinition) => {
    setEditingRole(role);
    setRoleForm({
      name: role.name,
      code: role.code,
      description: role.description,
      category: role.category,
      permissions: [...role.permissions],
    });
    setIsRoleModalOpen(true);
  };

  const toggleModalPermission = (key: PermissionKey) => {
    setRoleForm((prev) => {
      const exists = prev.permissions.includes(key);
      if (exists) {
        return { ...prev, permissions: prev.permissions.filter((p) => p !== key) };
      } else {
        return { ...prev, permissions: [...prev.permissions, key] };
      }
    });
  };

  const toggleModalModulePermissions = (module: string) => {
    const modulePerms = ALL_PERMISSIONS.filter((p) => p.module === module).map((p) => p.key);
    const allSelected = modulePerms.every((key) => roleForm.permissions.includes(key));

    setRoleForm((prev) => {
      if (allSelected) {
        return {
          ...prev,
          permissions: prev.permissions.filter((k) => !modulePerms.includes(k)),
        };
      } else {
        const set = new Set([...prev.permissions, ...modulePerms]);
        return { ...prev, permissions: Array.from(set) };
      }
    });
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school?.id) return;

    if (!roleForm.name.trim()) {
      showToast('Please enter a role name', 'warning');
      return;
    }

    setSavingRole(true);
    try {
      const generatedCode =
        roleForm.code.trim().toUpperCase() ||
        roleForm.name
          .toUpperCase()
          .replace(/[^A-Z0-9]+/g, '_')
          .replace(/^_+|_+$/g, '');

      if (editingRole) {
        await rolePermissionService.updateRole(school.id, editingRole.id, {
          name: roleForm.name,
          code: generatedCode,
          description: roleForm.description,
          category: roleForm.category,
          permissions: roleForm.permissions,
        });
        showToast(`Role '${roleForm.name}' updated successfully!`, 'success');
      } else {
        await rolePermissionService.createRole(school.id, {
          name: roleForm.name,
          code: generatedCode,
          description: roleForm.description,
          category: roleForm.category,
          isSystem: false,
          permissions: roleForm.permissions,
          userCount: 0,
        });
        showToast(`New custom role '${roleForm.name}' created!`, 'success');
      }

      setIsRoleModalOpen(false);
      await loadRoles();
    } catch (e: any) {
      showToast('Error saving role: ' + e.message, 'error');
    } finally {
      setSavingRole(false);
    }
  };

  const handleDeleteRole = async (role: RoleDefinition) => {
    if (role.isSystem) {
      showToast('System core roles cannot be deleted, but you can configure their permissions in the matrix.', 'warning');
      return;
    }

    if (confirm(`Are you sure you want to delete custom role '${role.name}'?`)) {
      try {
        await rolePermissionService.deleteRole(school!.id, role.id);
        showToast(`Role '${role.name}' deleted.`, 'success');
        await loadRoles();
      } catch (e: any) {
        showToast('Error deleting role: ' + e.message, 'error');
      }
    }
  };

  // -------------------------------------------------------------
  // CREATE USER LOGIN HANDLERS
  // -------------------------------------------------------------
  const handleOpenCreateUserModal = (presetRole?: string, presetStaff?: Staff) => {
    const randomPin = Math.floor(1000 + Math.random() * 9000);
    const pass = `Glcm@${randomPin}`;

    if (presetStaff) {
      const rawUser = presetStaff.fullName.toLowerCase().replace(/[^a-z0-9]/g, '.');
      setUserForm({
        fullName: presetStaff.fullName,
        username: rawUser,
        email: presetStaff.email || `${rawUser}@example-school.ac.ke`,
        phone: presetStaff.phone || '',
        role: presetRole || presetStaff.role || 'TEACHER',
        status: 'ACTIVE',
        staffId: presetStaff.id,
        tempPassword: pass,
        showPassword: true,
        printSlipImmediately: true,
      });
    } else {
      setUserForm({
        fullName: '',
        username: '',
        email: '',
        phone: '',
        role: presetRole || 'TEACHER',
        status: 'ACTIVE',
        staffId: '',
        tempPassword: pass,
        showPassword: true,
        printSlipImmediately: true,
      });
    }
    setIsCreateUserModalOpen(true);
  };

  const handleGenerateUserPassword = () => {
    const randomPin = Math.floor(1000 + Math.random() * 9000);
    setUserForm((prev) => ({ ...prev, tempPassword: `Glcm@${randomPin}` }));
    showToast('Generated new secure PIN', 'info');
  };

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.fullName.trim()) {
      showToast('Please enter user full name', 'warning');
      return;
    }

    setSavingUser(true);
    try {
      const cleanUsername =
        userForm.username.trim() ||
        userForm.fullName.toLowerCase().replace(/[^a-z0-9]/g, '.');

      const fallbackEmail =
        userForm.email.trim() || `${cleanUsername}@example-school.ac.ke`;

      const created = await userService.createUser({
        fullName: userForm.fullName.trim(),
        username: cleanUsername,
        email: fallbackEmail,
        phone: userForm.phone.trim() || undefined,
        role: userForm.role as UserRole,
        status: userForm.status,
        schoolId: school?.id,
        staffId: userForm.staffId || undefined,
        password: userForm.tempPassword,
        tempPassword: userForm.tempPassword,
      });

      showToast(`Login credentials successfully created for ${created.fullName}!`, 'success');
      setIsCreateUserModalOpen(false);

      if (userForm.printSlipImmediately) {
        setSlipUser(created);
        setSlipPassword(userForm.tempPassword);
        setIsSlipModalOpen(true);
      }

      await loadUsers();
    } catch (e: any) {
      showToast('Error creating user login: ' + e.message, 'error');
    } finally {
      setSavingUser(false);
    }
  };

  // -------------------------------------------------------------
  // RESET PASSWORD HANDLERS
  // -------------------------------------------------------------
  const handleOpenResetPasswordModal = (user?: UserProfile) => {
    if (user) {
      setSelectedUserForReset(user);
    } else if (users.length > 0) {
      setSelectedUserForReset(users[0]);
    } else {
      showToast('No user accounts found to reset.', 'warning');
      return;
    }

    const randomPin = Math.floor(1000 + Math.random() * 9000);
    setNewPassword(`Glcm@${randomPin}`);
    setShowNewPassword(true);
    setCopiedResetPass(false);
    setIsResetPasswordModalOpen(true);
  };

  const handleGenerateResetPassword = () => {
    const randomPin = Math.floor(1000 + Math.random() * 9000);
    setNewPassword(`Glcm@${randomPin}`);
    setCopiedResetPass(false);
    showToast('Generated new password', 'info');
  };

  const handleCopyResetPassword = () => {
    navigator.clipboard.writeText(newPassword);
    setCopiedResetPass(true);
    showToast('Password copied to clipboard!', 'info');
    setTimeout(() => setCopiedResetPass(false), 2500);
  };

  const handleSaveResetPassword = async () => {
    if (!selectedUserForReset) {
      showToast('Please select a user account to reset.', 'warning');
      return;
    }
    if (!newPassword.trim()) {
      showToast('Please specify a new password.', 'warning');
      return;
    }

    setSavingResetPass(true);
    try {
      await userService.setUserPassword(selectedUserForReset.id, newPassword.trim());
      showToast(`Password successfully reset for ${selectedUserForReset.fullName}!`, 'success');
      setIsResetPasswordModalOpen(false);

      // Offer slip
      setSlipUser(selectedUserForReset);
      setSlipPassword(newPassword.trim());
      setIsSlipModalOpen(true);

      await loadUsers();
    } catch (e: any) {
      showToast('Error resetting password: ' + e.message, 'error');
    } finally {
      setSavingResetPass(false);
    }
  };

  // -------------------------------------------------------------
  // USER STATUS & ROLE QUICK UPDATES
  // -------------------------------------------------------------
  const handleToggleUserStatus = async (u: UserProfile) => {
    try {
      const nextStatus = await userService.toggleUserStatus(u.id, u.status);
      showToast(`Account for ${u.fullName} is now ${nextStatus}.`, 'info');
      await loadUsers();
    } catch (e: any) {
      showToast('Error toggling status: ' + e.message, 'error');
    }
  };

  const handleChangeUserRole = async (userId: string, newRole: string) => {
    try {
      await userService.updateUser(userId, { role: newRole as UserRole });
      showToast('User role updated successfully!', 'success');
      await loadUsers();
    } catch (e: any) {
      showToast('Error changing role: ' + e.message, 'error');
    }
  };

  const handlePrintSlip = (u: UserProfile, pass?: string) => {
    const targetPass = pass || u.plainPasswordForAdmin || 'Password@2026';
    printerService.printUserCredentialSlip(u, targetPass, school);
    showToast(`Printing login credential slip for ${u.fullName}...`, 'info');
  };

  // -------------------------------------------------------------
  // FILTERING LOGIC
  // -------------------------------------------------------------
  const filteredRoles = roles.filter((r) => {
    const matchSearch =
      r.name.toLowerCase().includes(roleSearch.toLowerCase()) ||
      r.code.toLowerCase().includes(roleSearch.toLowerCase()) ||
      r.description.toLowerCase().includes(roleSearch.toLowerCase());
    const matchCategory = categoryFilter === 'ALL' || r.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const modulesList = Array.from(new Set(ALL_PERMISSIONS.map((p) => p.module))).filter(
    (mod) => moduleFilter === 'ALL' || mod === moduleFilter
  );

  const filteredUsers = users.filter((u) => {
    const term = userSearch.toLowerCase();
    const matchSearch =
      (u.fullName || '').toLowerCase().includes(term) ||
      (u.username || '').toLowerCase().includes(term) ||
      (u.email || '').toLowerCase().includes(term) ||
      (u.phone || '').toLowerCase().includes(term) ||
      (u.role || '').toLowerCase().includes(term);

    const matchRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-900 text-white flex items-center justify-center shadow-md">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Roles & Permissions Governance Matrix
                </h1>
                <Badge variant="primary" size="sm">
                  Live RBAC Engine
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure interactive permission matrices, manage user login credentials, and reset passwords in real time.
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            icon={<Key className="w-4 h-4 text-amber-600" />}
            onClick={() => handleOpenResetPasswordModal()}
          >
            Reset Password
          </Button>

          <Button
            variant="outline"
            size="sm"
            icon={<UserPlus className="w-4 h-4 text-sky-600" />}
            onClick={() => handleOpenCreateUserModal()}
          >
            Create User Login
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={<PlusCircle className="w-4 h-4" />}
            onClick={handleOpenCreateRoleModal}
          >
            New Custom Role
          </Button>
        </div>
      </div>

      {/* Top KPIs Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Configured Roles</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{roles.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {roles.filter((r) => r.isSystem).length} System • {roles.filter((r) => !r.isSystem).length} Custom
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total User Logins</div>
          <div className="text-2xl font-black text-sky-700 mt-1">{users.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {users.filter((u) => u.status === 'ACTIVE').length} Active • {users.filter((u) => u.status !== 'ACTIVE').length} Suspended
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Granular Permissions</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{ALL_PERMISSIONS.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Across 5 Institutional Modules</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Security Policy</div>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Role-Based Access (RBAC)</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Instant Firestore Sync</div>
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'matrix'
                ? 'bg-blue-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Interactive Permission Matrix</span>
            <span className="bg-white/20 text-white px-1.5 py-0.2 rounded-full text-[10px]">
              {roles.length} Roles
            </span>
          </button>

          <button
            onClick={() => setActiveTab('cards')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'cards'
                ? 'bg-blue-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Role Profiles & Cards</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'bg-blue-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Logins & Password Reset</span>
            <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full text-[10px]">
              {users.length}
            </span>
          </button>
        </div>

        {/* Informational Hint */}
        <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Click any checkbox in the matrix to toggle permissions instantly.</span>
        </div>
      </div>

      {/* ============================================================= */}
      {/* TAB 1: INTERACTIVE PERMISSION MATRIX                          */}
      {/* ============================================================= */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          {/* Matrix Controls & Search */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter permissions by keyword..."
                  value={permSearch}
                  onChange={(e) => setPermSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-900 focus:outline-none"
                />
              </div>

              <select
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white"
              >
                <option value="ALL">All Modules ({ALL_PERMISSIONS.length})</option>
                <option value="Learners & Admissions">Learners & Admissions</option>
                <option value="Academics & CBC">Academics & CBC</option>
                <option value="Finance & POS">Finance & POS</option>
                <option value="Operations & Logistics">Operations & Logistics</option>
                <option value="School Administration">School Administration</option>
              </select>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <span className="text-[11px] text-slate-400">Legend:</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                <Check className="w-3 h-3" /> Granted
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-medium">
                - Revoked
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold">
                <Lock className="w-3 h-3" /> Super Admin
              </span>
            </div>
          </div>

          {/* Interactive Matrix Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-bold border-b border-slate-800 sticky top-0 z-20">
                  <th className="p-3.5 sticky left-0 bg-slate-900 z-30 min-w-[280px] max-w-[320px] shadow-sm">
                    <div className="text-[11px] font-black uppercase tracking-wider text-slate-300">
                      Module & Capability
                    </div>
                    <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                      Click permission to view scope
                    </div>
                  </th>

                  {filteredRoles.map((role) => {
                    const isSuper = role.code === 'SUPER_ADMIN';
                    const permCount = isSuper ? ALL_PERMISSIONS.length : role.permissions.length;
                    const pct = Math.round((permCount / ALL_PERMISSIONS.length) * 100);

                    return (
                      <th
                        key={role.id}
                        className="p-3 text-center min-w-[130px] border-l border-slate-800 hover:bg-slate-850 transition-colors"
                      >
                        <div className="flex flex-col items-center">
                          <div className="font-extrabold text-[12px] text-white leading-tight truncate max-w-[140px]">
                            {role.name}
                          </div>
                          <div className="text-[9px] text-blue-300 font-mono mt-0.5">
                            {role.code}
                          </div>

                          {/* Progress Badge */}
                          <div className="mt-1.5 flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded-full text-[10px]">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isSuper
                                  ? 'bg-rose-400'
                                  : pct > 70
                                  ? 'bg-emerald-400'
                                  : pct > 30
                                  ? 'bg-sky-400'
                                  : 'bg-amber-400'
                              }`}
                            />
                            <span className="font-mono text-slate-200 font-bold">{permCount}</span>
                            <span className="text-slate-400">/ {ALL_PERMISSIONS.length}</span>
                          </div>

                          {/* Quick Header Actions */}
                          <div className="mt-2 flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenCreateUserModal(role.code)}
                              className="text-[9px] font-bold text-sky-300 hover:text-sky-200 bg-sky-950/60 border border-sky-800/80 px-1.5 py-0.5 rounded cursor-pointer"
                              title={`Create user with ${role.name} role`}
                            >
                              + User
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditRoleModal(role)}
                              className="text-[9px] font-bold text-slate-300 hover:text-white bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded cursor-pointer"
                              title="Edit Role Configuration"
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {modulesList.map((modName) => {
                  const modPerms = ALL_PERMISSIONS.filter((p) => {
                    const matchModule = p.module === modName;
                    const matchText =
                      !permSearch ||
                      p.label.toLowerCase().includes(permSearch.toLowerCase()) ||
                      p.key.toLowerCase().includes(permSearch.toLowerCase()) ||
                      p.description.toLowerCase().includes(permSearch.toLowerCase());
                    return matchModule && matchText;
                  });

                  if (modPerms.length === 0) return null;

                  return (
                    <React.Fragment key={modName}>
                      {/* Module Section Banner Row */}
                      <tr className="bg-slate-100 border-y border-slate-200/80 font-bold text-slate-800">
                        <td className="px-3.5 py-2 sticky left-0 bg-slate-100 z-10 border-r border-slate-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-blue-950 font-black">
                              <Layers className="w-3.5 h-3.5 text-blue-800" />
                              <span>{modName}</span>
                              <span className="text-[10px] text-slate-500 font-normal">
                                ({modPerms.length} capabilities)
                              </span>
                            </div>
                          </div>
                        </td>

                        {filteredRoles.map((role) => {
                          const isSuper = role.code === 'SUPER_ADMIN';
                          const allInMod = modPerms.every((p) => role.permissions.includes(p.key));

                          return (
                            <td key={role.id} className="p-2 text-center border-l border-slate-200">
                              {!isSuper && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleModuleForRole(role, modName)}
                                  className={`text-[9px] font-bold px-2 py-0.5 rounded cursor-pointer transition-colors ${
                                    allInMod
                                      ? 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                                      : 'bg-blue-100 text-blue-900 hover:bg-blue-200'
                                  }`}
                                  title={`Toggle all ${modName} permissions for ${role.name}`}
                                >
                                  {allInMod ? 'Revoke All' : 'Grant All'}
                                </button>
                              )}
                            </td>
                          );
                        })}
                      </tr>

                      {/* Permission Rows */}
                      {modPerms.map((perm) => (
                        <tr
                          key={perm.key}
                          className="hover:bg-blue-50/40 transition-colors group"
                        >
                          {/* Permission Title & Key (Sticky Left Column) */}
                          <td className="p-3.5 sticky left-0 bg-white group-hover:bg-blue-50/40 z-10 border-r border-slate-200/80 shadow-xs">
                            <div className="font-bold text-slate-900 text-xs leading-tight">
                              {perm.label}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                              <span>{perm.key}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                              {perm.description}
                            </div>
                          </td>

                          {/* Role Permission Checkboxes (Clickable Cells) */}
                          {filteredRoles.map((role) => {
                            const isSuper = role.code === 'SUPER_ADMIN';
                            const hasPerm = isSuper || role.permissions.includes(perm.key);
                            const isThisUpdating =
                              updatingCell?.roleId === role.id && updatingCell?.permKey === perm.key;

                            return (
                              <td
                                key={role.id}
                                className="p-2.5 text-center border-l border-slate-100 align-middle"
                              >
                                {isSuper ? (
                                  <div
                                    className="inline-flex items-center justify-center gap-1 w-20 py-1 rounded-lg bg-amber-50 text-amber-800 font-bold text-[10px] border border-amber-200"
                                    title="Super Admin has immutable full access"
                                  >
                                    <Lock className="w-3 h-3 text-amber-600" />
                                    <span>Locked</span>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    disabled={isThisUpdating}
                                    onClick={() => handleToggleCell(role, perm)}
                                    className={`inline-flex items-center justify-center gap-1.5 w-24 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-xs ${
                                      hasPerm
                                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 border border-slate-200/80'
                                    } ${isThisUpdating ? 'opacity-50 animate-pulse' : ''}`}
                                    title={`Click to ${hasPerm ? 'REVOKE' : 'GRANT'} ${perm.label} for ${role.name}`}
                                  >
                                    {hasPerm ? (
                                      <>
                                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                                        <span>Allowed</span>
                                      </>
                                    ) : (
                                      <>
                                        <span className="text-slate-300 font-mono">-</span>
                                        <span className="text-slate-400 font-medium text-[10px]">Denied</span>
                                      </>
                                    )}
                                  </button>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 2: ROLE PROFILES & CARDS                                  */}
      {/* ============================================================= */}
      {activeTab === 'cards' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search role name, code, or description..."
                value={roleSearch}
                onChange={(e) => setRoleSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="ALL">All Categories</option>
              <option value="ADMINISTRATIVE">Administrative</option>
              <option value="ACADEMIC">Academic</option>
              <option value="FINANCE">Finance</option>
              <option value="OPERATIONS">Operations</option>
              <option value="SUPPORT">Support</option>
              <option value="PORTAL">Portals</option>
              <option value="CUSTOM">Custom Created</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredRoles.map((role) => {
              const isSuper = role.code === 'SUPER_ADMIN';
              const permPercent = Math.round((role.permissions.length / ALL_PERMISSIONS.length) * 100);

              return (
                <div
                  key={role.id}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between hover:border-slate-300 transition-all space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                            isSuper
                              ? 'bg-rose-900 text-rose-100'
                              : role.category === 'ADMINISTRATIVE'
                              ? 'bg-blue-900 text-blue-100'
                              : role.category === 'FINANCE'
                              ? 'bg-emerald-900 text-emerald-100'
                              : role.category === 'ACADEMIC'
                              ? 'bg-indigo-900 text-indigo-100'
                              : 'bg-slate-800 text-slate-100'
                          }`}
                        >
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-slate-900 leading-tight">{role.name}</h3>
                          <span className="font-mono text-[10px] text-slate-400 font-semibold">{role.code}</span>
                        </div>
                      </div>

                      <Badge variant={role.isSystem ? 'primary' : 'secondary'} size="sm">
                        {role.category}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{role.description}</p>

                    {/* Permissions Progress Bar */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-medium text-slate-500">Authorized Capabilities</span>
                        <span className="font-bold text-slate-900">
                          {isSuper ? 'Full Access (All 24)' : `${role.permissions.length} / ${ALL_PERMISSIONS.length}`}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isSuper
                              ? 'bg-rose-600'
                              : permPercent > 70
                              ? 'bg-blue-600'
                              : permPercent > 30
                              ? 'bg-emerald-600'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: isSuper ? '100%' : `${permPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Sample Granted Permissions */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {role.permissions.slice(0, 4).map((pKey) => {
                        const def = ALL_PERMISSIONS.find((p) => p.key === pKey);
                        return (
                          <span
                            key={pKey}
                            className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[10px] font-medium"
                          >
                            {def?.label || pKey}
                          </span>
                        );
                      })}
                      {role.permissions.length > 4 && (
                        <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md text-[10px] font-bold">
                          +{role.permissions.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleOpenCreateUserModal(role.code)}
                      className="text-xs font-bold text-sky-700 hover:text-sky-900 flex items-center gap-1 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>+ Add User Login</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Edit2 className="w-3.5 h-3.5" />}
                        onClick={() => handleOpenEditRoleModal(role)}
                      >
                        Configure
                      </Button>
                      {!role.isSystem && (
                        <button
                          onClick={() => handleDeleteRole(role)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete custom role"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 3: USER LOGINS & RESET PASSWORD                           */}
      {/* ============================================================= */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* User Controls & Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search user name, username, email, or role..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
              >
                <option value="ALL">All Roles ({roles.length})</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.code}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={<RefreshCw className="w-3.5 h-3.5" />}
                onClick={loadUsers}
                loading={loadingUsers}
              >
                Refresh
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<UserPlus className="w-4 h-4" />}
                onClick={() => handleOpenCreateUserModal()}
              >
                + Create User Login
              </Button>
            </div>
          </div>

          {/* User Logins List */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold">
                    <th className="p-3.5">User Identity & Name</th>
                    <th className="p-3.5">Login Username & Email</th>
                    <th className="p-3.5">Assigned School Role</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-right">Credential Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        No user logins found matching your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const roleDef = roles.find((r) => r.code === u.role);
                      const isSuper = u.role === 'SUPER_ADMIN';

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-900 font-black flex items-center justify-center text-xs shrink-0">
                                {u.fullName ? u.fullName.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 leading-tight">
                                  {u.fullName || 'Institutional User'}
                                </div>
                                {u.phone && (
                                  <div className="text-[10px] text-slate-400 font-mono">{u.phone}</div>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="p-3.5">
                            <div className="font-mono font-bold text-slate-800 text-xs">
                              @{u.username || u.email.split('@')[0]}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">{u.email}</div>
                          </td>

                          <td className="p-3.5">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  isSuper
                                    ? 'danger'
                                    : roleDef?.category === 'FINANCE'
                                    ? 'warning'
                                    : roleDef?.category === 'ACADEMIC'
                                    ? 'success'
                                    : 'primary'
                                }
                                size="sm"
                              >
                                {roleDef?.name || u.role}
                              </Badge>
                              {/* Quick Role Switcher */}
                              <select
                                value={u.role}
                                onChange={(e) => handleChangeUserRole(u.id, e.target.value)}
                                className="text-[10px] px-2 py-0.5 border border-slate-200 rounded font-semibold text-slate-700 bg-white"
                                title="Re-assign role"
                              >
                                {roles.map((r) => (
                                  <option key={r.id} value={r.code}>
                                    {r.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </td>

                          <td className="p-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleUserStatus(u)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                                u.status === 'ACTIVE'
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                  : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                              }`}
                              title="Click to toggle status"
                            >
                              {u.status || 'ACTIVE'}
                            </button>
                          </td>

                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Reset Password Button */}
                              <Button
                                variant="outline"
                                size="sm"
                                icon={<Key className="w-3.5 h-3.5 text-amber-600" />}
                                onClick={() => handleOpenResetPasswordModal(u)}
                              >
                                Reset Pass
                              </Button>

                              {/* Print Slip Button */}
                              <button
                                type="button"
                                onClick={() => handlePrintSlip(u)}
                                className="p-1.5 text-slate-500 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer border border-slate-200"
                                title="Print Login Credential Slip"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 1: CREATE / EDIT ROLE MODAL                             */}
      {/* ============================================================= */}
      <Modal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        title={editingRole ? `Configure Role: ${editingRole.name}` : 'Create Custom School Role'}
        maxWidth="3xl"
      >
        <form onSubmit={handleSaveRole} className="space-y-6 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700">Role Display Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Senior Housemaster / ICT Coordinator"
                value={roleForm.name}
                onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700">System Code Identifier</label>
              <input
                type="text"
                placeholder="e.g. ICT_COORDINATOR"
                value={roleForm.code}
                onChange={(e) => setRoleForm({ ...roleForm, code: e.target.value.toUpperCase() })}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700">Role Category</label>
              <select
                value={roleForm.category}
                onChange={(e) => setRoleForm({ ...roleForm, category: e.target.value as any })}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl font-semibold text-slate-700"
              >
                <option value="ADMINISTRATIVE">Administrative</option>
                <option value="ACADEMIC">Academic</option>
                <option value="FINANCE">Finance</option>
                <option value="OPERATIONS">Operations</option>
                <option value="SUPPORT">Support</option>
                <option value="PORTAL">Portals</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700">Role Description</label>
              <input
                type="text"
                placeholder="Responsibilities and access scope summary..."
                value={roleForm.description}
                onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          {/* Granular Permissions Checkboxes */}
          <div className="space-y-4 border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-900">Module Permissions Matrix</h4>
                <p className="text-[11px] text-slate-500">
                  Select specific capabilities granted to users with this role.
                </p>
              </div>
              <div className="text-[11px] font-bold bg-blue-50 text-blue-900 px-2.5 py-1 rounded-lg border border-blue-200">
                {roleForm.permissions.length} of {ALL_PERMISSIONS.length} Permissions Selected
              </div>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
              {modulesList.map((modName) => {
                const modPerms = ALL_PERMISSIONS.filter((p) => p.module === modName);
                const allSelected = modPerms.every((k) => roleForm.permissions.includes(k.key));

                return (
                  <div
                    key={modName}
                    className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                      <div className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-blue-900" />
                        <span>{modName}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleModalModulePermissions(modName)}
                        className="text-[11px] font-semibold text-blue-900 hover:text-blue-950 cursor-pointer"
                      >
                        {allSelected ? 'Deselect All' : 'Select All in Module'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {modPerms.map((p) => {
                        const isChecked = roleForm.permissions.includes(p.key);
                        return (
                          <label
                            key={p.key}
                            onClick={(e) => {
                              e.preventDefault();
                              toggleModalPermission(p.key);
                            }}
                            className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-colors cursor-pointer ${
                              isChecked
                                ? 'bg-blue-50/70 border-blue-300 text-blue-950'
                                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              readOnly
                              className="mt-0.5 rounded text-blue-900 focus:ring-blue-900 pointer-events-none"
                            />
                            <div>
                              <div className="font-bold text-xs leading-tight">{p.label}</div>
                              <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{p.description}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 flex items-center justify-end gap-3">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsRoleModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              loading={savingRole}
              icon={<ShieldCheck className="w-4 h-4" />}
            >
              {editingRole ? 'Save Changes' : 'Create Role'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ============================================================= */}
      {/* MODAL 2: CREATE USER LOGIN MODAL                              */}
      {/* ============================================================= */}
      <Modal
        isOpen={isCreateUserModalOpen}
        onClose={() => setIsCreateUserModalOpen(false)}
        title="Create New User Login Credentials"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateUserSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700">Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. John Kamau Mwangi"
              value={userForm.fullName}
              onChange={(e) => {
                const name = e.target.value;
                const autoUser = name.toLowerCase().replace(/[^a-z0-9]/g, '.');
                setUserForm({
                  ...userForm,
                  fullName: name,
                  username: userForm.username ? userForm.username : autoUser,
                  email: userForm.email ? userForm.email : `${autoUser}@example-school.ac.ke`,
                });
              }}
              className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl font-bold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700">Login Username</label>
              <input
                type="text"
                placeholder="e.g. john.kamau"
                value={userForm.username}
                onChange={(e) => setUserForm({ ...userForm, username: e.target.value.toLowerCase() })}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700">Official Email</label>
              <input
                type="email"
                placeholder="e.g. john@example-school.ac.ke"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700">Phone Number (SMS Login)</label>
              <input
                type="tel"
                placeholder="0712345678"
                value={userForm.phone}
                onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700">Assign Role & Permissions</label>
              <select
                value={userForm.role}
                onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-800 bg-white"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.code}>
                    {r.name} ({r.category})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Password Generator Field */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800">Initial Login Password *</label>
              <button
                type="button"
                onClick={handleGenerateUserPassword}
                className="text-[11px] font-bold text-blue-900 hover:text-blue-950 flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                Generate New Pin
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type={userForm.showPassword ? 'text' : 'password'}
                  required
                  value={userForm.tempPassword}
                  onChange={(e) => setUserForm({ ...userForm, tempPassword: e.target.value })}
                  className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 bg-white"
                />
                <button
                  type="button"
                  onClick={() => setUserForm({ ...userForm, showPassword: !userForm.showPassword })}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {userForm.showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={<Copy className="w-3.5 h-3.5" />}
                onClick={() => {
                  navigator.clipboard.writeText(userForm.tempPassword);
                  showToast('Password copied!', 'info');
                }}
              >
                Copy
              </Button>
            </div>
            <p className="text-[10px] text-slate-500">
              Users can change their temporary password once signed into their portal.
            </p>
          </div>

          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={userForm.printSlipImmediately}
              onChange={(e) => setUserForm({ ...userForm, printSlipImmediately: e.target.checked })}
              className="rounded text-blue-900 focus:ring-blue-900"
            />
            <span className="font-medium text-slate-700">
              Open printable credential slip immediately after creating account
            </span>
          </label>

          <div className="border-t border-slate-100 pt-4 flex items-center justify-end gap-3">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setIsCreateUserModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              loading={savingUser}
              icon={<UserPlus className="w-4 h-4" />}
            >
              Create Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* ============================================================= */}
      {/* MODAL 3: RESET USER PASSWORD MODAL                            */}
      {/* ============================================================= */}
      <Modal
        isOpen={isResetPasswordModalOpen}
        onClose={() => setIsResetPasswordModalOpen(false)}
        title="Reset User Account Password"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          {/* User Selector if not preselected */}
          <div>
            <label className="font-semibold text-slate-700">Target User Account</label>
            <select
              value={selectedUserForReset?.id || ''}
              onChange={(e) => {
                const target = users.find((u) => u.id === e.target.value);
                setSelectedUserForReset(target || null);
              }}
              className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-800 bg-white"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} — @{u.username || u.email.split('@')[0]} ({u.role})
                </option>
              ))}
            </select>
          </div>

          {/* User Details Callout */}
          {selectedUserForReset && (
            <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900 text-xs">{selectedUserForReset.fullName}</div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                  Username: @{selectedUserForReset.username || selectedUserForReset.email.split('@')[0]}
                </div>
              </div>
              <Badge variant="primary" size="sm">
                {selectedUserForReset.role}
              </Badge>
            </div>
          )}

          {/* New Password Input with Generator & Copy */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800">New Password *</label>
              <button
                type="button"
                onClick={handleGenerateResetPassword}
                className="text-[11px] font-bold text-blue-900 hover:text-blue-950 flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Generate Random Pin
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-xl font-mono font-bold text-sm text-slate-900 bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={<Copy className="w-3.5 h-3.5" />}
                onClick={handleCopyResetPassword}
              >
                {copiedResetPass ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <p className="text-[10px] text-slate-500">
              The user can sign in immediately using their username and this new password.
            </p>
          </div>

          <div className="border-t border-slate-100 pt-4 flex items-center justify-end gap-3">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setIsResetPasswordModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveResetPassword}
              loading={savingResetPass}
              icon={<KeyRound className="w-4 h-4" />}
            >
              Confirm & Save Password
            </Button>
          </div>
        </div>
      </Modal>

      {/* ============================================================= */}
      {/* MODAL 4: LOGIN CREDENTIAL SLIP MODAL                          */}
      {/* ============================================================= */}
      <Modal
        isOpen={isSlipModalOpen}
        onClose={() => setIsSlipModalOpen(false)}
        title="Official Login Credential Slip"
        maxWidth="md"
      >
        {slipUser && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-3 shadow-md">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div>
                  <div className="font-bold text-sm text-white">{school?.name || 'Primary School ERP'}</div>
                  <div className="text-[10px] text-blue-300">Staff & Portal Login Credentials</div>
                </div>
                <Badge variant="primary" size="sm">
                  CONFIDENTIAL
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px]">Staff / User:</span>
                  <span className="font-bold text-white text-xs">{slipUser.fullName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Assigned Role:</span>
                  <span className="font-bold text-emerald-400">{slipUser.role}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Username:</span>
                  <span className="font-mono font-bold text-sky-300">
                    @{slipUser.username || slipUser.email.split('@')[0]}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Temporary Password:</span>
                  <span className="font-mono font-black text-amber-300 text-sm">{slipPassword}</span>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-2 text-[10px] text-slate-400">
                Portal URL: <strong className="text-slate-200">{typeof window !== 'undefined' ? window.location.origin : ''}</strong>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                icon={<Copy className="w-3.5 h-3.5" />}
                onClick={() => {
                  const text = `School: ${school?.name}\nUser: ${slipUser.fullName}\nUsername: ${slipUser.username || slipUser.email.split('@')[0]}\nPassword: ${slipPassword}\nPortal: ${window.location.origin}`;
                  navigator.clipboard.writeText(text);
                  showToast('Credentials copied to clipboard!', 'info');
                }}
              >
                Copy Details
              </Button>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsSlipModalOpen(false)}>
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Printer className="w-4 h-4" />}
                  onClick={() => handlePrintSlip(slipUser, slipPassword)}
                >
                  Print Official Slip
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
