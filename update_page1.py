with open("app/page.tsx", "r", encoding="utf-8") as f:
    page_content = f.read()

# Let's inspect imports in page.tsx
# Ensure EntityVerdict, ComparisonPoint, etc. are imported
old_types_import = "import {\n  VerifiedMetric,\n  CommunitySentiment,\n  GenerativeComparisonResponse,\n} from '@/types/morphui';"
new_types_import = "import {\n  VerifiedMetric,\n  CommunitySentiment,\n  GenerativeComparisonResponse,\n  EntityVerdict,\n} from '@/types/morphui';"

page_content = page_content.replace(old_types_import, new_types_import)

# Define ENTITY_BADGES constant
badges_code = """const ENTITY_BADGES = [
  { bg: 'bg-sky-500/10 text-sky-400 border-sky-500/20', dot: 'bg-sky-400', text: 'text-sky-400', label: 'Option A' },
  { bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', dot: 'bg-indigo-400', text: 'text-indigo-400', label: 'Option B' },
  { bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20', dot: 'bg-purple-400', text: 'text-purple-400', label: 'Option C' },
  { bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400', text: 'text-emerald-400', label: 'Option D' },
  { bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20', dot: 'bg-amber-400', text: 'text-amber-400', label: 'Option E' },
];
"""

if "const ENTITY_BADGES =" not in page_content:
    insert_pos = page_content.find("function isMissingValue")
    page_content = page_content[:insert_pos] + badges_code + "\n" + page_content[insert_pos:]

# Update SpecMatrixNode for multi-entity support
old_spec_node = """const SpecMatrixNode = memo(function SpecMatrixNode({ data }: any) {
  const { entityA, entityB, category, metrics = [] } = data;
  return (
    <div className="w-[320px] sm:w-[380px] min-h-min h-auto bg-slate-900/95 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-2xl text-slate-100 backdrop-blur-xl">
      <Handle type="target" position={Position.Left} className="!bg-sky-500 !w-3 !h-3 !border-2 !border-slate-900" />
      <Handle type="source" position={Position.Right} className="!bg-sky-500 !w-3 !h-3 !border-2 !border-slate-900" />
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-white">Verified Spec Matrix</h4>
            <span className="text-[10px] text-slate-400 font-mono whitespace-normal break-words">{category}</span>
          </div>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-sky-300 font-mono border border-slate-700 shrink-0">
          Node 1
        </span>
      </div>

      <div className="grid grid-cols-12 gap-2 text-[10px] uppercase font-mono text-slate-400 pb-1.5 border-b border-slate-800/60">
        <div className="col-span-5">Metric</div>
        <div className="col-span-3 text-sky-400 whitespace-normal break-words">{entityA}</div>
        <div className="col-span-4 text-indigo-400 whitespace-normal break-words">{entityB}</div>
      </div>

      <div className="divide-y divide-slate-800/60 text-xs">
        {metrics.slice(0, 7).map((m: VerifiedMetric, idx: number) => (
          <div key={idx} className="grid grid-cols-12 gap-2 py-2 items-start">
            <div className="col-span-5 text-slate-300 font-medium text-[11px] whitespace-normal break-words">
              {m.metric}
            </div>
            <div className="col-span-3 text-slate-100 text-[11px] whitespace-normal break-words">
              {renderValueWithFallback(m.entity_a)}
            </div>
            <div className="col-span-4 text-slate-100 text-[11px] whitespace-normal break-words">
              {renderValueWithFallback(m.entity_b)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});"""

new_spec_node = """const SpecMatrixNode = memo(function SpecMatrixNode({ data }: any) {
  const { entities = [], category, metrics = [] } = data;
  const entityList: string[] = entities.length > 0 ? entities.map((e: any) => typeof e === 'object' ? e.name : e) : [data.entityA || 'Option A', data.entityB || 'Option B'];

  return (
    <div className="w-[340px] sm:w-[440px] min-h-min h-auto bg-slate-900/95 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-2xl text-slate-100 backdrop-blur-xl">
      <Handle type="target" position={Position.Left} className="!bg-sky-500 !w-3 !h-3 !border-2 !border-slate-900" />
      <Handle type="source" position={Position.Right} className="!bg-sky-500 !w-3 !h-3 !border-2 !border-slate-900" />
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-white">Verified Spec Matrix</h4>
            <span className="text-[10px] text-slate-400 font-mono whitespace-normal break-words">{category}</span>
          </div>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-sky-300 font-mono border border-slate-700 shrink-0">
          Node 1
        </span>
      </div>

      <div className="flex items-center divide-x divide-slate-800/80 text-[10px] uppercase font-mono text-slate-400 pb-1.5 border-b border-slate-800/60">
        <div className="w-28 shrink-0 pr-2">Metric</div>
        {entityList.map((name, i) => (
          <div key={i} className="flex-1 px-1.5 truncate text-sky-300 font-semibold">{name}</div>
        ))}
      </div>

      <div className="divide-y divide-slate-800/60 text-xs">
        {metrics.slice(0, 7).map((m: VerifiedMetric, idx: number) => (
          <div key={idx} className="flex items-start divide-x divide-slate-800/40 py-2">
            <div className="w-28 shrink-0 pr-2 text-slate-300 font-medium text-[11px] whitespace-normal break-words">
              {m.metric}
            </div>
            {entityList.map((_, i) => {
              const val = m.values?.[i] !== undefined ? m.values[i] : (i === 0 ? m.entity_a : m.entity_b);
              return (
                <div key={i} className="flex-1 px-1.5 text-slate-100 text-[11px] whitespace-normal break-words">
                  {renderValueWithFallback(val)}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
});"""

page_content = page_content.replace(old_spec_node, new_spec_node)

# Update SentimentBreakdownNode for multi-entity support
old_sent_node = """const SentimentBreakdownNode = memo(function SentimentBreakdownNode({ data }: any) {
  const { entityA, entityB, sentiments = [] } = data;
  return (
    <div className="w-[320px] sm:w-[420px] min-h-min h-auto bg-slate-900/95 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-2xl text-slate-100 backdrop-blur-xl">
      <Handle type="target" position={Position.Left} className="!bg-indigo-500 !w-3 !h-3 !border-2 !border-slate-900" />
      <Handle type="source" position={Position.Right} className="!bg-indigo-500 !w-3 !h-3 !border-2 !border-slate-900" />
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-white">De-Biased Reddit Sentiment</h4>
            <span className="text-[10px] text-slate-400 font-mono">Consensus normalization</span>
          </div>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono border border-slate-700 shrink-0">
          Node 2
        </span>
      </div>

      <div className="space-y-3">
        {sentiments.slice(0, 4).map((s: CommunitySentiment, idx: number) => (
          <div key={idx} className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-200 whitespace-normal break-words">{s.topic}</span>
              <span
                className={`text-[9px] uppercase font-mono px-1.5 py-0.5 rounded ${
                  s.sentiment === 'Positive'
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                    : s.sentiment === 'Critical'
                    ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                    : 'bg-amber-950/80 text-amber-300 border border-amber-800'
                }`}
              >
                {s.sentiment || 'Mixed'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300 pt-1">
              <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 whitespace-normal break-words leading-relaxed">
                <span className="text-[10px] text-sky-400 font-semibold block mb-0.5">{entityA}:</span>
                {renderValueWithFallback(s.entity_a_consensus)}
              </div>
              <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 whitespace-normal break-words leading-relaxed">
                <span className="text-[10px] text-indigo-400 font-semibold block mb-0.5">{entityB}:</span>
                {renderValueWithFallback(s.entity_b_consensus)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});"""

new_sent_node = """const SentimentBreakdownNode = memo(function SentimentBreakdownNode({ data }: any) {
  const { entities = [], sentiments = [] } = data;
  const entityList: string[] = entities.length > 0 ? entities.map((e: any) => typeof e === 'object' ? e.name : e) : [data.entityA || 'Option A', data.entityB || 'Option B'];

  return (
    <div className="w-[340px] sm:w-[460px] min-h-min h-auto bg-slate-900/95 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-2xl text-slate-100 backdrop-blur-xl">
      <Handle type="target" position={Position.Left} className="!bg-indigo-500 !w-3 !h-3 !border-2 !border-slate-900" />
      <Handle type="source" position={Position.Right} className="!bg-indigo-500 !w-3 !h-3 !border-2 !border-slate-900" />
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-white">De-Biased Reddit Sentiment</h4>
            <span className="text-[10px] text-slate-400 font-mono">Consensus normalization</span>
          </div>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono border border-slate-700 shrink-0">
          Node 2
        </span>
      </div>

      <div className="space-y-3">
        {sentiments.slice(0, 4).map((s: CommunitySentiment, idx: number) => (
          <div key={idx} className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-200 whitespace-normal break-words">{s.topic}</span>
              <span
                className={`text-[9px] uppercase font-mono px-1.5 py-0.5 rounded ${
                  s.sentiment === 'Positive'
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                    : s.sentiment === 'Critical'
                    ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                    : 'bg-amber-950/80 text-amber-300 border border-amber-800'
                }`}
              >
                {s.sentiment || 'Mixed'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300 pt-1">
              {entityList.map((name, i) => {
                const con = s.consensuses?.[i] !== undefined ? s.consensuses[i] : (i === 0 ? s.entity_a_consensus : s.entity_b_consensus);
                const badge = ENTITY_BADGES[i % ENTITY_BADGES.length];
                return (
                  <div key={i} className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 whitespace-normal break-words leading-relaxed">
                    <span className={`text-[10px] ${badge.text} font-semibold block mb-0.5`}>{name}:</span>
                    {renderValueWithFallback(con)}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});"""

page_content = page_content.replace(old_sent_node, new_sent_node)

# Update LedgerNode for multi-entity support
old_ledger_node = """const LedgerNode = memo(function LedgerNode({ data }: any) {
  const { entityA, entityB, metrics = [] } = data;

  const scoreA = useMemo(() => {
    let aWins = 0;
    metrics.forEach((m: VerifiedMetric) => {
      const vA = parseNumericValue(m.entity_a);
      const vB = parseNumericValue(m.entity_b);
      if (vA !== null && vB !== null) {
        if (vA > vB) aWins++;
      }
    });
    return aWins;
  }, [metrics]);

  const scoreB = useMemo(() => {
    let bWins = 0;
    metrics.forEach((m: VerifiedMetric) => {
      const vA = parseNumericValue(m.entity_a);
      const vB = parseNumericValue(m.entity_b);
      if (vA !== null && vB !== null) {
        if (vB > vA) bWins++;
      }
    });
    return bWins;
  }, [metrics]);

  return (
    <div className="w-[300px] sm:w-[340px] min-h-min h-auto bg-slate-900/95 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-2xl text-slate-100 backdrop-blur-xl">
      <Handle type="target" position={Position.Left} className="!bg-emerald-500 !w-3 !h-3 !border-2 !border-slate-900" />
      <Handle type="source" position={Position.Right} className="!bg-emerald-500 !w-3 !h-3 !border-2 !border-slate-900" />
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-white">Comparative Score Ledger</h4>
            <span className="text-[10px] text-slate-400 font-mono">Verified Metric Differentials</span>
          </div>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-emerald-300 font-mono border border-slate-700 shrink-0">
          Node 3
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center space-y-1">
          <span className="text-[10px] text-sky-400 font-mono uppercase truncate block">{entityA}</span>
          <div className="text-2xl font-black text-white">{scoreA}</div>
          <span className="text-[9px] text-slate-400">Winning Attributes</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center space-y-1">
          <span className="text-[10px] text-indigo-400 font-mono uppercase truncate block">{entityB}</span>
          <div className="text-2xl font-black text-white">{scoreB}</div>
          <span className="text-[9px] text-slate-400">Winning Attributes</span>
        </div>
      </div>

      <div className="text-xs text-slate-400 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
        <span className="font-semibold text-slate-300">Analysis:</span> Numeric metrics evaluated for direct quantitative edge.
      </div>
    </div>
  );
});"""

new_ledger_node = """const LedgerNode = memo(function LedgerNode({ data }: any) {
  const { entities = [], metrics = [] } = data;
  const entityList: string[] = entities.length > 0 ? entities.map((e: any) => typeof e === 'object' ? e.name : e) : [data.entityA || 'Option A', data.entityB || 'Option B'];

  const scores = useMemo(() => {
    return entityList.map((_, entIdx) => {
      let wins = 0;
      metrics.forEach((m: VerifiedMetric) => {
        const values = m.values || [m.entity_a, m.entity_b];
        const numVal = parseNumericValue(values[entIdx] || '');
        if (numVal !== null) {
          const isMax = values.every((otherVal, otherIdx) => {
            if (otherIdx === entIdx) return true;
            const otherNum = parseNumericValue(otherVal || '');
            return otherNum === null || numVal >= otherNum;
          });
          if (isMax) wins++;
        }
      });
      return wins;
    });
  }, [entityList, metrics]);

  return (
    <div className="w-[320px] sm:w-[400px] min-h-min h-auto bg-slate-900/95 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-2xl text-slate-100 backdrop-blur-xl">
      <Handle type="target" position={Position.Left} className="!bg-emerald-500 !w-3 !h-3 !border-2 !border-slate-900" />
      <Handle type="source" position={Position.Right} className="!bg-emerald-500 !w-3 !h-3 !border-2 !border-slate-900" />
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-white">Comparative Score Ledger</h4>
            <span className="text-[10px] text-slate-400 font-mono">Verified Metric Differentials</span>
          </div>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-emerald-300 font-mono border border-slate-700 shrink-0">
          Node 3
        </span>
      </div>

      <div className={`grid grid-cols-${Math.min(entityList.length, 3)} gap-2.5 mb-4`}>
        {entityList.map((name, i) => {
          const badge = ENTITY_BADGES[i % ENTITY_BADGES.length];
          return (
            <div key={i} className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center space-y-1">
              <span className={`text-[10px] ${badge.text} font-mono uppercase truncate block`}>{name}</span>
              <div className="text-xl font-black text-white">{scores[i]}</div>
              <span className="text-[9px] text-slate-400">Leading Points</span>
            </div>
          );
        })}
      </div>

      <div className="text-xs text-slate-400 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
        <span className="font-semibold text-slate-300">Analysis:</span> Multi-entity metrics benchmarked across comparative categories.
      </div>
    </div>
  );
});"""

page_content = page_content.replace(old_ledger_node, new_ledger_node)

# Update VerdictNode for multi-entity support
old_verdict_node2 = """const VerdictNode = memo(function VerdictNode({ data }: any) {
  const { entityA, entityB, verdictSummary, prosA = [], prosB = [] } = data;
  const safeProsA = (Array.isArray(prosA) ? prosA : []).filter((p: any) => !isMissingVerdictBullet(p));
  const safeProsB = (Array.isArray(prosB) ? prosB : []).filter((p: any) => !isMissingVerdictBullet(p));

  return (
    <div className="w-[320px] sm:w-[400px] min-h-min h-auto bg-slate-900/95 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-2xl text-slate-100 backdrop-blur-xl">
      <Handle type="target" position={Position.Left} className="!bg-amber-500 !w-3 !h-3 !border-2 !border-slate-900" />
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-white">Executive Synthesis</h4>
            <span className="text-[10px] text-slate-400 font-mono">Final Decision Matrix</span>
          </div>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-mono border border-slate-700 shrink-0">
          Node 4
        </span>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 mb-3 whitespace-normal break-words">
        {verdictSummary}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <div className="p-2.5 bg-slate-950/70 rounded-lg border border-slate-800 whitespace-normal break-words leading-relaxed">
          <span className="text-sky-400 font-semibold block mb-1">Pick {entityA}:</span>
          <span className="text-slate-300">{safeProsA[0] || 'Established core specifications'}</span>
        </div>
        <div className="p-2.5 bg-slate-950/70 rounded-lg border border-slate-800 whitespace-normal break-words leading-relaxed">
          <span className="text-indigo-400 font-semibold block mb-1">Pick {entityB}:</span>
          <span className="text-slate-300">{safeProsB[0] || 'Targeted performance benchmarks'}</span>
        </div>
      </div>
    </div>
  );
});"""

new_verdict_node2 = """const VerdictNode = memo(function VerdictNode({ data }: any) {
  const { entities = [], verdictSummary } = data;
  const entityList: EntityVerdict[] = entities.length > 0 ? entities : [
    { name: data.entityA || 'Option A', pros: data.prosA || [] },
    { name: data.entityB || 'Option B', pros: data.prosB || [] },
  ];

  return (
    <div className="w-[340px] sm:w-[460px] min-h-min h-auto bg-slate-900/95 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-2xl text-slate-100 backdrop-blur-xl">
      <Handle type="target" position={Position.Left} className="!bg-amber-500 !w-3 !h-3 !border-2 !border-slate-900" />
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-white">Executive Synthesis</h4>
            <span className="text-[10px] text-slate-400 font-mono">Final Decision Matrix</span>
          </div>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-mono border border-slate-700 shrink-0">
          Node 4
        </span>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 mb-3 whitespace-normal break-words">
        {verdictSummary}
      </p>

      <div className={`grid grid-cols-1 sm:grid-cols-${Math.min(entityList.length, 3)} gap-2 text-xs`}>
        {entityList.map((ent, i) => {
          const badge = ENTITY_BADGES[i % ENTITY_BADGES.length];
          const pros = (Array.isArray(ent.pros) ? ent.pros : []).filter((p: string) => !isMissingVerdictBullet(p));
          return (
            <div key={i} className="p-2.5 bg-slate-950/70 rounded-lg border border-slate-800 whitespace-normal break-words leading-relaxed">
              <span className={`${badge.text} font-semibold block mb-1`}>Pick {ent.name}:</span>
              <span className="text-slate-300">{pros[0] || `Core domain baseline advantages for ${ent.name}`}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
});"""

page_content = page_content.replace(old_verdict_node2, new_verdict_node2)

# Update SpatialCanvasWorkspace props and generatedNodes
old_spatial_props = """interface SpatialCanvasViewProps {
  entityA: string;
  entityB: string;
  category: string;
  verifiedMetrics: VerifiedMetric[];
  communitySentiment: CommunitySentiment[];
  verdictSummary: string;
  prosA: string[];
  prosB: string[];
}"""

new_spatial_props = """interface SpatialCanvasViewProps {
  entities: EntityVerdict[];
  entityA?: string;
  entityB?: string;
  category: string;
  verifiedMetrics: VerifiedMetric[];
  communitySentiment: CommunitySentiment[];
  verdictSummary: string;
  prosA?: string[];
  prosB?: string[];
}"""

page_content = page_content.replace(old_spatial_props, new_spatial_props)

old_spatial_ws = """function SpatialCanvasWorkspace({
  entityA,
  entityB,
  category,
  verifiedMetrics,
  communitySentiment,
  verdictSummary,
  prosA,
  prosB,
}: SpatialCanvasViewProps) {
  const { fitView } = useReactFlow();

  const generatedNodes: Node[] = useMemo(() => {
    return [
      {
        id: 'node-spec-matrix',
        type: 'spec_matrix',
        position: { x: 50, y: 140 },
        data: {
          entityA,
          entityB,
          category,
          metrics: verifiedMetrics,
        },
      },
      {
        id: 'node-sentiment',
        type: 'sentiment_breakdown',
        position: { x: 480, y: 140 },
        data: {
          entityA,
          entityB,
          sentiments: communitySentiment,
        },
      },
      {
        id: 'node-ledger',
        type: 'ledger_node',
        position: { x: 960, y: 140 },
        data: {
          entityA,
          entityB,
          metrics: verifiedMetrics,
        },
      },
      {
        id: 'node-verdict',
        type: 'verdict_node',
        position: { x: 1380, y: 140 },
        data: {
          entityA,
          entityB,
          verdictSummary,
          prosA,
          prosB,
        },
      },
    ];
  }, [entityA, entityB, category, verifiedMetrics, communitySentiment, verdictSummary, prosA, prosB]);"""

new_spatial_ws = """function SpatialCanvasWorkspace({
  entities = [],
  category,
  verifiedMetrics,
  communitySentiment,
  verdictSummary,
}: SpatialCanvasViewProps) {
  const { fitView } = useReactFlow();

  const generatedNodes: Node[] = useMemo(() => {
    return [
      {
        id: 'node-spec-matrix',
        type: 'spec_matrix',
        position: { x: 50, y: 140 },
        data: {
          entities,
          category,
          metrics: verifiedMetrics,
        },
      },
      {
        id: 'node-sentiment',
        type: 'sentiment_breakdown',
        position: { x: 520, y: 140 },
        data: {
          entities,
          sentiments: communitySentiment,
        },
      },
      {
        id: 'node-ledger',
        type: 'ledger_node',
        position: { x: 1020, y: 140 },
        data: {
          entities,
          metrics: verifiedMetrics,
        },
      },
      {
        id: 'node-verdict',
        type: 'verdict_node',
        position: { x: 1460, y: 140 },
        data: {
          entities,
          verdictSummary,
        },
      },
    ];
  }, [entities, category, verifiedMetrics, communitySentiment, verdictSummary]);"""

page_content = page_content.replace(old_spatial_ws, new_spatial_ws)

with open("app/page.tsx", "w", encoding="utf-8") as f:
    f.write(page_content)

print("Updated canvas nodes in page.tsx")
