'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Minimize2,
  Maximize2,
  Cpu,
  Layers,
  Activity,
  Crosshair,
  Compass,
  Zap,
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
        initial={{ opacity: 0.9, scale: 0.99 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0.9, scale: 0.99 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className={`relative overflow-hidden transition-all duration-300 font-mono ${
          isFullScale
            ? 'fixed inset-0 z-50 h-screen w-screen bg-[#03060f] p-0 m-0'
            : 'relative w-full h-[65vh] sm:h-[75vh] md:h-[calc(100vh-140px)] min-h-[500px] rounded-2xl border border-cyan-500/30 bg-[#03060f] shadow-2xl'
        }`}
      >
        {/* Full-Scale Command Center Top Status Bar */}
        <div className="pointer-events-none absolute top-3 left-3 right-3 sm:top-4 sm:left-4 sm:right-4 z-30 flex items-center justify-between gap-3">
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
