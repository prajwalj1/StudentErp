'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { BookOpenIcon } from '@heroicons/react/24/outline';
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
    if (status === 'unauthenticated' || (session && session.user.role !== 'STUDENT')) {
      router.push('/login');
    }
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
            if (data && data.terms) {
              setRoutine(data);
              if (data.grade) setStudentGrade(data.grade);
              found = true;
            }
          }

          if (!found && sessGrade) {
            const res = await fetch(`/api/exam-routines?grade=${encodeURIComponent(sessGrade)}`);
            const data = await res.json();
            if (data && data.terms) {
              setRoutine(data);
              setStudentGrade(sessGrade);
              found = true;
            }
          }

          if (!found) {
            setErrorMsg('No exam routine found for your grade.');
            setRoutine(null);
          }
        } catch {
          setRoutine(null);
        } finally {
          setLoading(false);
        }
      };

      loadRoutine();
    }
  }, [status, session]);

  const today = new Date();

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-red-700 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-3 sm:p-4 md:p-6">
      <style>{`
        @media print {
          body * { visibility: visible !important; }
          .no-print { display: none !important; }
          aside, header.sticky, .lg\\:pl-72 > header { display: none !important; }
          .lg\\:pl-72 { padding-left: 0 !important; }
          #exam-routine { margin: 0; padding: 0; }
        }
        .routine-table td, .routine-table th {
          border: 1px solid #d1d5db;
          padding: 8px 12px;
          font-size: 13px;
        }
        .routine-table th {
          background: #fef2f2;
          font-weight: 700;
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 0.05em;
          color: #991b1b;
        }
        .routine-table td {
          color: #1e293b;
        }
      `}</style>

      {/* Header */}
      <div className="flex justify-between items-start mb-6 no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Examination Routine</h1>
          <p className="text-sm text-slate-500 mt-1">Academic Year {getNepaliYear(today)}</p>
        </div>
        <button onClick={() => window.print()}
          className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold rounded no-print cursor-pointer">
          Print / Download
        </button>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-sm text-red-700 no-print">
          {errorMsg}
        </div>
      )}

      {!routine ? (
        <div className="text-center py-20 border-2 border-dashed border-slate-200">
          <BookOpenIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-lg font-semibold">No exam routine published yet</p>
          <p className="text-slate-400 text-sm mt-1">Your exam schedule will appear here once published.</p>
        </div>
      ) : (
        <div id="exam-routine" className="max-w-4xl mx-auto">

          {/* School Letterhead */}
          <div className="text-center border-b-2 border-slate-300 pb-3 mb-4">
            <div className="flex flex-col items-center gap-2">
              <img src="/images/logo.png" alt="Logo"
                className="w-14 h-14 object-contain shrink-0"
                onError={e => { e.target.style.display = 'none'; }} />
              <div>
                <h1 className="text-base font-bold text-red-700 uppercase tracking-wide">Everest View Secondary Boarding School</h1>
                <p className="text-[12px] text-slate-500 font-medium">Kathmandu, Nepal</p>
              </div>
            </div>
          </div>

          {/* Student Info + Title Row */}
          <div className="border-b border-slate-300 pb-2 mb-4 text-sm">
            <div className="flex items-center justify-between">
              <div className="flex gap-6">
                <div><span className="text-slate-500 font-semibold">Student:</span> <span className="font-bold text-slate-800">{session?.user?.name}</span></div>
                <div><span className="text-slate-500 font-semibold">Grade:</span> <span className="font-bold text-slate-800">{studentGrade}</span></div>
                <div><span className="text-slate-500 font-semibold">Year:</span> <span className="font-bold text-slate-800">{getNepaliYear(today)}</span></div>
              </div>
              <h2 className="text-sm font-bold text-red-700 uppercase tracking-wider">Examination Schedule</h2>
            </div>
          </div>

          {/* Term Sections */}
          {routine.terms?.filter(t => t.subjects?.length > 0).map((term, ti) => (
            <div key={term.name} className="mb-5">
              {/* Term Header */}
              <div className="flex flex-col items-center bg-slate-100 border border-slate-300 px-3 py-2">
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">{term.name}</h3>
                {term.startTime && (
                  <span className="text-xs text-slate-600 font-semibold mt-0.5">
                    Exam Time: {term.startTime}{term.endTime ? ` - ${term.endTime}` : ''}
                  </span>
                )}
              </div>

              {/* Subject Table */}
              <table className="w-full routine-table border-collapse">
                <thead>
                  <tr>
                    <th className="w-10 text-center">S.No</th>
                    <th className="text-left">Subject</th>
                    <th className="text-left w-40">Date</th>
                    <th className="text-center w-20">Full Marks</th>
                    <th className="text-center w-20">Pass Marks</th>
                  </tr>
                </thead>
                <tbody>
                  {term.subjects
                    .sort((a, b) => {
                      if (!a.date) return 1; if (!b.date) return -1;
                      return new Date(a.date) - new Date(b.date);
                    })
                    .map((sub, i) => {
                      const fd = sub.date ? formatDate(sub.date) : null;
                      return (
                        <tr key={i}>
                          <td className="text-center text-slate-400">{i + 1}</td>
                          <td className="font-semibold">{sub.name}</td>
                          <td>
                            {fd ? (
                              <span>{fd.full}</span>
                            ) : (
                              <span className="text-slate-400 italic">TBD</span>
                            )}
                          </td>
                          <td className="text-center font-bold">{sub.fullMarks || '-'}</td>
                          <td className="text-center font-bold">{sub.passMarks || '-'}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          ))}

          {/* Signature Section */}
          <div className="flex justify-center gap-16 mt-8 pt-6 border-t border-slate-300">
            <div className="text-center w-48">
              <div className="border-t border-slate-400 pt-2 mt-12">
                <p className="font-bold text-slate-700 text-sm">Accountant</p>
                <p className="text-xs text-slate-400">Signature</p>
              </div>
            </div>
            <div className="text-center w-48">
              <div className="border-t border-slate-400 pt-2 mt-12">
                <p className="font-bold text-slate-700 text-sm">Principal</p>
                <p className="text-xs text-slate-400">Signature</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-6 text-xs text-slate-400">
            <p className="font-semibold">This is a computer-generated schedule. Timings and dates are subject to change.</p>
            <p className="font-semibold mt-1">&copy; {today.getFullYear()} Everest View Secondary Boarding School. All rights reserved.</p>
          </div>

        </div>
      )}
    </div>
  );
}
