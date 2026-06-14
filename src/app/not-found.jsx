"use client";

import Link from 'next/link';
import Image from 'next/image';


export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden px-6">
      
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/40 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-200/40 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="relative z-10 max-w-2xl w-full text-center">
        
        {/* Animated 404 Text */}
        <div className="relative inline-block mb-8">
          <h1 className="text-[120px] md:text-[180px] font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-800 leading-none select-none">
            404
          </h1>
          <div className="absolute -top-4 -right-4 w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center border border-slate-100 rotate-12 animate-bounce">
            <span className="text-2xl">🔍</span>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Lost in the Cloud?
          </h2>
          
          <p className="text-slate-500 text-lg md:text-xl max-w-lg mx-auto leading-relaxed">
            The page you're looking for has moved to a higher altitude or never existed in our ERP universe.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Link 
              href="/"
              className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:scale-105 transition-all duration-300 active:scale-95"
            >
              Back to Dashboard
            </Link>
            
            <Link 
              href="/contact"
              className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 hover:border-slate-300 transition-all duration-300"
            >
              Report an Issue
            </Link>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-16 pt-8 border-t border-slate-200/50">
          <p className="text-slate-400 text-sm font-medium">
            &copy; {new Date().getFullYear()} Everest View Secondary Boarding School
          </p>
        </div>
      </div>

      {/* Floating Micro-elements */}
      <div className="hidden lg:block absolute top-1/4 left-1/4 animate-float opacity-20">
        <div className="w-12 h-12 border-2 border-indigo-500 rounded-full" />
      </div>
      <div className="hidden lg:block absolute bottom-1/4 right-1/4 animate-float opacity-20" style={{ animationDelay: '2s' }}>
        <div className="w-8 h-8 bg-blue-500 rotate-45" />
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
