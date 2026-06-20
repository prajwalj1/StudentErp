'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { MegaphoneIcon } from '@heroicons/react/24/outline';
import { toNepaliDate } from '@/lib/nepaliDate';

export default function TeacherNotices() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const sessionKicked = useRef(false);

  useEffect(() => {
    if (!sessionKicked.current) {
      sessionKicked.current = true;
      getSession();
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated' || (session && session.user.role !== 'TEACHER')) {
      router.push('/login');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'TEACHER') {
      fetch('/api/notices')
        .then(r => r.json())
        .then(data => {
          setNotices(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [status, session]);

  if (status === 'loading') {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 bg-purple-50 rounded-xl">
            <MegaphoneIcon className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Notices</h1>
            <p className="text-sm text-slate-500">View notices from administration</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notices.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
            <MegaphoneIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-lg font-semibold text-slate-500">No notices yet</p>
            <p className="text-sm text-slate-400 mt-1">Notices from the administration will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notices.map((notice) => (
              <div key={notice._id} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-3 mb-2">
                  {notice.title && <h2 className="text-base font-bold text-slate-800">{notice.title}</h2>}
                  <span className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full ${notice.targetAudience === 'all' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                    {notice.targetAudience === 'all' ? 'Everyone' : 'Teachers'}
                  </span>
                </div>
                {notice.imageUrl && (
                  <img src={notice.imageUrl} alt="Notice" className="max-h-80 object-contain w-full my-3" />
                )}
                {notice.content && <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{notice.content}</p>}
                <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                  <span className="font-semibold">Posted by {notice.createdByName}</span>
                  <span>{toNepaliDate(notice.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
