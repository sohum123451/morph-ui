'use client';

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Calendar, Tag } from 'lucide-react';

interface TimelineCalendarWidgetProps {
  data: {
    title: string;
    events?: Array<{
      date: string;
      title: string;
      category?: string;
      description?: string;
    }>;
  };
}

export const TimelineCalendarWidget = memo(function TimelineCalendarWidget({ data }: TimelineCalendarWidgetProps) {
  const title = data?.title || 'Timeline & Schedule';
  const events = Array.isArray(data?.events) ? data.events : [];

  return (
    <div className="w-[480px] min-h-[460px] bg-slate-900/95 border border-slate-800 rounded-xl p-5 shadow-2xl flex flex-col text-slate-100 backdrop-blur">
      <Handle type="target" position={Position.Left} className="!bg-sky-500 !w-3 !h-3" />
      <Handle type="source" position={Position.Right} className="!bg-indigo-500 !w-3 !h-3" />

      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-base tracking-tight text-white line-clamp-1">{title}</h3>
            <span className="text-xs text-slate-400">Chronological Milestones</span>
          </div>
        </div>
        {events.length > 0 && (
          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-slate-800 text-sky-300 border border-slate-700">
            {events.length} {events.length === 1 ? 'event' : 'events'}
          </span>
        )}
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto max-h-[360px] pr-1 space-y-3">
        {events.length === 0 ? (
          <div className="p-8 text-center text-slate-500 italic text-sm">
            No chronological events recorded
          </div>
        ) : (
          events.map((event, index) => (
            <div
              key={index}
              className="p-3.5 rounded-lg bg-slate-950/40 border border-slate-800/70 hover:border-slate-700/80 transition-all flex flex-col gap-2 relative pl-4 border-l-4 border-l-sky-500"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold text-sky-400 bg-sky-950/60 border border-sky-800/50">
                  {event.date}
                </span>
                {event.category && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700/50">
                    <Tag className="w-3 h-3 text-slate-400" />
                    {event.category}
                  </span>
                )}
              </div>

              <h4 className="font-semibold text-sm text-slate-100">{event.title}</h4>

              {event.description && (
                <p className="text-xs text-slate-300 leading-relaxed">
                  {event.description || ''}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
});
