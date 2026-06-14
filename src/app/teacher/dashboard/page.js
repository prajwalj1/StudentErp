'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MegaphoneIcon, PhotoIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

/**
 * Teacher Dashboard Page
 * Content is focused on class schedules and academic performance.
 * The shell (Sidebar/Header) is provided by LayoutWrapper.
 */
export default function TeacherDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [schedules, setSchedules] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticeImage, setNoticeImage] = useState(null);
  const [noticePreview, setNoticePreview] = useState('');
  const [sendingNotice, setSendingNotice] = useState(false);
  const [noticeMsg, setNoticeMsg] = useState(null);

  useEffect(() => {
    if (status === 'unauthenticated' || (session && session.user.role !== 'TEACHER')) {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchData();
    }
  }, [status, session, router]);

  const fetchData = async () => {
    try {
      const [classesRes, studentsRes] = await Promise.all([
        fetch('/api/classes'),
        fetch('/api/students'),
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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) return (
    <div className="flex items-center justify-center p-20">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="p-4 sm:p-8 space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-8 text-white shadow-xl">
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-black mb-2">Welcome Back, <span className="whitespace-nowrap">{session?.user?.name}</span>!</h1>
          <p className="text-indigo-100 max-w-md">You have {schedules.length} classes scheduled. Your dashboard is now synced with your live timetable.</p>
        </div>
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Today's Schedule & My Students */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">Assigned Schedule</h3>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{schedules.length} Classes Total</span>
            </div>
            <div className="space-y-4">
              {schedules.length === 0 ? (
                <p className="text-slate-500 text-sm">You have no classes assigned yet. Please contact the Owner.</p>
              ) : (
                schedules.map((item) => (
                <div key={item._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white border border-slate-200 text-slate-900 rounded-xl flex items-center justify-center font-bold text-xs text-center leading-tight shadow-sm px-1">
                      {item.time.split('-')[0]?.trim()}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{item.subject}</h4>
                      <p className="text-xs text-slate-500 font-medium">{item.grade} {item.section ? `(Sec ${item.section})` : ''} • {item.room || 'TBD'}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => router.push('/teacher/attendance')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all hidden sm:block"
                  >
                    Mark Attendance
                  </button>
                </div>
              )))}
            </div>
          </div>

          {/* My Students */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">My Students</h3>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{students.length} Total</span>
            </div>
            {students.length === 0 ? (
              <p className="text-slate-500 text-sm">No students found for your assigned classes.</p>
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
                        <h4 className="text-sm font-bold text-slate-700">{grade}</h4>
                        <span className="text-xs text-slate-400">{groups[grade].length} students</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {groups[grade].slice(0, 6).map(s => (
                          <div key={s._id} className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">{s.name.charAt(0)}</div>
                            <span className="text-xs font-semibold text-slate-800">{s.name}</span>
                          </div>
                        ))}
                        {groups[grade].length > 6 && (
                          <span className="text-xs text-slate-400 self-center">+{groups[grade].length - 6} more</span>
                        )}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}
            <button
              onClick={() => router.push('/teacher/students')}
              className="mt-4 w-full py-2.5 bg-indigo-50 text-indigo-600 font-bold rounded-xl text-sm hover:bg-indigo-100 transition-colors"
            >
              View All Students
            </button>
          </div>
        </div>

        {/* Sidebar Stats */}
        <div className="space-y-8">
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Class Performance</h3>
            <div className="space-y-6">
              {[
                { label: 'Avg. Attendance', value: '92%', color: 'blue' },
                { label: 'Assignment Completion', value: '78%', color: 'indigo' },
                { label: 'Exams Prepared', value: '60%', color: 'emerald' },
              ].map((stat, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                    <span>{stat.label}</span>
                    <span className="text-slate-900">{stat.value}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full bg-blue-600 rounded-full transition-all duration-1000`} style={{ width: stat.value }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-4">
              <MegaphoneIcon className="w-5 h-5 text-purple-600" />
              <h3 className="text-base font-bold text-slate-800">Send Notice</h3>
            </div>
            {noticeMsg && (
              <div className={`mb-3 p-2 rounded-xl text-xs font-bold ${noticeMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                {noticeMsg.text}
              </div>
            )}
            <input type="text" value={noticeTitle} onChange={e => setNoticeTitle(e.target.value)}
              placeholder="Notice title (optional)"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-purple-500" />
            <textarea value={noticeContent} onChange={e => setNoticeContent(e.target.value)}
              placeholder="Write your notice..."
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
            <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-slate-200 rounded-xl text-xs text-slate-500 hover:bg-slate-50 cursor-pointer mb-2">
              <PhotoIcon className="w-4 h-4" />
              {noticeImage ? 'Image selected' : 'Attach image'}
              <input type="file" accept="image/*" className="hidden" onChange={e => {
                const file = e.target.files[0];
                if (file) {
                  setNoticeImage(file);
                  const reader = new FileReader();
                  reader.onload = (ev) => setNoticePreview(ev.target.result);
                  reader.readAsDataURL(file);
                }
              }} />
            </label>
            {noticePreview && (
              <div className="mb-2">
                <img src={noticePreview} alt="" className="max-h-24 object-contain" />
              </div>
            )}
            <button onClick={async () => {
              if (!noticeContent.trim() && !noticeImage) return;
              setSendingNotice(true);
              try {
                let imageUrl = '';
                if (noticeImage) {
                  imageUrl = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (ev) => resolve(ev.target.result);
                    reader.readAsDataURL(noticeImage);
                  });
                }
                const res = await fetch('/api/notices', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ title: noticeTitle, content: noticeContent, imageUrl, targetAudience: 'student' }),
                });
                if (res.ok) {
                  setNoticeTitle(''); setNoticeContent(''); setNoticeImage(null); setNoticePreview('');
                  setNoticeMsg({ type: 'success', text: 'Notice sent to students!' });
                  setTimeout(() => setNoticeMsg(null), 3000);
                } else {
                  setNoticeMsg({ type: 'error', text: 'Failed to send.' });
                }
              } catch {
                setNoticeMsg({ type: 'error', text: 'Network error.' });
              } finally {
                setSendingNotice(false);
              }
            }} disabled={sendingNotice}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer">
              {sendingNotice ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <PaperAirplaneIcon className="w-4 h-4" />}
              Send to Students
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
