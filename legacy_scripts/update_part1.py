with open("app/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace state block
old_state = """  // Safe entity resolution
  const displayEntityA = isSwapped
    ? comparisonData?.entity_b?.name || 'Option B'
    : comparisonData?.entity_a?.name || 'Option A';

  const displayEntityB = isSwapped
    ? comparisonData?.entity_a?.name || 'Option A'
    : comparisonData?.entity_b?.name || 'Option B';

  const displayProsA = useMemo(() => {
    const raw = isSwapped ? comparisonData?.entity_b?.pros : comparisonData?.entity_a?.pros;
    const arr = Array.isArray(raw) ? raw : [];
    const filtered = arr.filter((item) => !isMissingVerdictBullet(item));
    return filtered.length > 0 ? filtered : ['Established baseline specifications and capabilities'];
  }, [comparisonData, isSwapped]);

  const displayProsB = useMemo(() => {
    const raw = isSwapped ? comparisonData?.entity_a?.pros : comparisonData?.entity_b?.pros;
    const arr = Array.isArray(raw) ? raw : [];
    const filtered = arr.filter((item) => !isMissingVerdictBullet(item));
    return filtered.length > 0 ? filtered : ['Targeted performance benchmarks and advantages'];
  }, [comparisonData, isSwapped]);

  const category = comparisonData?.category || 'Comparative Analysis';
  const verdictSummary = comparisonData?.verdict_summary || '';
  const categories = comparisonData?.categories || {};
  const communitySentiment = comparisonData?.community_sentiment || [];
  const suggestedMetrics = comparisonData?.suggested_metrics || [];

  // Flattened verified metrics for spatial canvas & counts
  const flatVerifiedMetrics = useMemo(() => {
    const list: VerifiedMetric[] = [];
    Object.values(categories).forEach((arr) => {
      if (Array.isArray(arr)) list.push(...arr);
    });
    return list;
  }, [categories]);

  const normalizedCategories = useMemo(() => {
    const result: Record<string, VerifiedMetric[]> = {};
    for (const [catName, metrics] of Object.entries(categories)) {
      result[catName] = metrics.map((m) => ({
        metric: m.metric,
        entity_a: isSwapped ? m.entity_b : m.entity_a,
        entity_b: isSwapped ? m.entity_a : m.entity_b,
        source_type: m.source_type,
      }));
    }
    return result;
  }, [categories, isSwapped]);

  const normalizedCommunitySentiment = useMemo(() => {
    return communitySentiment.map((s) => ({
      topic: s.topic,
      entity_a_consensus: isSwapped ? s.entity_b_consensus : s.entity_a_consensus,
      entity_b_consensus: isSwapped ? s.entity_a_consensus : s.entity_b_consensus,
      sentiment: s.sentiment,
    }));
  }, [communitySentiment, isSwapped]);

  // Dynamic Filtered Categories
  const filteredCategories = useMemo(() => {
    if (!tableSearch.trim()) return normalizedCategories;
    const term = tableSearch.toLowerCase();
    const result: Record<string, VerifiedMetric[]> = {};

    for (const [catName, metrics] of Object.entries(normalizedCategories)) {
      const matching = metrics.filter(
        (m) =>
          m.metric.toLowerCase().includes(term) ||
          m.entity_a.toLowerCase().includes(term) ||
          m.entity_b.toLowerCase().includes(term)
      );
      if (matching.length > 0) {
        result[catName] = matching;
      }
    }
    return result;
  }, [normalizedCategories, tableSearch]);

  const filteredCommunitySentiment = useMemo(() => {
    if (!tableSearch.trim()) return normalizedCommunitySentiment;
    const term = tableSearch.toLowerCase();
    return normalizedCommunitySentiment.filter(
      (s) =>
        s.topic.toLowerCase().includes(term) ||
        s.entity_a_consensus.toLowerCase().includes(term) ||
        s.entity_b_consensus.toLowerCase().includes(term)
    );
  }, [normalizedCommunitySentiment, tableSearch]);"""

new_state = """  // Dynamic Multi-Entity Resolution
  const rawEntities: EntityVerdict[] = useMemo(() => {
    if (comparisonData?.entities && comparisonData.entities.length > 0) {
      return comparisonData.entities;
    }
    if (comparisonData?.entity_a && comparisonData?.entity_b) {
      return [comparisonData.entity_a, comparisonData.entity_b];
    }
    return [];
  }, [comparisonData]);

  const displayEntities: EntityVerdict[] = useMemo(() => {
    if (rawEntities.length === 0) return [];
    if (isSwapped && rawEntities.length === 2) {
      return [rawEntities[1], rawEntities[0]];
    }
    return rawEntities;
  }, [rawEntities, isSwapped]);

  const displayEntityA = displayEntities[0]?.name || 'Option A';
  const displayEntityB = displayEntities[1]?.name || 'Option B';

  const category = comparisonData?.category || 'Comparative Analysis';
  const verdictSummary = comparisonData?.verdict_summary || '';
  const categories = comparisonData?.categories || {};
  const communitySentiment = comparisonData?.community_sentiment || [];
  const suggestedMetrics = comparisonData?.suggested_metrics || [];

  // Flattened verified metrics for spatial canvas & counts
  const flatVerifiedMetrics = useMemo(() => {
    const list: VerifiedMetric[] = [];
    Object.values(categories).forEach((arr) => {
      if (Array.isArray(arr)) list.push(...arr);
    });
    return list;
  }, [categories]);

  const normalizedCategories = useMemo(() => {
    const result: Record<string, VerifiedMetric[]> = {};
    for (const [catName, metrics] of Object.entries(categories)) {
      result[catName] = metrics.map((m) => {
        let values = m.values ? [...m.values] : [m.entity_a || '', m.entity_b || ''];
        if (isSwapped && values.length === 2) {
          values = [values[1], values[0]];
        }
        return {
          metric: m.metric,
          values,
          entity_a: values[0] || 'Not specified',
          entity_b: values[1] || 'Not specified',
          source_type: m.source_type,
        };
      });
    }
    return result;
  }, [categories, isSwapped]);

  const normalizedCommunitySentiment = useMemo(() => {
    return communitySentiment.map((s) => {
      let consensuses = s.consensuses ? [...s.consensuses] : [s.entity_a_consensus || '', s.entity_b_consensus || ''];
      if (isSwapped && consensuses.length === 2) {
        consensuses = [consensuses[1], consensuses[0]];
      }
      return {
        topic: s.topic,
        consensuses,
        entity_a_consensus: consensuses[0] || 'General consensus',
        entity_b_consensus: consensuses[1] || 'General consensus',
        sentiment: s.sentiment,
      };
    });
  }, [communitySentiment, isSwapped]);

  // Dynamic Filtered Categories
  const filteredCategories = useMemo(() => {
    if (!tableSearch.trim()) return normalizedCategories;
    const term = tableSearch.toLowerCase();
    const result: Record<string, VerifiedMetric[]> = {};

    for (const [catName, metrics] of Object.entries(normalizedCategories)) {
      const matching = metrics.filter(
        (m) =>
          m.metric.toLowerCase().includes(term) ||
          (m.values && m.values.some((v) => v.toLowerCase().includes(term))) ||
          (m.entity_a && m.entity_a.toLowerCase().includes(term)) ||
          (m.entity_b && m.entity_b.toLowerCase().includes(term))
      );
      if (matching.length > 0) {
        result[catName] = matching;
      }
    }
    return result;
  }, [normalizedCategories, tableSearch]);

  const filteredCommunitySentiment = useMemo(() => {
    if (!tableSearch.trim()) return normalizedCommunitySentiment;
    const term = tableSearch.toLowerCase();
    return normalizedCommunitySentiment.filter(
      (s) =>
        s.topic.toLowerCase().includes(term) ||
        (s.consensuses && s.consensuses.some((c) => c.toLowerCase().includes(term))) ||
        (s.entity_a_consensus && s.entity_a_consensus.toLowerCase().includes(term)) ||
        (s.entity_b_consensus && s.entity_b_consensus.toLowerCase().includes(term))
    );
  }, [normalizedCommunitySentiment, tableSearch]);"""

if old_state in content:
    content = content.replace(old_state, new_state)
    print("Replaced state block successfully")
else:
    print("Could not find old_state exactly")

with open("app/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
