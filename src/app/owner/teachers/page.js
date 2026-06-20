'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  PlusIcon, XMarkIcon, AcademicCapIcon, EnvelopeIcon,
  IdentificationIcon, ExclamationTriangleIcon,
  TrashIcon, PencilSquareIcon, MagnifyingGlassIcon,
  EyeIcon, EyeSlashIcon, ArrowDownTrayIcon, CheckCircleIcon,
} from '@heroicons/react/24/outline';

function Avatar({ name, size = 'md' }) {
  const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-xl' };
  return (
    <div className={`${sizes[size]} rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-sm shrink-0`}>
      {name?.charAt(0)?.toUpperCase() || '?'}
    </div>
  );
}

function Badge({ children, color = 'slate' }) {
  const colors = {
    slate: 'bg-slate-100 text-slate-600', emerald: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700', red: 'bg-red-100 text-red-700',
    indigo: 'bg-indigo-100 text-indigo-700', purple: 'bg-purple-100 text-purple-700',
  };
  return <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${colors[color]}`}>{children}</span>;
}

function StatBox({ icon: Icon, label, value, color }) {
  const colors = { indigo: 'from-indigo-500 to-purple-600', emerald: 'from-emerald-500 to-emerald-600', amber: 'from-amber-500 to-amber-600', blue: 'from-blue-500 to-blue-600' };
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100 flex items-center gap-3">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${colors[color] || colors.indigo} text-white shadow-sm`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="text-lg font-extrabold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function InputField({ label, type = 'text', value, onChange, placeholder, required, className }) {
  const [showPw, setShowPw] = useState(false);
  const isPw = type === 'password';
  return (
    <div className={className}>
      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
      <div className="relative">
        <input type={isPw ? (showPw ? 'text' : 'password') : type} value={value} onChange={onChange} required={required} placeholder={placeholder}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all placeholder:text-slate-300 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 pr-11" />
        {isPw && (
          <button type="button" onClick={() => setShowPw(!showPw)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition-all hover:bg-slate-200 hover:text-slate-600">
            {showPw ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

function ConfirmModal({ open, title, message, confirmLabel, onConfirm, onCancel, loading, variant = 'red' }) {
  if (!open) return null;
  const colors = { red: { bg: 'bg-red-600 hover:bg-red-700', icon: 'text-red-600' }, emerald: { bg: 'bg-emerald-600 hover:bg-emerald-700', icon: 'text-emerald-600' } };
  const c = colors[variant];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={onCancel}>
      <div className="w-full max-w-sm animate-[zoomIn_0.2s_ease-out] rounded-2xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="text-center">
          <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-${variant}-50 ${c.icon}`}>
            <ExclamationTriangleIcon className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">{message}</p>
        </div>
        <div className="mt-6 flex gap-3">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-50">Cancel</button>
          <button onClick={onConfirm} disabled={loading}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-50 shadow-lg ${c.bg}`}>
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
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

function downloadTeacherCSV(teachers) {
  const rows = teachers.map((t, i) => [i + 1, t.name, t.email, t.teacherId, '********']);
  const csv = [
    ['S.N.', 'Name', 'Email', 'Teacher ID', 'Password'],
    ...rows,
  ].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'all_teachers.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function TeachersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
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
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') fetchTeachers();
  }, [status]);

  const showToast = (type, text) => { setToast({ type, text }); };

  const fetchTeachers = async () => {
    try {
      const res = await fetch('/api/teachers');
      if (res.ok) setTeachers(await res.json());
    } catch (e) { console.error(e) } finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/teachers/${deleteTarget._id}`, { method: 'DELETE' });
      if (res.ok) { setDeleteTarget(null); fetchTeachers(); showToast('success', 'Teacher deleted.'); }
      else { const err = await res.json(); showToast('error', err.error || 'Delete failed.'); }
    } catch { showToast('error', 'Network error.'); }
    finally { setDeleting(false); }
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
        showToast('success', 'Teacher added successfully!');
      } else {
        const err = await res.json();
        showToast('error', err.error || 'Failed to add teacher.');
      }
    } catch { showToast('error', 'Network error.'); }
  };

  const openEdit = (teacher) => {
    setEditTeacher(teacher);
    setEditForm({ name: teacher.name || '', email: teacher.email || '', teacherId: teacher.teacherId || '', password: '' });
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
        showToast('success', 'Teacher updated.');
      } else {
        const err = await res.json();
        showToast('error', err.error || 'Update failed.');
      }
    } catch { showToast('error', 'Network error.'); }
    finally { setSaving(false); }
  };

  const filteredTeachers = useMemo(() =>
    teachers.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [teachers, searchTerm]
  );

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-indigo-600 border-t-transparent" />
    </div>
  );

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50/80 via-white to-indigo-50/20">
      <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6 lg:p-8">

        {/* ─── Header ─── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 sm:p-6 shadow-xl">
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                <AcademicCapIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white">Teachers</h1>
                <p className="text-xs text-slate-400">{teachers.length} teaching staff members</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {teachers.length > 0 && (
                <button onClick={() => downloadTeacherCSV(teachers)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white backdrop-blur-sm transition-all hover:bg-white/20">
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  Export CSV
                </button>
              )}
              <button onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-900/30 transition-all hover:bg-indigo-700">
                <PlusIcon className="h-4 w-4" />
                Add Teacher
              </button>
            </div>
          </div>
        </div>

        {/* ─── Stats Row ─── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatBox icon={AcademicCapIcon} label="Total Teachers" value={teachers.length} color="indigo" />
          <StatBox icon={EnvelopeIcon} label="With Email" value={teachers.filter(t => t.email).length} color="blue" />
          <StatBox icon={IdentificationIcon} label="With ID" value={teachers.filter(t => t.teacherId).length} color="emerald" />
          <StatBox icon={MagnifyingGlassIcon} label="Filtered" value={`${filteredTeachers.length}`} color="amber" />
        </div>

        {/* ─── Search ─── */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search teachers by name..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-slate-700 outline-none transition-all placeholder:text-slate-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
          </div>
          {searchTerm && <button onClick={() => setSearchTerm('')}
            className="rounded-xl bg-slate-100 px-3.5 py-2.5 text-xs font-bold text-slate-500 transition-all hover:bg-slate-200">Clear</button>}
        </div>

        {/* ─── Teacher List ─── */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {filteredTeachers.length === 0 ? (
            <div className="p-12 text-center">
              <AcademicCapIcon className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm font-bold text-slate-500">No teachers found</p>
              <p className="text-xs text-slate-400 mt-1">{searchTerm ? 'Try a different search.' : 'Click "Add Teacher" to get started.'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50">
                    <th className="px-5 py-3.5 w-14 text-center">#</th>
                    <th className="px-5 py-3.5">Teacher</th>
                    <th className="px-5 py-3.5 hidden sm:table-cell">Email</th>
                    <th className="px-5 py-3.5 hidden md:table-cell">Teacher ID</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTeachers.map((teacher, idx) => (
                    <tr key={teacher._id} className="group transition-colors hover:bg-slate-50/50">
                      <td className="px-5 py-4 text-center text-sm font-bold text-slate-300">{idx + 1}</td>
                      <td className="px-5 py-4">
                        <button onClick={() => setDetailTeacher(teacher)} className="flex items-center gap-3 text-left">
                          <Avatar name={teacher.name} size="sm" />
                          <div>
                            <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{teacher.name}</p>
                            <p className="text-[10px] text-slate-400 sm:hidden">{teacher.email}</p>
                          </div>
                        </button>
                      </td>
                      <td className="px-5 py-4 hidden sm:table-cell">
                        <span className="text-sm font-medium text-slate-600">{teacher.email}</span>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <Badge color="indigo">{teacher.teacherId}</Badge>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setDetailTeacher(teacher)}
                            className="rounded-lg p-1.5 text-slate-400 transition-all hover:bg-indigo-50 hover:text-indigo-600" title="View">
                            <IdentificationIcon className="h-4 w-4" />
                          </button>
                          <button onClick={() => openEdit(teacher)}
                            className="rounded-lg p-1.5 text-slate-400 transition-all hover:bg-amber-50 hover:text-amber-600" title="Edit">
                            <PencilSquareIcon className="h-4 w-4" />
                          </button>
                          <button onClick={() => setDeleteTarget(teacher)}
                            className="rounded-lg p-1.5 text-slate-400 transition-all hover:bg-red-50 hover:text-red-500" title="Delete">
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                        <button onClick={() => setDetailTeacher(teacher)}
                          className="sm:hidden text-xs font-bold text-indigo-600">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ─── Detail Modal ─── */}
      {detailTeacher && !editTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={() => setDetailTeacher(null)}>
          <div className="w-full max-w-md animate-[zoomIn_0.2s_ease-out] rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-2">
                <AcademicCapIcon className="h-5 w-5 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-900">Teacher Details</h2>
              </div>
              <button onClick={() => setDetailTeacher(null)}
                className="rounded-xl p-1.5 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                <Avatar name={detailTeacher.name} size="lg" />
                <div>
                  <p className="text-lg font-bold text-slate-900">{detailTeacher.name}</p>
                  <Badge color="indigo">Teacher</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { icon: EnvelopeIcon, label: 'Email', value: detailTeacher.email },
                  { icon: IdentificationIcon, label: 'Teacher ID', value: detailTeacher.teacherId },
                  { icon: AcademicCapIcon, label: 'Role', value: 'TEACHER' },
                ].map((item, i) => (
                  <div key={i} className="rounded-xl bg-slate-50 p-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      <item.icon className="h-3.5 w-3.5" /> {item.label}
                    </div>
                    <p className="mt-0.5 text-sm font-bold text-slate-900">{item.value || '—'}</p>
                  </div>
                ))}
              </div>
              <button onClick={() => setDetailTeacher(null)}
                className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Edit Modal ─── */}
      {editTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={() => { setEditTeacher(null); setEditForm({ name: '', email: '', teacherId: '', password: '' }); }}>
          <div className="w-full max-w-md animate-[zoomIn_0.2s_ease-out] rounded-2xl bg-white shadow-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
              <div className="flex items-center gap-2">
                <PencilSquareIcon className="h-5 w-5 text-amber-600" />
                <h2 className="text-base font-bold text-slate-900">Edit Teacher</h2>
              </div>
              <button onClick={() => { setEditTeacher(null); setEditForm({ name: '', email: '', teacherId: '', password: '' }); }}
                className="rounded-xl p-1.5 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleEdit} className="overflow-y-auto p-6 space-y-4">
              <InputField label="Full Name" value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Email" type="email" value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} />
                <InputField label="Teacher ID" value={editForm.teacherId} onChange={e => setEditForm(p => ({ ...p, teacherId: e.target.value }))} />
              </div>
              <InputField label="New Password" type="password" value={editForm.password} onChange={e => setEditForm(p => ({ ...p, password: e.target.value }))} placeholder="Leave blank to keep current" />
              <div className="flex gap-3 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => { setEditTeacher(null); setEditForm({ name: '', email: '', teacherId: '', password: '' }); }}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Delete Modal ─── */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Teacher?"
        message={deleteTarget ? `Are you sure you want to delete ${deleteTarget.name}? This action cannot be undone.` : ''}
        confirmLabel={deleting ? 'Deleting...' : 'Yes, Delete'}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
        variant="red"
      />

      {/* ─── Add Modal ─── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={() => setShowAddModal(false)}>
          <div className="w-full max-w-md animate-[zoomIn_0.2s_ease-out] rounded-2xl bg-white shadow-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
              <div className="flex items-center gap-2">
                <PlusIcon className="h-5 w-5 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-900">Add New Teacher</h2>
              </div>
              <button onClick={() => setShowAddModal(false)}
                className="rounded-xl p-1.5 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="overflow-y-auto p-6 space-y-4">
              <InputField label="Full Name" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Ram Bahadur" required />
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Email" type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} placeholder="ram@school.com" required />
                <InputField label="Teacher ID" value={formData.teacherId} onChange={e => setFormData(p => ({ ...p, teacherId: e.target.value }))} placeholder="T-101" required />
              </div>
              <InputField label="Password" type="password" value={formData.password} onChange={e => setFormData(p => ({ ...p, password: e.target.value }))} placeholder="Create a password" required />
              <div className="flex gap-3 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50">Cancel</button>
                <button type="submit"
                  className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700">Save Teacher</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Toast ─── */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      <style jsx>{`
        @keyframes zoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
