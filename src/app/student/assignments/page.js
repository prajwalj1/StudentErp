'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  ClipboardDocumentListIcon, UserIcon, PaperClipIcon,
  CheckCircleIcon, ClockIcon, XCircleIcon,
  ExclamationTriangleIcon, BookOpenIcon
} from '@heroicons/react/24/outline';
import { toNepaliDate } from '@/lib/nepaliDate';

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

function StatBox({ icon: Icon, label, value, color }) {
  const colors = { blue: 'from-blue-500 to-indigo-600', emerald: 'from-emerald-500 to-emerald-600', amber: 'from-amber-500 to-amber-600', purple: 'from-purple-500 to-pink-600' };
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

export default function StudentAssignments() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingPdf, setViewingPdf] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [submitModal, setSubmitModal] = useState(null);
  const [submitFile, setSubmitFile] = useState(null);
  const [submitNotes, setSubmitNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);

  const showToast = (type, text) => setToast({ type, text });

  const openPdf = (assignment) => {
    setViewingPdf(assignment);
    const url = assignment.fileUrl;
    if (url.startsWith('data:')) {
      const byteString = atob(url.split(',')[1]);
      const mimeType = url.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
      const blob = new Blob([ab], { type: mimeType });
      setPdfUrl(URL.createObjectURL(blob));
    } else setPdfUrl(url);
  };

  const closePdf = () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl); setPdfUrl(null); setViewingPdf(null); };

  const openSubmit = (assignment) => {
    setSubmitModal(assignment);
    setSubmitFile(null);
    setSubmitNotes('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmitFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { showToast('error', 'Only PDF files are allowed.'); e.target.value = ''; return; }
    setSubmitFile(file);
  };

  const handleSubmit = async () => {
    if (!submitFile && !submitNotes.trim()) { showToast('error', 'Upload a file or add notes to submit.'); return; }
    setSubmitting(true);
    try {
      let fileUrl = '', fileName = '';
      if (submitFile) {
        fileName = submitFile.name;
        const reader = new FileReader();
        fileUrl = await new Promise((resolve, reject) => { reader.onload = (ev) => resolve(ev.target.result); reader.onerror = reject; reader.readAsDataURL(submitFile); });
      }
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId: submitModal._id, fileUrl, fileName, notes: submitNotes.trim() }),
      });
      if (res.ok) {
        showToast('success', 'Assignment submitted!');
        setSubmitModal(null); setSubmitFile(null); setSubmitNotes('');
        const asgnRes = await fetch('/api/assignments');
        const data = await asgnRes.json();
        setAssignments(Array.isArray(data) ? data : []);
      } else { const err = await res.json(); showToast('error', err.error || 'Submission failed.'); }
    } catch { showToast('error', 'Network error.'); }
    finally { setSubmitting(false); }
  };

  useEffect(() => {
    if (status === 'unauthenticated' || (session && session.user.role !== 'STUDENT')) router.push('/login');
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'STUDENT') {
      fetch('/api/assignments').then(r => r.json()).then(asgn => { setAssignments(Array.isArray(asgn) ? asgn : []); setLoading(false); }).catch(() => setLoading(false));
    }
  }, [status, session]);

  if (status === 'loading' || loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-emerald-600 border-t-transparent" />
    </div>
  );

  const statusBadge = (a) => {
    const sub = a.submission;
    const overdue = new Date(a.dueDate) < new Date() && a.status === 'Active';
    if (sub?.status === 'submitted') return { label: 'Submitted', class: 'bg-blue-50 text-blue-600' };
    if (sub?.status === 'graded') return { label: `Graded: ${sub.grade}/100`, class: 'bg-emerald-50 text-emerald-600' };
    if (overdue) return { label: 'Overdue', class: 'bg-red-100 text-red-600' };
    if (a.status === 'Completed') return { label: 'Completed', class: 'bg-emerald-50 text-emerald-600' };
    return { label: 'Pending', class: 'bg-amber-50 text-amber-600' };
  };

  const total = assignments.length;
  const pending = assignments.filter(a => { const s = a.submission; return !s || s.status === 'returned'; }).length;
  const submitted = assignments.filter(a => a.submission?.status === 'submitted').length;
  const graded = assignments.filter(a => a.submission?.status === 'graded').length;

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50/80 via-white to-emerald-50/20">
      <div className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6 lg:p-8">

        {/* ─── Header ─── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900 p-5 sm:p-6 shadow-xl">
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
              <BookOpenIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">Assignments</h1>
              <p className="text-xs text-emerald-200">Track and submit your coursework</p>
            </div>
          </div>
        </div>

        {/* ─── Stats Row ─── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatBox icon={ClipboardDocumentListIcon} label="Total" value={total} color="blue" />
          <StatBox icon={ClockIcon} label="Pending" value={pending} color="amber" />
          <StatBox icon={PaperClipIcon} label="Submitted" value={submitted} color="purple" />
          <StatBox icon={CheckCircleIcon} label="Graded" value={graded} color="emerald" />
        </div>

        {/* ─── Assignment List ─── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          {assignments.length === 0 ? (
            <div className="py-12 text-center">
              <BookOpenIcon className="mx-auto h-10 w-10 text-slate-200" />
              <p className="mt-2 text-sm font-bold text-slate-400">No assignments posted yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {assignments.map((a, i) => {
                const badge = statusBadge(a);
                const overdue = new Date(a.dueDate) < new Date() && a.status === 'Active' && !a.submission;
                return (
                  <div key={i} className={`rounded-xl border p-4 transition-colors ${overdue ? 'border-red-200 bg-red-50/30' : 'border-slate-100 hover:border-emerald-200'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900">{a.title}</h4>
                          {a.classId && <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600">{a.classId}</span>}
                        </div>
                        <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                          <ClockIcon className="h-3 w-3" /> Due: {toNepaliDate(a.dueDate)}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                          <UserIcon className="h-3 w-3" /> {a.teacherId?.name || 'Teacher'}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-bold ${badge.class}`}>{badge.label}</span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {a.fileUrl && (
                        <button onClick={() => openPdf(a)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-600 transition-colors hover:bg-emerald-100">
                          <PaperClipIcon className="h-3.5 w-3.5" />
                          View Assignment
                        </button>
                      )}
                      {(!a.submission || a.submission.status === 'returned') && a.status === 'Active' && (
                        <button onClick={() => openSubmit(a)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-emerald-600 shadow-sm">
                          <CheckCircleIcon className="h-3.5 w-3.5" />
                          {a.submission?.status === 'returned' ? 'Resubmit' : 'Submit'}
                        </button>
                      )}
                      {a.submission?.feedback && (
                        <span className="text-xs italic text-slate-500">Feedback: {a.submission.feedback}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── PDF Viewer Modal ─── */}
      {viewingPdf && pdfUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" onClick={closePdf}>
          <div className="w-full max-w-4xl animate-[zoomIn_0.2s_ease-out] rounded-2xl bg-white shadow-2xl flex flex-col my-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50 shrink-0 rounded-t-2xl">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{viewingPdf.title}</h3>
                <p className="text-xs text-slate-500">{viewingPdf.fileName || 'Assignment PDF'}</p>
              </div>
              <button onClick={closePdf} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-all">
                <span className="text-xl leading-none">&times;</span>
              </button>
            </div>
            <iframe src={pdfUrl} className="h-[80vh] w-full" title="PDF Viewer" />
          </div>
        </div>
      )}

      {/* ─── Submit Modal ─── */}
      {submitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={() => !submitting && setSubmitModal(null)}>
          <div className="w-full max-w-lg animate-[zoomIn_0.2s_ease-out] rounded-2xl bg-white shadow-2xl flex flex-col my-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50 shrink-0 rounded-t-2xl">
              <h2 className="text-sm font-black text-slate-900">Submit Assignment</h2>
              <button onClick={() => { if (!submitting) setSubmitModal(null); }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-all">
                <span className="text-xl leading-none">&times;</span>
              </button>
            </div>
            <div className="p-5 space-y-5">
              <p className="text-sm font-bold text-slate-800">{submitModal.title}</p>

              <div>
                <label className="mb-2 block text-xs font-bold text-slate-600">Upload File (PDF)</label>
                <label className="flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-6 text-sm font-semibold text-slate-500 transition-all hover:border-emerald-300 hover:bg-emerald-50/30">
                  <PaperClipIcon className="mb-2 h-8 w-8 text-slate-300" />
                  {submitFile ? submitFile.name : 'Click to select PDF file'}
                  <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" onChange={handleSubmitFileChange} className="hidden" />
                </label>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-slate-600">Notes (optional)</label>
                <textarea value={submitNotes} onChange={e => setSubmitNotes(e.target.value)} rows={3}
                  placeholder="Add any notes for your teacher..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20" />
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => { if (!submitting) setSubmitModal(null); }} disabled={submitting}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-50">Cancel</button>
                <button onClick={handleSubmit} disabled={submitting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg transition-all hover:bg-emerald-600 disabled:opacity-50">
                  {submitting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
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
