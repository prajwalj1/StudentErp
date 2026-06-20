'use client';

import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ChartBarIcon,
  UsersIcon,
  AcademicCapIcon,
  CurrencyDollarIcon,
  ClipboardDocumentListIcon,
  BuildingLibraryIcon,
  ArrowRightOnRectangleIcon,
  XMarkIcon,
  BookOpenIcon,
  CheckCircleIcon,
  CalendarIcon,
  MegaphoneIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

/**
 * Premium Sidebar Component
 * Integrated into the layout for persistence across pages.
 */
export default function Sidebar({ isOpen, setIsOpen }) {
  const { data: session } = useSession();
  const pathname = usePathname();

  // Role-based navigation links
  const ownerLinks = [
    { label: 'Dashboard', icon: ChartBarIcon, href: '/owner/dashboard' },
    { label: 'Students', icon: UsersIcon, href: '/owner/students' },
    { label: 'Teachers', icon: AcademicCapIcon, href: '/owner/teachers' },
    { label: 'Class Schedules', icon: BookOpenIcon, href: '/owner/classes' },
    { label: 'Attendance', icon: CheckCircleIcon, href: '/owner/attendance' },
    { label: 'Marks Entry', icon: ClipboardDocumentListIcon, href: '/owner/marks' },
    { label: 'Fees & Payments', icon: CurrencyDollarIcon, href: '/owner/fees' },
    { label: 'Examinations', icon: ClipboardDocumentListIcon, href: '/owner/exams' },
    { label: 'Results', icon: AcademicCapIcon, href: '/owner/results' },
    { label: 'Reports', icon: BuildingLibraryIcon, href: '/owner/reports' },
    { label: 'Notices', icon: MegaphoneIcon, href: '/owner/notices' },
    { label: 'Passout Students', icon: UserGroupIcon, href: '/owner/passout' },
  ];

  const teacherLinks = [
    { label: 'Dashboard', icon: ChartBarIcon, href: '/teacher/dashboard' },
    { label: 'My Classes', icon: BuildingLibraryIcon, href: '/teacher/classes' },
    { label: 'Attendance', icon: UsersIcon, href: '/teacher/attendance' },
    { label: 'Examinations', icon: ClipboardDocumentListIcon, href: '/teacher/exams' },
    { label: 'Assignments', icon: AcademicCapIcon, href: '/teacher/assignments' },
    { label: 'Marks Entry', icon: ClipboardDocumentListIcon, href: '/teacher/marks' },
  ];

  const studentLinks = [
    { label: 'Dashboard', icon: ChartBarIcon, href: '/student/dashboard' },
    { label: 'Marksheet', icon: AcademicCapIcon, href: '/student/marksheet' },
    { label: 'Assignments', icon: ClipboardDocumentListIcon, href: '/student/assignments' },
    { label: 'Routine', icon: CalendarIcon, href: '/student/routine' },
    { label: 'Fees', icon: CurrencyDollarIcon, href: '/student/fees' },
  ];

  let navLinks = ownerLinks;
  let roleLabel = 'Owner';
  if (session?.user?.role === 'TEACHER') { navLinks = teacherLinks; roleLabel = 'Teacher'; }
  else if (session?.user?.role === 'STUDENT') { navLinks = studentLinks; roleLabel = 'Student'; }

  const isActive = (href) => pathname.startsWith(href);

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar Container */}
      <aside
        className={`
          fixed top-0 left-0 bottom-0 z-50 w-72 bg-slate-900 text-white transition-all duration-300 ease-in-out border-r border-slate-800 flex flex-col
          ${isOpen ? 'translate-x-0 shadow-2xl shadow-black/50' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo Section */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-white shadow-lg shadow-blue-900/20 shrink-0">
              <Image src="/images/logo.png" alt="Logo" width={100} height={40} className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="text-lg font-black tracking-tight text-white leading-none">Everest View</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">School ERP — {roleLabel}</div>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)} 
            className="lg:hidden p-2 rounded-xl hover:bg-slate-800 transition-colors text-slate-400"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 py-8 px-4 space-y-1 overflow-y-auto scrollbar-hide">
          <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">{roleLabel} Menu</p>
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className={`
                group flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-300
                ${isActive(link.href) 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
              `}
            >
              <link.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive(link.href) ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'}`} />
              {link.label}
            </Link>
          ))}
        </nav>

        {/* User Profile Section */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/40 border border-slate-800/50">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-white shadow-lg shadow-blue-900/20 shrink-0">
              <Image src="/images/logo.png" alt="Logo" width={100} height={40} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{session?.user?.name ?? 'Administrator'}</p>
              <p className="text-[10px] text-slate-500 font-medium truncate uppercase tracking-tighter">{session?.user?.role ?? 'Owner'}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="p-2 rounded-xl hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors group"
              title="Sign out"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
