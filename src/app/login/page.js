"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  // If already logged in, redirect to respective dashboard
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role) {
      if (session.user.role === "OWNER") router.push("/owner/dashboard");
      else if (session.user.role === "TEACHER") router.push("/teacher/dashboard");
      else if (session.user.role === "STUDENT") router.push("/student/dashboard");
      else router.push("/");
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
      // The useEffect above will handle the redirection once the session updates
      router.refresh();
    } else {
      alert("Invalid credentials. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50">

      {/* LEFT SaaS IMAGE SECTION */}
      <div className="relative w-full lg:w-1/ h-72 lg:h-screen overflow-hidden">

        <Image
          src="/images/image.png"
          alt="School"
          fill
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
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-16">

        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 border border-slate-100">

          <h2 className="text-2xl font-bold text-slate-900 text-center">
            Login to ERP
          </h2>

          <p className="text-sm text-slate-500 text-center mt-2">
            Teacher / Student / Admin Access
          </p>

          <form onSubmit={handleLogin} className="mt-8 space-y-5">

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
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>


            {/* Password */}
            <div>
              <label className="text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                type="password"
                className="w-full mt-1 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {/* Note */}
          <p className="text-xs text-slate-400 text-center mt-6">
            Only school admin can create teacher & student accounts
          </p>

        </div>
      </div>
    </div>
  );
}