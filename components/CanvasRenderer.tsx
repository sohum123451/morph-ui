'use client';

import React, { Component, ErrorInfo, ReactNode, memo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  NodeProps,
  Handle,
  Position,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { ComparisonTableWidget } from './widgets/ComparisonTableWidget';
import { BudgetTrackerWidget } from './widgets/BudgetTrackerWidget';
import { TimelineCalendarWidget } from './widgets/TimelineCalendarWidget';
import { AdmissionPredictorWidget } from './widgets/AdmissionPredictorWidget';
import {
  BudgetWidgetSchema,
  TimelineWidgetSchema,
} from '@/types/morphui';
import { AlertTriangle, RefreshCw } from 'lucide-react';

// --- 1. DETERMINISTIC COMPONENT REGISTRY ---
export const COMPONENT_REGISTRY = {
  ComparisonTable: ComparisonTableWidget,
  BudgetTracker: BudgetTrackerWidget,
  TimelineCalendar: TimelineCalendarWidget,
  AdmissionPredictor: AdmissionPredictorWidget,
  // Normalized alias support
  comparison_table: ComparisonTableWidget,
  budget_tracker: BudgetTrackerWidget,
  timeline_calendar: TimelineCalendarWidget,
  admission_predictor: AdmissionPredictorWidget,
};

// --- 2. GRACEFUL WIDGET ERROR FALLBACK CARD ---
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
    <div className="w-full min-w-[340px] max-w-md rounded-2xl border border-red-500/30 bg-red-950/20 p-5 backdrop-blur-md shadow-xl text-zinc-200 transition-all hover:border-red-500/50">
      <div className="flex items-start gap-3.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-red-200 truncate">
              Widget Stream Render Exception
            </h4>
            <span className="inline-block px-2 py-0.5 text-[10px] uppercase font-mono font-bold tracking-wider rounded bg-red-500/20 text-red-300 border border-red-500/30">
              {type}
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
            {message || error?.message || 'The payload for this widget failed validation or contained malformed data.'}
          </p>

          <div className="mt-3.5 flex items-center justify-between pt-2 border-t border-red-500/10">
            <span className="text-[11px] text-zinc-500 font-mono">
              Isolated boundary active
            </span>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition-colors active:scale-95"
              >
                <RefreshCw className="h-3 w-3" />
                Retry
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- 3. COMPONENT-LEVEL ERROR BOUNDARY ---
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
    console.warn(`[WidgetErrorBoundary] Caught failure in <${this.props.widgetType}>:`, error, errorInfo);
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

// --- 4. SAFE COMPONENT RENDERER WITH ZOD VALIDATION ---
export function renderWidgetComponent(type: string, data: any) {
  const WidgetComponent = COMPONENT_REGISTRY[type as keyof typeof COMPONENT_REGISTRY];
  if (!WidgetComponent) {
    return <WidgetErrorFallback type={type} message={`Unknown widget registry type: "${type}"`} />;
  }

  // Schema pre-validation for streaming safety
  let validationError: string | null = null;
  if (type === 'BudgetTracker' || type === 'budget_tracker') {
    const res = BudgetWidgetSchema.safeParse({ type: 'BudgetTracker', ...(data?.data || data) });
    if (!res.success) {
      validationError = res.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
    }
  } else if (type === 'TimelineCalendar' || type === 'timeline_calendar') {
    const res = TimelineWidgetSchema.safeParse({ type: 'TimelineCalendar', ...(data?.data || data) });
    if (!res.success) {
      validationError = res.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
    }
  }

  if (validationError) {
    return <WidgetErrorFallback type={type} message={`Schema validation error: ${validationError}`} />;
  }

  // Handle data payload variations ({ data: ... } vs flat payload)
  const widgetProps = data && data.data !== undefined ? data : { data };

  return (
    <WidgetErrorBoundary widgetType={type}>
      <WidgetComponent {...widgetProps} />
    </WidgetErrorBoundary>
  );
}

// --- 5. REACT FLOW CUSTOM NODE WRAPPER ---
export const CanvasWidgetNode = memo(function CanvasWidgetNode({ data }: NodeProps) {
  const widgetType = (data?.type as string) || (data?.widget_type as string) || 'ComparisonTable';

  return (
    <div className="group relative">
      <Handle type="target" position={Position.Top} className="!bg-blue-500/80 !w-2.5 !h-2.5 !border-2 !border-zinc-950" />
      <div className="shadow-2xl transition-transform duration-200 group-hover:scale-[1.005]">
        {renderWidgetComponent(widgetType, data)}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-blue-500/80 !w-2.5 !h-2.5 !border-2 !border-zinc-950" />
    </div>
  );
});

export const nodeTypes = {
  widgetNode: CanvasWidgetNode,
  ComparisonTable: CanvasWidgetNode,
  BudgetTracker: CanvasWidgetNode,
  TimelineCalendar: CanvasWidgetNode,
  AdmissionPredictor: CanvasWidgetNode,
};

// --- 6. STANDALONE INTERACTIVE CANVAS RENDERER ---
export interface CanvasRendererProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange?: (changes: any) => void;
  onEdgesChange?: (changes: any) => void;
  className?: string;
}

export function CanvasRenderer({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  className = 'h-[750px] w-full rounded-2xl border border-zinc-800/80 bg-zinc-950/90 overflow-hidden',
}: CanvasRendererProps) {
  return (
    <div className={className}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1.5} color="#3f3f46" />
        <Controls className="!bg-zinc-900/90 !border-zinc-800 !fill-zinc-300 !text-zinc-300" />
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
          className="!bg-zinc-900/90 !border-zinc-800 rounded-xl overflow-hidden"
        />
      </ReactFlow>
    </div>
  );
}

export default CanvasRenderer;
