'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  PlusIcon, UserIcon, AcademicCapIcon, XMarkIcon,
  MagnifyingGlassIcon, FunnelIcon, ChevronDownIcon,
  BuildingLibraryIcon, PhoneIcon, EnvelopeIcon,
  CalendarDaysIcon, MapPinIcon, IdentificationIcon,
  CheckCircleIcon, ExclamationTriangleIcon,
  ArrowUpTrayIcon, TrashIcon, PencilSquareIcon,
  EyeIcon, EyeSlashIcon, ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { NepaliDatePicker } from 'react-bs-calender';
import 'react-bs-calender/styles.css';

const GRADES = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

const INIT_FORM = { name: '', studentId: '', email: '', password: '', grade: 'Grade 10', section: 'A', fatherName: '', fatherMobile: '', dob: '', address: '', attendance: 100 };

function Avatar({ name, size = 'md' }) {
  const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-xl' };
  return (
    <div className={`${sizes[size]} rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-sm shrink-0`}>
      {name?.charAt(0)?.toUpperCase() || '?'}
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

function StatBox({ icon: Icon, label, value, color }) {
  const colors = { blue: 'from-blue-500 to-blue-600', emerald: 'from-emerald-500 to-emerald-600', amber: 'from-amber-500 to-amber-600', indigo: 'from-indigo-500 to-indigo-600' };
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

function InputField({ label, type = 'text', value, onChange, placeholder, required, className }) {
  const [showPw, setShowPw] = useState(false);
  const isPw = type === 'password';
  return (
    <div className={className}>
      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
      <div className="relative">
        {type === 'select' ? (
          <select value={value} onChange={onChange} required={required}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 cursor-pointer">
            {placeholder && <option value="">{placeholder}</option>}
            {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        ) : (
          <>
            <input type={isPw ? (showPw ? 'text' : 'password') : type} value={value} onChange={onChange} required={required} placeholder={placeholder}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all placeholder:text-slate-300 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 pr-11" />
            {isPw && (
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition-all hover:bg-slate-200 hover:text-slate-600">
                {showPw ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ConfirmModal({ open, title, message, confirmLabel, onConfirm, onCancel, loading, variant = 'red' }) {
  if (!open) return null;
  const colors = { red: { bg: 'bg-red-600 hover:bg-red-700', icon: 'text-red-600', ring: 'ring-red-200' }, emerald: { bg: 'bg-emerald-600 hover:bg-emerald-700', icon: 'text-emerald-600', ring: 'ring-emerald-200' } };
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

function downloadGradeCSV(grade, students) {
  const rows = students.map((s, i) => [
    i + 1,
    s.name,
    s.email,
    s.studentId,
    s.grade,
    s.section || '—',
    '********',
  ]);
  const csv = [
    ['S.N.', 'Name', 'Email', 'Student ID', 'Grade', 'Section', 'Password'],
    ...rows,
  ].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${grade.replace(/\s+/g, '_')}_students.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function StudentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ ...INIT_FORM });
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
  const [showPromoteModal, setShowPromoteModal] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') fetchStudents();
  }, [status]);

  const showToast = (type, text) => { setToast({ type, text }); };

  const fetchStudents = async () => {
    try {
      setFetchError(false);
      const [studentsRes, attRes] = await Promise.all([
        fetch('/api/students'),
        fetch('/api/attendance'),
      ]);
      if (!studentsRes.ok) { setFetchError(true); return; }
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
        attendance: attMap[s._id] ? Math.round((attMap[s._id].present / attMap[s._id].total) * 100) : null,
      })));
    } catch {
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
      if (res.ok) { setDeleteTarget(null); fetchStudents(); showToast('success', 'Student deleted successfully.'); }
      else { const err = await res.json(); showToast('error', err.error || 'Failed to delete.'); }
    } catch { showToast('error', 'Network error.'); }
    finally { setDeleting(false); }
  };

  const openEditMode = (student) => {
    setEditForm({
      name: student.name || '', studentId: student.studentId || '', email: student.email || '',
      password: '', grade: student.grade || '', section: student.section || '',
      fatherName: student.fatherName || '', fatherMobile: student.fatherMobile || '',
      dob: student.dob || '', address: student.address || '',
    });
    setEditMode(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const payload = { ...editForm };
      if (!payload.password?.trim()) delete payload.password;
      const res = await fetch(`/api/students/${detailStudent._id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      if (res.ok) { setEditMode(false); setDetailStudent(null); fetchStudents(); showToast('success', 'Student updated.'); }
      else { const err = await res.json(); showToast('error', err.error || 'Update failed.'); }
    } catch { showToast('error', 'Network error.'); }
    finally { setUpdating(false); }
  };

  const filteredStudents = useMemo(() => students.filter(s =>
    (filterGrade === 'All' || s.grade === filterGrade) &&
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  ), [students, filterGrade, searchTerm]);

  const uniqueGrades = useMemo(() => ['All', ...new Set(students.map(s => s.grade))], [students]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/students', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowAddModal(false); setFormData({ ...INIT_FORM }); fetchStudents();
        showToast('success', 'Student added successfully!');
      } else {
        const err = await res.json();
        showToast('error', err.error || 'Failed to add student.');
      }
    } catch { showToast('error', 'Network error.'); }
  };

  const handlePromote = async () => {
    setPromoting(true);
    try {
      const res = await fetch('/api/students/promote', { method: 'PATCH' });
      const data = await res.json();
      showToast(res.ok ? 'success' : 'error', data.message || data.error || 'Promotion done.');
      if (res.ok) fetchStudents();
    } catch { showToast('error', 'Network error.'); }
    finally { setPromoting(false); }
  };

  const grouped = useMemo(() => {
    const g = {};
    filteredStudents.forEach(s => {
      const key = s.grade || 'Ungraded';
      if (!g[key]) g[key] = [];
      g[key].push(s);
    });
    return g;
  }, [filteredStudents]);

  const gradesList = useMemo(() => Object.keys(grouped).sort(), [grouped]);
  const totalStudents = students.length;

  const renderStudentForm = (fields, onSubmit, submitLabel, loading) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <InputField label="Full Name" value={fields.name} onChange={e => fields.onChange?.('name', e.target.value) || null}
        placeholder="e.g. Aarav Sharma" required />
      <div className="grid grid-cols-2 gap-4">
        <InputField label="Student ID" value={fields.studentId} placeholder="e.g. STU001" required />
        <InputField label="Email" type="email" value={fields.email} placeholder="e.g. aarav@school.com" required />
      </div>
      {fields.password !== undefined && (
        <InputField label={fields.passwordLabel || 'Password'} type="password" value={fields.password}
          placeholder={fields.passwordPlaceholder || 'Set login password'} required={fields.passwordRequired} />
      )}
      <div className="grid grid-cols-2 gap-4">
        <InputField label="Grade" type="select" value={fields.grade} />
        <InputField label="Section" value={fields.section} placeholder="e.g. A, B" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <InputField label="Father's Name" value={fields.fatherName} placeholder="e.g. Ram Sharma" />
        <InputField label="Father's Mobile" value={fields.fatherMobile} placeholder="e.g. 98XXXXXXXX" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Date of Birth (Nepali)</label>
          <NepaliDatePicker
            value={fields.dob ? fields.dob.replace(/-/g, '/') : ''}
            onChange={(date, nepaliDateString) => fields.onChange?.('dob', nepaliDateString || '')}
            locale="en" placeholder="YYYY/MM/DD"
          />
        </div>
        <InputField label="Address" value={fields.address} placeholder="e.g. Kathmandu, Nepal" />
      </div>
      <div className="flex gap-3 border-t border-slate-100 pt-4">
        <button type="button" onClick={fields.onCancel}
          className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50">Cancel</button>
        <button type="submit" disabled={loading}
          className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 disabled:opacity-50">
          {loading ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-blue-600 border-t-transparent" />
    </div>
  );

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50/80 via-white to-blue-50/20">
      <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6 lg:p-8">

        {/* ─── Header ─── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 sm:p-6 shadow-xl">
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                <UserIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white">Students</h1>
                <p className="text-xs text-slate-400">{totalStudents} enrolled students across {uniqueGrades.length - 1} grades</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setShowPromoteModal(true)}
                disabled={promoting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white backdrop-blur-sm transition-all hover:bg-white/20 disabled:opacity-50">
                <ArrowUpTrayIcon className="h-4 w-4" />
                {promoting ? 'Promoting...' : 'Promote All'}
              </button>
              <button onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-blue-900/30 transition-all hover:bg-blue-700">
                <PlusIcon className="h-4 w-4" />
                Add Student
              </button>
            </div>
          </div>
        </div>

        {/* ─── Stats Row ─── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatBox icon={UserIcon} label="Total Students" value={totalStudents} color="blue" />
          <StatBox icon={BuildingLibraryIcon} label="Grades" value={uniqueGrades.length - 1} color="indigo" />
          <StatBox icon={CheckCircleIcon} label="Avg Attendance" value={students.length > 0 ? `${Math.round(students.reduce((a, s) => a + (s.attendance || 0), 0) / students.length)}%` : 'N/A'} color="emerald" />
          <StatBox icon={FunnelIcon} label="Filtered" value={`${filteredStudents.length}`} color="amber" />
        </div>

        {/* ─── Search & Filter ─── */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search students by name..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-slate-700 outline-none transition-all placeholder:text-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
          </div>
          <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-600 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100 cursor-pointer">
            {uniqueGrades.map(g => <option key={g} value={g}>{g === 'All' ? 'All Grades' : g}</option>)}
          </select>
          {searchTerm && <button onClick={() => setSearchTerm('')}
            className="rounded-xl bg-slate-100 px-3.5 py-2.5 text-xs font-bold text-slate-500 transition-all hover:bg-slate-200">Clear</button>}
        </div>

        {/* ─── Student List ─── */}
        <div className="space-y-4">
          {fetchError ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <ExclamationTriangleIcon className="mx-auto h-10 w-10 text-red-400" />
              <p className="mt-3 text-sm font-bold text-slate-700">Failed to load students</p>
              <button onClick={() => { setLoading(true); fetchStudents(); }}
                className="mt-3 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white transition-all hover:bg-blue-700">Retry</button>
            </div>
          ) : gradesList.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <UserIcon className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm font-bold text-slate-500">No students found</p>
              <p className="text-xs text-slate-400 mt-1">{searchTerm || filterGrade !== 'All' ? 'Try adjusting your filters.' : 'Click "Add Student" to get started.'}</p>
            </div>
          ) : gradesList.map(grade => (
            <div key={grade} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between bg-gradient-to-r from-slate-50 to-white px-5 py-3.5 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white shadow-sm">
                    {grade.replace('Grade ', '')}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{grade}</h3>
                  <Badge color="blue">{grouped[grade].length} student{grouped[grade].length !== 1 ? 's' : ''}</Badge>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-[10px] text-slate-400">
                  <span>Avg: {Math.round(grouped[grade].reduce((a, s) => a + (s.attendance || 0), 0) / grouped[grade].length)}%</span>
                  <button onClick={() => downloadGradeCSV(grade, grouped[grade])}
                    className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-[10px] font-bold text-slate-500 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-blue-50 hover:text-blue-600 hover:ring-blue-200"
                    title="Download CSV">
                    <ArrowDownTrayIcon className="h-3 w-3" />
                    CSV
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="px-5 py-3 w-14 text-center">#</th>
                      <th className="px-5 py-3">Student</th>
                      <th className="px-5 py-3 hidden sm:table-cell">Section</th>
                      <th className="px-5 py-3 hidden md:table-cell">ID</th>
                      <th className="px-5 py-3">Attendance</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {grouped[grade].map((student, idx) => (
                      <tr key={student._id} className="group transition-colors hover:bg-slate-50/50">
                        <td className="px-5 py-3.5 text-center text-sm font-bold text-slate-300">
                          {student.rollNumber || idx + 1}
                        </td>
                        <td className="px-5 py-3.5">
                          <button onClick={() => setDetailStudent(student)} className="flex items-center gap-3 text-left">
                            <Avatar name={student.name} size="sm" />
                            <div>
                              <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{student.name}</p>
                              <p className="text-[10px] text-slate-400 sm:hidden">{student.section || '—'} · {student.studentId || '—'}</p>
                            </div>
                          </button>
                        </td>
                        <td className="px-5 py-3.5 hidden sm:table-cell">
                          <span className="text-sm font-medium text-slate-600">{student.section || '—'}</span>
                        </td>
                        <td className="px-5 py-3.5 hidden md:table-cell">
                          <span className="text-xs font-mono font-medium text-slate-400">{student.studentId || '—'}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          {student.attendance !== null ? (
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                <div className={`h-full rounded-full ${student.attendance >= 75 ? 'bg-emerald-500' : 'bg-red-500'}`}
                                  style={{ width: `${student.attendance}%` }} />
                              </div>
                              <span className={`text-xs font-bold ${student.attendance >= 75 ? 'text-emerald-600' : 'text-red-500'}`}>
                                {student.attendance}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setDetailStudent(student); }}
                              className="rounded-lg p-1.5 text-slate-400 transition-all hover:bg-blue-50 hover:text-blue-600" title="View Details">
                              <IdentificationIcon className="h-4 w-4" />
                            </button>
                            <button onClick={() => { setDetailStudent(student); openEditMode(student); }}
                              className="rounded-lg p-1.5 text-slate-400 transition-all hover:bg-amber-50 hover:text-amber-600" title="Edit">
                              <PencilSquareIcon className="h-4 w-4" />
                            </button>
                            <button onClick={() => setDeleteTarget(student._id)}
                              className="rounded-lg p-1.5 text-slate-400 transition-all hover:bg-red-50 hover:text-red-500" title="Delete">
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                          <button onClick={() => setDetailStudent(student)}
                            className="sm:hidden text-xs font-bold text-blue-600">View</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Detail / Edit Modal ─── */}
      {detailStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={() => { setDetailStudent(null); setEditMode(false); }}>
          <div className="w-full max-w-lg animate-[zoomIn_0.2s_ease-out] rounded-2xl bg-white shadow-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
              <div className="flex items-center gap-2">
                <AcademicCapIcon className="h-5 w-5 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">{editMode ? 'Edit Student' : 'Student Details'}</h2>
              </div>
              <button onClick={() => { setDetailStudent(null); setEditMode(false); }}
                className="rounded-xl p-1.5 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-6">
              {editMode ? (
                (() => {
                  const editFields = {
                    ...editForm, onChange: (key, val) => setEditForm(p => ({ ...p, [key]: val })),
                    passwordLabel: 'New Password', passwordPlaceholder: 'Leave blank to keep current', passwordRequired: false,
                    onCancel: () => setEditMode(false),
                  };
                  // Override onChanges for each input
                  return (
                    <form onSubmit={handleEditSubmit} className="space-y-4">
                      <InputField label="Full Name" value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} required />
                      <div className="grid grid-cols-2 gap-4">
                        <InputField label="Student ID" value={editForm.studentId} onChange={e => setEditForm(p => ({ ...p, studentId: e.target.value }))} required />
                        <InputField label="Email" type="email" value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} required />
                      </div>
                      <InputField label="New Password" type="password" value={editForm.password} onChange={e => setEditForm(p => ({ ...p, password: e.target.value }))} placeholder="Leave blank to keep current" />
                      <div className="grid grid-cols-2 gap-4">
                        <InputField label="Grade" type="select" value={editForm.grade} onChange={e => setEditForm(p => ({ ...p, grade: e.target.value }))} />
                        <InputField label="Section" value={editForm.section} onChange={e => setEditForm(p => ({ ...p, section: e.target.value }))} placeholder="e.g. A, B" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <InputField label="Father's Name" value={editForm.fatherName} onChange={e => setEditForm(p => ({ ...p, fatherName: e.target.value }))} />
                        <InputField label="Father's Mobile" value={editForm.fatherMobile} onChange={e => setEditForm(p => ({ ...p, fatherMobile: e.target.value }))} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Date of Birth (Nepali)</label>
                          <NepaliDatePicker
                            value={editForm.dob ? editForm.dob.replace(/-/g, '/') : ''}
                            onChange={(date, s) => setEditForm(p => ({ ...p, dob: s || '' }))}
                            locale="en" placeholder="YYYY/MM/DD" />
                        </div>
                        <InputField label="Address" value={editForm.address} onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))} />
                      </div>
                      <div className="flex gap-3 border-t border-slate-100 pt-4">
                        <button type="button" onClick={() => setEditMode(false)}
                          className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50">Cancel</button>
                        <button type="submit" disabled={updating}
                          className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 disabled:opacity-50">
                          {updating ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </form>
                  );
                })()
              ) : (
                <div className="space-y-5">
                  <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                    <Avatar name={detailStudent.name} size="lg" />
                    <div>
                      <p className="text-lg font-bold text-slate-900">{detailStudent.name}</p>
                      <p className="text-xs text-slate-400">Roll: {detailStudent.rollNumber || '—'} · {detailStudent.grade}{detailStudent.section ? ` ${detailStudent.section}` : ''}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {[
                      { icon: IdentificationIcon, label: 'Student ID', value: detailStudent.studentId },
                      { icon: EnvelopeIcon, label: 'Email', value: detailStudent.email },
                      { icon: BuildingLibraryIcon, label: 'Grade', value: detailStudent.grade },
                      { icon: AcademicCapIcon, label: 'Section', value: detailStudent.section || 'N/A' },
                      { icon: UserIcon, label: "Father's Name", value: detailStudent.fatherName || 'N/A' },
                      { icon: PhoneIcon, label: "Father's Mobile", value: detailStudent.fatherMobile || 'N/A' },
                      { icon: CalendarDaysIcon, label: 'DOB (Nepali)', value: detailStudent.dob || 'N/A' },
                      { icon: MapPinIcon, label: 'Address', value: detailStudent.address || 'N/A' },
                      { icon: CheckCircleIcon, label: 'Attendance', value: detailStudent.attendance !== null ? `${detailStudent.attendance}%` : 'N/A', color: detailStudent.attendance >= 75 ? 'text-emerald-600' : 'text-red-500' },
                      { icon: IdentificationIcon, label: 'Fee Status', value: detailStudent.feeStatus || 'N/A' },
                    ].map((item, i) => (
                      <div key={i} className="rounded-xl bg-slate-50 p-3">
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          <item.icon className="h-3.5 w-3.5" />
                          {item.label}
                        </div>
                        <p className={`mt-0.5 text-sm font-bold text-slate-900 ${item.color || ''}`}>{item.value || '—'}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => openEditMode(detailStudent)}
                      className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700">
                      Edit Student
                    </button>
                    <button onClick={() => { setDetailStudent(null); setEditMode(false); }}
                      className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50">
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Promote Modal ─── */}
      <ConfirmModal
        open={showPromoteModal}
        title="Promote All Students?"
        message="All students will be moved to the next grade. Grade 12 students will be marked as graduated (login disabled). This action cannot be undone."
        confirmLabel={promoting ? 'Promoting...' : 'Yes, Promote All'}
        onConfirm={() => { setShowPromoteModal(false); handlePromote(); }}
        onCancel={() => setShowPromoteModal(false)}
        loading={promoting}
        variant="emerald"
      />

      {/* ─── Delete Modal ─── */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Student?"
        message="This action cannot be undone. The student's account will be permanently removed."
        confirmLabel={deleting ? 'Deleting...' : 'Yes, Delete'}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
        variant="red"
      />

      {/* ─── Add Modal ─── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={() => setShowAddModal(false)}>
          <div className="w-full max-w-lg animate-[zoomIn_0.2s_ease-out] rounded-2xl bg-white shadow-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
              <div className="flex items-center gap-2">
                <AcademicCapIcon className="h-5 w-5 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">Add New Student</h2>
              </div>
              <button onClick={() => setShowAddModal(false)}
                className="rounded-xl p-1.5 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <InputField label="Full Name" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Aarav Sharma" required />
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Student ID" value={formData.studentId} onChange={e => setFormData(p => ({ ...p, studentId: e.target.value }))} placeholder="e.g. STU001" required />
                  <InputField label="Email" type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} placeholder="e.g. aarav@school.com" required />
                </div>
                <InputField label="Password" type="password" value={formData.password} onChange={e => setFormData(p => ({ ...p, password: e.target.value }))} placeholder="Set login password" required />
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Grade" type="select" value={formData.grade} onChange={e => setFormData(p => ({ ...p, grade: e.target.value }))} />
                  <InputField label="Section" value={formData.section} onChange={e => setFormData(p => ({ ...p, section: e.target.value }))} placeholder="e.g. A, B" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Father's Name" value={formData.fatherName} onChange={e => setFormData(p => ({ ...p, fatherName: e.target.value }))} placeholder="e.g. Ram Sharma" />
                  <InputField label="Father's Mobile" value={formData.fatherMobile} onChange={e => setFormData(p => ({ ...p, fatherMobile: e.target.value }))} placeholder="e.g. 98XXXXXXXX" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Date of Birth (Nepali)</label>
                    <NepaliDatePicker
                      value={formData.dob ? formData.dob.replace(/-/g, '/') : ''}
                      onChange={(date, s) => setFormData(p => ({ ...p, dob: s || '' }))}
                      locale="en" placeholder="YYYY/MM/DD" />
                  </div>
                  <InputField label="Address" value={formData.address} onChange={e => setFormData(p => ({ ...p, address: e.target.value }))} placeholder="e.g. Kathmandu, Nepal" />
                </div>
                <div className="flex gap-3 border-t border-slate-100 pt-4">
                  <button type="button" onClick={() => setShowAddModal(false)}
                    className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50">Cancel</button>
                  <button type="submit"
                    className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700">Save Student</button>
                </div>
              </form>
            </div>
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
