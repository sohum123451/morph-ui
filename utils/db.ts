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
    console.warn('TURSO_DATABASE_URL or TURSO_AUTH_TOKEN missing. Using in-memory database fallback.');
  }
} catch (err) {
  console.error('Failed to initialize LibSQL client:', err);
  db = null;
}

export { db };

// In-Memory Fallback Storage
export interface MemoryChat {
  id: string;
  title: string;
  created_at: string;
}

export interface MemoryMessage {
  id: string;
  chat_id: string;
  encrypted_payload: string;
  iv: string;
  sender: string;
  created_at: string;
}

const memoryChats = new Map<string, MemoryChat>();
const memoryMessages = new Map<string, MemoryMessage[]>();

let initialized = false;

export async function initDb() {
  if (initialized) return;

  if (!db) {
    initialized = true;
    return;
  }

  try {
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
      );
    `);

    initialized = true;
  } catch (err) {
    console.error('Turso initDb error:', err);
  }
}

/**
 * Save or retrieve a chat session
 */
export async function createChat(id: string, title: string): Promise<MemoryChat> {
  await initDb();

  const chat: MemoryChat = {
    id,
    title,
    created_at: new Date().toISOString(),
  };

  if (db) {
    try {
      await db.execute({
        sql: 'INSERT INTO chats (id, title, created_at) VALUES (?, ?, ?)',
        args: [chat.id, chat.title, chat.created_at],
      });
      return chat;
    } catch (err) {
      console.warn('Turso insert chat error, falling back to memory:', err);
    }
  }

  memoryChats.set(id, chat);
  if (!memoryMessages.has(id)) {
    memoryMessages.set(id, []);
  }
  return chat;
}

/**
 * Get all chats ordered by latest
 */
export async function getChats(): Promise<MemoryChat[]> {
  await initDb();

  if (db) {
    try {
      const rs = await db.execute('SELECT id, title, created_at FROM chats ORDER BY created_at DESC LIMIT 50');
      return rs.rows.map((r: any) => ({
        id: String(r.id),
        title: String(r.title),
        created_at: String(r.created_at),
      }));
    } catch (err) {
      console.warn('Turso getChats error, using memory fallback:', err);
    }
  }

  return Array.from(memoryChats.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export async function getChatById(id: string): Promise<MemoryChat | null> {
  await initDb();
  if (db) {
    try {
      const rs = await db.execute({
        sql: 'SELECT id, title, created_at FROM chats WHERE id = ? LIMIT 1',
        args: [id],
      });
      if (rs.rows.length > 0) {
        const r = rs.rows[0];
        return {
          id: String(r.id),
          title: String(r.title),
          created_at: String(r.created_at),
        };
      }
    } catch (err) {
      console.warn('Turso getChatById error, checking memory:', err);
    }
  }
  return memoryChats.get(id) || null;
}

/**
 * Save an encrypted message to a chat
 */
export async function saveMessage(
  id: string,
  chatId: string,
  encryptedPayload: string,
  iv: string,
  sender: 'user' | 'assistant'
): Promise<MemoryMessage> {
  await initDb();

  const message: MemoryMessage = {
    id,
    chat_id: chatId,
    encrypted_payload: encryptedPayload,
    iv,
    sender,
    created_at: new Date().toISOString(),
  };

  if (db) {
    try {
      await db.execute({
        sql: 'INSERT INTO messages (id, chat_id, encrypted_payload, iv, sender, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        args: [message.id, message.chat_id, message.encrypted_payload, message.iv, message.sender, message.created_at],
      });
      return message;
    } catch (err) {
      console.warn('Turso saveMessage error, using memory fallback:', err);
    }
  }

  const list = memoryMessages.get(chatId) || [];
  list.push(message);
  memoryMessages.set(chatId, list);
  return message;
}

/**
 * Get all messages for a given chat ID
 */
export async function getMessagesByChatId(chatId: string): Promise<MemoryMessage[]> {
  await initDb();

  if (db) {
    try {
      const rs = await db.execute({
        sql: 'SELECT id, chat_id, encrypted_payload, iv, sender, created_at FROM messages WHERE chat_id = ? ORDER BY created_at ASC',
        args: [chatId],
      });
      return rs.rows.map((r: any) => ({
        id: String(r.id),
        chat_id: String(r.chat_id),
        encrypted_payload: String(r.encrypted_payload),
        iv: String(r.iv),
        sender: String(r.sender),
        created_at: String(r.created_at),
      }));
    } catch (err) {
      console.warn('Turso getMessagesByChatId error, using memory fallback:', err);
    }
  }

  return memoryMessages.get(chatId) || [];
}

export async function getChatMessages(chatId: string): Promise<MemoryMessage[]> {
  return getMessagesByChatId(chatId);
}

/**
 * Delete a chat and all its messages
 */
export async function deleteChat(chatId: string): Promise<boolean> {
  await initDb();

  if (db) {
    try {
      await db.execute({
        sql: 'DELETE FROM messages WHERE chat_id = ?',
        args: [chatId],
      });
      await db.execute({
        sql: 'DELETE FROM chats WHERE id = ?',
        args: [chatId],
      });
      return true;
    } catch (err) {
      console.warn('Turso deleteChat error:', err);
    }
  }

  memoryChats.delete(chatId);
  memoryMessages.delete(chatId);
  return true;
}

// Session helpers for legacy endpoints
export async function getRecentSessions(limit = 10) {
  const chats = await getChats();
  return chats.slice(0, limit);
}

export async function saveSession(id: string, prompt: string, _widgetsJson?: string) {
  await createChat(id, prompt);
  return true;
}
