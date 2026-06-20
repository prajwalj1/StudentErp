"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  // If already logged in, redirect to respective dashboard (replace so back doesn't loop)
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role) {
      if (session.user.role === "OWNER") router.replace("/owner/dashboard");
      else if (session.user.role === "TEACHER") router.replace("/teacher/dashboard");
      else if (session.user.role === "STUDENT") router.replace("/student/dashboard");
      else router.replace("/");
    }
  }, [status, session, router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await signIn("credentials", {
      redirect: false,
      identifier,
      password,
    });

    if (result?.ok) {
      sessionStorage.removeItem('noticePopupShown');
      setLoginSuccess(true);
      setTimeout(() => {
        const callbackUrl = new URLSearchParams(window.location.search).get("callbackUrl");
        if (callbackUrl) {
          window.location.href = callbackUrl;
        } else {
          router.replace("/");
        }
      }, 1500);
    } else {
      setError("Invalid credentials. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 overflow-hidden">

      {/* LEFT SaaS IMAGE SECTION */}
      <div className="relative w-full lg:w-1/2 h-72 lg:h-screen overflow-hidden animate-slideInLeft">

        <Image
          src="/images/image.png"
          alt="School"
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover scale-105"
          priority
        />

        {/* Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/40 to-black/70" />

        {/* Floating blur effects */}
        <div className="absolute top-10 left-10 w-40 h-40 bg-blue-500/30 blur-3xl rounded-full animate-pulse" />
        <div className="absolute bottom-10 right-10 w-52 h-52 bg-indigo-500/20 blur-3xl rounded-full animate-pulse" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-10">

          {/* Glass badge */}
          <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 w-fit">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-xs text-white font-medium tracking-wide">
              Smart ERP Platform
            </span>
          </div>

          <h1 className="text-white text-4xl lg:text-5xl font-extrabold leading-tight">
            Everest View <br />
            <span className="text-blue-300">School ERP</span>
          </h1>

          <p className="text-white/80 mt-3 text-sm max-w-md leading-relaxed">
            A modern digital system for attendance, exams, fees, and academic management —
            built for future-ready education.
          </p>
        </div>
      </div>

      {/* RIGHT LOGIN PANEL */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-16 animate-slideInRight">

        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 border border-slate-100">

          <h2 className="text-2xl font-bold text-slate-900 text-center">
            Login to ERP
          </h2>

          <p className="text-sm text-slate-500 text-center mt-2">
            Teacher / Student / Admin Access
          </p>

          <form onSubmit={handleLogin} className="mt-8 space-y-5">

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium animate-shake">
                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Identifier (Email or ID) */}
            <div>
              <label className="text-sm font-medium text-slate-700">
                Email, ID or Student ID
              </label>
              <input
                type="text"
                className="w-full mt-1 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter email or ID"
                value={identifier}
                onChange={(e) => { setIdentifier(e.target.value); setError(""); }}
              />
            </div>


            {/* Password */}
            <div>
              <label className="text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full px-4 py-3 pr-12 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
            >
              {loading ? "Logging in..." : <span className="flex items-center justify-center gap-2">Login <ArrowRightIcon className="w-4 h-4" /></span>}
            </button>
          </form>

          {/* Note */}
          <p className="text-xs text-slate-400 text-center mt-6">
            Only school admin can create teacher & student accounts
          </p>

        </div>
      </div>
      {/* Success Overlay */}
      {loginSuccess && (
        <div className="fixed inset-0 z-50 bg-white/90 backdrop-blur-sm flex items-center justify-center animate-fadeIn">
          <div className="text-center animate-scaleIn">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Welcome back!</h2>
            <p className="text-slate-500 mt-1">Redirecting to your dashboard...</p>
          </div>
        </div>
      )}
    </div>
  );
}