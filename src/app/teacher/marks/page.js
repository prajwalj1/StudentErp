'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  DocumentCheckIcon, AcademicCapIcon, BookOpenIcon,
  ArrowUpIcon, ArrowDownIcon, CheckCircleIcon,
  UsersIcon, SparklesIcon, TrophyIcon, ChartBarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const getGrade = (marks) => {
  if (marks === '' || marks === undefined || marks === null) return null;
  const m = Number(marks);
  if (isNaN(m)) return null;
  if (m >= 90) return { grade: 'A+', gpa: '4.0', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
  if (m >= 80) return { grade: 'A', gpa: '3.6', color: 'text-green-600 bg-green-50 border-green-200' };
  if (m >= 70) return { grade: 'B+', gpa: '3.2', color: 'text-blue-600 bg-blue-50 border-blue-200' };
  if (m >= 60) return { grade: 'B', gpa: '2.8', color: 'text-indigo-600 bg-indigo-50 border-indigo-200' };
  if (m >= 50) return { grade: 'C+', gpa: '2.4', color: 'text-amber-600 bg-amber-50 border-amber-200' };
  if (m >= 40) return { grade: 'C', gpa: '2.0', color: 'text-orange-600 bg-orange-50 border-orange-200' };
  if (m >= 35) return { grade: 'D', gpa: '1.6', color: 'text-red-500 bg-red-50 border-red-200' };
  return { grade: 'F', gpa: '0.0', color: 'text-red-600 bg-red-100 border-red-300' };
};

const getCardAccent = (marks) => {
  if (marks === '' || marks === undefined || marks === null) return 'border-slate-100';
  const m = Number(marks);
  if (isNaN(m)) return 'border-slate-100';
  if (m >= 80) return 'border-emerald-300 bg-emerald-50/30';
  if (m >= 60) return 'border-blue-200 bg-blue-50/20';
  if (m >= 40) return 'border-amber-200 bg-amber-50/20';
  return 'border-red-200 bg-red-50/20';
};

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

export default function MarksEntryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [schedules, setSchedules] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [marks, setMarks] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState(null);

  const [examType, setExamType] = useState('Final Term');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');

  const inputRefs = useRef({});

  const showToast = (type, text) => setToast({ type, text });

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') fetchInitialData();
  }, [status]);

  const fetchInitialData = async () => {
    try {
      const [classesRes, studentsRes] = await Promise.all([
        fetch('/api/classes'),
        fetch('/api/students')
      ]);

      if (classesRes.ok && studentsRes.ok) {
        const classesData = await classesRes.json();
        const studentsData = await studentsRes.json();

        const myClasses = classesData.filter(c => {
          if (!c.teacherId || !c.teacherId.email || !session?.user?.email) return false;
          return c.teacherId.email.toLowerCase() === session.user.email.toLowerCase();
        });
        const displayClasses = myClasses.length > 0 ? myClasses : classesData;

        setSchedules(displayClasses);
        setAllStudents(studentsData);

        if (displayClasses.length > 0) {
          const uniqueGrades = Array.from(new Set(displayClasses.map(c => c.grade || 'Grade 10')));
          const initialGrade = uniqueGrades[0];
          setSelectedGrade(initialGrade);
          const sectionsForGrade = Array.from(new Set(displayClasses.filter(c => c.grade === initialGrade).map(c => c.section || '')));
          const initialSection = sectionsForGrade[0] || '';
          setSelectedSection(initialSection);
          const subjectsForGroup = displayClasses.filter(c => c.grade === initialGrade && (c.section || '') === initialSection);
          if (subjectsForGroup.length > 0) setSelectedSubjectId(subjectsForGroup[0]._id);
        }
      }
    } catch (e) { console.error(e) } finally { setLoading(false); }
  };

  const handleGradeChange = (newGrade) => {
    setSelectedGrade(newGrade);
    const sectionsForGrade = Array.from(new Set(schedules.filter(c => c.grade === newGrade).map(c => c.section || '')));
    const firstSec = sectionsForGrade[0] || '';
    setSelectedSection(firstSec);
    const subjectsForGroup = schedules.filter(c => c.grade === newGrade && (c.section || '') === firstSec);
    setSelectedSubjectId(subjectsForGroup.length > 0 ? subjectsForGroup[0]._id : '');
  };

  const handleSectionChange = (newSec) => {
    setSelectedSection(newSec);
    const subjectsForGroup = schedules.filter(c => c.grade === selectedGrade && (c.section || '') === newSec);
    setSelectedSubjectId(subjectsForGroup.length > 0 ? subjectsForGroup[0]._id : '');
  };

  useEffect(() => {
    if (selectedSubjectId) fetchMarksForSubject();
    else setMarks({});
  }, [selectedSubjectId, examType]);

  const fetchMarksForSubject = async () => {
    try {
      const res = await fetch(`/api/marks?classScheduleId=${selectedSubjectId}&examType=${examType}`);
      if (res.ok) {
        const marksData = await res.json();
        const marksMap = {};
        marksData.forEach(m => { if (m.studentId?._id) marksMap[m.studentId._id] = m.marksObtained; });
        setMarks(marksMap);
      }
    } catch (e) { console.error(e) }
  };

  const handleSaveMarks = async () => {
    if (!selectedSubjectId) return;
    setSaving(true);
    setSaved(false);
    try {
      const marksData = filteredStudents.map(s => ({
        studentId: s._id,
        marksObtained: Number(marks[s._id]) || 0,
        totalMarks: 100
      }));
      const res = await fetch('/api/marks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classScheduleId: selectedSubjectId, examType, marksData })
      });
      if (res.ok) { setSaved(true); showToast('success', 'Marks saved!'); setTimeout(() => setSaved(false), 2000); }
      else { const err = await res.json(); showToast('error', err.error || 'Failed to save.'); }
    } catch { showToast('error', 'Network error.'); }
    finally { setSaving(false); }
  };

  const filteredStudents = allStudents.filter(s => {
    const sGrade = (s.grade || '').toLowerCase().trim();
    const tGrade = (selectedGrade || '').toLowerCase().trim();
    const sNum = sGrade.replace(/\D/g, '');
    const tNum = tGrade.replace(/\D/g, '');
    if (sNum !== tNum) return false;
    if (!selectedSection) return true;
    const sSec = (s.section || '').toLowerCase().trim();
    const tSec = (selectedSection || '').toLowerCase().trim();
    return sSec === tSec;
  });

  const uniqueGrades = Array.from(new Set(schedules.map(c => c.grade || 'Grade 10')));
  const availableSections = Array.from(new Set(schedules.filter(c => c.grade === selectedGrade).map(c => c.section || '')));
  const availableSubjects = schedules.filter(c => c.grade === selectedGrade && (c.section || '') === selectedSection);
  const currentSubject = availableSubjects.find(s => s._id === selectedSubjectId);

  const marksValues = filteredStudents.map(s => Number(marks[s._id])).filter(v => !isNaN(v) && v !== 0);
  const avgMarks = marksValues.length > 0 ? Math.round(marksValues.reduce((a, b) => a + b, 0) / marksValues.length) : 0;
  const highest = marksValues.length > 0 ? Math.max(...marksValues) : 0;
  const lowest = marksValues.length > 0 ? Math.min(...marksValues) : 0;

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-amber-600 border-t-transparent" />
    </div>
  );

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50/80 via-white to-amber-50/20">
      <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6 lg:p-8">

        {/* ─── Header ─── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 sm:p-6 shadow-xl">
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-amber-500/10 blur-3xl" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                <DocumentCheckIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white">Marks Entry</h1>
                <p className="text-xs text-slate-400">Enter and manage student marks</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select value={examType} onChange={(e) => setExamType(e.target.value)}
                className="rounded-xl border border-slate-600 bg-slate-800 px-3.5 py-2 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer">
                <option value="First Term">First Term</option>
                <option value="Mid Term">Mid Term</option>
                <option value="Final Term">Final Term</option>
              </select>
              {selectedSubjectId && (
                <button onClick={handleSaveMarks} disabled={saving}
                  className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-all ${
                    saved ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white shadow-lg hover:bg-amber-600'
                  } disabled:opacity-50`}>
                  {saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    : saved ? <CheckCircleIcon className="h-4 w-4" /> : <SparklesIcon className="h-4 w-4" />}
                  {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Marks'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ─── Filters ─── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <AcademicCapIcon className="h-5 w-5 text-amber-500 flex-shrink-0" />
              <select value={selectedGrade} onChange={(e) => handleGradeChange(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer">
                {uniqueGrades.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <span className="text-slate-300 text-sm">|</span>
              <div className="flex gap-2">
                {availableSections.map(sec => (
                  <button key={sec} onClick={() => handleSectionChange(sec)}
                    className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                      selectedSection === sec ? 'bg-amber-500 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}>
                    Sec {sec || 'All'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {availableSubjects.length > 0 && (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <BookOpenIcon className="h-4 w-4 text-slate-400 flex-shrink-0" />
                {availableSubjects.map(sub => (
                  <button key={sub._id} onClick={() => setSelectedSubjectId(sub._id)}
                    className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-5 py-2.5 text-xs font-bold transition-all ${
                      selectedSubjectId === sub._id ? 'bg-amber-500 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}>
                    {sub.subject}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ─── Content ─── */}
        {selectedSubjectId ? (
          <>
            {filteredStudents.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Total Students', value: filteredStudents.length, icon: UsersIcon, color: 'text-indigo-600 bg-indigo-50' },
                  { label: 'Class Average', value: marksValues.length > 0 ? `${avgMarks}%` : '\u2014', icon: ChartBarIcon, color: 'text-emerald-600 bg-emerald-50' },
                  { label: 'Highest', value: marksValues.length > 0 ? `${highest}%` : '\u2014', icon: TrophyIcon, color: 'text-amber-600 bg-amber-50' },
                  { label: 'Lowest', value: marksValues.length > 0 ? `${lowest}%` : '\u2014', icon: ArrowDownIcon, color: 'text-red-600 bg-red-50' },
                ].map((stat, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.color}`}>
                      <stat.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{stat.label}</p>
                      <p className="text-lg font-black text-slate-900">{stat.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {filteredStudents.length > 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {filteredStudents.map((student, idx) => {
                    const gradeInfo = getGrade(marks[student._id]);
                    return (
                      <div key={student._id}
                        className={`relative rounded-xl border-2 p-4 transition-all hover:shadow-md ${getCardAccent(marks[student._id])}`}>
                        <div className="flex items-start gap-3">
                          <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-black ${
                            gradeInfo ? `${gradeInfo.color.split(' ')[0]} ${gradeInfo.color.split(' ')[1]}` : 'bg-slate-100 text-slate-600'
                          }`}>
                            {student.name.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-slate-900">{student.name}</p>
                            <p className="text-[10px] font-semibold text-slate-400">Roll: {student.rollNumber || student._id.slice(-6)}</p>
                          </div>
                          {gradeInfo && (
                            <span className={`flex-shrink-0 rounded-lg border px-2.5 py-1 text-[10px] font-black ${gradeInfo.color}`}>
                              {gradeInfo.grade}
                            </span>
                          )}
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <div className="relative flex-1">
                            <input ref={el => inputRefs.current[student._id] = el} type="number" min="0" max="100"
                              value={marks[student._id] !== undefined ? marks[student._id] : ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === '' || Number(val) <= 100) setMarks(prev => ({ ...prev, [student._id]: val }));
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const keys = filteredStudents.map(s => s._id);
                                  const currentIdx = keys.indexOf(student._id);
                                  const nextId = keys[currentIdx + 1];
                                  if (nextId && inputRefs.current[nextId]) inputRefs.current[nextId].focus();
                                }
                              }}
                              className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 text-center text-lg font-black outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                              placeholder="\u2014"
                            />
                          </div>
                          <div className="min-w-[36px] text-center text-xs font-bold text-slate-400">/100</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <div className="text-xs font-semibold text-slate-400">
                    {marksValues.length} / {filteredStudents.length} students graded
                    {marksValues.length > 0 && ` \u2022 Avg ${avgMarks}%`}
                  </div>
                  <button onClick={handleSaveMarks} disabled={saving}
                    className={`flex items-center gap-2 rounded-xl px-8 py-3 text-sm font-bold transition-all ${
                      saved ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white shadow-lg hover:bg-amber-600'
                    } disabled:opacity-50`}>
                    {saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      : saved ? <CheckCircleIcon className="h-5 w-5" /> : <SparklesIcon className="h-5 w-5" />}
                    {saving ? 'Saving...' : saved ? 'Saved!' : 'Save All Marks'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-sm">
                <UsersIcon className="mx-auto h-12 w-12 text-slate-200" />
                <h3 className="mt-3 font-bold text-slate-500">No students found</h3>
                <p className="mt-1 text-sm text-slate-400">No students enrolled in this class.</p>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-sm">
            <AcademicCapIcon className="mx-auto h-12 w-12 text-slate-200" />
            <h3 className="mt-3 font-bold text-slate-500">Select a subject to begin</h3>
            <p className="mt-1 text-sm text-slate-400">Choose grade, section, and subject above.</p>
          </div>
        )}
      </div>

      <Toast toast={toast} onClose={() => setToast(null)} />

      <style jsx>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
