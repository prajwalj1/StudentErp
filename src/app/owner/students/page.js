'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { PlusIcon, UserIcon, AcademicCapIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { NepaliDatePicker } from 'react-bs-calender';
import 'react-bs-calender/styles.css';

export default function StudentsPage() {
  const { data: session, status } = useSession();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', studentId: '', email: '', password: '', grade: 'Grade 10', section: 'A', fatherName: '', fatherMobile: '', dob: '', address: '', attendance: 100 });

  const [filterGrade, setFilterGrade] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const [detailStudent, setDetailStudent] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [updating, setUpdating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);
  const [promoting, setPromoting] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchStudents();
    }
  }, [status]);

  const fetchStudents = async () => {
    try {
      setFetchError(false);
      const [studentsRes, attRes] = await Promise.all([
        fetch('/api/students'),
        fetch('/api/attendance')
      ]);
      if (studentsRes.ok) {
        const data = await studentsRes.json();
        const activeStudents = data.filter(s => s.status !== 'graduated');
        let attMap = {};
        if (attRes.ok) {
          const attRecords = await attRes.json();
          attRecords.forEach(rec => {
            rec.students.forEach(s => {
              const id = s.studentId?._id || s.studentId;
              if (!attMap[id]) attMap[id] = { total: 0, present: 0 };
              attMap[id].total++;
              if (s.status === 'Present') attMap[id].present++;
            });
          });
        }
        setStudents(activeStudents.map(s => ({
          ...s,
          attendance: attMap[s._id]
            ? Math.round((attMap[s._id].present / attMap[s._id].total) * 100)
            : null
        })));
      } else {
        setFetchError(true);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/students/${deleteTarget}`, { method: 'DELETE' });
      if (res.ok) {
        setDeleteTarget(null);
        fetchStudents();
      } else {
        const errData = await res.json();
        alert(`Failed to delete student: ${errData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error deleting student:", error);
      alert("Network error while deleting student.");
    } finally {
      setDeleting(false);
    }
  };

  const openEditMode = (student) => {
    setEditForm({
      name: student.name || '',
      studentId: student.studentId || '',
      email: student.email || '',
      password: '',
      grade: student.grade || '',
      section: student.section || '',
      fatherName: student.fatherName || '',
      fatherMobile: student.fatherMobile || '',
      dob: student.dob || '',
      address: student.address || '',
    });
    setEditMode(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const payload = { ...editForm };
      if (!payload.password || payload.password.trim() === '') {
        delete payload.password;
      }
      const res = await fetch(`/api/students/${detailStudent._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setEditMode(false);
        setDetailStudent(null);
        fetchStudents();
      } else {
        const errData = await res.json();
        alert(`Failed to update student: ${errData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error updating student:", error);
      alert("Network error while updating student.");
    } finally {
      setUpdating(false);
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesGrade = filterGrade === 'All' || student.grade === filterGrade;
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesGrade && matchesSearch;
  });

  const uniqueGrades = ['All', ...new Set(students.map(s => s.grade))];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowAddModal(false);
        setFormData({ name: '', studentId: '', email: '', password: '', grade: 'Grade 10', section: 'A', fatherName: '', fatherMobile: '', dob: '', address: '', attendance: 100 });
        fetchStudents();
        setToast({ type: 'success', text: 'Student added successfully!' });
        setTimeout(() => setToast(null), 3000);
      } else {
        const errData = await res.json();
        setToast({ type: 'error', text: errData.error || 'Failed to add student.' });
        setTimeout(() => setToast(null), 3000);
      }
    } catch (error) {
      console.error("Error adding student:", error);
      alert("Network error: Could not reach the server.");
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="h-full flex flex-col p-4 sm:p-8 max-w-7xl mx-auto">
      <div className="shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100 gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <UserIcon className="w-8 h-8 text-blue-600" />
            Students
          </h1>
          <p className="text-slate-500 text-sm mt-1">Manage enrolled students and their academic records.</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <input 
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm flex-1 md:w-64 bg-slate-50"
          />
          <select 
            value={filterGrade}
            onChange={(e) => setFilterGrade(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-semibold text-slate-600 bg-slate-50 cursor-pointer"
          >
            {uniqueGrades.map(g => <option key={g} value={g}>{g === 'All' ? 'All Grades' : g}</option>)}
          </select>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-blue-200 transition-all duration-300"
          >
            <PlusIcon className="w-5 h-5" />
            Add Student
          </button>
        </div>
      </div>
      <div className="shrink-0 flex flex-wrap items-center gap-3 mb-6">
        <button
          onClick={async () => {
            if (!confirm('Promote all students to the next grade?\n\nGrade 1 → Grade 2\nGrade 2 → Grade 3\n...\nGrade 11 → Grade 12\nGrade 12 → Graduated (login disabled)')) return;
            setPromoting(true);
            try {
              const res = await fetch('/api/students/promote', { method: 'PATCH' });
              const data = await res.json();
              setToast({ type: res.ok ? 'success' : 'error', text: data.message || data.error || 'Promotion done.' });
              setTimeout(() => setToast(null), 3000);
              if (res.ok) fetchStudents();
            } catch {
              setToast({ type: 'error', text: 'Network error.' });
              setTimeout(() => setToast(null), 3000);
            } finally { setPromoting(false); }
          }}
          disabled={promoting}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-emerald-200 transition-all duration-300 disabled:opacity-50"
        >
          <AcademicCapIcon className="w-5 h-5" />
          {promoting ? 'Promoting...' : 'Promote All'}
        </button>
      </div>

      <div className="flex-1 overflow-auto space-y-6 scrollbar-hide pb-2">
        {(() => {
          const grouped = {};
          filteredStudents.forEach(s => {
            const key = s.grade || 'Ungraded';
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(s);
          });
          const sortedGrades = Object.keys(grouped).sort();

          if (fetchError) {
            return (
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-12 text-center">
                <p className="text-red-500 font-bold">Failed to load students.</p>
                <button onClick={() => { setLoading(true); fetchStudents(); }} className="mt-2 text-blue-600 underline text-sm">Retry</button>
              </div>
            );
          }

          if (sortedGrades.length === 0) {
            return (
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-12 text-center">
                <p className="text-slate-400 font-medium">No students matching your filters.</p>
              </div>
            );
          }

          return sortedGrades.map(grade => (
            <div key={grade} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">{grade}</h3>
                <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">{grouped[grade].length} students</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-slate-400 text-xs uppercase tracking-wider">
                      <th className="px-6 py-3 font-bold w-16">Roll</th>
                      <th className="px-6 py-3 font-bold">Student Name</th>
                      <th className="px-6 py-3 font-bold">Section</th>
                      <th className="px-6 py-3 font-bold">Attendance</th>
                      <th className="px-6 py-3 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {grouped[grade].map((student) => (
                      <tr key={student._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-center font-bold text-slate-700 text-sm">
                          {student.rollNumber || '-'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                              {student.name.charAt(0)}
                            </div>
                            <span className="font-semibold text-slate-900">{student.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-medium">
                          {student.section || '-'}
                        </td>
                        <td className="px-6 py-4">
                          {student.attendance !== null ? (
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${student.attendance >= 75 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                              {student.attendance}%
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-400">
                              N/A
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right space-x-3 whitespace-nowrap">
                          <button 
                            onClick={() => setDetailStudent(student)}
                            className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
                          >
                            View Details
                          </button>
                          <button 
                            onClick={() => setDeleteTarget(student._id)}
                            className="text-red-500 hover:text-red-700 font-semibold text-sm"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ));
        })()}
      </div>

      {/* Details / Edit Modal */}
      {detailStudent && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md flex flex-col max-h-[85vh] my-8" style={{ animationDuration: '0.3s', animationIterationCount: 1, animationName: 'zoomIn' }}>
            <div className="shrink-0 p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-3xl">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <AcademicCapIcon className="w-6 h-6 text-blue-600" />
                {editMode ? 'Edit Student' : 'Student Details'}
              </h2>
              <button onClick={() => { setDetailStudent(null); setEditMode(false); }} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50 transition-all">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {editMode ? (
              <div className="flex-1 overflow-y-auto p-6">
                <form onSubmit={handleEditSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                    <input type="text" required value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none transition-all text-sm font-medium" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Student ID</label>
                      <input type="text" required value={editForm.studentId} onChange={e => setEditForm({ ...editForm, studentId: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none transition-all text-sm font-medium" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                      <input type="email" required value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none transition-all text-sm font-medium" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">New Password <span className="text-slate-400 font-normal">(leave blank to keep current)</span></label>
                    <input type="password" value={editForm.password} onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none transition-all text-sm font-medium"
                      placeholder="Enter new password" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Grade / Class</label>
                      <select required value={editForm.grade} onChange={e => setEditForm({ ...editForm, grade: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none transition-all text-sm font-semibold text-slate-700 cursor-pointer">
                        {['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'].map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Section</label>
                      <input type="text" value={editForm.section} onChange={e => setEditForm({ ...editForm, section: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none transition-all text-sm font-medium" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Father's Name</label>
                      <input type="text" value={editForm.fatherName} onChange={e => setEditForm({ ...editForm, fatherName: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none transition-all text-sm font-medium" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Father's Mobile</label>
                      <input type="text" value={editForm.fatherMobile} onChange={e => setEditForm({ ...editForm, fatherMobile: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none transition-all text-sm font-medium" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 items-start">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Date of Birth (Nepali)</label>
                      <NepaliDatePicker
                        value={editForm.dob ? editForm.dob.replace(/-/g, '/') : ''}
                        onChange={(date, nepaliDateString) => {
                          setEditForm({ ...editForm, dob: nepaliDateString || '' });
                        }}
                        locale="en"
                        placeholder="YYYY/MM/DD"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Address</label>
                      <input type="text" value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none transition-all text-sm font-medium" />
                    </div>
                  </div>
                  <div className="pt-4 flex gap-3 border-t border-slate-100">
                    <button type="button" onClick={() => setEditMode(false)}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-all text-sm">
                      Cancel
                    </button>
                    <button type="submit" disabled={updating}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all text-sm disabled:opacity-50">
                      {updating ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-2xl">
                    {detailStudent.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-900">{detailStudent.name}</p>
                    <p className="text-sm text-slate-500">Roll: {detailStudent.rollNumber || '-'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Student ID</p>
                    <p className="font-bold text-slate-900 mt-1">{detailStudent.studentId || '-'}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Email</p>
                    <p className="font-bold text-slate-900 mt-1">{detailStudent.email || '-'}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Grade</p>
                    <p className="font-bold text-slate-900 mt-1">{detailStudent.grade}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Section</p>
                    <p className="font-bold text-slate-900 mt-1">{detailStudent.section || 'N/A'}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Father's Name</p>
                    <p className="font-bold text-slate-900 mt-1">{detailStudent.fatherName || 'N/A'}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Father's Mobile</p>
                    <p className="font-bold text-slate-900 mt-1">{detailStudent.fatherMobile || 'N/A'}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Date of Birth (Nepali)</p>
                    <p className="font-bold text-slate-900 mt-1">{detailStudent.dob || 'N/A'}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Address</p>
                    <p className="font-bold text-slate-900 mt-1">{detailStudent.address || 'N/A'}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Attendance</p>
                    <p className={`font-bold mt-1 ${detailStudent.attendance !== null ? (detailStudent.attendance >= 75 ? 'text-emerald-600' : 'text-red-600') : 'text-slate-400'}`}>
                      {detailStudent.attendance !== null ? `${detailStudent.attendance}%` : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Roll Number</p>
                    <p className="font-bold text-slate-900 mt-1">{detailStudent.rollNumber || 'Not assigned'}</p>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => openEditMode(detailStudent)}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all text-sm">
                    Edit
                  </button>
                  <button onClick={() => { setDetailStudent(null); setEditMode(false); }}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-all text-sm">
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden" style={{ animationDuration: '0.3s', animationIterationCount: 1, animationName: 'zoomIn' }}>
            <div className="p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <XMarkIcon className="w-7 h-7 text-red-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">Delete Student?</h2>
              <p className="text-sm text-slate-500 mb-6">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-all text-sm"
                >
                  No
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-all text-sm disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md flex flex-col max-h-[85vh]" style={{ animationDuration: '0.3s', animationIterationCount: 1, animationName: 'zoomIn' }}>
            <div className="shrink-0 p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-3xl">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <AcademicCapIcon className="w-6 h-6 text-blue-600" />
                Add New Student
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50 transition-all">
                <PlusIcon className="w-6 h-6 rotate-45" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none transition-all text-sm font-medium"
                    placeholder="e.g. Aarav Sharma"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Student ID</label>
                    <input
                      type="text"
                      required
                      value={formData.studentId}
                      onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none transition-all text-sm font-medium"
                      placeholder="e.g. STU001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none transition-all text-sm font-medium"
                      placeholder="e.g. aarav@example.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none transition-all text-sm font-medium"
                    placeholder="Set login password"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Grade / Class</label>
                    <select
                      required
                      value={formData.grade}
                      onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none transition-all text-sm font-semibold text-slate-700 cursor-pointer"
                    >
                      {['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'].map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Section</label>
                    <input
                      type="text"
                      value={formData.section}
                      onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none transition-all text-sm font-medium"
                      placeholder="e.g. A, B"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Father's Name</label>
                    <input type="text" value={formData.fatherName} onChange={e => setFormData({ ...formData, fatherName: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none transition-all text-sm font-medium"
                      placeholder="e.g. Ram Sharma" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Father's Mobile</label>
                    <input type="text" value={formData.fatherMobile} onChange={e => setFormData({ ...formData, fatherMobile: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none transition-all text-sm font-medium"
                      placeholder="e.g. 98XXXXXXXX" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 items-start">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Date of Birth (Nepali)</label>
                    <NepaliDatePicker
                      value={formData.dob ? formData.dob.replace(/-/g, '/') : ''}
                      onChange={(date, nepaliDateString) => {
                        setFormData({ ...formData, dob: nepaliDateString || '' });
                      }}
                      locale="en"
                      placeholder="YYYY/MM/DD"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Address</label>
                    <input type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none transition-all text-sm font-medium"
                      placeholder="e.g. Kathmandu, Nepal" />
                  </div>
                </div>
                <div className="pt-4 flex gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-all text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all text-sm"
                  >
                    Save Student
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[200] px-6 py-3 rounded-2xl shadow-2xl text-sm font-bold text-white transition-all animate-float ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {toast.text}
        </div>
      )}
      <style jsx>{`
        @keyframes zoomIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
