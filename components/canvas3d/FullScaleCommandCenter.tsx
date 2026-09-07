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

  // Monitor simulated smooth framerate
  useEffect(() => {
    const interval = setInterval(() => {
      setFps(59 + Math.floor(Math.random() * 2));
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  // ESC key listener to exit full-scale mode cleanly
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullScale) {
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
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className={`relative overflow-hidden transition-all duration-300 font-mono ${
          isFullScale
            ? 'fixed inset-0 z-50 h-screen w-screen bg-[#03060f] p-0 m-0'
            : 'relative w-full h-[65vh] sm:h-[75vh] md:h-[calc(100vh-140px)] min-h-[500px] rounded-2xl border border-cyan-500/30 bg-[#03060f] shadow-2xl'
        }`}
      >
        {/* Futuristic Corner Reticle Crosshairs */}
        <div className="pointer-events-none absolute top-2 left-2 z-30 text-cyan-400/40 text-xs select-none">
          ┌─ TELEMETRY_GRID_V2
        </div>
        <div className="pointer-events-none absolute top-2 right-2 z-30 text-cyan-400/40 text-xs select-none">
          SYS_ACTIVE ─┐
        </div>
        <div className="pointer-events-none absolute bottom-2 left-2 z-30 text-cyan-400/40 text-xs select-none">
          └─ SPATIAL_COORDINATES
        </div>
        <div className="pointer-events-none absolute bottom-2 right-2 z-30 text-cyan-400/40 text-xs select-none">
          SECURE_STREAM ─┘
        </div>

        {/* Top Tactical Status Bar */}
        <div className="pointer-events-none absolute top-3 left-3 right-3 sm:top-5 sm:left-5 sm:right-5 z-30 flex items-center justify-between gap-3">
          {/* Left Command Indicator */}
          <div className="pointer-events-auto flex items-center gap-3 rounded-xl border border-cyan-500/30 bg-[#050811]/90 px-3.5 py-2 backdrop-blur-xl shadow-2xl text-xs text-slate-300">
            <div className="flex items-center gap-2 text-cyan-400 font-bold border-r border-slate-800 pr-3">
              <Compass className="h-4 w-4 text-cyan-400 animate-spin" style={{ animationDuration: '10s' }} />
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
              <span className="text-cyan-300 font-bold">{fps}</span>
            </div>
          </div>

          {/* Right Controls: Fullscreen Toggle */}
          <div className="pointer-events-auto flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-[#050811]/90 p-1.5 backdrop-blur-xl shadow-2xl">
            <button
              type="button"
              onClick={onToggleFullScale}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all border ${
                isFullScale
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                  : 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20 hover:bg-cyan-400'
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
                  <span>Enter Full-Scale</span>
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
