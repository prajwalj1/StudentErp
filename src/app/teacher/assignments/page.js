'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  PlusIcon, DocumentTextIcon, PaperClipIcon,
  CalendarIcon, UserGroupIcon, CheckCircleIcon,
  XMarkIcon, AcademicCapIcon, TrashIcon,
  ExclamationTriangleIcon, BookOpenIcon, ClockIcon
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

function ConfirmModal({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={onCancel}>
      <div className="w-full max-w-sm animate-[zoomIn_0.2s_ease-out] rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 mb-4">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
          </div>
          <h3 className="text-sm font-black text-slate-900">{title}</h3>
          <p className="mt-2 text-xs text-slate-500">{message}</p>
        </div>
        <div className="flex gap-3 border-t border-slate-100 p-4">
          <button onClick={onCancel} className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 transition-all hover:bg-slate-50">Cancel</button>
          <button onClick={onConfirm} className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg transition-all hover:bg-red-600" autoFocus>Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function AssignmentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [assignments, setAssignments] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ title: '', classId: '', dueDate: '', fileUrl: '', fileName: '' });
  const [filterClass, setFilterClass] = useState('All');
  const [classOptions, setClassOptions] = useState([]);
  const [gradeModal, setGradeModal] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [gradeValues, setGradeValues] = useState({});
  const [feedbackValues, setFeedbackValues] = useState({});
  const [toast, setToast] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [gradingSubId, setGradingSubId] = useState(null);

  const showToast = (type, text) => setToast({ type, text });

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') { fetchAssignments(); fetchClassOptions(); }
  }, [status]);

  const fetchClassOptions = async () => {
    try {
      const classesRes = await fetch('/api/classes');
      if (classesRes.ok) {
        const classes = await classesRes.json();
        const myClasses = classes.filter(c => c.teacherId && c.teacherId._id === session?.user?.id);
        const pairs = new Set();
        myClasses.forEach(c => pairs.add(`${c.grade || 'Grade 10'}${c.section ? `-${c.section}` : ''}`));
        const opts = ['All', ...Array.from(pairs).sort()];
        setClassOptions(opts);
        if (opts.length > 1) setFormData(prev => ({ ...prev, classId: opts[1] }));
      }
    } catch { setClassOptions(['All']); }
  };

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/assignments');
      if (res.ok) setAssignments(await res.json());
      else setAssignments([]);
    } catch { setAssignments([]); }
    finally { setLoading(false); }
  };

  const fetchSubmissions = async (assignmentId) => {
    try {
      const res = await fetch(`/api/submissions?assignmentId=${assignmentId}`);
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data);
        const grades = {}; const feedbacks = {};
        data.forEach(s => { if (s.grade !== null && s.grade !== undefined) grades[s._id] = s.grade; if (s.feedback) feedbacks[s._id] = s.feedback; });
        setGradeValues(grades); setFeedbackValues(feedbacks);
      }
    } catch { setSubmissions([]); }
  };

  const openGradeModal = (assignment) => { setGradeModal(assignment); fetchSubmissions(assignment._id); };

  const handleGrade = async (subId) => {
    const grade = gradeValues[subId];
    const feedback = feedbackValues[subId] || '';
    if (grade === undefined || grade === '' || Number(grade) < 0 || Number(grade) > 100) {
      showToast('error', 'Enter a grade between 0 and 100.');
      return;
    }
    setGradingSubId(subId);
    try {
      const res = await fetch(`/api/submissions?id=${subId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grade: Number(grade), feedback, status: 'graded' }),
      });
      if (res.ok) { fetchSubmissions(gradeModal._id); fetchAssignments(); showToast('success', 'Graded!'); }
      else { const err = await res.json(); showToast('error', err.error || 'Failed.'); }
    } catch { showToast('error', 'Network error.'); }
    finally { setGradingSubId(null); }
  };

  const handleReturn = async (subId) => {
    const feedback = feedbackValues[subId] || '';
    setGradingSubId(subId);
    try {
      const res = await fetch(`/api/submissions?id=${subId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grade: 0, feedback, status: 'returned' }),
      });
      if (res.ok) { fetchSubmissions(gradeModal._id); fetchAssignments(); showToast('success', 'Returned for revision!'); }
      else { const err = await res.json(); showToast('error', err.error || 'Failed.'); }
    } catch { showToast('error', 'Network error.'); }
    finally { setGradingSubId(null); }
  };

  const toggleCompleted = async (assignmentId, currentStatus) => {
    try {
      const res = await fetch('/api/assignments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: assignmentId, status: currentStatus === 'Active' ? 'Completed' : 'Active' }),
      });
      if (res.ok) { fetchAssignments(); showToast('success', currentStatus === 'Active' ? 'Marked completed!' : 'Reopened!'); }
    } catch { showToast('error', 'Failed.'); }
  };

  const handlePost = async (e) => {
    e.preventDefault();
    try {
      const payload = { title: formData.title, classId: formData.classId, dueDate: formData.dueDate };
      if (formData.fileUrl) { payload.fileUrl = formData.fileUrl; payload.fileName = formData.fileName; }
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowAddModal(false);
        const firstClass = classOptions.find(c => c !== 'All') || 'Grade 10-A';
        setFormData({ title: '', classId: firstClass, dueDate: '', fileUrl: '', fileName: '' });
        fetchAssignments();
        showToast('success', 'Assignment created!');
      } else {
        const err = await res.json();
        showToast('error', err.error || 'Failed.');
      }
    } catch { showToast('error', 'Network error.'); }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { showToast('error', 'Only PDF files allowed.'); e.target.value = ''; return; }
    setFormData({ ...formData, fileName: file.name });
    const reader = new FileReader();
    reader.onload = (ev) => setFormData(prev => ({ ...prev, fileUrl: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/assignments?id=${deleteTarget._id}`, { method: 'DELETE' });
      if (res.ok) { showToast('success', 'Assignment deleted!'); setDeleteTarget(null); fetchAssignments(); }
      else { const err = await res.json(); showToast('error', err.error || 'Failed.'); setDeleteTarget(null); }
    } catch { showToast('error', 'Network error.'); setDeleteTarget(null); }
  };

  const filteredAssignments = assignments.filter(item => {
    if (filterClass === 'All') return true;
    return item.classId === filterClass;
  });

  const uniqueClasses = classOptions.length > 0 ? classOptions : ['All', 'Grade 10-A', 'Grade 11-C', 'Grade 12-B'];
  const totalActive = filteredAssignments.filter(a => a.status !== 'Completed').length;
  const totalCompleted = filteredAssignments.filter(a => a.status === 'Completed').length;
  const totalSubmissions = filteredAssignments.reduce((s, a) => s + (a.submissions || 0), 0);
  const totalStudents = filteredAssignments.reduce((s, a) => s + (a.total || 0), 0);

  if (loading || status === 'loading') return (
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
                <BookOpenIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white">Assignments</h1>
                <p className="text-xs text-slate-400">Create, distribute, and track coursework</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)}
                className="rounded-xl border border-slate-600 bg-slate-800 px-3.5 py-2 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer">
                {uniqueClasses.map(cls => (
                  <option key={cls} value={cls}>{cls === 'All' ? 'All Classes' : cls}</option>
                ))}
              </select>
              <button onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg transition-all hover:bg-amber-600">
                <PlusIcon className="h-4 w-4" />
                Create
              </button>
            </div>
          </div>
        </div>

        {/* ─── Stats Row ─── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatBox icon={DocumentTextIcon} label="Total" value={filteredAssignments.length} color="blue" />
          <StatBox icon={CheckCircleIcon} label="Completed" value={totalCompleted} color="emerald" />
          <StatBox icon={ClockIcon} label="Active" value={totalActive} color="amber" />
          <StatBox icon={UserGroupIcon} label="Submissions" value={totalStudents > 0 ? `${totalSubmissions}/${totalStudents}` : '0'} color="indigo" />
        </div>

        {/* ─── Assignment Cards ─── */}
        {filteredAssignments.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-sm">
            <BookOpenIcon className="mx-auto h-12 w-12 text-slate-200" />
            <h3 className="mt-3 text-lg font-bold text-slate-500">No assignments posted yet</h3>
            <p className="mt-1 text-sm text-slate-400">Click the button above to create your first assignment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredAssignments.map(item => (
              <div key={item._id}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-xl hover:border-amber-200 flex flex-col justify-between">
                <div className="absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-gradient-to-bl from-amber-50 to-transparent transition-transform duration-500 group-hover:scale-125" />

                <div className="relative">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                      item.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/50' : 'bg-slate-100 text-slate-600'
                    }`}>{item.status || 'Active'}</span>
                    <div className="rounded-xl bg-amber-50/50 p-2 text-amber-600 transition-colors group-hover:bg-amber-100">
                      <DocumentTextIcon className="h-5 w-5" />
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-1.5 line-clamp-2 transition-colors group-hover:text-amber-600">{item.title}</h3>

                  <div className="mb-4 flex w-fit items-center gap-2 rounded-lg border border-amber-100/50 bg-amber-50/40 px-3 py-1 text-xs font-bold text-amber-600">
                    <UserGroupIcon className="h-3.5 w-3.5 flex-shrink-0" />
                    {item.classId}
                  </div>

                  <div className="space-y-3 border-y border-slate-50 py-4">
                    <div>
                      <div className="mb-1.5 flex justify-between text-[11px] font-bold text-slate-500">
                        <span className="flex items-center gap-1">
                          <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-500" />
                          Submissions
                        </span>
                        <span className="font-black text-slate-900">{item.submissions || 0} / {item.total || '?'}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500"
                          style={{ width: `${((item.submissions || 0) / (item.total || 1)) * 100}%` }} />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-[11px] font-bold text-slate-500">
                      <CalendarIcon className="h-4 w-4 flex-shrink-0 text-slate-400" />
                      <span>Due:</span>
                      <span className="ml-auto font-black text-slate-900">
                        {item.dueDate ? toNepaliDate(item.dueDate) : 'No due date'}
                      </span>
                    </div>

                    {item.fileUrl && (
                      <a href={item.fileUrl} download={item.fileName || 'assignment.pdf'} target="_blank" rel="noopener noreferrer"
                        className="mt-2 flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-50 p-2.5 text-[11px] font-bold text-amber-600 transition-colors hover:bg-amber-100">
                        <PaperClipIcon className="h-4 w-4 flex-shrink-0" />
                        <span>Attachment</span>
                        <span className="ml-auto font-normal text-amber-400">{item.fileName || 'PDF'}</span>
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-3">
                  <button onClick={() => openGradeModal(item)}
                    className={`flex-1 rounded-xl py-2.5 text-[11px] font-black transition-all shadow-sm ${
                      item.submissions > 0
                        ? 'bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white'
                        : 'bg-slate-50 text-slate-400 cursor-not-allowed'
                    }`} disabled={item.submissions === 0}>
                    {item.submissions > 0 ? `Grade (${item.submissions})` : 'No Submissions'}
                  </button>
                  <button onClick={() => toggleCompleted(item._id, item.status)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[11px] font-bold text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50">
                    {item.status === 'Active' ? 'Complete' : 'Reopen'}
                  </button>
                  <button onClick={() => setDeleteTarget(item)}
                    className="rounded-xl border border-red-200 bg-white p-2.5 text-red-500 transition-all hover:bg-red-50 hover:border-red-300">
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Add Assignment Modal ─── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={() => setShowAddModal(false)}>
          <div className="w-full max-w-md animate-[zoomIn_0.2s_ease-out] rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50 shrink-0 rounded-t-2xl">
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <DocumentTextIcon className="h-5 w-5 text-amber-500" />
                New Assignment
              </h2>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-all">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handlePost} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 space-y-5 overflow-y-auto flex-1">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Assignment Title</label>
                  <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    placeholder="e.g. Chapter 4 Exercises" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Target Class</label>
                  <select value={formData.classId} onChange={e => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20">
                    {classOptions.filter(c => c !== 'All').map(cls => <option key={cls} value={cls}>{cls}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Due Date</label>
                  <NepaliDatePicker value={formData.dueDate ? new Date(formData.dueDate) : null}
                    onChange={(d, nepaliStr) => { if (d) setFormData({ ...formData, dueDate: toLocalDateStr(d) }); }}
                    locale="en" placeholder="YYYY/MM/DD" />
                </div>
                <div>
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-3 text-sm font-semibold text-slate-500 transition-all hover:border-amber-300 hover:bg-amber-50/30">
                    <PaperClipIcon className="h-5 w-5 text-amber-500 flex-shrink-0" />
                    {formData.fileName || 'Attach PDF file'}
                    <input type="file" accept=".pdf,application/pdf" onChange={handleFileChange} className="hidden" />
                  </label>
                  {formData.fileName && <p className="mt-1 text-center text-[10px] font-semibold text-emerald-600">{formData.fileName} selected</p>}
                </div>
              </div>
              <div className="flex gap-3 p-5 border-t border-slate-100 shrink-0">
                <button type="button" onClick={() => setShowAddModal(false)}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 transition-all hover:bg-slate-50">Cancel</button>
                <button type="submit"
                  className="flex-1 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg transition-all hover:bg-amber-600">Post Assignment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Grade Submissions Modal ─── */}
      {gradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={() => setGradeModal(null)}>
          <div className="w-full max-w-2xl animate-[zoomIn_0.2s_ease-out] rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50 shrink-0 rounded-t-2xl">
              <div>
                <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <AcademicCapIcon className="h-5 w-5 text-amber-500" />
                  Submissions — {gradeModal.title}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">{gradeModal.classId} &middot; {submissions.length} submitted</p>
              </div>
              <button onClick={() => setGradeModal(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-all">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {submissions.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">No submissions yet.</p>
              ) : (
                submissions.map(sub => (
                  <div key={sub._id} className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{sub.studentId?.name || 'Unknown'}</p>
                        <p className="text-[11px] text-slate-500">{sub.studentId?.studentId || ''} &middot; {sub.studentId?.grade || ''}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-[10px] font-bold ${
                        sub.status === 'graded' ? 'bg-emerald-50 text-emerald-600' : sub.status === 'returned' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                      }`}>{sub.status === 'graded' ? 'Graded' : sub.status === 'returned' ? 'Returned' : 'Submitted'}</span>
                    </div>

                    {sub.fileUrl && (
                      <div className="mb-3">
                        <a href={sub.fileUrl} download={sub.fileName || 'submission.pdf'} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-100 bg-white px-3 py-1.5 text-[11px] font-bold text-amber-600 transition-colors hover:bg-amber-50">
                          <PaperClipIcon className="h-3.5 w-3.5" />
                          {sub.fileName || 'Download Submission'}
                        </a>
                      </div>
                    )}

                    {sub.notes && (
                      <p className="mb-3 italic text-[11px] text-slate-600 rounded-xl border border-slate-100 bg-white p-2.5">
                        &ldquo;{sub.notes}&rdquo;
                      </p>
                    )}

                    <div className="mt-3 flex items-start gap-3 border-t border-slate-200 pt-3">
                      <div className="flex-1">
                        <label className="mb-1 block text-[10px] font-bold text-slate-500">Grade (0-100)</label>
                        <input type="number" min="0" max="100"
                          value={gradeValues[sub._id] !== undefined ? gradeValues[sub._id] : ''}
                          onChange={e => setGradeValues({ ...gradeValues, [sub._id]: e.target.value })}
                          className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-900 outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                          placeholder="-" />
                      </div>
                      <div className="flex-[2]">
                        <label className="mb-1 block text-[10px] font-bold text-slate-500">Feedback</label>
                        <input type="text" value={feedbackValues[sub._id] || ''}
                          onChange={e => setFeedbackValues({ ...feedbackValues, [sub._id]: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                          placeholder="Add feedback..." />
                      </div>
                      <div className="mt-5 flex gap-2">
                        <button onClick={() => handleGrade(sub._id)} disabled={gradingSubId === sub._id}
                          className="shrink-0 rounded-xl bg-amber-500 px-5 py-2 text-[11px] font-bold text-white shadow-md transition-all hover:bg-amber-600 disabled:opacity-50">
                          {gradingSubId === sub._id ? '...' : 'Save'}
                        </button>
                        <button onClick={() => handleReturn(sub._id)} disabled={gradingSubId === sub._id}
                          className="shrink-0 rounded-xl border border-amber-300 bg-white px-4 py-2 text-[11px] font-bold text-amber-600 shadow-sm transition-all hover:bg-amber-50 disabled:opacity-50">
                          Return
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Confirm Modal ─── */}
      <ConfirmModal open={!!deleteTarget} title="Delete Assignment?" message="All submissions will also be deleted. This cannot be undone."
        onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />

      <Toast toast={toast} onClose={() => setToast(null)} />

      <style jsx>{`
        @keyframes zoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
