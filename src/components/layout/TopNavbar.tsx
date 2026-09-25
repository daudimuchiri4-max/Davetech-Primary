import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { UserRole } from '../../types';
import { printerService } from '../../services/printerService';
import { PrinterManagerModal } from '../ui/PrinterManagerModal';
import {
  School as SchoolIcon,
  Bell,
  Sparkles,
  Globe,
  LogOut,
  User,
  ShieldCheck,
  ChevronDown,
  Menu,
  Printer,
  Download,
  Smartphone,
  X,
} from 'lucide-react';

interface TopNavbarProps {
  onToggleSidebar?: () => void;
  onNavigatePublic?: () => void;
  currentView?: string;
  onNavigate?: (view: string) => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  onToggleSidebar,
  onNavigatePublic,
  onNavigate,
}) => {
  const { user, school, activeRole, setActiveRole, logout } = useAuth();
  const { showToast } = useToast();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [printerModalOpen, setPrinterModalOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        showToast('App installed successfully!', 'success');
      }
    } else {
      setShowInstallGuide(true);
    }
  };

  const printerConfig = printerService.getConfig();

  const availableRoles: { role: UserRole; label: string }[] = [
    { role: 'SCHOOL_ADMIN', label: 'School Admin / Principal' },
    { role: 'TEACHER', label: 'Teacher / Facilitator' },
    { role: 'PARENT', label: 'Parent Portal' },
    { role: 'STUDENT', label: 'Student Portal' },
    { role: 'ACCOUNTANT', label: 'Bursar / Accountant' },
    { role: 'CASHIER', label: 'POS Cashier' },
  ];

  return (
    <header className="h-16 bg-blue-900 border-b border-blue-800 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 shadow-md text-white">
      {/* Left section: Hamburger & School info */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 text-blue-100 hover:bg-blue-800 rounded-xl cursor-pointer transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          {school?.logoUrl ? (
            <div className="w-10 h-10 rounded-xl bg-white border border-blue-700 p-1 flex items-center justify-center overflow-hidden shadow-xs shrink-0">
              <img
                src={school.logoUrl}
                alt={school.name}
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div className="w-9 h-9 rounded-xl bg-white text-blue-950 flex items-center justify-center font-bold text-xs shadow-xs shrink-0 tracking-wider">
              {school?.code ? school.code.slice(0, 4) : 'SCHOOLM'}
            </div>
          )}
          <div>
            <div className="font-bold text-white text-sm leading-tight line-clamp-1">
              {school?.name || 'Primary School ERP'}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-blue-200 font-medium">
              <span>{school?.academicYear || '2026'} • {school?.currentTerm || 'Term 1'}</span>
              <span className="hidden sm:inline text-blue-400">•</span>
              <span className="hidden sm:inline text-blue-100 bg-blue-800/80 border border-blue-700/60 px-1.5 py-0.2 rounded font-semibold text-[10px]">
                {school?.currency || 'KES'} ({school?.currencySymbol || 'KSh'})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Physical Printer Hardware Connector Button */}
        <button
          onClick={() => setPrinterModalOpen(true)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
            printerConfig.isConnected
              ? 'bg-emerald-500 text-white border-emerald-400 hover:bg-emerald-600'
              : 'bg-blue-800/80 text-blue-100 border-blue-700 hover:bg-blue-800'
          }`}
          title="Physical Printer & Hardware Settings (ESC/POS Thermal, USB/Bluetooth & A4 Drivers)"
        >
          <Printer className={`w-3.5 h-3.5 ${printerConfig.isConnected ? 'text-white' : 'text-blue-200'}`} />
          <span className="hidden md:inline">Printer</span>
          <span
            className={`w-2 h-2 rounded-full ${
              printerConfig.isConnected ? 'bg-emerald-200 animate-pulse' : 'bg-blue-400'
            }`}
          />
        </button>

        {/* Install App PWA Button */}
        <button
          onClick={handleInstallApp}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 border border-emerald-500 rounded-xl transition-colors cursor-pointer shadow-xs"
          title="Install App on Phone / Desktop"
        >
          <Download className="w-3.5 h-3.5 text-emerald-100" />
          <span className="hidden md:inline">Install App</span>
        </button>

        {/* Public Website View Link */}
        <button
          onClick={onNavigatePublic}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-800/80 hover:bg-blue-800 border border-blue-700 rounded-xl transition-colors cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5 text-blue-200" />
          <span className="hidden sm:inline">Public Website</span>
        </button>

        {/* Switch Role Simulator Dropdown */}
        <div className="relative">
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-white bg-blue-800 border border-blue-700 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-200" />
            <span className="font-semibold hidden sm:inline text-blue-200">Role:</span>
            <span className="font-bold text-white">{activeRole.replace('_', ' ')}</span>
            <ChevronDown className="w-3 h-3 text-blue-300" />
          </button>

          {roleMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white text-slate-900 border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Switch Portal Role
              </div>
              {availableRoles.map((r) => (
                <button
                  key={r.role}
                  onClick={() => {
                    setActiveRole(r.role);
                    setRoleMenuOpen(false);
                    showToast(`Switched portal view to ${r.label}`, 'info');
                    if (r.role === 'PARENT' && onNavigate) onNavigate('parent-portal');
                    else if (r.role === 'TEACHER' && onNavigate) onNavigate('teacher-portal');
                    else if (r.role === 'STUDENT' && onNavigate) onNavigate('student-portal');
                    else if (r.role === 'CASHIER' && onNavigate) onNavigate('pos');
                    else if (onNavigate) onNavigate('dashboard');
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                    activeRole === r.role ? 'font-bold text-blue-900 bg-blue-50/50' : 'text-slate-700'
                  }`}
                >
                  <span>{r.label}</span>
                  {activeRole === r.role && <span className="w-1.5 h-1.5 rounded-full bg-blue-900"></span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User avatar / profile button */}
        <div className="flex items-center gap-2 pl-2 border-l border-blue-800">
          <div className="w-8 h-8 rounded-full bg-blue-700 border border-blue-500 text-white flex items-center justify-center text-xs font-semibold shadow-xs">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          <div className="hidden xl:block text-left">
            <div className="text-xs font-bold text-white leading-none">{user?.fullName || 'Administrator'}</div>
            <div className="text-[10px] text-blue-200 mt-0.5">{user?.email || 'admin@school.ac.ke'}</div>
          </div>
        </div>
      </div>

      <PrinterManagerModal
        isOpen={printerModalOpen}
        onClose={() => setPrinterModalOpen(false)}
      />

      {/* PWA Install Guide Modal */}
      {showInstallGuide && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-2xl">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Install App on Phone</h3>
                  <p className="text-xs text-slate-500">Access your school ERP instantly from your home screen</p>
                </div>
              </div>
              <button
                onClick={() => setShowInstallGuide(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-2xl space-y-1">
                <span className="font-bold text-blue-900 block text-sm">📱 For Android (Chrome / Edge):</span>
                <p className="leading-relaxed text-slate-600">
                  Tap the browser menu icon (<strong className="text-slate-900">⋮</strong>) at the top right, then select <strong className="text-blue-900">"Install app"</strong> or <strong className="text-blue-900">"Add to Home screen"</strong>.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <span className="font-bold text-slate-900 block text-sm">🍏 For iPhone / iPad (Safari):</span>
                <p className="leading-relaxed text-slate-600">
                  Tap the Share button (<strong className="text-slate-900">⎋</strong> or <strong className="text-slate-900">📤</strong>) at the bottom toolbar, scroll down, and tap <strong className="text-slate-900">"Add to Home Screen"</strong>.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowInstallGuide(false)}
                className="w-full py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-2xl text-xs cursor-pointer shadow-md transition-colors"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
