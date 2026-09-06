with open("app/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update handleRunComparison
old_handle_res = """      const resolvedEntityA =
        typeof data.entity_a === 'object' && data.entity_a !== null
          ? {
              name: data.entity_a.name || 'Option A',
              pros: Array.isArray(data.entity_a.pros) ? data.entity_a.pros : [],
              tagline: data.entity_a.tagline || '',
            }
          : {
              name: typeof data.entity_a === 'string' ? data.entity_a : 'Option A',
              pros: [],
              tagline: '',
            };

      const resolvedEntityB =
        typeof data.entity_b === 'object' && data.entity_b !== null
          ? {
              name: data.entity_b.name || 'Option B',
              pros: Array.isArray(data.entity_b.pros) ? data.entity_b.pros : [],
              tagline: data.entity_b.tagline || '',
            }
          : {
              name: typeof data.entity_b === 'string' ? data.entity_b : 'Option B',
              pros: [],
              tagline: '',
            };

      let resolvedCategories: Record<string, VerifiedMetric[]> = {};
      if (data.categories && Object.keys(data.categories).length > 0) {
        resolvedCategories = data.categories;
      } else if (Array.isArray(data.verified_metrics) && data.verified_metrics.length > 0) {
        resolvedCategories = {
          [data.category || 'Core Specifications']: data.verified_metrics,
        };
      }

      const flatM = Object.values(resolvedCategories).flat();
      const validMetricsA = flatM.filter((m) => !isMissingValue(m.entity_a));
      const validMetricsB = flatM.filter((m) => !isMissingValue(m.entity_b));

      resolvedEntityA.pros = resolvedEntityA.pros.filter((p: any) => !isMissingVerdictBullet(p));
      resolvedEntityB.pros = resolvedEntityB.pros.filter((p: any) => !isMissingVerdictBullet(p));

      if (resolvedEntityA.pros.length === 0) {
        resolvedEntityA.pros = validMetricsA.slice(0, 3).map((m) => `${m.metric}: ${m.entity_a}`);
      }
      if (resolvedEntityB.pros.length === 0) {
        resolvedEntityB.pros = validMetricsB.slice(0, 3).map((m) => `${m.metric}: ${m.entity_b}`);
      }

      setComparisonData({
        category: data.category || 'Comparative Analysis',
        entity_a: resolvedEntityA,
        entity_b: resolvedEntityB,
        categories: resolvedCategories,
        verified_metrics: flatM,
        community_sentiment: Array.isArray(data.community_sentiment) ? data.community_sentiment : [],
        suggested_metrics: Array.isArray(data.suggested_metrics) ? data.suggested_metrics : [],
        verdict_summary: data.verdict_summary || `${resolvedEntityA.name} and ${resolvedEntityB.name} provide distinct tradeoffs.`,
      });"""

new_handle_res = """      let resolvedEntities: EntityVerdict[] = [];
      if (Array.isArray(data.entities) && data.entities.length > 0) {
        resolvedEntities = data.entities.map((e: any, idx: number) => {
          const name = typeof e === 'object' && e?.name ? String(e.name) : typeof e === 'string' ? e : `Option ${String.fromCharCode(65 + idx)}`;
          const pros = typeof e === 'object' && Array.isArray(e?.pros)
            ? e.pros.map(String).filter((p: string) => !isMissingVerdictBullet(p))
            : [];
          return {
            name,
            pros: pros.length > 0 ? pros : [`Established baseline capabilities for ${name}`],
          };
        });
      } else {
        const nameA = typeof data.entity_a === 'object' && data.entity_a?.name ? data.entity_a.name : 'Option A';
        const nameB = typeof data.entity_b === 'object' && data.entity_b?.name ? data.entity_b.name : 'Option B';
        const prosA = typeof data.entity_a === 'object' && Array.isArray(data.entity_a?.pros)
          ? data.entity_a.pros.filter((p: any) => !isMissingVerdictBullet(p))
          : [];
        const prosB = typeof data.entity_b === 'object' && Array.isArray(data.entity_b?.pros)
          ? data.entity_b.pros.filter((p: any) => !isMissingVerdictBullet(p))
          : [];
        resolvedEntities = [
          { name: nameA, pros: prosA.length > 0 ? prosA : [`Established baseline for ${nameA}`] },
          { name: nameB, pros: prosB.length > 0 ? prosB : [`Targeted advantages for ${nameB}`] },
        ];
      }

      let resolvedCategories: Record<string, VerifiedMetric[]> = {};
      if (data.categories && Object.keys(data.categories).length > 0) {
        resolvedCategories = data.categories;
      } else if (Array.isArray(data.verified_metrics) && data.verified_metrics.length > 0) {
        resolvedCategories = {
          [data.category || 'Core Specifications']: data.verified_metrics,
        };
      }

      const flatM = Object.values(resolvedCategories).flat();

      setComparisonData({
        category: data.category || 'Comparative Analysis',
        entities: resolvedEntities,
        entity_a: resolvedEntities[0],
        entity_b: resolvedEntities[1],
        categories: resolvedCategories,
        verified_metrics: flatM,
        community_sentiment: Array.isArray(data.community_sentiment) ? data.community_sentiment : [],
        suggested_metrics: Array.isArray(data.suggested_metrics) ? data.suggested_metrics : [],
        verdict_summary: data.verdict_summary || `Multi-entity comparison across ${resolvedEntities.map((e) => e.name).join(', ')}.`,
      });"""

content = content.replace(old_handle_res, new_handle_res)

# 2. Update Canvas call in JSX
old_canvas_call = """          <ReactFlowProvider>
            <SpatialCanvasWorkspace
              entityA={displayEntityA}
              entityB={displayEntityB}
              category={category}
              verifiedMetrics={flatVerifiedMetrics}
              communitySentiment={normalizedCommunitySentiment}
              verdictSummary={verdictSummary}
              prosA={displayProsA}
              prosB={displayProsB}
            />
          </ReactFlowProvider>"""

new_canvas_call = """          <ReactFlowProvider>
            <SpatialCanvasWorkspace
              entities={displayEntities}
              category={category}
              verifiedMetrics={flatVerifiedMetrics}
              communitySentiment={normalizedCommunitySentiment}
              verdictSummary={verdictSummary}
            />
          </ReactFlowProvider>"""

content = content.replace(old_canvas_call, new_canvas_call)

with open("app/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Updated handleRunComparison and Canvas in page.tsx")
