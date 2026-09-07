import { z } from 'zod';

export const ComparisonNodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: z.object({
    entityA: z.string(),
    entityB: z.string(),
    metrics: z.record(z.string(), z.any()),
    verdict: z.string().optional(),
  }).passthrough(),
}).passthrough();

export const CanvasPayloadSchema = z.object({
  nodes: z.array(ComparisonNodeSchema),
  edges: z.array(z.any()).optional(),
});

export function validateCanvasPayload(payload: unknown) {
  const result = CanvasPayloadSchema.safeParse(payload);
  if (!result.success) {
    throw new Error(`Invalid component schema emitted by LLM: ${result.error.message}`);
  }
  return result.data;
}
