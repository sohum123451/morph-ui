import { NextRequest, NextResponse } from 'next/server';
import { POST as comparePOST } from '@/app/api/compare/route';

export async function POST(req: NextRequest) {
  return comparePOST(req);
}

export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'MorphUI Generation API' });
}
