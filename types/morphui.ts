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
    recommendation?: string;
  }>;
}

export interface MorphWidget {
  widget_type: WidgetType;
  title: string;
  data: ComparisonTableData | TimelineCalendarData | BudgetTrackerData | AdmissionPredictorData;
}

export interface ImageInput {
  data: string; // base64 string or data URL
  mimeType: string;
  name?: string;
}


import { z } from 'zod';

export const BudgetWidgetSchema = z.object({
  type: z.literal('BudgetTracker'),
  title: z.string(),
  items: z.array(z.object({ name: z.string(), cost: z.number() })),
});

export const TimelineWidgetSchema = z.object({
  type: z.literal('TimelineCalendar'),
  events: z.array(z.object({ date: z.string(), label: z.string() })),
});

export const CanvasPayloadSchema = z.discriminatedUnion('type', [
  BudgetWidgetSchema,
  TimelineWidgetSchema,
]);

export type CanvasWidgetData = z.infer<typeof CanvasPayloadSchema>;
