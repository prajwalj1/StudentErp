'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AcademicCapIcon, CalendarIcon, UserIcon } from '@heroicons/react/24/outline';

export default function PassoutStudentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated' || (session && session.user.role !== 'OWNER')) {
      router.push('/login');
    }
  }, [status, session, router]);

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
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const batches = {};
  students.forEach(s => {
    const year = s.graduatedYear || 'Unknown';
    if (!batches[year]) batches[year] = [];
    batches[year].push(s);
  });
  const sortedBatches = Object.keys(batches).sort((a, b) => b.localeCompare(a));

  if (loading) return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600">
            <AcademicCapIcon className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Passout Students</h1>
            <p className="text-slate-500 text-sm mt-1">Students who have graduated and passed out.</p>
          </div>
        </div>
      </div>

      {sortedBatches.length === 0 ? (
        <div className="bg-white p-16 rounded-3xl text-center border border-slate-100">
          <AcademicCapIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-500">No passout students yet.</p>
          <p className="text-sm text-slate-400 mt-1">Promote Grade 12 students to mark them as passed out.</p>
        </div>
      ) : (
        sortedBatches.map(year => (
          <div key={year} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 bg-purple-50 border-b border-purple-100 flex items-center gap-3">
              <CalendarIcon className="w-5 h-5 text-purple-500" />
              <h2 className="text-lg font-bold text-slate-900">Batch {year}</h2>
              <span className="ml-auto text-xs font-bold text-purple-600 bg-purple-100 px-3 py-1 rounded-full">{batches[year].length} students</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-slate-400 text-xs uppercase tracking-wider">
                    <th className="px-6 py-3 font-bold">Student Name</th>
                    <th className="px-6 py-3 font-bold">Student ID</th>
                    <th className="px-6 py-3 font-bold">Email</th>
                    <th className="px-6 py-3 font-bold">Section</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {batches[year].map(s => (
                    <tr key={s._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm">
                            {s.name.charAt(0)}
                          </div>
                          <span className="font-semibold text-slate-900">{s.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 font-mono">{s.studentId}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{s.email}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{s.section || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
