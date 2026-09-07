'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Minimize2,
  Maximize2,
  Cpu,
  Layers,
  Activity,
  Crosshair,
  Compass,
  Radio,
  Zap,
  Terminal,
  Scan,
} from 'lucide-react';
import { Spatial3DNodeData } from './types';

interface FullScaleCommandCenterProps {
  isFullScale: boolean;
  onToggleFullScale: () => void;
  nodes: Spatial3DNodeData[];
  children: React.ReactNode;
}

export function FullScaleCommandCenter({
  isFullScale,
  onToggleFullScale,
  nodes,
  children,
}: FullScaleCommandCenterProps) {
  const [fps, setFps] = useState(60);

  // Lock body scroll during full-scale mode
  useEffect(() => {
    if (isFullScale) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullScale]);

  // Monitor simulated framerate
  useEffect(() => {
    const interval = setInterval(() => {
      setFps(59 + Math.floor(Math.random() * 2));
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut listeners (ESC to minimize, F to toggle fullscale)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === 'Escape' && isFullScale) {
        onToggleFullScale();
      }
      if ((e.key === 'f' || e.key === 'F') && !e.ctrlKey && !e.metaKey) {
        onToggleFullScale();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScale, onToggleFullScale]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        layout
        initial={{ opacity: 0.95, scale: 0.995 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0.95, scale: 0.995 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className={`relative overflow-hidden transition-all duration-300 font-mono ${
          isFullScale
            ? 'fixed inset-0 z-50 h-screen w-screen bg-[#030712] p-0 m-0'
            : 'relative w-full h-[65vh] sm:h-[75vh] md:h-[calc(100vh-140px)] min-h-[500px] rounded-2xl border border-sky-400/30 bg-[#030712] shadow-2xl shadow-black/60'
        }`}
      >
        {/* Subtle Cybernetic Scanlines */}
        <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(56,189,248,0.08),rgba(255,255,255,0))]" />

        {/* Futuristic Corner Reticle Crosshairs */}
        <div className="pointer-events-none absolute top-2.5 left-3 z-30 text-sky-400/50 text-[10px] select-none tracking-widest flex items-center gap-1">
          <Scan className="w-3 h-3 text-sky-400/70" />
          <span>TELEMETRY_WORKSPACE // V3.0</span>
        </div>
        <div className="pointer-events-none absolute top-2.5 right-3 z-30 text-sky-400/50 text-[10px] select-none tracking-widest">
          SYS_ONLINE [60FPS] ─┐
        </div>
        <div className="pointer-events-none absolute bottom-2.5 left-3 z-30 text-sky-400/50 text-[10px] select-none tracking-widest">
          └─ SPATIAL_COORDINATES
        </div>
        <div className="pointer-events-none absolute bottom-2.5 right-3 z-30 text-sky-400/50 text-[10px] select-none tracking-widest">
          DOUBLE-CLICK TO TOGGLE ─┘
        </div>

        {/* Top Tactical Status Bar */}
        <div className="pointer-events-none absolute top-4 left-4 right-4 sm:top-5 sm:left-6 sm:right-6 z-30 flex items-center justify-between gap-3">
          {/* Left Command Indicator */}
          <div className="pointer-events-auto flex items-center gap-3 rounded-xl border border-sky-500/30 bg-slate-950/80 px-3.5 py-2 backdrop-blur-xl shadow-2xl text-xs text-slate-300">
            <div className="flex items-center gap-2 text-sky-400 font-bold border-r border-slate-800 pr-3">
              <Compass className="h-4 w-4 text-sky-400 animate-spin" style={{ animationDuration: '10s' }} />
              <span className="tracking-wider">
                {isFullScale ? 'SPATIAL COMMAND CENTER [FULL-SCALE]' : '3D SPATIAL WORKSTATION'}
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>LIVE TELEMETRY</span>
            </div>

            <div className="hidden md:flex items-center gap-2 text-[10px] text-slate-500 pl-2 border-l border-slate-800">
              <span>FPS:</span>
              <span className="text-sky-300 font-bold">{fps}</span>
            </div>
          </div>

          {/* Right Controls: Fullscreen Toggle */}
          <div className="pointer-events-auto flex items-center gap-2 rounded-xl border border-sky-500/30 bg-slate-950/80 p-1.5 backdrop-blur-xl shadow-2xl">
            <button
              type="button"
              onClick={onToggleFullScale}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all border ${
                isFullScale
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                  : 'bg-sky-500 text-slate-950 border-sky-400 shadow-md shadow-sky-500/20 hover:bg-sky-400'
              }`}
            >
              {isFullScale ? (
                <>
                  <Minimize2 className="h-3.5 w-3.5" />
                  <span>Exit Full-Scale (ESC)</span>
                </>
              ) : (
                <>
                  <Maximize2 className="h-3.5 w-3.5" />
                  <span>Enter Full-Scale [F]</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Core 3D Canvas Child Component */}
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
