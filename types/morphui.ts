import { z } from 'zod';

export type WidgetType = 'comparison_table' | 'timeline_calendar' | 'budget_tracker' | 'admission_predictor';

export interface WidgetImage {
  url: string;
  name?: string;
  label?: string;
}

export interface ComparisonPoint {
  feature_name?: string;
  metric_name?: string;
  entity_a_value?: string;
  entity_b_value?: string;
  values?: string[];
  source_type?: 'official' | 'benchmark' | 'verified_database' | 'unverified' | 'ai_consensus';
}

export interface VerifiedMetric {
  metric: string;
  values?: string[];
  entity_a?: string;
  entity_b?: string;
  source_type?: 'official' | 'benchmark' | 'verified_database' | 'unverified' | 'ai_consensus';
}

export interface CommunitySentiment {
  topic: string;
  consensuses?: string[];
  entity_a_consensus?: string;
  entity_b_consensus?: string;
  sentiment?: 'Positive' | 'Mixed' | 'Critical';
  score_weight?: number; // 1-10 intensity/agreement weight
  praises?: string[]; // Specific repeated praise points
  pain_points?: string[]; // Specific repeated pain points / complaints
  quotes?: string[]; // Real Reddit comment snippets or highlights
}

export interface GranularCommunityInsights {
  pros_and_cons?: Array<{
    entity: string;
    praises: string[];
    pain_points: string[];
  }>;
  price_value_consensus?: {
    summary: string;
    worth_it_verdict?: Record<string, string>;
    alternatives_mentioned?: string[];
  };
  long_term_reliability?: {
    summary: string;
    experience_6plus_months?: Record<string, string>;
  };
}

export interface EntityVerdict {
  name: string;
  pros: string[];
  cons?: string[];
  tagline?: string;
}

export interface GenerativeComparisonResponse {
  chat_id?: string;
  category: string;
  entities: EntityVerdict[];
  entity_a?: EntityVerdict;
  entity_b?: EntityVerdict;
  categories: Record<string, VerifiedMetric[]>;
  verified_metrics: VerifiedMetric[];
  community_sentiment: CommunitySentiment[];
  community_insights?: GranularCommunityInsights;
  suggested_metrics: string[];
  verdict_summary: string;
  comparison_points?: ComparisonPoint[];
  model_used?: string;
  grounded?: boolean;
  raw_query?: string;
  cache_info?: any;
  visual_comparison?: boolean;
}

export interface ComparisonTableData {
  headers?: string[];
  rows?: Record<string, string>[];
  summary?: string;
  images?: WidgetImage[];
  category?: string;
  entities?: EntityVerdict[];
  entity_a?: string | EntityVerdict;
  entity_b?: string | EntityVerdict;
  categories?: Record<string, VerifiedMetric[]>;
  comparison_points?: ComparisonPoint[];
  verified_metrics?: VerifiedMetric[];
  community_sentiment?: CommunitySentiment[];
  community_insights?: GranularCommunityInsights;
  suggested_metrics?: string[];
  verdict_summary?: string;
}

export interface TimelineCalendarData {
  events: Array<{
    date: string;
    title: string;
    category?: string;
    description?: string;
  }>;
}

export interface BudgetTrackerData {
  currency: string;
  total: number;
  items: Array<{
    category: string;
    name: string;
    cost: number;
  }>;
}

export interface AdmissionPredictorData {
  institutions: Array<{
    name: string;
    probability: 'High' | 'Medium' | 'Low' | string;
    cutoff?: string;
    tier?: string;
    acceptanceRate?: string;
    medianScore?: string;
    tuition?: string;
  }>;
}

export interface CustomMetricRequest {
  entity_a: string;
  entity_b: string;
  category: string;
  metric_name: string;
}

export interface CustomMetricResponse {
  metric_name: string;
  entity_a_value: string;
  entity_b_value: string;
  source_type: 'official' | 'benchmark' | 'verified_database' | 'unverified' | 'ai_consensus';
}

// --- Zod Runtime Validation Schemas for Canvas Renderer ---
export const BudgetWidgetSchema = z.object({
  type: z.literal('BudgetTracker').or(z.literal('budget_tracker')).optional(),
  currency: z.string().default('USD'),
  total: z.number().optional(),
  items: z.array(
    z.object({
      category: z.string(),
      name: z.string(),
      cost: z.number(),
    })
  ).default([]),
}).passthrough();

export const TimelineWidgetSchema = z.object({
  type: z.literal('TimelineCalendar').or(z.literal('timeline_calendar')).optional(),
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
  type: z.literal('AdmissionPredictor').or(z.literal('admission_predictor')).optional(),
  institutions: z.array(
    z.object({
      name: z.string(),
      probability: z.string(),
      cutoff: z.string().optional(),
      tier: z.string().optional(),
      acceptanceRate: z.string().optional(),
      medianScore: z.string().optional(),
      tuition: z.string().optional(),
    })
  ).default([]),
}).passthrough();
