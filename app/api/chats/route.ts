import { NextRequest, NextResponse } from 'next/server';
import { getChats, deleteChat } from '@/lib/db';

export async function GET() {
  try {
    const chats = await getChats();
    return NextResponse.json({ chats });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to list chats' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 });
    }
    const success = await deleteChat(id);
    return NextResponse.json({ success });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to delete chat' }, { status: 500 });
  }
}
