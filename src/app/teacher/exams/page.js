'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AcademicCapIcon, DocumentTextIcon, EyeIcon, PhotoIcon, ChartBarIcon, CheckCircleIcon, ExclamationTriangleIcon, PrinterIcon, TrashIcon } from '@heroicons/react/24/outline';
import { toNepaliDate } from '@/lib/nepaliDate';

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

export default function TeacherExamsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [routines, setRoutines] = useState([]);
  const [examRecords, setExamRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [showPaperModal, setShowPaperModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [paperFiles, setPaperFiles] = useState([]);
  const [paperPreviews, setPaperPreviews] = useState([]);
  const [saving, setSaving] = useState(false);
  const [viewPaper, setViewPaper] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (type, text) => setToast({ type, text });

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') fetchData();
  }, [status]);

  const fetchData = async () => {
    try {
      const [routinesRes, examsRes] = await Promise.all([
        fetch('/api/exam-routines'),
        fetch('/api/exams'),
      ]);
      if (routinesRes.ok) setRoutines(await routinesRes.json());
      if (examsRes.ok) setExamRecords(await examsRes.json());
    } catch (e) { console.error(e) } finally { setLoading(false); }
  };

  const getExamRecord = (grade, subject, date) => {
    return examRecords.find(e => e.grade === grade && e.subject === subject && new Date(e.date).toISOString().slice(0, 10) === (date ? new Date(date).toISOString().slice(0, 10) : ''));
  };

  const flattenRoutine = (routine) => {
    const items = [];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    (routine.terms || []).forEach(term => {
      (term.subjects || []).forEach(sub => {
        const subDate = sub.date ? new Date(sub.date) : null;
        if (subDate && subDate < today) return;
        const examRec = getExamRecord(routine.grade, sub.name, sub.date);
        items.push({
          _id: `${routine._id}-${term.name}-${sub.name}`,
          grade: routine.grade,
          subject: sub.name,
          date: sub.date,
          term: term.name,
          fullMarks: sub.fullMarks,
          passMarks: sub.passMarks,
          examId: examRec?._id || null,
          questionPaper: examRec?.questionPaper || null,
          status: examRec?.status || 'Pending',
        });
      });
    });
    return items;
  };

  const allItems = routines.flatMap(r => flattenRoutine(r));
  const grades = [...new Set(routines.map(r => r.grade))];
  const filteredItems = selectedGrade ? allItems.filter(i => i.grade === selectedGrade) : [];
  const completedCount = filteredItems.filter(i => i.status === 'Completed').length;
  const pendingCount = filteredItems.filter(i => i.status !== 'Completed').length;

  const openPaperModal = (item) => {
    setSelectedExam(item);
    setPaperFiles([]);
    setPaperPreviews([]);
    setShowPaperModal(true);
  };

  const handleSavePaper = async () => {
    if (!selectedExam) return;
    setSaving(true);
    try {
      let questionPaper = '';
      if (paperFiles.length > 0) {
        const urls = await Promise.all(paperFiles.map(file => new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target.result);
          reader.readAsDataURL(file);
        })));
        questionPaper = JSON.stringify(urls);
      }
      const body = { grade: selectedExam.grade, subject: selectedExam.subject, date: selectedExam.date, title: selectedExam.term, questionPaper, status: 'Completed' };
      let res;
      if (selectedExam.examId) {
        res = await fetch(`/api/exams?id=${selectedExam.examId}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questionPaper, status: 'Completed' }),
        });
      } else {
        res = await fetch('/api/exams', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }
      if (res.ok) { setShowPaperModal(false); setSelectedExam(null); setPaperFiles([]); setPaperPreviews([]); fetchData(); showToast('success', 'Question paper submitted!'); }
      else { const err = await res.json(); showToast('error', err.error || 'Failed to save.'); }
    } catch { showToast('error', 'Network error.'); }
    finally { setSaving(false); }
  };

  const handleDeleteExam = async () => {
    if (!deleteConfirm) return;
    try {
      const res = await fetch(`/api/exams?id=${deleteConfirm}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('success', 'Question paper deleted.');
        setDeleteConfirm(null);
        fetchData();
      } else { const err = await res.json(); showToast('error', err.error || 'Failed to delete.'); }
    } catch { showToast('error', 'Network error.'); }
  };

  if (loading) return (
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
          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
              <DocumentTextIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">Examinations</h1>
              <p className="text-xs text-slate-400">View exam routines and upload question papers</p>
            </div>
          </div>
        </div>

        {/* ─── Grade Selector ─── */}
        <div className="flex flex-wrap items-center gap-2">
          {grades.map(grade => (
            <button key={grade} onClick={() => setSelectedGrade(grade)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedGrade === grade
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-200'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-amber-300 hover:text-amber-600'
              }`}>
              {grade}
            </button>
          ))}
          {grades.length === 0 && <p className="text-sm text-slate-400">No exams scheduled yet.</p>}
        </div>

        {/* ─── Stats Row ─── */}
        {selectedGrade && filteredItems.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatBox icon={AcademicCapIcon} label="Total Exams" value={filteredItems.length} color="blue" />
            <StatBox icon={CheckCircleIcon} label="Completed" value={completedCount} color="emerald" />
            <StatBox icon={ExclamationTriangleIcon} label="Pending" value={pendingCount} color="amber" />
            <StatBox icon={ChartBarIcon} label="Progress" value={filteredItems.length > 0 ? `${Math.round((completedCount / filteredItems.length) * 100)}%` : '0%'} color="indigo" />
          </div>
        )}

        {/* ─── Exam Table ─── */}
        {selectedGrade && filteredItems.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-gradient-to-r from-amber-50 to-white px-5 py-4">
              <h2 className="text-sm font-bold text-slate-900">{selectedGrade} — Exam Routine</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="px-5 py-3.5">Subject</th>
                    <th className="px-5 py-3.5">Date</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map((item) => (
                    <tr key={item._id} className="group transition-colors hover:bg-amber-50/30">
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-bold text-slate-900">{item.subject}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{item.term}</p>
                      </td>
                      <td className="px-5 py-3.5 text-xs font-semibold text-slate-600">{toNepaliDate(item.date)}</td>
                      <td className="px-5 py-3.5">
                        <Badge color={item.status === 'Completed' ? 'emerald' : item.status === 'Published' ? 'blue' : 'amber'}>
                          {item.status || 'Pending'}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {item.questionPaper && (
                            <button onClick={() => setViewPaper(item)}
                              className="rounded-lg bg-blue-50 px-3 py-1.5 text-[10px] font-bold text-blue-600 transition-all hover:bg-blue-100 flex items-center gap-1">
                              <EyeIcon className="h-3 w-3" /> View
                            </button>
                          )}
                          <button onClick={() => openPaperModal(item)}
                            className="rounded-lg bg-amber-50 px-3 py-1.5 text-[10px] font-bold text-amber-600 transition-all hover:bg-amber-100 flex items-center gap-1">
                            <DocumentTextIcon className="h-3 w-3" /> {item.questionPaper ? 'Edit' : 'Prepare'}
                          </button>
                          {item.examId && (
                            <button onClick={() => setDeleteConfirm(item.examId)}
                              className="rounded-lg bg-red-50 px-3 py-1.5 text-[10px] font-bold text-red-600 transition-all hover:bg-red-100 flex items-center gap-1">
                              <TrashIcon className="h-3 w-3" /> Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedGrade && filteredItems.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <DocumentTextIcon className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm font-bold text-slate-500">No exams for {selectedGrade}</p>
          </div>
        )}
      </div>

      {/* ─── Prepare Paper Modal ─── */}
      {showPaperModal && selectedExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={() => setShowPaperModal(false)}>
          <div className="w-full max-w-3xl animate-[zoomIn_0.2s_ease-out] rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50 shrink-0 rounded-t-2xl">
              <div>
                <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <DocumentTextIcon className="h-5 w-5 text-amber-500" />
                  Question Paper
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">{selectedExam.subject} \u2014 {selectedExam.term}</p>
              </div>
              <button onClick={() => setShowPaperModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-all">
                <span className="text-xl leading-none">&times;</span>
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">Upload question paper images (select multiple):</label>
                <label className="flex flex-col items-center justify-center w-full rounded-xl border-2 border-dashed border-slate-200 p-6 transition-all hover:bg-slate-50 hover:border-amber-300 cursor-pointer">
                  <PhotoIcon className="h-8 w-8 text-slate-300 mb-2" />
                  <span className="text-xs font-bold text-slate-500">Click to upload images</span>
                  <span className="text-[10px] text-slate-400 mt-1">PNG, JPG accepted</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={e => {
                    const files = Array.from(e.target.files || []);
                    if (files.length > 0) {
                      setPaperFiles(prev => [...prev, ...files]);
                      files.forEach(file => {
                        const reader = new FileReader();
                        reader.onload = (ev) => setPaperPreviews(prev => [...prev, ev.target.result]);
                        reader.readAsDataURL(file);
                      });
                    }
                  }} />
                </label>
                {paperPreviews.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {paperPreviews.map((url, i) => (
                      <div key={i} className="relative">
                        <img src={url} alt={`Page ${i + 1}`} className="max-h-48 w-full object-contain rounded-xl border border-slate-200" />
                        <button type="button" onClick={() => { setPaperFiles(prev => prev.filter((_, idx) => idx !== i)); setPaperPreviews(prev => prev.filter((_, idx) => idx !== i)); }}
                          className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white hover:bg-red-600">&times;</button>
                        <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">Page {i + 1}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-slate-100 shrink-0">
              <button type="button" onClick={() => setShowPaperModal(false)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50">Cancel</button>
              <button onClick={handleSavePaper} disabled={saving || paperFiles.length === 0}
                className="flex-1 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-amber-600 disabled:opacity-50">
                {saving ? 'Saving...' : 'Submit to Owner'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── View Paper Modal ─── */}
      {viewPaper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={() => setViewPaper(null)}>
          <div className="w-full max-w-3xl animate-[zoomIn_0.2s_ease-out] rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50 shrink-0 rounded-t-2xl">
              <div>
                <h2 className="text-sm font-black text-slate-900">{viewPaper.subject} \u2014 Question Paper</h2>
                <p className="text-xs text-slate-500 mt-0.5">{viewPaper.term} \ {viewPaper.grade}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-amber-600">
                  <PrinterIcon className="h-3.5 w-3.5" /> Print
                </button>
                <button onClick={() => setViewPaper(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-all">
                  <span className="text-xl leading-none">&times;</span>
                </button>
              </div>
            </div>
            <div id="paper-print-area" className="p-5 overflow-y-auto flex-1 space-y-4">
              {(() => {
                try {
                  const parsed = JSON.parse(viewPaper.questionPaper);
                  if (Array.isArray(parsed)) return parsed.map((url, i) => (
                    <img key={i} src={url} alt={`Page ${i + 1}`} className="w-full max-h-[50vh] object-contain rounded-xl border border-slate-200" />
                  ));
                } catch (e) { console.error(e) }
                return viewPaper.questionPaper?.startsWith('data:image')
                  ? <img src={viewPaper.questionPaper} alt="Question Paper" className="w-full max-h-[50vh] object-contain rounded-xl border border-slate-200" />
                  : <pre className="whitespace-pre-wrap text-sm font-mono">{viewPaper.questionPaper || 'No content.'}</pre>;
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Confirm Modal ─── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="w-full max-w-sm animate-[zoomIn_0.2s_ease-out] rounded-2xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <ExclamationTriangleIcon className="h-6 w-6" />
            </div>
            <h3 className="text-center text-lg font-black text-slate-900">Delete Question Paper?</h3>
            <p className="mt-1 text-center text-sm text-slate-500">This will permanently remove the uploaded question paper. The exam routine will remain.</p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50">Cancel</button>
              <button onClick={handleDeleteExam} className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />

      <style jsx>{`
        @keyframes zoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @media print {
          body * { visibility: hidden; }
          #paper-print-area, #paper-print-area * { visibility: visible; }
          #paper-print-area { position: absolute; left: 0; top: 0; width: 100%; }
          #paper-print-area img { max-height: 100vh; page-break-after: always; width: 100%; object-fit: contain; }
        }
      `}</style>
    </div>
  );
}
