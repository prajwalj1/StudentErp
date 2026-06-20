'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  CalendarDaysIcon, ClipboardDocumentCheckIcon, UserGroupIcon,
  CheckCircleIcon, XCircleIcon,
  AcademicCapIcon, ChartBarIcon, ExclamationTriangleIcon,
  CheckIcon, ArrowPathIcon,
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

export default function OwnerAttendancePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
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
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') fetchAttendance();
  }, [status]);

  const showToast = (type, text) => { setToast({ type, text }); };

  const fetchAttendance = async () => {
    try {
      const [studentsRes, attRes] = await Promise.all([
        fetch('/api/students'),
        fetch('/api/attendance'),
      ]);
      if (attRes.ok) setRecords(await attRes.json());
      const pairsMap = new Map();
      if (studentsRes.ok) {
        const allStudents = await studentsRes.json();
        allStudents.filter(s => s.status !== 'graduated').forEach(s => {
          const g = s.grade || ''; const sec = s.section || '';
          if (!g) return;
          pairsMap.set(`${g}|${sec}`, { grade: g, section: sec, label: `${g}${sec ? ` (Sec ${sec})` : ''}` });
        });
      }
      const uniqueClasses = Array.from(pairsMap.values()).sort((a, b) => {
        const aN = parseInt(a.grade.replace(/\D/g, ''), 10) || 0;
        const bN = parseInt(b.grade.replace(/\D/g, ''), 10) || 0;
        return aN !== bN ? aN - bN : a.section.localeCompare(b.section);
      });
      setClassesList(uniqueClasses);
      if (uniqueClasses.length > 0 && !selectedClassKey) {
        setSelectedClassKey(`${uniqueClasses[0].grade}|${uniqueClasses[0].section}`);
      }
    } catch (e) { console.error(e) } finally { setLoading(false); }
  };

  const fetchStudents = async (classKey) => {
    try {
      const [currGrade, currSection] = classKey.split('|');
      const res = await fetch('/api/students');
      if (res.ok) {
        const allStudents = await res.json();
        const filtered = allStudents.filter(s => {
          if (s.status === 'graduated') return false;
          const sNum = (s.grade || '').replace(/\D/g, '');
          const tNum = (currGrade || '').replace(/\D/g, '');
          if (sNum !== tNum) return false;
          if (!currSection) return true;
          return (s.section || '').toLowerCase().trim() === currSection.toLowerCase().trim();
        });
        const markDateStr = date;
        const existingRecord = records.find(r => {
          const rDate = toLocalDateStr(r.date);
          return `${r.grade}|${r.section || ''}` === classKey && rDate === markDateStr;
        });
        setStudents(filtered.map(s => ({
          ...s,
          status: existingRecord?.students.find(st => st.studentId?._id === s._id)?.status || 'Absent',
        })));
      }
    } catch (e) { console.error(e) }
  };

  useEffect(() => { if (selectedClassKey) fetchStudents(selectedClassKey); }, [selectedClassKey, date]);

  const toggleAttendance = (id) => {
    setStudents(students.map(s => s._id === id ? { ...s, status: s.status === 'Present' ? 'Absent' : 'Present' } : s));
  };

  const setAllStatus = (statusStr) => setStudents(students.map(s => ({ ...s, status: statusStr })));

  const submitAttendance = async () => {
    setSaving(true);
    try {
      const [currGrade, currSection] = selectedClassKey.split('|');
      if (!currGrade) { showToast('error', 'Please select a class first.'); setSaving(false); return; }
      const attDate = date || toLocalDateStr();
      if (attDate > toLocalDateStr()) {
        showToast('error', 'Cannot mark attendance for a future date.'); setSaving(false); return;
      }
      const res = await fetch('/api/attendance', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: attDate, grade: currGrade, section: currSection,
          students: students.map(s => ({ studentId: s._id, status: s.status || 'Absent' })),
        }),
      });
      if (res.ok) {
        showToast('success', `Attendance saved for ${currGrade}${currSection ? ` (Sec ${currSection})` : ''} on ${toNepaliDate(attDate)}!`);
        fetchAttendance(); setView('register');
      } else { const err = await res.json(); showToast('error', err.error || 'Failed to save.'); }
    } catch (e) { console.error(e) } finally { setSaving(false); }
  };

  const filteredRecords = useMemo(() => records.filter(r => {
    const key = `${r.grade}|${r.section || ''}`;
    const bs = adDateToBs(toLocalDateStr(r.date));
    return key === selectedClassKey && bs && bs.year === viewYear && bs.month === viewMonth;
  }), [records, selectedClassKey, viewYear, viewMonth]);

  const daysInMonth = getDaysInBsMonth(viewYear, viewMonth);
  const attendanceMap = {};
  filteredRecords.forEach(rec => {
    const dateStr = toLocalDateStr(rec.date);
    attendanceMap[dateStr] = {};
    rec.students.forEach(s => { if (s.studentId) attendanceMap[dateStr][s.studentId._id] = s.status; });
  });

  const studentMap = new Map();
  filteredRecords.forEach(rec => {
    rec.students.forEach(s => {
      if (s.studentId && !studentMap.has(s.studentId._id)) studentMap.set(s.studentId._id, s.studentId.name || 'Unknown');
    });
  });
  const currentIds = new Set(students.map(s => s._id));
  for (const id of studentMap.keys()) { if (!currentIds.has(id)) studentMap.delete(id); }

  const gridData = Array.from(studentMap.entries()).map(([id, name]) => {
    const days = [];
    for (let d = 1; d <= daysInMonth; d++) days.push({ date: d, status: attendanceMap[bsDateToAd(viewYear, viewMonth, d)]?.[id] || null });
    const present = days.filter(d => d.status === 'Present').length;
    const absent = days.filter(d => d.status === 'Absent').length;
    return { id, name, days, present, absent };
  });

  const currentClassObj = classesList.find(c => `${c.grade}|${c.section}` === selectedClassKey) || { label: '' };
  const presentCount = students.filter(s => s.status === 'Present').length;
  const absentCount = students.filter(s => s.status === 'Absent').length;
  const filteredStudents = useMemo(() => students, [students]);

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-blue-600 border-t-transparent" />
    </div>
  );

  if (classesList.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center max-w-md">
          <UserGroupIcon className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-bold text-slate-600">No class schedules found</p>
          <p className="mt-1 text-xs text-slate-400">Create class schedules in the Classes page first.</p>
        </div>
      </div>
    );
  }

  const totalPresent = gridData.reduce((s, g) => s + g.present, 0);
  const totalAbsent = gridData.reduce((s, g) => s + g.absent, 0);
  const totalRecorded = totalPresent + totalAbsent;

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
                <p className="text-xs text-slate-400">Track and manage daily attendance records</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex bg-white/10 backdrop-blur-sm rounded-xl p-0.5">
                <button onClick={() => setView('register')}
                  className={`px-4 py-2 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${view === 'register' ? 'bg-white text-blue-600 shadow-sm' : 'text-white/60 hover:text-white'}`}>
                  <CalendarDaysIcon className="h-3.5 w-3.5 inline mr-1.5 -mt-0.5" />
                  Register
                </button>
                <button onClick={() => setView('mark')}
                  className={`px-4 py-2 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${view === 'mark' ? 'bg-white text-blue-600 shadow-sm' : 'text-white/60 hover:text-white'}`}>
                  <ClipboardDocumentCheckIcon className="h-3.5 w-3.5 inline mr-1.5 -mt-0.5" />
                  Mark
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Stats Row ─── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatBox icon={UserGroupIcon} label="Students" value={students.length || '—'} color="blue" />
          <StatBox icon={CheckCircleIcon} label="Present" value={view === 'mark' ? presentCount : totalRecorded > 0 ? totalPresent : '—'} color="emerald" />
          <StatBox icon={XCircleIcon} label="Absent" value={view === 'mark' ? absentCount : totalRecorded > 0 ? totalAbsent : '—'} color="amber" />
          <StatBox icon={ChartBarIcon} label="Attendance %" value={totalRecorded > 0 ? `${Math.round((totalPresent / totalRecorded) * 100)}%` : '—'} color="indigo" />
        </div>

        {/* ─── Class Selector ─── */}
        <div className="flex flex-wrap items-center gap-3">
          <select value={selectedClassKey} onChange={e => setSelectedClassKey(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-600 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100 cursor-pointer min-w-[160px]">
            {classesList.map(c => (
              <option key={`${c.grade}|${c.section}`} value={`${c.grade}|${c.section}`}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* ─── Register View ─── */}
        {view === 'register' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button onClick={() => {
                  if (viewMonth === 1) { setViewMonth(12); setViewYear(y => y - 1); }
                  else setViewMonth(m => m - 1);
                }} className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition-all hover:bg-slate-50">←</button>
                <span className="text-sm font-bold text-slate-800 min-w-[140px] text-center">{getBsMonthName(viewMonth - 1)} {viewYear}</span>
                <button onClick={() => {
                  if (viewMonth === 12) { setViewMonth(1); setViewYear(y => y + 1); }
                  else setViewMonth(m => m + 1);
                }} className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition-all hover:bg-slate-50">→</button>
              </div>
              <Badge color="blue">{currentClassObj.label}</Badge>
            </div>

            {filteredRecords.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
                <CalendarDaysIcon className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-3 text-sm font-bold text-slate-500">No attendance records</p>
                <p className="text-xs text-slate-400 mt-1">Switch to "Mark" tab to record attendance.</p>
              </div>
            ) : gridData.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
                <UserGroupIcon className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-3 text-sm font-bold text-slate-500">No student data</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left" style={{ minWidth: `${daysInMonth * 36 + 280}px` }}>
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider sticky left-0 bg-slate-50 z-10 min-w-[180px]">Student</th>
                        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                          const dayAdStr = bsDateToAd(viewYear, viewMonth, day);
                          const isWeekend = new Date(dayAdStr).getDay() === 0 || new Date(dayAdStr).getDay() === 6;
                          return (
                            <th key={day} className={`px-1 py-3 text-center text-[9px] font-bold w-7 ${isWeekend ? 'text-red-300' : 'text-slate-500'}`}>
                              {day}
                            </th>
                          );
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
                                {day.status === 'Present' ? (
                                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[9px] font-black text-emerald-700">P</span>
                                ) : day.status === 'Absent' ? (
                                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-[9px] font-black text-red-700">A</span>
                                ) : (
                                  <span className="inline-flex h-5 w-5 items-center justify-center text-[9px] font-bold text-slate-200">-</span>
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
          </div>
        ) : (
          /* ─── Mark Attendance View ─── */
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <Badge color="blue">{currentClassObj.label}</Badge>
                <div className="h-5 w-px bg-slate-200" />
                <NepaliDatePicker
                  value={date ? new Date(date) : null}
                  onChange={(d) => { if (d) setDate(toLocalDateStr(d)); }}
                  locale="en" placeholder="YYYY/MM/DD"
                />
              </div>
              <div className="flex items-center gap-2">
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
              <div className="p-12 text-center">
                <UserGroupIcon className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-3 text-sm font-bold text-slate-500">No students found</p>
                <p className="text-xs text-slate-400 mt-1">No students in {currentClassObj.label}.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/50">
                      <th className="px-5 py-3.5 w-12 text-center">Status</th>
                      <th className="px-5 py-3.5">Student</th>
                      <th className="px-5 py-3.5 hidden sm:table-cell">Roll</th>
                      <th className="px-5 py-3.5 text-center w-24">Attendance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map((student) => (
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
                              <p className="text-[10px] text-slate-400 sm:hidden">Roll: {student.rollNumber || student._id.slice(-4)}</p>
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
            )}

            {students.length > 0 && (
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
            )}
          </div>
        )}
      </div>

      {/* ─── Toast ─── */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      <style jsx>{`
        @keyframes zoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
