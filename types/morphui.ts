export type WidgetType = 'comparison_table' | 'timeline_calendar' | 'budget_tracker' | 'admission_predictor';

export interface ComparisonTableData {
  headers: string[];
  rows: Record<string, string>[];
  summary?: string;
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

export interface AgentApiResponse {
  widgets: MorphWidget[];
  raw_query?: string;
  grounded?: boolean;
  model_used?: string;
}