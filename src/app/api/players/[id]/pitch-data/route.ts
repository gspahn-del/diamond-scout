import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pitches, games } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const result = await db.select({
    id: pitches.id,
    plateAppearanceId: pitches.plateAppearanceId,
    gameId: pitches.gameId,
    sequenceNumber: pitches.sequenceNumber,
    pitchType: pitches.pitchType,
    pitchResult: pitches.pitchResult,
    locationX: pitches.locationX,
    locationY: pitches.locationY,
    velocity: pitches.velocity,
    gameDate: games.gameDate,
  })
  .from(pitches)
  .leftJoin(games, eq(pitches.gameId, games.id))
  .where(eq(pitches.batterId, Number(id)));

  return NextResponse.json(result);
}
