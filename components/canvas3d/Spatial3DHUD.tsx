'use client';

import React from 'react';
import {
  Compass,
  Maximize2,
  Navigation,
  Layers,
  Crosshair,
  Sliders,
  Car,
} from 'lucide-react';
import { Spatial3DNodeData, Vector3Tuple } from './types';

interface Spatial3DHUDProps {
  nodes: Spatial3DNodeData[];
  activePreset: string;
  onSelectPreset: (presetId: string) => void;
  roverActive: boolean;
  onToggleRover: () => void;
  roverPos: Vector3Tuple;
  roverSpeed: number;
  onResetCamera: () => void;
}

export function Spatial3DHUD({
  nodes,
  activePreset,
  onSelectPreset,
  roverActive,
  onToggleRover,
  roverPos,
  roverSpeed,
  onResetCamera,
}: Spatial3DHUDProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-3 sm:p-5">
      {/* Top Header Bar: Telemetry & Navigation Presets */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Left Telemetry Box */}
        <div className="pointer-events-auto flex items-center gap-3 rounded-xl border border-slate-800/90 bg-slate-950/80 px-3 py-1.5 backdrop-blur-md shadow-xl text-xs text-slate-300 font-mono">
          <div className="flex items-center gap-1.5 text-sky-400 font-semibold border-r border-slate-800 pr-2.5">
            <Compass className="h-4 w-4 animate-spin" style={{ animationDuration: '12s' }} />
            <span>3D WebGL Canvas</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400">
            <span>POS:</span>
            <span className="text-slate-200">
              X {roverPos[0].toFixed(1)} | Z {roverPos[2].toFixed(1)}
            </span>
          </div>

          {roverActive && (
            <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
              <span>{roverSpeed} u/s</span>
            </div>
          )}
        </div>

        {/* Right Action Tools: Station Selector + Drive Mode */}
        <div className="pointer-events-auto flex items-center gap-1.5 rounded-xl border border-slate-800/90 bg-slate-950/80 p-1 backdrop-blur-md shadow-xl">
          {/* Quick Node View Stations */}
          <button
            type="button"
            onClick={() => onSelectPreset('overview')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
              activePreset === 'overview' && !roverActive
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Overview</span>
          </button>

          {nodes.map((n, idx) => (
            <button
              key={n.id}
              type="button"
              onClick={() => onSelectPreset(n.id)}
              className={`hidden md:flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                activePreset === n.id && !roverActive
                  ? 'bg-slate-800 text-sky-300 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <span>{n.title || `Node ${idx + 1}`}</span>
            </button>
          ))}

          {/* Drive Rover Toggle */}
          <button
            type="button"
            onClick={onToggleRover}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg font-medium transition-all border ${
              roverActive
                ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400 shadow-md shadow-emerald-500/20'
                : 'text-slate-300 bg-slate-900/90 hover:bg-slate-800 border-slate-700'
            }`}
          >
            <Car className="h-3.5 w-3.5" />
            <span>{roverActive ? 'Driving Mode' : 'Drive Rover'}</span>
          </button>

          {/* Auto-Center / Reset */}
          <button
            type="button"
            onClick={onResetCamera}
            className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-all"
            title="Reset View"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Bottom Hint Banner (When driving rover) */}
      {roverActive && (
        <div className="pointer-events-auto mx-auto mb-2 flex items-center gap-3 rounded-xl border border-emerald-500/40 bg-slate-950/90 px-4 py-2 text-xs text-slate-200 backdrop-blur-md shadow-2xl animate-fade-in">
          <div className="flex items-center gap-1 font-mono text-emerald-400 font-bold">
            <Navigation className="h-4 w-4" />
            <span>ROVER NAVIGATION ACTIVE</span>
          </div>
          <span className="hidden sm:inline text-slate-400">|</span>
          <div className="flex items-center gap-2 text-[11px] text-slate-300 font-mono">
            <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-sky-300">W/A/S/D</span>
            <span>or</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-sky-300">Arrow Keys</span>
            <span>to drive,</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-emerald-300">Shift</span>
            <span>for boost</span>
          </div>
        </div>
      )}
    </div>
  );
}
