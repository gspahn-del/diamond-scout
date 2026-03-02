import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pitches, plateAppearances } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await db.select().from(pitches)
    .where(eq(pitches.gameId, Number(id)))
    .orderBy(pitches.plateAppearanceId, pitches.sequenceNumber);
  return NextResponse.json(result);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { plateAppearanceId, batterId, sequenceNumber, pitchType, pitchResult, locationX, locationY, velocity } = body;

  if (!plateAppearanceId || !pitchType || !pitchResult || sequenceNumber === undefined) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const result = await db.insert(pitches)
    .values({
      plateAppearanceId,
      gameId: Number(id),
      batterId,
      sequenceNumber,
      pitchType,
      pitchResult,
      locationX,
      locationY,
      velocity,
    })
    .returning();

  // Update pitch count on plate appearance
  const allPitches = await db.select().from(pitches)
    .where(eq(pitches.plateAppearanceId, plateAppearanceId));
  const count = allPitches.length;
  await db.update(plateAppearances)
    .set({ pitchCount: count, updatedAt: new Date().toISOString() })
    .where(eq(plateAppearances.id, plateAppearanceId));

  return NextResponse.json(result[0], { status: 201 });
}
