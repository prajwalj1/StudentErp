"use client";
import React, { useState } from "react";
import {
  EnvelopeIcon,
  PhoneIcon,
  PaperAirplaneIcon,
  ChatBubbleBottomCenterTextIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ShieldCheckIcon,
  CheckCircleIcon
} from "@heroicons/react/24/outline";

const departments = [
  { id: "admissions", name: "Admissions", icon: AcademicCapIcon, color: "blue" },
  { id: "support", name: "Technical Support", icon: ShieldCheckIcon, color: "indigo" },
  { id: "general", name: "General Inquiry", icon: UserGroupIcon, color: "amber" },
];

export default function ContactSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    department: "general",
    message: ""
  });
  const [status, setStatus] = useState("idle");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        setStatus("success");
        setFormData({ name: "", email: "", department: "general", message: "" });
        setTimeout(() => setStatus("idle"), 5000);
      } else {
        setStatus("error");
      }
    } catch (error) {
      setStatus("error");
    }
  };

  return (
    <section id="contact" className="relative py-24 bg-white overflow-hidden">
      {/* Background */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none z-0"
           style={{ backgroundImage: `radial-gradient(#000 1px, transparent 1px)`, backgroundSize: '30px 30px' }} />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-start">

          {/* Left Column: Content & Brand */}
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-600/5 border border-blue-600/10 rounded-full">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Connect with Us</span>
              </div>

              <h2 className="text-4xl lg:text-6xl font-extrabold text-slate-900 leading-[1.1] tracking-tight">
                We're here to <br />
                <span className="text-primary italic">support</span> your journey.
              </h2>

              <p className="text-base text-slate-500 max-w-lg leading-relaxed">
                Whether you're a parent looking for admissions or a school owner interested in our ERP, our specialized departments are ready to assist.
              </p>
            </div>

            {/* Quick Stats/Trust Signals */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all group">
                <div className="text-2xl font-black text-slate-900 mb-0.5 group-hover:text-primary transition-colors">24/7</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Expert Support</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group">
                <div className="text-2xl font-black text-slate-900 mb-0.5 group-hover:text-indigo-600 transition-colors">&lt; 2hr</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Response Time</div>
              </div>
            </div>

            {/* Contact Details */}
            <div className="flex gap-6">
              <div className="flex items-center gap-3 text-slate-600 group cursor-pointer w-fit">
                <div className="w-9 h-9 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                  <EnvelopeIcon className="w-4 h-4" />
                </div>
                <span className="font-semibold text-xs">support@everestview.edu.np</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600 group cursor-pointer w-fit">
                <div className="w-9 h-9 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                  <PhoneIcon className="w-4 h-4" />
                </div>
                <span className="font-semibold text-xs">+977 1-4567890</span>
              </div>
            </div>
          </div>

          {/* Right Column: Form */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-tr from-blue-100 to-indigo-50 rounded-[3rem] blur-2xl opacity-50 -z-10" />

            <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100">
              <form onSubmit={handleSubmit} className="space-y-5">

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Select Department</label>
                  <div className="grid grid-cols-3 gap-2">
                    {departments.map((dept) => {
                      const Icon = dept.icon;
                      return (
                        <button
                          key={dept.id}
                          type="button"
                          onClick={() => setFormData({...formData, department: dept.id})}
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                            formData.department === dept.id
                            ? "border-primary bg-primary/5 text-primary shadow-sm"
                            : "border-slate-50 bg-slate-50/50 text-slate-400 hover:border-slate-200"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-[9px] font-bold uppercase tracking-wider">{dept.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="group">
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Your Full Name"
                      className="w-full px-0 py-3 bg-transparent border-b-2 border-slate-100 focus:border-primary focus:outline-none transition-colors placeholder:text-slate-300 font-medium text-base"
                    />
                  </div>
                  <div className="group">
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="Work Email Address"
                      className="w-full px-0 py-3 bg-transparent border-b-2 border-slate-100 focus:border-primary focus:outline-none transition-colors placeholder:text-slate-300 font-medium text-base"
                    />
                  </div>
                  <div className="group">
                    <textarea
                      rows={2}
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      placeholder="How can we help you today?"
                      className="w-full px-0 py-3 bg-transparent border-b-2 border-slate-100 focus:border-primary focus:outline-none transition-colors placeholder:text-slate-300 font-medium text-base resize-none"
                    ></textarea>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={status === "sending"}
                  className={`w-full py-3.5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all duration-500 group overflow-hidden relative ${
                    status === "sending"
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "bg-slate-900 text-white hover:bg-black shadow-xl hover:shadow-2xl"
                  }`}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {status === "sending" ? (
                      <div className="w-5 h-5 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <PaperAirplaneIcon className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        Send Message
                      </>
                    )}
                  </span>
                </button>

                {status === "success" && (
                  <div className="flex items-center gap-3 text-green-600 bg-green-50 p-3 rounded-2xl animate-in fade-in slide-in-from-bottom-2">
                    <CheckCircleIcon className="w-4 h-4" />
                    <p className="text-xs font-bold tracking-tight">Success! We'll be in touch very soon.</p>
                  </div>
                )}
              </form>
            </div>

            <div className="absolute -bottom-4 -right-4 md:right-8 bg-indigo-600 text-white p-3 rounded-2xl shadow-2xl flex items-center gap-2 shadow-indigo-200">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                <ChatBubbleBottomCenterTextIcon className="w-3.5 h-3.5" />
              </div>
              <div className="text-[9px] font-bold uppercase leading-tight">
                Average response <br /> under 15 mins
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
