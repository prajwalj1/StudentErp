'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { ChartBarIcon, ArrowDownTrayIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchStats();
    }
  }, [status]);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/owner/stats');
      if (res.ok) {
        setStats(await res.json());
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-900">School Reports</h1>
          <p className="text-slate-500 text-sm mt-1">Analytics and overview of school performance.</p>
        </div>
        <button
          className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg transition-all duration-300"
          onClick={() => window.print()}
        >
          <ArrowDownTrayIcon className="w-5 h-5" />
          Export PDF
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Financial Overview */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <ChartBarIcon className="w-6 h-6 text-emerald-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Financial Overview</h2>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-sm text-slate-500 font-medium mb-1">Total Revenue Collected</p>
              <p className="text-3xl font-black text-slate-900">Rs {stats?.revenue?.toLocaleString() ?? 0}</p>
            </div>
            
            <div className="space-y-3 pt-2">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-slate-600">Monthly Target</span>
                <span className="text-slate-900">85% Achieved</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Academic Performance */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DocumentTextIcon className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Academic & Attendance</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <p className="text-sm text-slate-500 font-medium mb-1">Total Students</p>
              <p className="text-2xl font-black text-slate-900">{stats?.students ?? 0}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <p className="text-sm text-slate-500 font-medium mb-1">Total Teachers</p>
              <p className="text-2xl font-black text-slate-900">{stats?.teachers ?? 0}</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-2xl border border-blue-100">
             <div className="flex justify-between items-center mb-2">
               <span className="text-sm font-bold text-blue-900">Average School Attendance</span>
               <span className="text-lg font-black text-blue-600">{stats?.attendance ?? 0}%</span>
             </div>
             <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: `${stats?.attendance ?? 0}%` }}></div>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}
