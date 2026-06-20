'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  CalendarDaysIcon, ClipboardDocumentCheckIcon, UserGroupIcon,
  CheckCircleIcon, XCircleIcon, ChartBarIcon,
  CheckIcon, ArrowPathIcon, ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { toNepaliDate, toLocalDateStr, getBsMonthName, getDaysInBsMonth, bsDateToAd, adDateToBs } from '@/lib/nepaliDate';
import { NepaliDatePicker } from 'react-bs-calender';
import 'react-bs-calender/styles.css';

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

function Badge({ children, color = 'slate' }) {
  const colors = {
    slate: 'bg-slate-100 text-slate-600', emerald: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700', red: 'bg-red-100 text-red-700',
    blue: 'bg-blue-100 text-blue-700', indigo: 'bg-indigo-100 text-indigo-700',
  };
  return <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${colors[color]}`}>{children}</span>;
}

function Toast({ toast, onClose }) {
  useEffect(() => { if (toast) { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); } }, [toast, onClose]);
  if (!toast) return null;
  return (
    <div className={`fixed bottom-6 right-6 z-[200] flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold text-white shadow-2xl animate-[slideUp_0.3s_ease-out] ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
      {toast.type === 'success' ? <CheckCircleIcon className="h-5 w-5" /> : <ExclamationTriangleIcon className="h-5 w-5" />}
      {toast.text}
    </div>
  );
}

export default function AttendancePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [classesList, setClassesList] = useState([]);
  const [selectedClassKey, setSelectedClassKey] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(toLocalDateStr());
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);
  const [attendanceSaved, setAttendanceSaved] = useState(false);

  const [view, setView] = useState('mark');
  const [history, setHistory] = useState([]);
  const today = new Date();
  const todayBs = adDateToBs(toLocalDateStr(today));
  const [viewMonth, setViewMonth] = useState(todayBs ? todayBs.month : (today.getMonth() + 1));
  const [viewYear, setViewYear] = useState(todayBs ? todayBs.year : today.getFullYear());

  const showToast = (type, text) => setToast({ type, text });

  useEffect(() => {
    if (status === 'unauthenticated' || (session && session.user.role !== 'TEACHER')) router.replace('/login');
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated') fetchClassesAndData();
  }, [status]);

  const fetchClassesAndData = async () => {
    setLoading(true);
    try {
      const classesRes = await fetch('/api/classes');
      let fetchedClasses = [];
      if (classesRes.ok) fetchedClasses = await classesRes.json();
      const teacherId = session?.user?.id;
      fetchedClasses = fetchedClasses.filter(c => c.teacherId?._id?.toString() === teacherId);
      const pairsMap = new Map();
      fetchedClasses.forEach(c => {
        const g = c.grade || 'Grade 10';
        const s = c.section || '';
        const key = `${g}|${s}`;
        if (!pairsMap.has(key)) pairsMap.set(key, { grade: g, section: s, label: `${g} ${s ? `(Sec ${s})` : ''}`.trim() });
      });
      const uniqueClasses = Array.from(pairsMap.values());
      setClassesList(uniqueClasses);
      if (uniqueClasses.length === 0) { setSelectedClassKey(''); setStudents([]); setHistory([]); setLoading(false); return; }
      const initialKey = `${uniqueClasses[0].grade}|${uniqueClasses[0].section}`;
      setSelectedClassKey(initialKey);
      await fetchStudentsAndHistory(initialKey, uniqueClasses);
    } catch (e) { console.error(e) } finally { setLoading(false); }
  };

  const fetchStudentsAndHistory = async (classKey) => {
    setLoading(true);
    try {
      const [currGrade, currSection] = classKey.split('|');
      const [studentsRes, historyRes] = await Promise.all([fetch('/api/students'), fetch('/api/attendance')]);
      if (studentsRes.ok) {
        const allStudents = await studentsRes.json();
        const filtered = allStudents.filter(s => {
          if (s.status === 'graduated') return false;
          const sNum = (s.grade || '').replace(/\D/g, '');
          const tNum = (currGrade || '').replace(/\D/g, '');
          if (sNum !== tNum) return false;
          if (!currSection) return true;
          return (s.section || '').toLowerCase().trim() === currSection.toLowerCase().trim();
        });
        const targetDate = date || toLocalDateStr();
        let todayRecord = null;
        if (historyRes.ok) {
          const allHistory = await historyRes.clone().json();
          todayRecord = allHistory.find(h => {
            const hDate = toLocalDateStr(h.date);
            const hNum = (h.grade || '').replace(/\D/g, '');
            const tN = (currGrade || '').replace(/\D/g, '');
            const gradeMatch = hNum === tN;
            let sectionMatch = true;
            if (currSection) sectionMatch = (h.section || '').toLowerCase().trim() === currSection.toLowerCase().trim();
            return hDate === targetDate && gradeMatch && sectionMatch;
          });
        }
        const studentStatusMap = {};
        if (todayRecord) {
          todayRecord.students.forEach(s => { if (s.studentId) studentStatusMap[s.studentId._id || s.studentId] = s.status; });
        }
        setAttendanceSaved(!!todayRecord);
        setStudents(filtered.map(s => ({ ...s, status: studentStatusMap[s._id] || 'Absent' })));
      }
      if (historyRes.ok) {
        const allHistory = await historyRes.json();
        const filteredHistory = allHistory.filter(h => {
          const hNum = (h.grade || '').replace(/\D/g, '');
          const tNum = (currGrade || '').replace(/\D/g, '');
          if (hNum !== tNum) return false;
          if (!currSection) return true;
          return (h.section || '').toLowerCase().trim() === currSection.toLowerCase().trim();
        });
        setHistory(filteredHistory);
      }
    } catch (e) { console.error(e) } finally { setLoading(false); }
  };

  useEffect(() => {
    if (selectedClassKey && classesList.length > 0) {
      fetchStudentsAndHistory(selectedClassKey);
    }
  }, [selectedClassKey, date]);

  const setAllStatus = (statusStr) => setStudents(students.map(s => ({ ...s, status: statusStr })));

  const toggleAttendance = (id) => {
    setStudents(students.map(s => s._id === id ? { ...s, status: s.status === 'Present' ? 'Absent' : 'Present' } : s));
  };

  const submitAttendance = async () => {
    setSaving(true);
    try {
      const [currGrade, currSection] = selectedClassKey.split('|');
      if (!currGrade) { showToast('error', 'Please select a class first.'); setSaving(false); return; }
      const attDate = date || toLocalDateStr();
      if (attDate > toLocalDateStr()) { showToast('error', 'Cannot mark future date.'); setSaving(false); return; }
      const payload = { date: attDate, grade: currGrade, section: currSection, students: students.map(s => ({ studentId: s._id, status: s.status || 'Absent' })) };
      const res = await fetch('/api/attendance', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      if (res.ok) { showToast('success', `Attendance saved for ${currGrade}${currSection ? ` (Sec ${currSection})` : ''} on ${toNepaliDate(attDate)}!`); fetchStudentsAndHistory(selectedClassKey); }
      else { const err = await res.json(); showToast('error', err.error); }
    } catch (e) { console.error(e) } finally { setSaving(false); }
  };

  const currentClassObj = classesList.find(c => `${c.grade}|${c.section}` === selectedClassKey) || { label: '' };
  const presentCount = students.filter(s => s.status === 'Present').length;
  const absentCount = students.filter(s => s.status === 'Absent').length;

  if (loading && classesList.length === 0) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-blue-600 border-t-transparent" />
    </div>
  );

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50/80 via-white to-blue-50/20">
      <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6 lg:p-8">

        {/* ─── Header ─── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 sm:p-6 shadow-xl">
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                <ClipboardDocumentCheckIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white">Attendance Center</h1>
                <p className="text-xs text-slate-400">Mark and manage daily attendance</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex bg-white/10 backdrop-blur-sm rounded-xl p-0.5">
                <button onClick={() => setView('mark')}
                  className={`px-4 py-2 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${view === 'mark' ? 'bg-white text-blue-600 shadow-sm' : 'text-white/60 hover:text-white'}`}>
                  <ClipboardDocumentCheckIcon className="h-3.5 w-3.5 inline mr-1.5 -mt-0.5" />
                  Mark
                </button>
                <button onClick={() => setView('history')}
                  className={`px-4 py-2 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${view === 'history' ? 'bg-white text-blue-600 shadow-sm' : 'text-white/60 hover:text-white'}`}>
                  <CalendarDaysIcon className="h-3.5 w-3.5 inline mr-1.5 -mt-0.5" />
                  Register
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Stats Row ─── */}
        {view === 'mark' && students.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatBox icon={UserGroupIcon} label="Students" value={students.length} color="blue" />
            <StatBox icon={CheckCircleIcon} label="Present" value={presentCount} color="emerald" />
            <StatBox icon={XCircleIcon} label="Absent" value={absentCount} color="amber" />
            <StatBox icon={ChartBarIcon} label="Attendance %" value={students.length > 0 ? `${Math.round((presentCount / students.length) * 100)}%` : '\u2014'} color="indigo" />
          </div>
        )}

        {/* ─── Controls ─── */}
        <div className="flex flex-wrap items-center gap-3">
          <select value={selectedClassKey} onChange={(e) => setSelectedClassKey(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-600 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100 cursor-pointer min-w-[160px]">
            {classesList.map(c => (
              <option key={`${c.grade}|${c.section}`} value={`${c.grade}|${c.section}`}>{c.label}</option>
            ))}
          </select>
          {view === 'mark' && (
            <>
              <NepaliDatePicker value={date ? new Date(date) : null}
                onChange={(d) => { if (d) setDate(toLocalDateStr(d)); }}
                locale="en" placeholder="YYYY/MM/DD" />

            </>
          )}
        </div>

        {/* ─── Content ─── */}
        {classesList.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-sm">
            <UserGroupIcon className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <h3 className="font-bold text-slate-700">No classes assigned</h3>
            <p className="text-sm text-slate-400 mt-1">Contact the school owner to set up your class schedule.</p>
          </div>
        ) : view === 'mark' ? (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* Mark Attendance Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4">
              <div className="flex items-center gap-3">
                <Badge color="blue">{currentClassObj.label}</Badge>
                {attendanceSaved && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-bold text-emerald-700">
                    <CheckIcon className="h-3.5 w-3.5" /> Done
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setAllStatus('Present')}
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-[10px] font-bold text-emerald-600 transition-all hover:bg-emerald-100">
                  <CheckCircleIcon className="h-3.5 w-3.5" /> All Present
                </button>
                <button onClick={() => setAllStatus('Absent')}
                  className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-[10px] font-bold text-red-600 transition-all hover:bg-red-100">
                  <XCircleIcon className="h-3.5 w-3.5" /> All Absent
                </button>
              </div>
            </div>

            {students.length === 0 ? (
              <div className="p-16 text-center">
                <UserGroupIcon className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                <h3 className="font-bold text-slate-700">No students found</h3>
                <p className="text-sm text-slate-400 mt-1">No students are enrolled in this grade and section. Contact the owner to add students.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="px-5 py-3.5 w-14 text-center">Mark</th>
                        <th className="px-5 py-3.5">Student</th>
                        <th className="px-5 py-3.5 hidden sm:table-cell">Roll</th>
                        <th className="px-5 py-3.5 text-center w-28">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {students.map(student => (
                        <tr key={student._id} className="group transition-colors hover:bg-slate-50/50 cursor-pointer" onClick={() => toggleAttendance(student._id)}>
                          <td className="px-5 py-3.5 text-center">
                            <div className={`mx-auto flex h-6 w-6 items-center justify-center rounded-lg border-2 transition-all ${student.status === 'Present' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 bg-white group-hover:border-slate-400'}`}>
                              {student.status === 'Present' && <CheckIcon className="h-3.5 w-3.5 text-emerald-600 font-bold" />}
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white shadow-sm">
                                {student.name.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-900">{student.name}</p>
                                <div className="flex flex-wrap gap-x-3 text-[10px] text-slate-400">
                                  <span>Father: {student.fatherName || '-'}</span>
                                  <span>Mob: {student.fatherMobile || '-'}</span>
                                  <span className="hidden lg:inline">DOB: {student.dob || '-'}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 hidden sm:table-cell">
                            <span className="text-sm font-medium text-slate-500">{student.rollNumber || student._id.slice(-4)}</span>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold ${
                              student.status === 'Present' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {student.status === 'Present' ? <CheckCircleIcon className="h-3.5 w-3.5" /> : <XCircleIcon className="h-3.5 w-3.5" />}
                              {student.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col gap-4 border-t border-slate-100 bg-gradient-to-r from-slate-50 to-white p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-5">
                    <div className="text-center">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Present</p>
                      <p className="text-xl font-black text-emerald-600">{presentCount}</p>
                    </div>
                    <div className="h-8 w-px bg-slate-200" />
                    <div className="text-center">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Absent</p>
                      <p className="text-xl font-black text-red-600">{absentCount}</p>
                    </div>
                    <div className="h-8 w-px bg-slate-200" />
                    <div className="text-center">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total</p>
                      <p className="text-xl font-black text-slate-900">{students.length}</p>
                    </div>
                  </div>
                  <button onClick={submitAttendance} disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-8 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-slate-800 hover:scale-[1.02] active:scale-95 disabled:opacity-50">
                    {saving ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <CheckCircleIcon className="h-4 w-4" />}
                    {saving ? 'Saving...' : 'Confirm & Save'}
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          /* ─── Register View ─── */
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4">
              <Badge color="blue">{currentClassObj.label}</Badge>
              <div className="flex items-center gap-2">
                <button onClick={() => { if (viewMonth === 1) { setViewMonth(12); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); }}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-bold text-slate-600 transition-all hover:bg-slate-50">{'\u2190'} Prev</button>
                <span className="text-sm font-bold text-slate-800 min-w-[140px] text-center">{getBsMonthName(viewMonth - 1)} {viewYear}</span>
                <button onClick={() => { if (viewMonth === 12) { setViewMonth(1); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); }}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-bold text-slate-600 transition-all hover:bg-slate-50">Next {'\u2192'}</button>
              </div>
            </div>

            {(() => {
              const monthRecords = history.filter(rec => {
                const bs = adDateToBs(toLocalDateStr(rec.date));
                return bs && bs.year === viewYear && bs.month === viewMonth;
              });
              if (monthRecords.length === 0) {
                return <p className="p-10 text-center text-sm text-slate-400">No attendance records for {getBsMonthName(viewMonth - 1)} {viewYear}.</p>;
              }
              const daysInMonth = getDaysInBsMonth(viewYear, viewMonth);
              const attendanceMap = {};
              monthRecords.forEach(rec => {
                const dateStr = toLocalDateStr(rec.date);
                attendanceMap[dateStr] = {};
                rec.students.forEach(s => { if (s.studentId) attendanceMap[dateStr][s.studentId._id] = s.status; });
              });
              const studentMap = new Map();
              monthRecords.forEach(rec => { rec.students.forEach(s => { if (s.studentId && !studentMap.has(s.studentId._id)) studentMap.set(s.studentId._id, s.studentId.name || 'Unknown'); }); });
              const currentIds = new Set(students.map(s => s._id));
              for (const id of studentMap.keys()) { if (!currentIds.has(id)) studentMap.delete(id); }
              const gridData = Array.from(studentMap.entries()).map(([id, name]) => {
                const days = [];
                for (let d = 1; d <= daysInMonth; d++) days.push({ date: d, status: attendanceMap[bsDateToAd(viewYear, viewMonth, d)]?.[id] || null });
                const present = days.filter(d => d.status === 'Present').length;
                const absent = days.filter(d => d.status === 'Absent').length;
                return { id, name, days, present, absent };
              });

              return (
                <div className="overflow-x-auto">
                  <table className="w-full text-left" style={{ minWidth: `${daysInMonth * 36 + 280}px` }}>
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider sticky left-0 bg-slate-50 z-10 min-w-[180px]">Student</th>
                        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                          const isWeekend = new Date(bsDateToAd(viewYear, viewMonth, day)).getDay() % 6 === 0;
                          return <th key={day} className={`px-1 py-3 text-center text-[9px] font-bold w-7 ${isWeekend ? 'text-red-300' : 'text-slate-500'}`}>{day}</th>;
                        })}
                        <th className="px-2 py-3 text-[9px] font-bold text-emerald-600 text-center sticky right-[60px] bg-slate-50 z-10 w-7">P</th>
                        <th className="px-2 py-3 text-[9px] font-bold text-red-600 text-center sticky right-[30px] bg-slate-50 z-10 w-7">A</th>
                        <th className="px-2 py-3 text-[9px] font-bold text-slate-600 text-center sticky right-0 bg-slate-50 z-10 w-9">%</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {gridData.map(student => {
                        const total = student.present + student.absent;
                        const pct = total > 0 ? Math.round((student.present / total) * 100) : 0;
                        return (
                          <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-2 text-xs font-bold text-slate-900 sticky left-0 bg-white z-10 border-r border-slate-50">{student.name}</td>
                            {student.days.map(day => (
                              <td key={day.date} className="px-1 py-2 text-center">
                                {day.status === 'Present' ? <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100"><CheckIcon className="h-3 w-3 text-emerald-700" /></span>
                                  : day.status === 'Absent' ? <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-[9px] font-black text-red-700">A</span>
                                  : <span className="inline-flex h-5 w-5 items-center justify-center text-[9px] font-bold text-slate-200">-</span>}
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
              );
            })()}
          </div>
        )}
      </div>

      <Toast toast={toast} onClose={() => setToast(null)} />

      <style jsx>{`
        @keyframes zoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
