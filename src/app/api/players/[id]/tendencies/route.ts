import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { battedBalls, pitches, plateAppearances, opponentPlayers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { calculateTendencies } from '@/lib/stats/tendencies';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pid = Number(id);

  const playerResult = await db.select().from(opponentPlayers).where(eq(opponentPlayers.id, pid));
  const player = playerResult[0];
  if (!player) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const balls = await db.select().from(battedBalls).where(eq(battedBalls.batterId, pid)) as import('@/types').BattedBall[];
  const gamePitches = await db.select().from(pitches).where(eq(pitches.batterId, pid)) as import('@/types').Pitch[];
  const pas = await db.select().from(plateAppearances).where(eq(plateAppearances.playerId, pid));

  const tendencies = calculateTendencies(
    pid,
    (player.bats as 'R' | 'L' | 'S') ?? 'R',
    balls,
    gamePitches,
    pas,
  );

  return NextResponse.json(tendencies);
}
