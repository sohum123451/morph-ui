import { createClient, Client } from '@libsql/client';

let db: Client | null = null;

try {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (url && authToken) {
    db = createClient({
      url,
      authToken,
    });
  } else {
    console.warn('TURSO_DATABASE_URL or TURSO_AUTH_TOKEN missing. Using in-memory fallback.');
  }
} catch (err) {
  console.error('Failed to initialize LibSQL client:', err);
  db = null;
}

export { db };

export interface UserComparisonRecord {
  id: string;
  user_email: string;
  query: string;
  title: string;
  data_payload: string;
  created_at: string;
}

export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  chat_id: string;
  encrypted_payload: string;
  iv: string;
  sender: string;
  created_at: string;
}

const memoryUserComparisons = new Map<string, UserComparisonRecord>();
const memorySessions = new Map<string, { id: string; prompt: string; widgets: string; created_at: string }>();
const memoryChats = new Map<string, ChatSession>();
const memoryMessages = new Map<string, ChatMessage[]>();

let initialized = false;

export async function initDb() {
  if (initialized) return;

  if (!db) {
    initialized = true;
    return;
  }

  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS user_comparisons (
        id TEXT PRIMARY KEY,
        user_email TEXT NOT NULL,
        query TEXT NOT NULL,
        title TEXT NOT NULL,
        data_payload TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_user_comparisons_email ON user_comparisons(user_email);
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        prompt TEXT NOT NULL,
        widgets TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS chats (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        chat_id TEXT NOT NULL,
        encrypted_payload TEXT NOT NULL,
        iv TEXT NOT NULL,
        sender TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    initialized = true;
  } catch (err) {
    console.error('Turso initDb error:', err);
  }
}

export async function saveUserComparison(
  id: string,
  userEmail: string,
  query: string,
  title: string,
  dataPayload: string
): Promise<UserComparisonRecord> {
  await initDb();

  const record: UserComparisonRecord = {
    id,
    user_email: userEmail.toLowerCase().trim(),
    query,
    title,
    data_payload: dataPayload,
    created_at: new Date().toISOString(),
  };

  memoryUserComparisons.set(id, record);

  if (db) {
    try {
      await db.execute({
        sql: 'INSERT INTO user_comparisons (id, user_email, query, title, data_payload, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        args: [record.id, record.user_email, record.query, record.title, record.data_payload, record.created_at],
      });
    } catch (err) {
      console.warn('Turso insert user_comparison error, fallback to memory:', err);
    }
  }

  return record;
}

export async function getUserComparisons(userEmail: string): Promise<Array<{ id: string; title: string; query: string; created_at: string }>> {
  await initDb();
  const normalizedEmail = userEmail.toLowerCase().trim();

  if (db) {
    try {
      const rs = await db.execute({
        sql: 'SELECT id, title, query, created_at FROM user_comparisons WHERE user_email = ? ORDER BY created_at DESC',
        args: [normalizedEmail],
      });

      return rs.rows.map((row) => ({
        id: String(row.id),
        title: String(row.title),
        query: String(row.query),
        created_at: String(row.created_at),
      }));
    } catch (err) {
      console.warn('Turso query user comparisons error, falling back to memory:', err);
    }
  }

  const results: Array<{ id: string; title: string; query: string; created_at: string }> = [];
  memoryUserComparisons.forEach((val) => {
    if (val.user_email === normalizedEmail) {
      results.push({
        id: val.id,
        title: val.title,
        query: val.query,
        created_at: val.created_at,
      });
    }
  });

  return results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function getUserComparisonById(id: string, userEmail: string): Promise<UserComparisonRecord | null> {
  await initDb();
  const normalizedEmail = userEmail.toLowerCase().trim();

  if (db) {
    try {
      const rs = await db.execute({
        sql: 'SELECT id, user_email, query, title, data_payload, created_at FROM user_comparisons WHERE id = ? AND user_email = ?',
        args: [id, normalizedEmail],
      });

      if (rs.rows.length > 0) {
        const row = rs.rows[0];
        return {
          id: String(row.id),
          user_email: String(row.user_email),
          query: String(row.query),
          title: String(row.title),
          data_payload: String(row.data_payload),
          created_at: String(row.created_at),
        };
      }
    } catch (err) {
      console.warn('Turso get comparison by id error, falling back to memory:', err);
    }
  }

  const mem = memoryUserComparisons.get(id);
  if (mem && mem.user_email === normalizedEmail) {
    return mem;
  }

  return null;
}

export async function deleteUserComparison(id: string, userEmail: string): Promise<boolean> {
  await initDb();
  const normalizedEmail = userEmail.toLowerCase().trim();

  if (db) {
    try {
      await db.execute({
        sql: 'DELETE FROM user_comparisons WHERE id = ? AND user_email = ?',
        args: [id, normalizedEmail],
      });
    } catch (err) {
      console.warn('Turso delete comparison error:', err);
    }
  }

  const mem = memoryUserComparisons.get(id);
  if (mem && mem.user_email === normalizedEmail) {
    memoryUserComparisons.delete(id);
    return true;
  }

  return true;
}

// Backward-compatible helpers for legacy routes
export async function saveSession(id: string, prompt: string, widgetsJson: string): Promise<boolean> {
  await initDb();
  const now = new Date().toISOString();
  memorySessions.set(id, { id, prompt, widgets: widgetsJson, created_at: now });

  if (db) {
    try {
      await db.execute({
        sql: 'INSERT INTO sessions (id, prompt, widgets, created_at) VALUES (?, ?, ?, ?)',
        args: [id, prompt, widgetsJson, now],
      });
      return true;
    } catch (err) {
      console.warn('Turso insert session error:', err);
    }
  }
  return true;
}

export async function getRecentSessions(limit = 10): Promise<Array<{ id: string; prompt: string; widgets: any; created_at: string }>> {
  await initDb();
  if (db) {
    try {
      const rs = await db.execute({
        sql: 'SELECT id, prompt, widgets, created_at FROM sessions ORDER BY created_at DESC LIMIT ?',
        args: [limit],
      });
      return rs.rows.map((row) => ({
        id: String(row.id),
        prompt: String(row.prompt),
        widgets: JSON.parse(String(row.widgets) || '[]'),
        created_at: String(row.created_at),
      }));
    } catch (err) {
      console.warn('Turso get sessions error:', err);
    }
  }

  const list: Array<{ id: string; prompt: string; widgets: any; created_at: string }> = [];
  memorySessions.forEach((val) => {
    list.push({
      id: val.id,
      prompt: val.prompt,
      widgets: JSON.parse(val.widgets || '[]'),
      created_at: val.created_at,
    });
  });
  return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, limit);
}

export async function createChat(id: string, title: string): Promise<ChatSession> {
  await initDb();
  const item: ChatSession = { id, title, created_at: new Date().toISOString() };
  memoryChats.set(id, item);
  if (db) {
    try {
      await db.execute({
        sql: 'INSERT INTO chats (id, title, created_at) VALUES (?, ?, ?)',
        args: [item.id, item.title, item.created_at],
      });
    } catch (err) {
      console.warn('Turso insert chat error:', err);
    }
  }
  return item;
}

export async function getChats(): Promise<ChatSession[]> {
  await initDb();
  if (db) {
    try {
      const rs = await db.execute('SELECT id, title, created_at FROM chats ORDER BY created_at DESC');
      return rs.rows.map((r) => ({
        id: String(r.id),
        title: String(r.title),
        created_at: String(r.created_at),
      }));
    } catch (err) {
      console.warn('Turso getChats error:', err);
    }
  }
  return Array.from(memoryChats.values()).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function getChatById(id: string): Promise<ChatSession | null> {
  await initDb();
  if (db) {
    try {
      const rs = await db.execute({
        sql: 'SELECT id, title, created_at FROM chats WHERE id = ?',
        args: [id],
      });
      if (rs.rows.length > 0) {
        const r = rs.rows[0];
        return { id: String(r.id), title: String(r.title), created_at: String(r.created_at) };
      }
    } catch (err) {
      console.warn('Turso getChatById error:', err);
    }
  }
  return memoryChats.get(id) || null;
}

export async function saveMessage(id: string, chatId: string, encryptedPayload: string, iv: string, sender: string): Promise<ChatMessage> {
  await initDb();
  const item: ChatMessage = {
    id,
    chat_id: chatId,
    encrypted_payload: encryptedPayload,
    iv,
    sender,
    created_at: new Date().toISOString(),
  };
  const list = memoryMessages.get(chatId) || [];
  list.push(item);
  memoryMessages.set(chatId, list);

  if (db) {
    try {
      await db.execute({
        sql: 'INSERT INTO messages (id, chat_id, encrypted_payload, iv, sender, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        args: [item.id, item.chat_id, item.encrypted_payload, item.iv, item.sender, item.created_at],
      });
    } catch (err) {
      console.warn('Turso insert message error:', err);
    }
  }
  return item;
}

export async function getChatMessages(chatId: string): Promise<ChatMessage[]> {
  await initDb();
  if (db) {
    try {
      const rs = await db.execute({
        sql: 'SELECT id, chat_id, encrypted_payload, iv, sender, created_at FROM messages WHERE chat_id = ? ORDER BY created_at ASC',
        args: [chatId],
      });
      return rs.rows.map((r) => ({
        id: String(r.id),
        chat_id: String(r.chat_id),
        encrypted_payload: String(r.encrypted_payload),
        iv: String(r.iv),
        sender: String(r.sender),
        created_at: String(r.created_at),
      }));
    } catch (err) {
      console.warn('Turso getChatMessages error:', err);
    }
  }
  return memoryMessages.get(chatId) || [];
}

export async function deleteChat(id: string): Promise<boolean> {
  await initDb();
  if (db) {
    try {
      await db.execute({
        sql: 'DELETE FROM messages WHERE chat_id = ?',
        args: [id],
      });
      await db.execute({
        sql: 'DELETE FROM chats WHERE id = ?',
        args: [id],
      });
    } catch (err) {
      console.warn('Turso deleteChat error:', err);
    }
  }
  memoryChats.delete(id);
  memoryMessages.delete(id);
  return true;
}
