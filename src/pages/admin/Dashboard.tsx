import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { studentService } from '../../services/studentService';
import { feeService } from '../../services/feeAndPaymentService';
import { attendanceService } from '../../services/assessmentAndAttendanceService';
import { operationsService } from '../../services/operationsService';
import { schoolService, DEFAULT_SCHOOL_ID } from '../../services/schoolService';
import {
  Student,
  Invoice,
  Payment,
  AttendanceRecord,
  Announcement,
  SchoolEvent,
  School,
  GradeLevel,
} from '../../types';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  Users,
  DollarSign,
  CalendarCheck,
  TrendingUp,
  UserPlus,
  Receipt,
  Megaphone,
  Calendar,
  RefreshCw,
  Sparkles,
  ChevronRight,
  Inbox,
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (view: string) => void;
}

const CBC_GRADE_LEVELS: GradeLevel[] = [
  'Playgroup',
  'PP1',
  'PP2',
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'Grade 7',
  'Grade 8',
  'Grade 9',
];

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { school, user } = useAuth();
  const tenantId = user?.schoolId || school?.id || DEFAULT_SCHOOL_ID;

  const [tenantSchool, setTenantSchool] = useState<School | null>(school);
  const [students, setStudents] = useState<Student[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadDashboardData = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const todayDateStr = new Date().toISOString().split('T')[0];

      // All queries scoped strictly to tenantId
      const [
        schoolData,
        stdList,
        invList,
        payList,
        attList,
        annList,
        evtList,
      ] = await Promise.all([
        schoolService.getSchool(tenantId),
        studentService.getStudents(tenantId),
        feeService.getInvoices(tenantId),
        feeService.getPayments(tenantId),
        attendanceService.getAttendanceRecords(tenantId, { date: todayDateStr }),
        operationsService.getAnnouncements(tenantId),
        operationsService.getEvents(tenantId),
      ]);

      if (schoolData) {
        setTenantSchool(schoolData);
      }
      setStudents(stdList || []);
      setInvoices(invList || []);
      setPayments(payList || []);
      setTodayAttendance(attList || []);
      setAnnouncements(annList || []);
      setEvents(evtList || []);
    } catch (e) {
      console.error('Error loading dashboard data from Firestore:', e);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Dynamic school settings loaded from tenant configuration
  const activeSchool = tenantSchool || school;
  const rawSchoolName = activeSchool?.name;
  const schoolName =
    rawSchoolName &&
    rawSchoolName !== 'Davetech Primary School' &&
    rawSchoolName !== 'New Primary School' &&
    rawSchoolName !== 'Primary School ERP'
      ? rawSchoolName
      : 'Davetech School ERP';
  const schoolLogo = activeSchool?.logoUrl;
  const academicYear = activeSchool?.academicYear || '2026';
  const currentTerm = activeSchool?.currentTerm || 'Term 1';
  const welcomeMessage =
    activeSchool?.welcomeMessage ||
    'Welcome to the Central Administration & ERP Hub. Manage Playgroup through Grade 9 CBC assessments, student roll-call, term fees, POS sales, and communications in real-time.';
  const currencySymbol = activeSchool?.currencySymbol || school?.currencySymbol || 'KSh';

  // 1. Enrollment Metrics calculated from actual learners
  const totalStudents = students.length;
  const boysCount = useMemo(() => students.filter((s) => s.gender === 'MALE').length, [students]);
  const girlsCount = useMemo(() => students.filter((s) => s.gender === 'FEMALE').length, [students]);

  // 2. Fee Collection & Outstanding calculated from actual invoices & payments
  const totalBilled = useMemo(
    () => invoices.reduce((s, i) => s + (Number(i.totalAmount) || 0), 0),
    [invoices]
  );
  const totalCollected = useMemo(
    () => payments.reduce((s, p) => s + (Number(p.amount) || 0), 0),
    [payments]
  );
  const unpaidInvoices = useMemo(
    () => invoices.filter((i) => (Number(i.balance) || 0) > 0),
    [invoices]
  );
  const outstandingBalance = useMemo(
    () => unpaidInvoices.reduce((s, i) => s + (Number(i.balance) || 0), 0),
    [unpaidInvoices]
  );
  const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

  // 3. Today's Attendance calculated from today's attendance records
  let todayTotalLogged = 0;
  let todayPresent = 0;
  let todayAbsent = 0;

  todayAttendance.forEach((rec) => {
    (rec.entries || []).forEach((entry) => {
      todayTotalLogged++;
      if (entry.status === 'PRESENT' || entry.status === 'LATE') {
        todayPresent++;
      } else if (entry.status === 'ABSENT' || entry.status === 'SICK') {
        todayAbsent++;
      }
    });
  });

  const attendanceValue =
    todayTotalLogged === 0
      ? 'No data yet'
      : `${((todayPresent / todayTotalLogged) * 100).toFixed(1)}%`;

  const attendanceSubtitle =
    todayTotalLogged === 0
      ? 'No roll-call taken today'
      : `${todayAbsent} absent · ${todayTotalLogged} logged`;

  // 4. Enrollment by Grade Level breakdown calculated from learners
  const gradeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    students.forEach((s) => {
      if (s.currentClass) {
        counts[s.currentClass] = (counts[s.currentClass] || 0) + 1;
      }
    });
    return counts;
  }, [students]);

  // Format event date helper for calendar tiles
  const formatEventDate = (dateStr?: string) => {
    if (!dateStr) return { month: 'TBD', day: '--' };
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return { month: dateStr.slice(0, 3).toUpperCase(), day: '·' };
      const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
      const day = d.getDate().toString();
      return { month, day };
    } catch {
      return { month: 'EVT', day: '·' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner - Compact & Premium Executive Theme */}
      <div className="relative bg-gradient-to-r from-[#0d1b3e] via-[#152554] to-[#1e1b4b] rounded-2xl p-5 sm:p-6 text-white border border-blue-900/60 shadow-[0_4px_20px_rgba(15,23,42,0.12)] overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-72 h-72 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -mb-8 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            {/* Metadata row */}
            <div className="inline-flex items-center gap-2 text-xs font-medium text-blue-200/90">
              <span className="flex items-center gap-1.5 text-amber-300 font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                Academic Year {academicYear}
              </span>
              <span className="text-blue-300/40">·</span>
              <span>{currentTerm}</span>
              <span className="text-blue-300/40">·</span>
              <span className="text-blue-200/80">Playgroup to Grade 9 CBC</span>
            </div>

            {/* Title & Logo */}
            <div className="flex items-center gap-3">
              {schoolLogo ? (
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white border border-white/20 p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                  <img
                    src={schoolLogo}
                    alt={schoolName}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : null}
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
                  {schoolName}
                </h1>
                {activeSchool?.motto && (
                  <p className="text-xs text-blue-200/80 font-normal italic">
                    "{activeSchool.motto}"
                  </p>
                )}
              </div>
            </div>

            {/* Compact Welcome summary */}
            <p className="text-xs sm:text-sm text-blue-100/75 leading-relaxed pt-0.5 line-clamp-2">
              {welcomeMessage}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0">
            <Button
              variant="secondary"
              size="sm"
              icon={<UserPlus className="w-4 h-4" />}
              onClick={() => onNavigate('STUDENTS')}
              className="text-xs font-semibold shadow-xs"
            >
              Add Student
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-white/10 hover:bg-white/15 text-white border-white/20 text-xs font-medium transition-colors"
              icon={<Receipt className="w-4 h-4 text-emerald-300" />}
              onClick={() => onNavigate('FEES')}
            >
              Collect Fees
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-white/10 hover:bg-white/15 text-white border-white/20 text-xs font-medium transition-colors"
              icon={<CalendarCheck className="w-4 h-4 text-sky-300" />}
              onClick={() => onNavigate('ATTENDANCE')}
            >
              Roll Call
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-white/10 hover:bg-white/15 text-white border-white/20 text-xs font-medium transition-colors"
              icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-300' : 'text-slate-300'}`} />}
              onClick={loadDashboardData}
              disabled={loading}
              title="Refresh dashboard data from Firestore"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid - Modern SaaS Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Enrollment */}
        <StatCard
          title="Total Enrollment"
          value={totalStudents === 0 ? 0 : totalStudents.toLocaleString()}
          subtitle={
            totalStudents === 0
              ? 'No learners enrolled yet'
              : `${boysCount} Boys · ${girlsCount} Girls`
          }
          icon={<Users className="w-5 h-5 text-blue-600" />}
          color="blue"
        />

        {/* 2. Fee Collection */}
        <StatCard
          title="Fee Collection"
          value={
            payments.length === 0 && invoices.length === 0
              ? `${currencySymbol} 0`
              : `${currencySymbol} ${totalCollected.toLocaleString()}`
          }
          subtitle={
            invoices.length === 0
              ? 'No invoices billed yet'
              : `${collectionRate}% of term budget (${currencySymbol} ${totalBilled.toLocaleString()} billed)`
          }
          icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
          color="emerald"
          trend={
            totalBilled > 0
              ? { value: `${collectionRate}%`, isPositive: collectionRate >= 50 }
              : undefined
          }
        />

        {/* 3. Outstanding Balance */}
        <StatCard
          title="Outstanding Balance"
          value={
            invoices.length === 0
              ? `${currencySymbol} 0`
              : `${currencySymbol} ${outstandingBalance.toLocaleString()}`
          }
          subtitle={
            invoices.length === 0
              ? 'No invoices billed yet'
              : unpaidInvoices.length === 0
              ? 'All invoices fully settled'
              : `${unpaidInvoices.length} unpaid invoice${unpaidInvoices.length === 1 ? '' : 's'}`
          }
          icon={<TrendingUp className="w-5 h-5 text-rose-600" />}
          color="rose"
        />

        {/* 4. Today's Attendance */}
        <StatCard
          title="Today's Attendance"
          value={attendanceValue}
          subtitle={attendanceSubtitle}
          icon={<CalendarCheck className="w-5 h-5 text-indigo-600" />}
          color="indigo"
        />
      </div>

      {/* Main Grid: Enrollment Breakdown & Recent Payments (Left 2 cols) / Notices & Events (Right 1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Enrollment by Level & Recent Fee Payments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Enrollment by Level */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base tracking-tight">
                  Enrollment by Grade Level
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {totalStudents === 0
                    ? 'No learners enrolled yet'
                    : `${totalStudents} learners active across Playgroup to Grade 9`}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('STUDENTS')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                View Roster
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3">
              {CBC_GRADE_LEVELS.map((lvl) => {
                const count = gradeCounts[lvl] || 0;
                const percentage =
                  totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0;

                return (
                  <div
                    key={lvl}
                    className="group p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 hover:border-blue-300 hover:bg-blue-50/30 transition-all duration-150"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-600 group-hover:text-blue-900 transition-colors truncate">
                        {lvl}
                      </span>
                      {count > 0 && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          {percentage}%
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 flex items-baseline gap-1">
                      <span className="text-lg font-bold text-slate-900 font-sans tracking-tight">
                        {count}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {count === 1 ? 'learner' : 'learners'}
                      </span>
                    </div>

                    {/* Miniature relative capacity bar */}
                    <div className="w-full bg-slate-200/60 rounded-full h-1 mt-2 overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, percentage * 2.5 || (count > 0 ? 15 : 0))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Invoices & Payments */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base tracking-tight">
                  Recent Fee Payments
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verified receipt ledger from Firestore
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate('FEES')}
                className="text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                Manage Fees
              </Button>
            </div>

            {payments.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Inbox className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium text-slate-500">
                  No payment transactions recorded yet.
                </p>
                <p className="text-[11px] text-slate-400">
                  Record tuition and fee receipts under the Fee Management module.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-5 sm:-mx-6">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 text-slate-500 font-semibold border-y border-slate-200/80 text-[11px] uppercase tracking-wider">
                      <th className="py-2.5 px-4 sm:px-6">Receipt No</th>
                      <th className="py-2.5 px-4">Learner Name</th>
                      <th className="py-2.5 px-4">Payment Method</th>
                      <th className="py-2.5 px-4">Amount</th>
                      <th className="py-2.5 px-4 sm:px-6 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payments.slice(0, 5).map((pay) => (
                      <tr key={pay.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="py-3 px-4 sm:px-6 font-mono font-semibold text-slate-900">
                          {pay.receiptNumber}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">
                          {pay.studentName}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-emerald-700">
                            {pay.paymentMethod}
                          </span>
                          {pay.transactionReference && (
                            <span className="text-[10px] text-slate-400 font-mono block">
                              {pay.transactionReference}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900 font-sans">
                          {currencySymbol} {pay.amount.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 sm:px-6 text-right text-slate-500 font-medium">
                          {new Date(pay.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 span): Announcements & School Events */}
        <div className="space-y-6">
          {/* Announcements Card */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                  <Megaphone className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm tracking-tight">
                  Notice Board
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('COMMUNICATION')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2"
              >
                View All
              </Button>
            </div>

            <div className="space-y-3">
              {announcements.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <Megaphone className="w-6 h-6 mx-auto mb-1.5 text-slate-300" />
                  No active notices posted yet.
                </div>
              ) : (
                announcements.slice(0, 3).map((ann) => (
                  <div
                    key={ann.id}
                    className={`p-3.5 rounded-xl border transition-colors ${
                      ann.priority === 'HIGH'
                        ? 'bg-rose-50/40 border-rose-200/80 border-l-4 border-l-rose-500'
                        : 'bg-slate-50/70 border-slate-200/80 border-l-4 border-l-blue-500'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs text-slate-900 line-clamp-1">
                        {ann.title}
                      </span>
                      <Badge
                        variant={ann.priority === 'HIGH' ? 'danger' : 'info'}
                        size="sm"
                        className="text-[9px] uppercase font-bold"
                      >
                        {ann.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mt-1">
                      {ann.content}
                    </p>
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-200/40 text-[10px] text-slate-400">
                      <span>By {ann.publishedBy || 'Administration'}</span>
                      {ann.createdAt && (
                        <span>{new Date(ann.createdAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Upcoming School Events */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm tracking-tight">
                  Upcoming Events
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('COMMUNICATION')}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 px-2"
              >
                Calendar
              </Button>
            </div>

            <div className="space-y-3">
              {events.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <Calendar className="w-6 h-6 mx-auto mb-1.5 text-slate-300" />
                  No upcoming events scheduled yet.
                </div>
              ) : (
                events.slice(0, 3).map((evt) => {
                  const { month, day } = formatEventDate(evt.date);
                  return (
                    <div
                      key={evt.id}
                      className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 flex items-start gap-3 hover:border-emerald-200 transition-colors"
                    >
                      {/* Calendar date tile */}
                      <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col items-center justify-center shrink-0">
                        <span className="text-[9px] font-bold text-emerald-700 uppercase leading-none">
                          {month}
                        </span>
                        <span className="text-sm font-extrabold text-slate-900 leading-none mt-0.5 font-sans">
                          {day}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-xs text-slate-900 truncate">
                            {evt.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-normal">
                          {evt.description}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
