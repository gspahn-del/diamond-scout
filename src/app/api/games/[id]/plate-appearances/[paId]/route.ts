import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { plateAppearances, pitches, battedBalls } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string; paId: string }> }) {
  const { paId } = await params;
  const paResult = await db.select().from(plateAppearances).where(eq(plateAppearances.id, Number(paId)));
  const pa = paResult[0];
  if (!pa) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const paPitches = await db.select().from(pitches)
    .where(eq(pitches.plateAppearanceId, Number(paId)))
    .orderBy(pitches.sequenceNumber);

  const paBalls = await db.select().from(battedBalls)
    .where(eq(battedBalls.plateAppearanceId, Number(paId)));

  return NextResponse.json({ ...pa, pitches: paPitches, battedBalls: paBalls });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; paId: string }> }) {
  const { paId } = await params;
  const body = await req.json();
  const { result, resultDetail, pitchCount } = body;
  const updated = await db.update(plateAppearances)
    .set({ result, resultDetail, pitchCount, updatedAt: new Date().toISOString() })
    .where(eq(plateAppearances.id, Number(paId)))
    .returning();
  return NextResponse.json(updated[0]);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; paId: string }> }) {
  const { paId } = await params;
  await db.delete(pitches).where(eq(pitches.plateAppearanceId, Number(paId)));
  await db.delete(battedBalls).where(eq(battedBalls.plateAppearanceId, Number(paId)));
  await db.delete(plateAppearances).where(eq(plateAppearances.id, Number(paId)));
  return NextResponse.json({ ok: true });
}
