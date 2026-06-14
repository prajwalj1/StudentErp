'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ClipboardDocumentListIcon, UserIcon, PaperClipIcon, CheckCircleIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { toNepaliDate } from '@/lib/nepaliDate';

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
  const [message, setMessage] = useState(null);
  const fileInputRef = useRef(null);

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
    } else {
      setPdfUrl(url);
    }
  };

  const closePdf = () => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);
    setViewingPdf(null);
  };

  const openSubmit = (assignment) => {
    setSubmitModal(assignment);
    setSubmitFile(null);
    setSubmitNotes('');
    setMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmitFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setMessage({ type: 'error', text: 'Only PDF files are allowed.' });
      e.target.value = '';
      return;
    }
    setSubmitFile(file);
    setMessage(null);
  };

  const handleSubmit = async () => {
    if (!submitFile && !submitNotes.trim()) {
      setMessage({ type: 'error', text: 'Upload a file or add notes to submit.' });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      let fileUrl = '';
      let fileName = '';
      if (submitFile) {
        fileName = submitFile.name;
        const reader = new FileReader();
        fileUrl = await new Promise((resolve, reject) => {
          reader.onload = (ev) => resolve(ev.target.result);
          reader.onerror = reject;
          reader.readAsDataURL(submitFile);
        });
      }
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId: submitModal._id, fileUrl, fileName, notes: submitNotes.trim() }),
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Assignment submitted successfully!' });
        setSubmitModal(null);
        setSubmitFile(null);
        setSubmitNotes('');
        const asgnRes = await fetch('/api/assignments');
        const data = await asgnRes.json();
        setAssignments(Array.isArray(data) ? data : []);
      } else {
        const err = await res.json();
        setMessage({ type: 'error', text: err.error || 'Submission failed.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated' || (session && session.user.role !== 'STUDENT')) {
      router.push('/login');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'STUDENT') {
      fetch('/api/assignments')
        .then(r => r.json())
        .then(asgn => {
          setAssignments(Array.isArray(asgn) ? asgn : []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [status, session]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const statusBadge = (a) => {
    const sub = a.submission;
    const overdue = new Date(a.dueDate) < new Date() && a.status === 'Active';
    if (sub?.status === 'submitted') return { label: 'Submitted', class: 'bg-blue-50 text-blue-600' };
    if (sub?.status === 'graded') return { label: `Graded: ${sub.grade}/100`, class: 'bg-emerald-50 text-emerald-600' };
    if (overdue) return { label: 'Overdue', class: 'bg-red-100 text-red-600' };
    if (a.status === 'Completed') return { label: 'Completed', class: 'bg-emerald-50 text-emerald-600' };
    return { label: 'Pending', class: 'bg-amber-50 text-amber-600' };
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-5 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Assignments</h1>
          <p className="text-slate-500">Assignments assigned by your teachers</p>
        </div>

        {message && (
          <div className={`mb-6 flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-semibold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {message.type === 'success' ? <CheckCircleIcon className="w-5 h-5 shrink-0" /> : <XCircleIcon className="w-5 h-5 shrink-0" />}
            {message.text}
            <button onClick={() => setMessage(null)} className="ml-auto text-slate-400 hover:text-slate-600">&times;</button>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
          {assignments.length === 0 ? (
            <p className="text-slate-400 text-sm">No assignments posted yet.</p>
          ) : (
            <div className="space-y-3">
              {assignments.map((a, i) => {
                const badge = statusBadge(a);
                const overdue = new Date(a.dueDate) < new Date() && a.status === 'Active' && !a.submission;
                return (
                  <div key={i} className={`p-4 border rounded-2xl transition-colors ${overdue ? 'border-red-200 bg-red-50/30' : 'border-slate-100 hover:border-blue-200'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-900">{a.title}</h4>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                          <ClockIcon className="w-3 h-3" />
                          Due: {toNepaliDate(a.dueDate)}
                        </p>
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          <UserIcon className="w-3 h-3" />
                          {a.teacherId?.name || 'Teacher'}
                        </p>
                      </div>
                      <span className={`shrink-0 px-3 py-1 rounded-full text-[10px] font-bold ${badge.class}`}>
                        {badge.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      {a.fileUrl && (
                        <button onClick={() => openPdf(a)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
                          <PaperClipIcon className="w-3.5 h-3.5" />
                          View Assignment
                        </button>
                      )}
                      {(!a.submission || a.submission.status === 'returned') && a.status === 'Active' && (
                        <button onClick={() => openSubmit(a)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors">
                          <CheckCircleIcon className="w-3.5 h-3.5" />
                          {a.submission?.status === 'returned' ? 'Resubmit' : 'Submit'}
                        </button>
                      )}
                      {a.submission?.feedback && (
                        <span className="text-xs text-slate-500 italic">Feedback: {a.submission.feedback}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {viewingPdf && pdfUrl && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={closePdf}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden my-8" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900">{viewingPdf.title}</h3>
                <p className="text-xs text-slate-500">{viewingPdf.fileName || 'Assignment PDF'}</p>
              </div>
              <button onClick={closePdf} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50 transition-all text-xl leading-none">&times;</button>
            </div>
            <iframe src={pdfUrl} className="w-full h-[80vh]" title="PDF Viewer" />
          </div>
        </div>
      )}

      {submitModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => !submitting && setSubmitModal(null)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden my-8" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-900">Submit Assignment</h2>
              <button onClick={() => { if (!submitting) setSubmitModal(null); }} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50 transition-all text-xl leading-none">&times;</button>
            </div>
            <div className="p-6 space-y-5">
              <p className="text-sm font-semibold text-slate-800">{submitModal.title}</p>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Upload File (PDF)</label>
                <label className="flex flex-col items-center justify-center w-full py-6 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 font-semibold hover:bg-slate-50 hover:border-emerald-300 transition-colors text-sm cursor-pointer">
                  <PaperClipIcon className="w-8 h-8 text-slate-300 mb-2" />
                  {submitFile ? submitFile.name : 'Click to select PDF file'}
                  <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" onChange={handleSubmitFileChange} className="hidden" />
                </label>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Notes (optional)</label>
                <textarea
                  value={submitNotes}
                  onChange={e => setSubmitNotes(e.target.value)}
                  rows={3}
                  placeholder="Add any notes for your teacher..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 focus:bg-white outline-none transition-all text-sm resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => { if (!submitting) setSubmitModal(null); }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-all text-sm disabled:opacity-50"
                  disabled={submitting}>
                  Cancel
                </button>
                <button onClick={handleSubmit} disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
