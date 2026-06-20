"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  StarIcon,
  AcademicCapIcon,
  UserGroupIcon,
  TrophyIcon,
  SparklesIcon,
} from "@heroicons/react/24/solid";

// Counter component with IntersectionObserver
const Counter = ({ end, duration = 2000 }) => {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStarted(true); observer.disconnect(); } },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let startTime;
    let animationFrame;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const nextCount = Math.min(Math.floor((progress / duration) * end), end);
      setCount(nextCount);
      if (progress < duration) animationFrame = requestAnimationFrame(animate);
    };
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [started, end, duration]);

  return <span ref={ref}>{count.toLocaleString()}</span>;
};

export default function Hero() {
  return (
    <section className="relative min-h-screen lg:min-h-[90vh] flex items-center bg-[#f4f7ff] overflow-hidden pt-28 pb-12 px-6">
      {/* Background Blur */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[30%] h-[30%] bg-blue-200/30 rounded-full blur-[80px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-indigo-200/30 rounded-full blur-[80px]" />
      </div>

      <div className="relative z-10 max-w-7xl w-full grid lg:grid-cols-2 gap-12 items-center">
        {/* LEFT */}
        <div className="flex flex-col text-center lg:text-left animate-slideUp">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-full w-fit mx-auto lg:mx-0 shadow-sm">
            <SparklesIcon className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
              Next-Gen Learning Platform
            </span>
          </div>

          <div className="mt-3 space-y-2">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] text-secondary tracking-tight">
              Everest View <br />
              <span className="text-primary">Boarding School</span>
            </h1>

            <p className="text-xl sm:text-2xl font-serif italic text-blue-600 leading-relaxed">
              &ldquo;Unity of Nation &amp; Purity of Knowledge&rdquo;
            </p>
          </div>

          <p className="mt-3 text-base text-muted max-w-xl mx-auto lg:mx-0 leading-relaxed">
            The most advanced Student ERP for modern education. Streamline attendance,
            automate fee management, and track academic excellence in one powerful SaaS platform.
          </p>

          <div className="mt-4 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center">
            <a
              href="/login"
              className="px-8 py-3.5 bg-primary text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 hover:-translate-y-1 transition-all duration-300 text-sm inline-block text-center"
            >
              Get Started Free
            </a>
            <button
              onClick={() => document.getElementById("team")?.scrollIntoView({ behavior: "smooth" })}
              className="px-8 py-3.5 bg-white text-secondary font-bold rounded-xl border border-slate-200 hover:border-primary transition-all duration-300 text-sm"
            >
              Learn More
            </button>
          </div>

          {/* STATS */}
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-6 max-w-lg mx-auto lg:mx-0">
            <div>
              <div className="text-xl font-black text-secondary">
                <Counter end={5000} />+
              </div>
              <p className="text-[11px] text-muted font-medium flex items-center justify-center lg:justify-start gap-1">
                <AcademicCapIcon className="w-3 h-3 text-primary" /> Students
              </p>
            </div>

            <div>
              <div className="text-xl font-black text-secondary">
                <Counter end={150} />+
              </div>
              <p className="text-[11px] text-muted font-medium flex items-center justify-center lg:justify-start gap-1">
                <UserGroupIcon className="w-3 h-3 text-primary" /> Faculty
              </p>
            </div>

            <div>
              <div className="text-xl font-black text-secondary">
                <Counter end={45} />+
              </div>
              <p className="text-[11px] text-muted font-medium flex items-center justify-center lg:justify-start gap-1">
                <TrophyIcon className="w-3 h-3 text-primary" /> Awards
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT IMAGE */}
        <div className="relative group max-w-lg mx-auto lg:ml-auto animate-fadeIn" style={{ animationDelay: '0.3s' }}>
          <div className="relative rounded-[2rem] overflow-hidden shadow-xl border-[8px] border-white/50 bg-white">
            <Image
              src="/images/info.jpeg"
              alt="School Students"
              width={600}
              height={600}
              className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700"
              priority
            />
          </div>

          {/* Floating Card */}
          <div className="absolute -bottom-3 -left-3 lg:-left-5 z-20 bg-slate-900/70 backdrop-blur-xl rounded-2xl p-3 shadow-2xl flex items-center gap-3 border border-white/10">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center relative">
              <AcademicCapIcon className="w-6 h-6 text-white" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center border border-slate-900">
                <StarIcon className="w-2.5 h-2.5 text-white" />
              </div>
            </div>

            <div>
              <h4 className="font-bold text-sm text-white leading-tight">
                Top Rated School
              </h4>
              <p className="text-[9px] font-medium text-amber-400/90 mt-0.5">
                #1 Excellence
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}