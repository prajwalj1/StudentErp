'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  DocumentCheckIcon, AcademicCapIcon, BookOpenIcon,
  ArrowDownIcon, CheckCircleIcon,
  UsersIcon, ChartBarIcon,
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

export default function MarksEntryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [schedules, setSchedules] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [marks, setMarks] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [examType, setExamType] = useState('Final Term');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');

  const inputRefs = useRef({});

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') fetchInitialData();
  }, [status]);

  const fetchInitialData = async () => {
    try {
      const [classesRes, studentsRes] = await Promise.all([
        fetch('/api/classes'), fetch('/api/students')
      ]);
      if (classesRes.ok && studentsRes.ok) {
        const classesData = await classesRes.json();
        const studentsData = await studentsRes.json();
        setSchedules(classesData);
        setAllStudents(studentsData);
        if (classesData.length > 0) {
          const uniqueGrades = Array.from(new Set(classesData.map(c => c.grade || 'Grade 10')));
          const initialGrade = uniqueGrades[0];
          setSelectedGrade(initialGrade);
          const sectionsForGrade = Array.from(new Set(classesData.filter(c => c.grade === initialGrade).map(c => c.section || '')));
          const initialSection = sectionsForGrade[0] || '';
          setSelectedSection(initialSection);
          const subjectsForGroup = classesData.filter(c => c.grade === initialGrade && (c.section || '') === initialSection);
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
    setSaving(true); setSaved(false);
    try {
      const marksData = filteredStudents.map(s => ({
        studentId: s._id, marksObtained: Number(marks[s._id]) || 0, totalMarks: 100
      }));
      const res = await fetch('/api/marks', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classScheduleId: selectedSubjectId, examType, marksData })
      });
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
      else { const err = await res.json(); alert(err.error || 'Failed to save marks.'); }
    } catch (e) { alert('Network error. Please try again.'); } finally { setSaving(false); }
  };

  const filteredStudents = allStudents.filter(s => {
    const sNum = (s.grade || '').replace(/\D/g, '');
    const tNum = (selectedGrade || '').replace(/\D/g, '');
    if (sNum !== tNum) return false;
    if (!selectedSection) return true;
    return (s.section || '').toLowerCase().trim() === selectedSection.toLowerCase().trim();
  });

  const uniqueGrades = Array.from(new Set(schedules.map(c => c.grade || 'Grade 10')));
  const availableSections = Array.from(new Set(schedules.filter(c => c.grade === selectedGrade).map(c => c.section || '')));
  const availableSubjects = schedules.filter(c => c.grade === selectedGrade && (c.section || '') === selectedSection);

  const marksValues = filteredStudents.map(s => Number(marks[s._id])).filter(v => !isNaN(v) && v !== 0);
  const avgMarks = marksValues.length > 0 ? Math.round(marksValues.reduce((a, b) => a + b, 0) / marksValues.length) : 0;
  const highest = marksValues.length > 0 ? Math.max(...marksValues) : 0;
  const lowest = marksValues.length > 0 ? Math.min(...marksValues) : 0;

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-indigo-600 border-t-transparent" />
    </div>
  );

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50/80 via-white to-indigo-50/20">
      <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6 lg:p-8">

        {/* ─── Header ─── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 sm:p-6 shadow-xl">
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                <DocumentCheckIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white">Marks Entry</h1>
                <p className="text-xs text-slate-400">Enter and manage student marks per subject</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select value={examType} onChange={(e) => setExamType(e.target.value)}
                className="rounded-xl bg-white/10 backdrop-blur-sm border-0 px-3.5 py-2 text-xs font-bold text-white outline-none cursor-pointer">
                <option className="text-slate-800" value="First Term">First Term</option>
                <option className="text-slate-800" value="Mid Term">Mid Term</option>
                <option className="text-slate-800" value="Final Term">Final Term</option>
              </select>
              {selectedSubjectId && (
                <button onClick={handleSaveMarks} disabled={saving}
                  className={`inline-flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-bold text-white transition-all ${
                    saved ? 'bg-emerald-500' : 'bg-indigo-600 hover:bg-indigo-700'
                  } disabled:opacity-50`}>
                  {saving ? <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : saved ? <CheckCircleIcon className="h-3.5 w-3.5" /> : <DocumentCheckIcon className="h-3.5 w-3.5" />}
                  {saving ? 'Saving...' : saved ? 'Saved!' : 'Save'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ─── Stats Row ─── */}
        {selectedSubjectId && filteredStudents.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatBox icon={UsersIcon} label="Total Students" value={filteredStudents.length} color="blue" />
            <StatBox icon={ChartBarIcon} label="Class Average" value={marksValues.length > 0 ? `${avgMarks}%` : '\u2014'} color="emerald" />
            <StatBox icon={ArrowDownIcon} label="Highest" value={marksValues.length > 0 ? `${highest}%` : '\u2014'} color="amber" />
            <StatBox icon={ChartBarIcon} label="Lowest" value={marksValues.length > 0 ? `${lowest}%` : '\u2014'} color="indigo" />
          </div>
        )}

        {/* ─── Filters Bar ─── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <AcademicCapIcon className="h-5 w-5 text-indigo-600 shrink-0" />
              <select value={selectedGrade} onChange={(e) => handleGradeChange(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-700 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 cursor-pointer">
                {uniqueGrades.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <span className="text-slate-300 text-xs">|</span>
              <div className="flex gap-1.5">
                {availableSections.map(sec => (
                  <button key={sec} onClick={() => handleSectionChange(sec)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                      selectedSection === sec
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'
                    }`}>
                    Sec {sec || 'All'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Subject Tabs */}
          {availableSubjects.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <BookOpenIcon className="h-4 w-4 text-slate-400 shrink-0" />
                {availableSubjects.map(sub => (
                  <button key={sub._id} onClick={() => setSelectedSubjectId(sub._id)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                      selectedSubjectId === sub._id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}>
                    {sub.subject}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ─── Content Area ─── */}
        {selectedSubjectId ? (
          <>
            {filteredStudents.length > 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {filteredStudents.map((student, idx) => {
                    const gradeInfo = getGrade(marks[student._id]);
                    return (
                      <div key={student._id}
                        className={`relative rounded-xl border-2 p-4 transition-all hover:shadow-md ${getCardAccent(marks[student._id])}`}>
                        <div className="flex items-start gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-full font-black text-sm shrink-0 ${
                            gradeInfo ? `bg-gradient-to-br ${gradeInfo.grade === 'A+' ? 'from-emerald-500 to-emerald-600' : gradeInfo.grade === 'A' ? 'from-green-500 to-green-600' : gradeInfo.grade === 'B+' ? 'from-blue-500 to-blue-600' : gradeInfo.grade === 'B' ? 'from-indigo-500 to-indigo-600' : gradeInfo.grade === 'C+' ? 'from-amber-500 to-amber-600' : gradeInfo.grade === 'C' ? 'from-orange-500 to-orange-600' : gradeInfo.grade === 'D' ? 'from-red-500 to-red-600' : 'from-red-700 to-red-800'} text-white` : 'bg-slate-100 text-slate-600'
                          }`}>
                            {gradeInfo ? gradeInfo.grade : student.name.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-slate-900 truncate">{student.name}</p>
                            <p className="text-[10px] text-slate-400 font-semibold">Roll: {student.rollNumber || student._id.slice(-6)}</p>
                          </div>
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
                              className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 text-center text-lg font-black outline-none transition-all focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                              placeholder={'\u2014'} />
                          </div>
                          <div className="min-w-[36px] text-center text-xs font-bold text-slate-400">/100</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs font-semibold text-slate-400">
                    {marksValues.length} / {filteredStudents.length} students graded
                    {marksValues.length > 0 && ` \u2022 Avg ${avgMarks}%`}
                  </div>
                  <button onClick={handleSaveMarks} disabled={saving}
                    className={`inline-flex items-center gap-2 rounded-xl px-8 py-3 text-sm font-bold text-white transition-all ${
                      saved ? 'bg-emerald-500' : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200'
                    } disabled:opacity-50`}>
                    {saving ? <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : saved ? <CheckCircleIcon className="h-5 w-5" /> : <DocumentCheckIcon className="h-5 w-5" />}
                    {saving ? 'Saving...' : saved ? 'Saved!' : 'Save All Marks'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center">
                <UsersIcon className="mx-auto h-12 w-12 text-slate-200 mb-3" />
                <h3 className="font-bold text-slate-500">No students found</h3>
                <p className="text-sm text-slate-400 mt-1">No students enrolled in this class.</p>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center">
            <AcademicCapIcon className="mx-auto h-12 w-12 text-slate-200 mb-3" />
            <h3 className="font-bold text-slate-500">Select a subject to begin</h3>
            <p className="text-sm text-slate-400 mt-1">Choose grade, section, and subject above.</p>
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
