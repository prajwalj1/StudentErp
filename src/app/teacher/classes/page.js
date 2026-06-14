'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { BookOpenIcon, UserGroupIcon, ClockIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { toNepaliDate, toLocalDateStr } from '@/lib/nepaliDate';
import { NepaliDatePicker } from 'react-bs-calender';
import 'react-bs-calender/styles.css';

export default function MyClassesPage() {
  const { data: session, status } = useSession();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);

  const [viewStudentsClass, setViewStudentsClass] = useState(null);
  const [lessonPlanClass, setLessonPlanClass] = useState(null);
  const [lessonPlans, setLessonPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [planForm, setPlanForm] = useState({ weekStart: '', weekEnd: '', topic: '', objectives: '', activities: '', materials: '', assessment: '' });
  const [savingPlan, setSavingPlan] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData();
    }
  }, [status]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [classesRes, studentsRes] = await Promise.all([
        fetch('/api/classes'),
        fetch('/api/students')
      ]);

      if (classesRes.ok) {
        const data = await classesRes.json();
        const myClasses = data.filter(c => {
          if (!c.teacherId || !c.teacherId.email || !session?.user?.email) return false;
          return c.teacherId.email.toLowerCase() === session.user.email.toLowerCase();
        });
        setClasses(myClasses);
      }

      if (studentsRes.ok) {
        const data = await studentsRes.json();
        setStudents(data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStudentCount = (cls) => {
    return students.filter(s => {
      const sGrade = (s.grade || '').toLowerCase().trim();
      const cGrade = (cls.grade || '').toLowerCase().trim();
      const sNum = sGrade.replace(/\D/g, '');
      const cNum = cGrade.replace(/\D/g, '');
      if (sNum !== cNum) return false;
      const cSec = (cls.section || '').toLowerCase().trim();
      if (!cSec) return true;
      const sSec = (s.section || '').toLowerCase().trim();
      return sSec === cSec;
    }).length;
  };

  const getStudentsForClass = (cls) => {
    return students.filter(s => {
      const sGrade = (s.grade || '').toLowerCase().trim();
      const cGrade = (cls.grade || '').toLowerCase().trim();
      const sNum = sGrade.replace(/\D/g, '');
      const cNum = cGrade.replace(/\D/g, '');
      if (sNum !== cNum) return false;
      const cSec = (cls.section || '').toLowerCase().trim();
      if (!cSec) return true;
      const sSec = (s.section || '').toLowerCase().trim();
      return sSec === cSec;
    });
  };

  const fetchLessonPlans = async (classScheduleId) => {
    setPlansLoading(true);
    try {
      const res = await fetch(`/api/lessonplans?classScheduleId=${classScheduleId}`);
      if (res.ok) {
        const data = await res.json();
        setLessonPlans(data);
      }
    } catch (error) {
      console.error("Error fetching lesson plans:", error);
    } finally {
      setPlansLoading(false);
    }
  };

  const openLessonPlan = (cls) => {
    setLessonPlanClass(cls);
    setPlanForm({ weekStart: '', weekEnd: '', topic: '', objectives: '', activities: '', materials: '', assessment: '' });
    fetchLessonPlans(cls._id);
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    if (!lessonPlanClass) return;
    setSavingPlan(true);
    try {
      const payload = {
        classScheduleId: lessonPlanClass._id,
        grade: lessonPlanClass.grade,
        section: lessonPlanClass.section || '',
        subject: lessonPlanClass.subject,
        ...planForm
      };
      const res = await fetch('/api/lessonplans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setPlanForm({ weekStart: '', weekEnd: '', topic: '', objectives: '', activities: '', materials: '', assessment: '' });
        fetchLessonPlans(lessonPlanClass._id);
      } else {
        const err = await res.json();
        alert(`Failed to save: ${err.error}`);
      }
    } catch (error) {
      console.error("Error saving lesson plan:", error);
      alert("Network error while saving lesson plan.");
    } finally {
      setSavingPlan(false);
    }
  };

  const handleDeletePlan = async (planId) => {
    try {
      const res = await fetch(`/api/lessonplans/${planId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchLessonPlans(lessonPlanClass._id);
      }
    } catch (error) {
      console.error("Error deleting lesson plan:", error);
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>;

  const modalOverlay = 'fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto';

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-900">My Classes</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your assigned classes and view student details.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-white rounded-3xl border border-slate-100 text-slate-500">
            You have not been assigned any classes yet.
          </div>
        ) : (
          classes.map((cls) => (
          <div key={cls._id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-lg transition-all duration-300 group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <BookOpenIcon className="w-6 h-6" />
              </div>
              <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg">{cls.room || 'No Room'}</span>
            </div>
            
            <h3 className="text-xl font-bold text-slate-900">{cls.subject}</h3>
            <p className="text-sm text-slate-500 font-medium mb-6">{cls.grade} {cls.section ? `(Sec: ${cls.section})` : ''}</p>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <UserGroupIcon className="w-5 h-5 text-slate-400" />
                <span className="font-semibold">{getStudentCount(cls)} Students</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <ClockIcon className="w-5 h-5 text-slate-400" />
                <span className="font-semibold">{cls.time}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setViewStudentsClass(cls)}
                className="flex-1 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold rounded-xl text-sm transition-colors"
              >
                View Students
              </button>
              <button
                onClick={() => openLessonPlan(cls)}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm shadow-md transition-colors"
              >
                Lesson Plan
              </button>
            </div>
          </div>
        )))}
      </div>

      {/* View Students Modal */}
      {viewStudentsClass && (
        <div className={modalOverlay}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden my-8" style={{ animationDuration: '0.3s', animationIterationCount: 1, animationName: 'zoomIn' }}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-900">
                Students — {viewStudentsClass.grade} {viewStudentsClass.section ? `(Sec ${viewStudentsClass.section})` : ''}
              </h2>
              <button onClick={() => setViewStudentsClass(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50 transition-all">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto">
              {(() => {
                const roster = getStudentsForClass(viewStudentsClass);
                if (roster.length === 0) {
                  return <p className="text-slate-400 text-center py-8">No students found in this class.</p>;
                }
                return (
                  <div className="space-y-2">
                    {roster.map((s, i) => (
                      <div key={s._id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                        <span className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                          {s.rollNumber || i + 1}
                        </span>
                        <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm">
                          {s.name.charAt(0)}
                        </div>
                        <span className="font-semibold text-slate-900 text-sm">{s.name}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Lesson Plan Modal */}
      {lessonPlanClass && (
        <div className={modalOverlay}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden my-8" style={{ animationDuration: '0.3s', animationIterationCount: 1, animationName: 'zoomIn' }}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-900">
                Lesson Plans — {lessonPlanClass.subject}
              </h2>
              <button onClick={() => setLessonPlanClass(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50 transition-all">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Existing Plans */}
              <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Saved Plans</h3>
                {plansLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : lessonPlans.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-4 bg-slate-50 rounded-xl">No lesson plans yet. Create one below.</p>
                ) : (
                  <div className="space-y-3">
                    {lessonPlans.map(plan => (
                      <div key={plan._id} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-bold text-slate-900">{plan.topic}</p>
                            <p className="text-xs text-slate-500 mt-1">
                              {toNepaliDate(plan.weekStart)} — {toNepaliDate(plan.weekEnd)}
                            </p>
                            {plan.objectives && <p className="text-xs text-slate-600 mt-2"><strong>Objectives:</strong> {plan.objectives}</p>}
                            {plan.activities && <p className="text-xs text-slate-600 mt-1"><strong>Activities:</strong> {plan.activities}</p>}
                            {plan.materials && <p className="text-xs text-slate-600 mt-1"><strong>Materials:</strong> {plan.materials}</p>}
                            {plan.assessment && <p className="text-xs text-slate-600 mt-1"><strong>Assessment:</strong> {plan.assessment}</p>}
                          </div>
                          <button
                            onClick={() => handleDeletePlan(plan._id)}
                            className="text-red-400 hover:text-red-600 p-1 ml-2 shrink-0"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* New Plan Form */}
              <div className="border-t border-slate-100 pt-6">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Create New Plan</h3>
                <form onSubmit={handleSavePlan} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Week Start</label>
                      <NepaliDatePicker
                        value={planForm.weekStart ? new Date(planForm.weekStart) : null}
                        onChange={(d, nepaliStr) => {
                          if (d) setPlanForm({ ...planForm, weekStart: toLocalDateStr(d) });
                        }}
                        locale="en"
                        placeholder="YYYY/MM/DD"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Week End</label>
                      <NepaliDatePicker
                        value={planForm.weekEnd ? new Date(planForm.weekEnd) : null}
                        onChange={(d, nepaliStr) => {
                          if (d) setPlanForm({ ...planForm, weekEnd: toLocalDateStr(d) });
                        }}
                        locale="en"
                        placeholder="YYYY/MM/DD"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Topic</label>
                    <input type="text" required value={planForm.topic} onChange={e => setPlanForm({ ...planForm, topic: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none text-sm"
                      placeholder="e.g. Algebra Fundamentals" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Objectives</label>
                    <textarea value={planForm.objectives} onChange={e => setPlanForm({ ...planForm, objectives: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none text-sm"
                      rows="2" placeholder="What students will learn..." />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Activities</label>
                    <textarea value={planForm.activities} onChange={e => setPlanForm({ ...planForm, activities: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none text-sm"
                      rows="2" placeholder="Class activities and exercises..." />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Materials</label>
                      <textarea value={planForm.materials} onChange={e => setPlanForm({ ...planForm, materials: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none text-sm"
                        rows="2" placeholder="Books, resources..." />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Assessment</label>
                      <textarea value={planForm.assessment} onChange={e => setPlanForm({ ...planForm, assessment: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none text-sm"
                        rows="2" placeholder="Quiz, homework..." />
                    </div>
                  </div>
                  <button type="submit" disabled={savingPlan}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md transition-colors disabled:opacity-50">
                    {savingPlan ? 'Saving...' : 'Save Lesson Plan'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes zoomIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
