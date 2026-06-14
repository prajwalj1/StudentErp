"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";

const locations = [
  {
    id: "school-gate",
    name: "School Gate",
    yaw: 10,
    pitch: -5,
    description: "The grand entrance gate of Everest View Boarding School.",
    icon: "🚪"
  },
  {
    id: "playground",
    name: "Playground",
    yaw: 80,
    pitch: -15,
    description: "Sprawling sports ground for football, basketball, athletics, and outdoor activities.",
    icon: "⚽"
  },
  {
    id: "canteen",
    name: "Canteen",
    yaw: 140,
    pitch: -5,
    description: "Hygienic and spacious cafeteria serving nutritious meals to students.",
    icon: "🍽️"
  },
  {
    id: "classroom",
    name: "Classroom",
    yaw: 200,
    pitch: -5,
    description: "Modern, well-lit classrooms with smart boards and digital learning aids.",
    icon: "📚"
  },
  {
    id: "principal-office",
    name: "Principal Office",
    yaw: 260,
    pitch: -2,
    description: "The administrative hub where student records and school operations are managed.",
    icon: "📋"
  },
  {
    id: "library",
    name: "Library",
    yaw: 320,
    pitch: -10,
    description: "A vast collection of books, reference materials, and digital resources.",
    icon: "📖"
  }
];

export default function VirtualTour() {
  const viewerRef = useRef(null);
  const viewerInstance = useRef(null);
  const viewPollRef = useRef(null);
  const tourRef = useRef(null);
  const lastManualRef = useRef(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeLocation, setActiveLocation] = useState(locations[0]);
  const [tourActive, setTourActive] = useState(false);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js";
    script.async = true;
    script.onload = () => setIsLoaded(true);
    document.head.appendChild(script);

    return () => {
      const s = document.querySelector('script[src*="pannellum.js"]');
      const l = document.querySelector('link[href*="pannellum.css"]');
      if (l) document.head.removeChild(l);
      if (s) document.head.removeChild(s);
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !window.pannellum) return;

    const viewer = window.pannellum.viewer(viewerRef.current, {
      type: "equirectangular",
      panorama: "/images/school.jpeg",
      autoLoad: true,
      autoRotate: -2,
      autoRotateInactivityDelay: 5000,
      showControls: true,
      compass: true,
      hfov: 110,
      minHfov: 50,
      maxHfov: 150,
      hotSpots: locations.map((loc) => ({
        pitch: loc.pitch,
        yaw: loc.yaw,
        type: "info",
        text: `${loc.icon} ${loc.name}`,
        cssClass: "custom-hotspot",
        createTooltip: true,
      }))
    });

    viewerInstance.current = viewer;

    const getAngularDistance = (a, b) => {
      const d = Math.abs(a - b);
      return Math.min(d, 360 - d);
    };

    const findClosestLocation = (currentYaw) => {
      let closest = locations[0];
      let minDist = Infinity;
      for (const loc of locations) {
        const dist = getAngularDistance(currentYaw, loc.yaw);
        if (dist < minDist) {
          minDist = dist;
          closest = loc;
        }
      }
      return { location: closest, distance: minDist };
    };

    const onLoad = () => {
      const container = viewerRef.current;
      if (!container) return;

      const handleHotspotClick = (e) => {
        const base = e.target.closest(".pnlm-hotspot-base");
        if (!base) return;
        const textEl = base.querySelector(".pnlm-tooltip-text");
        if (!textEl) return;
        const match = locations.find((l) => textEl.textContent.includes(l.name));
        if (match) goToLocation(match);
      };
      container.addEventListener("click", handleHotspotClick);

      const pollView = () => {
        if (Date.now() - lastManualRef.current < 3000) return;
        const yaw = viewer.getYaw();
        if (yaw != null) {
          const { location, distance } = findClosestLocation(yaw);
          if (distance < 30) {
            setActiveLocation((prev) =>
              prev.id !== location.id ? location : prev
            );
          }
        }
      };

      viewPollRef.current = setInterval(pollView, 400);

      return () => {
        container.removeEventListener("click", handleHotspotClick);
        if (viewPollRef.current) clearInterval(viewPollRef.current);
      };
    };

    viewer.on("load", onLoad);

    return () => {
      viewer.off("load", onLoad);
      if (viewPollRef.current) clearInterval(viewPollRef.current);
      viewer.destroy();
      viewerInstance.current = null;
    };
  }, [isLoaded]);

  const goToLocation = useCallback((loc) => {
    lastManualRef.current = Date.now();
    setActiveLocation(loc);
    if (viewerInstance.current) {
      viewerInstance.current.lookAt(loc.pitch, loc.yaw, 110);
    }
  }, []);

  const tourActiveRef = useRef(false);

  const startGuidedTour = useCallback(() => {
    if (tourActiveRef.current) {
      if (tourRef.current) clearTimeout(tourRef.current);
      tourActiveRef.current = false;
      setTourActive(false);
      return;
    }

    tourActiveRef.current = true;
    setTourActive(true);
    let index = 0;

    const next = () => {
      if (!tourActiveRef.current) return;
      const loc = locations[index];
      lastManualRef.current = Date.now();
      setActiveLocation(loc);
      if (viewerInstance.current) {
        viewerInstance.current.lookAt(loc.pitch, loc.yaw, 110);
      }
      index++;
      if (index < locations.length) {
        tourRef.current = setTimeout(next, 3500);
      } else {
        tourRef.current = setTimeout(() => {
          tourActiveRef.current = false;
          setTourActive(false);
        }, 2000);
      }
    };

    tourRef.current = setTimeout(next, 500);
  }, []);

  return (
    <section id="virtual-tour" className="h-screen w-full bg-white overflow-hidden flex flex-col lg:flex-row">
      {/* 360 Viewer - Left Side */}
      <div className="relative flex-1 min-h-[60vh] lg:min-h-screen bg-slate-900">
        <div ref={viewerRef} className="w-full h-full bg-slate-800">
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-medium text-slate-400 italic">Preparing 360° experience...</p>
              </div>
            </div>
          )}
        </div>

        {/* Instruction Overlay */}
        <div className="absolute top-6 left-6 z-20 pointer-events-none">
          <div className="bg-black/50 backdrop-blur-sm text-white/80 px-4 py-2 rounded-full text-[10px] font-medium border border-white/10 flex items-center gap-2">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 013 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
            </svg>
            Click & drag to explore • Click markers for details
          </div>
        </div>

        {/* Mobile Location Bar */}
        <div className="absolute bottom-6 left-6 right-6 lg:hidden flex gap-2 overflow-x-auto pb-2 z-20 no-scrollbar">
          {locations.map((loc) => (
            <button
              key={loc.id}
              onClick={() => goToLocation(loc)}
              className={`whitespace-nowrap px-5 py-3 rounded-full text-xs font-bold transition-all duration-300 shadow-xl flex items-center gap-1.5 ${
                activeLocation.id === loc.id
                  ? "bg-blue-600 text-white scale-105"
                  : "bg-white/90 backdrop-blur-sm text-slate-700"
              }`}
            >
              <span>{loc.icon}</span>
              {loc.name}
            </button>
          ))}
        </div>
      </div>

      {/* Content Panel - Right Side */}
      <div className="w-full lg:w-96 xl:w-[420px] bg-white border-l border-slate-200 flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="p-8 pb-4 border-b border-slate-100 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 border border-blue-100 rounded-full mb-4">
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">360° Experience</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Explore Our <br /><span className="text-blue-600">School Campus</span>
          </h2>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            Navigate the 360° view to discover key locations around our school. Click a marker or select from the list below.
          </p>
        </div>

        {/* Active Location Detail */}
        <div className="p-8 pb-4">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">{activeLocation.icon}</span>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Currently Viewing</div>
              <h3 className="text-xl font-bold text-slate-900">{activeLocation.name}</h3>
            </div>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">{activeLocation.description}</p>
        </div>

        {/* All Locations List */}
        <div className="px-8 pb-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">All Locations</h4>
          <div className="flex flex-col gap-1.5">
            {locations.map((loc) => (
              <button
                key={loc.id}
                onClick={() => goToLocation(loc)}
                className={`group text-left p-3.5 rounded-xl transition-all duration-200 flex items-center gap-3 ${
                  activeLocation.id === loc.id
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span className="text-lg shrink-0">{loc.icon}</span>
                <div className="min-w-0">
                  <div className="font-bold text-sm">{loc.name}</div>
                  <div className={`text-[10px] leading-tight truncate ${
                    activeLocation.id === loc.id ? "text-blue-200" : "text-slate-400"
                  }`}>
                    {loc.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-auto p-8 pt-4 border-t border-slate-100">
          <button
            onClick={startGuidedTour}
            className={`w-full py-3 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2 ${
              tourActive
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-slate-900 hover:bg-black text-white"
            }`}
          >
            {tourActive && (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            )}
            {tourActive ? "Stop Guided Tour" : "Start Guided Tour"}
          </button>
          <p className="text-[10px] text-slate-400 text-center mt-3">
            {tourActive
              ? "Auto-navigating through all campus locations..."
              : "Let us guide you through every corner of our campus."}
          </p>
        </div>
      </div>

      <style jsx global>{`
        .pnlm-container {
          background-color: transparent !important;
        }
        .pnlm-panorama-container {
          border-radius: inherit;
        }
        .custom-hotspot {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(37, 99, 235, 0.9);
          border: 3px solid #fff;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.35), 0 4px 16px rgba(0,0,0,0.35);
          cursor: pointer;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
          position: relative;
          animation: hotspot-pulse 2.5s ease-in-out infinite;
        }
        .custom-hotspot:hover {
          transform: scale(1.35);
          box-shadow: 0 0 0 6px rgba(37, 99, 235, 0.5), 0 6px 24px rgba(0,0,0,0.4);
          animation: none;
        }
        .custom-hotspot::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 10px;
          height: 10px;
          background: #fff;
          border-radius: 50%;
          transform: translate(-50%, -50%);
        }
        @keyframes hotspot-pulse {
          0%, 100% { box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.35), 0 4px 16px rgba(0,0,0,0.35); }
          50% { box-shadow: 0 0 0 8px rgba(37, 99, 235, 0.15), 0 4px 16px rgba(0,0,0,0.35); }
        }
        .pnlm-hotspot-base.pnlm-tooltip-show {
          z-index: 1001;
        }
        .pnlm-tooltip-text {
          background: rgba(15, 23, 42, 0.92) !important;
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 12px !important;
          padding: 8px 14px !important;
          font-size: 13px !important;
          font-weight: 700 !important;
          color: #fff !important;
          line-height: 1.3 !important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.3);
          pointer-events: none;
          transform: translateY(-8px);
        }
        .pnlm-tooltip-text a { color: #93c5fd !important; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </section>
  );
}