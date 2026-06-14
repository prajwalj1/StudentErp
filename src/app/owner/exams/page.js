'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { PlusIcon, TrashIcon, CheckCircleIcon, BookOpenIcon, EyeIcon, XMarkIcon } from '@heroicons/react/24/outline';

const TERMS = ["First Term", "Second Term", "Third Term"];

const emptySubject = { name: '', date: '', fullMarks: 100, passMarks: 40 };

export default function ExamsPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [routines, setRoutines] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [activeTerm, setActiveTerm] = useState(0);
  const [gradeInput, setGradeInput] = useState('');
  const [message, setMessage] = useState(null);
  const [exams, setExams] = useState([]);
  const [viewPaper, setViewPaper] = useState(null);

  const [terms, setTerms] = useState([
    { name: "First Term", startTime: '', endTime: '', subjects: [] },
    { name: "Second Term", startTime: '', endTime: '', subjects: [] },
    { name: "Third Term", startTime: '', endTime: '', subjects: [] },
  ]);

  useEffect(() => {
    if (status === 'authenticated') fetchRoutines();
  }, [status]);

  const fetchRoutines = async () => {
    try {
      const res = await fetch('/api/exam-routines');
      if (res.ok) {
        const data = await res.json();
        setRoutines(Array.isArray(data) ? data : []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
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
    } catch (e) { console.error(e); }
  };

  const fetchExams = async (grade) => {
    try {
      const res = await fetch('/api/exams');
      if (res.ok) {
        const data = await res.json();
        setExams((Array.isArray(data) ? data : []).filter(e => e.grade === grade));
      }
    } catch {}
  };

  const handleGradeSelect = (grade) => {
    setSelectedGrade(grade);
    setActiveTerm(0);
    setMessage(null);
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
    setMessage(null);
    try {
      const res = await fetch('/api/exam-routines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grade: selectedGrade, terms }),
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Exam routine saved successfully!' });
        fetchRoutines();
      } else {
        const err = await res.json();
        setMessage({ type: 'error', text: err.error || 'Failed to save.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Connection error.' });
    }
    setSaving(false);
  };

  const handleDeleteRoutine = async (grade) => {
    if (!confirm(`Delete exam routine for Grade ${grade}?`)) return;
    try {
      const res = await fetch(`/api/exam-routines?grade=${encodeURIComponent(grade)}`, { method: 'DELETE' });
      if (res.ok) {
        fetchRoutines();
        if (selectedGrade === grade) {
          setSelectedGrade('');
          setTerms(TERMS.map(t => ({ name: t, startTime: '', endTime: '', subjects: [] })));
        }
        setMessage({ type: 'success', text: 'Routine deleted.' });
      }
    } catch { }
  };

  const grades = [...new Set((routines || []).map(r => r.grade))].sort();

  if (loading) return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Examination Form</h1>
            <p className="text-slate-500 text-sm mt-1">Create and manage exam routines with 3 terms per grade.</p>
          </div>
        </div>

        {/* Grade Selector */}
        <div className="flex flex-wrap items-center gap-2 mt-6">
          {grades.map(grade => (
            <button key={grade} onClick={() => handleGradeSelect(grade)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                selectedGrade === grade
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-200'
                  : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-600'
              }`}
            >
              Grade {grade}
            </button>
          ))}
          <div className="flex gap-2 ml-2">
            <input type="text" value={gradeInput} onChange={e => setGradeInput(e.target.value)}
              placeholder={grades.length === 0 ? "Enter grade..." : "Add grade..."}
              className="px-3 py-2 rounded-xl border border-slate-200 text-sm w-32 focus:ring-2 focus:ring-amber-500 outline-none" />
            <button onClick={() => { if (gradeInput.trim()) { handleGradeSelect(gradeInput.trim()); setGradeInput(''); } }}
              className="px-3 py-2 rounded-xl bg-amber-100 text-amber-700 font-bold text-sm hover:bg-amber-200 transition-all">
              Go
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div className={`px-5 py-3 rounded-2xl text-sm font-semibold flex items-center gap-3 ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-auto text-slate-400 hover:text-slate-600">&times;</button>
        </div>
      )}

      {selectedGrade ? (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Term Tabs */}
          <div className="flex border-b border-slate-200">
            {TERMS.map((term, i) => (
              <button key={term} onClick={() => setActiveTerm(i)}
                className={`flex-1 px-4 py-3.5 text-sm font-bold transition-all relative ${
                  activeTerm === i
                    ? 'text-amber-700 bg-amber-50'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                {term}
                <span className={`ml-2 text-[10px] px-2 py-0.5 rounded-full ${
                  terms[i].subjects.length > 0
                    ? 'bg-amber-200 text-amber-800'
                    : 'bg-slate-200 text-slate-500'
                }`}>
                  {terms[i].subjects.length}
                </span>
                {activeTerm === i && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500"></span>
                )}
              </button>
            ))}
          </div>

          {/* Subjects for Active Term */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800">Subjects for {TERMS[activeTerm]}</h3>
              <button onClick={addSubject}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-white font-bold text-xs hover:bg-amber-600 transition-all shadow-sm">
                <PlusIcon className="w-3.5 h-3.5" />
                Add Subject
              </button>
            </div>

            {/* Term Time */}
            <div className="flex items-center gap-4 mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-400 uppercase">Exam Time</span>
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-semibold text-slate-500">Start:</label>
                <input type="time" value={terms[activeTerm].startTime}
                  onChange={e => updateTerm('startTime', e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-semibold text-slate-500">End:</label>
                <input type="time" value={terms[activeTerm].endTime}
                  onChange={e => updateTerm('endTime', e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
              </div>
            </div>

            {terms[activeTerm].subjects.length === 0 ? (
              <div className="bg-slate-50 rounded-2xl p-10 text-center border border-dashed border-slate-200">
                <BookOpenIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400 font-semibold">No subjects added yet</p>
                <p className="text-xs text-slate-400 mt-1">Click &quot;Add Subject&quot; to start building the routine.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-3 py-2.5 text-[10px] font-bold text-slate-400 uppercase text-left w-10">#</th>
                      <th className="px-3 py-2.5 text-[10px] font-bold text-slate-400 uppercase text-left">Subject</th>
                      <th className="px-3 py-2.5 text-[10px] font-bold text-slate-400 uppercase text-left w-28">Date</th>
                      <th className="px-3 py-2.5 text-[10px] font-bold text-slate-400 uppercase text-center w-20">Full Marks</th>
                      <th className="px-3 py-2.5 text-[10px] font-bold text-slate-400 uppercase text-center w-20">Pass Marks</th>
                      <th className="px-3 py-2.5 text-[10px] font-bold text-slate-400 uppercase text-center w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {terms[activeTerm].subjects.map((sub, i) => (
                      <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/50">
                        <td className="px-3 py-2 text-xs text-slate-400 font-mono">{String(i + 1).padStart(2, '0')}</td>
                        <td className="px-3 py-2">
                          <input type="text" value={sub.name} onChange={e => updateSubject(i, 'name', e.target.value)}
                            placeholder="Subject name"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none" />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="date"
                            value={sub.date || ''}
                            onChange={e => updateSubject(i, 'date', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" value={sub.fullMarks} onChange={e => updateSubject(i, 'fullMarks', Number(e.target.value))}
                            className="w-16 px-2.5 py-1.5 rounded-lg border border-slate-200 text-sm text-center focus:ring-2 focus:ring-amber-500 outline-none" />
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" value={sub.passMarks} onChange={e => updateSubject(i, 'passMarks', Number(e.target.value))}
                            className="w-16 px-2.5 py-1.5 rounded-lg border border-slate-200 text-sm text-center focus:ring-2 focus:ring-amber-500 outline-none" />
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

            {/* Save Button */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
              <div className="flex gap-4 text-xs text-slate-400">
                <span>First Term: <strong className="text-slate-600">{terms[0].subjects.length}</strong> subjects</span>
                <span>Second Term: <strong className="text-slate-600">{terms[1].subjects.length}</strong> subjects</span>
                <span>Third Term: <strong className="text-slate-600">{terms[2].subjects.length}</strong> subjects</span>
              </div>
              <div className="flex gap-3">
                {(routines || []).find(r => r.grade === selectedGrade) && (
                  <button onClick={() => handleDeleteRoutine(selectedGrade)}
                    className="px-5 py-2.5 rounded-xl border border-red-200 text-red-600 font-bold text-sm hover:bg-red-50 transition-all">
                    Delete Routine
                  </button>
                )}
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-bold text-sm transition-all shadow-sm">
                  {saving ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <CheckCircleIcon className="w-4 h-4" />
                  )}
                  {saving ? 'Saving...' : 'Save Routine'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-200 text-center">
          <BookOpenIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 font-semibold">Select or add a grade above</p>
          <p className="text-slate-400 text-sm mt-1">Create exam routines with 3 terms and multiple subjects for each grade.</p>
        </div>
      )}

      {/* Question Papers Section */}
      {selectedGrade && exams.filter(e => e.questionPaper).length > 0 && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-bold text-slate-900 text-lg mb-4 flex items-center gap-2">
            <EyeIcon className="w-5 h-5 text-amber-500" />
            Question Papers — Grade {selectedGrade}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {exams.filter(e => e.questionPaper).map((exam) => (
              <button
                key={exam._id}
                onClick={() => setViewPaper(exam)}
                className="text-left p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white hover:shadow-md transition-all group"
              >
                <div className="font-bold text-sm text-slate-900 group-hover:text-amber-600">{exam.subject}</div>
                <div className="text-[10px] text-slate-400 mt-1">{exam.title} • Status: {exam.status}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Question Paper Viewer Modal */}
      {viewPaper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setViewPaper(null)}>
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white flex items-center justify-between p-6 pb-4 border-b border-slate-100 rounded-t-3xl">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{viewPaper.subject}</h3>
                <p className="text-xs text-slate-400">{viewPaper.title} • Grade {viewPaper.grade}</p>
              </div>
              <button onClick={() => setViewPaper(null)} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {(() => {
                try {
                  const images = JSON.parse(viewPaper.questionPaper);
                  return Array.isArray(images) && images.length > 0 ? (
                    images.map((src, i) => (
                      <div key={i} className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
                        <img src={src} alt={`Question paper page ${i + 1}`} className="w-full object-contain" />
                      </div>
                    ))
                  ) : (
                    <img src={viewPaper.questionPaper} alt="Question paper" className="w-full object-contain rounded-2xl border border-slate-200" />
                  );
                } catch {
                  return <img src={viewPaper.questionPaper} alt="Question paper" className="w-full object-contain rounded-2xl border border-slate-200" />;
                }
              })()}
            </div>
            <div className="sticky bottom-0 bg-white p-6 pt-4 border-t border-slate-100 rounded-b-3xl">
              <button onClick={() => {
                const images = (() => {
                  try {
                    const parsed = JSON.parse(viewPaper.questionPaper);
                    return Array.isArray(parsed) ? parsed : [viewPaper.questionPaper];
                  } catch {
                    return [viewPaper.questionPaper];
                  }
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
                    <div class="header">
                      <h1>${viewPaper.subject}</h1>
                      <p>${viewPaper.title || ''} — Grade ${viewPaper.grade}</p>
                    </div>
                    ${images.map(src => `<img src="${src}" />`).join('')}
                  </div>
                  <script>window.onload = function() { window.print(); window.close(); }</script>
                  </body></html>
                `);
                win.document.close();
              }} className="w-full py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-colors">
                Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
