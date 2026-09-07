import { NextRequest, NextResponse } from "next/server";
import { getRecentSessions, saveSession } from "@/lib/db";

export async function GET() {
  const sessions = await getRecentSessions(10);
  return NextResponse.json({ sessions });
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, widgets } = await req.json();
    if (!prompt || !widgets) {
      return NextResponse.json({ error: "Missing prompt or widgets" }, { status: 400 });
    }
    const id = "sess_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const ok = await saveSession(id, prompt, JSON.stringify(widgets));
    return NextResponse.json({ success: ok, id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}