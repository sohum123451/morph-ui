'use client';

import React, { ComponentType } from 'react';

// Import widget components
import { DivergenceLedgerWidget } from './widgets/DivergenceLedgerWidget';
import { BudgetTrackerWidget } from './widgets/BudgetTrackerWidget';
import { TimelineCalendarWidget } from './widgets/TimelineCalendarWidget';
import { AdmissionPredictorWidget } from './widgets/AdmissionPredictorWidget';
import { ComparisonTableWidget } from './widgets/ComparisonTableWidget';
import { WeatherWidget } from './widgets/WeatherWidget';
import { StockTickerWidget } from './widgets/StockTickerWidget';
import { InteractiveGraphWidget } from './widgets/InteractiveGraphWidget';
import { ComparisonMatrixWidget } from './widgets/ComparisonMatrixWidget';

export interface RegistryItem {
  name: string;
  component: ComponentType<any>;
  description?: string;
  defaultProps?: Record<string, any>;
}

/**
 * Centralized Generative UI Component Registry.
 * Maps tool outputs and LLM component types (PascalCase, kebab-case, snake_case)
 * to interactive React Flow canvas components.
 */
export const COMPONENT_REGISTRY: Record<string, ComponentType<any>> = {
  // --- Standard Canvas Widgets (PascalCase) ---
  DivergenceLedger: DivergenceLedgerWidget,
  BudgetTracker: BudgetTrackerWidget,
  TimelineCalendar: TimelineCalendarWidget,
  AdmissionPredictor: AdmissionPredictorWidget,
  ComparisonTable: ComparisonTableWidget,
  WeatherWidget: WeatherWidget,
  StockTicker: StockTickerWidget,
  InteractiveGraph: InteractiveGraphWidget,
  ComparisonMatrix: ComparisonMatrixWidget,

  // --- Tool / LLM Stream Kebab-Case Aliases ---
  'divergence-ledger': DivergenceLedgerWidget,
  'budget-tracker': BudgetTrackerWidget,
  'timeline-calendar': TimelineCalendarWidget,
  'admission-predictor': AdmissionPredictorWidget,
  'comparison-table': ComparisonTableWidget,
  'weather-widget': WeatherWidget,
  'stock-ticker': StockTickerWidget,
  'interactive-graph': InteractiveGraphWidget,
  'comparison-matrix': ComparisonMatrixWidget,

  // --- Snake_case Aliases ---
  'divergence_ledger': DivergenceLedgerWidget,
  'budget_tracker': BudgetTrackerWidget,
  'timeline_calendar': TimelineCalendarWidget,
  'admission_predictor': AdmissionPredictorWidget,
  'comparison_table': ComparisonTableWidget,
  'weather_widget': WeatherWidget,
  'stock_ticker': StockTickerWidget,
  'interactive_graph': InteractiveGraphWidget,
  'comparison_matrix': ComparisonMatrixWidget,
};

/**
 * Dynamic resolver for tool/LLM component stream chunks.
 */
export function getRegisteredComponent(componentType?: string): ComponentType<any> {
  if (!componentType) return ComparisonTableWidget;
  
  const key = componentType.trim();
  if (COMPONENT_REGISTRY[key]) {
    return COMPONENT_REGISTRY[key];
  }

  // Case-insensitive normalized matching
  const normalized = key.toLowerCase().replace(/[-_]/g, '');
  for (const [regKey, comp] of Object.entries(COMPONENT_REGISTRY)) {
    if (regKey.toLowerCase().replace(/[-_]/g, '') === normalized) {
      return comp;
    }
  }

  return ComparisonTableWidget;
}

export default COMPONENT_REGISTRY;
