'use client';

import { Suspense } from 'react';
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CurrencyDollarIcon, CheckCircleIcon, XCircleIcon, PrinterIcon } from '@heroicons/react/24/outline';
import { toNepaliDate, getNepaliYear } from '@/lib/nepaliDate';

function FeesContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const formRef = useRef(null);
  const billRef = useRef(null);

  const [feeData, setFeeData] = useState(null);
  const [classFee, setClassFee] = useState(null);
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
    if (status === 'unauthenticated' || (session && session.user.role !== 'STUDENT')) {
      router.push('/login');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'STUDENT') {
      fetch('/api/fees')
        .then(r => r.json())
        .then(fees => {
          if (fees?.student) setFeeData(fees.student);
          if (fees?.classFee) setClassFee(fees.classFee);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [status, session]);

  useEffect(() => {
    if (esewaForm && formRef.current) {
      formRef.current.submit();
    }
  }, [esewaForm]);

  const handlePay = async () => {
    const amount = payMode === 'full' ? feeData?.dueAmount : Number(payAmount);
    if (!amount || amount <= 0) return;
    if (amount > (feeData?.dueAmount || 0)) {
      setMessage({ type: 'error', text: 'Amount cannot exceed due amount.' });
      return;
    }
    setPaying(true);
    setMessage(null);
    try {
      const res = await fetch('/api/esewa/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (!data.success) {
        setMessage({ type: 'error', text: data.error || 'Failed to initiate payment.' });
        setPaying(false);
        return;
      }
      setEsewaForm(data);
    } catch {
      setMessage({ type: 'error', text: 'Connection error. Please try again.' });
      setPaying(false);
    }
  };

  const handlePrint = () => {
    window.print();
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

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-2 pb-12 px-4 sm:px-6 lg:px-8">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #fee-bill, #fee-bill * { visibility: visible; }
          #fee-bill { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>
      <div className="max-w-3xl mx-auto">
        {message && (
          <div className={`mb-4 flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-semibold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {message.type === 'success' ? <CheckCircleIcon className="w-5 h-5 shrink-0" /> : <XCircleIcon className="w-5 h-5 shrink-0" />}
            {message.text}
            <button onClick={() => setMessage(null)} className="ml-auto text-slate-400 hover:text-slate-600">&times;</button>
          </div>
        )}

        {classFee ? (
          <div>
            <div className="flex justify-end mb-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition-all no-print">
                <PrinterIcon className="w-4 h-4" />
                Print / Download Bill
              </button>
            </div>
            <div id="fee-bill" ref={billRef} className="bg-white border-2 border-slate-200 shadow-sm overflow-hidden">
            {/* School Header */}
            <div className="text-center pt-6 pb-4 px-6 border-b-2 border-slate-200">
              <div className="flex justify-center mb-3">
                <img src="/images/logo.png" alt="School Logo"
                  className="w-16 h-16 object-contain"
                  onError={e => { e.target.style.display = 'none'; }} />
              </div>
              <h1 className="text-xl font-black text-red-700 uppercase tracking-wider">Everest View Secondary Boarding School</h1>
              <p className="text-xs text-slate-500 mt-1">Mechinagar-7, Jhapa, Nepal &middot; Phone: 023-562430 &middot; Email: info@everestview.edu.np</p>
            </div>

            {/* Bill Title */}
            <div className="text-center py-3 bg-red-50 border-b border-slate-200">
              <h2 className="text-base font-black text-red-700 uppercase tracking-widest">School Fee Bill</h2>
              <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Academic Session {getNepaliYear(today)}</p>
            </div>

            {/* Bill Info Row */}
            <div className="px-6 py-3 border-b border-slate-200 flex justify-between items-center text-xs">
              <div className="flex gap-8">
                <div>
                  <span className="text-slate-400 font-semibold">Bill No:</span>
                  <span className="ml-1.5 font-bold text-slate-800 font-mono">{billNo || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold">Date:</span>
                  <span className="ml-1.5 font-bold text-slate-800">{toNepaliDate(today)}</span>
                </div>
              </div>
              <span className="font-bold text-red-600">{classFee.grade}</span>
            </div>

            {/* Student Details */}
            <div className="px-6 py-3 border-b border-slate-200 bg-slate-50/50">
              <table className="w-full text-xs">
                <tbody>
                  <tr>
                    <td className="py-1 text-slate-400 font-semibold w-28">Student Name:</td>
                    <td className="py-1 font-bold text-slate-900">{session?.user?.name}</td>
                    <td className="py-1 text-slate-400 font-semibold w-24">Student ID:</td>
                    <td className="py-1 font-bold text-slate-900">{session?.user?.studentId || '-'}</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-slate-400 font-semibold">Grade/Class:</td>
                    <td className="py-1 font-bold text-slate-900">{classFee.grade}</td>
                    <td className="py-1 text-slate-400 font-semibold">Session:</td>
                    <td className="py-1 font-bold text-slate-900">{getNepaliYear(today)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Fee Table */}
            <div className="px-6 py-5">
              <table className="w-full border-collapse border border-slate-200 text-sm">
                <thead>
                  <tr className="bg-red-50">
                    <th className="border border-slate-200 px-3 py-2 text-[10px] font-bold text-red-800 uppercase tracking-wider w-12 text-center">S.No</th>
                    <th className="border border-slate-200 px-3 py-2 text-[10px] font-bold text-red-800 uppercase tracking-wider">Particulars / Fee Category</th>
                    <th className="border border-slate-200 px-3 py-2 text-[10px] font-bold text-red-800 uppercase tracking-wider text-right w-32">Amount (Rs.)</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(categoryTotals).map(([name, total], i) => (
                    <tr key={name} className="hover:bg-slate-50">
                      <td className="border border-slate-200 px-3 py-2 text-xs text-slate-400 text-center font-mono">{String(i + 1).padStart(2, '0')}</td>
                      <td className="border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">{name}</td>
                      <td className="border border-slate-200 px-3 py-2 text-sm font-bold text-slate-900 text-right">Rs. {total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-red-50">
                    <td colSpan="2" className="border border-slate-200 px-3 py-2.5 text-sm font-black text-red-800 text-right">Total Fee</td>
                    <td className="border border-slate-200 px-3 py-2.5 text-base font-black text-red-700 text-right">Rs. {classFee.totalFee?.toLocaleString() || 0}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* In Words & Payment Summary */}
            <div className="px-6 pb-2">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-2">Amount in Words</p>
                  <p className="text-xs font-medium text-slate-600 italic">
                    Rupees {classFee?.totalFee ? numberToWords(classFee.totalFee) : 'Zero'} Only
                  </p>
                </div>
                <div>
                  <table className="w-full text-xs border-collapse">
                    <tbody>
                      <tr>
                        <td className="py-1 text-slate-500">Total Fee:</td>
                        <td className="py-1 font-bold text-slate-900 text-right">Rs. {classFee.totalFee?.toLocaleString() || 0}</td>
                      </tr>
                      <tr>
                        <td className="py-1 text-emerald-600 font-semibold">Paid Amount:</td>
                        <td className="py-1 font-bold text-emerald-600 text-right">- Rs. {feeData?.paidAmount?.toLocaleString() || 0}</td>
                      </tr>
                      <tr className="border-t border-slate-200">
                        <td className="pt-2 font-black text-slate-900">Balance Due:</td>
                        <td className={`pt-2 font-black text-right ${(feeData?.dueAmount || 0) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                          Rs. {feeData?.dueAmount?.toLocaleString() || 0}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Term-wise Details */}
            {classFee.terms?.length > 0 && (
              <div className="px-6 pb-4">
                <details className="text-xs">
                  <summary className="cursor-pointer text-slate-500 font-semibold hover:text-slate-700">
                    View Term-wise Breakdown ({classFee.terms.length} terms)
                  </summary>
                  <div className="mt-2 space-y-2 pl-4">
                    {classFee.terms.map((term, ti) => (
                      <div key={ti}>
                        <div className="flex justify-between items-center py-1 font-bold text-slate-700 border-b border-slate-200">
                          <span>{term.name}</span>
                          <span className="text-red-700">Rs. {term.totalFee?.toLocaleString() || 0}</span>
                        </div>
                        {term.categories?.map((cat, ci) => (
                          <div key={ci} className="flex justify-between items-center py-0.5 text-slate-600 pl-3">
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

            {/* Signature Section */}
            <div className="px-6 py-6 mt-2 border-t-2 border-slate-200">
              <div className="flex justify-between items-end">
                <div className="text-center">
                  <div className="w-44 border-t border-slate-300 pt-2 mt-16">
                    <p className="text-xs font-bold text-slate-700">Accountant</p>
                    <p className="text-[10px] text-slate-400">Signature</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="px-6 py-3 bg-red-50 border border-red-200 rounded">
                    <p className={`text-sm font-black ${(feeData?.dueAmount || 0) > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                      {(feeData?.dueAmount || 0) > 0 ? 'PAYABLE' : 'PAID'}
                    </p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="w-44 border-t border-slate-300 pt-2 mt-16">
                    <p className="text-xs font-bold text-slate-700">Principal</p>
                    <p className="text-[10px] text-slate-400">Signature</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-slate-200 text-center bg-slate-50">
              <p className="text-[10px] text-slate-400 font-semibold">This is a computer-generated bill. All payments are tracked and verified.</p>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">&copy; {today.getFullYear()} Everest View Secondary Boarding School. All rights reserved.</p>
            </div>
          </div>
        </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 text-center">
            <p className="text-slate-400 text-sm">No fee structure defined for your class.</p>
          </div>
        )}

        {/* Payment Section */}
        {feeData && feeData.dueAmount > 0 && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 mt-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Pay via eSewa</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="payMode" value="full" checked={payMode === 'full'} onChange={() => { setPayMode('full'); setPayAmount(''); }} className="accent-blue-600 w-4 h-4" />
                  <span className="text-sm font-semibold text-slate-700">Full Payment</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="payMode" value="installment" checked={payMode === 'installment'} onChange={() => setPayMode('installment')} className="accent-blue-600 w-4 h-4" />
                  <span className="text-sm font-semibold text-slate-700">Installment</span>
                </label>
              </div>

              {payMode === 'full' && (
                <div className="bg-blue-50 p-4 rounded-xl">
                  <p className="text-sm text-blue-700 font-semibold">You will pay the full balance due:</p>
                  <p className="text-2xl font-black text-blue-800 mt-1">Rs. {feeData.dueAmount?.toLocaleString()}</p>
                </div>
              )}

              {payMode === 'installment' && (
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-2">Enter Amount (Max: Rs. {feeData.dueAmount?.toLocaleString()})</label>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-slate-400">Rs.</span>
                    <input
                      type="number"
                      value={payAmount}
                      onChange={e => setPayAmount(e.target.value)}
                      max={feeData.dueAmount}
                      placeholder="Enter amount"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handlePay}
                disabled={paying}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-200"
              >
                {paying ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <CurrencyDollarIcon className="w-5 h-5" />
                )}
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <FeesContent />
    </Suspense>
  );
}
