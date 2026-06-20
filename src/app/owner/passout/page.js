'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  AcademicCapIcon, CalendarIcon, UserIcon,
  ChartBarIcon, UserGroupIcon,
} from '@heroicons/react/24/outline';

function StatBox({ icon: Icon, label, value, color }) {
  const colors = { blue: 'from-blue-500 to-indigo-600', emerald: 'from-emerald-500 to-emerald-600', amber: 'from-amber-500 to-amber-600', purple: 'from-purple-500 to-pink-600' };
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

function Badge({ children, color = 'slate' }) {
  const colors = {
    slate: 'bg-slate-100 text-slate-600', emerald: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700', red: 'bg-red-100 text-red-700',
    purple: 'bg-purple-100 text-purple-700',
  };
  return <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${colors[color]}`}>{children}</span>;
}

export default function PassoutStudentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') fetchPassout();
  }, [status]);

  const fetchPassout = async () => {
    try {
      const res = await fetch('/api/students');
      if (res.ok) {
        const data = await res.json();
        setStudents(data.filter(s => s.status === 'graduated'));
      }
    } catch (e) { console.error(e) } finally { setLoading(false); }
  };

  const batches = {};
  students.forEach(s => {
    const year = s.graduatedYear || 'Unknown';
    if (!batches[year]) batches[year] = [];
    batches[year].push(s);
  });
  const sortedBatches = Object.keys(batches).sort((a, b) => b.localeCompare(a));
  const totalPassout = students.length;

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-purple-600 border-t-transparent" />
    </div>
  );

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50/80 via-white to-purple-50/20">
      <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6 lg:p-8">

        {/* ─── Header ─── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 sm:p-6 shadow-xl">
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-purple-500/10 blur-3xl" />
          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
              <AcademicCapIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">Passout Students</h1>
              <p className="text-xs text-slate-400">Students who have graduated and passed out</p>
            </div>
          </div>
        </div>

        {/* ─── Stats Row ─── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatBox icon={UserGroupIcon} label="Total Passout" value={totalPassout} color="purple" />
          <StatBox icon={CalendarIcon} label="Batches" value={sortedBatches.length} color="blue" />
          <StatBox icon={ChartBarIcon} label="Largest Batch" value={sortedBatches.length > 0 ? Math.max(...sortedBatches.map(y => batches[y].length)) : 0} color="emerald" />
          <StatBox icon={ChartBarIcon} label="Avg Per Batch" value={sortedBatches.length > 0 ? Math.round(totalPassout / sortedBatches.length) : 0} color="amber" />
        </div>

        {/* ─── Batches ─── */}
        {sortedBatches.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-sm">
            <AcademicCapIcon className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <p className="font-bold text-slate-500">No passout students yet</p>
            <p className="text-sm text-slate-400 mt-1">Promote Grade 12 students to mark them as passed out.</p>
          </div>
        ) : (
          sortedBatches.map(year => (
            <div key={year} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-purple-100 bg-gradient-to-r from-purple-50 to-white px-5 py-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-sm">
                  <CalendarIcon className="h-4 w-4" />
                </div>
                <h2 className="text-sm font-bold text-slate-900">Batch {year}</h2>
                <Badge color="purple">{batches[year].length} students</Badge>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="px-5 py-3">Student Name</th>
                      <th className="px-5 py-3">Student ID</th>
                      <th className="px-5 py-3 hidden sm:table-cell">Email</th>
                      <th className="px-5 py-3 hidden md:table-cell">Section</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {batches[year].map(s => (
                      <tr key={s._id} className="transition-colors hover:bg-slate-50/50">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-600 text-xs font-bold text-white shadow-sm">
                              {s.name.charAt(0)}
                            </div>
                            <span className="text-sm font-bold text-slate-900">{s.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-xs font-mono text-slate-600">{s.studentId}</td>
                        <td className="px-5 py-3 text-xs text-slate-500 hidden sm:table-cell">{s.email}</td>
                        <td className="px-5 py-3 text-xs text-slate-600 hidden md:table-cell">{s.section || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        @keyframes zoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
