'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  CalendarDaysIcon, FunnelIcon, CheckCircleIcon, XCircleIcon,
  ClipboardDocumentCheckIcon, UserGroupIcon
} from '@heroicons/react/24/outline';
import { toNepaliDate, toLocalDateStr, getBsMonthName, getDaysInBsMonth, bsDateToAd, adDateToBs } from '@/lib/nepaliDate';
import { NepaliDatePicker } from 'react-bs-calender';
import 'react-bs-calender/styles.css';

export default function OwnerAttendancePage() {
  const { data: session, status } = useSession();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [classesList, setClassesList] = useState([]);
  const [selectedClassKey, setSelectedClassKey] = useState('');
  const today = new Date();
  const todayBs = adDateToBs(toLocalDateStr(today));
  const [viewMonth, setViewMonth] = useState(todayBs ? todayBs.month : (today.getMonth() + 1));
  const [viewYear, setViewYear] = useState(todayBs ? todayBs.year : today.getFullYear());
  const [view, setView] = useState('register');
  const [students, setStudents] = useState([]);
  const [date, setDate] = useState(toLocalDateStr(today));
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchAttendance();
    }
  }, [status]);

  const fetchAttendance = async () => {
    try {
      const [studentsRes, attRes] = await Promise.all([
        fetch('/api/students'),
        fetch('/api/attendance')
      ]);

      if (attRes.ok) {
        const data = await attRes.json();
        setRecords(data);
      }

      const pairsMap = new Map();
      if (studentsRes.ok) {
        const allStudents = await studentsRes.json();
        allStudents.filter(s => s.status !== 'graduated').forEach(s => {
          const g = s.grade || '';
          const sec = s.section || '';
          if (!g) return;
          const key = `${g}|${sec}`;
          if (!pairsMap.has(key)) {
            pairsMap.set(key, { grade: g, section: sec, label: `${g}${sec ? ` (Sec ${sec})` : ''}` });
          }
        });
      }
      const uniqueClasses = Array.from(pairsMap.values()).sort((a, b) => {
        const aNum = parseInt(a.grade.replace(/\D/g, ''), 10) || 0;
        const bNum = parseInt(b.grade.replace(/\D/g, ''), 10) || 0;
        if (aNum !== bNum) return aNum - bNum;
        return a.section.localeCompare(b.section);
      });
      setClassesList(uniqueClasses);
      if (uniqueClasses.length > 0 && !selectedClassKey) {
        setSelectedClassKey(`${uniqueClasses[0].grade}|${uniqueClasses[0].section}`);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (classKey) => {
    try {
      const [currGrade, currSection] = classKey.split('|');
      const res = await fetch('/api/students');
      if (res.ok) {
        const allStudents = await res.json();
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
        const markDateStr = date;
        const existingRecord = records.find(r => {
          const rKey = `${r.grade}|${r.section || ''}`;
          const rDate = toLocalDateStr(r.date);
          return rKey === classKey && rDate === markDateStr;
        });
        setStudents(filtered.map(s => ({
          ...s,
          status: existingRecord?.students.find(st => st.studentId?._id === s._id)?.status || 'Absent'
        })));
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  useEffect(() => {
    if (selectedClassKey) {
      fetchStudents(selectedClassKey);
    }
  }, [selectedClassKey, date]);

  const toggleAttendance = (id) => {
    setStudents(students.map(s => {
      if (s._id === id) {
        return { ...s, status: s.status === 'Present' ? 'Absent' : 'Present' };
      }
      return s;
    }));
  };

  const setAllStatus = (statusStr) => {
    setStudents(students.map(s => ({ ...s, status: statusStr })));
  };

  const submitAttendance = async () => {
    setSaving(true);
    try {
      const [currGrade, currSection] = selectedClassKey.split('|');
      if (!currGrade) {
        setToast({ type: 'error', text: 'Please select a class first.' });
        setSaving(false);
        return;
      }
      const todayStr = toLocalDateStr();
      const attDate = (date && date !== todayStr) ? date : todayStr;
      const selectedDate = new Date(attDate + 'T00:00:00');
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      if (selectedDate > todayStart) {
        setToast({ type: 'error', text: 'Cannot mark attendance for a future date.' });
        setSaving(false);
        return;
      }
      const payload = {
        date: attDate,
        grade: currGrade,
        section: currSection,
        students: students.map(s => ({
          studentId: s._id,
          status: s.status || 'Absent'
        }))
      };
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setToast({ type: 'success', text: `Attendance saved for ${currGrade}${currSection ? ` (Sec ${currSection})` : ''} on ${toNepaliDate(attDate)}!` });
        setTimeout(() => setToast(null), 3000);
        fetchAttendance();
        setView('register');
      } else {
        const err = await res.json();
        setToast({ type: 'error', text: err.error || 'Failed to save attendance.' });
        setTimeout(() => setToast(null), 3000);
      }
    } catch (error) {
      console.error("Submit error:", error);
    } finally {
      setSaving(false);
    }
  };

  const filteredRecords = records.filter(r => {
    const key = `${r.grade}|${r.section || ''}`;
    const bs = adDateToBs(toLocalDateStr(r.date));
    return key === selectedClassKey && bs && bs.year === viewYear && bs.month === viewMonth;
  });

  const daysInMonth = getDaysInBsMonth(viewYear, viewMonth);
  const attendanceMap = {};
  filteredRecords.forEach(rec => {
    const dateStr = toLocalDateStr(rec.date);
    attendanceMap[dateStr] = {};
    rec.students.forEach(s => {
      if (s.studentId) {
        attendanceMap[dateStr][s.studentId._id] = s.status;
      }
    });
  });
  const studentMap = new Map();
  filteredRecords.forEach(rec => {
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

  const currentClassObj = classesList.find(c => `${c.grade}|${c.section}` === selectedClassKey) || { label: '' };

  if (loading) return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;

  if (classesList.length === 0) {
    return (
      <div className="p-4 sm:p-8 space-y-6">
        <div className="bg-white p-16 rounded-3xl text-center text-slate-400 border border-slate-100">
          <UserGroupIcon className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="font-semibold">No class schedules found.</p>
          <p className="text-sm mt-1">Create class schedules with teacher assignments in the Classes page first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <ClipboardDocumentCheckIcon className="w-7 h-7 text-blue-600" />
            Attendance Center
          </h1>
          <p className="text-slate-500 text-sm mt-1">View registers and mark attendance.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setView('register')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                view === 'register' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Attendance Register
            </button>
            <button
              onClick={() => setView('mark')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                view === 'mark' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Mark Attendance
            </button>
          </div>
          <FunnelIcon className="w-4 h-4 text-slate-400 ml-2" />
          <select
            value={selectedClassKey}
            onChange={(e) => setSelectedClassKey(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none font-semibold text-slate-700 bg-slate-50 text-sm cursor-pointer"
          >
            {classesList.map(c => (
              <option key={`${c.grade}|${c.section}`} value={`${c.grade}|${c.section}`}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {view === 'register' ? (
        <>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => {
                if (viewMonth === 1) {
                  setViewMonth(12);
                  setViewYear(y => y - 1);
                } else {
                  setViewMonth(m => m - 1);
                }
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
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
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              Next →
            </button>
          </div>

          {filteredRecords.length === 0 ? (
            <div className="bg-white p-16 rounded-3xl text-center text-slate-400 border border-slate-100">
              <CalendarDaysIcon className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="font-semibold">No attendance records for this class and month.</p>
            </div>
          ) : gridData.length === 0 ? (
            <div className="bg-white p-16 rounded-3xl text-center text-slate-400 border border-slate-100">
              <p className="font-semibold">No student data found in records.</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse" style={{ minWidth: `${daysInMonth * 40 + 280}px` }}>
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider sticky left-0 bg-slate-50 z-10 min-w-[180px]">Student</th>
                      {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                        const dayAdStr = bsDateToAd(viewYear, viewMonth, day);
                        const dayOfWeek = new Date(dayAdStr).getDay();
                        return (
                          <th key={day} className={`px-1.5 py-3 text-center text-[9px] font-bold w-8 ${dayOfWeek === 0 || dayOfWeek === 6 ? 'text-red-300' : 'text-slate-500'} uppercase tracking-wider`}>
                            {day}
                          </th>
                        );
                      })}
                      <th className="px-2 py-3 text-[9px] font-bold text-emerald-600 uppercase tracking-wider text-center sticky right-[60px] bg-slate-50 z-10 min-w-[32px]">P</th>
                      <th className="px-2 py-3 text-[9px] font-bold text-red-600 uppercase tracking-wider text-center sticky right-[30px] bg-slate-50 z-10 min-w-[32px]">A</th>
                      <th className="px-2 py-3 text-[9px] font-bold text-slate-600 uppercase tracking-wider text-center sticky right-0 bg-slate-50 z-10 min-w-[40px]">%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {gridData.map(student => {
                      const total = student.present + student.absent;
                      const pct = total > 0 ? Math.round((student.present / total) * 100) : 0;
                      return (
                        <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-2 text-xs font-bold text-slate-900 sticky left-0 bg-white z-10 border-r border-slate-50">{student.name}</td>
                          {student.days.map(day => (
                            <td key={day.date} className="px-1.5 py-2 text-center">
                              {day.status === 'Present' ? (
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-black">P</span>
                              ) : day.status === 'Absent' ? (
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-100 text-red-700 text-[9px] font-black">A</span>
                              ) : (
                                <span className="inline-flex items-center justify-center w-5 h-5 text-slate-200 text-[9px] font-bold">-</span>
                              )}
                            </td>
                          ))}
                          <td className="px-2 py-2 text-center text-xs font-bold text-emerald-600 sticky right-[60px] bg-white z-10 border-l border-slate-50">{student.present}</td>
                          <td className="px-2 py-2 text-center text-xs font-bold text-red-600 sticky right-[30px] bg-white z-10">{student.absent}</td>
                          <td className="px-2 py-2 text-center text-xs font-bold text-slate-700 sticky right-0 bg-white z-10">{pct}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100">
          <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {currentClassObj.label}
              </span>
              <span className="text-xs text-slate-300">|</span>
              <NepaliDatePicker
                value={date ? new Date(date) : null}
                onChange={(d, nepaliStr) => {
                  if (d) setDate(toLocalDateStr(d));
                }}
                locale="en"
                placeholder="YYYY/MM/DD"
              />
            </div>
            <div className="flex gap-3">
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
              <h3 className="text-lg font-bold text-slate-700">No students found</h3>
              <p className="text-slate-400 text-sm mt-1">No students in {currentClassObj.label}.</p>
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
            <div className="p-4 sm:p-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center bg-slate-50 gap-4">
              <div className="space-x-6 flex items-center">
                <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Present</p>
                  <p className="text-xl font-black text-blue-600">{students.filter(s => s.status === 'Present').length}</p>
                </div>
                <div className="w-px h-8 bg-slate-200" />
                <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Absent</p>
                  <p className="text-xl font-black text-red-600">{students.filter(s => s.status === 'Absent').length}</p>
                </div>
              </div>
              <button
                onClick={submitAttendance}
                disabled={saving}
                className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white px-10 py-4 rounded-2xl font-black text-sm shadow-xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Confirm & Save Records'}
              </button>
            </div>
          )}
        </div>
      )}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[200] px-6 py-3 rounded-2xl shadow-2xl text-sm font-bold text-white transition-all animate-float ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {toast.text}
        </div>
      )}
    </div>
  );
}
