'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { BookOpenIcon, PrinterIcon } from '@heroicons/react/24/outline';
import { toNepaliDate, toNepaliDateShort, getNepaliYear } from '@/lib/nepaliDate';

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const bs = toNepaliDateShort(dateStr);
  const [by, bm, bd] = bs ? bs.split('-') : [];
  const monthNames = ['Bai', 'Jes', 'Asa', 'Shr', 'Bha', 'Asw', 'Kar', 'Man', 'Pou', 'Mag', 'Fal', 'Cha'];
  const mIdx = bm ? parseInt(bm, 10) - 1 : -1;
  return {
    day: dayNames[d.getDay()],
    date: parseInt(bd, 10) || d.getDate(),
    month: (mIdx >= 0 ? monthNames[mIdx] : d.toLocaleDateString('en-US', { month: 'short' })),
    year: by || d.getFullYear(),
    full: bs || d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
  };
}

export default function StudentRoutine() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [routine, setRoutine] = useState(null);
  const [studentGrade, setStudentGrade] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated' || (session && session.user.role !== 'STUDENT')) router.push('/login');
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'STUDENT') {
      const loadRoutine = async () => {
        try {
          setErrorMsg('');
          const sid = session.user.studentId;
          const sessGrade = session.user.grade;
          let found = false;

          if (sid) {
            const res = await fetch(`/api/exam-routines?studentId=${encodeURIComponent(sid)}`);
            const data = await res.json();
            if (data && data.terms) { setRoutine(data); if (data.grade) setStudentGrade(data.grade); found = true; }
          }

          if (!found && sessGrade) {
            const res = await fetch(`/api/exam-routines?grade=${encodeURIComponent(sessGrade)}`);
            const data = await res.json();
            if (data && data.terms) { setRoutine(data); setStudentGrade(sessGrade); found = true; }
          }

          if (!found) { setErrorMsg('No exam routine found for your grade.'); setRoutine(null); }
        } catch { setRoutine(null); }
        finally { setLoading(false); }
      };
      loadRoutine();
    }
  }, [status, session]);

  const today = new Date();

  if (status === 'loading' || loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-emerald-600 border-t-transparent" />
    </div>
  );

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50/80 via-white to-emerald-50/20">
      <div className="mx-auto max-w-4xl space-y-5 p-4 sm:p-6 lg:p-8">

        {/* ─── Header (no-print) ─── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900 p-5 sm:p-6 shadow-xl no-print">
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                <BookOpenIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white">Examination Routine</h1>
                <p className="text-xs text-emerald-200">Academic Year {getNepaliYear(today)}</p>
              </div>
            </div>
            <button onClick={() => window.print()}
              className="flex items-center gap-2 rounded-xl bg-white/10 backdrop-blur-sm px-5 py-2.5 text-xs font-bold text-white transition-all hover:bg-white/20">
              <PrinterIcon className="h-4 w-4" />
              Print / Download
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700 no-print">{errorMsg}</div>
        )}

        {!routine ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-16 text-center shadow-sm">
            <BookOpenIcon className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-3 text-lg font-bold text-slate-500">No exam routine published yet</p>
            <p className="mt-1 text-sm text-slate-400">Your exam schedule will appear here once published.</p>
          </div>
        ) : (
          <div id="exam-routine">

            {/* ─── School Letterhead ─── */}
            <div className="border-b-2 border-slate-300 pb-3 mb-4 text-center">
              <div className="flex flex-col items-center gap-2">
                <img src="/images/logo.png" alt="Logo"
                  className="h-14 w-14 shrink-0 object-contain"
                  onError={e => { e.target.style.display = 'none'; }} />
                <div>
                  <h1 className="text-base font-bold uppercase tracking-wide text-red-700">Everest View Secondary Boarding School</h1>
                  <p className="text-[12px] font-medium text-slate-500">Kathmandu, Nepal</p>
                </div>
              </div>
            </div>

            {/* ─── Student Info ─── */}
            <div className="border-b border-slate-300 pb-2 mb-4 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex gap-6">
                  <div><span className="font-semibold text-slate-500">Student:</span> <span className="font-bold text-slate-800">{session?.user?.name}</span></div>
                  <div><span className="font-semibold text-slate-500">Grade:</span> <span className="font-bold text-slate-800">{studentGrade}</span></div>
                  <div><span className="font-semibold text-slate-500">Year:</span> <span className="font-bold text-slate-800">{getNepaliYear(today)}</span></div>
                </div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-red-700">Examination Schedule</h2>
              </div>
            </div>

            {/* ─── Term Sections ─── */}
            {routine.terms?.filter(t => t.subjects?.length > 0).map((term, ti) => (
              <div key={term.name} className="mb-5">
                <div className="flex flex-col items-center border border-slate-300 bg-slate-100 px-3 py-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">{term.name}</h3>
                  {term.startTime && (
                    <span className="mt-0.5 text-[11px] font-semibold text-slate-600">
                      Exam Time: {term.startTime}{term.endTime ? ` - ${term.endTime}` : ''}
                    </span>
                  )}
                </div>

                <table className="w-full border-collapse" style={{ border: '1px solid #d1d5db' }}>
                  <thead>
                    <tr className="bg-red-50">
                      <th style={{ border: '1px solid #d1d5db', padding: '8px 12px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#991b1b' }} className="w-10 text-center">S.No</th>
                      <th style={{ border: '1px solid #d1d5db', padding: '8px 12px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#991b1b' }} className="text-left">Subject</th>
                      <th style={{ border: '1px solid #d1d5db', padding: '8px 12px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#991b1b' }} className="w-44 text-left">Date</th>
                      <th style={{ border: '1px solid #d1d5db', padding: '8px 12px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#991b1b' }} className="w-20 text-center">Full Marks</th>
                      <th style={{ border: '1px solid #d1d5db', padding: '8px 12px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#991b1b' }} className="w-20 text-center">Pass Marks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {term.subjects
                      .sort((a, b) => { if (!a.date) return 1; if (!b.date) return -1; return new Date(a.date) - new Date(b.date); })
                      .map((sub, i) => {
                        const fd = sub.date ? formatDate(sub.date) : null;
                        return (
                          <tr key={i} className="hover:bg-slate-50">
                            <td style={{ border: '1px solid #d1d5db', padding: '8px 12px', fontSize: '12px' }} className="text-center text-slate-400">{i + 1}</td>
                            <td style={{ border: '1px solid #d1d5db', padding: '8px 12px', fontSize: '12px' }} className="font-semibold text-slate-800">{sub.name}</td>
                            <td style={{ border: '1px solid #d1d5db', padding: '8px 12px', fontSize: '12px' }}>
                              {fd ? <span className="text-slate-700">{fd.full}</span> : <span className="italic text-slate-400">TBD</span>}
                            </td>
                            <td style={{ border: '1px solid #d1d5db', padding: '8px 12px', fontSize: '12px' }} className="text-center font-bold text-slate-800">{sub.fullMarks || '-'}</td>
                            <td style={{ border: '1px solid #d1d5db', padding: '8px 12px', fontSize: '12px' }} className="text-center font-bold text-slate-800">{sub.passMarks || '-'}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            ))}

            {/* ─── Signature Section ─── */}
            <div className="mt-8 flex justify-center gap-16 border-t border-slate-300 pt-6">
              <div className="w-48 text-center">
                <div className="mt-12 border-t border-slate-400 pt-2">
                  <p className="text-xs font-bold text-slate-700">Accountant</p>
                  <p className="text-[10px] text-slate-400">Signature</p>
                </div>
              </div>
              <div className="w-48 text-center">
                <div className="mt-12 border-t border-slate-400 pt-2">
                  <p className="text-xs font-bold text-slate-700">Principal</p>
                  <p className="text-[10px] text-slate-400">Signature</p>
                </div>
              </div>
            </div>

            {/* ─── Footer ─── */}
            <div className="mt-6 text-center text-[10px] text-slate-400">
              <p className="font-semibold">This is a computer-generated schedule. Timings and dates are subject to change.</p>
              <p className="mt-0.5 font-semibold">&copy; {today.getFullYear()} Everest View Secondary Boarding School. All rights reserved.</p>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
