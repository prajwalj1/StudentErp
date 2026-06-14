'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { 
  DocumentCheckIcon, AcademicCapIcon, BookOpenIcon,
  ArrowUpIcon, ArrowDownIcon, CheckCircleIcon,
  UsersIcon, SparklesIcon, TrophyIcon, ChartBarIcon
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

export default function MarksEntryPage() {
  const { data: session, status } = useSession();
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
    if (status === 'authenticated') {
      fetchInitialData();
    }
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
          if (subjectsForGroup.length > 0) {
            setSelectedSubjectId(subjectsForGroup[0]._id);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
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
    if (selectedSubjectId) {
      fetchMarksForSubject();
    } else {
      setMarks({});
    }
  }, [selectedSubjectId, examType]);

  const fetchMarksForSubject = async () => {
    try {
      const res = await fetch(`/api/marks?classScheduleId=${selectedSubjectId}&examType=${examType}`);
      if (res.ok) {
        const marksData = await res.json();
        const marksMap = {};
        marksData.forEach(m => {
          if (m.studentId?._id) {
            marksMap[m.studentId._id] = m.marksObtained;
          }
        });
        setMarks(marksMap);
      }
    } catch (err) {
      console.error(err);
    }
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
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    } finally {
      setSaving(false);
    }
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <DocumentCheckIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">Marks Entry</h1>
              <p className="text-xs text-slate-500 font-medium">Enter and manage student marks</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none font-bold text-slate-700 bg-slate-50 text-sm cursor-pointer"
            >
              <option value="First Term">First Term</option>
              <option value="Mid Term">Mid Term</option>
              <option value="Final Term">Final Term</option>
            </select>
            {selectedSubjectId && (
              <button
                onClick={handleSaveMarks}
                disabled={saving}
                className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                  saved
                    ? 'bg-emerald-500 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200'
                } disabled:opacity-50`}
              >
                {saving ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : saved ? (
                  <CheckCircleIcon className="w-5 h-5" />
                ) : (
                  <SparklesIcon className="w-5 h-5" />
                )}
                {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Marks'}
              </button>
            )}
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <AcademicCapIcon className="w-5 h-5 text-indigo-600 flex-shrink-0" />
              <select
                value={selectedGrade}
                onChange={(e) => handleGradeChange(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none font-bold text-slate-700 bg-slate-50 text-sm cursor-pointer"
              >
                {uniqueGrades.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <span className="text-slate-300 text-sm">|</span>
              <div className="flex gap-2">
                {availableSections.map(sec => (
                  <button
                    key={sec}
                    onClick={() => handleSectionChange(sec)}
                    className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                      selectedSection === sec
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
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
                <BookOpenIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                {availableSubjects.map(sub => (
                  <button
                    key={sub._id}
                    onClick={() => setSelectedSubjectId(sub._id)}
                    className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap flex items-center gap-2 ${
                      selectedSubjectId === sub._id
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {sub.subject}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Content Area */}
        {selectedSubjectId ? (
          <>
            {/* Stats Strip */}
            {filteredStudents.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Total Students', value: filteredStudents.length, icon: UsersIcon, color: 'text-indigo-600 bg-indigo-50' },
                  { label: 'Class Average', value: marksValues.length > 0 ? `${avgMarks}%` : '—', icon: ChartBarIcon, color: 'text-emerald-600 bg-emerald-50' },
                  { label: 'Highest', value: marksValues.length > 0 ? `${highest}%` : '—', icon: TrophyIcon, color: 'text-amber-600 bg-amber-50' },
                  { label: 'Lowest', value: marksValues.length > 0 ? `${lowest}%` : '—', icon: ArrowDownIcon, color: 'text-red-600 bg-red-50' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                      <stat.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                      <p className="text-lg font-black text-slate-900">{stat.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Student Cards Grid */}
            {filteredStudents.length > 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {filteredStudents.map((student, idx) => {
                    const gradeInfo = getGrade(marks[student._id]);
                    return (
                      <div
                        key={student._id}
                        className={`relative rounded-xl border-2 p-4 transition-all hover:shadow-md ${getCardAccent(marks[student._id])}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0 ${
                            gradeInfo ? gradeInfo.color.split(' ')[0] + ' ' + gradeInfo.color.split(' ')[1] : 'bg-slate-100 text-slate-600'
                          }`}>
                            {student.name.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-slate-900 text-sm truncate">{student.name}</p>
                            <p className="text-[10px] text-slate-400 font-semibold">Roll: {student.rollNumber || student._id.slice(-6)}</p>
                          </div>
                          {gradeInfo && (
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border ${gradeInfo.color} flex-shrink-0`}>
                              {gradeInfo.grade}
                            </span>
                          )}
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <div className="relative flex-1">
                            <input
                              ref={el => inputRefs.current[student._id] = el}
                              type="number"
                              min="0"
                              max="100"
                              value={marks[student._id] !== undefined ? marks[student._id] : ''}
                              onChange={(e) => setMarks(prev => ({ ...prev, [student._id]: e.target.value }))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const keys = filteredStudents.map(s => s._id);
                                  const currentIdx = keys.indexOf(student._id);
                                  const nextId = keys[currentIdx + 1];
                                  if (nextId && inputRefs.current[nextId]) {
                                    inputRefs.current[nextId].focus();
                                  }
                                }
                              }}
                              className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl text-center font-black text-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none bg-white transition-all"
                              placeholder="—"
                            />
                          </div>
                          <div className="text-xs text-slate-400 font-bold text-center min-w-[36px]">
                            /100
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Save */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex justify-between items-center">
                  <div className="text-xs text-slate-400 font-semibold">
                    {marksValues.length} / {filteredStudents.length} students graded
                    {marksValues.length > 0 && ` • Avg ${avgMarks}%`}
                  </div>
                  <button
                    onClick={handleSaveMarks}
                    disabled={saving}
                    className={`px-8 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                      saved
                        ? 'bg-emerald-500 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200'
                    } disabled:opacity-50`}
                  >
                    {saving ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : saved ? (
                      <CheckCircleIcon className="w-5 h-5" />
                    ) : (
                      <SparklesIcon className="w-5 h-5" />
                    )}
                    {saving ? 'Saving...' : saved ? 'Saved!' : 'Save All Marks'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-16 text-center">
                <UsersIcon className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <h3 className="font-bold text-slate-500">No students found</h3>
                <p className="text-sm text-slate-400 mt-1">No students enrolled in this class.</p>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-16 text-center">
            <AcademicCapIcon className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <h3 className="font-bold text-slate-500">Select a subject to begin</h3>
            <p className="text-sm text-slate-400 mt-1">Choose grade, section, and subject above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
