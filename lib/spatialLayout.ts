import dagre from 'dagre';
import { Node, Edge } from '@xyflow/react';

export const DEFAULT_NODE_WIDTH = 380;
export const DEFAULT_NODE_HEIGHT = 250;

export interface DynamicTileData {
  id: string;
  component: string;
  props?: any;
  title?: string;
  rationale?: string;
  priority?: string;
  disparityPct?: number;
  triggerMetric?: string;
}

/**
 * Calculates dynamic bounding box dimensions based on node measurements,
 * widget type, and content size to prevent spatial collisions on the canvas.
 */
export function calculateNodeDimensions(node: Node | { type?: string; data?: any }): { width: number; height: number } {
  const nodeAny = node as any;
  // 1. Check measured dimensions from React Flow runtime
  if (nodeAny.measured?.width && nodeAny.measured?.height) {
    return {
      width: Math.max(nodeAny.measured.width, 320),
      height: Math.max(nodeAny.measured.height, 200),
    };
  }

  const data = (node.data || {}) as any;
  if (data.width && data.height) {
    return { width: data.width, height: data.height };
  }

  // 2. Check component type from generative tile or node type
  const componentType = data.component || node.type || data.type || '';
  switch (componentType) {
    case 'entityNode':
      return { width: 320, height: 260 };
    case 'specMatrixNode': {
      const metricCount = Array.isArray(data.metrics) ? data.metrics.length : 6;
      return { width: 540, height: Math.min(680, 280 + metricCount * 34) };
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
        width: 480,
        height: Math.min(520, 260 + itemCount * 38),
      };
    }
    case 'TimelineCalendar':
    case 'timeline_calendar': {
      const eventCount = Array.isArray(data.events) ? data.events.length : 3;
      return {
        width: 480,
        height: Math.min(550, 260 + eventCount * 45),
      };
    }
    case 'AdmissionPredictor':
    case 'admission_predictor': {
      const instCount = Array.isArray(data.institutions) ? data.institutions.length : 3;
      return {
        width: 480,
        height: Math.min(520, 260 + instCount * 42),
      };
    }
    case 'DivergenceLedger':
    case 'divergence_ledger': {
      const deltaCount = Array.isArray(data.deltas) ? data.deltas.length : 3;
      return {
        width: 460,
        height: Math.min(480, 240 + deltaCount * 45),
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
  if (nodes.length === 0) return { nodes: [], edges };

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 90, // Horizontal separation between adjacent nodes
    ranksep: 110, // Vertical separation between ranks/tiers
    marginx: 80,
    marginy: 80,
  });

  const nodeDimensionMap = new Map<string, { width: number; height: number }>();

  nodes.forEach((node) => {
    const dims = calculateNodeDimensions(node);
    nodeDimensionMap.set(node.id, dims);
    dagreGraph.setNode(node.id, { width: dims.width, height: dims.height });
  });

  edges.forEach((edge) => {
    // Only add edge if both source and target exist in nodes
    if (nodeDimensionMap.has(edge.source) && nodeDimensionMap.has(edge.target)) {
      dagreGraph.setEdge(edge.source, edge.target);
    }
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
        x: nodeWithPosition ? nodeWithPosition.x - dims.width / 2 : (node.position?.x || 0),
        y: nodeWithPosition ? nodeWithPosition.y - dims.height / 2 : (node.position?.y || 0),
      },
    };
  });

  return { nodes: resolveSpatialCollisions(layoutedNodes, 40), edges };
}

/**
 * Spatial Collision Resolver:
 * Inspects all nodes in a coordinate plane and adjusts positions with bounding box
 * offset calculations so no two widgets overlap or bunch up.
 */
export function resolveSpatialCollisions(nodes: Node[], padding = 40): Node[] {
  if (nodes.length <= 1) return nodes;

  const resolved = [...nodes];
  let hasCollision = true;
  let iterations = 0;
  const maxIterations = 15;

  while (hasCollision && iterations < maxIterations) {
    hasCollision = false;
    iterations++;

    for (let i = 0; i < resolved.length; i++) {
      for (let j = i + 1; j < resolved.length; j++) {
        const nodeA = resolved[i];
        const nodeB = resolved[j];

        const dimsA = calculateNodeDimensions(nodeA);
        const dimsB = calculateNodeDimensions(nodeB);

        const posA = nodeA.position;
        const posB = nodeB.position;

        const leftA = posA.x;
        const rightA = posA.x + dimsA.width;
        const topA = posA.y;
        const bottomA = posA.y + dimsA.height;

        const leftB = posB.x;
        const rightB = posB.x + dimsB.width;
        const topB = posB.y;
        const bottomB = posB.y + dimsB.height;

        // Check if bounding boxes overlap with padding
        const overlapsX = leftA < rightB + padding && rightA + padding > leftB;
        const overlapsY = topA < bottomB + padding && bottomA + padding > topB;

        if (overlapsX && overlapsY) {
          hasCollision = true;
          // Calculate minimal push distance
          const overlapX = Math.min(rightA + padding - leftB, rightB + padding - leftA);
          const overlapY = Math.min(bottomA + padding - topB, bottomB + padding - topA);

          if (overlapX < overlapY) {
            const shift = overlapX / 2;
            if (posA.x < posB.x) {
              resolved[i] = { ...nodeA, position: { ...posA, x: posA.x - shift } };
              resolved[j] = { ...nodeB, position: { ...posB, x: posB.x + shift } };
            } else {
              resolved[i] = { ...nodeA, position: { ...posA, x: posA.x + shift } };
              resolved[j] = { ...nodeB, position: { ...posB, x: posB.x - shift } };
            }
          } else {
            const shift = overlapY / 2;
            if (posA.y < posB.y) {
              resolved[i] = { ...nodeA, position: { ...posA, y: posA.y - shift } };
              resolved[j] = { ...nodeB, position: { ...posB, y: posB.y + shift } };
            } else {
              resolved[i] = { ...nodeA, position: { ...posA, y: posA.y + shift } };
              resolved[j] = { ...nodeB, position: { ...posB, y: posB.y - shift } };
            }
          }
        }
      }
    }
  }

  return resolved;
}

/**
 * Multi-Column Grid Offset Layout for simultaneously spawned generative tiles.
 * Dynamically computes non-overlapping spatial coordinates (X_n, Y_n) centered relative
 * to the viewport or attached downstream from the telemetry matrix.
 */
export function layoutDynamicNodesAndEdges(params: {
  primaryNodes: Node[];
  primaryEdges: Edge[];
  dynamicTiles: DynamicTileData[];
  direction?: 'TB' | 'LR';
  onRemoveNode?: (id: string) => void;
}): { nodes: Node[]; edges: Edge[] } {
  const {
    primaryNodes,
    primaryEdges,
    dynamicTiles = [],
    direction = 'TB',
    onRemoveNode,
  } = params;

  if (dynamicTiles.length === 0) {
    return { nodes: primaryNodes, edges: primaryEdges };
  }

  // Find the anchor matrix node to position dynamic tiles in relation
  const matrixNode = primaryNodes.find((n) => n.id === 'spec-matrix-node') || primaryNodes[0];
  const matrixX = matrixNode?.position?.x || 0;
  const matrixY = matrixNode?.position?.y || 0;
  const matrixDims = matrixNode ? calculateNodeDimensions(matrixNode) : { width: 540, height: 400 };

  const allNodes: Node[] = [...primaryNodes];
  const allEdges: Edge[] = [...primaryEdges];

  // Distribute dynamic tiles across columns or connected graph ranks
  const columnCount = dynamicTiles.length >= 3 ? 2 : 1;
  const horizontalGap = 80;
  const verticalGap = 70;

  dynamicTiles.forEach((tile, index) => {
    const tileNodeId = tile.id;
    const initialDims = calculateNodeDimensions({ type: 'generativeTileNode', data: tile });

    // Multi-column placement relative to matrix node
    const col = index % columnCount;
    const row = Math.floor(index / columnCount);

    let posX = 0;
    let posY = 0;

    if (direction === 'TB') {
      // Place dynamic tiles to the right of the matrix tier or downstream
      const baseX = matrixX + matrixDims.width + horizontalGap;
      posX = baseX + col * (initialDims.width + horizontalGap);
      posY = matrixY + row * (initialDims.height + verticalGap);
    } else {
      // LR layout: place dynamic tiles below the matrix tier
      const baseY = matrixY + matrixDims.height + verticalGap;
      posX = matrixX + col * (initialDims.width + horizontalGap);
      posY = baseY + row * (initialDims.height + verticalGap);
    }

    const dynamicNode: Node = {
      id: tileNodeId,
      type: 'generativeTileNode',
      position: { x: posX, y: posY },
      data: {
        ...tile,
        onRemoveNode,
      },
    };

    allNodes.push(dynamicNode);

    // Connect edge from matrix node to dynamic tile
    allEdges.push({
      id: `edge-matrix-to-${tileNodeId}`,
      source: matrixNode ? matrixNode.id : primaryNodes[0]?.id || 'entity-0',
      target: tileNodeId,
      animated: true,
      label: tile.triggerMetric ? `Disparity: ${tile.triggerMetric}` : 'Dynamic Telemetry',
      style: { stroke: '#38bdf8', strokeWidth: 2, strokeDasharray: '4 4' },
    });
  });

  // Run full Dagre graph layout with all nodes and edges to maintain clean hierarchy
  const layouted = getLayoutedElements(allNodes, allEdges, direction);
  return layouted;
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

  return Array.from({ length: count }, (_, i) => {
    const x = (i - (count - 1) / 2) * 7.5;
    const z = (i % 2 === 1) ? -4.5 : 0;
    return [x, 0, z] as [number, number, number];
  });
}
