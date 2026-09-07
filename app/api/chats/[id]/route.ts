import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getChatById, getChatMessages, deleteChat } from '@/lib/db';
import { decryptData } from '@/lib/crypto';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Chat ID required' }, { status: 400 });
    }

    const chat = await getChatById(id);
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    const messages = await getChatMessages(id);

    const decryptedMessages = messages.map((msg: any) => {
      try {
        const payload = decryptData(msg.encrypted_payload, msg.iv);
        return {
          id: msg.id,
          chat_id: msg.chat_id,
          sender: msg.sender,
          created_at: msg.created_at,
          payload,
        };
      } catch (err) {
        return {
          id: msg.id,
          chat_id: msg.chat_id,
          sender: msg.sender,
          created_at: msg.created_at,
          error: 'Failed to decrypt message',
        };
      }
    });

    return NextResponse.json({
      chat,
      messages: decryptedMessages,
    });
  } catch (err: any) {
    console.error('Error fetching chat session:', err);
    return NextResponse.json({ error: err?.message || 'Failed to retrieve chat' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Chat ID required' }, { status: 400 });
    }

    const deleted = await deleteChat(id);
    return NextResponse.json({ success: deleted });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to delete chat' }, { status: 500 });
  }
}
