'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { PlusIcon, DocumentTextIcon, PaperClipIcon, CalendarIcon, UserGroupIcon, CheckCircleIcon, XMarkIcon, AcademicCapIcon, TrashIcon } from '@heroicons/react/24/outline';
import { toNepaliDate, toLocalDateStr } from '@/lib/nepaliDate';
import { NepaliDatePicker } from 'react-bs-calender';
import 'react-bs-calender/styles.css';

const AssignmentsPage = () => {
  const { data: session, status } = useSession();
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

  useEffect(() => {
    if (status === 'authenticated') {
      fetchAssignments();
      fetchClassOptions();
    }
  }, [status]);

  const fetchClassOptions = async () => {
    try {
      const classesRes = await fetch('/api/classes');
      if (classesRes.ok) {
        const classes = await classesRes.json();
        const myClasses = classes.filter(c =>
          c.teacherId && c.teacherId._id === session?.user?.id
        );
        const pairs = new Set();
        myClasses.forEach(c => {
          pairs.add(`${c.grade || 'Grade 10'}${c.section ? `-${c.section}` : ''}`);
        });
        const opts = ['All', ...Array.from(pairs).sort()];
        setClassOptions(opts);
        if (opts.length > 1) {
          setFormData(prev => ({ ...prev, classId: opts[1] }));
        }
      }
    } catch (_) {
      const opts = ['All'];
      setClassOptions(opts);
    }
  };

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/assignments');
      if (res.ok) {
        const data = await res.json();
        setAssignments(data);
      } else {
        setAssignments([]);
      }
    } catch (err) {
      console.error(err);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async (assignmentId) => {
    try {
      const res = await fetch(`/api/submissions?assignmentId=${assignmentId}`);
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data);
        const grades = {};
        const feedbacks = {};
        data.forEach(s => {
          if (s.grade !== null && s.grade !== undefined) grades[s._id] = s.grade;
          if (s.feedback) feedbacks[s._id] = s.feedback;
        });
        setGradeValues(grades);
        setFeedbackValues(feedbacks);
      }
    } catch (err) {
      console.error(err);
      setSubmissions([]);
    }
  };

  const openGradeModal = (assignment) => {
    setGradeModal(assignment);
    fetchSubmissions(assignment._id);
  };

  const handleGrade = async (subId) => {
    const grade = gradeValues[subId];
    const feedback = feedbackValues[subId] || '';
    if (grade === undefined || grade === '' || Number(grade) < 0 || Number(grade) > 100) {
      alert('Enter a grade between 0 and 100.');
      return;
    }
    try {
      const res = await fetch(`/api/submissions?id=${subId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grade: Number(grade), feedback, status: 'graded' }),
      });
      if (res.ok) {
        fetchSubmissions(gradeModal._id);
        fetchAssignments();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save grade.');
      }
    } catch {
      alert('Network error.');
    }
  };

  const toggleCompleted = async (assignmentId, currentStatus) => {
    try {
      const res = await fetch('/api/assignments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: assignmentId, status: currentStatus === 'Active' ? 'Completed' : 'Active' }),
      });
      if (res.ok) fetchAssignments();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePost = async (e) => {
    e.preventDefault();
    try {
      const payload = { title: formData.title, classId: formData.classId, dueDate: formData.dueDate };
      if (formData.fileUrl) {
        payload.fileUrl = formData.fileUrl;
        payload.fileName = formData.fileName;
      }
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
        setToast({ type: 'success', text: 'Assignment created successfully!' });
        setTimeout(() => setToast(null), 3000);
      } else {
        const err = await res.json();
        setToast({ type: 'error', text: `Failed to add assignment: ${err.error}` });
        setTimeout(() => setToast(null), 3000);
      }
    } catch (err) {
      alert('Network error while posting assignment.');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      alert('Only PDF files are allowed.');
      e.target.value = '';
      return;
    }
    setFormData({ ...formData, fileName: file.name });
    const reader = new FileReader();
    reader.onload = (ev) => {
      setFormData(prev => ({ ...prev, fileUrl: ev.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = async (assignmentId) => {
    if (!confirm('Are you sure you want to delete this assignment? All submissions will also be deleted.')) return;
    try {
      const res = await fetch(`/api/assignments?id=${assignmentId}`, { method: 'DELETE' });
      if (res.ok) {
        setToast({ type: 'success', text: 'Assignment deleted successfully!' });
        setTimeout(() => setToast(null), 3000);
        fetchAssignments();
      } else {
        const err = await res.json();
        setToast({ type: 'error', text: err.error || 'Failed to delete assignment.' });
        setTimeout(() => setToast(null), 3000);
      }
    } catch {
      setToast({ type: 'error', text: 'Network error.' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const filteredAssignments = assignments.filter(item => {
    if (filterClass === 'All') return true;
    return item.classId === filterClass;
  });

  const uniqueClasses = classOptions.length > 0 ? classOptions : ['All', 'Grade 10-A', 'Grade 11-C', 'Grade 12-B'];

  if (loading || status === 'loading') {
    return (
      <div className="p-12 flex justify-center items-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2.5">
            <DocumentTextIcon className="w-8 h-8 text-indigo-600 flex-shrink-0" />
            Assignments
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Create, distribute, and track student coursework and deadlines.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all w-full sm:w-auto"
          >
            {uniqueClasses.map(cls => (
              <option key={cls} value={cls}>{cls === 'All' ? 'All Classes' : cls}</option>
            ))}
          </select>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 transition-all duration-300 w-full sm:w-auto text-sm"
          >
            <PlusIcon className="w-5 h-5 flex-shrink-0" />
            Create Assignment
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredAssignments.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <DocumentTextIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-700">No assignments posted yet</h3>
            <p className="text-slate-400 text-sm mt-1">Click the button above to create and distribute your first assignment.</p>
          </div>
        ) : (
          filteredAssignments.map(item => (
            <div
              key={item._id}
              className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative group overflow-hidden flex flex-col justify-between hover:shadow-xl hover:border-indigo-100 transition-all duration-300"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-50 to-transparent rounded-bl-full -z-10 group-hover:scale-125 transition-transform duration-500"></div>

              <div>
                <div className="flex justify-between items-start mb-4 gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase ${
                    item.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/50' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {item.status || 'Active'}
                  </span>
                  <div className="p-2 bg-indigo-50/50 rounded-xl text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                    <DocumentTextIcon className="w-5 h-5" />
                  </div>
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-1.5 group-hover:text-indigo-600 transition-colors line-clamp-2">
                  {item.title}
                </h3>

                <div className="flex items-center gap-2 text-sm font-bold text-indigo-600 mb-6 bg-indigo-50/40 w-fit px-3 py-1 rounded-lg border border-indigo-100/50">
                  <UserGroupIcon className="w-4 h-4 flex-shrink-0" />
                  {item.classId}
                </div>

                <div className="space-y-4 my-6 py-4 border-t border-b border-slate-50">
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-500 mb-1.5">
                      <span className="flex items-center gap-1">
                        <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500" />
                        Submissions
                      </span>
                      <span className="text-slate-900 font-black">{item.submissions || 0} / {item.total || '?'}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                        style={{ width: `${((item.submissions || 0) / (item.total || 1)) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <CalendarIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span>Due Date:</span>
                    <span className="text-slate-900 font-black ml-auto">
                      {item.dueDate ? toNepaliDate(item.dueDate) : 'No Due Date'}
                    </span>
                  </div>
                  {item.fileUrl && (
                    <a href={item.fileUrl} download={item.fileName || 'assignment.pdf'} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 p-2.5 rounded-xl border border-indigo-100 hover:bg-indigo-100 transition-colors mt-2">
                      <PaperClipIcon className="w-4 h-4 flex-shrink-0" />
                      <span>View Attachment</span>
                      <span className="text-indigo-400 font-normal ml-auto">{item.fileName || 'PDF'}</span>
                    </a>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => openGradeModal(item)}
                  className={`flex-1 py-2.5 font-black rounded-xl text-xs sm:text-sm transition-all shadow-sm ${
                    item.submissions > 0
                      ? 'bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-600'
                      : 'bg-slate-50 text-slate-400 cursor-not-allowed'
                  }`}
                  disabled={item.submissions === 0}
                >
                  {item.submissions > 0 ? `Grade (${item.submissions})` : 'No Submissions'}
                </button>
                <button
                  onClick={() => toggleCompleted(item._id, item.status)}
                  className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl text-xs sm:text-sm hover:border-slate-300 hover:bg-slate-50 transition-all"
                >
                  {item.status === 'Active' ? 'Complete' : 'Reopen'}
                </button>
                <button
                  onClick={() => handleDelete(item._id)}
                  className="p-2.5 bg-white border border-red-200 text-red-500 rounded-xl hover:bg-red-50 hover:border-red-300 transition-all"
                  title="Delete assignment"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-float my-8" style={{ maxHeight: '90vh' }}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <DocumentTextIcon className="w-6 h-6 text-indigo-600" />
                New Assignment
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50 transition-all">
                <PlusIcon className="w-6 h-6 rotate-45" />
              </button>
            </div>

            <form onSubmit={handlePost} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 space-y-5 overflow-y-auto flex-1">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Assignment Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 focus:bg-white outline-none transition-all text-sm font-medium"
                    placeholder="e.g. Chapter 4 Exercises & Essay"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Target Class</label>
                  <select
                    value={formData.classId}
                    onChange={e => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 focus:bg-white outline-none transition-all text-sm font-semibold text-slate-700"
                  >
                    {classOptions.filter(c => c !== 'All').map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Submission Due Date</label>
                  <NepaliDatePicker
                    value={formData.dueDate ? new Date(formData.dueDate) : null}
                    onChange={(d, nepaliStr) => {
                      if (d) setFormData({ ...formData, dueDate: toLocalDateStr(d) });
                    }}
                    locale="en"
                    placeholder="YYYY/MM/DD"
                  />
                </div>

                <div className="pt-2">
                  <label className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 font-semibold flex items-center justify-center gap-2 hover:bg-slate-50 hover:border-indigo-300 transition-colors text-sm cursor-pointer">
                    <PaperClipIcon className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                    {formData.fileName || 'Attach Coursework Files / PDF'}
                    <input type="file" accept=".pdf,application/pdf" onChange={handleFileChange} className="hidden" />
                  </label>
                  {formData.fileName && (
                    <p className="text-[10px] text-emerald-600 font-semibold mt-1 text-center">{formData.fileName} selected</p>
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 flex gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all text-sm"
                >
                  Post Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {gradeModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden my-8" style={{ maxHeight: '90vh' }}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <AcademicCapIcon className="w-6 h-6 text-indigo-600" />
                  Submissions — {gradeModal.title}
                </h2>
                <p className="text-xs text-slate-500">{gradeModal.classId} &middot; {submissions.length} submitted</p>
              </div>
              <button onClick={() => setGradeModal(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50 transition-all">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="overflow-y-auto p-6 space-y-4" style={{ maxHeight: 'calc(90vh - 80px)' }}>
              {submissions.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No submissions yet.</p>
              ) : (
                submissions.map(sub => (
                  <div key={sub._id} className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-bold text-slate-900">{sub.studentId?.name || 'Unknown'}</p>
                        <p className="text-xs text-slate-500">{sub.studentId?.studentId || ''} &middot; {sub.studentId?.grade || ''}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                        sub.status === 'graded' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {sub.status === 'graded' ? 'Graded' : 'Submitted'}
                      </span>
                    </div>

                    {sub.fileUrl && (
                      <div className="mb-3">
                        <a href={sub.fileUrl} download={sub.fileName || 'submission.pdf'} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-white px-3 py-1.5 rounded-lg border border-indigo-100 hover:bg-indigo-50 transition-colors">
                          <PaperClipIcon className="w-3.5 h-3.5" />
                          {sub.fileName || 'Download Submission'}
                        </a>
                      </div>
                    )}

                    {sub.notes && (
                      <p className="text-xs text-slate-600 mb-3 italic bg-white p-2.5 rounded-xl border border-slate-100">
                        &ldquo;{sub.notes}&rdquo;
                      </p>
                    )}

                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-200">
                      <div className="flex-1">
                        <label className="text-xs font-semibold text-slate-500 block mb-1">Grade (0-100)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={gradeValues[sub._id] !== undefined ? gradeValues[sub._id] : ''}
                          onChange={e => setGradeValues({ ...gradeValues, [sub._id]: e.target.value })}
                          className="w-24 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all"
                          placeholder="-"
                        />
                      </div>
                      <div className="flex-[2]">
                        <label className="text-xs font-semibold text-slate-500 block mb-1">Feedback</label>
                        <input
                          type="text"
                          value={feedbackValues[sub._id] || ''}
                          onChange={e => setFeedbackValues({ ...feedbackValues, [sub._id]: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all"
                          placeholder="Add feedback..."
                        />
                      </div>
                      <button
                        onClick={() => handleGrade(sub._id)}
                        className="mt-5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shrink-0"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[200] px-6 py-3 rounded-2xl shadow-2xl text-sm font-bold text-white transition-all animate-float ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {toast.text}
        </div>
      )}
    </div>
  );
};

export default AssignmentsPage;
