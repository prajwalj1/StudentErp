'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  BookOpenIcon, UserGroupIcon, ClockIcon, XMarkIcon,
  AcademicCapIcon, ChartBarIcon, CheckCircleIcon,
  ExclamationTriangleIcon, EyeIcon, PlusIcon,
} from '@heroicons/react/24/outline';
import { toNepaliDate, toLocalDateStr } from '@/lib/nepaliDate';
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

export default function MyClassesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [toast, setToast] = useState(null);

  const [viewStudentsClass, setViewStudentsClass] = useState(null);
  const [lessonPlanClass, setLessonPlanClass] = useState(null);
  const [lessonPlans, setLessonPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [planForm, setPlanForm] = useState({ weekStart: '', weekEnd: '', topic: '', objectives: '', activities: '', materials: '', assessment: '' });
  const [savingPlan, setSavingPlan] = useState(false);

  const showToast = (type, text) => setToast({ type, text });

  useEffect(() => {
    if (status === 'unauthenticated' || (session && session.user.role !== 'TEACHER')) router.replace('/login');
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated') fetchData();
  }, [status]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [classesRes, studentsRes] = await Promise.all([
        fetch('/api/classes'), fetch('/api/students')
      ]);
      if (classesRes.ok) {
        const data = await classesRes.json();
        const myClasses = data.filter(c => {
          if (!c.teacherId || !c.teacherId.email || !session?.user?.email) return false;
          return c.teacherId.email.toLowerCase() === session.user.email.toLowerCase();
        });
        setClasses(myClasses);
      }
      if (studentsRes.ok) setStudents(await studentsRes.json());
    } catch (e) { console.error(e) } finally { setLoading(false); }
  };

  const getStudentCount = (cls) => {
    return students.filter(s => {
      const sNum = (s.grade || '').replace(/\D/g, '');
      const cNum = (cls.grade || '').replace(/\D/g, '');
      if (sNum !== cNum) return false;
      const cSec = (cls.section || '').toLowerCase().trim();
      if (!cSec) return true;
      return (s.section || '').toLowerCase().trim() === cSec;
    }).length;
  };

  const getStudentsForClass = (cls) => {
    return students.filter(s => {
      const sNum = (s.grade || '').replace(/\D/g, '');
      const cNum = (cls.grade || '').replace(/\D/g, '');
      if (sNum !== cNum) return false;
      const cSec = (cls.section || '').toLowerCase().trim();
      if (!cSec) return true;
      return (s.section || '').toLowerCase().trim() === cSec;
    });
  };

  const fetchLessonPlans = async (classScheduleId) => {
    setPlansLoading(true);
    try {
      const res = await fetch(`/api/lessonplans?classScheduleId=${classScheduleId}`);
      if (res.ok) setLessonPlans(await res.json());
    } catch (e) { console.error(e) } finally { setPlansLoading(false); }
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
      const payload = { classScheduleId: lessonPlanClass._id, grade: lessonPlanClass.grade, section: lessonPlanClass.section || '', subject: lessonPlanClass.subject, ...planForm };
      const res = await fetch('/api/lessonplans', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      if (res.ok) {
        setPlanForm({ weekStart: '', weekEnd: '', topic: '', objectives: '', activities: '', materials: '', assessment: '' });
        fetchLessonPlans(lessonPlanClass._id);
        showToast('success', 'Lesson plan saved!');
      } else showToast('error', 'Failed to save lesson plan.');
    } catch { showToast('error', 'Network error.'); }
    finally { setSavingPlan(false); }
  };

  const handleDeletePlan = async (planId) => {
    try {
      const res = await fetch(`/api/lessonplans/${planId}`, { method: 'DELETE' });
      if (res.ok) fetchLessonPlans(lessonPlanClass._id);
    } catch (e) { console.error(e) }
  };

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-indigo-600 border-t-transparent" />
    </div>
  );

  const totalStudents = classes.reduce((s, c) => s + getStudentCount(c), 0);
  const uniqueGrades = [...new Set(classes.map(c => c.grade).filter(Boolean))];

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50/80 via-white to-indigo-50/20">
      <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6 lg:p-8">

        {/* ─── Header ─── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 sm:p-6 shadow-xl">
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
              <BookOpenIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">My Classes</h1>
              <p className="text-xs text-slate-400">Manage your assigned classes and lesson plans</p>
            </div>
          </div>
        </div>

        {/* ─── Stats Row ─── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatBox icon={AcademicCapIcon} label="Total Classes" value={classes.length} color="blue" />
          <StatBox icon={UserGroupIcon} label="Total Students" value={totalStudents} color="emerald" />
          <StatBox icon={ChartBarIcon} label="Grades Taught" value={uniqueGrades.length} color="amber" />
          <StatBox icon={BookOpenIcon} label="Subjects" value={[...new Set(classes.map(c => c.subject).filter(Boolean))].length} color="indigo" />
        </div>

        {/* ─── Class Cards ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {classes.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <BookOpenIcon className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm font-bold text-slate-500">No classes assigned</p>
              <p className="text-xs text-slate-400 mt-1">Contact the Owner to get assigned.</p>
            </div>
          ) : (
            classes.map((cls) => (
              <div key={cls._id} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-sm group-hover:scale-110 transition-transform">
                    <BookOpenIcon className="h-5 w-5" />
                  </div>
                  <Badge color="slate">{cls.room || 'No Room'}</Badge>
                </div>

                <h3 className="text-base font-bold text-slate-900">{cls.subject}</h3>
                <p className="text-xs text-slate-500 font-medium mb-4">{cls.grade}{cls.section ? ` (Sec ${cls.section})` : ''}</p>

                <div className="space-y-2 mb-5">
                  <div className="flex items-center gap-2.5 text-xs text-slate-600">
                    <UserGroupIcon className="h-4 w-4 text-slate-400" />
                    <span className="font-bold">{getStudentCount(cls)} Students</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-600">
                    <ClockIcon className="h-4 w-4 text-slate-400" />
                    <span className="font-bold">{cls.time || 'TBD'}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t border-slate-100">
                  <button onClick={() => setViewStudentsClass(cls)}
                    className="flex-1 rounded-xl bg-indigo-50 py-2 text-[11px] font-bold text-indigo-600 transition-all hover:bg-indigo-100">
                    <EyeIcon className="h-3.5 w-3.5 inline mr-1 -mt-0.5" /> Students
                  </button>
                  <button onClick={() => openLessonPlan(cls)}
                    className="flex-1 rounded-xl bg-slate-900 py-2 text-[11px] font-bold text-white transition-all hover:bg-slate-800">
                    <PlusIcon className="h-3.5 w-3.5 inline mr-1 -mt-0.5" /> Plan
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ─── View Students Modal ─── */}
      {viewStudentsClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={() => setViewStudentsClass(null)}>
          <div className="w-full max-w-lg animate-[zoomIn_0.2s_ease-out] rounded-2xl bg-white shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
              <h2 className="text-sm font-black text-slate-900">Students — {viewStudentsClass.grade}{viewStudentsClass.section ? ` (Sec ${viewStudentsClass.section})` : ''}</h2>
              <button onClick={() => setViewStudentsClass(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-all">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 max-h-80 overflow-y-auto">
              {(() => {
                const roster = getStudentsForClass(viewStudentsClass);
                if (roster.length === 0) return <p className="text-center text-sm text-slate-400 py-8">No students found in this class.</p>;
                return (
                  <div className="space-y-1.5">
                    {roster.map((s, i) => (
                      <div key={s._id} className="flex items-center gap-3 rounded-xl bg-slate-50 p-2.5 transition-colors hover:bg-slate-100">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-600">{s.rollNumber || i + 1}</span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-[10px] font-bold text-white">{s.name.charAt(0)}</div>
                        <span className="text-sm font-bold text-slate-900">{s.name}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ─── Lesson Plan Modal ─── */}
      {lessonPlanClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={() => setLessonPlanClass(null)}>
          <div className="w-full max-w-2xl animate-[zoomIn_0.2s_ease-out] rounded-2xl bg-white shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
              <h2 className="text-sm font-black text-slate-900">Lesson Plans — {lessonPlanClass.subject}</h2>
              <button onClick={() => setLessonPlanClass(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-all">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Saved Plans */}
              <div>
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Saved Plans</h3>
                {plansLoading ? (
                  <div className="flex justify-center py-4"><div className="h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
                ) : lessonPlans.length === 0 ? (
                  <p className="text-center text-sm text-slate-400 py-4 rounded-xl bg-slate-50">No lesson plans yet.</p>
                ) : (
                  <div className="space-y-2">
                    {lessonPlans.map(plan => (
                      <div key={plan._id} className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-sm font-bold text-slate-900">{plan.topic}</p>
                            <p className="text-[10px] text-slate-500 mt-1">{toNepaliDate(plan.weekStart)} \ {toNepaliDate(plan.weekEnd)}</p>
                            {plan.objectives && <p className="text-xs text-slate-600 mt-2"><strong>Objectives:</strong> {plan.objectives}</p>}
                            {plan.activities && <p className="text-xs text-slate-600 mt-1"><strong>Activities:</strong> {plan.activities}</p>}
                            {plan.materials && <p className="text-xs text-slate-600 mt-1"><strong>Materials:</strong> {plan.materials}</p>}
                            {plan.assessment && <p className="text-xs text-slate-600 mt-1"><strong>Assessment:</strong> {plan.assessment}</p>}
                          </div>
                          <button onClick={() => handleDeletePlan(plan._id)}
                            className="text-red-400 hover:text-red-600 p-1 ml-2 shrink-0">
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* New Plan Form */}
              <div className="border-t border-slate-100 pt-5">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Create New Plan</h3>
                <form onSubmit={handleSavePlan} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Week Start</label>
                      <NepaliDatePicker value={planForm.weekStart ? new Date(planForm.weekStart) : null}
                        onChange={(d) => { if (d) setPlanForm({ ...planForm, weekStart: toLocalDateStr(d) }); }}
                        locale="en" placeholder="YYYY/MM/DD" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Week End</label>
                      <NepaliDatePicker value={planForm.weekEnd ? new Date(planForm.weekEnd) : null}
                        onChange={(d) => { if (d) setPlanForm({ ...planForm, weekEnd: toLocalDateStr(d) }); }}
                        locale="en" placeholder="YYYY/MM/DD" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Topic</label>
                    <input type="text" required value={planForm.topic} onChange={e => setPlanForm({ ...planForm, topic: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      placeholder="e.g. Algebra Fundamentals" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Objectives</label>
                    <textarea value={planForm.objectives} onChange={e => setPlanForm({ ...planForm, objectives: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      rows="2" placeholder="What students will learn..." />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Activities</label>
                    <textarea value={planForm.activities} onChange={e => setPlanForm({ ...planForm, activities: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      rows="2" placeholder="Class activities and exercises..." />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Materials</label>
                      <textarea value={planForm.materials} onChange={e => setPlanForm({ ...planForm, materials: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                        rows="2" placeholder="Books, resources..." />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Assessment</label>
                      <textarea value={planForm.assessment} onChange={e => setPlanForm({ ...planForm, assessment: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                        rows="2" placeholder="Quiz, homework..." />
                    </div>
                  </div>
                  <button type="submit" disabled={savingPlan}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white shadow-lg transition-all hover:bg-slate-800 disabled:opacity-50">
                    {savingPlan ? <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <PlusIcon className="h-3.5 w-3.5" />}
                    {savingPlan ? 'Saving...' : 'Save Lesson Plan'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />

      <style jsx>{`
        @keyframes zoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
