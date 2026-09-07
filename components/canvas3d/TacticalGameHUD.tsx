'use client';

import React from 'react';
import {
  Activity,
  Layers,
  Crosshair,
  Maximize2,
  Cpu,
  Radio,
  Zap,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Spatial3DNodeData } from './types';

interface TacticalGameHUDProps {
  nodes: Spatial3DNodeData[];
  activeStationId: string;
  onSelectStation: (stationId: string) => void;
  onResetOverview: () => void;
  isStreaming?: boolean;
}

export function TacticalGameHUD({
  nodes,
  activeStationId,
  onSelectStation,
  onResetOverview,
  isStreaming = false,
}: TacticalGameHUDProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-3 sm:p-5 font-mono">
      {/* Top Telemetry Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left Flight Telemetry Card */}
        <div className="pointer-events-auto flex items-center gap-3 rounded-xl border border-cyan-500/30 bg-[#050811]/90 px-3.5 py-2 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center gap-2 text-cyan-400 font-bold border-r border-slate-800 pr-3">
            <Cpu className="h-4 w-4 animate-spin" style={{ animationDuration: '8s' }} />
            <span className="text-xs tracking-wider">SPATIAL HUD ENGINE</span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-300">
            <Radio className="h-3 w-3 text-emerald-400 animate-pulse" />
            <span className="text-slate-400">STATUS:</span>
            <span className={isStreaming ? 'text-emerald-400 font-bold' : 'text-cyan-300'}>
              {isStreaming ? 'LIVE SSE DATA STREAM' : 'SYSTEM SYNCHRONIZED'}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-[10px] text-slate-500 pl-2 border-l border-slate-800">
            <span>NODES:</span>
            <span className="text-slate-200 font-bold">{nodes.length}</span>
          </div>
        </div>

        {/* Right Station Navigation Cockpit */}
        <div className="pointer-events-auto flex items-center gap-1.5 rounded-xl border border-slate-800 bg-[#050811]/90 p-1 backdrop-blur-xl shadow-2xl">
          {/* Tactical Overview Button */}
          <button
            type="button"
            onClick={onResetOverview}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
              activeStationId === 'overview'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Overview</span>
          </button>

          {/* Individual Workstation Focus Tabs */}
          {nodes.map((node, i) => {
            const isSelected = activeStationId === node.id;
            return (
              <button
                key={node.id}
                type="button"
                onClick={() => onSelectStation(node.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg font-medium transition-all ${
                  isSelected
                    ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40 shadow-inner'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: node.accentColor || '#00f0ff' }}
                />
                <span className="hidden sm:inline">{node.title || `Node ${i + 1}`}</span>
                <span className="sm:hidden">{`N${i + 1}`}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={onResetOverview}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
            title="Reset Flight Vector"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Bottom Crosshair Flight Guidance */}
      <div className="flex items-end justify-between">
        <div className="pointer-events-auto hidden sm:flex items-center gap-2 rounded-lg border border-slate-800/80 bg-[#050811]/80 px-3 py-1.5 text-[10px] text-slate-400 backdrop-blur-md">
          <Crosshair className="h-3.5 w-3.5 text-cyan-400" />
          <span>DRAG TO ORBIT • SCROLL TO ZOOM • CLICK NODE FOR WORKSTATION INSPECTION</span>
        </div>

        {isStreaming && (
          <div className="pointer-events-auto flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-950/80 px-3 py-1.5 text-xs text-emerald-300 font-bold backdrop-blur-md animate-pulse">
            <Zap className="h-3.5 w-3.5 text-emerald-400" />
            <span>STREAMING REAL-TIME VERIFIED METRICS</span>
          </div>
        )}
      </div>
    </div>
  );
}
