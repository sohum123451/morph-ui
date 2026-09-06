import { NextRequest } from 'next/server';
import { POST as comparePOST, GET as compareGET } from '@/app/api/compare/route';

export async function POST(req: NextRequest) {
  return comparePOST(req);
}

export async function GET(req: NextRequest) {
  return compareGET(req);
}
