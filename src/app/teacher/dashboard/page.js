'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  BookOpenIcon, UserGroupIcon, ClockIcon, CheckCircleIcon,
  ExclamationTriangleIcon, AcademicCapIcon, ChartBarIcon,
  ArrowRightIcon, XMarkIcon,
} from '@heroicons/react/24/outline';

function StatBox({ icon: Icon, label, value, color, onClick }) {
  const colors = { blue: 'from-blue-500 to-indigo-600', emerald: 'from-emerald-500 to-emerald-600', amber: 'from-amber-500 to-amber-600', indigo: 'from-indigo-500 to-purple-600' };
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp onClick={onClick} className={`rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100 flex items-center gap-3 ${onClick ? 'cursor-pointer hover:shadow-md transition-all' : ''}`}>
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${colors[color] || colors.blue} text-white shadow-sm`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-left">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="text-lg font-extrabold text-slate-900">{value}</p>
      </div>
    </Comp>
  );
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

export default function TeacherDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [schedules, setSchedules] = useState([]);
  const [students, setStudents] = useState([]);
  const [notices, setNotices] = useState([]);
  const [showNoticePopup, setShowNoticePopup] = useState(false);
  const [noticePopupIndex, setNoticePopupIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [performanceStats, setPerformanceStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const dismissedKey = `dismissedNotices_${session?.user?.id || ''}`;

  const showToast = (type, text) => setToast({ type, text });

  const dismissNotice = (id) => {
    const dismissed = JSON.parse(localStorage.getItem(dismissedKey) || '[]');
    localStorage.setItem(dismissedKey, JSON.stringify([...new Set([...dismissed, id])]));
    setNotices(prev => prev.filter(n => n._id !== id));
  };

  useEffect(() => {
    if (status === 'unauthenticated' || (session && session.user.role !== 'TEACHER')) {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchData();
    }
  }, [status, session, router]);

  const fetchData = async () => {
    try {
      const [classesRes, studentsRes, noticesRes] = await Promise.all([
        fetch('/api/classes'), fetch('/api/students'), fetch('/api/notices'),
      ]);
      if (classesRes.ok && studentsRes.ok) {
        const classesData = await classesRes.json();
        const studentsData = await studentsRes.json();
        const myClasses = classesData.filter(c => {
          if (!c.teacherId || !c.teacherId.email || !session?.user?.email) return false;
          return c.teacherId.email.toLowerCase() === session.user.email.toLowerCase();
        });
        const gradeSet = new Set(myClasses.map(c => c.grade).filter(Boolean));
        setSchedules(myClasses);
        setStudents(studentsData.filter(s => gradeSet.has(s.grade)));
      }
      if (noticesRes.ok) {
        const allNotices = await noticesRes.json();
        const now = new Date();
        const active = allNotices.filter(n => {
          if (n.expiryDate && new Date(n.expiryDate) < now) return false;
          return true;
        });
        setNotices(active);
        const dismissed = JSON.parse(localStorage.getItem(dismissedKey) || '[]');
        const activeIds = new Set(active.map(n => n._id));
        const validDismissed = dismissed.filter(id => activeIds.has(id));
        localStorage.setItem(dismissedKey, JSON.stringify(validDismissed));
        const unseen = active.filter(n => n.imageUrl && !validDismissed.includes(n._id));
        if (unseen.length > 0) { setShowNoticePopup(true); setNoticePopupIndex(active.findIndex(n => n._id === unseen[0]._id)); }
      }
    } catch (e) { console.error(e) } finally { setLoading(false); }
  };

  const uniqueGrades = [...new Set(schedules.map(s => s.grade).filter(Boolean))];

  useEffect(() => {
    if (!selectedGrade) {
      setPerformanceStats(null);
      return;
    }
    setStatsLoading(true);
    fetch(`/api/teacher/stats?grade=${encodeURIComponent(selectedGrade)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => setPerformanceStats(data))
      .catch(() => setPerformanceStats(null))
      .finally(() => setStatsLoading(false));
  }, [selectedGrade]);

  if (status === 'loading' || loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-blue-600 border-t-transparent" />
    </div>
  );

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50/80 via-white to-blue-50/20">
      <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6 lg:p-8">

        {/* ─── Hero Header ─── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 sm:p-6 shadow-xl">
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                <AcademicCapIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white">Welcome Back, {session?.user?.name}</h1>
                <p className="text-xs text-slate-400">You have {schedules.length} class{schedules.length !== 1 ? 'es' : ''} scheduled</p>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Stats Row ─── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatBox icon={BookOpenIcon} label="My Classes" value={schedules.length} color="blue" onClick={() => router.push('/teacher/classes')} />
          <StatBox icon={UserGroupIcon} label="My Students" value={students.length} color="emerald" onClick={() => router.push('/teacher/students')} />
          <StatBox icon={AcademicCapIcon} label="Grades Taught" value={uniqueGrades.length} color="amber" />
          <StatBox icon={ChartBarIcon} label="Subjects" value={[...new Set(schedules.map(s => s.subject).filter(Boolean))].length} color="indigo" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left Column — Schedule & Students */}
          <div className="lg:col-span-2 space-y-5">

            {/* ─── Assigned Schedule ─── */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900">Assigned Schedule</h3>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">{schedules.length} Class{schedules.length !== 1 ? 'es' : ''}</span>
              </div>
              {schedules.length === 0 ? (
                <p className="text-sm text-slate-500">You have no classes assigned yet. Please contact the Owner.</p>
              ) : (
                <div className="space-y-2">
                  {schedules.map((item) => (
                    <div key={item._id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3 transition-all hover:bg-slate-100 hover:shadow-sm border border-transparent hover:border-slate-200">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-center text-[10px] font-bold leading-tight text-slate-700 shadow-sm border border-slate-200">
                          {item.time?.split('-')[0]?.trim() || 'TBD'}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{item.subject}</h4>
                          <p className="text-[10px] text-slate-500 font-medium">{item.grade}{item.section ? ` (Sec ${item.section})` : ''} / {item.room || 'TBD'}</p>
                        </div>
                      </div>
                      <button onClick={() => router.push('/teacher/attendance')}
                        className="hidden sm:inline-flex items-center gap-1 rounded-xl bg-blue-600 px-4 py-2 text-[10px] font-bold text-white shadow-sm transition-all hover:bg-blue-700">
                        Mark Attendance <ArrowRightIcon className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ─── My Students ─── */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900">My Students</h3>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">{students.length} Total</span>
              </div>
              {students.length === 0 ? (
                <p className="text-sm text-slate-500">No students found for your assigned classes.</p>
              ) : (
                <div className="space-y-4">
                  {(() => {
                    const groups = {};
                    students.forEach(s => {
                      const key = s.grade || 'Ungraded';
                      if (!groups[key]) groups[key] = [];
                      groups[key].push(s);
                    });
                    return Object.keys(groups).sort().map(grade => (
                      <div key={grade}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-bold text-slate-700">{grade}</h4>
                          <span className="text-[10px] text-slate-400">{groups[grade].length} students</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {groups[grade].slice(0, 8).map(s => (
                            <div key={s._id} className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1 border border-slate-100">
                              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-[8px] font-bold text-white">{s.name.charAt(0)}</div>
                              <span className="text-[10px] font-semibold text-slate-800">{s.name}</span>
                            </div>
                          ))}
                          {groups[grade].length > 8 && (
                            <span className="text-[10px] text-slate-400 self-center">+{groups[grade].length - 8} more</span>
                          )}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}
              <button onClick={() => router.push('/teacher/students')}
                className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-50 py-2.5 text-xs font-bold text-indigo-600 transition-all hover:bg-indigo-100">
                View All Students <ArrowRightIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Right Column — Performance + Notice */}
          <div className="space-y-5">

            {/* ─── Class Performance ─── */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-sm">
                    <ChartBarIcon className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Class Performance</h3>
                </div>
                {uniqueGrades.length > 0 && (
                  <select
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
                  >
                    <option value="">All Grades</option>
                    {uniqueGrades.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                )}
              </div>
              {statsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
                </div>
              ) : !selectedGrade ? (
                <p className="text-center text-xs text-slate-400 py-8">Select a grade to view performance</p>
              ) : !performanceStats ? (
                <p className="text-center text-xs text-slate-400 py-8">No data available</p>
              ) : (
                <div className="space-y-5">
                  {[
                    { label: 'Avg. Attendance', value: performanceStats.attendance, color: 'from-blue-500 to-blue-600' },
                    { label: 'Assignment Completion', value: performanceStats.assignmentCompletion, color: 'from-indigo-500 to-indigo-600' },
                    { label: 'Exams Prepared', value: performanceStats.examsPrepared, color: 'from-emerald-500 to-emerald-600' },
                  ].map((stat, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1.5">
                        <span>{stat.label}</span>
                        <span className="text-slate-900">{stat.value}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className={`h-full rounded-full bg-gradient-to-r ${stat.color} transition-all duration-1000`} style={{ width: `${stat.value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ─── Recent Notices ─── */}
            {notices.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-800">Recent Notices</h3>
                  <button onClick={() => router.push('/teacher/notices')}
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-700 transition-colors">View All</button>
                </div>
                <div className="space-y-3">
                  {notices.slice(0, 3).map((n) => (
                    <div key={n._id} className="relative rounded-xl border border-slate-100 bg-slate-50 p-3 pr-9">
                      <button onClick={() => dismissNotice(n._id)}
                        className="absolute top-2 right-2 rounded p-0.5 text-slate-300 transition-all hover:bg-red-50 hover:text-red-500">
                        <XMarkIcon className="h-3.5 w-3.5" />
                      </button>
                      {n.title && <p className="text-xs font-bold text-slate-900 mb-1">{n.title}</p>}
                      {n.content && <p className="text-[11px] text-slate-600 line-clamp-2">{n.content}</p>}
                      {n.imageUrl && (
                        <img src={n.imageUrl} alt="" className="mt-2 max-h-16 rounded-lg object-contain border border-slate-200" />
                      )}
                      <p className="mt-1.5 text-[10px] text-slate-400 font-semibold">Posted by {n.createdByName}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}


          </div>
        </div>
      </div>

      {/* ─── Notice Popup ─── */}
      {showNoticePopup && notices.length > 0 && noticePopupIndex < notices.length && notices[noticePopupIndex]?.imageUrl && (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
          <button onClick={() => {
            const currentId = notices[noticePopupIndex]?._id;
            if (currentId) {
              const dismissed = JSON.parse(localStorage.getItem(dismissedKey) || '[]');
              localStorage.setItem(dismissedKey, JSON.stringify([...new Set([...dismissed, currentId])]));
            }
            const dismissedIds = JSON.parse(localStorage.getItem(dismissedKey) || '[]');
            const remaining = notices.filter(n => n.imageUrl && !dismissedIds.includes(n._id));
            if (remaining.length > 0) {
              setNoticePopupIndex(notices.findIndex(n => n._id === remaining[0]._id));
            } else {
              setShowNoticePopup(false);
            }
          }}
            className="absolute top-4 right-4 z-10 cursor-pointer rounded-full bg-white/20 p-2 text-white transition-colors hover:bg-white/40">
            <XMarkIcon className="h-6 w-6" />
          </button>
          <img src={notices[noticePopupIndex].imageUrl} alt="Notice" className="max-h-full max-w-full object-contain p-8" />
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
