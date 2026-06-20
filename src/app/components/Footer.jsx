'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Footer = () => {
  const pathname = usePathname();
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  if (pathname === '/login') return null;

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      setMsg({ type: res.ok ? 'success' : 'error', text: data.message || data.error });
      if (res.ok) setEmail('');
    } catch {
      setMsg({ type: 'error', text: 'Network error. Try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-slate-950 text-slate-400 py-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="text-2xl font-bold text-white mb-6 block leading-tight">
              Everest View <span className="text-primary">ERP</span>
            </Link>
            <p className="mb-6 leading-relaxed">
              A complete School ERP system — attendance, fees, exams, assignments, and communication, all in one platform.
            </p>
            <div className="flex gap-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center hover:bg-blue-600 transition-colors group"
                aria-label="Facebook"
              >
                <svg className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center hover:bg-black transition-colors group"
                aria-label="TikTok"
              >
                <svg className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                </svg>
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center hover:bg-red-600 transition-colors group"
                aria-label="YouTube"
              >
                <svg className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
            </div>
          </div>

          <div className="md:col-span-2 grid grid-cols-2 gap-12">
            <div>
              <h4 className="text-white font-bold mb-6">For Students</h4>
              <ul className="space-y-4">
                <li><Link href="/student/dashboard" className="hover:text-primary transition-colors">Dashboard</Link></li>
                <li><Link href="/student/fees" className="hover:text-primary transition-colors">Fee Details</Link></li>
                <li><Link href="/student/marksheet" className="hover:text-primary transition-colors">Marksheet</Link></li>
                <li><Link href="/student/assignments" className="hover:text-primary transition-colors">Assignments</Link></li>
                <li><Link href="/student/routine" className="hover:text-primary transition-colors">Class Routine</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">For Teachers</h4>
              <ul className="space-y-4">
                <li><Link href="/teacher/dashboard" className="hover:text-primary transition-colors">Dashboard</Link></li>
                <li><Link href="/teacher/classes" className="hover:text-primary transition-colors">My Classes</Link></li>
                <li><Link href="/teacher/attendance" className="hover:text-primary transition-colors">Attendance</Link></li>
                <li><Link href="/teacher/marks" className="hover:text-primary transition-colors">Marks Entry</Link></li>
                <li><Link href="/teacher/exams" className="hover:text-primary transition-colors">Examinations</Link></li>
              </ul>
            </div>
          </div>

          <div className="md:col-span-1">
            <h4 className="text-white font-bold mb-6">Stay Updated</h4>
            <p className="mb-6">Get the latest news and updates from Everest View ERP.</p>
            {msg && (
              <p className={`text-xs font-semibold mb-3 ${msg.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                {msg.text}
              </p>
            )}
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
                className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 w-full focus:outline-none focus:border-primary text-sm"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-primary hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors font-bold text-sm shrink-0"
              >
                {loading ? '...' : 'Subscribe'}
              </button>
            </form>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
          <p>© 2026 Everest View Secondary Boarding School. All rights reserved.</p>
          <p className="text-slate-500 text-xs">
            Built with ❤️ — Based in School ERP
          </p>
          <div className="flex gap-8">
            <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white">Terms of Service</Link>
            <Link href="/cookies" className="hover:text-white">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
