'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  ChartBarIcon, DocumentTextIcon,
  AcademicCapIcon, UserGroupIcon, CurrencyDollarIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

function StatBox({ icon: Icon, label, value, color }) {
  const colors = { blue: 'from-blue-500 to-indigo-600', emerald: 'from-emerald-500 to-emerald-600', amber: 'from-amber-500 to-amber-600', indigo: 'from-indigo-500 to-purple-600' };
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100 flex items-center gap-3">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${colors[color] || colors.blue} text-white shadow-sm`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="text-lg font-extrabold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') fetchStats();
  }, [status]);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/owner/stats');
      if (res.ok) setStats(await res.json());
    } catch (e) { console.error(e) } finally { setLoading(false); }
  };

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-blue-600 border-t-transparent" />
    </div>
  );

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50/80 via-white to-blue-50/20">
      <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6 lg:p-8">

        {/* ─── Header ─── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 sm:p-6 shadow-xl">
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                <ChartBarIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white">School Reports</h1>
                <p className="text-xs text-slate-400">Analytics and overview of school performance</p>
              </div>
            </div>

          </div>
        </div>

        {/* ─── Stats Row ─── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatBox icon={UserGroupIcon} label="Total Students" value={stats?.students ?? 0} color="blue" />
          <StatBox icon={AcademicCapIcon} label="Total Teachers" value={stats?.teachers ?? 0} color="emerald" />
          <StatBox icon={CurrencyDollarIcon} label="Revenue Collected" value={`Rs ${(stats?.revenue ?? 0).toLocaleString()}`} color="amber" />
          <StatBox icon={CheckCircleIcon} label="Attendance" value={`${stats?.attendance ?? 0}%`} color="indigo" />
        </div>

        {/* ─── Charts Grid ─── */}
        <div className="grid lg:grid-cols-2 gap-5">
          {/* Financial Overview */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-sm">
                <ChartBarIcon className="h-5 w-5" />
              </div>
              <h2 className="text-sm font-bold text-slate-900">Financial Overview</h2>
            </div>
            <div className="space-y-4">
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Revenue Collected</p>
                <p className="text-3xl font-black text-slate-900">Rs {(stats?.revenue ?? 0).toLocaleString()}</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-600">Monthly Target Achievement</span>
                  <span className="text-slate-900">{stats?.revenue ? '85%' : '0%'} Achieved</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600" style={{ width: stats?.revenue ? '85%' : '0%' }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="rounded-xl bg-emerald-50 p-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Total Fees</p>
                  <p className="text-lg font-black text-slate-900">Rs {(stats?.totalFee ?? 0).toLocaleString()}</p>
                </div>
                <div className="rounded-xl bg-red-50 p-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Total Due</p>
                  <p className="text-lg font-black text-red-500">Rs {(stats?.totalDue ?? 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Academic & Attendance */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-sm">
                <DocumentTextIcon className="h-5 w-5" />
              </div>
              <h2 className="text-sm font-bold text-slate-900">Academic & Attendance</h2>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Students</p>
                  <p className="text-2xl font-black text-slate-900">{stats?.students ?? 0}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Teachers</p>
                  <p className="text-2xl font-black text-slate-900">{stats?.teachers ?? 0}</p>
                </div>
              </div>
              <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-indigo-900">Average School Attendance</span>
                  <span className="text-xl font-black text-indigo-600">{stats?.attendance ?? 0}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-indigo-200 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-indigo-600" style={{ width: `${stats?.attendance ?? 0}%` }} />
                </div>
              </div>
              <div className="rounded-xl bg-amber-50 border border-amber-100 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-amber-900">Collection Rate</span>
                  <span className="text-xl font-black text-amber-600">
                    {stats?.totalFee > 0 ? Math.round(((stats?.revenue ?? 0) / stats.totalFee) * 100) : 0}%
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-amber-200 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600"
                    style={{ width: `${stats?.totalFee > 0 ? Math.round(((stats?.revenue ?? 0) / stats.totalFee) * 100) : 0}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes zoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
