import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL || "";
const authToken = process.env.TURSO_AUTH_TOKEN || "";

let client: any = null;
function getClient() {
  if (!client && url && (url.startsWith("libsql://") || url.startsWith("https://") || url.startsWith("http://") || url.startsWith("file:"))) {
    try {
      client = createClient({ url, authToken });
    } catch (err) {
      console.warn("Could not create Libsql client:", err);
    }
  }
  return client;
}

export const db = {
  execute: async (...args: any[]) => {
    const c = getClient();
    if (!c) {
      console.warn("Turso DB not configured or URL invalid, skipping query.");
      return { rows: [] };
    }
    return c.execute(...args);
  }
};

export async function saveSession(id: string, prompt: string, widgetsJson: string) {
  try {
    await db.execute({
      sql: `INSERT OR REPLACE INTO morphui_sessions (id, prompt, widgets_json, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
      args: [id, prompt, widgetsJson],
    });
    return true;
  } catch (err) {
    console.error("Failed to save session to Turso:", err);
    return false;
  }
}

export async function getRecentSessions(limit = 10) {
  try {
    const res = await db.execute({
      sql: `SELECT id, prompt, widgets_json, created_at FROM morphui_sessions ORDER BY created_at DESC LIMIT ?`,
      args: [limit],
    });
    return res.rows;
  } catch (err) {
    console.error("Failed to fetch sessions from Turso:", err);
    return [];
  }
}