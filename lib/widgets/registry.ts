import { z } from 'zod';
import { ComponentType } from 'react';
import { DivergenceLedgerWidget } from '@/components/widgets/DivergenceLedgerWidget';
import { BudgetTrackerWidget } from '@/components/widgets/BudgetTrackerWidget';
import { TimelineCalendarWidget } from '@/components/widgets/TimelineCalendarWidget';
import { AdmissionPredictorWidget } from '@/components/widgets/AdmissionPredictorWidget';
import { ComparisonTableWidget } from '@/components/widgets/ComparisonTableWidget';

// --- Zod Schemas for all Generative Canvas Widgets ---

export const DivergenceLedgerSchema = z.object({
  category: z.string().default('Comparative Disparity'),
  deltas: z.array(
    z.object({
      metric: z.string(),
      disparity_pct: z.number().default(30),
      entity_a_val: z.string().default('Standard'),
      entity_b_val: z.string().default('Alternative'),
      critical_driver: z.string().optional(),
    })
  ).default([]),
  summary: z.string().default('Disparity analysis based on current telemetry weights.'),
}).passthrough();

export const BudgetWidgetSchema = z.object({
  title: z.string().default('Comparative Budget & Cost Analysis'),
  currency: z.string().default('$'),
  total: z.number().optional(),
  items: z.array(
    z.object({
      category: z.string().default('Expense'),
      name: z.string(),
      cost: z.number().default(0),
    })
  ).default([]),
}).passthrough();

export const TimelineWidgetSchema = z.object({
  title: z.string().default('Implementation & Milestone Roadmap'),
  events: z.array(
    z.object({
      date: z.string(),
      title: z.string(),
      category: z.string().optional(),
      description: z.string().optional(),
    })
  ).default([]),
}).passthrough();

export const AdmissionPredictorWidgetSchema = z.object({
  title: z.string().default('Comparative Acceptance & Outcome Predictor'),
  institutions: z.array(
    z.object({
      name: z.string(),
      probability: z.string().default('Medium'),
      cutoff: z.string().optional(),
      recommendation: z.string().optional(),
    })
  ).default([]),
}).passthrough();

export const ComparisonTableWidgetSchema = z.object({
  title: z.string().optional(),
  category: z.string().optional(),
  entity_a: z.any().optional(),
  entity_b: z.any().optional(),
  categories: z.record(z.string(), z.any()).optional(),
  verified_metrics: z.array(z.any()).optional(),
  community_sentiment: z.array(z.any()).optional(),
  verdict_summary: z.string().optional(),
  rows: z.array(z.record(z.string(), z.any())).optional(),
}).passthrough();

export interface WidgetHysteresisConfig {
  spawnThresholdPct: number; // Disparity % required to justify spawning this tile
  evictThresholdPct: number; // Disparity % below which tile should auto-evict
  ttlSeconds: number;        // Maximum idle lifetime without data affirmation
}

export interface WidgetManifest<T = any> {
  id: string;
  name: string;
  description: string;
  toolDescription: string;
  schema: z.ZodType<T>;
  component: ComponentType<any>;
  defaultDimensions: { width: number; height: number };
  hysteresis: WidgetHysteresisConfig;
  heuristicTriggerKeywords: string[];
}

export const WIDGET_REGISTRY: Record<string, WidgetManifest> = {
  DivergenceLedger: {
    id: 'DivergenceLedger',
    name: 'Maximum Divergence Ledger',
    description: 'Highlights critical metric disparities, outliers, and priority divergence points between entities.',
    toolDescription: 'Call this tool when there is a significant metric delta (>25% disparity) or critical trade-off between entities that requires focused divergence visibility.',
    schema: DivergenceLedgerSchema,
    component: DivergenceLedgerWidget,
    defaultDimensions: { width: 460, height: 320 },
    hysteresis: {
      spawnThresholdPct: 25,
      evictThresholdPct: 10,
      ttlSeconds: 60,
    },
    heuristicTriggerKeywords: ['diverge', 'disparity', 'difference', 'delta', 'variance', 'gap', 'contrast'],
  },
  BudgetTracker: {
    id: 'BudgetTracker',
    name: 'Cost & Budget Tracker',
    description: 'Provides itemized cost breakdowns, total cost of ownership (TCO), and pricing telemetry.',
    toolDescription: 'Call this tool when financial data, subscription tiers, acquisition costs, or budget allocations are relevant.',
    schema: BudgetWidgetSchema,
    component: BudgetTrackerWidget,
    defaultDimensions: { width: 480, height: 460 },
    hysteresis: {
      spawnThresholdPct: 20,
      evictThresholdPct: 8,
      ttlSeconds: 60,
    },
    heuristicTriggerKeywords: ['budget', 'cost', 'price', 'pricing', 'expense', 'roi', 'financial', 'fee', 'dollar'],
  },
  TimelineCalendar: {
    id: 'TimelineCalendar',
    name: 'Milestone & Lifecycle Roadmap',
    description: 'Renders chronological milestones, release dates, deployment phases, or onboarding roadmaps.',
    toolDescription: 'Call this tool when chronological milestones, roadmap phases, deadlines, or historical timelines are compared.',
    schema: TimelineWidgetSchema,
    component: TimelineCalendarWidget,
    defaultDimensions: { width: 480, height: 460 },
    hysteresis: {
      spawnThresholdPct: 15,
      evictThresholdPct: 5,
      ttlSeconds: 60,
    },
    heuristicTriggerKeywords: ['timeline', 'roadmap', 'schedule', 'date', 'milestone', 'phase', 'release', 'deadline', 'cycle'],
  },
  AdmissionPredictor: {
    id: 'AdmissionPredictor',
    name: 'Outcome & Admission Predictor',
    description: 'Evaluates probability ratings, cutoff thresholds, acceptance rates, or risk assessments.',
    toolDescription: 'Call this tool when admission odds, acceptance rates, qualification cutoffs, or probability evaluations are relevant.',
    schema: AdmissionPredictorWidgetSchema,
    component: AdmissionPredictorWidget,
    defaultDimensions: { width: 480, height: 460 },
    hysteresis: {
      spawnThresholdPct: 20,
      evictThresholdPct: 10,
      ttlSeconds: 60,
    },
    heuristicTriggerKeywords: ['admission', 'acceptance', 'probability', 'cutoff', 'odds', 'tier', 'qualify', 'prediction'],
  },
  ComparisonTable: {
    id: 'ComparisonTable',
    name: 'Dense Spec Comparison Matrix',
    description: 'Full telemetry matrix comparing verified metrics across all active entities.',
    toolDescription: 'Call this tool when a complete structured comparison table of all telemetry metrics is needed.',
    schema: ComparisonTableWidgetSchema,
    component: ComparisonTableWidget,
    defaultDimensions: { width: 620, height: 500 },
    hysteresis: {
      spawnThresholdPct: 15,
      evictThresholdPct: 5,
      ttlSeconds: 90,
    },
    heuristicTriggerKeywords: ['table', 'spec', 'matrix', 'comparison', 'specs', 'feature'],
  },
};




/**
 * Strict server & client schema validator.
 * Validates props against the widget's Zod schema.
 */
export function validateAndSanitizeWidgetProps<T = any>(
  widgetType: string,
  rawProps: any
): { success: true; data: T } | { success: false; error: string } {
  const manifest = WIDGET_REGISTRY[widgetType];
  if (!manifest) {
    return { success: false, error: 'Unknown widget type ' + widgetType };
  }

  const result = manifest.schema.safeParse(rawProps || {});
  if (result.success) {
    return { success: true, data: result.data as T };
  }

  return {
    success: false,
    error: 'Schema validation failed for ' + widgetType + ': ' + result.error.issues.map((i) => i.message).join(', '),
  };
}
