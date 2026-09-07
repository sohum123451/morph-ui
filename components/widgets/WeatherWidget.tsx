'use client';

import React, { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Sun, CloudRain, Wind, Droplets, Thermometer, CloudLightning } from 'lucide-react';

export interface WeatherWidgetProps {
  data?: {
    location?: string;
    temperature?: string;
    condition?: string;
    forecast?: Array<{ day: string; temp: string; condition: string }>;
    details?: { humidity?: string; wind?: string; uv?: string };
  };
}

export const WeatherWidget = memo(function WeatherWidget({ data }: WeatherWidgetProps) {
  const {
    location = 'Location Telemetry',
    temperature = '72°F',
    condition = 'Partly Cloudy',
    forecast = [
      { day: 'Mon', temp: '74°F', condition: 'Sunny' },
      { day: 'Tue', temp: '68°F', condition: 'Rain' },
      { day: 'Wed', temp: '71°F', condition: 'Cloudy' },
      { day: 'Thu', temp: '75°F', condition: 'Sunny' },
      { day: 'Fri', temp: '73°F', condition: 'Windy' },
    ],
    details = { humidity: '45%', wind: '12 mph', uv: 'Moderate' },
  } = data || {};

  const [activeTab, setActiveTab] = useState<'current' | 'forecast' | 'details'>('current');

  return (
    <div className="w-[420px] bg-[#0F172A] border border-cyan-500/40 rounded-2xl p-4 shadow-xl text-slate-100 font-sans backdrop-blur-md">
      <Handle type="target" position={Position.Left} className="!bg-cyan-400 !w-3 !h-3 !border-2 !border-slate-900" />
      <Handle type="source" position={Position.Right} className="!bg-cyan-400 !w-3 !h-3 !border-2 !border-slate-900" />

      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Sun className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-cyan-300">Live Weather Telemetry</h4>
            <span className="text-[10px] text-slate-400 font-mono">{location}</span>
          </div>
        </div>

        <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-[10px] font-mono">
          <button
            onClick={() => setActiveTab('current')}
            className={`px-2 py-0.5 rounded-md transition-colors ${activeTab === 'current' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Current
          </button>
          <button
            onClick={() => setActiveTab('forecast')}
            className={`px-2 py-0.5 rounded-md transition-colors ${activeTab === 'forecast' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Forecast
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`px-2 py-0.5 rounded-md transition-colors ${activeTab === 'details' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Stats
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="mt-3 min-h-[140px]">
        {activeTab === 'current' && (
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="space-y-1">
              <span className="text-3xl font-extrabold text-white tracking-tight">{temperature}</span>
              <p className="text-xs text-cyan-300 font-medium">{condition}</p>
              <p className="text-[10px] text-slate-400">Feels like {temperature}</p>
            </div>
            <div className="p-3 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 animate-pulse">
              {condition.toLowerCase().includes('rain') ? (
                <CloudRain className="w-8 h-8" />
              ) : condition.toLowerCase().includes('wind') ? (
                <Wind className="w-8 h-8" />
              ) : (
                <Sun className="w-8 h-8" />
              )}
            </div>
          </div>
        )}

        {activeTab === 'forecast' && (
          <div className="grid grid-cols-5 gap-1.5">
            {forecast.map((f, i) => (
              <div key={i} className="flex flex-col items-center p-2 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 transition-all text-center">
                <span className="text-[10px] font-mono text-slate-400">{f.day}</span>
                <span className="text-xs font-bold text-slate-200 my-1">{f.temp}</span>
                <span className="text-[9px] text-cyan-300 truncate w-full">{f.condition}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'details' && (
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col items-center text-center">
              <Droplets className="w-4 h-4 text-cyan-400 mb-1" />
              <span className="text-[10px] text-slate-400">Humidity</span>
              <span className="font-bold text-slate-200">{details.humidity || '45%'}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col items-center text-center">
              <Wind className="w-4 h-4 text-cyan-400 mb-1" />
              <span className="text-[10px] text-slate-400">Wind</span>
              <span className="font-bold text-slate-200">{details.wind || '12 mph'}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col items-center text-center">
              <Thermometer className="w-4 h-4 text-cyan-400 mb-1" />
              <span className="text-[10px] text-slate-400">UV Index</span>
              <span className="font-bold text-slate-200">{details.uv || 'Moderate'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default WeatherWidget;
