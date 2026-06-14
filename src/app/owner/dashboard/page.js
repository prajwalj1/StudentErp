'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toNepaliDate } from '@/lib/nepaliDate';
import {
  UsersIcon,
  AcademicCapIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

/* ───────────────────────────────────────────────────────────────
   Reusable UI Primitives
─────────────────────────────────────────────────────────────── */
function StatCard({ icon: Icon, title, value, change, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
  };
  const isUp = change >= 0;
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
      <div className="flex items-center justify-between mb-5">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colors[color]} group-hover:scale-110 transition-transform`}>
          <Icon className="w-6 h-6" />
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
          <div className={`w-3.5 h-3.5 ${!isUp ? 'rotate-180' : ''}`} />
          {isUp ? '+' : ''}{change}%
        </span>
      </div>
      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{title}</p>
      <h3 className="text-3xl font-black text-slate-900">{value}</h3>
    </div>
  );
}

function QuickAction({ icon: Icon, label, desc, color, onClick }) {
  const colors = {
    blue: 'from-blue-500 to-blue-700 shadow-blue-200',
    indigo: 'from-indigo-500 to-indigo-700 shadow-indigo-200',
    emerald: 'from-emerald-500 to-emerald-700 shadow-emerald-200',
    amber: 'from-amber-500 to-amber-700 shadow-amber-200',
  };
  return (
    <button
      onClick={onClick}
      className={`bg-gradient-to-br ${colors[color]} text-white p-6 rounded-3xl shadow-xl flex flex-col gap-3 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 text-left w-full`}
    >
      <Icon className="w-7 h-7 opacity-90" />
      <div>
        <p className="font-bold text-sm">{label}</p>
        <p className="text-white/70 text-xs mt-0.5">{desc}</p>
      </div>
    </button>
  );
}

function ActivityRow({ title, desc, time, type }) {
  const dot = {
    student: 'bg-blue-500',
    payment: 'bg-emerald-500',
    result: 'bg-amber-500',
    teacher: 'bg-indigo-500',
  };
  return (
    <div className="flex gap-4 py-4 border-b border-slate-50 last:border-0">
      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${dot[type] || 'bg-slate-400'} animate-pulse`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">{title}</p>
        <p className="text-xs text-slate-400 mt-0.5 truncate">{desc}</p>
      </div>
      <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">{time}</span>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────
   Main Dashboard
─────────────────────────────────────────────────────────────── */
export default function OwnerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [now, setNow] = useState('');
  const [stats, setStats] = useState(null);

  // Auth guard
  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
    if (status === 'authenticated' && session?.user?.role !== 'OWNER') router.replace('/login');
  }, [status, session, router]);

  // Clock
  useEffect(() => {
    const tick = () =>
      setNow(toNepaliDate(new Date()));
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  // Fetch stats (no loading blocker — render immediately)
  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/owner/stats')
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(() => {});
  }, [status]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 font-medium text-sm">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  const statCards = [
    { title: 'Total Students', value: stats?.students?.toLocaleString() ?? '—', change: 12, icon: UsersIcon, color: 'blue' },
    { title: 'Total Teachers', value: stats?.teachers?.toLocaleString() ?? '—', change: 4, icon: AcademicCapIcon, color: 'indigo' },
    { title: 'Revenue (NPR)', value: `Rs ${(stats?.revenue ?? 0).toLocaleString()}`, change: 8, icon: CurrencyDollarIcon, color: 'emerald' },
    { title: 'Avg Attendance', value: `${stats?.attendance ?? 0}%`, change: -2, icon: ChartBarIcon, color: 'amber' },
  ];

  const activities = stats?.recentStudents?.map((s, i) => ({
    title: 'New Student Enrolled',
    desc: `${s.name} joined ${s.grade}`,
    time: 'Recently',
    type: 'student',
  })) ?? [
    { title: 'New Student Registered', desc: 'Aarav Sharma enrolled in Grade 10‑A', time: '2h ago', type: 'student' },
    { title: 'Fee Payment Received', desc: 'NPR 4,500 received from Priya Gupta', time: '5h ago', type: 'payment' },
    { title: 'Result Published', desc: 'Mid‑term results for Grade 8 released', time: '1d ago', type: 'result' },
    { title: 'New Teacher Added', desc: 'Mr. Ram Bahadur joined Science dept', time: '2d ago', type: 'teacher' },
  ];

  return (
    <div className="p-4 sm:p-8 space-y-8">
      {/* Welcome banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-200">
        <div className="relative z-10">
          <p className="text-blue-200 text-sm font-medium mb-1">Good to see you 👋</p>
          <h2 className="text-2xl sm:text-3xl font-black mb-2">
            Welcome back, {session?.user?.name?.split(' ')[0] ?? 'Administrator'}!
          </h2>
          <p className="text-blue-200 text-sm max-w-lg">
            Here's an overview of Everest View Secondary School today.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <CheckCircleIcon className="w-5 h-5 text-emerald-400" />
            <span className="text-sm text-blue-100 font-medium">All systems operational</span>
            <span className="text-blue-300 text-xs flex items-center gap-1">
              <ClockIcon className="w-3.5 h-3.5" /> Last updated {now}
            </span>
          </div>
        </div>
        {/* Decoration */}
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/5 rounded-full" />
        <div className="absolute -right-4 -bottom-8 w-32 h-32 bg-white/5 rounded-full" />
      </div>

      {/* Stat cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {statCards.map((s) => <StatCard key={s.title} {...s} />)}
      </section>

      {/* Quick actions */}
      <section>
        <h2 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickAction icon={UserGroupIcon} label="Add Student" desc="Register new student" color="blue" onClick={() => router.push('/owner/students')} />
          <QuickAction icon={AcademicCapIcon} label="Add Teacher" desc="Onboard staff" color="indigo" onClick={() => router.push('/owner/teachers')} />
          <QuickAction icon={CurrencyDollarIcon} label="Collect Fees" desc="Record a payment" color="emerald" onClick={() => router.push('/owner/fees')} />
          <QuickAction icon={ClipboardDocumentListIcon} label="Manage Exams" desc="Publish results" color="amber" onClick={() => router.push('/owner/exams')} />
        </div>
      </section>

      {/* Bottom grid: Activity + System Health */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Activity feed */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900">Recent Activity</h2>
            <button className="text-blue-600 text-xs font-bold hover:underline">View All</button>
          </div>
          <div>
            {activities.map((a, i) => <ActivityRow key={i} {...a} />)}
          </div>
        </div>

        {/* System health */}
        <div className="bg-slate-900 rounded-3xl p-6 text-white relative overflow-hidden group self-start">
          <div className="relative z-10">
            <h2 className="text-base font-bold mb-1">System Health</h2>
            <p className="text-slate-400 text-xs mb-6">Live metrics from school data.</p>
            {(() => {
              const serverLoad = stats?.students ? Math.min(Math.round((stats.students / 500) * 100), 100) : 0;
              const storageUsed = stats?.totalFee > 0 ? Math.round((stats.totalPaid / stats.totalFee) * 100) : 0;
              const dbResponse = stats?.attendance ?? 0;
              return [
                { label: 'Server Load', pct: serverLoad, color: serverLoad > 80 ? 'bg-red-500' : serverLoad > 50 ? 'bg-amber-500' : 'bg-blue-500' },
                { label: 'Storage Used', pct: storageUsed, color: storageUsed > 80 ? 'bg-red-500' : storageUsed > 50 ? 'bg-amber-500' : 'bg-emerald-500' },
                { label: 'DB Response', pct: dbResponse, color: dbResponse < 60 ? 'bg-red-500' : dbResponse < 80 ? 'bg-amber-500' : 'bg-emerald-500' },
              ].map(({ label, pct, color }) => (
                <div key={label} className="mb-4">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider mb-1.5 text-slate-400">
                    <span>{label}</span><span>{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              ));
            })()}
          </div>
          <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-blue-600/20 blur-3xl rounded-full group-hover:scale-150 transition-transform duration-700" />
        </div>
      </div>
    </div>
  );
}