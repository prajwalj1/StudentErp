'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { NepaliDatePicker } from 'react-bs-calender';
import { toLocalDateStr } from '@/lib/nepaliDate';
import 'react-bs-calender/styles.css';
import {
  PlusIcon, TrashIcon, CheckCircleIcon, BookOpenIcon, EyeIcon, XMarkIcon,
  AcademicCapIcon, DocumentTextIcon, ClipboardDocumentListIcon,
  ExclamationTriangleIcon, PrinterIcon,
} from '@heroicons/react/24/outline';

const TERMS = ["First Term", "Second Term", "Third Term"];
const emptySubject = { name: '', date: '', fullMarks: 100, passMarks: 40 };

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

function ConfirmModal({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={onCancel}>
      <div className="w-full max-w-sm animate-[zoomIn_0.2s_ease-out] rounded-2xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600">
          <ExclamationTriangleIcon className="h-6 w-6" />
        </div>
        <h3 className="text-center text-lg font-black text-slate-900">{title}</h3>
        <p className="mt-1 text-center text-sm text-slate-500">{message}</p>
        <div className="mt-6 flex gap-3">
          <button onClick={onCancel} className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50">Cancel</button>
          <button onClick={onConfirm} className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-red-700">Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function ExamsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [routines, setRoutines] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [activeTerm, setActiveTerm] = useState(0);
  const [gradeInput, setGradeInput] = useState('');
  const [toast, setToast] = useState(null);
  const [exams, setExams] = useState([]);
  const [viewPaper, setViewPaper] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteExamId, setDeleteExamId] = useState(null);

  const [terms, setTerms] = useState([
    { name: "First Term", startTime: '', endTime: '', subjects: [] },
    { name: "Second Term", startTime: '', endTime: '', subjects: [] },
    { name: "Third Term", startTime: '', endTime: '', subjects: [] },
  ]);

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') fetchRoutines();
  }, [status]);

  const showToast = (type, text) => setToast({ type, text });

  const fetchRoutines = async () => {
    try {
      const res = await fetch('/api/exam-routines');
      if (res.ok) {
        const data = await res.json();
        setRoutines(Array.isArray(data) ? data : []);
      }
    } catch (e) { console.error(e) } finally { setLoading(false); }
  };

  const fetchRoutine = async (grade) => {
    try {
      const res = await fetch(`/api/exam-routines?grade=${encodeURIComponent(grade)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.terms) {
          setTerms(TERMS.map(t => {
            const existing = data.terms.find(dt => dt.name === t);
            return existing
              ? { name: t, startTime: existing.startTime || '', endTime: existing.endTime || '', subjects: existing.subjects || [] }
              : { name: t, startTime: '', endTime: '', subjects: [] };
          }));
        } else {
          setTerms(TERMS.map(t => ({ name: t, startTime: '', endTime: '', subjects: [] })));
        }
      }
    } catch (e) { console.error(e) }
  };

  const fetchExams = async (grade) => {
    try {
      const res = await fetch('/api/exams');
      if (res.ok) {
        const data = await res.json();
        setExams((Array.isArray(data) ? data : []).filter(e => e.grade === grade));
      }
    } catch (e) { console.error(e) }
  };

  const handleGradeSelect = (grade) => {
    setSelectedGrade(grade);
    setActiveTerm(0);
    setToast(null);
    fetchRoutine(grade);
    fetchExams(grade);
  };

  const updateTerm = (field, value) => {
    const updated = [...terms];
    updated[activeTerm] = { ...updated[activeTerm], [field]: value };
    setTerms(updated);
  };

  const addSubject = () => {
    const updated = [...terms];
    updated[activeTerm] = {
      ...updated[activeTerm],
      subjects: [...updated[activeTerm].subjects, { ...emptySubject }]
    };
    setTerms(updated);
  };

  const updateSubject = (index, field, value) => {
    const updated = [...terms];
    updated[activeTerm].subjects[index][field] = value;
    setTerms(updated);
  };

  const removeSubject = (index) => {
    const updated = [...terms];
    updated[activeTerm].subjects.splice(index, 1);
    setTerms(updated);
  };

  const handleSave = async () => {
    if (!selectedGrade) return;
    setSaving(true);
    setToast(null);
    try {
      const res = await fetch('/api/exam-routines', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grade: selectedGrade, terms }),
      });
      if (res.ok) {
        showToast('success', 'Exam routine saved successfully!');
        fetchRoutines();
      } else {
        const err = await res.json();
        showToast('error', err.error || 'Failed to save.');
      }
    } catch {
      showToast('error', 'Connection error.');
    }
    setSaving(false);
  };

  const handleDeleteRoutine = async () => {
    try {
      const res = await fetch(`/api/exam-routines?grade=${encodeURIComponent(selectedGrade)}`, { method: 'DELETE' });
      if (res.ok) {
        fetchRoutines();
        setSelectedGrade('');
        setTerms(TERMS.map(t => ({ name: t, startTime: '', endTime: '', subjects: [] })));
        showToast('success', 'Routine deleted.');
      }
    } catch (e) { console.error(e) }
    setConfirmDelete(false);
  };

  const handleDeleteExam = async () => {
    if (!deleteExamId) return;
    try {
      const res = await fetch(`/api/exams?id=${deleteExamId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('success', 'Question paper deleted.');
        setDeleteExamId(null);
        fetchExams(selectedGrade);
      } else { const err = await res.json(); showToast('error', err.error || 'Failed to delete.'); }
    } catch { showToast('error', 'Network error.'); }
  };

  const grades = [...new Set((routines || []).map(r => r.grade))].sort();
  const totalSubjects = terms.reduce((s, t) => s + t.subjects.length, 0);
  const paperCount = exams.filter(e => e.questionPaper).length;

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
          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                <DocumentTextIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white">Examination Form</h1>
                <p className="text-xs text-slate-400">Create and manage exam routines with 3 terms per grade</p>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Stats Row ─── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatBox icon={AcademicCapIcon} label="Grades with Routines" value={grades.length} color="blue" />
          <StatBox icon={BookOpenIcon} label="Total Subjects" value={totalSubjects} color="emerald" />
          <StatBox icon={DocumentTextIcon} label="Question Papers" value={paperCount} color="amber" />
          <StatBox icon={ClipboardDocumentListIcon} label="Avg Subjects/Routine" value={routines.length > 0 ? Math.round(totalSubjects / routines.length) : 0} color="indigo" />
        </div>

        {/* ─── Grade Selector ─── */}
        <div className="flex flex-wrap items-center gap-2">
          {grades.map(grade => (
            <button key={grade} onClick={() => handleGradeSelect(grade)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedGrade === grade
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-200'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-amber-300 hover:text-amber-600'
              }`}>
              Grade {grade}
            </button>
          ))}
          <div className="flex gap-2 ml-2">
            <input type="text" value={gradeInput} onChange={e => setGradeInput(e.target.value)}
              placeholder={grades.length === 0 ? "Enter grade..." : "Add grade..."}
              className="w-28 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium outline-none transition-all focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />
            <button onClick={() => { if (gradeInput.trim()) { handleGradeSelect(gradeInput.trim()); setGradeInput(''); } }}
              className="rounded-xl bg-amber-100 px-3 py-2 text-xs font-bold text-amber-700 transition-all hover:bg-amber-200">
              Go
            </button>
          </div>
        </div>

        {/* ─── Toast Message ─── */}
        {toast && (
          <div className={`rounded-2xl px-5 py-3 text-sm font-bold flex items-center gap-3 ${
            toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {toast.type === 'success' ? <CheckCircleIcon className="h-5 w-5 shrink-0" /> : <ExclamationTriangleIcon className="h-5 w-5 shrink-0" />}
            {toast.text}
            <button onClick={() => setToast(null)} className="ml-auto text-slate-400 hover:text-slate-600 text-lg leading-none">&times;</button>
          </div>
        )}

        {/* ─── Routine Editor ─── */}
        {selectedGrade ? (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* Term Tabs */}
            <div className="flex border-b border-slate-200">
              {TERMS.map((term, i) => (
                <button key={term} onClick={() => setActiveTerm(i)}
                  className={`flex-1 px-4 py-3.5 text-xs font-bold transition-all relative ${
                    activeTerm === i ? 'text-amber-700 bg-amber-50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}>
                  {term}
                  <span className={`ml-2 text-[10px] px-2 py-0.5 rounded-full ${
                    terms[i].subjects.length > 0 ? 'bg-amber-200 text-amber-800' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {terms[i].subjects.length}
                  </span>
                  {activeTerm === i && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />}
                </button>
              ))}
            </div>

            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-800">Subjects for {TERMS[activeTerm]}</h3>
                <button onClick={addSubject}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-amber-600 shadow-sm">
                  <PlusIcon className="w-3.5 h-3.5" />
                  Add Subject
                </button>
              </div>

              {/* Term Time */}
              <div className="flex flex-wrap items-center gap-3 mb-4 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Exam Time</span>
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-bold text-slate-500">Start:</label>
                  <input type="time" value={terms[activeTerm].startTime} onChange={e => updateTerm('startTime', e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none transition-all focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-bold text-slate-500">End:</label>
                  <input type="time" value={terms[activeTerm].endTime} onChange={e => updateTerm('endTime', e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none transition-all focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />
                </div>
              </div>

              {terms[activeTerm].subjects.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
                  <BookOpenIcon className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                  <p className="text-sm font-bold text-slate-400">No subjects added yet</p>
                  <p className="text-xs text-slate-400 mt-1">Click "Add Subject" to start building the routine.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="px-3 py-2.5 w-10">#</th>
                        <th className="px-3 py-2.5 text-left">Subject</th>
                        <th className="px-3 py-2.5 text-left w-48">Date</th>
                        <th className="px-3 py-2.5 text-center w-16">Full</th>
                        <th className="px-3 py-2.5 text-center w-16">Pass</th>
                        <th className="px-3 py-2.5 text-center w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {terms[activeTerm].subjects.map((sub, i) => (
                        <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                          <td className="px-3 py-2 text-xs text-slate-400 font-mono">{String(i + 1).padStart(2, '0')}</td>
                          <td className="px-3 py-2">
                            <input type="text" value={sub.name} onChange={e => updateSubject(i, 'name', e.target.value)}
                              placeholder="Subject name"
                              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold outline-none transition-all focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />
                          </td>
                          <td className="px-3 py-2">
                            <NepaliDatePicker value={sub.date ? new Date(sub.date) : null}
                              onChange={d => updateSubject(i, 'date', d ? toLocalDateStr(d) : '')}
                              locale="en" placeholder="YYYY/MM/DD" />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <input type="number" value={sub.fullMarks} onChange={e => updateSubject(i, 'fullMarks', Number(e.target.value))}
                              className="w-14 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-center outline-none transition-all focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <input type="number" value={sub.passMarks} onChange={e => updateSubject(i, 'passMarks', Number(e.target.value))}
                              className="w-14 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-center outline-none transition-all focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button onClick={() => removeSubject(i)}
                              className="p-1.5 rounded-lg text-red-300 hover:text-red-600 hover:bg-red-50 transition-all">
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Save Footer */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-5 pt-4 border-t border-slate-100">
                <div className="flex flex-wrap gap-3 text-[10px] text-slate-400">
                  {TERMS.map((t, ti) => (
                    <span key={t}>{t}: <strong className="text-slate-600">{terms[ti].subjects.length}</strong> subjects</span>
                  ))}
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  {(routines || []).find(r => r.grade === selectedGrade) && (
                    <button onClick={() => setConfirmDelete(true)}
                      className="flex-1 sm:flex-none rounded-xl border border-red-200 px-5 py-2.5 text-xs font-bold text-red-600 transition-all hover:bg-red-50">
                      Delete Routine
                    </button>
                  )}
                  <button onClick={handleSave} disabled={saving}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-amber-600 disabled:opacity-50">
                    {saving ? <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircleIcon className="w-4 h-4" />}
                    {saving ? 'Saving...' : 'Save Routine'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
            <BookOpenIcon className="mx-auto h-10 w-10 text-slate-300 mb-3" />
            <p className="text-sm font-bold text-slate-500">Select or add a grade above</p>
            <p className="text-xs text-slate-400 mt-1">Create exam routines with 3 terms and multiple subjects per grade.</p>
          </div>
        )}

        {/* ─── Question Papers Section ─── */}
        {selectedGrade && paperCount > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <EyeIcon className="w-4 h-4 text-amber-500" />
              Question Papers — Grade {selectedGrade}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {exams.filter(e => e.questionPaper).map((exam) => (
                <div key={exam._id}
                  className="group text-left rounded-xl border border-slate-200 bg-slate-50 p-4 transition-all hover:bg-white hover:shadow-md hover:-translate-y-0.5">
                  <div className="flex items-start justify-between gap-2">
                    <button onClick={() => setViewPaper(exam)} className="flex-1 text-left">
                      <p className="text-sm font-bold text-slate-900 group-hover:text-amber-600">{exam.subject}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{exam.title || 'Untitled'} <Badge color="amber">{exam.status || 'draft'}</Badge></p>
                    </button>
                    <button onClick={() => setDeleteExamId(exam._id)}
                      className="shrink-0 p-1.5 rounded-lg text-red-300 hover:text-red-600 hover:bg-red-50 transition-all">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Question Paper Viewer Modal ─── */}
        {viewPaper && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" onClick={() => setViewPaper(null)}>
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-[zoomIn_0.2s_ease-out]" onClick={e => e.stopPropagation()}>
              <div className="sticky top-0 bg-white flex items-center justify-between p-5 pb-4 border-b border-slate-100 rounded-t-2xl z-10">
                <div>
                  <h3 className="text-lg font-black text-slate-900">{viewPaper.subject}</h3>
                  <p className="text-xs text-slate-400">{viewPaper.title} • Grade {viewPaper.grade}</p>
                </div>
                <button onClick={() => setViewPaper(null)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                {(() => {
                  try {
                    const images = JSON.parse(viewPaper.questionPaper);
                    return Array.isArray(images) && images.length > 0 ? (
                      images.map((src, i) => (
                        <div key={i} className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                          <img src={src} alt={`Question paper page ${i + 1}`} className="w-full object-contain" />
                        </div>
                      ))
                    ) : (
                      <img src={viewPaper.questionPaper} alt="Question paper" className="w-full object-contain rounded-xl border border-slate-200" />
                    );
                  } catch {
                    return <img src={viewPaper.questionPaper} alt="Question paper" className="w-full object-contain rounded-xl border border-slate-200" />;
                  }
                })()}
              </div>
              <div className="sticky bottom-0 bg-white p-5 pt-4 border-t border-slate-100 rounded-b-2xl">
                <button onClick={() => {
                  const images = (() => {
                    try {
                      const parsed = JSON.parse(viewPaper.questionPaper);
                      return Array.isArray(parsed) ? parsed : [viewPaper.questionPaper];
                    } catch { return [viewPaper.questionPaper]; }
                  })();
                  const win = window.open('', '_blank');
                  win.document.write(`
                    <html><head><title>${viewPaper.subject} - Question Paper</title>
                    <style>
                      body { margin: 0; padding: 20px; font-family: sans-serif; }
                      .page { max-width: 800px; margin: 0 auto; }
                      .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
                      .header h1 { margin: 0; font-size: 18px; }
                      .header p { margin: 4px 0 0; font-size: 14px; color: #555; }
                      img { width: 100%; height: auto; display: block; margin-bottom: 10px; border: 1px solid #ddd; }
                      @media print { body { padding: 0; } img { page-break-inside: avoid; } }
                    </style></head><body>
                    <div class="page">
                      <div class="header"><h1>${viewPaper.subject}</h1><p>${viewPaper.title || ''} — Grade ${viewPaper.grade}</p></div>
                      ${images.map(src => `<img src="${src}" />`).join('')}
                    </div>
                    <script>window.onload = function() { window.print(); window.close(); }</script>
                    </body></html>
                  `);
                  win.document.close();
                }} className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white transition-all hover:bg-slate-800">
                  <PrinterIcon className="w-4 h-4" /> Print
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Confirm Delete Routine Modal ─── */}
        <ConfirmModal
          open={!!confirmDelete}
          title="Delete Exam Routine?"
          message={`Delete exam routine for Grade ${selectedGrade}? This action cannot be undone.`}
          onConfirm={handleDeleteRoutine}
          onCancel={() => setConfirmDelete(false)}
        />

        {/* ─── Confirm Delete Question Paper Modal ─── */}
        {deleteExamId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={() => setDeleteExamId(null)}>
            <div className="w-full max-w-sm animate-[zoomIn_0.2s_ease-out] rounded-2xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <ExclamationTriangleIcon className="h-6 w-6" />
              </div>
              <h3 className="text-center text-lg font-black text-slate-900">Delete Question Paper?</h3>
              <p className="mt-1 text-center text-sm text-slate-500">This will permanently remove the uploaded question paper. The exam routine will remain.</p>
              <div className="mt-6 flex gap-3">
                <button onClick={() => setDeleteExamId(null)} className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50">Cancel</button>
                <button onClick={handleDeleteExam} className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-red-700">Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Toast toast={toast} onClose={() => setToast(null)} />

      <style jsx>{`
        @keyframes zoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
