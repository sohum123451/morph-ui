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

  // 2. Dynamic estimation based on node/widget type
  const type = node.type || data.type || '';
  switch (type) {
    case 'entityNode':
      return { width: 320, height: 260 };
    case 'specMatrixNode': {
      const metricCount = Array.isArray(data.metrics) ? data.metrics.length : 5;
      return { width: 540, height: Math.min(620, 280 + metricCount * 32) };
    }
    case 'sentimentNode':
      return { width: 440, height: 320 };
    case 'verdictNode':
      return { width: 460, height: 280 };
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
    nodesep: 80, // Horizontal separation between adjacent nodes
    ranksep: 100, // Vertical separation between ranks/tiers
    marginx: 60,
    marginy: 60,
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
        x: nodeWithPosition ? nodeWithPosition.x - dims.width / 2 : 0,
        y: nodeWithPosition ? nodeWithPosition.y - dims.height / 2 : 0,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

/**
 * Generates an interconnected directed graph representation of comparison entities,
 * metrics matrix, sentiment, and final verdict with deterministic Dagre layout.
 */
export function generateComparisonGraph(params: {
  entities: any[];
  category: string;
  verifiedMetrics: any[];
  communitySentiment: any[];
  verdictSummary: string;
  direction?: 'TB' | 'LR';
}): { nodes: Node[]; edges: Edge[] } {
  const {
    entities = [],
    category = 'General Comparison',
    verifiedMetrics = [],
    communitySentiment = [],
    verdictSummary = '',
    direction = 'TB',
  } = params;

  const rawNodes: Node[] = [];
  const rawEdges: Edge[] = [];

  // 1. Entity Nodes (Source Tier)
  const normalizedEntities = entities.length > 0
    ? entities
    : [{ name: 'Option A', score: 85, verdict: 'Primary' }, { name: 'Option B', score: 82, verdict: 'Alternative' }];

  normalizedEntities.forEach((ent, idx) => {
    const entName = typeof ent === 'object' ? ent.name : ent;
    const entScore = typeof ent === 'object' ? ent.score : undefined;
    const entVerdict = typeof ent === 'object' ? ent.verdict : undefined;
    const entPros = typeof ent === 'object' && Array.isArray(ent.pros) ? ent.pros : [];
    const entCons = typeof ent === 'object' && Array.isArray(ent.cons) ? ent.cons : [];

    const nodeId = `entity-${idx}`;
    rawNodes.push({
      id: nodeId,
      type: 'entityNode',
      position: { x: 0, y: 0 },
      data: {
        id: nodeId,
        name: entName,
        score: entScore,
        verdict: entVerdict,
        pros: entPros,
        cons: entCons,
        index: idx,
      },
    });
  });

  // 2. Spec Matrix Node (Comparative Analysis Tier)
  const matrixNodeId = 'spec-matrix-node';
  rawNodes.push({
    id: matrixNodeId,
    type: 'specMatrixNode',
    position: { x: 0, y: 0 },
    data: {
      category,
      entities: normalizedEntities,
      metrics: verifiedMetrics,
    },
  });

  // Connect Entity Nodes -> Spec Matrix
  normalizedEntities.forEach((_, idx) => {
    rawEdges.push({
      id: `edge-entity-${idx}-to-matrix`,
      source: `entity-${idx}`,
      target: matrixNodeId,
      animated: true,
      label: 'Telemetry Specs',
      style: { stroke: '#38bdf8', strokeWidth: 2 },
    });
  });

  // 3. Community Sentiment Node (if sentiments available)
  const sentimentNodeId = 'sentiment-node';
  if (communitySentiment && communitySentiment.length > 0) {
    rawNodes.push({
      id: sentimentNodeId,
      type: 'sentimentNode',
      position: { x: 0, y: 0 },
      data: {
        category,
        entities: normalizedEntities,
        sentiments: communitySentiment,
      },
    });

    normalizedEntities.forEach((_, idx) => {
      rawEdges.push({
        id: `edge-entity-${idx}-to-sentiment`,
        source: `entity-${idx}`,
        target: sentimentNodeId,
        style: { stroke: '#818cf8', strokeWidth: 1.5, strokeDasharray: '4 4' },
      });
    });
  }

  // 4. Verdict & Synthesis Node
  const verdictNodeId = 'verdict-node';
  rawNodes.push({
    id: verdictNodeId,
    type: 'verdictNode',
    position: { x: 0, y: 0 },
    data: {
      category,
      entities: normalizedEntities,
      verdictSummary: verdictSummary || 'Direct comparative synthesis based on benchmark telemetry.',
    },
  });

  // Connect Matrix and Sentiment -> Verdict
  rawEdges.push({
    id: 'edge-matrix-to-verdict',
    source: matrixNodeId,
    target: verdictNodeId,
    animated: true,
    label: 'Rank Synthesis',
    style: { stroke: '#34d399', strokeWidth: 2 },
  });

  if (communitySentiment && communitySentiment.length > 0) {
    rawEdges.push({
      id: 'edge-sentiment-to-verdict',
      source: sentimentNodeId,
      target: verdictNodeId,
      label: 'Sentiment Weight',
      style: { stroke: '#a78bfa', strokeWidth: 1.5 },
    });
  }

  // Calculate Dagre positions
  return getLayoutedElements(rawNodes, rawEdges, direction);
}

/**
 * Calculates 3D World Spatial Coordinates [X, Y, Z] for WebGL Drei scene placement.
 */
export function calculate3DNodePositions(count: number): Array<[number, number, number]> {
  if (count <= 1) return [[0, 0, 0]];
  if (count === 2) return [[-4.5, 0, 0], [4.5, 0, 0]];
  if (count === 3) return [[-7.5, 0, 1], [0, 0, -4.5], [7.5, 0, 1]];
  if (count === 4) return [[-10, 0, 0], [-3.5, 0, -6], [3.5, 0, -6], [10, 0, 0]];

  // Linear / Staggered spacing by at least 6 to 8 units
  return Array.from({ length: count }, (_, i) => {
    const x = (i - (count - 1) / 2) * 7.5;
    const z = (i % 2 === 1) ? -4.5 : 0;
    return [x, 0, z] as [number, number, number];
  });
}
