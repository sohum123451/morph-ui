with open("lib/factRetrieval.ts", "r", encoding="utf-8") as f:
    content = f.read()

multi_fn = """export async function fetchMultiEntityFacts(
  entities: string[],
  contextTopic?: string,
  timeoutMs = 3000
): Promise<EntityFactsResult[]> {
  return Promise.all(
    entities.map((entity) => fetchEntityFacts(entity, contextTopic, timeoutMs))
  );
}
"""

if "fetchMultiEntityFacts" not in content:
    content += "\n" + multi_fn

with open("lib/factRetrieval.ts", "w", encoding="utf-8") as f:
    f.write(content)

print("Updated lib/factRetrieval.ts with fetchMultiEntityFacts")
