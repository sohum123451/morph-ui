'use client';

import React, { Component, ErrorInfo, ReactNode, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VerifiedMetric, EntityVerdict } from '@/types/morphui';
import {
  WarningIcon,
  RefreshIcon,
  ExpandIcon,
  CompressIcon,
  SlidersIcon,
  SpatialIcon,
  ThreeDIcon,
} from '@/components/icons/CustomIcons';
import { PriorityLens } from '@/components/lenses/PriorityLens';
import dynamic from 'next/dynamic';

const DivergenceField = dynamic(
  () => import('@/components/lenses/DivergenceField').then((mod) => mod.DivergenceField),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[600px] rounded-xl border border-theme-border bg-theme-card flex flex-col items-center justify-center space-y-3 text-theme-secondary font-mono">
        <div className="w-6 h-6 border-2 border-theme-accent border-t-transparent rounded-full animate-spin" />
        <span className="text-xs uppercase tracking-widest text-theme-text">INITIALIZING DIVERGENCE FIELD TOPOLOGY...</span>
      </div>
    ),
  }
);

const Playable3DCanvas = dynamic(
  () => import('@/components/lenses/Playable3DCanvas').then((mod) => mod.Playable3DCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[600px] rounded-xl border border-theme-border bg-theme-card flex flex-col items-center justify-center space-y-3 text-theme-secondary font-mono">
        <div className="w-6 h-6 border-2 border-theme-accent border-t-transparent rounded-full animate-spin" />
        <span className="text-xs uppercase tracking-widest text-theme-text">MOUNTING PLAYABLE 3D WEBGL ENGINE...</span>
      </div>
    ),
  }
);

export interface WidgetErrorFallbackProps {
  type?: string;
  error?: Error | null;
  message?: string;
  onRetry?: () => void;
}

export function WidgetErrorFallback({
  type = 'Unknown',
  error,
  message,
  onRetry,
}: WidgetErrorFallbackProps) {
  return (
    <div className="w-full min-w-[340px] max-w-md rounded-xl border border-theme-accent/40 bg-theme-card p-5 text-theme-text">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-theme-bg text-theme-accent">
          <WarningIcon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-bold text-theme-text truncate">Render Exception</h4>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-theme-bg text-theme-secondary">
              {type}
            </span>
          </div>
          <p className="text-xs text-theme-secondary">
            {message || error?.message || 'Failed to render widget component.'}
          </p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-theme-bg bg-theme-accent rounded-md transition-colors hover:bg-theme-accent-hover"
            >
              <RefreshIcon className="h-3 w-3" />
              <span>Retry</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface ErrorBoundaryProps {
  widgetType: string;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class WidgetErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn(`[WidgetErrorBoundary] Error in <${this.props.widgetType}>:`, error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <WidgetErrorFallback
          type={this.props.widgetType}
          error={this.state.error}
          onRetry={this.handleRetry}
        />
      );
    }
    return this.props.children;
  }
}

export interface CanvasRendererProps {
  activeLens: 'priority' | 'divergence' | 'spatial3d';
  onSelectLens: (lens: 'priority' | 'divergence' | 'spatial3d') => void;
  entities: EntityVerdict[];
  metrics: VerifiedMetric[];
  weights: Record<string, number>;
  onWeightChange: (metricName: string, weight: number) => void;
  onMoveMetric: (fromIndex: number, toIndex: number) => void;
  onResetWeights: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export function CanvasRenderer({
  activeLens,
  onSelectLens,
  entities,
  metrics,
  weights,
  onWeightChange,
  onMoveMetric,
  onResetWeights,
  isFullscreen,
  onToggleFullscreen,
}: CanvasRendererProps) {
  // Global Escape key listener for fullscreen mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        e.preventDefault();
        onToggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, onToggleFullscreen]);

  return (
    <div
      className={
        isFullscreen
          ? 'fixed inset-0 z-50 bg-theme-bg w-screen h-screen flex flex-col p-4 sm:p-6 overflow-y-auto'
          : 'w-full space-y-4'
      }
    >
      {/* Top Controls Bar with Fullscreen toggle and Lens Switcher */}
      <div className="flex items-center justify-between gap-3 p-2 rounded-xl bg-theme-card border border-theme-border">
        {/* Lens Switcher */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onSelectLens('priority')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeLens === 'priority'
                ? 'bg-theme-bg text-theme-text shadow-sm border border-theme-border'
                : 'text-theme-secondary hover:text-theme-text'
            }`}
          >
            <SlidersIcon className="w-3.5 h-3.5 text-theme-accent" />
            <span>Priority Lens</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectLens('divergence')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeLens === 'divergence'
                ? 'bg-theme-bg text-theme-text shadow-sm border border-theme-border'
                : 'text-theme-secondary hover:text-theme-text'
            }`}
          >
            <SpatialIcon className="w-3.5 h-3.5 text-theme-focus" />
            <span>Divergence Field</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectLens('spatial3d')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeLens === 'spatial3d'
                ? 'bg-theme-bg text-theme-text shadow-sm border border-theme-border'
                : 'text-theme-secondary hover:text-theme-text'
            }`}
          >
            <ThreeDIcon className="w-3.5 h-3.5 text-theme-secondary" />
            <span>3D Space</span>
          </button>
        </div>

        {/* Fullscreen Mode Toggle */}
        <button
          type="button"
          onClick={onToggleFullscreen}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-theme-text bg-theme-bg border border-theme-border hover:border-theme-accent transition-all shrink-0"
          title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Enter Fullscreen Live Mode'}
        >
          {isFullscreen ? (
            <>
              <CompressIcon className="w-3.5 h-3.5 text-theme-accent" />
              <span>Exit Fullscreen</span>
              <span className="hidden sm:inline text-[10px] font-mono text-theme-muted">(Esc)</span>
            </>
          ) : (
            <>
              <ExpandIcon className="w-3.5 h-3.5 text-theme-secondary" />
              <span>Fullscreen Mode</span>
            </>
          )}
        </button>
      </div>

      {/* Active Lens with Error Boundary & Framer Motion Transitions */}
      <WidgetErrorBoundary widgetType={activeLens}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeLens}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={isFullscreen ? 'flex-1 min-h-0' : 'w-full'}
          >
            {activeLens === 'priority' && (
              <PriorityLens
                entities={entities}
                metrics={metrics}
                weights={weights}
                onWeightChange={onWeightChange}
                onMoveMetric={onMoveMetric}
                onResetWeights={onResetWeights}
              />
            )}

            {activeLens === 'divergence' && (
              <DivergenceField
                entities={entities}
                metrics={metrics}
                weights={weights}
              />
            )}

            {activeLens === 'spatial3d' && (
              <Playable3DCanvas
                entities={entities}
                metrics={metrics}
                weights={weights}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </WidgetErrorBoundary>
    </div>
  );
}
