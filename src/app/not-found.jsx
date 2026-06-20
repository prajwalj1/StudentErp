"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50 relative overflow-hidden px-6">

      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-indigo-200/30 blur-[160px] rounded-full" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-200/30 blur-[160px] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-br from-indigo-100/10 to-transparent blur-3xl rounded-full" />
      </div>

      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234f46e5' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 max-w-2xl w-full text-center">

        {/* Status Code */}
        <div className="relative inline-block mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 via-blue-500/10 to-indigo-600/10 blur-3xl rounded-full" />
          <h1 className="relative text-[150px] md:text-[200px] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-900 select-none drop-shadow-sm">
            404
          </h1>
        </div>

        {/* Error Indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-slate-300" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.25em]">Page Not Found</span>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-slate-300" />
        </div>

        <div className="space-y-6">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            This page does not exist
          </h2>

          <p className="text-slate-500 text-lg max-w-md mx-auto leading-relaxed">
            The resource you requested could not be located. It may have been moved, deleted, or the address may be incorrect.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <Link
              href="/"
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200/50 hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-300/50 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
            >
              <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </Link>

            <Link
              href="/#contact"
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 hover:border-slate-300 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
            >
              <svg className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Contact Us
            </Link>
          </div>

          {/* Quick Links */}
          <div className="pt-10">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
              Try these instead
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
              {[
                { href: "/login", label: "Sign In" },
                { href: "/owner/dashboard", label: "Admin Portal" },
                { href: "/teacher/dashboard", label: "Teacher Portal" },
                { href: "/student/dashboard", label: "Student Portal" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline underline-offset-4 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-slate-200/50">
          <p className="text-slate-400 text-xs font-medium">
            &copy; {new Date().getFullYear()} Everest View Secondary Boarding School &mdash; All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
