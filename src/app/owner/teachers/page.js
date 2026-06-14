'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function TeachersPage() {
  const { data: session, status } = useSession();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', teacherId: '', password: '' });

  const [detailTeacher, setDetailTeacher] = useState(null);
  const [editTeacher, setEditTeacher] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', teacherId: '', password: '' });
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchTeachers();
    }
  }, [status]);

  const fetchTeachers = async () => {
    try {
      const res = await fetch('/api/teachers');
      if (res.ok) {
        const data = await res.json();
        setTeachers(data);
      }
    } catch (error) {
      console.error("Error fetching teachers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/teachers/${deleteTarget._id}`, { method: 'DELETE' });
      if (res.ok) {
        setDeleteTarget(null);
        fetchTeachers();
      } else {
        const errData = await res.json();
        alert(`Failed to delete teacher: ${errData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error deleting teacher:", error);
    } finally {
      setDeleting(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowAddModal(false);
        setFormData({ name: '', email: '', teacherId: '', password: '' });
        fetchTeachers();
        setToast({ type: 'success', text: 'Teacher added successfully!' });
        setTimeout(() => setToast(null), 3000);
      } else {
        const errData = await res.json();
        setToast({ type: 'error', text: errData.error || 'Failed to add teacher.' });
        setTimeout(() => setToast(null), 3000);
      }
    } catch (error) {
      console.error("Error adding teacher:", error);
      alert("Network error: Could not reach the server.");
    }
  };

  const openEdit = (teacher) => {
    setEditTeacher(teacher);
    setEditForm({
      name: teacher.name || '',
      email: teacher.email || '',
      teacherId: teacher.teacherId || '',
      password: ''
    });
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!editTeacher) return;
    setSaving(true);
    try {
      const payload = {};
      if (editForm.name) payload.name = editForm.name;
      if (editForm.email) payload.email = editForm.email;
      if (editForm.teacherId) payload.teacherId = editForm.teacherId;
      if (editForm.password) payload.password = editForm.password;

      const res = await fetch(`/api/teachers/${editTeacher._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setEditTeacher(null);
        setEditForm({ name: '', email: '', teacherId: '', password: '' });
        fetchTeachers();
      } else {
        const errData = await res.json();
        alert(`Failed to update teacher: ${errData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error updating teacher:", error);
      alert("Network error while updating teacher.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>;

  const modalOverlay = 'fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Teachers</h1>
          <p className="text-slate-500 text-sm mt-1">Manage teaching staff accounts.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all duration-300"
        >
          <PlusIcon className="w-5 h-5" />
          Add Teacher
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-bold">Teacher Name</th>
                <th className="px-6 py-4 font-bold">Email / ID</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teachers.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-6 py-8 text-center text-slate-400">No teachers found.</td>
                </tr>
              ) : (
                teachers.map((teacher) => (
                  <tr key={teacher._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                          {teacher.name.charAt(0)}
                        </div>
                        <span className="font-semibold text-slate-900">{teacher.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-slate-900 font-medium">{teacher.email}</span>
                        <span className="text-xs text-slate-400">ID: {teacher.teacherId}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right space-x-3 whitespace-nowrap">
                      <button 
                        onClick={() => setDetailTeacher(teacher)}
                        className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm"
                      >
                        View Details
                      </button>
                      <button 
                        onClick={() => openEdit(teacher)}
                        className="text-amber-600 hover:text-amber-800 font-semibold text-sm"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => setDeleteTarget(teacher)}
                        className="text-red-500 hover:text-red-700 font-semibold text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {detailTeacher && (
        <div className={`${modalOverlay} overflow-y-auto`}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden my-8" style={{ animationDuration: '0.3s', animationIterationCount: 1, animationName: 'zoomIn' }}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-900">Teacher Details</h2>
              <button onClick={() => setDetailTeacher(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50 transition-all">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-2xl">
                  {detailTeacher.name.charAt(0)}
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900">{detailTeacher.name}</p>
                  <p className="text-sm text-slate-500">Teacher</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-slate-50 p-3 rounded-xl">
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Email</p>
                  <p className="font-bold text-slate-900 mt-1 break-all">{detailTeacher.email}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl">
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Teacher ID</p>
                  <p className="font-bold text-slate-900 mt-1">{detailTeacher.teacherId}</p>
                </div>
              </div>
              <button
                onClick={() => setDetailTeacher(null)}
                className="w-full mt-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-all text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editTeacher && (
        <div className={`${modalOverlay} overflow-y-auto`}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden my-8" style={{ animationDuration: '0.3s', animationIterationCount: 1, animationName: 'zoomIn' }}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-900">Edit Teacher</h2>
              <button onClick={() => { setEditTeacher(null); setEditForm({ name: '', email: '', teacherId: '', password: '' }); }} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50 transition-all">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:bg-white outline-none transition-all text-sm font-medium"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:bg-white outline-none transition-all text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Teacher ID</label>
                  <input
                    type="text"
                    value={editForm.teacherId}
                    onChange={(e) => setEditForm({ ...editForm, teacherId: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:bg-white outline-none transition-all text-sm font-medium"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">New Password <span className="text-slate-400 font-normal">(leave blank to keep current)</span></label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:bg-white outline-none transition-all text-sm font-medium"
                  placeholder="Enter new password"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => { setEditTeacher(null); setEditForm({ name: '', email: '', teacherId: '', password: '' }); }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all text-sm disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className={modalOverlay}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden" style={{ animationDuration: '0.3s', animationIterationCount: 1, animationName: 'zoomIn' }}>
            <div className="p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <XMarkIcon className="w-7 h-7 text-red-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">Delete Teacher?</h2>
              <p className="text-sm text-slate-500 mb-2">
                Are you sure you want to delete <strong className="text-slate-700">{deleteTarget.name}</strong>?
              </p>
              <p className="text-xs text-slate-400 mb-6">This action cannot be undone.</p>
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

      {/* Add Teacher Modal */}
      {showAddModal && (
        <div className={`${modalOverlay} overflow-y-auto`}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden my-8" style={{ animationDuration: '0.3s', animationIterationCount: 1, animationName: 'zoomIn' }}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-900">Add New Teacher</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50 transition-all">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:bg-white outline-none transition-all text-sm font-medium"
                  placeholder="e.g. Ram Bahadur"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:bg-white outline-none transition-all text-sm font-medium"
                    placeholder="ram@school.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Teacher ID</label>
                  <input
                    type="text"
                    required
                    value={formData.teacherId}
                    onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:bg-white outline-none transition-all text-sm font-medium"
                    placeholder="T-101"
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
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:bg-white outline-none transition-all text-sm font-medium"
                  placeholder="Create a password"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all text-sm"
                >
                  Save Teacher
                </button>
              </div>
            </form>
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
