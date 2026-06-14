'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { AcademicCapIcon, DocumentChartBarIcon, DocumentTextIcon, EyeIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { toNepaliDate } from '@/lib/nepaliDate';

export default function TeacherExamsPage() {
  const { data: session, status } = useSession();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [showPaperModal, setShowPaperModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [paperFiles, setPaperFiles] = useState([]);
  const [paperPreviews, setPaperPreviews] = useState([]);
  const [saving, setSaving] = useState(false);
  const [viewPaper, setViewPaper] = useState(null);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchExams();
    }
  }, [status]);

  const fetchExams = async () => {
    try {
      const res = await fetch('/api/exams');
      if (res.ok) {
        const data = await res.json();
        setExams(data);
      }
    } catch (error) {
      console.error("Error fetching exams:", error);
    } finally {
      setLoading(false);
    }
  };

  const openPaperModal = (exam) => {
    setSelectedExam(exam);
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
      const res = await fetch(`/api/exams?id=${selectedExam._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionPaper, status: 'Completed' })
      });
      if (res.ok) {
        setShowPaperModal(false);
        setSelectedExam(null);
        setPaperFiles([]);
        setPaperPreviews([]);
        fetchExams();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setSaving(false);
    }
  };

  const grades = [...new Set(exams.map(e => e.grade))];
  const filteredExams = selectedGrade ? exams.filter(e => e.grade === selectedGrade) : [];

  if (loading) return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #paper-print-area, #paper-print-area * { visibility: visible; }
          #paper-print-area { position: absolute; left: 0; top: 0; width: 100%; }
          #paper-print-area img { max-height: 100vh; page-break-after: always; width: 100%; object-fit: contain; }
        }
      `}</style>
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Examinations & Results</h1>
          <p className="text-slate-500 text-sm mt-1">Select a class to view its examination routine.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {grades.map(grade => (
          <button
            key={grade}
            onClick={() => setSelectedGrade(grade)}
            className={`p-4 rounded-2xl border-2 transition-all duration-300 text-sm font-bold ${
              selectedGrade === grade 
                ? 'bg-amber-600 border-amber-600 text-white shadow-lg shadow-amber-200' 
                : 'bg-white border-slate-100 text-slate-600 hover:border-amber-200 hover:bg-amber-50'
            }`}
          >
            {grade}
          </button>
        ))}
      </div>

      {selectedGrade && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AcademicCapIcon className="w-6 h-6 text-amber-500" />
              <h2 className="text-lg font-bold text-slate-900">Routine for {selectedGrade}</h2>
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{filteredExams.length} Subjects Scheduled</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-bold">Subject</th>
                  <th className="px-6 py-4 font-bold">Date</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExams.map((exam) => (
                  <tr key={exam._id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{exam.subject}</p>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-600">
                      {toNepaliDate(exam.date)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        exam.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                        exam.status === 'Published' ? 'bg-blue-100 text-blue-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {exam.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {exam.questionPaper && (
                          <button
                            onClick={() => setViewPaper(exam)}
                            className="px-3 py-1.5 bg-blue-50 text-blue-600 font-bold text-xs rounded-lg hover:bg-blue-100 flex items-center gap-1 transition-colors"
                          >
                            <EyeIcon className="w-3.5 h-3.5" /> View Paper
                          </button>
                        )}
                        <button
                          onClick={() => openPaperModal(exam)}
                          className="px-4 py-1.5 bg-amber-50 text-amber-600 font-bold text-xs rounded-lg hover:bg-amber-100 flex items-center gap-2 transition-colors"
                        >
                          <DocumentTextIcon className="w-4 h-4" /> {exam.questionPaper ? 'Edit Paper' : 'Prepare Paper'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Prepare Paper Modal */}
      {showPaperModal && selectedExam && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] my-4">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <DocumentTextIcon className="w-6 h-6 text-amber-500" />
                  Question Paper
                </h2>
                <p className="text-sm text-slate-500 mt-1">{selectedExam.subject} — {selectedExam.title}</p>
              </div>
              <button onClick={() => setShowPaperModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition-all">
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Upload question paper images:</label>
                <label className="flex flex-col items-center justify-center w-full border-2 border-dashed border-slate-200 rounded-xl p-8 hover:bg-slate-50 hover:border-amber-300 transition-all cursor-pointer">
                  <PhotoIcon className="w-10 h-10 text-slate-300 mb-2" />
                  <span className="text-sm font-semibold text-slate-500">Click to upload images</span>
                  <span className="text-xs text-slate-400 mt-1">PNG, JPG accepted (select multiple)</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={e => {
                    const files = Array.from(e.target.files || []);
                    if (files.length > 0) {
                      setPaperFiles(prev => [...prev, ...files]);
                      files.forEach(file => {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          setPaperPreviews(prev => [...prev, ev.target.result]);
                        };
                        reader.readAsDataURL(file);
                      });
                    }
                  }} />
                </label>
                {paperPreviews.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {paperPreviews.map((url, i) => (
                      <div key={i} className="relative">
                        <img src={url} alt={`Page ${i + 1}`} className="max-h-60 w-full object-contain rounded-xl border border-slate-200" />
                        <button type="button" onClick={() => {
                          setPaperFiles(prev => prev.filter((_, idx) => idx !== i));
                          setPaperPreviews(prev => prev.filter((_, idx) => idx !== i));
                        }}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 cursor-pointer">&times;</button>
                        <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">Page {i + 1}</span>
                      </div>
                    ))}
                  </div>
                )}
            </div>
            <div className="p-6 border-t border-slate-100 shrink-0">
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowPaperModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-all text-sm">Cancel</button>
                <button onClick={handleSavePaper} disabled={saving || paperFiles.length === 0}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 text-white font-semibold hover:bg-amber-600 shadow-lg shadow-amber-200 transition-all text-sm disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save & Submit to Owner'}
                </button>
              </div>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* View Paper Modal */}
      {viewPaper && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] my-4">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{viewPaper.subject} — Question Paper</h2>
                <p className="text-sm text-slate-500 mt-1">{viewPaper.title} • {viewPaper.grade}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => window.print()}
                  className="px-4 py-2 bg-amber-500 text-white font-bold text-sm rounded-xl hover:bg-amber-600 transition-all">Print</button>
                <button onClick={() => setViewPaper(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition-all">
                  <span className="text-2xl">&times;</span>
                </button>
              </div>
            </div>
            <div id="paper-print-area" className="p-6 overflow-y-auto flex-1 space-y-4">
              {(() => {
                try {
                  const parsed = JSON.parse(viewPaper.questionPaper);
                  if (Array.isArray(parsed)) {
                    return parsed.map((url, i) => (
                      <img key={i} src={url} alt={`Page ${i + 1}`} className="w-full max-h-[50vh] object-contain rounded-xl border border-slate-200" />
                    ));
                  }
                } catch {}
                return viewPaper.questionPaper?.startsWith('data:image') ? (
                  <img src={viewPaper.questionPaper} alt="Question Paper" className="w-full max-h-[50vh] object-contain rounded-xl border border-slate-200" />
                ) : (
                  <pre className="whitespace-pre-wrap text-sm leading-relaxed font-mono">{viewPaper.questionPaper || 'No question paper content.'}</pre>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
