import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { plateAppearances, pitches } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pas = await db.select().from(plateAppearances)
    .where(eq(plateAppearances.gameId, Number(id)))
    .orderBy(plateAppearances.inning, plateAppearances.paNumber);
  return NextResponse.json(pas);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { playerId, inning, paNumber } = body;
  if (!playerId || !inning || paNumber === undefined) {
    return NextResponse.json({ error: 'playerId, inning, paNumber required' }, { status: 400 });
  }
  const result = await db.insert(plateAppearances)
    .values({ gameId: Number(id), playerId, inning, paNumber, pitchCount: 0 })
    .returning();
  return NextResponse.json(result[0], { status: 201 });
}
