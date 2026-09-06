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

export interface GenerativeComparisonResponse {
  category: string;
  comparison_points: ComparisonPoint[];
  verdict_summary: string;
}

export interface ComparisonTableData {
  headers?: string[];
  rows?: Record<string, string>[];
  summary?: string;
  images?: WidgetImage[];
  // Generative UI comparison additions
  category?: string;
  entity_a?: string;
  entity_b?: string;
  comparison_points?: ComparisonPoint[];
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
  raw_query?: string;
  grounded?: boolean;
  model_used?: string;
  visual_comparison?: boolean;
}
