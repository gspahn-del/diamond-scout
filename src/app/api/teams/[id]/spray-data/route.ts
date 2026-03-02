import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { battedBalls, games, opponentPlayers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Get all players for this team
  const players = await db.select().from(opponentPlayers)
    .where(eq(opponentPlayers.teamId, Number(id)));

  if (players.length === 0) return NextResponse.json([]);

  const playerIds = players.map((p) => p.id);

  // Get all batted balls for all players on this team
  const allBalls = await db.select({
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
  .leftJoin(games, eq(battedBalls.gameId, games.id));

  return NextResponse.json(allBalls.filter((b) => playerIds.includes(b.batterId ?? -1)));
}
