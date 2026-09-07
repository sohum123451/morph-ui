'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  NodeProps,
  Handle,
  Position,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { VerifiedMetric, EntityVerdict } from '@/types/morphui';

// Custom Node for Entity Anchors with Motion
function EntityAnchorNode({ data }: NodeProps) {
  const isLeader = data?.isLeader;
  return (
    <motion.div
      layout
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className={`px-4 py-3 rounded-xl border font-sans min-w-[160px] shadow-lg ${
        isLeader
          ? 'bg-[#355E58] border-[#FE9179] text-[#FFEDD1]'
          : 'bg-[#355E58] border-[#72B0AB] text-[#FFEDD1]'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-[#72B0AB] !w-2 !h-2" />
      <div className="flex items-center justify-between gap-2">
        <span className="font-bold text-xs">{data?.label as string}</span>
        <motion.span
          key={data?.score as number}
          initial={{ scale: 1.15 }}
          animate={{ scale: 1 }}
          className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
            isLeader ? 'bg-[#FE9179]/20 text-[#FE9179]' : 'bg-[#053229] text-[#BCDDDC]'
          }`}
        >
          {data?.score as number}%
        </motion.span>
      </div>
      <div className="text-[10px] text-[#BCDDDC] mt-1">
        Divergence Rank #{data?.rank as number}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-[#72B0AB] !w-2 !h-2" />
    </motion.div>
  );
}

// Custom Node for Divergence Metric Points with Motion
function MetricDivergenceNode({ data }: NodeProps) {
  const delta = data?.delta as number;
  const isHighDelta = delta > 30;

  return (
    <motion.div
      layout
      transition={{ type: 'spring', damping: 22, stiffness: 180 }}
      className={`p-3 rounded-lg border max-w-[200px] text-xs font-sans ${
        isHighDelta
          ? 'bg-[#053229] border-[#FE9179] text-[#FFEDD1]'
          : 'bg-[#053229] border-[#355E58] text-[#BCDDDC]'
      }`}
    >
      <Handle type="target" position={Position.Left} className="!bg-[#72B0AB] !w-1.5 !h-1.5" />
      <div className="font-bold text-[#FFEDD1] truncate">{data?.metric as string}</div>
      <div className="flex items-center justify-between text-[10px] font-mono mt-1 text-[#BCDDDC]">
        <span>Delta: {delta}</span>
        <motion.span
          key={data?.weight as number}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          className="text-[#FE9179] font-bold"
        >
          W: {data?.weight as number}x
        </motion.span>
      </div>
      <div className="text-[10px] text-[#72B0AB] truncate mt-1">
        {data?.summary as string}
      </div>
      <Handle type="source" position={Position.Right} className="!bg-[#72B0AB] !w-1.5 !h-1.5" />
    </motion.div>
  );
}

const nodeTypes = {
  entityAnchor: EntityAnchorNode,
  metricPoint: MetricDivergenceNode,
};

export interface DivergenceFieldProps {
  entities: EntityVerdict[];
  metrics: VerifiedMetric[];
  weights: Record<string, number>;
}

export function DivergenceField({
  entities = [],
  metrics = [],
  weights = {},
}: DivergenceFieldProps) {
  // Compute mathematical node coordinates from real data divergence
  const { nodes, edges } = useMemo(() => {
    const generatedNodes: Node[] = [];
    const generatedEdges: Edge[] = [];

    if (entities.length === 0) {
      return { nodes: generatedNodes, edges: generatedEdges };
    }

    const numEntities = entities.length;

    // Place Entity Anchors along a top horizontal axis
    const entitySpacing = 320;
    const startX = -((numEntities - 1) * entitySpacing) / 2;

    entities.forEach((ent, idx) => {
      const x = startX + idx * entitySpacing;
      const y = 50;

      generatedNodes.push({
        id: `entity-${idx}`,
        type: 'entityAnchor',
        position: { x, y },
        data: {
          label: ent.name,
          score: 80 - idx * 5,
          rank: idx + 1,
          isLeader: idx === 0,
        },
      });
    });

    // Place Metric Divergence Nodes based on actual variance & priority weight
    metrics.forEach((m, mIdx) => {
      const metricName = m.metric || `Metric ${mIdx + 1}`;
      const weight = weights[metricName] !== undefined ? weights[metricName] : 1.0;

      const valA = m.values?.[0] || m.entity_a || '';
      const valB = m.values?.[1] || m.entity_b || '';
      
      const numA = parseFloat((valA.match(/(\d+(\.\d+)?)/) || ['0', '0'])[1]);
      const numB = parseFloat((valB.match(/(\d+(\.\d+)?)/) || ['0', '0'])[1]);
      
      let divergenceDelta = Math.abs(numA - numB);
      if (divergenceDelta === 0) {
        divergenceDelta = valA !== valB ? 25 : 5;
      }
      const scaledDelta = Math.round(Math.min(100, divergenceDelta * weight));

      // Coordinate encoding
      const angle = (mIdx / Math.max(1, metrics.length)) * Math.PI * 2;
      const radius = 150 + scaledDelta * 2;
      const x = Math.cos(angle) * radius;
      const y = 220 + Math.sin(angle) * (radius * 0.7);

      const metricNodeId = `metric-${mIdx}`;
      generatedNodes.push({
        id: metricNodeId,
        type: 'metricPoint',
        position: { x, y },
        data: {
          metric: metricName,
          delta: scaledDelta,
          weight: Math.round(weight * 10) / 10,
          summary: `${valA.slice(0, 14)} vs ${valB.slice(0, 14)}`,
        },
      });

      // Connect metric node to entity anchors with tension lines
      if (entities.length >= 2) {
        generatedEdges.push({
          id: `edge-${mIdx}-0`,
          source: 'entity-0',
          target: metricNodeId,
          animated: weight > 1.2,
          style: { stroke: '#72B0AB', strokeWidth: Math.max(1, weight * 1.5), opacity: 0.6 },
        });
        generatedEdges.push({
          id: `edge-${mIdx}-1`,
          source: 'entity-1',
          target: metricNodeId,
          animated: weight > 1.2,
          style: { stroke: '#BCDDDC', strokeWidth: Math.max(1, weight * 1.5), opacity: 0.4 },
        });
      }
    });

    return { nodes: generatedNodes, edges: generatedEdges };
  }, [entities, metrics, weights]);

  const [flowNodes, , onNodesChange] = useNodesState(nodes);
  const [flowEdges, , onEdgesChange] = useEdgesState(edges);

  return (
    <div className="w-full h-[650px] rounded-xl border border-[#355E58] bg-[#053229] overflow-hidden relative shadow-2xl">
      <div className="absolute top-3 left-3 z-10 p-2.5 rounded-lg bg-[#355E58]/90 border border-[#355E58] text-xs text-[#FFEDD1] backdrop-blur-md pointer-events-none">
        <div className="font-bold uppercase tracking-wider text-[#FE9179]">Divergence Field Topology</div>
        <div className="text-[11px] text-[#BCDDDC]">Node distance encodes mathematical feature divergence & live weight</div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        minZoom={0.2}
        maxZoom={2}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#355E58" />
        <Controls className="!bg-[#355E58] !border-[#053229] !fill-[#FFEDD1] !text-[#FFEDD1] rounded-lg overflow-hidden" />
        <MiniMap
          nodeStrokeWidth={2}
          zoomable
          pannable
          className="!bg-[#355E58] !border-[#053229] rounded-lg overflow-hidden"
          maskColor="rgba(5, 50, 41, 0.7)"
        />
      </ReactFlow>
    </div>
  );
}
