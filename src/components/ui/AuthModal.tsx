import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { UserRole } from '../../types';
import { Modal } from './Modal';
import { Button } from './Button';
import {
  ShieldCheck,
  Lock,
  User as UserIcon,
  LogOut,
  LogIn,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Users,
  BookMarked,
  DollarSign,
  Eye,
  EyeOff,
  KeyRound,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: UserRole;
  onSuccess?: (role: UserRole) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultRole = 'SCHOOL_ADMIN',
  onSuccess,
}) => {
  const { user, login, logout, activeRole, switchRole } = useAuth();
  const { showToast } = useToast();

  const [selectedRole, setSelectedRole] = useState<UserRole>(defaultRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both your account username/email and password.');
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    try {
      const profile = await login(email.trim(), password.trim());
      showToast(`Welcome back, ${profile.fullName}!`, 'success');
      if (profile.role) {
        switchRole(profile.role);
      }
      onSuccess?.(profile.role);
      onClose();
    } catch (err: any) {
      let msg = err.message || 'Invalid username or password. Please verify your credentials.';
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      showToast('You have been signed out successfully.', 'info');
    } catch (err: any) {
      showToast('Error signing out: ' + err.message, 'error');
    }
  };

  const isAlreadyLoggedIn = user && user.email && user.id !== 'demo-admin-id';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="School Portal Sign-In"
      subtitle="Enter your account username and password to log in"
      maxWidth="md"
    >
      <div className="space-y-5 text-xs text-slate-700 py-1">
        {/* If user is already authenticated */}
        {isAlreadyLoggedIn ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
            <div className="flex items-center gap-3">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  className="w-12 h-12 rounded-full border-2 border-emerald-400 object-cover shadow-xs"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
                  {user.fullName.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-black text-slate-900 text-sm truncate">{user.fullName}</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                    Active Session
                  </span>
                </div>
                <p className="text-slate-600 text-xs truncate mt-0.5">{user.email || user.username}</p>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-800 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Authorized Role: <strong>{user.role.replace('_', ' ')}</strong></span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-emerald-200/80 flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={<LogOut className="w-3.5 h-3.5" />}
                onClick={handleSignOut}
                className="text-xs text-rose-700 border-rose-200 hover:bg-rose-50"
              >
                Sign Out
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<ArrowRight className="w-3.5 h-3.5" />}
                onClick={() => {
                  onSuccess?.(user.role);
                  onClose();
                }}
                className="text-xs bg-emerald-700 hover:bg-emerald-800 font-bold"
              >
                Continue to {user.role === 'PARENT' ? 'Parent Portal' : user.role === 'TEACHER' ? 'Teacher Portal' : 'Admin ERP'}
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Quick Portal Category Preview */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                Access Portals
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { role: 'SCHOOL_ADMIN' as UserRole, label: 'Admin ERP', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
                  { role: 'TEACHER' as UserRole, label: 'Teacher Portal', icon: <GraduationCap className="w-3.5 h-3.5" /> },
                  { role: 'PARENT' as UserRole, label: 'Parent Portal', icon: <Users className="w-3.5 h-3.5" /> },
                  { role: 'BURSAR' as UserRole, label: 'Fee Cashier', icon: <DollarSign className="w-3.5 h-3.5" /> },
                ].map((item) => (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => setSelectedRole(item.role)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedRole === item.role
                        ? 'border-blue-900 bg-blue-50/80 text-blue-950 font-bold shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={selectedRole === item.role ? 'text-blue-900' : 'text-slate-400'}>
                        {item.icon}
                      </span>
                      {selectedRole === item.role && (
                        <span className="w-2 h-2 rounded-full bg-blue-900" />
                      )}
                    </div>
                    <span className="text-[11px] leading-tight font-semibold">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Error message banner */}
            {errorMessage && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl space-y-2">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed font-medium">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Username / Password Login Form */}
            <form onSubmit={handleSignIn} className="space-y-3.5 pt-1">
              <div className="p-3 bg-blue-50/80 border border-blue-200/80 rounded-xl flex items-center gap-2.5 text-blue-950">
                <KeyRound className="w-4 h-4 text-blue-700 shrink-0" />
                <div className="text-[11px] leading-tight">
                  <span className="font-bold">Client & Staff Credentials:</span> Enter the exact username and password created for your account.
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Account Username or Email:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. client1, teacher.omondi, or parent.kamau"
                    required
                    className="w-full px-3.5 py-2.5 pl-9 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 focus:border-transparent font-medium"
                  />
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Account Password:
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-blue-900 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showPassword ? 'Hide Password' : 'Show Password'}</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your confidential account password"
                    required
                    className="w-full px-3.5 py-2.5 pl-9 pr-10 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 focus:border-transparent font-medium"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              {/* Quick Demo Credentials */}
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Quick Demo Credentials (Click to fill):
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('super.admin');
                      setPassword('Admin@2026');
                    }}
                    className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 cursor-pointer"
                  >
                    👑 Super Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('bursar');
                      setPassword('Bursar@2026');
                    }}
                    className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 cursor-pointer"
                  >
                    💰 Bursar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('mwalimu.omondi');
                      setPassword('Teacher@2026');
                    }}
                    className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 cursor-pointer"
                  >
                    📚 Teacher
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Portal access is automatically verified against your created account credentials.</span>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={loading}
                icon={<LogIn className="w-4 h-4" />}
                className="w-full font-bold text-xs bg-blue-900 hover:bg-blue-800"
              >
                Sign In to Account
              </Button>
            </form>

            {/* Protected security note */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Protected by School Access Control & 256-bit SSL</span>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
