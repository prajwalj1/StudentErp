'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import { Bars3Icon, BellIcon } from '@heroicons/react/24/outline';

/**
 * LayoutWrapper Component
 * Handles the persistent UI shell (Sidebar, Header, Footer)
 * and switches between Dashboard and Landing page layouts.
 */
export default function LayoutWrapper({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const pathname = usePathname();
  const { data: session } = useSession();
  
  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
    setShowNotif(false);
  }, [pathname]);

  useEffect(() => {
    if (!session) return;
    const fetchNotifs = async () => {
      try {
        const res = await fetch('/api/notices');
        if (res.ok) {
          const data = await res.json();
          setNotifications((Array.isArray(data) ? data : []).slice(0, 10));
        }
      } catch {}
    };
    fetchNotifs();
  }, [session]);

  // Define layout types
  const isDashboard = pathname.startsWith('/owner') || pathname.startsWith('/teacher') || pathname.startsWith('/student');
  const isLoginPage = pathname === '/login';

  // No special layout for login page
  if (isLoginPage) {
    return <main className="min-h-screen">{children}</main>;
  }

  // Dashboard Layout with Sidebar
  if (isDashboard) {
    return (
      <div className="min-h-screen bg-slate-50 flex overflow-hidden">
        {/* Persistent Sidebar */}
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 lg:pl-72 transition-all duration-300">
          {/* Dashboard Top Bar (Sticky) */}
          <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 sm:px-8 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                className="lg:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors"
                onClick={() => setSidebarOpen(true)}
              >
                <Bars3Icon className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <h1 className="text-lg font-black text-slate-900 capitalize leading-none whitespace-nowrap">
                  {pathname.split('/').pop()?.replace(/-/g, ' ') || 'Dashboard'}
                </h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 hidden sm:block">
                  Everest View ERP
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end mr-2">
                <p className="text-xs font-bold text-slate-900 whitespace-nowrap">{session?.user?.name || 'Administrator'}</p>
                <p className="text-[10px] text-slate-400 font-medium">{session?.user?.role || 'User'}</p>
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowNotif(!showNotif)}
                  className="relative p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all duration-300"
                >
                  <BellIcon className="w-5 h-5 text-slate-600" />
                  {notifications.length > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                  )}
                </button>
                {showNotif && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotif(false)} />
                    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden">
                      <div className="p-4 pb-3 border-b border-slate-100">
                        <h4 className="text-sm font-bold text-slate-900">Recent Activity</h4>
                      </div>
                      <div className="max-h-80 overflow-y-auto p-2">
                        {notifications.length === 0 ? (
                          <p className="text-xs text-slate-400 text-center py-6">No recent activity</p>
                        ) : (
                          notifications.map((n, i) => (
                            <div key={n._id || i} className="p-3 rounded-xl hover:bg-slate-50 transition-colors">
                              <div className="text-xs font-bold text-slate-900">{n.title || 'Notice'}</div>
                              {n.content && <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">{n.content}</div>}
                              <div className="text-[9px] text-slate-400 mt-1">{n.createdByName} • {new Date(n.createdAt).toLocaleDateString()}</div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-200">
                {session?.user?.name?.[0] ?? 'U'}
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-auto scrollbar-hide">
            {children}
          </main>
        </div>
      </div>
    );
  }

  // Landing Page Layout (Standard Header & Footer)
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
