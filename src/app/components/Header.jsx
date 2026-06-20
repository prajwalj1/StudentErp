'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import {
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';

const Header = () => {
  const { data: session } = useSession();
  const pathname = usePathname();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (pathname === '/login') return null;

  const role = session?.user?.role;

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Features', href: '/#features' },
    { name: 'Virtual Tour', href: '/#virtual-tour' },
    { name: 'About', href: '/#about' },
    { name: 'Contact', href: '/#contact' },
  ];

  return (
    <>
    <header
      className={`fixed top-0 left-0 w-full z-50 animate-slideInDown transition-all duration-500 ${
        isScrolled
          ? 'bg-white/80 backdrop-blur-2xl shadow-lg border-b border-slate-200/50 py-3'
          : 'bg-white/80 backdrop-blur-md border-b border-slate-200/30 py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between relative">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-14 h-14 rounded-2xl overflow-hidden shadow-lg ring-2 ring-blue-100 bg-white">
              <Image
                src="/images/logo.png"
                alt="Everest View Secondary Boarding School"
                fill
                sizes="56px"
                className="object-cover"
                priority
              />
            </div>

            <div className="hidden lg:block leading-tight">
              <h1 className="text-lg lg:text-2xl font-black tracking-tight text-slate-900 font-headline">
                Everest View Secondary Boarding School
              </h1>
              <p className="text-xs lg:text-sm text-slate-500 font-medium">
                EVSBS [ERP]
              </p>
            </div>
          </Link>

          {/* Mobile Center Title */}
          <div className="lg:hidden absolute left-1/2 -translate-x-1/2 text-center leading-tight max-w-[60%]">
            <h1 className="text-[15px] sm:text-xs md:text-sm font-black tracking-tight text-slate-900 font-headline truncate">
              Everest View Secondary Boarding School
            </h1>
            <p className="text-[9px] sm:text-[10px] text-slate-500 font-medium">
              EVSBS [ERP]
            </p>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link, i) => (
              <Link
                key={i}
                href={link.href}
                className="text-slate-700 hover:text-blue-600 font-semibold transition-colors duration-300 whitespace-nowrap"
              >
                {link.name}
              </Link>
            ))}

            {!session && (
              <Link
                href="/login"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg hover:scale-105 transition-all duration-300 flex items-center gap-2"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                Sign In
              </Link>
            )}

            {role === 'OWNER' && (
              <Link href="/owner/dashboard" className="text-slate-700 hover:text-blue-600 font-semibold whitespace-nowrap">
                Dashboard
              </Link>
            )}

            {role === 'TEACHER' && (
              <Link href="/teacher/dashboard" className="text-slate-700 hover:text-blue-600 font-semibold whitespace-nowrap">
                Teacher Dashboard
              </Link>
            )}

            {role === 'STUDENT' && (
              <Link href="/student/dashboard" className="text-slate-700 hover:text-blue-600 font-semibold whitespace-nowrap">
                Student Dashboard
              </Link>
            )}

            {session && (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900 leading-tight whitespace-nowrap">{session?.user?.name}</p>
                  <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tight">{role}</p>
                </div>
                <button
                  onClick={() => setShowLogoutModal(true)}
                  className="relative w-10 h-10 rounded-xl overflow-hidden ring-2 ring-slate-200 hover:ring-red-300 transition-all shrink-0"
                >
                  <Image src="/images/logo.png" alt="Logout" fill sizes="40px" className="object-cover" />
                </button>
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden w-11 h-11 rounded-xl bg-white shadow-md flex items-center justify-center text-slate-800"
          >
            {isMenuOpen ? (
              <XMarkIcon className="w-6 h-6" />
            ) : (
              <Bars3Icon className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={`lg:hidden overflow-hidden transition-all duration-500 ${
            isMenuOpen ? 'max-h-[500px] opacity-100 mt-5' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="bg-white/90 backdrop-blur-2xl border border-slate-200 rounded-3xl shadow-2xl p-6 flex flex-col gap-5">
            {navLinks.map((link, i) => (
              <Link
                key={i}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className="text-slate-700 font-semibold hover:text-blue-600 transition"
              >
                {link.name}
              </Link>
            ))}

            {!session && (
              <Link
                href="/login"
                onClick={() => setIsMenuOpen(false)}
                className="w-full text-center py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold flex items-center justify-center gap-2"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                Sign In
              </Link>
            )}

            {session && (
              <button
                onClick={() => setShowLogoutModal(true)}
                className="w-full py-3 rounded-xl bg-red-500 text-white font-semibold flex items-center justify-center gap-2"
              >
                <div className="relative w-5 h-5 rounded overflow-hidden bg-white/20 flex-shrink-0">
                  <Image src="/images/logo.png" alt="" fill sizes="20px" className="object-cover" />
                </div>
                Logout
              </button>
            )}
          </div>
        </div>
      </div>
    </header>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowLogoutModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center" onClick={e => e.stopPropagation()}>
            <div className="relative w-16 h-16 mx-auto mb-4 rounded-2xl overflow-hidden ring-2 ring-slate-100">
              <Image src="/images/logo.png" alt="" fill sizes="64px" className="object-cover" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Do you want to really logout?</h3>
            <p className="text-sm text-slate-500 mb-6">You will be redirected to the login page.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-all text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowLogoutModal(false); signOut({ callbackUrl: '/' }); }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-all text-sm"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;