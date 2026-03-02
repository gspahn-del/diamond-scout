import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { plateAppearances, opponentPlayers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { calculatePlayerStats } from '@/lib/stats/calculations';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pid = Number(id);

  const playerResult = await db.select().from(opponentPlayers).where(eq(opponentPlayers.id, pid));
  const player = playerResult[0];
  if (!player) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const pas = await db.select().from(plateAppearances)
    .where(eq(plateAppearances.playerId, pid));

  const stats = calculatePlayerStats(
    pid,
    `${player.firstName} ${player.lastName}`,
    player.jerseyNumber,
    player.primaryPosition,
    pas,
  );

  return NextResponse.json(stats);
}
