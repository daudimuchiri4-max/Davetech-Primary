import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import { ActiveView } from '../../App';
import { Button } from '../ui/Button';
import { AuthModal } from '../ui/AuthModal';
import { SubscriptionStatusBadge } from '../subscription/SubscriptionStatusBadge';
import { SubscriptionRenewalModal } from '../subscription/SubscriptionRenewalModal';
import { subscriptionService, DEFAULT_SUBSCRIPTION_CONFIG } from '../../services/subscriptionService';
import { SchoolSubscriptionConfig } from '../../types';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  UserCheck,
  GraduationCap,
  Award,
  FileText,
  CalendarCheck,
  DollarSign,
  ShoppingCart,
  Package,
  BookOpen,
  Bus,
  HeartPulse,
  Megaphone,
  Globe,
  BarChart2,
  Settings,
  ShieldCheck,
  Menu,
  X,
} from 'lucide-react';

interface AppLayoutProps {
  activeView: ActiveView;
  onNavigate: (view: ActiveView) => void;
  onOpenPublicSite: () => void;
  children: React.ReactNode;
}

interface NavSection {
  title: string;
  items: {
    id: ActiveView;
    label: string;
    icon: React.ReactNode;
    badge?: string;
    roles?: UserRole[];
  }[];
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  activeView,
  onNavigate,
  onOpenPublicSite,
  children,
}) => {
  const { school, activeRole, switchRole } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isRenewalModalOpen, setIsRenewalModalOpen] = useState(false);
  const [subscription, setSubscription] = useState<SchoolSubscriptionConfig>(DEFAULT_SUBSCRIPTION_CONFIG);

  useEffect(() => {
    const loadSub = async () => {
      try {
        const config = await subscriptionService.getSubscriptionConfig(school?.id);
        setSubscription(config);
      } catch (e) {
        console.warn('Could not load subscription in AppLayout:', e);
      }
    };
    loadSub();
  }, [school?.id]);

  useEffect(() => {
    if (school?.themeSettings) {
      const t = school.themeSettings;
      const root = document.documentElement;
      if (t.primaryColor) root.style.setProperty('--primary-color', t.primaryColor);
      if (t.secondaryColor) root.style.setProperty('--secondary-color', t.secondaryColor);
      if (t.accentColor) root.style.setProperty('--accent-color', t.accentColor);
      if (t.sidebarColor) root.style.setProperty('--sidebar-color', t.sidebarColor);
      if (t.headerColor) root.style.setProperty('--header-color', t.headerColor);
      if (t.backgroundColor) root.style.setProperty('--background-color', t.backgroundColor);
      if (t.cardColor) root.style.setProperty('--card-color', t.cardColor);
      if (t.textColor) root.style.setProperty('--text-color', t.textColor);
      if (t.buttonColor) root.style.setProperty('--button-color', t.buttonColor);
      if (t.buttonTextColor) root.style.setProperty('--button-text-color', t.buttonTextColor);
    }
  }, [school?.themeSettings]);

  const schoolNameDisplay =
    school?.name &&
    school.name !== 'Davetech Primary School' &&
    school.name !== 'New Primary School' &&
    school.name !== 'Primary School ERP'
      ? school.name
      : 'Davetech School ERP';

  const navSections: NavSection[] =
    activeRole === 'TEACHER'
      ? [
          {
            title: 'Teacher Workspace',
            items: [
              { id: 'TEACHER_PORTAL', label: 'Teacher Portal (Attendance & Marks)', icon: <CalendarCheck className="w-4 h-4" /> },
              { id: 'PUBLIC', label: 'Public Website (Live)', icon: <Globe className="w-4 h-4 text-blue-400" />, badge: 'Live' },
            ],
          },
        ]
      : activeRole === 'PARENT'
      ? [
          {
            title: 'Parent Workspace',
            items: [
              { id: 'PARENT_PORTAL', label: 'Parent Portal', icon: <Users className="w-4 h-4" /> },
              { id: 'PUBLIC', label: 'Public Website (Live)', icon: <Globe className="w-4 h-4 text-blue-400" />, badge: 'Live' },
            ],
          },
        ]
      : activeRole === 'STUDENT'
      ? [
          {
            title: 'Learner Workspace',
            items: [
              { id: 'STUDENT_PORTAL', label: 'Learner Portal', icon: <GraduationCap className="w-4 h-4" /> },
              { id: 'PUBLIC', label: 'Public Website (Live)', icon: <Globe className="w-4 h-4 text-blue-400" />, badge: 'Live' },
            ],
          },
        ]
      : [
          {
            title: 'Core Administration',
            items: [
              { id: 'DASHBOARD', label: 'Overview Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
              { id: 'STUDENTS', label: 'Learners Directory', icon: <Users className="w-4 h-4" /> },
              { id: 'ADMISSIONS', label: 'Online Admissions', icon: <UserPlus className="w-4 h-4" />, badge: 'New' },
              { id: 'PARENTS', label: 'Parents / Guardians', icon: <Users className="w-4 h-4" /> },
              { id: 'STAFF', label: 'Teaching & Staff (TSC)', icon: <UserCheck className="w-4 h-4" /> },
            ],
          },
          {
            title: 'Academics & CBC',
            items: [
              { id: 'ACADEMICS', label: 'Classes & Streams', icon: <GraduationCap className="w-4 h-4" /> },
              { id: 'ASSESSMENTS', label: 'CBC Rubrics & Marks', icon: <Award className="w-4 h-4" /> },
              { id: 'REPORT_CARDS', label: 'Terminal Report Cards', icon: <FileText className="w-4 h-4" /> },
            ],
          },
          {
            title: 'Operations & Finance',
            items: [
              { id: 'ATTENDANCE', label: 'Daily Attendance Roll', icon: <CalendarCheck className="w-4 h-4" /> },
              { id: 'FEES', label: 'Fee Invoicing & Receipts', icon: <DollarSign className="w-4 h-4" /> },
              { id: 'POS', label: 'Canteen & Store POS', icon: <ShoppingCart className="w-4 h-4" /> },
              { id: 'INVENTORY', label: 'Inventory & Assets', icon: <Package className="w-4 h-4" /> },
              { id: 'LIBRARY', label: 'Library & Reader Books', icon: <BookOpen className="w-4 h-4" /> },
              { id: 'TRANSPORT', label: 'Bus Routes & Fleet', icon: <Bus className="w-4 h-4" /> },
              { id: 'HEALTH_DISCIPLINE', label: 'Clinic & Discipline', icon: <HeartPulse className="w-4 h-4" /> },
              { id: 'COMMUNICATION', label: 'Notices & Calendar', icon: <Megaphone className="w-4 h-4" /> },
            ],
          },
          {
            title: 'Website & System',
            items: [
              { id: 'PUBLIC', label: 'Public Website (Live)', icon: <Globe className="w-4 h-4 text-blue-400" />, badge: 'Live' },
              { id: 'WEBSITE_CMS', label: 'Public Website CMS & Hero', icon: <Globe className="w-4 h-4" /> },
              ...(activeRole === 'SUPER_ADMIN'
                ? [
                    {
                      id: 'SAAS_BILLING' as ActiveView,
                      label: 'System Owner Console',
                      icon: <ShieldCheck className="w-4 h-4 text-indigo-400" />,
                      badge: 'Owner',
                    },
                  ]
                : []),
              { id: 'ROLES_PERMISSIONS', label: 'Roles & Permissions', icon: <ShieldCheck className="w-4 h-4 text-emerald-400" /> },
              { id: 'REPORTS', label: 'Analytics & CSV Exports', icon: <BarChart2 className="w-4 h-4" /> },
              { id: 'SETTINGS', label: 'School Settings', icon: <Settings className="w-4 h-4" /> },
            ],
          },
        ];

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Bar Header - Clean Blue Theme */}
      <header className="sticky top-0 z-30 bg-blue-600 border-b border-blue-500 shadow-md h-16 flex items-center justify-between px-4 sm:px-6 text-white">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-xl text-blue-100 hover:text-white hover:bg-blue-700 cursor-pointer transition-colors"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            {school?.logoUrl ? (
              <div className="w-9 h-9 rounded-xl bg-white border border-blue-400 p-1 flex items-center justify-center overflow-hidden shadow-xs shrink-0">
                <img
                  src={school.logoUrl}
                  alt={schoolNameDisplay}
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-white text-blue-900 flex items-center justify-center font-bold text-xs shadow-xs shrink-0 tracking-wider">
                {school?.code ? school.code.slice(0, 4) : 'ERP'}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white tracking-tight">
                  {schoolNameDisplay}
                </span>
                <span className="hidden sm:inline-flex items-center text-[10px] font-semibold bg-blue-700/80 text-blue-100 px-2 py-0.5 rounded-md border border-blue-500 font-mono">
                  {school?.academicYear || '2026'} • {school?.currentTerm || 'Term 1'}
                </span>
              </div>
              <p className="text-[10px] text-blue-200 font-normal hidden sm:block">
                Central Administration & CBC Hub • Playgroup to Grade 9
              </p>
            </div>
          </div>
        </div>

        {/* Right Actions - Clean Product Demo Header: Davetech ERP | Website | SaaS Admin */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* SaaS Monthly Subscription Badge (Restricted strictly to System Owner / Super Admin) */}
          {activeRole === 'SUPER_ADMIN' && (
            <SubscriptionStatusBadge
              subscription={subscription}
              onOpenRenewal={() => setIsRenewalModalOpen(true)}
              isSuperAdmin={true}
            />
          )}

          {/* Davetech ERP Branding Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-700/80 border border-blue-500 text-xs font-semibold text-blue-100">
            <span className="w-2 h-2 rounded-full bg-emerald-300"></span>
            <span>Davetech ERP</span>
          </div>

          <div className="hidden sm:block h-4 w-px bg-blue-500" />

          {/* Website Button */}
          <Button
            variant="outline"
            size="sm"
            icon={<Globe className="w-3.5 h-3.5 text-blue-200" />}
            onClick={onOpenPublicSite}
            className="text-xs font-semibold border-blue-500 bg-blue-700/80 hover:bg-blue-700 text-white px-2.5 sm:px-3 transition-colors shadow-xs"
          >
            Website
          </Button>

          <div className="hidden sm:block h-4 w-px bg-blue-500" />

          {/* SaaS Admin Button */}
          <button
            type="button"
            onClick={() => {
              if (activeRole !== 'SUPER_ADMIN') {
                switchRole('SUPER_ADMIN');
              }
              onNavigate('SUPER_ADMIN');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
              activeRole === 'SUPER_ADMIN'
                ? 'bg-white border-white text-blue-900 shadow-sm font-bold'
                : 'bg-blue-700/90 border-blue-500 text-white hover:bg-blue-700'
            }`}
            title="SaaS Platform Admin"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            <span>SaaS Admin</span>
          </button>

          {/* Demo Role View Selector */}
          <div className="flex items-center bg-blue-700/80 pl-2 pr-1 py-1 rounded-xl border border-blue-500">
            <select
              value={activeRole}
              onChange={(e) => {
                const role = e.target.value as UserRole;
                switchRole(role);
                if (role === 'TEACHER') onNavigate('TEACHER_PORTAL');
                else if (role === 'PARENT') onNavigate('PARENT_PORTAL');
                else if (role === 'STUDENT') onNavigate('STUDENT_PORTAL');
                else if (role === 'SUPER_ADMIN') onNavigate('SUPER_ADMIN');
                else onNavigate('DASHBOARD');
              }}
              className="text-xs font-semibold text-white bg-transparent border-0 focus:ring-0 cursor-pointer pr-2 [&>option]:text-slate-900 [&>option]:bg-white"
              aria-label="Demo View Switcher"
            >
              <option value="ADMIN">Admin View</option>
              <option value="TEACHER">Teacher View</option>
              <option value="PARENT">Parent View</option>
              <option value="STUDENT">Learner View</option>
              <option value="SUPER_ADMIN">SaaS Admin</option>
            </select>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex flex-col lg:flex-row bg-white min-h-[calc(100vh-4rem)]">
        {/* Sidebar - Clean White Theme */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 bg-white text-slate-700 border-r border-slate-200 shadow-xl transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto flex flex-col ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Mobile Sidebar Close */}
          <div className="lg:hidden p-4 border-b border-slate-200 flex items-center justify-between bg-white">
            <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">ERP Navigation</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3.5 space-y-5 custom-scrollbar bg-white">
            {/* Quick Portals Links */}
            <div className="bg-slate-50 p-2 rounded-2xl border border-slate-200 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-1 block">
                Workspaces
              </span>
              <div className="grid grid-cols-4 gap-1 text-[10px] font-bold">
                <button
                  onClick={() => {
                    onNavigate('TEACHER_PORTAL');
                    setSidebarOpen(false);
                  }}
                  className={`p-1.5 rounded-xl text-center cursor-pointer transition-colors ${
                    activeView === 'TEACHER_PORTAL'
                      ? 'bg-blue-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  Teacher
                </button>
                <button
                  onClick={() => {
                    onNavigate('PARENT_PORTAL');
                    setSidebarOpen(false);
                  }}
                  className={`p-1.5 rounded-xl text-center cursor-pointer transition-colors ${
                    activeView === 'PARENT_PORTAL'
                      ? 'bg-blue-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  Parent
                </button>
                <button
                  onClick={() => {
                    onNavigate('STUDENT_PORTAL');
                    setSidebarOpen(false);
                  }}
                  className={`p-1.5 rounded-xl text-center cursor-pointer transition-colors ${
                    activeView === 'STUDENT_PORTAL'
                      ? 'bg-blue-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  Learner
                </button>
                <button
                  onClick={() => {
                    onOpenPublicSite();
                    setSidebarOpen(false);
                  }}
                  className="p-1.5 rounded-xl text-center cursor-pointer transition-colors bg-white text-blue-700 hover:bg-blue-50 font-semibold border border-slate-200 shadow-xs"
                  title="View Public Website"
                >
                  Website
                </button>
              </div>
            </div>

            {/* Admin Modules Navigation */}
            {navSections.map((sec, idx) => (
              <div key={idx} className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 block">
                  {sec.title}
                </span>
                <div className="space-y-0.5 pt-0.5">
                  {sec.items.map((item) => {
                    const isActive = activeView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          if (item.id === 'PUBLIC') {
                            onOpenPublicSite();
                          } else {
                            onNavigate(item.id);
                          }
                          setSidebarOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                          isActive
                            ? 'bg-blue-600 text-white font-semibold shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={isActive ? 'text-white' : 'text-slate-500'}>{item.icon}</span>
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                              isActive
                                ? 'bg-white text-blue-900'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar Footer */}
          <div className="p-3.5 border-t border-slate-200 bg-white text-center text-[10px] text-slate-500 font-medium">
            Kenyan CBC Framework • Davetech ERP
          </div>
        </aside>

        {/* Backdrop for Mobile */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-xs lg:hidden"
          />
        )}

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7 bg-white">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <SubscriptionRenewalModal
        isOpen={isRenewalModalOpen}
        onClose={() => setIsRenewalModalOpen(false)}
        subscription={subscription}
        onSubscriptionUpdated={(newConfig) => setSubscription(newConfig)}
        schoolName={school?.name || 'Primary School ERP'}
      />
    </div>
  );
};
