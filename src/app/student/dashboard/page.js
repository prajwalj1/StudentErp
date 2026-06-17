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
  XMarkIcon
} from '@heroicons/react/24/outline';
import { toNepaliDate, toLocalDateStr } from '@/lib/nepaliDate';

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

  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  useEffect(() => {
    if (status === 'unauthenticated' || (session && session.user.role !== 'STUDENT')) {
      router.push('/login');
    }
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

          // Extract upcoming exams from routine subjects
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          const upcoming = [];
          if (routine && routine.terms) {
            routine.terms.forEach(term => {
              (term.subjects || []).forEach(sub => {
                if (sub.date && new Date(sub.date) >= now) {
                  upcoming.push({
                    subject: sub.name,
                    term: term.name,
                    date: sub.date,
                    fullMarks: sub.fullMarks,
                    passMarks: sub.passMarks,
                  });
                }
              });
            });
          }
          upcoming.sort((a, b) => new Date(a.date) - new Date(b.date));
          setUpcomingExams(upcoming);

          // Handle notice popup
          const noticesArr = Array.isArray(noticeData) ? noticeData : [];
          setNotices(noticesArr);
          const showCount = parseInt(localStorage.getItem('noticeShowCount') || '0', 10);
          const dismissed = JSON.parse(localStorage.getItem('dismissedNotices') || '[]');
          const unseen = noticesArr.filter(n => !dismissed.includes(n._id) && n.imageUrl);
          if (unseen.length > 0 && showCount < 5) {
            setShowNoticePopup(true);
            setNoticeIndex(0);
          }

          setAttLoading(false);
          setLoading(false);
        })
        .catch(() => {
          setAttLoading(false);
          setLoading(false);
        });
    }
  }, [status, session]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

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
    { label: 'Marksheet', icon: AcademicCapIcon, href: '/student/marksheet', color: 'bg-blue-50 text-blue-600' },
    { label: 'Assignments', icon: ClipboardDocumentListIcon, href: '/student/assignments', color: 'bg-purple-50 text-purple-600' },
    { label: 'Routine', icon: CalendarIcon, href: '/student/routine', color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Fees', icon: CurrencyDollarIcon, href: '/student/fees', color: 'bg-amber-50 text-amber-600' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pt-5 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Student Portal</h1>
            <p className="text-slate-500">Welcome, {session?.user?.name}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-3 bg-emerald-50 rounded-xl">
              <ClockIcon className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Attendance</p>
              <p className="text-xl font-black text-slate-900">{attLoading ? '...' : `${attPct}%`}</p>
              {!attLoading && <p className="text-[10px] text-slate-400 font-semibold">{totalPresent}/{totalDays} days</p>}
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <AcademicCapIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg. Score</p>
              <p className="text-xl font-black text-slate-900">{marks.length > 0 ? `${avgPercentage}%` : 'N/A'}</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-3 bg-amber-50 rounded-xl">
              <CurrencyDollarIcon className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fee Status</p>
              <p className="text-xl font-black text-slate-900 capitalize">{feeData?.feeStatus || 'N/A'}</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-3 bg-purple-50 rounded-xl">
              <ClipboardDocumentListIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assignments</p>
              <p className="text-xl font-black text-slate-900">{pendingAssignmentCount}</p>
              <p className="text-[10px] text-slate-400 font-semibold">{completedAssignmentCount} completed</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Links */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {quickLinks.map(link => (
                <Link key={link.label} href={link.href}
                  className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-200 transition-all group">
                  <div className={`p-2.5 rounded-xl ${link.color} w-fit mb-3`}>
                    <link.icon className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-bold text-slate-900">{link.label}</p>
                  <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 group-hover:text-blue-600 transition-colors">
                    View <ArrowRightIcon className="w-3 h-3" />
                  </span>
                </Link>
              ))}
            </div>

            {/* Attendance Calendar */}
            {!attLoading && attendanceRecords.length > 0 && (
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-slate-700">Attendance Calendar</h3>
                  <div className="flex items-center gap-2">
                    <button onClick={() => {
                      if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
                      else { setViewMonth(m => m - 1); }
                    }} className="p-1 rounded-lg border border-slate-200 text-xs text-slate-500 hover:bg-slate-50 transition-all">←</button>
                    <span className="text-xs font-bold text-slate-600 min-w-[90px] text-center">
                      {toNepaliDate(new Date(viewYear, viewMonth))}
                    </span>
                    <button onClick={() => {
                      if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
                      else { setViewMonth(m => m + 1); }
                    }} className="p-1 rounded-lg border border-slate-200 text-xs text-slate-500 hover:bg-slate-50 transition-all">→</button>
                  </div>
                </div>
                <div className="flex items-center gap-4 mb-4 text-[10px] font-bold">
                  <span className="flex items-center gap-1 text-emerald-600"><CheckCircleIcon className="w-3 h-3" /> Present: {monthPresent}</span>
                  <span className="flex items-center gap-1 text-red-600"><XCircleIcon className="w-3 h-3" /> Absent: {monthAbsent}</span>
                  <span className="flex items-center gap-1 text-slate-400"><span className="w-3 h-3 rounded-full border border-slate-200 inline-block" /> No Record</span>
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="text-center text-[9px] font-bold text-slate-400 uppercase tracking-wider py-1">{d[0]}</div>
                  ))}
                  {Array.from({ length: new Date(viewYear, viewMonth, 1).getDay() }, (_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {monthDays.map(day => {
                    const dayOfWeek = new Date(viewYear, viewMonth, day.date).getDay();
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                    return (
                      <div key={day.date} className={`aspect-square rounded-lg flex flex-col items-center justify-center text-[11px] font-bold ${day.status === 'Present' ? 'bg-emerald-100 text-emerald-700' : day.status === 'Absent' ? 'bg-red-100 text-red-700' : isWeekend ? 'bg-slate-50 text-slate-300' : 'bg-slate-50 text-slate-300'}`}>
                        <span>{day.date}</span>
                        {day.status && <span className="text-[8px] leading-none mt-0.5">{day.status === 'Present' ? 'P' : 'A'}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="text-sm font-bold text-slate-700 mb-4">Quick Info</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Name</span>
                  <span className="font-semibold text-slate-900">{session?.user?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Student ID</span>
                  <span className="font-semibold text-slate-900">{session?.user?.studentId || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Email</span>
                  <span className="font-semibold text-slate-900">{session?.user?.email}</span>
                </div>
              </div>
            </div>

            {marks.length > 0 && (
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <h3 className="text-sm font-bold text-slate-700 mb-4">Performance Overview</h3>
                <div className="flex items-center gap-5">
                  <div className="relative w-24 h-24 shrink-0">
                    <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
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
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="text-xs text-slate-500">Passing marks: 40%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      <span className="text-xs text-slate-500">{marks.length} subject{marks.length > 1 ? 's' : ''}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {avgPercentage >= 40 ? '✅ Passing' : '❌ Needs improvement'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="text-sm font-bold text-slate-700 mb-4">Upcoming Exams</h3>
              {upcomingExams.length > 0 ? (
                <div className="space-y-2">
                  {upcomingExams.slice(0, 5).map((ex, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-slate-50">
                      <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                        <CalendarIcon className="w-4 h-4 text-red-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-700 truncate">{ex.subject}</p>
                        <p className="text-[10px] text-slate-400 font-semibold">
                          {toNepaliDate(ex.date)} · {ex.term}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{ex.fullMarks} marks</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-xs">No upcoming exams scheduled.</p>
              )}
            </div>

            {/* Recent Assignments */}
            {assignments.length > 0 && (
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <h3 className="text-sm font-bold text-slate-700 mb-4">Recent Assignments</h3>
                <div className="space-y-2">
                  {assignments.slice(0, 3).map((a, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-slate-50">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${a.submission && (a.submission.status === 'submitted' || a.submission.status === 'graded') ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                        <ClipboardDocumentListIcon className={`w-4 h-4 ${a.submission && (a.submission.status === 'submitted' || a.submission.status === 'graded') ? 'text-emerald-500' : 'text-amber-500'}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-700 truncate">{a.title}</p>
                        <p className="text-[10px] text-slate-400 capitalize">{a.submission?.status || 'pending'}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold">{a.subject}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notice Popup - Image Only */}
      {showNoticePopup && notices.length > 0 && noticeIndex < notices.length && (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
          <button onClick={() => {
            const next = noticeIndex + 1;
            if (next < notices.length && notices[next].imageUrl) {
              setNoticeIndex(next);
            } else {
              const count = parseInt(localStorage.getItem('noticeShowCount') || '0', 10);
              localStorage.setItem('noticeShowCount', String(count + 1));
              const allIds = notices.map(n => n._id);
              localStorage.setItem('dismissedNotices', JSON.stringify(allIds));
              setShowNoticePopup(false);
            }
          }}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/20 hover:bg-white/40 transition-colors cursor-pointer text-white">
            <XMarkIcon className="w-6 h-6" />
          </button>
          {notices[noticeIndex]?.imageUrl && (
            <img src={notices[noticeIndex].imageUrl} alt="Notice"
              className="max-w-full max-h-full object-contain p-8" />
          )}
        </div>
      )}
    </div>
  );
}
