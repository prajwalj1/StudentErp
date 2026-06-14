'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { MegaphoneIcon, PaperAirplaneIcon, TrashIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { toNepaliDate, toLocalDateStr } from '@/lib/nepaliDate';
import { NepaliDatePicker } from 'react-bs-calender';
import 'react-bs-calender/styles.css';

export default function OwnerNotices() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [targetAudience, setTargetAudience] = useState('all');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (status === 'unauthenticated' || (session && session.user.role !== 'OWNER')) {
      router.push('/login');
    }
  }, [status, session, router]);

  const loadNotices = async () => {
    try {
      const res = await fetch('/api/notices');
      const data = await res.json();
      setNotices(Array.isArray(data) ? data : []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'OWNER') {
      loadNotices();
    }
  }, [status, session]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!imageFile && !title.trim() && !content.trim()) return;
    setSending(true);
    setMessage(null);
    try {
      let imageUrl = '';
      if (imageFile) {
        imageUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target.result);
          reader.readAsDataURL(imageFile);
        });
      }
      const res = await fetch('/api/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, content, imageUrl,
          expiryDate: expiryDate || null,
          targetAudience,
        }),
      });
      if (res.ok) {
        setTitle('');
        setContent('');
        setImageFile(null);
        setImagePreview('');
        setExpiryDate('');
        setTargetAudience('all');
        setMessage({ type: 'success', text: 'Notice sent successfully!' });
        loadNotices();
      } else {
        const err = await res.json();
        setMessage({ type: 'error', text: err.error || 'Failed to send notice.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Something went wrong.' });
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this notice?')) return;
    try {
      const res = await fetch(`/api/notices?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setNotices(prev => prev.filter(n => n._id !== id));
        setMessage({ type: 'success', text: 'Notice deleted.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to delete.' });
    }
  };

  if (status === 'loading') {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isExpired = (date) => date && new Date(date) < new Date();

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Send Notice</h1>
          <p className="text-sm text-slate-500">Create and send notices to teachers and students</p>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-xl text-sm font-semibold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Send Form - Owner specific */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-blue-50 rounded-xl">
                  <MegaphoneIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">Compose Notice</h2>
                  <p className="text-xs text-slate-400">Send as {session?.user?.name} (Owner)</p>
                </div>
              </div>

              <form onSubmit={handleSend} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Attach Image (optional)</label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-50 cursor-pointer transition-all">
                      <PhotoIcon className="w-4 h-4" />
                      Choose Image
                      <input type="file" accept="image/*" className="hidden" onChange={e => {
                        const file = e.target.files[0];
                        if (file) {
                          setImageFile(file);
                          const reader = new FileReader();
                          reader.onload = (ev) => setImagePreview(ev.target.result);
                          reader.readAsDataURL(file);
                        }
                      }} />
                    </label>
                    {imagePreview && (
                      <button type="button" onClick={() => { setImageFile(null); setImagePreview(''); }}
                        className="text-xs text-red-500 font-semibold hover:text-red-700 cursor-pointer">Remove</button>
                    )}
                  </div>
                  {imagePreview && (
                    <div className="mt-2 relative">
                      <img src={imagePreview} alt="Preview" className="max-h-48 object-contain" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Expiry Date (optional)</label>
                  <NepaliDatePicker
                    value={expiryDate ? new Date(expiryDate) : null}
                    onChange={(date, nepaliDateString) => {
                      if (date) setExpiryDate(toLocalDateStr(date));
                    }}
                    locale="en"
                    placeholder="YYYY/MM/DD"
                    className="w-full border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Notice will auto-disappear after this date for teachers and students.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Send To</label>
                  <div className="flex gap-3">
                    {[
                      { value: 'all', label: 'Everyone' },
                      { value: 'teacher', label: 'Teachers' },
                      { value: 'student', label: 'Students' },
                    ].map(opt => (
                      <button key={opt.value} type="button" onClick={() => setTargetAudience(opt.value)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all cursor-pointer ${targetAudience === opt.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button type="submit" disabled={sending}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer">
                  {sending ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <PaperAirplaneIcon className="w-4 h-4" />
                  )}
                  {sending ? 'Sending...' : 'Send Notice'}
                </button>
              </form>
            </div>
          </div>

          {/* Sent Notices List */}
          <div className="lg:col-span-2 space-y-3">
            <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wider">Recent Notices</h2>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : notices.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-6 text-center">
                <MegaphoneIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No notices sent yet.</p>
              </div>
            ) : (
              notices.map((notice) => {
                const expired = isExpired(notice.expiryDate);
                return (
                  <div key={notice._id} className={`bg-white rounded-xl border p-4 hover:shadow-sm transition-shadow ${expired ? 'border-red-200 opacity-60' : 'border-slate-100'}`}>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        {notice.title && <h3 className="text-sm font-bold text-slate-800 truncate">{notice.title}</h3>}
                        {expired && <span className="shrink-0 text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">Expired</span>}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${notice.targetAudience === 'all' ? 'bg-blue-50 text-blue-600' : notice.targetAudience === 'teacher' ? 'bg-purple-50 text-purple-600' : 'bg-emerald-50 text-emerald-600'}`}>
                          {notice.targetAudience}
                        </span>
                        <button onClick={() => handleDelete(notice._id)}
                          className="p-1 rounded hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors cursor-pointer">
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {notice.imageUrl && (
                      <img src={notice.imageUrl} alt="" className="max-h-28 object-contain mb-2" />
                    )}
                    {notice.content && <p className="text-xs text-slate-500 mb-2 line-clamp-2">{notice.content}</p>}
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>{toNepaliDate(notice.createdAt)}</span>
                      <div className="flex items-center gap-2">
                        {notice.expiryDate && (
                          <span className={expired ? 'text-red-400' : 'text-slate-400'}>
                            Expires: {toNepaliDate(notice.expiryDate)}
                          </span>
                        )}
                        <span className="font-semibold">by {notice.createdByName}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
