import dagre from 'dagre';
import { Node, Edge } from '@xyflow/react';

const DEFAULT_NODE_WIDTH = 380;
const DEFAULT_NODE_HEIGHT = 250;

/**
 * Calculates dynamic bounding box dimensions based on node measurements,
 * widget type, and content size to prevent spatial collisions on the canvas.
 */
export function calculateNodeDimensions(node: Node): { width: number; height: number } {
  // 1. Check measured dimensions from React Flow runtime
  if (node.measured?.width && node.measured?.height) {
    return {
      width: Math.max(node.measured.width, 300),
      height: Math.max(node.measured.height, 180),
    };
  }

  const data = (node.data || {}) as any;
  if (data.width && data.height) {
    return { width: data.width, height: data.height };
  }

  // 2. Dynamic estimation based on widget type and content complexity
  const type = data.type || node.type || '';
  switch (type) {
    case 'ComparisonTable':
    case 'comparison_table': {
      const rowCount = Array.isArray(data.rows) ? data.rows.length : (data.verified_metrics?.length || 4);
      return {
        width: 620,
        height: Math.min(650, 320 + rowCount * 30),
      };
    }
    case 'BudgetTracker':
    case 'budget_tracker': {
      const itemCount = Array.isArray(data.items) ? data.items.length : 3;
      return {
        width: 420,
        height: Math.min(500, 240 + itemCount * 36),
      };
    }
    case 'TimelineCalendar':
    case 'timeline_calendar': {
      const eventCount = Array.isArray(data.events) ? data.events.length : 3;
      return {
        width: 440,
        height: Math.min(550, 260 + eventCount * 45),
      };
    }
    case 'AdmissionPredictor':
    case 'admission_predictor': {
      const instCount = Array.isArray(data.institutions) ? data.institutions.length : 3;
      return {
        width: 420,
        height: Math.min(480, 250 + instCount * 42),
      };
    }
    default:
      return { width: DEFAULT_NODE_WIDTH, height: DEFAULT_NODE_HEIGHT };
  }
}

/**
 * Executes Dagre directed-graph spatial layout calculation with collision prevention
 * and variable content dimension support.
 */
export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  direction: 'TB' | 'LR' | 'BT' | 'RL' = 'TB'
): { nodes: Node[]; edges: Edge[] } {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 70, // Horizontal separation between adjacent nodes
    ranksep: 90, // Vertical separation between ranks/tiers
    marginx: 50,
    marginy: 50,
  });

  const nodeDimensionMap = new Map<string, { width: number; height: number }>();

  nodes.forEach((node) => {
    const dims = calculateNodeDimensions(node);
    nodeDimensionMap.set(node.id, dims);
    dagreGraph.setNode(node.id, { width: dims.width, height: dims.height });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const dims = nodeDimensionMap.get(node.id) || {
      width: DEFAULT_NODE_WIDTH,
      height: DEFAULT_NODE_HEIGHT,
    };

    return {
      ...node,
      position: {
        x: nodeWithPosition.x - dims.width / 2,
        y: nodeWithPosition.y - dims.height / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}
