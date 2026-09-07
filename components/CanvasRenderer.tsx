'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { WarningIcon, RefreshIcon } from '@/components/icons/CustomIcons';

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
    <div className="w-full min-w-[340px] max-w-md rounded-xl border border-[#FE9179]/40 bg-[#355E58] p-5 text-[#FFEDD1]">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#053229] text-[#FE9179]">
          <WarningIcon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-bold text-[#FFEDD1] truncate">Render Exception</h4>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#053229] text-[#BCDDDC]">
              {type}
            </span>
          </div>
          <p className="text-xs text-[#BCDDDC]">
            {message || error?.message || 'Failed to render widget component.'}
          </p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-[#053229] bg-[#FE9179] rounded-md"
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
