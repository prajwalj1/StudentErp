'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  CalendarIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  PlusIcon, 
  UserGroupIcon,
  AcademicCapIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';
import { toNepaliDate, toLocalDateStr, getBsMonthName, getDaysInBsMonth, bsDateToAd, adDateToBs } from '@/lib/nepaliDate';
import { NepaliDatePicker } from 'react-bs-calender';
import 'react-bs-calender/styles.css';

const AttendancePage = () => {
  const { data: session, status } = useSession();
  const [classesList, setClassesList] = useState([]);
  const [selectedClassKey, setSelectedClassKey] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(toLocalDateStr());
  const [toast, setToast] = useState(null);

  // State for Add Student modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', grade: 'Grade 10', section: 'A', fatherName: '', fatherMobile: '', dob: '', address: '', attendance: 100 });

  const [view, setView] = useState('mark'); // 'mark' or 'history'
  const [history, setHistory] = useState([]);
  const today = new Date();
  const todayBs = adDateToBs(toLocalDateStr(today));
  const [viewMonth, setViewMonth] = useState(todayBs ? todayBs.month : (today.getMonth() + 1));
  const [viewYear, setViewYear] = useState(todayBs ? todayBs.year : today.getFullYear());

  useEffect(() => {
    if (status === 'authenticated') {
      fetchClassesAndData();
    }
  }, [status]);

  const fetchClassesAndData = async () => {
    setLoading(true);
    try {
      // Fetch classes to get dynamic grades and sections
      const classesRes = await fetch('/api/classes');
      let fetchedClasses = [];
      if (classesRes.ok) {
        fetchedClasses = await classesRes.json();
      }

      // Only show classes assigned to this teacher
      const teacherId = session?.user?.id;
      fetchedClasses = fetchedClasses.filter(c => {
        const tId = c.teacherId?._id?.toString();
        return tId === teacherId;
      });

      // Extract unique grade + section pairs (only the teacher's assigned classes)
      const pairsMap = new Map();
      fetchedClasses.forEach(c => {
        const g = c.grade || 'Grade 10';
        const s = c.section || '';
        const key = `${g}|${s}`;
        if (!pairsMap.has(key)) {
          pairsMap.set(key, { grade: g, section: s, label: `${g} ${s ? `(Sec ${s})` : ''}`.trim() });
        }
      });

      const uniqueClasses = Array.from(pairsMap.values());
      setClassesList(uniqueClasses);

      if (uniqueClasses.length === 0) {
        setSelectedClassKey('');
        setStudents([]);
        setHistory([]);
        setLoading(false);
        return;
      }

      const initialKey = `${uniqueClasses[0].grade}|${uniqueClasses[0].section}`;
      setSelectedClassKey(initialKey);

      // Now fetch students and history
      await fetchStudentsAndHistory(initialKey, uniqueClasses);
    } catch (error) {
      console.error("Error fetching classes:", error);
      setLoading(false);
    }
  };

  const fetchStudentsAndHistory = async (classKey, classesObjList = classesList) => {
    setLoading(true);
    try {
      const [currGrade, currSection] = classKey.split('|');
      
      const [studentsRes, historyRes] = await Promise.all([
        fetch('/api/students'),
        fetch('/api/attendance')
      ]);

      if (studentsRes.ok) {
        const allStudents = await studentsRes.json();
        const filtered = allStudents.filter(s => {
          if (s.status === 'graduated') return false;
          const sGrade = (s.grade || '').toLowerCase().trim();
          const tGrade = (currGrade || '').toLowerCase().trim();
          const sNum = sGrade.replace(/\D/g, '');
          const tNum = tGrade.replace(/\D/g, '');
          if (sNum !== tNum) return false;
          if (!currSection) return true;
          const sSec = (s.section || '').toLowerCase().trim();
          const tSec = (currSection || '').toLowerCase().trim();
          return sSec === tSec;
        });

        // Check if today's attendance already exists
        const todayStr = toLocalDateStr();
        let todayRecord = null;
        if (historyRes.ok) {
          const allHistory = await historyRes.clone().json();
          todayRecord = allHistory.find(h => {
            const hDate = toLocalDateStr(h.date);
            const hGrade = (h.grade || '').toLowerCase().trim();
            const tGrade = (currGrade || '').toLowerCase().trim();
            const hNum = hGrade.replace(/\D/g, '');
            const tNum = tGrade.replace(/\D/g, '');
            const gradeMatch = hNum === tNum;
            let sectionMatch = true;
            if (currSection) {
              const hSec = (h.section || '').toLowerCase().trim();
              const tSec = (currSection || '').toLowerCase().trim();
              sectionMatch = hSec === tSec;
            }
            return hDate === todayStr && gradeMatch && sectionMatch;
          });
        }

        const studentStatusMap = {};
        if (todayRecord) {
          todayRecord.students.forEach(s => {
            if (s.studentId) {
              studentStatusMap[s.studentId._id || s.studentId] = s.status;
            }
          });
        }

        setStudents(filtered.map(s => ({
          ...s,
          status: studentStatusMap[s._id] || 'Absent'
        })));
      }

      if (historyRes.ok) {
        const allHistory = await historyRes.json();
        const filteredHistory = allHistory.filter(h => {
          const hGrade = (h.grade || '').toLowerCase().trim();
          const tGrade = (currGrade || '').toLowerCase().trim();
          const hNum = hGrade.replace(/\D/g, '');
          const tNum = tGrade.replace(/\D/g, '');
          if (hNum !== tNum) return false;
          if (!currSection) return true;
          const hSec = (h.section || '').toLowerCase().trim();
          const tSec = (currSection || '').toLowerCase().trim();
          return hSec === tSec;
        });
        setHistory(filteredHistory);
      }
    } catch (error) {
      console.error("Error fetching students/history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClassKey && classesList.length > 0) {
      fetchStudentsAndHistory(selectedClassKey);
      const [g, s] = selectedClassKey.split('|');
      setFormData(prev => ({ ...prev, grade: g, section: s }));
    }
  }, [selectedClassKey]);

  const setAllStatus = (statusStr) => {
    setStudents(students.map(s => ({ ...s, status: statusStr })));
  };

  const toggleAttendance = (id) => {
    setStudents(students.map(s => {
      if (s._id === id) {
        return { ...s, status: s.status === 'Present' ? 'Absent' : 'Present' };
      }
      return s;
    }));
  };

  const submitAttendance = async () => {
    try {
      const [currGrade, currSection] = selectedClassKey.split('|');
      if (!currGrade) {
        setToast({ type: 'error', text: 'Please select a class first.' });
        setTimeout(() => setToast(null), 3000);
        return;
      }
      const todayStr = toLocalDateStr();
      const attDate = (date && date !== todayStr) ? date : todayStr;
      const selectedDate = new Date(attDate + 'T00:00:00');
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      if (selectedDate > todayStart) {
        setToast({ type: 'error', text: 'Cannot mark attendance for a future date.' });
        setTimeout(() => setToast(null), 3000);
        return;
      }
      const payload = {
        date: attDate,
        grade: currGrade,
        section: currSection,
        students: students.map(s => ({
          studentId: s._id,
          status: s.status || 'Absent' // Default unselected to Absent on submission
        }))
      };

      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setToast({ type: 'success', text: `Attendance for ${currGrade} ${currSection ? `(Sec ${currSection})` : ''} on ${toNepaliDate(attDate)} saved successfully!` });
        setTimeout(() => setToast(null), 3000);
        fetchStudentsAndHistory(selectedClassKey);
      } else {
        const err = await res.json();
        setToast({ type: 'error', text: err.error });
        setTimeout(() => setToast(null), 3000);
      }
    } catch (error) {
      console.error("Submit error:", error);
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowAddModal(false);
        const [currGrade, currSection] = selectedClassKey.split('|');
        setFormData({ name: '', grade: currGrade, section: currSection, fatherName: '', fatherMobile: '', dob: '', address: '', attendance: 100 });
        fetchStudentsAndHistory(selectedClassKey);
      } else {
        const errData = await res.json();
        alert(`Failed to add student: ${errData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error adding student:", error);
      alert("Network error: Could not reach the server.");
    }
  };

  const currentClassObj = classesList.find(c => `${c.grade}|${c.section}` === selectedClassKey) || { label: '' };

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100 gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 w-full sm:w-auto">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <ClipboardDocumentCheckIcon className="w-8 h-8 text-indigo-600" />
              Attendance Center
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Class: <span className="text-indigo-600 font-bold">{currentClassObj.label}</span>
            </p>
          </div>
        <div className="w-full flex justify-center">
  <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto max-w-full overflow-x-auto">
    
    <button
      onClick={() => setView('mark')}
      className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
        view === 'mark'
          ? 'bg-white text-indigo-600 shadow-sm'
          : 'text-slate-500 hover:text-slate-700'
      }`}
    >
      Mark Now
    </button>

    <button
      onClick={() => setView('history')}
      className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
        view === 'history'
          ? 'bg-white text-indigo-600 shadow-sm'
          : 'text-slate-500 hover:text-slate-700'
      }`}
    >
      Attendance Register
    </button>

  </div>
</div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <select 
            value={selectedClassKey}
            onChange={(e) => setSelectedClassKey(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none font-semibold text-slate-700 bg-slate-50 text-sm w-full sm:w-auto cursor-pointer"
          >
            {classesList.map(c => (
              <option key={`${c.grade}|${c.section}`} value={`${c.grade}|${c.section}`}>
                {c.label}
              </option>
            ))}
          </select>
          <NepaliDatePicker
            value={date ? new Date(date) : null}
            onChange={(d, nepaliStr) => {
              if (d) setDate(toLocalDateStr(d));
            }}
            locale="en"
            placeholder="YYYY/MM/DD"
            className="w-full sm:w-auto"
          />
          <button
            onClick={() => {
              const [currGrade, currSection] = selectedClassKey.split('|');
              setFormData({ name: '', grade: currGrade, section: currSection, fatherName: '', fatherMobile: '', dob: '', address: '', attendance: 100 });
              setShowAddModal(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 transition-all text-sm w-full sm:w-auto"
          >
            <PlusIcon className="w-5 h-5 flex-shrink-0" /> Add Student
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 min-h-[400px]">
        {loading ? (
          <div className="p-20 flex justify-center items-center min-h-[400px]">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : classesList.length === 0 ? (
          <div className="p-16 text-center">
            <UserGroupIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-700">No classes assigned</h3>
            <p className="text-slate-400 text-sm mt-1">You have not been assigned any classes. Contact the school owner to set up your class schedule.</p>
          </div>
        ) : view === 'mark' ? (
          <>
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 px-6">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {students.length} Students Listed
              </span>
              <div className="flex gap-4">
                <button onClick={() => setAllStatus('Present')} className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                  <CheckCircleIcon className="w-4 h-4" /> Mark All Present
                </button>
                <button onClick={() => setAllStatus('Absent')} className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1">
                  <XCircleIcon className="w-4 h-4" /> Mark All Absent
                </button>
              </div>
            </div>

            {students.length === 0 ? (
              <div className="p-16 text-center">
                <UserGroupIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-700">No students found in {currentClassObj.label}</h3>
                <p className="text-slate-400 text-sm mt-1 mb-6">Add students to this grade and section to start taking attendance.</p>
                <button
                  onClick={() => {
                    const [currGrade, currSection] = selectedClassKey.split('|');
        setFormData({ name: '', grade: currGrade, section: currSection, fatherName: '', fatherMobile: '', dob: '', address: '', attendance: 100 });
                    setShowAddModal(true);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-semibold inline-flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all text-sm"
                >
                  <PlusIcon className="w-5 h-5" /> Add First Student
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[10px] uppercase tracking-[0.2em]">
                      <th className="px-6 py-4 font-bold w-16">Mark</th>
                      <th className="px-6 py-4 font-bold">Student Details</th>
                      <th className="px-6 py-4 font-bold text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.map((student) => (
                      <tr key={student._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <input 
                            type="checkbox" 
                            checked={student.status === 'Present'}
                            onChange={() => toggleAttendance(student._id)}
                            className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm">
                              {student.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{student.name}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Roll: {student.rollNumber || student._id.slice(-4)}</p>
                              <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                                <span className="text-[10px] text-slate-500">Father: {student.fatherName || '-'}</span>
                                <span className="text-[10px] text-slate-500">Mob: {student.fatherMobile || '-'}</span>
                                <span className="text-[10px] text-slate-500">DOB: {student.dob || '-'}</span>
                                <span className="text-[10px] text-slate-500">Addr: {student.address || '-'}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            student.status === 'Present' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'
                          }`}>
                            {student.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {students.length > 0 && (
              <div className="p-6 sm:p-8 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center bg-slate-50 gap-4">
                <div className="space-x-6 flex items-center">
                   <div className="text-center">
                       <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Present</p>
                       <p className="text-xl font-black text-blue-600">{students.filter(s => s.status === 'Present').length}</p>
                   </div>
                   <div className="w-px h-8 bg-slate-200"></div>
                   <div className="text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Absent</p>
                      <p className="text-xl font-black text-red-600">{students.filter(s => s.status === 'Absent').length}</p>
                   </div>
                </div>
                <button 
                  onClick={submitAttendance}
                  className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white px-10 py-4 rounded-2xl font-black text-sm shadow-xl transition-all hover:scale-[1.02] active:scale-95"
                >
                  Confirm & Save Records
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                Attendance Register — {currentClassObj.label}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (viewMonth === 1) {
                      setViewMonth(12);
                      setViewYear(y => y - 1);
                    } else {
                      setViewMonth(m => m - 1);
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  ← Prev
                </button>
                <span className="text-sm font-bold text-slate-800 min-w-[150px] text-center">
                  {getBsMonthName(viewMonth - 1)} {viewYear}
                </span>
                <button
                  onClick={() => {
                    if (viewMonth === 12) {
                      setViewMonth(1);
                      setViewYear(y => y + 1);
                    } else {
                      setViewMonth(m => m + 1);
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Next →
                </button>
              </div>
            </div>

            {(() => {
              const monthRecords = history.filter(rec => {
                const bs = adDateToBs(toLocalDateStr(rec.date));
                return bs && bs.year === viewYear && bs.month === viewMonth;
              });

              if (monthRecords.length === 0) {
                return (
                  <p className="text-slate-400 text-sm p-8 text-center bg-slate-50 rounded-2xl">
                    No attendance records for {getBsMonthName(viewMonth - 1)} {viewYear}.
                    Mark attendance in the "Mark Now" tab.
                  </p>
                );
              }

              const daysInMonth = getDaysInBsMonth(viewYear, viewMonth);
              const attendanceMap = {};
              monthRecords.forEach(rec => {
                const dateStr = toLocalDateStr(rec.date);
                attendanceMap[dateStr] = {};
                rec.students.forEach(s => {
                  if (s.studentId) {
                    attendanceMap[dateStr][s.studentId._id] = s.status;
                  }
                });
              });

              const studentMap = new Map();
              monthRecords.forEach(rec => {
                rec.students.forEach(s => {
                  if (s.studentId && !studentMap.has(s.studentId._id)) {
                    studentMap.set(s.studentId._id, s.studentId.name || 'Unknown');
                  }
                });
              });
              // Remove promoted students (not in current grade's student list)
              const currentIds = new Set(students.map(s => s._id));
              for (const id of studentMap.keys()) {
                if (!currentIds.has(id)) {
                  studentMap.delete(id);
                }
              }

              const gridData = Array.from(studentMap.entries()).map(([id, name]) => {
                const days = [];
                for (let d = 1; d <= daysInMonth; d++) {
                  const dateStr = bsDateToAd(viewYear, viewMonth, d);
                  days.push({ date: d, status: attendanceMap[dateStr]?.[id] || null });
                }
                const present = days.filter(d => d.status === 'Present').length;
                const absent = days.filter(d => d.status === 'Absent').length;
                return { id, name, days, present, absent };
              });

              return (
                <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                  <table className="w-full text-left border-collapse" style={{ minWidth: `${daysInMonth * 40 + 280}px` }}>
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider sticky left-0 bg-slate-50 z-10 min-w-[180px]">
                          Student
                        </th>
                        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                          const dayAdStr = bsDateToAd(viewYear, viewMonth, day);
                          const dayOfWeek = new Date(dayAdStr).getDay();
                          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                          return (
                            <th key={day} className={`px-1.5 py-3 text-center text-[9px] font-bold w-8 ${isWeekend ? 'text-red-300' : 'text-slate-500'} uppercase tracking-wider`}>
                              {day}
                            </th>
                          );
                        })}
                        <th className="px-2 py-3 text-[9px] font-bold text-emerald-600 uppercase tracking-wider text-center sticky right-[60px] bg-slate-50 z-10 min-w-[32px]">
                          P
                        </th>
                        <th className="px-2 py-3 text-[9px] font-bold text-red-600 uppercase tracking-wider text-center sticky right-[30px] bg-slate-50 z-10 min-w-[32px]">
                          A
                        </th>
                        <th className="px-2 py-3 text-[9px] font-bold text-slate-600 uppercase tracking-wider text-center sticky right-0 bg-slate-50 z-10 min-w-[40px]">
                          %
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {gridData.map(student => {
                        const total = student.present + student.absent;
                        const pct = total > 0 ? Math.round((student.present / total) * 100) : 0;
                        return (
                          <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-4 py-2 text-xs font-bold text-slate-900 sticky left-0 bg-white z-10 border-r border-slate-50">
                              {student.name}
                            </td>
                            {student.days.map(day => (
                              <td key={day.date} className="px-1.5 py-2 text-center">
                                {day.status === 'Present' ? (
                                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-black">
                                    P
                                  </span>
                                ) : day.status === 'Absent' ? (
                                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-100 text-red-700 text-[9px] font-black">
                                    A
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center justify-center w-5 h-5 text-slate-200 text-[9px] font-bold">
                                    -
                                  </span>
                                )}
                              </td>
                            ))}
                            <td className="px-2 py-2 text-center text-xs font-bold text-emerald-600 sticky right-[60px] bg-white z-10 border-l border-slate-50">
                              {student.present}
                            </td>
                            <td className="px-2 py-2 text-center text-xs font-bold text-red-600 sticky right-[30px] bg-white z-10">
                              {student.absent}
                            </td>
                            <td className="px-2 py-2 text-center text-xs font-bold text-slate-700 sticky right-0 bg-white z-10">
                              {pct}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0 rounded-t-3xl">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <AcademicCapIcon className="w-6 h-6 text-indigo-600" />
                Add New Student
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50 transition-all">
                <PlusIcon className="w-6 h-6 rotate-45" />
              </button>
            </div>
            <form id="add-student-form" onSubmit={handleAddStudent} className="p-6 space-y-5 overflow-y-auto">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:bg-white outline-none transition-all text-sm font-medium"
                  placeholder="e.g. Aarav Sharma"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Grade / Class</label>
                  <select
                    required
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:bg-white outline-none transition-all text-sm font-semibold text-slate-700"
                  >
                    {['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'].map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Section</label>
                  <input
                    type="text"
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:bg-white outline-none transition-all text-sm font-medium"
                    placeholder="e.g. A, B"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Father's Name</label>
                  <input type="text" value={formData.fatherName} onChange={e => setFormData({ ...formData, fatherName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:bg-white outline-none transition-all text-sm font-medium"
                    placeholder="e.g. Ram Sharma" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Father's Mobile</label>
                  <input type="text" value={formData.fatherMobile} onChange={e => setFormData({ ...formData, fatherMobile: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:bg-white outline-none transition-all text-sm font-medium"
                    placeholder="e.g. 98XXXXXXXX" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 items-start">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Date of Birth (Nepali)</label>
                  <NepaliDatePicker
                    value={formData.dob ? formData.dob.replace(/-/g, '/') : ''}
                    onChange={(date, nepaliDateString) => {
                      setFormData({ ...formData, dob: nepaliDateString || '' });
                    }}
                    locale="en"
                    placeholder="YYYY/MM/DD"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Address</label>
                  <input type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:bg-white outline-none transition-all text-sm font-medium"
                    placeholder="e.g. Kathmandu, Nepal" />
                </div>
              </div>
            </form>
            <div className="p-6 pt-4 flex gap-3 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-all text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={() => {
                  const form = document.querySelector('#add-student-form');
                  if (form) form.requestSubmit();
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all text-sm"
              >
                Save Student
              </button>
            </div>
          </div>
        </div>
      )}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[200] px-6 py-3 rounded-2xl shadow-2xl text-sm font-bold text-white transition-all animate-float ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {toast.text}
        </div>
      )}
    </div>
  );
};

export default AttendancePage;
