'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  PlusIcon, XMarkIcon, BookOpenIcon, ClockIcon,
  MapPinIcon, UserIcon, TrashIcon, AcademicCapIcon,
  BuildingLibraryIcon, MagnifyingGlassIcon,
  ExclamationTriangleIcon, CheckCircleIcon,
} from '@heroicons/react/24/outline';

const GRADES = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

function Badge({ children, color = 'slate' }) {
  const colors = {
    slate: 'bg-slate-100 text-slate-600', emerald: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700', red: 'bg-red-100 text-red-700',
    indigo: 'bg-indigo-100 text-indigo-700', purple: 'bg-purple-100 text-purple-700',
    blue: 'bg-blue-100 text-blue-700',
  };
  return <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${colors[color]}`}>{children}</span>;
}

function StatBox({ icon: Icon, label, value, color }) {
  const colors = { indigo: 'from-indigo-500 to-purple-600', emerald: 'from-emerald-500 to-emerald-600', amber: 'from-amber-500 to-amber-600', blue: 'from-blue-500 to-blue-600', purple: 'from-purple-500 to-pink-500' };
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

const INIT_FORM = { subject: '', grade: 'Grade 10', section: 'A', time: '10:00 AM - 11:00 AM', room: 'Room 101', teacherId: '' };

export default function OwnerClassesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);
  const [selectedGrade, setSelectedGrade] = useState('All');
  const [formData, setFormData] = useState({ ...INIT_FORM });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') fetchData();
  }, [status]);

  const showToast = (type, text) => { setToast({ type, text }); };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [classesRes, teachersRes] = await Promise.all([
        fetch('/api/classes'),
        fetch('/api/teachers'),
      ]);
      if (classesRes.ok && teachersRes.ok) {
        const classesData = await classesRes.json();
        const teachersData = await teachersRes.json();
        setClasses(classesData);
        setTeachers(teachersData);
        if (teachersData.length > 0 && !formData.teacherId) {
          setFormData(prev => ({ ...prev, teacherId: teachersData[0]._id }));
        }
      }
    } catch (e) { console.error(e) } finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/classes/${deleteTarget}`, { method: 'DELETE' });
      if (res.ok) { setDeleteTarget(null); fetchData(); showToast('success', 'Class schedule deleted.'); }
      else { const err = await res.json(); showToast('error', err.error || 'Delete failed.'); }
    } catch { showToast('error', 'Network error.'); }
    finally { setDeleting(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.teacherId) { showToast('error', 'Please select a teacher.'); return; }
    try {
      const res = await fetch('/api/classes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowAddModal(false);
        setFormData({ ...INIT_FORM, teacherId: teachers.length > 0 ? teachers[0]._id : '' });
        fetchData();
        showToast('success', 'Class schedule added!');
      } else { const err = await res.json(); showToast('error', err.error || 'Failed to add class.'); }
    } catch { showToast('error', 'Network error.'); }
  };

  const filteredClasses = useMemo(() => classes.filter(cls => {
    const q = searchTerm.toLowerCase();
    return (cls.subject.toLowerCase().includes(q) ||
            (cls.teacherId?.name || '').toLowerCase().includes(q) ||
            (cls.room || '').toLowerCase().includes(q)) &&
           (selectedGrade === 'All' || cls.grade === selectedGrade);
  }), [classes, searchTerm, selectedGrade]);

  const uniqueGrades = useMemo(() => ['All', ...new Set(classes.map(c => c.grade))], [classes]);
  const activeTeachersCount = new Set(classes.map(c => c.teacherId?._id).filter(Boolean)).size;
  const activeGradesCount = new Set(classes.map(c => c.grade)).size;

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
                <BookOpenIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white">Class Schedules</h1>
                <p className="text-xs text-slate-400">{classes.length} classes across {activeGradesCount} grades</p>
              </div>
            </div>
            <button onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-900/30 transition-all hover:bg-indigo-700">
              <PlusIcon className="h-4 w-4" />
              Add Class
            </button>
          </div>
        </div>

        {/* ─── Stats Row ─── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatBox icon={BookOpenIcon} label="Total Classes" value={classes.length} color="indigo" />
          <StatBox icon={BuildingLibraryIcon} label="Active Grades" value={activeGradesCount} color="purple" />
          <StatBox icon={UserIcon} label="Assigned Teachers" value={activeTeachersCount} color="blue" />
          <StatBox icon={AcademicCapIcon} label="Filtered" value={`${filteredClasses.length}`} color="amber" />
        </div>

        {/* ─── Search & Filter ─── */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by subject, teacher, or room..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-slate-700 outline-none transition-all placeholder:text-slate-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
          </div>
          <select value={selectedGrade} onChange={e => setSelectedGrade(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-600 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 cursor-pointer">
            {uniqueGrades.map(g => <option key={g} value={g}>{g === 'All' ? 'All Grades' : g}</option>)}
          </select>
          {searchTerm && <button onClick={() => setSearchTerm('')}
            className="rounded-xl bg-slate-100 px-3.5 py-2.5 text-xs font-bold text-slate-500 transition-all hover:bg-slate-200">Clear</button>}
        </div>

        {/* ─── Classes Grid ─── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredClasses.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <BookOpenIcon className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm font-bold text-slate-500">No class schedules found</p>
              <p className="text-xs text-slate-400 mt-1">{searchTerm || selectedGrade !== 'All' ? 'Try adjusting your filters.' : 'Click "Add Class" to get started.'}</p>
            </div>
          ) : filteredClasses.map((cls) => (
            <div key={cls._id} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-lg font-bold text-white shadow-sm">
                      {cls.subject.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{cls.subject}</h3>
                      <Badge color="indigo">{cls.grade}{cls.section ? ` • ${cls.section}` : ''}</Badge>
                    </div>
                  </div>
                  <button onClick={() => setDeleteTarget(cls._id)}
                    className="rounded-lg p-1.5 text-slate-300 transition-all hover:bg-red-50 hover:text-red-500 opacity-0 group-hover:opacity-100" title="Delete">
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>

                <div className="my-4 space-y-2.5 border-y border-slate-50 py-3.5 text-xs">
                  <div className="flex items-center gap-2.5 text-slate-600">
                    <ClockIcon className="h-4 w-4 text-indigo-400 shrink-0" />
                    <span className="font-medium">{cls.time}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-600">
                    <MapPinIcon className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span className="font-medium">{cls.room || 'Unassigned Room'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 rounded-xl bg-slate-50 p-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white shadow-sm shrink-0">
                    {cls.teacherId?.name ? cls.teacherId.name.charAt(0) : '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Teacher</p>
                    <p className="text-xs font-bold text-slate-800 truncate">{cls.teacherId?.name || 'No Teacher Assigned'}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Delete Modal ─── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={() => setDeleteTarget(null)}>
          <div className="w-full max-w-sm animate-[zoomIn_0.2s_ease-out] rounded-2xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Delete Schedule?</h3>
              <p className="mt-1 text-sm text-slate-500">This class schedule will be permanently removed.</p>
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setDeleteTarget(null)} disabled={deleting}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-50">Cancel</button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:bg-red-700 disabled:opacity-50">
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Add Modal ─── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={() => setShowAddModal(false)}>
          <div className="w-full max-w-lg animate-[zoomIn_0.2s_ease-out] rounded-2xl bg-white shadow-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
              <div className="flex items-center gap-2">
                <BookOpenIcon className="h-5 w-5 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-900">Add Class Schedule</h2>
              </div>
              <button onClick={() => setShowAddModal(false)}
                className="rounded-xl p-1.5 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Subject <span className="text-red-400">*</span></label>
                  <input type="text" required value={formData.subject} onChange={e => setFormData(p => ({ ...p, subject: e.target.value }))}
                    placeholder="e.g. Mathematics"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all placeholder:text-slate-300 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Grade <span className="text-red-400">*</span></label>
                  <select required value={formData.grade} onChange={e => setFormData(p => ({ ...p, grade: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 cursor-pointer">
                    {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Section</label>
                  <input type="text" value={formData.section} onChange={e => setFormData(p => ({ ...p, section: e.target.value }))}
                    placeholder="e.g. A, B"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all placeholder:text-slate-300 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Room</label>
                  <input type="text" value={formData.room} onChange={e => setFormData(p => ({ ...p, room: e.target.value }))}
                    placeholder="e.g. Room 101"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all placeholder:text-slate-300 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Time Slot <span className="text-red-400">*</span></label>
                <input type="text" required value={formData.time} onChange={e => setFormData(p => ({ ...p, time: e.target.value }))}
                  placeholder="e.g. 10:00 AM - 11:00 AM"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all placeholder:text-slate-300 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Assign Teacher <span className="text-red-400">*</span></label>
                {teachers.length === 0 ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
                    No teachers available. Add one from the Teachers portal first.
                  </div>
                ) : (
                  <select required value={formData.teacherId} onChange={e => setFormData(p => ({ ...p, teacherId: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 cursor-pointer">
                    {teachers.map(t => <option key={t._id} value={t._id}>{t.name} ({t.teacherId || t.email})</option>)}
                  </select>
                )}
              </div>

              <div className="flex gap-3 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={teachers.length === 0}
                  className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 disabled:opacity-50">Save Schedule</button>
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
