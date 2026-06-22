'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AcademicCapIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  CurrencyDollarIcon,
  ClipboardDocumentListIcon,
  ArrowRightIcon,
  MegaphoneIcon,
  XMarkIcon,
  BookOpenIcon,
  UsersIcon,
  TrophyIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { toNepaliDate, toLocalDateStr } from '@/lib/nepaliDate';

function StatBox({ icon: Icon, label, value, sub, color }) {
  const colors = { blue: 'from-blue-500 to-indigo-600', emerald: 'from-emerald-500 to-emerald-600', amber: 'from-amber-500 to-amber-600', purple: 'from-purple-500 to-pink-600' };
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100 flex items-center gap-3">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${colors[color] || colors.blue} text-white shadow-sm`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="text-lg font-extrabold text-slate-900">{value}</p>
        {sub && <p className="text-[10px] font-semibold text-slate-400">{sub}</p>}
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attLoading, setAttLoading] = useState(true);
  const [marks, setMarks] = useState([]);
  const [feeData, setFeeData] = useState(null);
  const [pendingAssignmentCount, setPendingAssignmentCount] = useState(0);
  const [completedAssignmentCount, setCompletedAssignmentCount] = useState(0);
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [notices, setNotices] = useState([]);
  const [showNoticePopup, setShowNoticePopup] = useState(false);
  const [noticeIndex, setNoticeIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const dismissedKey = `dismissedNotices_${session?.user?.id || ''}`;

  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  useEffect(() => {
    if (status === 'unauthenticated' || (session && session.user.role !== 'STUDENT')) router.push('/login');
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'STUDENT') {
      const sid = session?.user?.studentId;
      Promise.all([
        fetch('/api/attendance').then(r => r.json()),
        fetch('/api/marks').then(r => r.json()),
        fetch('/api/assignments').then(r => r.json()),
        fetch('/api/fees').then(r => r.json()),
        sid ? fetch(`/api/exam-routines?studentId=${encodeURIComponent(sid)}`).then(r => r.json()) : Promise.resolve(null),
        fetch('/api/notices').then(r => r.json()),
      ])
        .then(([att, m, asgn, fees, routine, noticeData]) => {
          setAttendanceRecords(Array.isArray(att) ? att : att?.attendance ? att.attendance : []);
          setMarks(Array.isArray(m) ? m : []);
          const asgnArr = Array.isArray(asgn) ? asgn : [];
          setAssignments(asgnArr);
          setPendingAssignmentCount(asgnArr.filter(a => !a.submission || a.submission.status === 'returned').length);
          setCompletedAssignmentCount(asgnArr.filter(a => a.submission && (a.submission.status === 'submitted' || a.submission.status === 'graded')).length);
          if (fees?.student) setFeeData(fees.student);

          const now = new Date(); now.setHours(0, 0, 0, 0);
          const upcoming = [];
          if (routine && routine.terms) {
            routine.terms.forEach(term => {
              (term.subjects || []).forEach(sub => {
                if (sub.date && new Date(sub.date) >= now) {
                  upcoming.push({ subject: sub.name, term: term.name, date: sub.date, fullMarks: sub.fullMarks, passMarks: sub.passMarks });
                }
              });
            });
          }
          upcoming.sort((a, b) => new Date(a.date) - new Date(b.date));
          setUpcomingExams(upcoming);

          const noticesArr = Array.isArray(noticeData) ? noticeData : [];
          const now2 = new Date();
          const activeNotices = noticesArr.filter(n => {
            if (n.expiryDate && new Date(n.expiryDate) < now2) return false;
            return true;
          });
          setNotices(activeNotices);
          const dismissed = JSON.parse(localStorage.getItem(dismissedKey) || '[]');
          const activeIds = new Set(activeNotices.map(n => n._id));
          const validDismissed = dismissed.filter(id => activeIds.has(id));
          localStorage.setItem(dismissedKey, JSON.stringify(validDismissed));
          const unseen = activeNotices.filter(n => n.imageUrl && !validDismissed.includes(n._id));
          if (unseen.length > 0) { setShowNoticePopup(true); setNoticeIndex(activeNotices.findIndex(n => n._id === unseen[0]._id)); }

          setAttLoading(false); setLoading(false);
        })
        .catch(() => { setAttLoading(false); setLoading(false); });
    }
  }, [status, session]);

  const dismissNotice = (id) => {
    const dismissed = JSON.parse(localStorage.getItem(dismissedKey) || '[]');
    localStorage.setItem(dismissedKey, JSON.stringify([...new Set([...dismissed, id])]));
    setNotices(prev => prev.filter(n => n._id !== id));
  };

  if (status === 'loading' || loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-emerald-600 border-t-transparent" />
    </div>
  );

  const totalDays = attendanceRecords.length;
  const totalPresent = attendanceRecords.reduce((sum, rec) => {
    const me = rec.students.find(s => s.studentId?._id === session?.user?.id);
    return sum + (me?.status === 'Present' ? 1 : 0);
  }, 0);
  const attPct = totalDays > 0 ? Math.round((totalPresent / totalDays) * 100) : 0;

  const monthRecords = attendanceRecords.filter(rec => {
    const d = new Date(rec.date);
    return d.getMonth() === viewMonth && d.getFullYear() === viewYear;
  });
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const monthAttendance = {};
  monthRecords.forEach(rec => {
    const dateStr = toLocalDateStr(rec.date);
    const me = rec.students.find(s => s.studentId?._id === session?.user?.id);
    if (me) monthAttendance[dateStr] = me.status;
  });
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1;
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    return { date: d, status: monthAttendance[dateStr] || null };
  });
  const monthPresent = monthDays.filter(d => d.status === 'Present').length;
  const monthAbsent = monthDays.filter(d => d.status === 'Absent').length;

  const avgPercentage = marks.length > 0
    ? Math.round(marks.reduce((sum, m) => sum + (m.marksObtained / m.totalMarks) * 100, 0) / marks.length)
    : 0;

  const quickLinks = [
    { label: 'Marksheet', icon: AcademicCapIcon, href: '/student/marksheet', color: 'from-blue-500 to-indigo-600' },
    { label: 'Assignments', icon: ClipboardDocumentListIcon, href: '/student/assignments', color: 'from-purple-500 to-pink-600' },
    { label: 'Routine', icon: CalendarIcon, href: '/student/routine', color: 'from-emerald-500 to-emerald-600' },
    { label: 'Fees', icon: CurrencyDollarIcon, href: '/student/fees', color: 'from-amber-500 to-amber-600' },
  ];

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50/80 via-white to-emerald-50/20">
      <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6 lg:p-8">

        {/* ─── Header ─── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900 p-5 sm:p-6 shadow-xl">
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
              <SparklesIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">Student Portal</h1>
              <p className="text-xs text-emerald-200">Welcome, {session?.user?.name}</p>
            </div>
          </div>
        </div>

        {/* ─── Stats Row ─── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatBox icon={ClockIcon} label="Attendance" value={attLoading ? '...' : `${attPct}%`} sub={attLoading ? '' : `${totalPresent}/${totalDays} days`} color="emerald" />
          <StatBox icon={TrophyIcon} label="Avg. Score" value={marks.length > 0 ? `${avgPercentage}%` : 'N/A'} color="blue" />
          <StatBox icon={CurrencyDollarIcon} label="Fee Status" value={feeData?.feeStatus ? feeData.feeStatus.charAt(0).toUpperCase() + feeData.feeStatus.slice(1) : 'N/A'} color="amber" />
          <StatBox icon={ClipboardDocumentListIcon} label="Assignments" value={pendingAssignmentCount} sub={`${completedAssignmentCount} completed`} color="purple" />
        </div>

        {/* ─── Quick Links ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickLinks.map(link => (
            <Link key={link.label} href={link.href}
              className="group rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100 transition-all hover:shadow-md hover:-translate-y-0.5">
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${link.color} text-white shadow-sm`}>
                <link.icon className="h-5 w-5" />
              </div>
              <p className="text-sm font-bold text-slate-900">{link.label}</p>
              <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 transition-colors group-hover:text-emerald-600">
                View <ArrowRightIcon className="h-3 w-3" />
              </span>
            </Link>
          ))}
        </div>

        {/* ─── Main Grid ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left: Attendance Calendar */}
          <div className="lg:col-span-2 space-y-5">
            {!attLoading && attendanceRecords.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-700">Attendance Calendar</h3>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); }}
                      className="rounded-lg border border-slate-200 p-1 text-xs text-slate-500 transition-all hover:bg-slate-50">&larr;</button>
                    <span className="min-w-[90px] text-center text-xs font-bold text-slate-600">
                      {toNepaliDate(new Date(viewYear, viewMonth))}
                    </span>
                    <button onClick={() => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); }}
                      className="rounded-lg border border-slate-200 p-1 text-xs text-slate-500 transition-all hover:bg-slate-50">&rarr;</button>
                  </div>
                </div>
                <div className="mb-4 flex items-center gap-4 text-[10px] font-bold">
                  <span className="flex items-center gap-1 text-emerald-600"><CheckCircleIcon className="h-3 w-3" /> Present: {monthPresent}</span>
                  <span className="flex items-center gap-1 text-red-600"><XCircleIcon className="h-3 w-3" /> Absent: {monthAbsent}</span>
                  <span className="flex items-center gap-1 text-slate-400"><span className="inline-block h-3 w-3 rounded-full border border-slate-200" /> No Record</span>
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="py-1 text-center text-[9px] font-bold uppercase tracking-wider text-slate-400">{d[0]}</div>
                  ))}
                  {Array.from({ length: new Date(viewYear, viewMonth, 1).getDay() }, (_, i) => <div key={`e-${i}`} />)}
                  {monthDays.map(day => {
                    const dayOfWeek = new Date(viewYear, viewMonth, day.date).getDay();
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                    return (
                      <div key={day.date} className={`flex aspect-square flex-col items-center justify-center rounded-lg text-[11px] font-bold ${day.status === 'Present' ? 'bg-emerald-100 text-emerald-700' : day.status === 'Absent' ? 'bg-red-100 text-red-700' : isWeekend ? 'bg-slate-50 text-slate-300' : 'bg-slate-50 text-slate-300'}`}>
                        <span>{day.date}</span>
                        {day.status && <span className="mt-0.5 text-[8px] leading-none">{day.status === 'Present' ? 'P' : 'A'}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Upcoming Exams */}
            {upcomingExams.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-bold text-slate-700">Upcoming Exams</h3>
                <div className="space-y-2">
                  {upcomingExams.slice(0, 5).map((ex, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg bg-slate-50 p-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                        <CalendarIcon className="h-4 w-4 text-emerald-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-700">{ex.subject}</p>
                        <p className="text-[10px] font-semibold text-slate-400">{toNepaliDate(ex.date)} &middot; {ex.term}</p>
                      </div>
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">{ex.fullMarks} marks</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-5">
            {/* Quick Info */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-sm font-bold text-slate-700">Quick Info</h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between"><span className="text-slate-400">Name</span><span className="font-bold text-slate-900">{session?.user?.name}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Student ID</span><span className="font-bold text-slate-900">{session?.user?.studentId || '-'}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Grade</span><span className="font-bold text-slate-900">{session?.user?.grade || '-'}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Email</span><span className="font-bold text-slate-900">{session?.user?.email}</span></div>
              </div>
            </div>

            {/* Performance */}
            {marks.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-bold text-slate-700">Performance</h3>
                <div className="flex items-center gap-5">
                  <div className="relative h-24 w-24 shrink-0">
                    <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                      <circle cx="50" cy="50" r="42" fill="none"
                        stroke={avgPercentage >= 60 ? '#059669' : '#dc2626'}
                        strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={`${(avgPercentage / 100) * 264} 264`} />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-black text-slate-800">{avgPercentage}%</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /><span className="text-xs text-slate-500">Passing marks: 40%</span></div>
                    <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-blue-500" /><span className="text-xs text-slate-500">{marks.length} subject{marks.length > 1 ? 's' : ''}</span></div>
                    <p className="mt-1 text-xs text-slate-400">{avgPercentage >= 40 ? '\u2705 Passing' : '\u274c Needs improvement'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Assignments */}
            {assignments.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-bold text-slate-700">Recent Assignments</h3>
                <div className="space-y-2">
                  {assignments.slice(0, 3).map((a, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg bg-slate-50 p-2.5">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${a.submission && (a.submission.status === 'submitted' || a.submission.status === 'graded') ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                        <ClipboardDocumentListIcon className={`h-4 w-4 ${a.submission && (a.submission.status === 'submitted' || a.submission.status === 'graded') ? 'text-emerald-500' : 'text-amber-500'}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-slate-700">{a.title}</p>
                        <p className="text-[10px] capitalize text-slate-400">{a.submission?.status || 'pending'}</p>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400">{a.classId}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Notice Popup ─── */}
      {showNoticePopup && notices.length > 0 && noticeIndex < notices.length && notices[noticeIndex]?.imageUrl && (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
          <button onClick={() => {
            const currentId = notices[noticeIndex]?._id;
            if (currentId) {
              const dismissed = JSON.parse(localStorage.getItem(dismissedKey) || '[]');
              localStorage.setItem(dismissedKey, JSON.stringify([...new Set([...dismissed, currentId])]));
            }
            const dismissedIds = JSON.parse(localStorage.getItem(dismissedKey) || '[]');
            const remaining = notices.filter(n => n.imageUrl && !dismissedIds.includes(n._id));
            if (remaining.length > 0) {
              setNoticeIndex(notices.findIndex(n => n._id === remaining[0]._id));
            } else {
              setShowNoticePopup(false);
            }
          }}
            className="absolute top-4 right-4 z-10 cursor-pointer rounded-full bg-white/20 p-2 text-white transition-colors hover:bg-white/40">
            <XMarkIcon className="h-6 w-6" />
          </button>
          <img src={notices[noticeIndex].imageUrl} alt="Notice" className="max-h-full max-w-full object-contain p-8" />
        </div>
      )}
    </div>
  );
}
