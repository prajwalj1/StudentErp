'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { DocumentTextIcon, PrinterIcon, AcademicCapIcon, UserIcon } from '@heroicons/react/24/outline';

export default function ResultsPage() {
  const { data: session, status } = useSession();
  const [marks, setMarks] = useState([]);
  const [students, setStudents] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedGradeKey, setSelectedGradeKey] = useState('All');
  const [examType, setExamType] = useState('Final Term');
  
  // Grouped results per student
  const [resultsMap, setResultsMap] = useState({});

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
    if (status === 'authenticated') {
      fetchData();
    }
  }, [status, selectedGradeKey, examType]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [marksRes, studentsRes, classesRes] = await Promise.all([
        fetch(`/api/marks?examType=${examType}`),
        fetch('/api/students'),
        fetch('/api/classes')
      ]);

      if (marksRes.ok && studentsRes.ok && classesRes.ok) {
        const marksData = await marksRes.json();
        const studentsData = await studentsRes.json();
        const classesData = await classesRes.json();
        
        // Extract unique grade + section pairs
        const pairsMap = new Map();
        classesData.forEach(c => {
          const g = c.grade || 'Grade 10';
          const s = c.section || '';
          const key = `${g}|${s}`;
          if (!pairsMap.has(key)) {
            pairsMap.set(key, { grade: g, section: s, label: `${g} ${s ? `(Sec ${s})` : ''}`.trim() });
          }
        });

        const uniqueClasses = Array.from(pairsMap.values());
        setClassesList(uniqueClasses);

        let filteredStudents = studentsData;
        if (selectedGradeKey !== 'All') {
          const [targetGrade, targetSection] = selectedGradeKey.split('|');
          filteredStudents = studentsData.filter(s => {
            const sGrade = (s.grade || '').toLowerCase().trim();
            const tGrade = (targetGrade || '').toLowerCase().trim();
            const sNum = sGrade.replace(/\D/g, '');
            const tNum = tGrade.replace(/\D/g, '');
            if (sNum !== tNum) return false;
            if (!targetSection) return true;
            const sSec = (s.section || '').toLowerCase().trim();
            const tSec = (targetSection || '').toLowerCase().trim();
            return sSec === tSec;
          });
        }

        setMarks(marksData);
        setStudents(filteredStudents);
        calculateResults(filteredStudents, marksData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateResults = (studentsList, marksList) => {
    const map = {};
    
    studentsList.forEach(student => {
      const studentMarks = marksList.filter(m => m.studentId?._id === student._id);
      
      let totalObtained = 0;
      let grandTotal = 0;
      const subjects = [];

      studentMarks.forEach(m => {
        totalObtained += m.marksObtained;
        grandTotal += m.totalMarks;
        
        // Calculate subject GPA (Simplified generic scale)
        const percent = (m.marksObtained / m.totalMarks) * 100;
        let gpa = 0;
        let gradeStr = 'F';
        if (percent >= 90) { gpa = 4.0; gradeStr = 'A+'; }
        else if (percent >= 80) { gpa = 3.6; gradeStr = 'A'; }
        else if (percent >= 70) { gpa = 3.2; gradeStr = 'B+'; }
        else if (percent >= 60) { gpa = 2.8; gradeStr = 'B'; }
        else if (percent >= 50) { gpa = 2.4; gradeStr = 'C+'; }
        else if (percent >= 40) { gpa = 2.0; gradeStr = 'C'; }
        else if (percent >= 35) { gpa = 1.6; gradeStr = 'D'; }

        subjects.push({
          subjectName: m.classScheduleId?.subject || 'Unknown',
          obtained: m.marksObtained,
          total: m.totalMarks,
          gpa,
          gradeStr
        });
      });

      const finalPercentage = grandTotal > 0 ? ((totalObtained / grandTotal) * 100).toFixed(2) : 0;
      
      // Overall GPA approximation
      const finalGpa = subjects.length > 0 
        ? (subjects.reduce((sum, s) => sum + s.gpa, 0) / subjects.length).toFixed(2)
        : 0;

      map[student._id] = {
        student,
        subjects,
        totalObtained,
        grandTotal,
        finalPercentage,
        finalGpa,
        hasMarks: subjects.length > 0
      };
    });

    setResultsMap(map);
  };

  if (loading) return <div className="p-12 flex justify-center min-h-[50vh] items-center"><div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>;

  const validResults = Object.values(resultsMap).filter(r => r.hasMarks);

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Non-printable Controls Area */}
      <div className="print:hidden flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <AcademicCapIcon className="w-8 h-8 text-indigo-600" />
            Student Results & Marksheets
          </h1>
          <p className="text-slate-500 text-sm mt-1">Review calculated GPA, percentages, and print official marksheets.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <select 
            value={examType}
            onChange={(e) => setExamType(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-sm cursor-pointer"
          >
            <option value="First Term">First Term</option>
            <option value="Mid Term">Mid Term</option>
            <option value="Final Term">Final Term</option>
          </select>
          <select 
            value={selectedGradeKey}
            onChange={(e) => setSelectedGradeKey(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-sm cursor-pointer"
          >
            <option value="All">All Grades & Sections</option>
            {classesList.map(c => (
              <option key={`${c.grade}|${c.section}`} value={`${c.grade}|${c.section}`}>
                {c.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => window.print()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all"
          >
            <PrinterIcon className="w-5 h-5" /> Print Marksheets
          </button>
        </div>
      </div>

      {validResults.length === 0 ? (
        <div className="print:hidden p-16 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
          <DocumentTextIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700">No results compiled</h3>
          <p className="text-slate-400 text-sm mt-1">Teachers or Owner need to enter marks for this grade and exam type first.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {validResults.map(({ student, subjects, totalObtained, grandTotal, finalPercentage, finalGpa }) => (
            <div key={student._id} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 print:shadow-none print:border-none print:m-0 print:p-0 print:break-after-page">
              
               {/* Marksheet Header */}
              <div className="text-center mb-8 border-b-2 border-slate-900 pb-6">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <img src="/images/logo.png" alt="School Logo" className="w-16 h-16 object-contain" />
                  <div>
                    <h1 className="text-3xl font-black text-slate-900 uppercase tracking-widest">Everest View Secondary School</h1>
                    <p className="text-slate-500 text-xs font-semibold mt-1">Mechinagar -7, Jhapa, Nepal</p>
                  </div>
                </div>
                <p className="text-slate-600 font-bold uppercase tracking-widest">{examType} Examinations — Marksheet</p>
              </div>

              {/* Student Info */}
              <div className="flex justify-between items-end mb-8 bg-slate-50 p-6 rounded-2xl print:bg-transparent print:p-0 border border-slate-100 print:border-none">
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Student Name</p>
                  <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                    <UserIcon className="w-6 h-6 text-indigo-600 print:text-black" /> {student.name}
                  </h2>
                  <p className="text-sm font-bold text-slate-600">Roll No: {student.rollNumber || student._id.slice(-6).toUpperCase()}</p>
                  <p className="text-sm text-slate-600">Father's Name: <span className="font-semibold text-slate-800">{student.fatherName || 'N/A'}</span></p>
                  <p className="text-sm text-slate-600">Date of Birth (BS): <span className="font-semibold text-slate-800">{student.dob || 'N/A'}</span></p>
                  <p className="text-sm text-slate-600">Address: <span className="font-semibold text-slate-800">{student.address || 'N/A'}</span></p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Class / Grade</p>
                  <p className="text-xl font-black text-indigo-600 print:text-black">{student.grade} {student.section ? `(Sec ${student.section})` : ''}</p>
                </div>
              </div>

              {/* Marks Table */}
              <table className="w-full text-left border-collapse mb-8">
                <thead>
                  <tr className="bg-slate-900 text-white print:bg-slate-200 print:text-black">
                    <th className="px-6 py-3 font-bold border border-slate-900 print:border-slate-300">Subject</th>
                    <th className="px-6 py-3 font-bold border border-slate-900 print:border-slate-300 text-center">Full Marks</th>
                    <th className="px-6 py-3 font-bold border border-slate-900 print:border-slate-300 text-center">Marks Obtained</th>
                    <th className="px-6 py-3 font-bold border border-slate-900 print:border-slate-300 text-center">Grade</th>
                    <th className="px-6 py-3 font-bold border border-slate-900 print:border-slate-300 text-center">GPA</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((sub, idx) => (
                    <tr key={idx} className="border-b border-slate-200 print:border-slate-300">
                      <td className="px-6 py-3 font-bold text-slate-800 border-x border-slate-200 print:border-slate-300">{sub.subjectName}</td>
                      <td className="px-6 py-3 text-center border-x border-slate-200 print:border-slate-300 font-semibold">{sub.total}</td>
                      <td className="px-6 py-3 text-center border-x border-slate-200 print:border-slate-300 font-black text-indigo-600 print:text-black">{sub.obtained}</td>
                      <td className="px-6 py-3 text-center border-x border-slate-200 print:border-slate-300 font-bold text-emerald-600 print:text-black">{sub.gradeStr}</td>
                      <td className="px-6 py-3 text-center border-x border-slate-200 print:border-slate-300 font-bold">{sub.gpa.toFixed(1)}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 print:bg-slate-100 font-black text-slate-900 text-lg border border-slate-200 print:border-slate-300">
                    <td className="px-6 py-4 text-right border-x border-slate-200 print:border-slate-300">Grand Total</td>
                    <td className="px-6 py-4 text-center border-x border-slate-200 print:border-slate-300">{grandTotal}</td>
                    <td className="px-6 py-4 text-center border-x border-slate-200 print:border-slate-300 text-indigo-600 print:text-black">{totalObtained}</td>
                    <td className="px-6 py-4 border-x border-slate-200 print:border-slate-300" colSpan="2"></td>
                  </tr>
                </tbody>
              </table>

              {/* Final Result Summary */}
              <div className="grid grid-cols-2 gap-6 bg-indigo-50 p-6 rounded-2xl print:bg-transparent print:border print:border-slate-300">
                <div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Final Percentage</p>
                  <p className="text-3xl font-black text-indigo-600 print:text-black">{finalPercentage}%</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Overall GPA</p>
                  <p className="text-3xl font-black text-emerald-600 print:text-black">{finalGpa}</p>
                </div>
              </div>

              {/* Signatures */}
              <div className="mt-16 flex justify-between px-8">
                <div className="text-center">
                  <div className="w-40 border-b border-slate-400 mb-2"></div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Class Teacher</p>
                </div>
                <div className="text-center">
                  <div className="w-40 border-b border-slate-400 mb-2"></div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Principal</p>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
