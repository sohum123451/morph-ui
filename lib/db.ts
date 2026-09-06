import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL || "";
const authToken = process.env.TURSO_AUTH_TOKEN || "";

export const db = createClient({
  url,
  authToken,
});

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