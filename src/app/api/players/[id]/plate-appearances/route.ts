import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { plateAppearances, pitches, battedBalls } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const playerId = Number(id);

  const pas = await db.select().from(plateAppearances)
    .where(eq(plateAppearances.playerId, playerId));

  // For each PA, fetch associated pitches and batted balls
  const pasWithData = await Promise.all(
    pas.map(async (pa) => {
      const paPitches = await db.select().from(pitches)
        .where(eq(pitches.plateAppearanceId, pa.id))
        .orderBy(pitches.sequenceNumber);

      const paBattedBalls = await db.select().from(battedBalls)
        .where(eq(battedBalls.plateAppearanceId, pa.id));

      return {
        ...pa,
        pitches: paPitches,
        battedBall: paBattedBalls[0] || undefined,
      };
    })
  );

  return NextResponse.json(pasWithData);
}
