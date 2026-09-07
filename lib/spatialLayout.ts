import dagre from 'dagre';
import { Node, Edge } from '@xyflow/react';

const DEFAULT_NODE_WIDTH = 380;
const DEFAULT_NODE_HEIGHT = 250;

/**
 * Calculates dynamic bounding box dimensions based on node measurements,
 * widget type, and content size to prevent spatial collisions.
 */
export function calculateNodeDimensions(node: Node): { width: number; height: number } {
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
 * Executes 2D Dagre layout calculation
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
    nodesep: 70,
    ranksep: 90,
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

/**
 * Calculates 3D World Spatial Coordinates [X, Y, Z] for WebGL Drei scene placement.
 */
export function calculate3DNodePositions(count: number): Array<[number, number, number]> {
  if (count <= 1) return [[0, 2, 0]];
  if (count === 2) return [[-7, 2, 0], [7, 2, 0]];
  if (count === 3) return [[-8, 2, 2], [0, 2, -6], [8, 2, 2]];
  if (count === 4) return [[-9, 2, 0], [-3, 2, -7], [6, 2, -6], [10, 2, 2]];

  // Circular / Radial layout for 5+ nodes
  const radius = Math.max(10, count * 2.5);
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    return [
      Math.cos(angle) * radius,
      2,
      Math.sin(angle) * radius,
    ] as [number, number, number];
  });
}
