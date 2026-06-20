'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { MegaphoneIcon, PaperAirplaneIcon, TrashIcon, PhotoIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { toNepaliDate, toLocalDateStr } from '@/lib/nepaliDate';
import { NepaliDatePicker } from 'react-bs-calender';
import 'react-bs-calender/styles.css';

function Badge({ children, color = 'slate' }) {
  const colors = {
    slate: 'bg-slate-100 text-slate-600', emerald: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700', red: 'bg-red-100 text-red-700',
    blue: 'bg-blue-100 text-blue-700', purple: 'bg-purple-100 text-purple-700',
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
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const showToast = (type, text) => setToast({ type, text });

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  const loadNotices = async () => {
    try {
      const res = await fetch('/api/notices');
      const data = await res.json();
      setNotices(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e) } finally { setLoading(false); }
  };

  useEffect(() => { if (status === 'authenticated') loadNotices(); }, [status]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!imageFile && !title.trim() && !content.trim()) return;
    setSending(true);
    setToast(null);
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
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, imageUrl, expiryDate: expiryDate || null, targetAudience }),
      });
      if (res.ok) {
        setTitle(''); setContent(''); setImageFile(null); setImagePreview(''); setExpiryDate(''); setTargetAudience('all');
        showToast('success', 'Notice sent successfully!');
        loadNotices();
      } else { const err = await res.json(); showToast('error', err.error || 'Failed to send.'); }
    } catch { showToast('error', 'Something went wrong.'); }
    finally { setSending(false); }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/notices?id=${id}`, { method: 'DELETE' });
      if (res.ok) { setNotices(prev => prev.filter(n => n._id !== id)); showToast('success', 'Notice deleted.'); }
    } catch { showToast('error', 'Failed to delete.'); }
    setConfirmDelete(null);
  };

  const isExpired = (date) => date && new Date(date) < new Date();

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
          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
              <MegaphoneIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">Send Notice</h1>
              <p className="text-xs text-slate-400">Create and send notices to teachers and students</p>
            </div>
          </div>
        </div>

        {/* ─── Grid ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Compose Form */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm">
                  <MegaphoneIcon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Compose Notice</h2>
                  <p className="text-[10px] text-slate-400">Send as {session?.user?.name} (Owner)</p>
                </div>
              </div>

              <form onSubmit={handleSend} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Title</label>
                  <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Notice title..."
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Content</label>
                  <textarea value={content} onChange={e => setContent(e.target.value)} rows={4} placeholder="Write notice content..."
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none" />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Attach Image (optional)</label>
                  <div className="flex items-center gap-3">
                    <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-500 transition-all hover:bg-slate-50">
                      <PhotoIcon className="h-4 w-4" />
                      Choose Image
                      <input type="file" accept="image/*" className="hidden" onChange={e => {
                        const file = e.target.files[0];
                        if (file) { setImageFile(file); const reader = new FileReader(); reader.onload = (ev) => setImagePreview(ev.target.result); reader.readAsDataURL(file); }
                      }} />
                    </label>
                    {imagePreview && (
                      <button type="button" onClick={() => { setImageFile(null); setImagePreview(''); }}
                        className="text-xs font-bold text-red-500 hover:text-red-700">Remove</button>
                    )}
                  </div>
                  {imagePreview && (
                    <img src={imagePreview} alt="Preview" className="mt-2 max-h-36 rounded-xl object-contain border border-slate-200" />
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Expiry Date (optional)</label>
                  <NepaliDatePicker
                    value={expiryDate ? new Date(expiryDate) : null}
                    onChange={(date) => { if (date) setExpiryDate(toLocalDateStr(date)); }}
                    locale="en" placeholder="YYYY/MM/DD"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Notice will auto-disappear after this date.</p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Send To</label>
                  <div className="flex gap-2">
                    {[
                      { value: 'all', label: 'Everyone' },
                      { value: 'teacher', label: 'Teachers' },
                      { value: 'student', label: 'Students' },
                    ].map(opt => (
                      <button key={opt.value} type="button" onClick={() => setTargetAudience(opt.value)}
                        className={`flex-1 rounded-xl border-2 py-2.5 text-xs font-bold transition-all cursor-pointer ${targetAudience === opt.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button type="submit" disabled={sending}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-slate-800 disabled:opacity-50">
                  {sending ? <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <PaperAirplaneIcon className="h-4 w-4" />}
                  {sending ? 'Sending...' : 'Send Notice'}
                </button>
              </form>
            </div>
          </div>

          {/* Recent Notices */}
          <div className="lg:col-span-2 space-y-3">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Recent Notices</h2>
            {notices.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center">
                <MegaphoneIcon className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                <p className="text-sm text-slate-400">No notices sent yet.</p>
              </div>
            ) : (
              notices.map((notice) => {
                const expired = isExpired(notice.expiryDate);
                return (
                  <div key={notice._id} className={`rounded-xl border bg-white p-4 transition-all hover:shadow-sm ${expired ? 'border-red-200 opacity-60' : 'border-slate-100'}`}>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="min-w-0 flex items-center gap-2">
                        {notice.title && <h3 className="text-sm font-bold text-slate-800 truncate">{notice.title}</h3>}
                        {expired && <Badge color="red">Expired</Badge>}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge color={notice.targetAudience === 'all' ? 'blue' : notice.targetAudience === 'teacher' ? 'purple' : 'emerald'}>
                          {notice.targetAudience}
                        </Badge>
                        <button onClick={() => setConfirmDelete(notice._id)}
                          className="rounded p-1 text-slate-300 transition-all hover:bg-red-50 hover:text-red-500">
                          <TrashIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    {notice.imageUrl && (
                      <img src={notice.imageUrl} alt="" className="max-h-24 rounded-lg object-contain mb-2" />
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
                        <span className="font-semibold">{notice.createdByName}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ─── Confirm Delete ─── */}
      <ConfirmModal
        open={!!confirmDelete}
        title="Delete Notice?"
        message="This action cannot be undone."
        onConfirm={() => handleDelete(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />

      <style jsx>{`
        @keyframes zoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
