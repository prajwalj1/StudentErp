'use client';

import { Suspense } from 'react';
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { CurrencyDollarIcon, CheckCircleIcon, XCircleIcon, PrinterIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { toNepaliDate, getNepaliYear } from '@/lib/nepaliDate';

function FeesContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const formRef = useRef(null);
  const billRef = useRef(null);

  const [feeData, setFeeData] = useState(null);
  const [classFee, setClassFee] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState('full');
  const [message, setMessage] = useState(null);
  const [esewaForm, setEsewaForm] = useState(null);

  const paymentStatus = searchParams.get('payment');

  useEffect(() => {
    if (paymentStatus === 'success') setMessage({ type: 'success', text: 'Payment successful! Your fee has been updated.' });
    else if (paymentStatus === 'failed') setMessage({ type: 'error', text: 'Payment failed or was cancelled.' });
    else if (paymentStatus === 'error') setMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
  }, [paymentStatus]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      const callbackUrl = pathname + (searchParams.toString() ? '?' + searchParams.toString() : '');
      router.push('/login?callbackUrl=' + encodeURIComponent(callbackUrl));
    } else if (session && session.user.role !== 'STUDENT') {
      router.push('/login');
    }
  }, [status, session, router, pathname, searchParams]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'STUDENT') {
      fetch('/api/fees').then(r => r.json()).then(fees => {
        if (fees?.student) setFeeData(fees.student);
        if (fees?.classFee) setClassFee(fees.classFee);
        if (fees?.payments) setPayments(fees.payments);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [status, session]);

  useEffect(() => { if (esewaForm && formRef.current) formRef.current.submit(); }, [esewaForm]);

  const handlePay = async () => {
    const amount = payMode === 'full' ? feeData?.dueAmount : Number(payAmount);
    if (!amount || amount <= 0) return;
    if (amount > (feeData?.dueAmount || 0)) { setMessage({ type: 'error', text: 'Amount cannot exceed due amount.' }); return; }
    setPaying(true); setMessage(null);
    try {
      const res = await fetch('/api/esewa/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (!data.success) { setMessage({ type: 'error', text: data.error || 'Failed to initiate payment.' }); setPaying(false); return; }
      setEsewaForm(data);
    } catch { setMessage({ type: 'error', text: 'Connection error.' }); setPaying(false); }
  };

  const today = new Date();
  const billNo = classFee && session?.user?.studentId
    ? `EVS-FEE-${session.user.studentId}-${today.toISOString().slice(0,10).replace(/-/g,'')}`
    : '';

  const categoryTotals = {};
  if (classFee?.terms) {
    classFee.terms.forEach(term => {
      (term.categories || []).forEach(cat => {
        categoryTotals[cat.name] = (categoryTotals[cat.name] || 0) + (cat.amount || 0);
      });
    });
  }

  if (status === 'loading' || loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-emerald-600 border-t-transparent" />
    </div>
  );

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50/80 via-white to-emerald-50/20">
      <div className="mx-auto max-w-3xl space-y-5 p-4 sm:p-6 lg:p-8">

        {/* ─── Header (no-print) ─── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900 p-5 sm:p-6 shadow-xl no-print">
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                <CurrencyDollarIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white">Fee Details</h1>
                <p className="text-xs text-emerald-200">View fee structure and make payments</p>
              </div>
            </div>
            <button onClick={() => window.print()}
              className="flex items-center gap-2 rounded-xl bg-white/10 backdrop-blur-sm px-5 py-2.5 text-xs font-bold text-white transition-all hover:bg-white/20">
              <PrinterIcon className="h-4 w-4" />
              Print Bill
            </button>
          </div>
        </div>

        {/* ─── Message Banner ─── */}
        {message && (
          <div className={`flex items-center gap-3 rounded-2xl border px-5 py-4 text-sm font-bold ${message.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'} no-print`}>
            {message.type === 'success' ? <CheckCircleIcon className="h-5 w-5 shrink-0" /> : <XCircleIcon className="h-5 w-5 shrink-0" />}
            {message.text}
            <button onClick={() => setMessage(null)} className="ml-auto text-slate-400 hover:text-slate-600">&times;</button>
          </div>
        )}

        {/* ─── Fee Bill ─── */}
        {classFee ? (
          <div id="fee-bill" ref={billRef}>
            <div className="rounded-2xl border-2 border-slate-200 bg-white shadow-sm overflow-hidden">
              {/* School Header */}
              <div className="border-b-2 border-slate-200 px-6 pt-6 pb-4 text-center">
                <div className="mb-3 flex justify-center">
                  <img src="/images/logo.png" alt="School Logo" className="h-16 w-16 object-contain"
                    onError={e => { e.target.style.display = 'none'; }} />
                </div>
                <h1 className="text-xl font-black uppercase tracking-wider text-red-700">Everest View Secondary Boarding School</h1>
                <p className="mt-1 text-xs text-slate-500">Mechinagar-7, Jhapa, Nepal &middot; Phone: 023-562430 &middot; Email: info@everestview.edu.np</p>
              </div>

              {/* Bill Title */}
              <div className="border-b border-slate-200 bg-red-50 py-3 text-center">
                <h2 className="text-base font-black uppercase tracking-widest text-red-700">School Fee Bill</h2>
                <p className="mt-0.5 text-[10px] font-semibold text-slate-500">Academic Session {getNepaliYear(today)}</p>
              </div>

              {/* Bill Info */}
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-3 text-xs">
                <div className="flex gap-8">
                  <div><span className="font-semibold text-slate-400">Bill No:</span><span className="ml-1.5 font-bold font-mono text-slate-800">{billNo || 'N/A'}</span></div>
                  <div><span className="font-semibold text-slate-400">Date:</span><span className="ml-1.5 font-bold text-slate-800">{toNepaliDate(today)}</span></div>
                </div>
                <span className="font-bold text-red-600">{classFee.grade}</span>
              </div>

              {/* Student Details */}
              <div className="border-b border-slate-200 bg-slate-50/50 px-6 py-3">
                <table className="w-full text-xs">
                  <tbody>
                    <tr>
                      <td className="w-28 py-1 font-semibold text-slate-400">Student Name:</td>
                      <td className="py-1 font-bold text-slate-900">{session?.user?.name}</td>
                      <td className="w-24 py-1 font-semibold text-slate-400">Student ID:</td>
                      <td className="py-1 font-bold text-slate-900">{session?.user?.studentId || '-'}</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-semibold text-slate-400">Grade/Class:</td>
                      <td className="py-1 font-bold text-slate-900">{classFee.grade}</td>
                      <td className="py-1 font-semibold text-slate-400">Session:</td>
                      <td className="py-1 font-bold text-slate-900">{getNepaliYear(today)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Fee Table */}
              <div className="overflow-x-auto px-6 py-5">
                <table className="w-full border-collapse border border-slate-200 text-sm" style={{ minWidth: '400px' }}>
                  <thead>
                    <tr className="bg-red-50">
                      <th className="w-12 border border-slate-200 px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-red-800">S.No</th>
                      <th className="border border-slate-200 px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-red-800">Particulars / Fee Category</th>
                      <th className="w-32 border border-slate-200 px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-red-800">Amount (Rs.)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(categoryTotals).map(([name, total], i) => (
                      <tr key={name} className="hover:bg-slate-50">
                        <td className="border border-slate-200 px-3 py-2 text-center text-xs font-mono text-slate-400">{String(i + 1).padStart(2, '0')}</td>
                        <td className="border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">{name}</td>
                        <td className="border border-slate-200 px-3 py-2 text-right text-sm font-bold text-slate-900">Rs. {total.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-red-50">
                      <td colSpan="2" className="border border-slate-200 px-3 py-2.5 text-right text-sm font-black text-red-800">Total Fee</td>
                      <td className="border border-slate-200 px-3 py-2.5 text-right text-base font-black text-red-700">Rs. {classFee.totalFee?.toLocaleString() || 0}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* In Words & Summary */}
              <div className="grid grid-cols-2 gap-6 px-6 pb-2">
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Amount in Words</p>
                  <p className="text-xs font-medium italic text-slate-600">
                    Rupees {classFee?.totalFee ? numberToWords(classFee.totalFee) : 'Zero'} Only
                  </p>
                </div>
                <div>
                    <table className="w-full border-collapse text-xs">
                    <tbody>
                      <tr><td className="py-1 text-slate-500">Current Grade Fee:</td><td className="py-1 text-right font-bold text-slate-900">Rs. {classFee.totalFee?.toLocaleString() || 0}</td></tr>
                      {(feeData?.previousDue || 0) > 0 && (
                        <tr><td className="py-1 text-red-500 font-semibold">Previous Due:</td><td className="py-1 text-right font-bold text-red-500">+ Rs. {feeData.previousDue.toLocaleString()}</td></tr>
                      )}
                      <tr><td className="py-1 font-semibold text-emerald-600">Paid Amount:</td><td className="py-1 text-right font-bold text-emerald-600">- Rs. {feeData?.paidAmount?.toLocaleString() || 0}</td></tr>
                      <tr className="border-t border-slate-200">
                        <td className="pt-2 font-black text-slate-900">Balance Due:</td>
                        <td className={`pt-2 text-right font-black ${(feeData?.dueAmount || 0) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                          Rs. {feeData?.dueAmount?.toLocaleString() || 0}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Term Breakdown */}
              {classFee.terms?.length > 0 && (
                <div className="px-6 pb-4">
                  <details className="text-xs">
                    <summary className="cursor-pointer font-semibold text-slate-500 hover:text-slate-700">View Term-wise Breakdown ({classFee.terms.length} terms)</summary>
                    <div className="mt-2 space-y-2 pl-4">
                      {classFee.terms.map((term, ti) => (
                        <div key={ti}>
                          <div className="flex items-center justify-between border-b border-slate-200 py-1 font-bold text-slate-700">
                            <span>{term.name}</span>
                            <span className="text-red-700">Rs. {term.totalFee?.toLocaleString() || 0}</span>
                          </div>
                          {term.categories?.map((cat, ci) => (
                            <div key={ci} className="flex items-center justify-between py-0.5 pl-3 text-slate-600">
                              <span>{cat.name}</span>
                              <span>Rs. {cat.amount?.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              )}

              {/* Signature */}
              <div className="mt-2 border-t-2 border-slate-200 px-6 py-6">
                <div className="flex items-end justify-between">
                  <div className="text-center">
                    <div className="mt-16 w-44 border-t border-slate-300 pt-2">
                      <p className="text-xs font-bold text-slate-700">Accountant</p>
                      <p className="text-[10px] text-slate-400">Signature</p>
                    </div>
                  </div>
                  <div className="rounded border border-red-200 bg-red-50 px-6 py-3">
                    <p className={`text-sm font-black ${(feeData?.dueAmount || 0) > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                      {(feeData?.dueAmount || 0) > 0 ? 'PAYABLE' : 'PAID'}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="mt-16 w-44 border-t border-slate-300 pt-2">
                      <p className="text-xs font-bold text-slate-700">Principal</p>
                      <p className="text-[10px] text-slate-400">Signature</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-slate-200 bg-slate-50 px-6 py-3 text-center">
                <p className="text-[10px] font-semibold text-slate-400">This is a computer-generated bill. All payments are tracked and verified.</p>
                <p className="mt-0.5 text-[10px] font-semibold text-slate-400">&copy; {today.getFullYear()} Everest View Secondary Boarding School. All rights reserved.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-slate-400">No fee structure defined for your class.</p>
          </div>
        )}

        {/* ─── eSewa Payment Section ─── */}
        {feeData && feeData.dueAmount > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="flex items-center gap-2 text-base font-bold text-slate-900 mb-4">
              <SparklesIcon className="h-5 w-5 text-emerald-500" />
              Pay via eSewa
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="radio" name="payMode" value="full" checked={payMode === 'full'} onChange={() => { setPayMode('full'); setPayAmount(''); }} className="h-4 w-4 accent-emerald-600" />
                  <span className="text-xs font-bold text-slate-700">Full Payment</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="radio" name="payMode" value="installment" checked={payMode === 'installment'} onChange={() => setPayMode('installment')} className="h-4 w-4 accent-emerald-600" />
                  <span className="text-xs font-bold text-slate-700">Installment</span>
                </label>
              </div>

              {payMode === 'full' && (
                <div className="rounded-xl bg-emerald-50 p-4">
                  <p className="text-xs font-bold text-emerald-700">You will pay the full balance due:</p>
                  <p className="mt-1 text-2xl font-black text-emerald-800">Rs. {feeData.dueAmount?.toLocaleString()}</p>
                </div>
              )}

              {payMode === 'installment' && (
                <div>
                  <label className="mb-2 block text-xs font-bold text-slate-700">Enter Amount (Max: Rs. {feeData.dueAmount?.toLocaleString()})</label>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-slate-400">Rs.</span>
                    <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} max={feeData.dueAmount} placeholder="Enter amount"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20" />
                  </div>
                </div>
              )}

              <button onClick={handlePay} disabled={paying}
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-emerald-600 px-6 py-4 text-sm font-bold text-white shadow-lg transition-all hover:bg-emerald-700 disabled:bg-emerald-400">
                {paying ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : <CurrencyDollarIcon className="h-5 w-5" />}
                {paying ? 'Processing...' : `Pay Rs. ${(payMode === 'full' ? feeData.dueAmount : Number(payAmount || 0)).toLocaleString()} via eSewa`}
              </button>
            </div>
          </div>
        )}

        {esewaForm && (
          <form ref={formRef} action={esewaForm.gatewayUrl} method="POST" className="hidden">
            {Object.entries(esewaForm.formData).map(([key, val]) => (
              <input key={key} type="hidden" name={key} value={val} />
            ))}
          </form>
        )}

      </div>
    </div>
  );
}

function numberToWords(num) {
  const ones = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  if (num === 0) return 'Zero';
  const convert = (n) => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
  };
  return convert(num);
}

export default function StudentFees() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-emerald-600 border-t-transparent" />
      </div>
    }>
      <FeesContent />
    </Suspense>
  );
}
