import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserComparisons, getUserComparisonById, deleteUserComparison } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to view your history.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      const record = await getUserComparisonById(id, session.user.email);
      if (!record) {
        return NextResponse.json({ error: 'Comparison not found' }, { status: 404 });
      }
      const dataPayload = JSON.parse(record.data_payload);
      return NextResponse.json(dataPayload);
    }

    const history = await getUserComparisons(session.user.email);
    return NextResponse.json({ history });
  } catch (err: any) {
    console.error('History GET error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to fetch history' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to modify history.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing comparison ID' }, { status: 400 });
    }

    await deleteUserComparison(id, session.user.email);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('History DELETE error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to delete history' }, { status: 500 });
  }
}
