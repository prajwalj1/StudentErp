'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  PlusIcon, CurrencyDollarIcon, UserIcon, XMarkIcon,
  BanknotesIcon, CheckCircleIcon, ExclamationTriangleIcon,
  MagnifyingGlassIcon, ChartBarIcon, AcademicCapIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { toNepaliDate, toLocalDateStr } from '@/lib/nepaliDate';
import { NepaliDatePicker } from 'react-bs-calender';
import 'react-bs-calender/styles.css';

const defaultCategories = [
  { name: 'Tuition', amount: 0 },
  { name: 'Transport', amount: 0 },
  { name: 'Exam', amount: 0 },
  { name: 'Other', amount: 0 },
];

const defaultTermsTemplate = () => [
  { name: 'First Term', categories: defaultCategories.map(c => ({ ...c })), totalFee: 0 },
  { name: 'Second Term', categories: defaultCategories.map(c => ({ ...c })), totalFee: 0 },
  { name: 'End Term', categories: defaultCategories.map(c => ({ ...c })), totalFee: 0 },
];

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

export default function FeesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [classFees, setClassFees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState('structure');

  const [showPayModal, setShowPayModal] = useState(false);
  const [payStudent, setPayStudent] = useState(null);
  const [payAmount, setPayAmount] = useState('');

  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustStudent, setAdjustStudent] = useState(null);
  const [adjustTotalFee, setAdjustTotalFee] = useState('');
  const [adjustScholarship, setAdjustScholarship] = useState('');
  const [adjustPaidAmount, setAdjustPaidAmount] = useState('');
  const [adjustPreviousDue, setAdjustPreviousDue] = useState('');

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyStudent, setHistoryStudent] = useState(null);
  const [studentPayments, setStudentPayments] = useState([]);

  const [showFeeFormModal, setShowFeeFormModal] = useState(false);
  const [editFeeGrade, setEditFeeGrade] = useState(null);
  const [feeTerms, setFeeTerms] = useState([]);
  const [activeTermIdx, setActiveTermIdx] = useState(0);
  const [savingFee, setSavingFee] = useState(false);
  const [feeFormGrade, setFeeFormGrade] = useState('');
  const [toast, setToast] = useState(null);

  const [filterGrade, setFilterGrade] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmDeletePayment, setConfirmDeletePayment] = useState(null);
  const [historyDate, setHistoryDate] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') fetchData();
  }, [status]);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/fees');
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students);
        setPayments(data.payments);
        setClassFees(data.classFees);
      }
    } catch (e) { console.error(e) } finally { setLoading(false); }
  };

  const showToast = (type, text) => setToast({ type, text });

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!payStudent) return;
    try {
      const res = await fetch('/api/fees', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: payStudent._id, amount: Number(payAmount) }),
      });
      if (res.ok) {
        setShowPayModal(false); setPayStudent(null); setPayAmount('');
        fetchData(); showToast('success', 'Payment recorded successfully!');
      } else {
        const err = await res.json();
        showToast('error', err.error || 'Failed to record payment.');
      }
    } catch (e) { console.error(e) }
  };

  const openHistory = (student) => {
    setHistoryStudent(student);
    setStudentPayments(payments.filter(p => {
      const pid = p.studentId?._id || p.studentId;
      return pid === student._id;
    }));
    setShowHistoryModal(true);
  };

  const openNewFeeForm = () => {
    setEditFeeGrade(null);
    setFeeFormGrade('');
    setFeeTerms(defaultTermsTemplate());
    setActiveTermIdx(0);
    setShowFeeFormModal(true);
  };

  const openEditFeeForm = (raw) => {
    const cf = normalizeFee(raw);
    setEditFeeGrade(cf);
    setFeeFormGrade(cf.grade);
    if (cf.terms && cf.terms.length > 0) {
      setFeeTerms(cf.terms.map(t => ({
        name: t.name,
        categories: (t.categories || []).map(c => ({ name: c.name, amount: c.amount })),
        totalFee: t.totalFee || 0
      })));
    } else {
      setFeeTerms(defaultTermsTemplate());
    }
    setActiveTermIdx(0);
    setShowFeeFormModal(true);
  };

  const handleSaveFee = async (e) => {
    e.preventDefault();
    setSavingFee(true);
    try {
      const terms = feeTerms.map(t => ({
        name: t.name,
        categories: (t.categories || []).filter(c => c.name.trim()),
        totalFee: (t.categories || []).reduce((s, c) => s + (Number(c.amount) || 0), 0)
      }));
      const grandTotal = terms.reduce((s, t) => s + t.totalFee, 0);
      if (grandTotal <= 0) {
        showToast('error', 'Total fee across all terms must be greater than 0.');
        setSavingFee(false); return;
      }
      const method = editFeeGrade ? 'PATCH' : 'POST';
      const res = await fetch('/api/class-fees', {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grade: feeFormGrade, terms }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to save'); }
      setShowFeeFormModal(false); setEditFeeGrade(null); setFeeFormGrade('');
      fetchData();
      showToast('success', editFeeGrade ? 'Fee structure updated!' : 'Fee structure added!');
    } catch {
      showToast('error', 'Failed to save class fee.');
    } finally { setSavingFee(false); }
  };

  const handleDeleteFee = async (grade) => {
    try {
      const res = await fetch(`/api/class-fees?grade=${encodeURIComponent(grade)}`, { method: 'DELETE' });
      if (res.ok) { fetchData(); showToast('success', 'Fee structure deleted!'); }
    } catch (e) { console.error(e) }
    setConfirmDelete(null);
  };

  const handleDeletePayment = async (id) => {
    try {
      const res = await fetch(`/api/fees?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData(); showToast('success', 'Payment deleted successfully!');
      } else {
        const err = await res.json();
        showToast('error', err.error || 'Failed to delete payment.');
      }
    } catch (e) { console.error(e) }
    setConfirmDeletePayment(null);
  };

  const handleAdjustFee = async (e) => {
    e.preventDefault();
    if (!adjustStudent) return;
    try {
      const res = await fetch(`/api/fees?id=${adjustStudent._id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalFee: Number(adjustTotalFee),
          scholarship: Number(adjustScholarship),
          paidAmount: Number(adjustPaidAmount),
          previousDue: Number(adjustPreviousDue),
        }),
      });
      if (res.ok) {
        setShowAdjustModal(false); setAdjustStudent(null);
        fetchData(); showToast('success', 'Fee adjusted successfully!');
      } else {
        const err = await res.json();
        showToast('error', err.error || 'Failed to adjust fee.');
      }
    } catch (e) { console.error(e) }
  };

  const normalizeFee = (cf) => {
    if (!cf) return null;
    if (cf.terms && cf.terms.length > 0) return cf;
    if (cf.categories && cf.categories.length > 0) {
      return { ...cf, terms: [{ name: 'General', categories: cf.categories, totalFee: cf.totalFee || 0 }] };
    }
    return cf;
  };

  const filteredStudents = students.filter(s => {
    const matchesGrade = filterGrade === 'All' || s.grade === filterGrade;
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesGrade && matchesSearch;
  });

  const uniqueGrades = ['All', ...new Set(students.map(s => s.grade))];

  const totalCollected = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const totalDue = students.reduce((s, st) => s + (st.dueAmount || 0), 0);
  const totalFees = students.reduce((s, st) => s + (st.totalFee || 0), 0);
  const totalScholarship = students.reduce((s, st) => s + (st.scholarship || 0), 0);
  const netTotalFees = Math.max(0, totalFees - totalScholarship);
  const collectionRate = netTotalFees > 0 ? Math.round((totalCollected / netTotalFees) * 100) : 0;
  const studentsWithFee = students.filter(s => s.totalFee > 0).length;

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-emerald-600 border-t-transparent" />
    </div>
  );

  const modalOverlay = 'fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto';

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50/80 via-white to-emerald-50/20">
      <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6 lg:p-8">

        {/* ─── Header ─── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 sm:p-6 shadow-xl">
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                <BanknotesIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white">Fees & Payments</h1>
                <p className="text-xs text-slate-400">Manage fee structures and track student payments</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex bg-white/10 backdrop-blur-sm rounded-xl p-0.5">
                <button onClick={() => setTab('structure')}
                  className={`px-4 py-2 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${tab === 'structure' ? 'bg-white text-emerald-600 shadow-sm' : 'text-white/60 hover:text-white'}`}>
                  Fee Structure
                </button>
                <button onClick={() => setTab('overview')}
                  className={`px-4 py-2 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${tab === 'overview' ? 'bg-white text-emerald-600 shadow-sm' : 'text-white/60 hover:text-white'}`}>
                  Overview
                </button>
                <button onClick={() => setTab('history')}
                  className={`px-4 py-2 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${tab === 'history' ? 'bg-white text-emerald-600 shadow-sm' : 'text-white/60 hover:text-white'}`}>
                  History
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Stats Row ─── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <StatBox icon={AcademicCapIcon} label="Students with Fee" value={studentsWithFee} color="blue" />
          <StatBox icon={CheckCircleIcon} label="Total Collected" value={`Rs ${totalCollected.toLocaleString()}`} color="emerald" />
          <StatBox icon={ExclamationTriangleIcon} label="Total Due" value={`Rs ${totalDue.toLocaleString()}`} color="amber" />
          <StatBox icon={ChartBarIcon} label="Total Scholarship" value={`Rs ${totalScholarship.toLocaleString()}`} color="indigo" />
          <StatBox icon={ChartBarIcon} label="Collection Rate" value={`${collectionRate}%`} color="indigo" />
        </div>

        {/* ─── Fee Structure Tab ─── */}
        {tab === 'structure' && (
          <>
            <div className="flex justify-end">
              <button onClick={openNewFeeForm}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-slate-800 hover:scale-[1.02] active:scale-95">
                <PlusIcon className="h-4 w-4" /> Add Fee Structure
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {classFees.length === 0 ? (
                <div className="col-span-full rounded-2xl border border-slate-200 bg-white p-12 text-center">
                  <BanknotesIcon className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="mt-3 text-sm font-bold text-slate-500">No fee structures defined</p>
                  <p className="text-xs text-slate-400 mt-1">Create one to get started.</p>
                </div>
              ) : (
                classFees.map(raw => {
                  const cf = normalizeFee(raw);
                  const grandTotal = (cf.terms || []).reduce((s, t) => s + (t.totalFee || 0), 0);
                  return (
                    <div key={cf._id} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white text-sm font-black shadow-sm">
                            {cf.grade.replace(/\D/g, '')}
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-900">{cf.grade}</h3>
                            <p className="text-[10px] text-slate-400">{cf.terms?.length || 0} term{(cf.terms?.length || 0) !== 1 ? 's' : ''}</p>
                          </div>
                        </div>
                        <span className="text-base font-black text-emerald-600">Rs {grandTotal.toLocaleString()}</span>
                      </div>
                      <div className="space-y-2 mb-4">
                        {(cf.terms || []).slice(0, 3).map((term, ti) => (
                          <div key={ti} className="rounded-xl bg-slate-50 p-3">
                            <div className="flex items-center justify-between mb-1.5">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{term.name}</p>
                              <span className="text-[11px] font-bold text-emerald-600">Rs {term.totalFee?.toLocaleString() || 0}</span>
                            </div>
                            <div className="space-y-1">
                              {(term.categories || []).filter(c => c.name).map((cat, ci) => (
                                <div key={ci} className="flex items-center justify-between text-[11px]">
                                  <span className="text-slate-600">{cat.name}</span>
                                  <span className="font-semibold text-slate-800">Rs {Number(cat.amount || 0).toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2 pt-3 border-t border-slate-100">
                        <button onClick={() => openEditFeeForm(cf)}
                          className="flex-1 rounded-xl bg-emerald-50 py-2 text-[11px] font-bold text-emerald-600 transition-all hover:bg-emerald-100">Edit</button>
                        <button onClick={() => setConfirmDelete(cf.grade)}
                          className="flex-1 rounded-xl bg-red-50 py-2 text-[11px] font-bold text-red-600 transition-all hover:bg-red-100">Delete</button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* ─── Fee Overview Tab ─── */}
        {tab === 'overview' && (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Search students..." value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-slate-700 outline-none transition-all placeholder:text-slate-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" />
              </div>
              <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-600 outline-none transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 cursor-pointer min-w-[140px]">
                {uniqueGrades.map(g => <option key={g} value={g}>{g === 'All' ? 'All Grades' : g}</option>)}
              </select>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="px-5 py-3.5">Student</th>
                      <th className="px-5 py-3.5 text-right">Total Fee</th>
                      <th className="px-5 py-3.5 text-right">Prev Due</th>
                      <th className="px-5 py-3.5 text-right">Scholarship</th>
                      <th className="px-5 py-3.5 text-right">Paid</th>
                      <th className="px-5 py-3.5 text-right">Due</th>
                      <th className="px-5 py-3.5 text-center">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.length === 0 ? (
                      <tr><td colSpan="8" className="px-5 py-8 text-center text-sm text-slate-400">No students found.</td></tr>
                    ) : (
                      filteredStudents.map(s => {
                        const pct = s.totalFee > 0 ? Math.round(((s.paidAmount || 0) / s.totalFee) * 100) : 0;
                        return (
                          <tr key={s._id} className="group transition-colors hover:bg-slate-50/50">
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-xs font-bold text-white shadow-sm">
                                  {s.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-900">{s.name}</p>
                                  <p className="text-[10px] text-slate-400">{s.grade}{s.section ? ` (Sec ${s.section})` : ''}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-right text-sm font-bold text-slate-900">{s.totalFee?.toLocaleString() || 0}</td>
                            <td className="px-5 py-3 text-right text-sm font-bold text-red-400">{(s.previousDue || 0) > 0 ? s.previousDue?.toLocaleString() : '-'}</td>
                            <td className="px-5 py-3 text-right text-sm font-bold text-indigo-600"> {s.scholarship?.toLocaleString() || 0}</td>
                            <td className="px-5 py-3 text-right text-sm font-bold text-emerald-600"> {s.paidAmount?.toLocaleString() || 0}</td>
                            <td className="px-5 py-3 text-right text-sm font-bold text-red-500">{s.dueAmount?.toLocaleString() || 0}</td>
                            <td className="px-5 py-3 text-center">
                              <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold ${
                                s.feeStatus === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                s.feeStatus === 'partial' ? 'bg-amber-100 text-amber-700' :
                                'bg-slate-100 text-slate-500'
                              }`}>
                                {s.feeStatus?.charAt(0).toUpperCase() + s.feeStatus?.slice(1) || 'Pending'}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-right">
                              <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setAdjustStudent(s); setAdjustTotalFee(String(s.totalFee || 0)); setAdjustScholarship(String(s.scholarship || 0)); setAdjustPaidAmount(String(s.paidAmount || 0)); setAdjustPreviousDue(String(s.previousDue || 0)); setShowAdjustModal(true); }}
                                  className="rounded-lg bg-indigo-50 px-3 py-1.5 text-[10px] font-bold text-indigo-600 transition-all hover:bg-indigo-100">Adjust</button>
                                <button onClick={() => { setPayStudent(s); setPayAmount(''); setShowPayModal(true); }}
                                  className="rounded-lg bg-emerald-50 px-3 py-1.5 text-[10px] font-bold text-emerald-600 transition-all hover:bg-emerald-100">Pay</button>
                                <button onClick={() => openHistory(s)}
                                  className="rounded-lg bg-slate-100 px-3 py-1.5 text-[10px] font-bold text-slate-600 transition-all hover:bg-slate-200">History</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ─── Payment History Tab ─── */}
        {tab === 'history' && (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Filter by Date</span>
              <NepaliDatePicker
                value={historyDate ? new Date(historyDate) : null}
                onChange={(d) => { if (d) setHistoryDate(toLocalDateStr(d)); }}
                locale="en" placeholder="Pick a date"
              />
              {historyDate && (
                <button onClick={() => setHistoryDate('')}
                  className="rounded-lg bg-slate-200 px-3 py-1.5 text-[10px] font-bold text-slate-600 transition-all hover:bg-slate-300">
                  Clear
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="px-5 py-3.5">Transaction</th>
                    <th className="px-5 py-3.5">Student</th>
                    <th className="px-5 py-3.5 text-right">Amount</th>
                    <th className="px-5 py-3.5">Date</th>
                    <th className="px-5 py-3.5 text-center">Status</th>
                    <th className="px-5 py-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(() => {
                    const filtered = payments.filter(p => {
                      if (!historyDate) return true;
                      return toLocalDateStr(p.date) === historyDate;
                    });
                    return filtered.length === 0 ? (
                      <tr><td colSpan="6" className="px-5 py-8 text-center text-sm text-slate-400">No transactions found.</td></tr>
                    ) : (
                      filtered.map(p => (
                      <tr key={p._id} className="transition-colors hover:bg-slate-50/50">
                        <td className="px-5 py-3 font-mono text-[11px] text-slate-400">#{p._id.slice(-8).toUpperCase()}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-600">
                              {(p.studentId?.name || 'U').charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{p.studentId?.name || 'Unknown'}</p>
                              <p className="text-[10px] text-slate-400">{p.studentId?.grade}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right text-sm font-bold text-emerald-600">Rs {p.amount?.toLocaleString()}</td>
                        <td className="px-5 py-3 text-sm text-slate-500">{toNepaliDate(p.date)}</td>
                        <td className="px-5 py-3 text-center"><Badge color="emerald">Paid</Badge></td>
                        <td className="px-5 py-3 text-center">
                          <button onClick={() => setConfirmDeletePayment(p._id)}
                            className="rounded-lg bg-red-50 px-2.5 py-1.5 text-[10px] font-bold text-red-500 transition-all hover:bg-red-100">Delete</button>
                        </td>
                      </tr>
                    ))
                  );
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── Fee Structure Form Modal ─── */}
        {showFeeFormModal && (
          <div className={modalOverlay}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl flex flex-col my-0" style={{ maxHeight: '90vh', animationDuration: '0.2s', animationIterationCount: 1, animationName: 'zoomIn' }}>
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0 rounded-t-2xl">
                <h2 className="text-lg font-black text-slate-900">{editFeeGrade ? 'Edit' : 'Add'} Fee Structure</h2>
                <button onClick={() => setShowFeeFormModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-all">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSaveFee} className="flex flex-col flex-1 min-h-0">
                <div className="flex-1 overflow-y-auto min-h-0 p-5 space-y-4">
                  {!editFeeGrade && (
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Grade / Class</label>
                      <select required value={feeFormGrade} onChange={e => setFeeFormGrade(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold outline-none transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100">
                        <option value="">-- Select grade --</option>
                        {['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'].map(g => (
                          <option key={g} value={g} disabled={classFees.some(cf => cf.grade === g)}>{g} {classFees.some(cf => cf.grade === g) ? '(already set)' : ''}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {editFeeGrade && (
                    <p className="text-sm font-bold text-slate-700">{feeFormGrade}</p>
                  )}

                  {/* Term Tabs */}
                  <div className="flex gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto">
                    {feeTerms.map((term, ti) => (
                      <button key={ti} type="button" onClick={() => setActiveTermIdx(ti)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${activeTermIdx === ti ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        {term.name || `Term ${ti + 1}`}
                      </button>
                    ))}
                    <button type="button" onClick={() => {
                      setFeeTerms([...feeTerms, { name: `Term ${feeTerms.length + 1}`, categories: [{ name: '', amount: 0 }], totalFee: 0 }]);
                      setActiveTermIdx(feeTerms.length);
                    }}
                      className="px-2 py-1.5 text-slate-400 hover:text-emerald-600">
                      <PlusIcon className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Active Term Header */}
                  <div className="flex items-center gap-3">
                    <input type="text" value={feeTerms[activeTermIdx]?.name || ''} onChange={e => {
                      const updated = [...feeTerms];
                      updated[activeTermIdx] = { ...updated[activeTermIdx], name: e.target.value };
                      setFeeTerms(updated);
                    }}
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold outline-none transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                      placeholder="Term name" />
                    {feeTerms.length > 1 && (
                      <button type="button" onClick={() => {
                        const updated = feeTerms.filter((_, ti) => ti !== activeTermIdx);
                        setFeeTerms(updated);
                        if (activeTermIdx >= updated.length) setActiveTermIdx(Math.max(0, updated.length - 1));
                      }}
                        className="text-red-400 hover:text-red-600 text-[11px] font-bold">Remove</button>
                    )}
                  </div>

                  {/* Categories */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Categories</p>
                    {(feeTerms[activeTermIdx]?.categories || []).map((cat, ci) => (
                      <div key={ci} className="flex items-center gap-3">
                        <input type="text" value={cat.name} onChange={e => {
                          const updated = [...feeTerms];
                          updated[activeTermIdx].categories[ci].name = e.target.value;
                          setFeeTerms(updated);
                        }}
                          className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                          placeholder="Category name" />
                        <div className="relative w-32 shrink-0">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[11px] font-bold">Rs</span>
                          <input type="number" min="0" value={cat.amount} onChange={e => {
                            const updated = [...feeTerms];
                            updated[activeTermIdx].categories[ci].amount = Number(e.target.value);
                            setFeeTerms(updated);
                          }}
                            className="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-2 text-sm outline-none transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" />
                        </div>
                        {(feeTerms[activeTermIdx]?.categories?.length || 0) > 1 && (
                          <button type="button" onClick={() => {
                            const updated = [...feeTerms];
                            updated[activeTermIdx].categories = updated[activeTermIdx].categories.filter((_, idx) => idx !== ci);
                            setFeeTerms(updated);
                          }}
                            className="text-red-400 hover:text-red-600 p-1 shrink-0">
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={() => {
                      const updated = [...feeTerms];
                      updated[activeTermIdx].categories.push({ name: '', amount: 0 });
                      setFeeTerms(updated);
                    }}
                      className="text-emerald-600 hover:text-emerald-800 text-[11px] font-bold flex items-center gap-1">
                      <PlusIcon className="w-3.5 h-3.5" /> Add category
                    </button>
                  </div>

                  {/* Totals */}
                  <div className="pt-3 border-t border-slate-100 space-y-1">
                    {feeTerms.map((t, ti) => (
                      <div key={ti} className="flex justify-between text-xs">
                        <span className="text-slate-500">{t.name || `Term ${ti + 1}`}</span>
                        <span className="font-bold text-slate-700">Rs {(t.categories || []).reduce((s, c) => s + (Number(c.amount) || 0), 0).toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm font-black border-t border-slate-200 pt-1">
                      <span className="text-slate-800">Grand Total</span>
                      <span className="text-emerald-600">Rs {feeTerms.reduce((s, t) => s + (t.categories || []).reduce((s2, c) => s2 + (Number(c.amount) || 0), 0), 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0 shrink-0">
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setShowFeeFormModal(false)}
                      className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50">Cancel</button>
                    <button type="submit" disabled={savingFee}
                      className="flex-1 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-slate-800 disabled:opacity-50">
                      {savingFee ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ─── Record Payment Modal ─── */}
        {showPayModal && payStudent && (
          <div className={modalOverlay}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden my-8" style={{ animationDuration: '0.2s', animationIterationCount: 1, animationName: 'zoomIn' }}>
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h2 className="text-lg font-black text-slate-900">Record Payment</h2>
                <button onClick={() => { setShowPayModal(false); setPayStudent(null); }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-all">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleRecordPayment} className="p-5 space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-sm font-bold text-white">
                    {payStudent.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{payStudent.name}</p>
                    <p className="text-[10px] text-slate-400">{payStudent.grade}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-center text-sm">
                  <div className="rounded-xl bg-emerald-50 p-3"><p className="text-[10px] font-bold text-slate-400 uppercase">Total Fee</p><p className="font-black text-slate-900">Rs {payStudent.totalFee?.toLocaleString() || 0}</p></div>
                  <div className="rounded-xl bg-red-50 p-3"><p className="text-[10px] font-bold text-slate-400 uppercase">Due</p><p className="font-black text-red-500">Rs {payStudent.dueAmount?.toLocaleString() || 0}</p></div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Amount (NPR)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rs</span>
                    <input type="number" required min="1" value={payAmount} onChange={e => setPayAmount(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 py-2.5 text-sm outline-none transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                      placeholder="Enter amount" />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => { setShowPayModal(false); setPayStudent(null); }}
                    className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50">Cancel</button>
                  <button type="submit"
                    className="flex-1 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-slate-800">Confirm Payment</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ─── Adjust Fee Modal ─── */}
        {showAdjustModal && adjustStudent && (
          <div className={modalOverlay}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden my-8" style={{ animationDuration: '0.2s', animationIterationCount: 1, animationName: 'zoomIn' }}>
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h2 className="text-lg font-black text-slate-900">Adjust Fee — {adjustStudent.name}</h2>
                <button onClick={() => { setShowAdjustModal(false); setAdjustStudent(null); }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-all">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAdjustFee} className="p-5 space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-sm font-bold text-white">
                    {adjustStudent.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{adjustStudent.name}</p>
                    <p className="text-[10px] text-slate-400">{adjustStudent.grade}</p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Total Fee</label>
                    <input type="number" required min="0" value={adjustTotalFee} onChange={e => setAdjustTotalFee(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      placeholder="Total" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Prev Due</label>
                    <input type="number" required min="0" value={adjustPreviousDue} onChange={e => setAdjustPreviousDue(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      placeholder="Prev Due" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Scholarship</label>
                    <input type="number" required min="0" value={adjustScholarship} onChange={e => setAdjustScholarship(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      placeholder="Scholarship" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">Paid Amount</label>
                    <input type="number" required min="0" value={adjustPaidAmount} onChange={e => setAdjustPaidAmount(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      placeholder="Paid" />
                  </div>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Due (Total + Prev Due - Scholarship - Paid)</p>
                  <p className="text-lg font-black text-slate-900">Rs {Math.max(0, (Number(adjustTotalFee) || 0) + (Number(adjustPreviousDue) || 0) - (Number(adjustScholarship) || 0) - (Number(adjustPaidAmount) || 0)).toLocaleString()}</p>
                </div>
                <div className="flex items-center justify-between pt-2 gap-3">
                  <button type="button" onClick={() => { setAdjustTotalFee('0'); setAdjustPreviousDue('0'); setAdjustScholarship('0'); setAdjustPaidAmount('0'); }}
                    className="rounded-lg border border-red-200 px-3 py-2 text-[10px] font-bold text-red-500 transition-all hover:bg-red-50">Reset to Zero</button>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => { setShowAdjustModal(false); setAdjustStudent(null); }}
                      className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50">Cancel</button>
                    <button type="submit"
                      className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-indigo-700">Save</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ─── Payment History Modal ─── */}
        {showHistoryModal && historyStudent && (
          <div className={modalOverlay}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden my-8" style={{ animationDuration: '0.2s', animationIterationCount: 1, animationName: 'zoomIn' }}>
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h2 className="text-lg font-black text-slate-900">Payment History — {historyStudent.name}</h2>
                <button onClick={() => { setShowHistoryModal(false); setHistoryStudent(null); }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-all">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 max-h-80 overflow-y-auto space-y-4">
                <div className="grid grid-cols-4 gap-3 text-center text-sm">
                  <div className="rounded-xl bg-emerald-50 p-3"><p className="text-[10px] font-bold text-slate-400 uppercase">Current Fee</p><p className="font-black text-slate-900">Rs {historyStudent.totalFee?.toLocaleString() || 0}</p></div>
                  <div className="rounded-xl bg-red-50 p-3"><p className="text-[10px] font-bold text-slate-400 uppercase">Prev Due</p><p className="font-black text-red-500">Rs {(historyStudent.previousDue || 0).toLocaleString()}</p></div>
                  <div className="rounded-xl bg-emerald-50 p-3"><p className="text-[10px] font-bold text-slate-400 uppercase">Paid</p><p className="font-black text-emerald-600">Rs {historyStudent.paidAmount?.toLocaleString() || 0}</p></div>
                  <div className="rounded-xl bg-amber-50 p-3"><p className="text-[10px] font-bold text-slate-400 uppercase">Total Due</p><p className="font-black text-amber-600">Rs {historyStudent.dueAmount?.toLocaleString() || 0}</p></div>
                </div>
                {studentPayments.length === 0 ? (
                  <p className="text-center text-sm text-slate-400 py-4">No payments recorded.</p>
                ) : (
                  <div className="space-y-2">
                    {studentPayments.map(p => (
                      <div key={p._id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                        <div>
                          <p className="text-sm font-bold text-slate-900">Rs {p.amount?.toLocaleString()}</p>
                          <p className="text-[10px] text-slate-400">{toNepaliDate(p.date)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge color="emerald">Paid</Badge>
                          <button onClick={() => setConfirmDeletePayment(p._id)}
                            className="rounded-lg bg-red-50 px-2 py-1 text-[10px] font-bold text-red-500 transition-all hover:bg-red-100">Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── Confirm Delete Fee Structure Modal ─── */}
        <ConfirmModal
          open={!!confirmDelete}
          title="Delete Fee Structure?"
          message={`This will reset all student fees in ${confirmDelete}.`}
          onConfirm={() => handleDeleteFee(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />

        {/* ─── Confirm Delete Payment Modal ─── */}
        <ConfirmModal
          open={!!confirmDeletePayment}
          title="Delete Payment?"
          message="This payment will be permanently removed and the student's fee balance will be recalculated."
          onConfirm={() => handleDeletePayment(confirmDeletePayment)}
          onCancel={() => setConfirmDeletePayment(null)}
        />
      </div>

      <Toast toast={toast} onClose={() => setToast(null)} />

      <style jsx>{`
        @keyframes zoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
