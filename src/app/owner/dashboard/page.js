'use client';

import { useSession, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { toNepaliDate } from '@/lib/nepaliDate';
import {
  UsersIcon,
  AcademicCapIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  SparklesIcon,
  BookOpenIcon,
  WalletIcon,
  ClockIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  BuildingLibraryIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

function StatCard({ icon: Icon, title, value, subtitle, color }) {
  const colorMap = {
    blue: { bg: 'from-blue-500/10 to-blue-600/5', icon: 'text-blue-600' },
    indigo: { bg: 'from-indigo-500/10 to-indigo-600/5', icon: 'text-indigo-600' },
    emerald: { bg: 'from-emerald-500/10 to-emerald-600/5', icon: 'text-emerald-600' },
    amber: { bg: 'from-amber-500/10 to-amber-600/5', icon: 'text-amber-600' },
    rose: { bg: 'from-rose-500/10 to-rose-600/5', icon: 'text-rose-600' },
    violet: { bg: 'from-violet-500/10 to-violet-600/5', icon: 'text-violet-600' },
  };
  const c = colorMap[color] || colorMap.blue;
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/50">
      <div className="flex items-start justify-between">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${c.bg} ${c.icon}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
      <h3 className="mt-1 text-2xl font-extrabold text-slate-900">{value}</h3>
      {subtitle && <p className="mt-1 text-[11px] text-slate-400">{subtitle}</p>}
    </div>
  );
}

function RadialProgress({ pct, size = 48, stroke = 4, color = '#3b82f6' }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <span className="absolute text-[10px] font-bold text-slate-700">{pct}%</span>
    </div>
  );
}

function GradeClassCard({ grade, count, totalFee, totalPaid, totalDue, avgAttendance, index }) {
  const colors = ['from-blue-500 to-blue-600', 'from-indigo-500 to-indigo-600', 'from-emerald-500 to-emerald-600', 'from-amber-500 to-amber-600', 'from-violet-500 to-violet-600', 'from-rose-500 to-rose-600', 'from-cyan-500 to-cyan-600', 'from-purple-500 to-purple-600'];
  const feePct = totalFee > 0 ? Math.round((totalPaid / totalFee) * 100) : 0;
  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${colors[index % colors.length]}`} />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/images/logo.png" alt="School" className="h-8 w-8 rounded-lg object-contain" />
          <div>
            <p className="text-sm font-bold text-slate-900">{grade}</p>
            <p className="text-[10px] text-slate-400">{count} student{count !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${avgAttendance >= 80 ? 'bg-emerald-50 text-emerald-600' : avgAttendance >= 60 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-500'}`}>
          {avgAttendance}%
        </span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-50 pt-3 text-[10px]">
        <div>
          <p className="text-slate-400">Fee Collected</p>
          <p className="font-bold text-slate-900">{feePct}%</p>
          <div className="mt-1 h-1 rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${feePct}%` }} />
          </div>
        </div>
        <div>
          <p className="text-slate-400">Paid</p>
          <p className="font-bold text-emerald-600">Rs {totalPaid.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-slate-400">Due</p>
          <p className="font-bold text-amber-600">Rs {totalDue.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({ icon: Icon, label, desc, gradient, onClick }) {
  const gradMap = {
    blue: 'from-blue-500 to-blue-600',
    indigo: 'from-indigo-500 to-indigo-600',
    emerald: 'from-emerald-500 to-emerald-600',
    amber: 'from-amber-500 to-amber-600',
    violet: 'from-violet-500 to-violet-600',
    rose: 'from-rose-500 to-rose-600',
  };
  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradMap[gradient] || gradMap.blue} translate-y-full opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100`} />
      <div className="relative z-10">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${gradMap[gradient] || gradMap.blue} text-white shadow-sm transition-transform duration-300 group-hover:scale-110`}>
          <Icon className="h-5 w-5" />
        </div>
        <p className="mt-3 text-sm font-bold text-slate-900 transition-colors duration-300 group-hover:text-white">{label}</p>
        <p className="mt-0.5 text-xs text-slate-400 transition-colors duration-300 group-hover:text-white/80">{desc}</p>
      </div>
    </button>
  );
}

function ActivityItem({ icon: Icon, bg, title, desc, time }) {
  return (
    <div className="flex items-start gap-3 border-b border-slate-50 pb-3 last:border-0 last:pb-0">
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${bg}`}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <p className="mt-0.5 truncate text-xs text-slate-400">{desc}</p>
      </div>
      <span className="shrink-0 text-[10px] font-medium text-slate-400">{time}</span>
    </div>
  );
}

function MiniStat({ label, value, icon: Icon }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 backdrop-blur-sm">
      <Icon className="h-4 w-4 text-white/60" />
      <div>
        <p className="text-[10px] font-medium text-white/50">{label}</p>
        <p className="text-sm font-bold text-white">{value}</p>
      </div>
    </div>
  );
}

export default function OwnerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [now, setNow] = useState('');
  const [stats, setStats] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [greeting, setGreeting] = useState('');
  const sessionKicked = useRef(false);

  // Force session fetch on mount to avoid getting stuck in 'loading' on back-nav
  useEffect(() => {
    if (!sessionKicked.current) {
      sessionKicked.current = true;
      getSession();
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
    if (status === 'authenticated' && session?.user?.role !== 'OWNER') router.replace('/login');
  }, [status, session, router]);

  useEffect(() => {
    const tick = () => {
      setNow(toNepaliDate(new Date()));
      const h = new Date().getHours();
      if (h < 12) setGreeting('Good Morning');
      else if (h < 17) setGreeting('Good Afternoon');
      else setGreeting('Good Evening');
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/owner/stats')
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(() => {});
    fetch('/api/system-health')
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data) => setSystemHealth(data))
      .catch(() => {});
  }, [status]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-[3px] border-blue-600 border-t-transparent" />
          <p className="mt-4 text-sm font-medium text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const s = stats || {};
  const students = s.students ?? 0;
  const teachers = s.teachers ?? 0;
  const revenue = s.revenue ?? 0;
  const attendance = s.attendance ?? 0;
  const totalFee = s.totalFee ?? 0;
  const totalPaid = s.totalPaid ?? 0;
  const totalDue = s.totalDue ?? 0;
  const feeCollectedPct = totalFee > 0 ? Math.round((totalPaid / totalFee) * 100) : 0;
  const gradeDistribution = s.gradeDistribution || [];

  const statCards = [
    { title: 'Total Students', value: students.toLocaleString(), subtitle: `Across ${gradeDistribution.length} grades`, icon: UsersIcon, color: 'blue' },
    { title: 'Total Teachers', value: teachers.toLocaleString(), subtitle: 'Active staff', icon: AcademicCapIcon, color: 'indigo' },
    { title: 'Revenue Collected', value: `Rs ${revenue.toLocaleString()}`, subtitle: `Rs ${totalPaid.toLocaleString()} collected`, icon: WalletIcon, color: 'emerald' },
    { title: 'Avg Attendance', value: `${attendance}%`, subtitle: 'Last 30 days', icon: ChartBarIcon, color: 'amber' },
  ];

  const recentStudents = (s.recentStudents || []).slice(0, 3);
  const recentPayments = (s.recentPayments || []).slice(0, 3);
  const recentTeachers = (s.recentTeachers || []).slice(0, 2);

  const activities = [];
  recentStudents.forEach((st) => {
    activities.push({
      icon: UserGroupIcon, bg: 'bg-blue-500',
      title: 'New Enrollment', desc: `${st.name} joined Grade ${st.grade || st.class}`,
      time: new Date(st.createdAt).toLocaleDateString(),
    });
  });
  recentPayments.forEach((p) => {
    activities.push({
      icon: BanknotesIcon, bg: 'bg-emerald-500',
      title: 'Payment Received', desc: `Rs ${p.amount?.toLocaleString()} from ${p.studentId?.name || 'Student'}`,
      time: new Date(p.date).toLocaleDateString(),
    });
  });
  recentTeachers.forEach((t) => {
    activities.push({
      icon: AcademicCapIcon, bg: 'bg-indigo-500',
      title: 'Teacher Onboarded', desc: `${t.name} joined the staff`,
      time: new Date(t.createdAt).toLocaleDateString(),
    });
  });

  const quickActions = [
    { icon: UserGroupIcon, label: 'Add Student', desc: 'Register a new student', gradient: 'blue', onClick: () => router.push('/owner/students') },
    { icon: AcademicCapIcon, label: 'Add Teacher', desc: 'Onboard staff member', gradient: 'indigo', onClick: () => router.push('/owner/teachers') },
    { icon: BanknotesIcon, label: 'Collect Fees', desc: 'Record a payment', gradient: 'emerald', onClick: () => router.push('/owner/fees') },
    { icon: ClipboardDocumentListIcon, label: 'Manage Exams', desc: 'Create & publish', gradient: 'amber', onClick: () => router.push('/owner/exams') },
    { icon: CalendarDaysIcon, label: 'Attendance', desc: 'Track daily records', gradient: 'violet', onClick: () => router.push('/owner/attendance') },
    { icon: ChartBarIcon, label: 'Reports', desc: 'Analytics & insights', gradient: 'rose', onClick: () => router.push('/owner/reports') },
  ];

  const name = session?.user?.name?.split(' ')[0] ?? 'Administrator';
  const totalClasses = gradeDistribution.length;
  const totalGrades = [...new Set(gradeDistribution.map(g => g.grade))].length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">

        {/* ─── Welcome Hero ─── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 sm:p-8 shadow-xl">
          <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute -bottom-6 -right-6 h-32 w-32 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="absolute right-1/4 top-0 h-px w-32 bg-gradient-to-r from-transparent via-blue-400/20 to-transparent" />
          <div className="relative z-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium text-white/80 backdrop-blur-sm">
                  <SparklesIcon className="h-3.5 w-3.5 text-yellow-400" />
                  {greeting}, {name}!
                </div>
                <h2 className="text-2xl font-black text-white sm:text-3xl">School Overview</h2>
                <p className="mt-1 max-w-xl text-sm text-slate-400">
                  Managing <span className="font-semibold text-white">{students} students</span> across <span className="font-semibold text-white">{totalGrades} grades</span> with <span className="font-semibold text-white">{teachers} teachers</span>.
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <MiniStat label="Date" value={now} icon={CalendarDaysIcon} />
                <MiniStat label="Students" value={students} icon={UsersIcon} />
                <MiniStat label="Revenue" value={`Rs ${revenue.toLocaleString()}`} icon={CurrencyDollarIcon} />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1"><ShieldCheckIcon className="h-3.5 w-3.5 text-emerald-400" /> All systems operational</span>
              <span className="flex items-center gap-1"><GlobeAltIcon className="h-3.5 w-3.5 text-blue-400" /> Nepal</span>
            </div>
          </div>
        </div>

        {/* ─── KPI Cards ─── */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((s) => <StatCard key={s.title} {...s} />)}
        </section>

        {/* ─── Classes Overview ─── */}
        {gradeDistribution.length > 0 && (
          <section>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BuildingLibraryIcon className="h-5 w-5 text-slate-600" />
                <h2 className="text-base font-bold text-slate-900">Classes Overview</h2>
              </div>
              <span className="text-[11px] font-medium text-slate-400">{gradeDistribution.length} classes</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {gradeDistribution.map((g, i) => (
                <GradeClassCard key={g.grade} {...g} index={i} />
              ))}
            </div>
          </section>
        )}

        {/* ─── Middle Row: Fee Chart + Attendance + Financial Summary ─── */}
        <div className="grid gap-5 lg:grid-cols-3">

          {/* Fee Collection */}
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Fee Collection</h3>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600">{feeCollectedPct}% collected</span>
            </div>
            <div className="mt-6 flex items-center justify-center">
              <RadialProgress pct={feeCollectedPct} size={100} stroke={8} color="#10b981" />
            </div>
            <div className="mt-5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Total Fee</span>
                <span className="font-semibold text-slate-900">Rs {totalFee.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Collected</span>
                <span className="font-semibold text-emerald-600">Rs {totalPaid.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Pending</span>
                <span className="font-semibold text-amber-600">Rs {totalDue.toLocaleString()}</span>
              </div>
              <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-blue-700">
                <CheckCircleIcon className="h-3.5 w-3.5" />
                <span className="font-semibold">{gradeDistribution.filter(g => g.totalFee > 0 && (g.totalPaid / g.totalFee) >= 0.9).length} classes at {'>'}90% collection</span>
              </div>
            </div>
          </div>

          {/* Attendance Overview */}
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Attendance Overview</h3>
              <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-600">
                {attendance >= 80 ? 'Good' : attendance >= 60 ? 'Average' : 'Needs Improvement'}
              </span>
            </div>
            <div className="mt-6 flex items-center justify-center">
              <RadialProgress pct={attendance} size={100} stroke={8} color={attendance >= 80 ? '#10b981' : attendance >= 60 ? '#f59e0b' : '#ef4444'} />
            </div>
            <div className="mt-5 flex items-center justify-center gap-6 text-xs">
              <div className="text-center">
                <p className="text-2xl font-extrabold text-slate-900">{students}</p>
                <p className="text-slate-400">Total Students</p>
              </div>
              <div className="h-10 w-px bg-slate-100" />
              <div className="text-center">
                <p className="text-2xl font-extrabold text-slate-900">{attendance}%</p>
                <p className="text-slate-400">Avg Attendance</p>
              </div>
            </div>
            {gradeDistribution.length > 0 && (
              <div className="mt-4 border-t border-slate-50 pt-3">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">By Grade</p>
                <div className="space-y-1.5">
                  {gradeDistribution.slice(0, 5).map((g) => (
                    <div key={g.grade} className="flex items-center gap-2 text-[10px]">
                      <span className="w-10 font-medium text-slate-600"> {g.grade}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-slate-100">
                        <div className={`h-full rounded-full ${g.avgAttendance >= 80 ? 'bg-emerald-500' : g.avgAttendance >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${g.avgAttendance}%` }} />
                      </div>
                      <span className="w-8 text-right font-semibold text-slate-700">{g.avgAttendance}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Financial Summary */}
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Financial Summary</h3>
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-600">Current</span>
            </div>
            <div className="mt-6 space-y-4">
              <div>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">Collection Rate</span>
                  <span className="text-slate-400">{feeCollectedPct}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-emerald-500 transition-all duration-1000" style={{ width: `${feeCollectedPct}%` }} />
                </div>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">Pending Ratio</span>
                  <span className="text-slate-400">{totalFee > 0 ? Math.round((totalDue / totalFee) * 100) : 0}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-amber-500 transition-all duration-1000" style={{ width: `${totalFee > 0 ? (totalDue / totalFee) * 100 : 0}%` }} />
                </div>
              </div>
              <div className="rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 p-3">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total Revenue</p>
                    <p className="text-base font-extrabold text-slate-900">Rs {revenue.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Outstanding</p>
                    <p className="text-base font-extrabold text-amber-600">Rs {totalDue.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Quick Actions ─── */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <BookOpenIcon className="h-5 w-5 text-slate-600" />
            <h2 className="text-base font-bold text-slate-900">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {quickActions.map((q) => <QuickActionCard key={q.label} {...q} />)}
          </div>
        </section>

        {/* ─── Bottom Grid: Activity + System Health ─── */}
        <div className="grid gap-5 lg:grid-cols-5">

          {/* Recent Activity */}
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 lg:col-span-3">
            <div className="mb-4 flex items-center gap-2">
              <ClockIcon className="h-4 w-4 text-slate-500" />
              <h2 className="text-sm font-bold text-slate-900">Recent Activity</h2>
              {activities.length > 0 && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">{activities.length}</span>}
            </div>
            {activities.length > 0 ? (
              <div className="space-y-3">
                {activities.map((a, i) => <ActivityItem key={i} {...a} />)}
              </div>
            ) : (
              <p className="py-8 text-center text-xs text-slate-400">No recent activity to display.</p>
            )}
          </div>

          {/* System Health */}
          <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-5 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">System Health</h2>
              <ShieldCheckIcon className={`h-4 w-4 ${systemHealth?.database === 'connected' ? 'text-emerald-400' : 'text-red-400'}`} />
            </div>
            <p className="mb-5 text-[11px] text-slate-400">Live metrics from server</p>
            <div className="space-y-4">
              {(() => {
                const items = systemHealth ? [
                  { label: 'CPU', pct: systemHealth.cpu, color: (systemHealth.cpu > 80) ? 'bg-red-500' : (systemHealth.cpu > 50) ? 'bg-amber-500' : 'bg-blue-500' },
                  { label: 'Memory', pct: systemHealth.memory, color: (systemHealth.memory > 80) ? 'bg-red-500' : (systemHealth.memory > 50) ? 'bg-amber-500' : 'bg-emerald-500' },
                  { label: 'Heap', pct: systemHealth.heap, color: (systemHealth.heap > 80) ? 'bg-red-500' : (systemHealth.heap > 50) ? 'bg-amber-500' : 'bg-violet-500' },
                ] : [
                  { label: 'CPU', pct: 0, color: 'bg-slate-600' },
                  { label: 'Memory', pct: 0, color: 'bg-slate-600' },
                  { label: 'Heap', pct: 0, color: 'bg-slate-600' },
                ];
                return items.map(({ label, pct, color }) => (
                  <div key={label}>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-300">{label}</span>
                      <span className="font-bold text-white">{pct}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-700">
                      <div className={`h-full ${color} rounded-full transition-all duration-1000`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ));
              })()}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <MiniStat label="Uptime" value={systemHealth?.uptime || '--'} icon={ClockIcon} />
              <MiniStat label="Database" value={systemHealth?.database || '--'} icon={GlobeAltIcon} />
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2.5">
              <div className="relative flex h-2 w-2 items-center justify-center">
                <div className={`h-2 w-2 animate-ping rounded-full opacity-75 ${systemHealth?.database === 'connected' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                <div className={`absolute h-2 w-2 rounded-full ${systemHealth?.database === 'connected' ? 'bg-emerald-400' : 'bg-red-400'}`} />
              </div>
              <span className={`text-[11px] font-medium ${systemHealth?.database === 'connected' ? 'text-emerald-400' : 'text-red-400'}`}>
                {systemHealth ? (systemHealth.database === 'connected' ? 'All systems operational' : 'Database disconnected') : 'Loading...'}
              </span>
            </div>
          </div>
        </div>

        {/* ─── Footer Stats ─── */}
        <div className="rounded-2xl border border-slate-100 bg-white/60 p-4 backdrop-blur-sm">
          <div className="grid grid-cols-2 gap-4 text-center text-xs sm:grid-cols-4">
            <div>
              <p className="text-lg font-extrabold text-slate-900">{students}</p>
              <p className="text-slate-400">Enrolled Students</p>
            </div>
            <div>
              <p className="text-lg font-extrabold text-slate-900">{teachers}</p>
              <p className="text-slate-400">Active Teachers</p>
            </div>
            <div>
              <p className="text-lg font-extrabold text-slate-900">{students > 0 ? (students / (teachers || 1)).toFixed(1) : 0}</p>
              <p className="text-slate-400">Student/Teacher Ratio</p>
            </div>
            <div>
              <p className="text-lg font-extrabold text-slate-900">{feeCollectedPct}%</p>
              <p className="text-slate-400">Fee Collection Rate</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
