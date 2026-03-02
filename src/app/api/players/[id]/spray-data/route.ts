import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { battedBalls, games } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const balls = await db.select({
    id: battedBalls.id,
    plateAppearanceId: battedBalls.plateAppearanceId,
    gameId: battedBalls.gameId,
    batterId: battedBalls.batterId,
    hitType: battedBalls.hitType,
    hitResult: battedBalls.hitResult,
    fieldLocation: battedBalls.fieldLocation,
    sprayX: battedBalls.sprayX,
    sprayY: battedBalls.sprayY,
    outByPositions: battedBalls.outByPositions,
    rbiCount: battedBalls.rbiCount,
    gameDate: games.gameDate,
  })
  .from(battedBalls)
  .leftJoin(games, eq(battedBalls.gameId, games.id))
  .where(eq(battedBalls.batterId, Number(id)));

  return NextResponse.json(balls);
}
