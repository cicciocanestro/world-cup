import { NextResponse } from 'next/server';
import { fetchScoreboard } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const events = await fetchScoreboard();
    return NextResponse.json(events);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch scoreboard' }, { status: 500 });
  }
}
