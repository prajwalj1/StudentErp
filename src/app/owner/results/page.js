'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  DocumentTextIcon, PrinterIcon, AcademicCapIcon, UserIcon,
  ChartBarIcon,
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

export default function ResultsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [marks, setMarks] = useState([]);
  const [students, setStudents] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedGradeKey, setSelectedGradeKey] = useState('All');
  const [examType, setExamType] = useState('Final Term');

  const [resultsMap, setResultsMap] = useState({});

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'print-marksheet-styles';
    style.textContent = '@media print{' +
      '@page{margin:0.5in}' +
      'body>div>aside,body>div>div>header{display:none!important}' +
      'body>div>div>main{margin-left:0!important;padding:0!important;overflow:visible!important;display:block!important}' +
      'body>div>div>main>div{padding:0!important;margin:0!important;max-width:none!important}' +
    '}';
    document.head.appendChild(style);
    return () => { const s = document.getElementById('print-marksheet-styles'); if (s) s.remove(); };
  }, []);

  useEffect(() => {
    if (status === 'authenticated') fetchData();
  }, [status, selectedGradeKey, examType]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const gradeParam = selectedGradeKey !== 'All' ? selectedGradeKey.split('|')[0] : 'All';
      const [marksRes, studentsRes, classesRes] = await Promise.all([
        fetch(`/api/marks?examType=${examType}&grade=${gradeParam}`),
        fetch('/api/students'), fetch('/api/classes')
      ]);
      if (marksRes.ok && studentsRes.ok && classesRes.ok) {
        const marksData = await marksRes.json();
        const studentsData = await studentsRes.json();
        const classesData = await classesRes.json();

        const pairsMap = new Map();
        classesData.forEach(c => {
          const g = c.grade || 'Grade 10';
          const s = c.section || '';
          const key = `${g}|${s}`;
          if (!pairsMap.has(key)) pairsMap.set(key, { grade: g, section: s, label: `${g} ${s ? `(Sec ${s})` : ''}`.trim() });
        });
        setClassesList(Array.from(pairsMap.values()));

        let filteredStudents = studentsData.filter(s => s.status !== 'graduated');
        if (selectedGradeKey !== 'All') {
          const [targetGrade, targetSection] = selectedGradeKey.split('|');
          filteredStudents = filteredStudents.filter(s => {
            const sNum = (s.grade || '').replace(/\D/g, '');
            const tNum = (targetGrade || '').replace(/\D/g, '');
            if (sNum !== tNum) return false;
            if (!targetSection) return true;
            return (s.section || '').toLowerCase().trim() === targetSection.toLowerCase().trim();
          });
        }
        setMarks(marksData);
        setStudents(filteredStudents);
        calculateResults(filteredStudents, marksData);
      }
    } catch (e) { console.error(e) } finally { setLoading(false); }
  };

  const calculateResults = (studentsList, marksList) => {
    const map = {};
    studentsList.forEach(student => {
      const studentMarks = marksList.filter(m => m.studentId?._id === student._id);
      let totalObtained = 0, grandTotal = 0;
      const subjects = [];
      studentMarks.forEach(m => {
        totalObtained += m.marksObtained;
        grandTotal += m.totalMarks;
        const percent = (m.marksObtained / m.totalMarks) * 100;
        let gpa = 0, gradeStr = 'F';
        if (percent >= 90) { gpa = 4.0; gradeStr = 'A+'; }
        else if (percent >= 80) { gpa = 3.6; gradeStr = 'A'; }
        else if (percent >= 70) { gpa = 3.2; gradeStr = 'B+'; }
        else if (percent >= 60) { gpa = 2.8; gradeStr = 'B'; }
        else if (percent >= 50) { gpa = 2.4; gradeStr = 'C+'; }
        else if (percent >= 40) { gpa = 2.0; gradeStr = 'C'; }
        else if (percent >= 35) { gpa = 1.6; gradeStr = 'D'; }
        subjects.push({ subjectName: m.classScheduleId?.subject || 'Unknown', obtained: m.marksObtained, total: m.totalMarks, gpa, gradeStr });
      });
      const finalPercentage = grandTotal > 0 ? ((totalObtained / grandTotal) * 100).toFixed(2) : 0;
      const finalGpa = subjects.length > 0 ? (subjects.reduce((sum, s) => sum + s.gpa, 0) / subjects.length).toFixed(2) : 0;
      map[student._id] = { student, subjects, totalObtained, grandTotal, finalPercentage, finalGpa, hasMarks: subjects.length > 0 };
    });
    setResultsMap(map);
  };

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-indigo-600 border-t-transparent" />
    </div>
  );

  const validResults = Object.values(resultsMap).filter(r => r.hasMarks);

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50/80 via-white to-indigo-50/20">
      <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6 lg:p-8">

        {/* ─── Header ─── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 sm:p-6 shadow-xl print:hidden">
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                <DocumentTextIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white">Student Results & Marksheets</h1>
                <p className="text-xs text-slate-400">Review GPA, percentages, and print official marksheets</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select value={examType} onChange={(e) => setExamType(e.target.value)}
                className="rounded-xl bg-white/10 backdrop-blur-sm border-0 px-3.5 py-2 text-xs font-bold text-white outline-none cursor-pointer">
                <option className="text-slate-800" value="First Term">First Term</option>
                <option className="text-slate-800" value="Mid Term">Mid Term</option>
                <option className="text-slate-800" value="Final Term">Final Term</option>
              </select>
              <select value={selectedGradeKey} onChange={(e) => setSelectedGradeKey(e.target.value)}
                className="rounded-xl bg-white/10 backdrop-blur-sm border-0 px-3.5 py-2 text-xs font-bold text-white outline-none cursor-pointer">
                <option className="text-slate-800" value="All">All Grades & Sections</option>
                {classesList.map(c => (
                  <option className="text-slate-800" key={`${c.grade}|${c.section}`} value={`${c.grade}|${c.section}`}>{c.label}</option>
                ))}
              </select>
              <button onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-xl bg-white text-indigo-600 px-5 py-2 text-xs font-bold transition-all hover:bg-indigo-50">
                <PrinterIcon className="h-4 w-4" /> Print
              </button>
            </div>
          </div>
        </div>

        {/* ─── Stats Row ─── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 print:hidden">
          <StatBox icon={AcademicCapIcon} label="Total Students" value={students.length} color="blue" />
          <StatBox icon={ChartBarIcon} label="With Marks" value={validResults.length} color="emerald" />
          <StatBox icon={UserIcon} label="Without Marks" value={students.length - validResults.length} color="amber" />
          <StatBox icon={DocumentTextIcon} label="Subjects" value={marks.length > 0 ? [...new Set(marks.map(m => m.classScheduleId?.subject))].length : 0} color="indigo" />
        </div>

        {/* ─── Results ─── */}
        {validResults.length === 0 ? (
          <div className="print:hidden rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-sm">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <h3 className="text-lg font-bold text-slate-700">No results compiled</h3>
            <p className="text-sm text-slate-400 mt-1">Teachers need to enter marks first.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {validResults.map(({ student, subjects, totalObtained, grandTotal, finalPercentage, finalGpa }) => (
              <div key={student._id}
                className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm print:shadow-none print:border-none print:m-0 print:p-0 print:break-after-page">

                {/* Marksheet Header */}
                <div className="text-center mb-6 border-b-2 border-slate-900 pb-5">
                  <div className="flex items-center justify-center gap-4 mb-3">
                    <img src="/images/logo.png" alt="School Logo" className="h-14 w-14 object-contain" />
                    <div>
                      <h1 className="text-xl font-black text-slate-900 uppercase tracking-widest">Everest View Secondary School</h1>
                      <p className="text-[10px] text-slate-500 font-semibold mt-1">Mechinagar -7, Jhapa, Nepal</p>
                    </div>
                  </div>
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">{examType} Examinations \u2014 Marksheet</p>
                </div>

                {/* Student Info */}
                <div className="flex justify-between items-end mb-6 rounded-xl bg-slate-50 p-5 border border-slate-100 print:bg-transparent print:p-0 print:border-none">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student Name</p>
                    <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                      <UserIcon className="h-5 w-5 text-indigo-600 print:text-black" /> {student.name}
                    </h2>
                    <p className="text-xs font-bold text-slate-600">Roll No: {student.rollNumber || student._id.slice(-6).toUpperCase()}</p>
                    <p className="text-xs text-slate-600">Father: <span className="font-semibold text-slate-800">{student.fatherName || 'N/A'}</span></p>
                    <p className="text-xs text-slate-600">DOB (BS): <span className="font-semibold text-slate-800">{student.dob || 'N/A'}</span></p>
                    <p className="text-xs text-slate-600">Address: <span className="font-semibold text-slate-800">{student.address || 'N/A'}</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Class / Grade</p>
                    <p className="text-lg font-black text-indigo-600 print:text-black">{student.grade}{student.section ? ` (Sec ${student.section})` : ''}</p>
                  </div>
                </div>

                {/* Marks Table */}
                <div className="overflow-x-auto mb-6">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-900 text-white print:bg-slate-200 print:text-black text-xs">
                        <th className="px-4 py-2.5 font-bold border border-slate-900 print:border-slate-300">Subject</th>
                        <th className="px-4 py-2.5 font-bold border border-slate-900 print:border-slate-300 text-center">Full Marks</th>
                        <th className="px-4 py-2.5 font-bold border border-slate-900 print:border-slate-300 text-center">Obtained</th>
                        <th className="px-4 py-2.5 font-bold border border-slate-900 print:border-slate-300 text-center">Grade</th>
                        <th className="px-4 py-2.5 font-bold border border-slate-900 print:border-slate-300 text-center">GPA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjects.map((sub, idx) => (
                        <tr key={idx} className="border-b border-slate-200 print:border-slate-300">
                          <td className="px-4 py-2.5 font-bold text-slate-800 border-x border-slate-200 print:border-slate-300">{sub.subjectName}</td>
                          <td className="px-4 py-2.5 text-center border-x border-slate-200 print:border-slate-300 font-semibold">{sub.total}</td>
                          <td className="px-4 py-2.5 text-center border-x border-slate-200 print:border-slate-300 font-black text-indigo-600 print:text-black">{sub.obtained}</td>
                          <td className="px-4 py-2.5 text-center border-x border-slate-200 print:border-slate-300 font-bold text-emerald-600 print:text-black">{sub.gradeStr}</td>
                          <td className="px-4 py-2.5 text-center border-x border-slate-200 print:border-slate-300 font-bold">{sub.gpa.toFixed(1)}</td>
                        </tr>
                      ))}
                      <tr className="bg-slate-50 print:bg-slate-100 font-black text-slate-900 border border-slate-200 print:border-slate-300">
                        <td className="px-4 py-3 text-right border-x border-slate-200 print:border-slate-300">Grand Total</td>
                        <td className="px-4 py-3 text-center border-x border-slate-200 print:border-slate-300">{grandTotal}</td>
                        <td className="px-4 py-3 text-center border-x border-slate-200 print:border-slate-300 text-indigo-600 print:text-black">{totalObtained}</td>
                        <td className="px-4 py-3 border-x border-slate-200 print:border-slate-300" colSpan="2"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Final Result Summary */}
                <div className="grid grid-cols-2 gap-4 rounded-xl bg-indigo-50 p-5 border border-indigo-100 print:bg-transparent print:border print:border-slate-300">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Final Percentage</p>
                    <p className="text-2xl font-black text-indigo-600 print:text-black">{finalPercentage}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Overall GPA</p>
                    <p className="text-2xl font-black text-emerald-600 print:text-black">{finalGpa}</p>
                  </div>
                </div>

                {/* Signatures */}
                <div className="mt-12 flex justify-between px-4 sm:px-8">
                  <div className="text-center">
                    <div className="w-32 sm:w-40 border-b border-slate-400 mb-2"></div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Class Teacher</p>
                  </div>
                  <div className="text-center">
                    <div className="w-32 sm:w-40 border-b border-slate-400 mb-2"></div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Principal</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes zoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
