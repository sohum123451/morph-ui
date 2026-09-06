export type WidgetType = 'comparison_table' | 'timeline_calendar' | 'budget_tracker' | 'admission_predictor';

export interface WidgetImage {
  url: string;
  name?: string;
  label?: string;
}

export interface ComparisonPoint {
  feature_name: string;
  entity_a_value: string;
  entity_b_value: string;
}

export interface VerifiedMetric {
  metric: string;
  entity_a: string;
  entity_b: string;
  source_type?: 'official' | 'benchmark' | 'verified_database';
}

export interface CommunitySentiment {
  topic: string;
  entity_a_consensus: string;
  entity_b_consensus: string;
  sentiment?: 'Positive' | 'Mixed' | 'Critical';
}

export interface EntityVerdict {
  name: string;
  pros: string[];
  cons?: string[];
}

export interface GenerativeComparisonResponse {
  category: string;
  entity_a: EntityVerdict;
  entity_b: EntityVerdict;
  categories: Record<string, VerifiedMetric[]>;
  verified_metrics: VerifiedMetric[];
  community_sentiment: CommunitySentiment[];
  suggested_metrics: string[];
  verdict_summary: string;
  comparison_points?: ComparisonPoint[];
}

export interface ComparisonTableData {
  headers?: string[];
  rows?: Record<string, string>[];
  summary?: string;
  images?: WidgetImage[];
  category?: string;
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

export interface AgentApiResponse {
  widgets: MorphWidget[];
  category?: string;
  entity_a?: EntityVerdict;
  entity_b?: EntityVerdict;
  categories?: Record<string, VerifiedMetric[]>;
  verified_metrics?: VerifiedMetric[];
  community_sentiment?: CommunitySentiment[];
  suggested_metrics?: string[];
  verdict_summary?: string;
  raw_query?: string;
  grounded?: boolean;
  model_used?: string;
  visual_comparison?: boolean;
}
