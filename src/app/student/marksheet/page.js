'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AcademicCapIcon } from '@heroicons/react/24/outline';
import { getNepaliYear } from '@/lib/nepaliDate';

function getGrade(pct) {
  if (pct >= 90) return { grade: 'A+', remarks: 'Outstanding' };
  if (pct >= 80) return { grade: 'A', remarks: 'Excellent' };
  if (pct >= 70) return { grade: 'B+', remarks: 'Very Good' };
  if (pct >= 60) return { grade: 'B', remarks: 'Good' };
  if (pct >= 50) return { grade: 'C+', remarks: 'Satisfactory' };
  if (pct >= 40) return { grade: 'C', remarks: 'Pass' };
  return { grade: 'D', remarks: 'Fail' };
}

function getResult(pct, passMarks, totalMarks) {
  if (passMarks && totalMarks) {
    const passPct = (passMarks / totalMarks) * 100;
    return pct >= passPct ? 'Pass' : 'Fail';
  }
  return pct >= 40 ? 'Pass' : 'Fail';
}

export default function StudentMarksheet() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [marks, setMarks] = useState([]);
  const [studentInfo, setStudentInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated' || (session && session.user.role !== 'STUDENT')) {
      router.push('/login');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'STUDENT') {
      const loadMarks = async () => {
        try {
          const res = await fetch('/api/marks');
          const data = await res.json();
          const marksArr = Array.isArray(data) ? data : [];
          setMarks(marksArr);

          if (marksArr.length > 0) {
            const si = marksArr[0].studentId || {};
            setStudentInfo(si);

            const examTypes = [...new Set(marksArr.map(m => m.examType))];
            if (examTypes.length > 0) setSelectedExam(examTypes[0]);
          }
        } catch {
          // ignore
        } finally {
          setLoading(false);
        }
      };
      loadMarks();
    }
  }, [status, session]);

  const examTypes = [...new Set(marks.map(m => m.examType))];

  const filteredMarks = selectedExam
    ? marks.filter(m => m.examType === selectedExam)
    : marks;

  const sortedMarks = [...filteredMarks].sort((a, b) => {
    const subA = a.classScheduleId?.subject || '';
    const subB = b.classScheduleId?.subject || '';
    return subA.localeCompare(subB);
  });

  const totalObtained = sortedMarks.reduce((s, m) => s + (m.marksObtained || 0), 0);
  const totalFullMarks = sortedMarks.reduce((s, m) => s + (m.totalMarks || 0), 0);
  const overallPct = totalFullMarks > 0 ? Math.round((totalObtained / totalFullMarks) * 100) : 0;
  const overallGrade = getGrade(overallPct);

  const today = new Date();

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-4 md:p-6">
      <style>{`
        @media print {
          body * { visibility: visible !important; }
          .no-print { display: none !important; }
          aside, header.sticky, .lg\\:pl-72 > header { display: none !important; }
          .lg\\:pl-72 { padding-left: 0 !important; }
          #marksheet { margin: 0; padding: 0; }
          @page { margin: 0.5in; }
        }
        .marksheet-table td, .marksheet-table th {
          border: 1px solid #cbd5e1;
          padding: 6px 10px;
          font-size: 12px;
        }
        .marksheet-table th {
          background: #fef2f2;
          font-weight: 700;
          text-transform: uppercase;
          font-size: 11px;
          color: #991b1b;
          text-align: center;
        }
        .marksheet-table td {
          color: #1e293b;
          text-align: center;
        }
        .marksheet-table td.left {
          text-align: left;
        }
      `}</style>

      {/* Header */}
      <div className="flex justify-between items-start mb-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Marksheet</h1>
          <p className="text-sm text-slate-500">Academic Year {getNepaliYear(today)}</p>
        </div>
        <button onClick={() => window.print()}
          className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold rounded no-print cursor-pointer">
          Print / Download
        </button>
      </div>

      {marks.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-slate-200 bg-white rounded-xl">
          <AcademicCapIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-lg font-semibold">No marks recorded yet</p>
          <p className="text-slate-400 text-sm mt-1">Your marksheet will appear here once exams are graded.</p>
        </div>
      ) : (
        <div id="marksheet" className="max-w-4xl mx-auto bg-white p-6 sm:p-8 shadow-md border border-slate-200">

          {/* School Letterhead */}
          <div className="text-center border-b-2 border-slate-300 pb-4 mb-4">
            <div className="flex items-center justify-center gap-4">
              <img src="/images/logo.png" alt="Logo"
                className="w-14 h-14 object-contain shrink-0"
                onError={e => { e.target.style.display = 'none'; }} />
              <div>
                <h1 className="text-lg font-bold text-red-700 uppercase tracking-wide">Everest View Secondary Boarding School</h1>
                <p className="text-xs text-slate-500">Kathmandu, Nepal</p>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">Academic Year {getNepaliYear(today)}</p>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-4">
            <h2 className="text-base font-bold text-red-700 uppercase tracking-widest border-b-2 border-red-700 inline-block pb-1 px-6">
              Progress Report
            </h2>
          </div>

          {/* Exam Type Selector */}
          {examTypes.length > 1 && (
            <div className="flex items-center gap-2 mb-4 no-print">
              <label className="text-sm font-semibold text-slate-600">Select Term:</label>
              <select value={selectedExam} onChange={e => setSelectedExam(e.target.value)}
                className="border border-slate-300 px-3 py-1.5 text-sm rounded font-semibold text-slate-700 bg-white">
                {examTypes.map(et => (
                  <option key={et} value={et}>{et}</option>
                ))}
              </select>
            </div>
          )}

          <div className="text-center text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide">
            {selectedExam} - {getNepaliYear(today)}
          </div>

          {/* Student Info */}
          <div className="border border-slate-300 p-3 mb-4 text-sm grid grid-cols-2 gap-x-8 gap-y-1.5">
            <div><span className="text-slate-500 font-semibold">Student Name:</span> <span className="font-bold text-slate-800">{session?.user?.name}</span></div>
            <div><span className="text-slate-500 font-semibold">Roll Number:</span> <span className="font-bold text-slate-800">{studentInfo?.rollNumber || '-'}</span></div>
            <div><span className="text-slate-500 font-semibold">Class:</span> <span className="font-bold text-slate-800">Grade {session?.user?.grade || studentInfo?.grade || '-'}</span></div>
            <div><span className="text-slate-500 font-semibold">Father&apos;s Name:</span> <span className="font-bold text-slate-800">{studentInfo?.fatherName || '-'}</span></div>
            <div><span className="text-slate-500 font-semibold">Section:</span> <span className="font-bold text-slate-800">{studentInfo?.section || '-'}</span></div>
            <div><span className="text-slate-500 font-semibold">Contact:</span> <span className="font-bold text-slate-800">{studentInfo?.fatherMobile || '-'}</span></div>
          </div>

          {/* Marks Table */}
          {selectedExam && sortedMarks.length > 0 && (
            <>
              <table className="w-full marksheet-table border-collapse mb-1">
                <thead>
                  <tr>
                    <th className="w-10">S.No</th>
                    <th className="left">Subject</th>
                    <th className="w-20">Full Marks</th>
                    <th className="w-20">Pass Marks</th>
                    <th className="w-20">Marks<br/>Obtained</th>
                    <th className="w-16">Grade</th>
                    <th className="w-16">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedMarks.map((m, i) => {
                    const pct = m.totalMarks > 0 ? Math.round((m.marksObtained / m.totalMarks) * 100) : 0;
                    const grade = getGrade(pct);
                    const result = getResult(pct, 40, 100);
                    const isFail = result === 'Fail';
                    return (
                      <tr key={i}>
                        <td className="text-slate-400">{i + 1}</td>
                        <td className="left font-semibold">{m.classScheduleId?.subject || 'N/A'}</td>
                        <td>{m.totalMarks}</td>
                        <td>40</td>
                        <td className={isFail ? 'text-red-600 font-bold' : 'font-bold'}>{m.marksObtained}</td>
                        <td className={`font-bold ${grade.grade === 'D' ? 'text-red-600' : 'text-slate-700'}`}>{grade.grade}</td>
                        <td className={`font-bold ${isFail ? 'text-red-600' : 'text-emerald-600'}`}>{result}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Summary */}
              <div className="border-2 border-slate-300 p-3 mt-2 bg-slate-50">
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-slate-500 text-xs font-semibold uppercase">Total Full Marks</p>
                    <p className="text-lg font-black text-slate-800">{totalFullMarks}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-500 text-xs font-semibold uppercase">Marks Obtained</p>
                    <p className="text-lg font-black text-slate-800">{totalObtained}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-500 text-xs font-semibold uppercase">Percentage</p>
                    <p className={`text-lg font-black ${overallPct >= 40 ? 'text-emerald-600' : 'text-red-600'}`}>{overallPct}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-500 text-xs font-semibold uppercase">Overall Grade</p>
                    <p className={`text-lg font-black ${overallGrade.grade === 'D' ? 'text-red-600' : 'text-emerald-600'}`}>{overallGrade.grade}</p>
                  </div>
                </div>
                <div className="text-center mt-2">
                  <p className="text-xs text-slate-400 font-semibold uppercase">Remarks: {overallGrade.remarks}</p>
                </div>
              </div>
            </>
          )}

          {(!selectedExam || sortedMarks.length === 0) && (
            <p className="text-slate-400 text-sm py-4 text-center">No marks available for this term.</p>
          )}

          {/* Signature Section */}
          <div className="flex justify-between mt-8 pt-6 border-t border-slate-300">
            <div className="text-center w-48">
              <div className="border-t border-slate-400 pt-2 mt-12">
                <p className="font-bold text-slate-700 text-sm">Class Teacher</p>
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
            <p className="font-semibold">This is a computer-generated marksheet and does not require a physical signature.</p>
            <p className="font-semibold mt-1">&copy; {today.getFullYear()} Everest View Secondary Boarding School. All rights reserved.</p>
          </div>

        </div>
      )}
    </div>
  );
}
