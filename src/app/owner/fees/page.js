'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { PlusIcon, CurrencyDollarIcon, UserIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { toNepaliDate } from '@/lib/nepaliDate';

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

export default function FeesPage() {
  const { data: session, status } = useSession();
  const [students, setStudents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [classFees, setClassFees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState('structure');

  const [showPayModal, setShowPayModal] = useState(false);
  const [payStudent, setPayStudent] = useState(null);
  const [payAmount, setPayAmount] = useState('');

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

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData();
    }
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
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!payStudent) return;
    try {
      const res = await fetch('/api/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: payStudent._id, amount: Number(payAmount) }),
      });
      if (res.ok) {
        setShowPayModal(false);
        setPayStudent(null);
        setPayAmount('');
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error);
      }
    } catch (error) {
      console.error("Error recording payment:", error);
    }
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
        alert('Total fee across all terms must be greater than 0.');
        setSavingFee(false);
        return;
      }

      const method = editFeeGrade ? 'PATCH' : 'POST';
      const res = await fetch('/api/class-fees', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grade: feeFormGrade, terms }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save');
      }

      setShowFeeFormModal(false);
      setEditFeeGrade(null);
      setFeeFormGrade('');
      fetchData();
      setToast({ type: 'success', text: editFeeGrade ? 'Fee structure updated successfully!' : 'Fee structure added successfully!' });
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      console.error("Error saving class fee:", error);
      setToast({ type: 'error', text: 'Failed to save class fee.' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSavingFee(false);
    }
  };

  const handleDeleteFee = async (grade) => {
    if (!confirm(`Delete fee structure for ${grade}? This will reset all student fees in this class.`)) return;
    try {
      const res = await fetch(`/api/class-fees?grade=${encodeURIComponent(grade)}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
        setToast({ type: 'success', text: 'Fee structure deleted successfully!' });
        setTimeout(() => setToast(null), 3000);
      }
    } catch (error) {
      console.error("Error deleting class fee:", error);
    }
  };

  const normalizeFee = (cf) => {
    if (!cf) return null;
    if (cf.terms && cf.terms.length > 0) return cf;
    if (cf.categories && cf.categories.length > 0) {
      return { ...cf, terms: [{ name: 'General', categories: cf.categories, totalFee: cf.totalFee || 0 }] };
    }
    return cf;
  };

  const getClassFeeForGrade = (grade) => normalizeFee(classFees.find(cf => cf.grade === grade));

  const filteredStudents = students.filter(s => {
    const matchesGrade = filterGrade === 'All' || s.grade === filterGrade;
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesGrade && matchesSearch;
  });

  const uniqueGrades = ['All', ...new Set(students.map(s => s.grade))];

  const statusBadge = (status) => {
    const map = {
      completed: 'bg-emerald-100 text-emerald-700',
      partial: 'bg-amber-100 text-amber-700',
      pending: 'bg-slate-100 text-slate-500'
    };
    return `px-3 py-1 rounded-full text-xs font-bold ${map[status] || map.pending}`;
  };

  if (loading) return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div></div>;

  const modalOverlay = 'fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto';

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Fees & Payments</h1>
          <p className="text-slate-500 text-sm mt-1">Manage class fee structures, track student payments, and monitor dues.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button onClick={() => setTab('structure')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${tab === 'structure' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            Fee Structure
          </button>
          <button onClick={() => setTab('overview')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${tab === 'overview' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            Fee Overview
          </button>
          <button onClick={() => setTab('history')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${tab === 'history' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            Payment History
          </button>
        </div>
      </div>

      {tab === 'structure' && (
        <>
          <div className="flex justify-end">
            <button onClick={openNewFeeForm}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-emerald-200 transition-all text-sm">
              <PlusIcon className="w-5 h-5" /> Add Fee Structure
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classFees.length === 0 ? (
              <div className="col-span-full p-8 text-center bg-white rounded-3xl border border-slate-100 text-slate-500">
                No fee structures defined. Create one to get started.
              </div>
            ) : (
              classFees.map(raw => {
                const cf = normalizeFee(raw);
                return (
                <div key={cf._id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-lg transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-slate-900">{cf.grade}</h3>
                    <span className="text-lg font-black text-emerald-600">Rs {cf.totalFee?.toLocaleString()}</span>
                  </div>
                  <div className="space-y-3 mb-5">
                    {(cf.terms || []).map((term, ti) => (
                      <div key={ti} className="bg-slate-50 rounded-xl p-3">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{term.name}</p>
                        {(term.categories || []).map((cat, ci) => (
                          <div key={ci} className="flex justify-between text-sm py-0.5">
                            <span className="text-slate-600">{cat.name}</span>
                            <span className="font-semibold text-slate-800">Rs {cat.amount?.toLocaleString()}</span>
                          </div>
                        ))}
                        <div className="flex justify-between text-sm pt-1 mt-1 border-t border-slate-200 font-bold">
                          <span className="text-slate-500">Term Total</span>
                          <span className="text-emerald-600">Rs {term.totalFee?.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-3 border-t border-slate-100">
                    <button onClick={() => openEditFeeForm(cf)}
                      className="flex-1 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-bold text-sm transition-colors">Edit</button>
                    <button onClick={() => handleDeleteFee(cf.grade)}
                      className="flex-1 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-sm transition-colors">Delete</button>
                  </div>
                </div>
              )})
            )}
          </div>
        </>
      )}

      {tab === 'overview' && (
        <>
          <div className="flex flex-wrap gap-3">
            <input type="text" placeholder="Search students..." value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-600 outline-none text-sm flex-1 min-w-[200px] bg-slate-50" />
            <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-600 outline-none text-sm font-semibold text-slate-600 bg-slate-50 cursor-pointer">
              {uniqueGrades.map(g => <option key={g} value={g}>{g === 'All' ? 'All Grades' : g}</option>)}
            </select>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="px-6 py-4 font-bold">Student</th>
                    <th className="px-6 py-4 font-bold">Total Fee</th>
                    <th className="px-6 py-4 font-bold">Paid</th>
                    <th className="px-6 py-4 font-bold">Due</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                    <th className="px-6 py-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.length === 0 ? (
                    <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-400">No students found.</td></tr>
                  ) : (
                    filteredStudents.map(s => (
                      <tr key={s._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                              {s.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">{s.name}</p>
                              <p className="text-xs text-slate-500">{s.grade} {s.section ? `(Sec ${s.section})` : ''}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900">Rs {s.totalFee?.toLocaleString() || 0}</td>
                        <td className="px-6 py-4 font-bold text-emerald-600">Rs {s.paidAmount?.toLocaleString() || 0}</td>
                        <td className="px-6 py-4 font-bold text-red-500">Rs {s.dueAmount?.toLocaleString() || 0}</td>
                        <td className="px-6 py-4"><span className={statusBadge(s.feeStatus)}>{s.feeStatus?.charAt(0).toUpperCase() + s.feeStatus?.slice(1) || 'Pending'}</span></td>
                        <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                          <button onClick={() => { setPayStudent(s); setPayAmount(''); setShowPayModal(true); }}
                            className="text-blue-600 hover:text-blue-800 font-semibold text-xs">Pay</button>
                          <button onClick={() => openHistory(s)}
                            className="text-slate-600 hover:text-slate-800 font-semibold text-xs">History</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'history' && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-bold">Transaction ID</th>
                  <th className="px-6 py-4 font-bold">Student</th>
                  <th className="px-6 py-4 font-bold">Amount (NPR)</th>
                  <th className="px-6 py-4 font-bold">Date</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-400">No transactions found.</td></tr>
                ) : (
                  payments.map(p => (
                    <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-slate-400 uppercase">{p._id.slice(-8)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <UserIcon className="w-5 h-5 text-slate-400" />
                          <div>
                            <p className="font-semibold text-slate-900">{p.studentId?.name || 'Unknown'}</p>
                            <p className="text-xs text-slate-500">{p.studentId?.grade}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-emerald-600">Rs {p.amount?.toLocaleString()}</td>
                      <td className="px-6 py-4 text-slate-500 text-sm">{toNepaliDate(p.date)}</td>
                      <td className="px-6 py-4"><span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">Paid</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Fee Structure Form Modal */}
      {showFeeFormModal && (
        <div className={modalOverlay}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl flex flex-col my-0" style={{ maxHeight: '90vh', animationDuration: '0.3s', animationIterationCount: 1, animationName: 'zoomIn' }}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h2 className="text-xl font-bold text-slate-900">{editFeeGrade ? 'Edit' : 'Add'} Fee Structure</h2>
              <button onClick={() => setShowFeeFormModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50 transition-all">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSaveFee} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-4">
                {!editFeeGrade && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Grade / Class</label>
                    <select required value={feeFormGrade} onChange={e => setFeeFormGrade(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-emerald-600 outline-none text-sm">
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
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${activeTermIdx === ti ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                      {term.name || `Term ${ti + 1}`}
                    </button>
                  ))}
                  <button type="button" onClick={() => {
                    setFeeTerms([...feeTerms, { name: `Term ${feeTerms.length + 1}`, categories: [{ name: '', amount: 0 }], totalFee: 0 }]);
                    setActiveTermIdx(feeTerms.length);
                  }}
                    className="px-2 py-1.5 text-slate-400 hover:text-emerald-600 text-xs">
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
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-emerald-600 outline-none text-sm font-bold"
                    placeholder="Term name" />
                  {feeTerms.length > 1 && (
                    <button type="button" onClick={() => {
                      const updated = feeTerms.filter((_, ti) => ti !== activeTermIdx);
                      setFeeTerms(updated);
                      if (activeTermIdx >= updated.length) setActiveTermIdx(Math.max(0, updated.length - 1));
                    }}
                      className="text-red-400 hover:text-red-600 text-xs font-semibold">Remove</button>
                  )}
                </div>

                {/* Categories */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Categories</p>
                  {(feeTerms[activeTermIdx]?.categories || []).map((cat, ci) => (
                    <div key={ci} className="flex items-center gap-3">
                      <input type="text" value={cat.name} onChange={e => {
                        const updated = [...feeTerms];
                        updated[activeTermIdx].categories[ci].name = e.target.value;
                        setFeeTerms(updated);
                      }}
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-emerald-600 outline-none text-sm"
                        placeholder="Category name" />
                      <div className="relative w-36 shrink-0">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">Rs</span>
                        <input type="number" min="0" value={cat.amount} onChange={e => {
                          const updated = [...feeTerms];
                          updated[activeTermIdx].categories[ci].amount = Number(e.target.value);
                          setFeeTerms(updated);
                        }}
                          className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-emerald-600 outline-none text-sm" />
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
                    className="text-emerald-600 hover:text-emerald-800 text-xs font-semibold flex items-center gap-1">
                    <PlusIcon className="w-4 h-4" /> Add category
                  </button>
                </div>

                {/* Totals */}
                <div className="pt-3 border-t border-slate-100 space-y-1">
                  {feeTerms.map((t, ti) => (
                    <div key={ti} className="flex justify-between text-xs">
                      <span className="text-slate-500">{t.name || `Term ${ti + 1}`}</span>
                      <span className="font-semibold text-slate-700">Rs {(t.categories || []).reduce((s, c) => s + (Number(c.amount) || 0), 0).toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm font-bold border-t border-slate-200 pt-1">
                    <span className="text-slate-800">Grand Total</span>
                    <span className="text-emerald-600">Rs {feeTerms.reduce((s, t) => s + (t.categories || []).reduce((s2, c) => s2 + (Number(c.amount) || 0), 0), 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="p-6 pt-0 shrink-0">
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowFeeFormModal(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-all text-sm">Cancel</button>
                  <button type="submit" disabled={savingFee}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all text-sm disabled:opacity-50">
                    {savingFee ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPayModal && payStudent && (
        <div className={modalOverlay}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden my-8" style={{ animationDuration: '0.3s', animationIterationCount: 1, animationName: 'zoomIn' }}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-900">Record Payment</h2>
              <button onClick={() => { setShowPayModal(false); setPayStudent(null); }} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50 transition-all">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
              <p className="text-sm text-slate-600">Student: <strong>{payStudent.name}</strong> ({payStudent.grade})</p>
              <div className="grid grid-cols-2 gap-3 text-center text-sm bg-slate-50 p-3 rounded-xl">
                <div><p className="text-slate-400 text-xs">Total Fee</p><p className="font-bold text-slate-900">Rs {payStudent.totalFee?.toLocaleString() || 0}</p></div>
                <div><p className="text-slate-400 text-xs">Due</p><p className="font-bold text-red-500">Rs {payStudent.dueAmount?.toLocaleString() || 0}</p></div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Amount (NPR)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rs</span>
                  <input type="number" required min="1" value={payAmount}
                    onChange={e => setPayAmount(e.target.value)}
                    className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-600 outline-none text-sm"
                    placeholder="Enter amount" />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => { setShowPayModal(false); setPayStudent(null); }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-all text-sm">Cancel</button>
                <button type="submit"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all text-sm">Confirm Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      {showHistoryModal && historyStudent && (
        <div className={modalOverlay}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden my-8" style={{ animationDuration: '0.3s', animationIterationCount: 1, animationName: 'zoomIn' }}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-900">Payment History — {historyStudent.name}</h2>
              <button onClick={() => { setShowHistoryModal(false); setHistoryStudent(null); }} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50 transition-all">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 max-h-80 overflow-y-auto">
              <div className="grid grid-cols-3 gap-3 text-center text-sm bg-slate-50 p-3 rounded-xl mb-4">
                <div><p className="text-slate-400 text-xs">Total Fee</p><p className="font-bold text-slate-900">Rs {historyStudent.totalFee?.toLocaleString() || 0}</p></div>
                <div><p className="text-slate-400 text-xs">Paid</p><p className="font-bold text-emerald-600">Rs {historyStudent.paidAmount?.toLocaleString() || 0}</p></div>
                <div><p className="text-slate-400 text-xs">Due</p><p className="font-bold text-red-500">Rs {historyStudent.dueAmount?.toLocaleString() || 0}</p></div>
              </div>
              {studentPayments.length === 0 ? (
                <p className="text-slate-400 text-center py-4">No payments recorded for this student.</p>
              ) : (
                <div className="space-y-2">
                  {studentPayments.map(p => (
                    <div key={p._id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">Rs {p.amount?.toLocaleString()}</p>
                          <p className="text-xs text-slate-400">{toNepaliDate(p.date)}</p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">Paid</span>
                    </div>
                  ))}
                </div>
              )}
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
