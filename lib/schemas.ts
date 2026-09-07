import { z } from 'zod';
import type { GenerativeComparisonResponse } from '@/types/morphui';

/** Base node schema for the canvas graph */
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

/** Full payload schema expected by the UI */
export const CanvasPayloadSchema = z.object({
  // Graph structure
  nodes: z.array(ComparisonNodeSchema),
  edges: z.array(z.any()).optional(),
  // UI-specific validation fields
  category: z.string().min(1, { message: 'Category is required' }),
  entities: z.array(
    z.object({
      name: z.string().min(1, { message: 'Entity name is required' }),
      pros: z.array(z.string()).optional(),
    })
  ).min(1, { message: 'At least one entity is required' }),
}).passthrough();

/** Runtime validator that throws on schema mismatch */
export function validateCanvasPayload(
  payload: unknown
): GenerativeComparisonResponse {
  const result = CanvasPayloadSchema.safeParse(payload);
  if (!result.success) {
    const issues = result.error.issues.map((e: z.ZodIssue) => e.message).join('; ');
    throw new Error(`Invalid canvas payload: ${issues}`);
  }
  return result.data as unknown as GenerativeComparisonResponse;
}
