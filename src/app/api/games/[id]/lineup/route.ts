import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { gameLineups, opponentPlayers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lineup = await db.select({
    id: gameLineups.id,
    gameId: gameLineups.gameId,
    playerId: gameLineups.playerId,
    battingOrder: gameLineups.battingOrder,
    position: gameLineups.position,
    createdAt: gameLineups.createdAt,
    player: opponentPlayers,
  })
  .from(gameLineups)
  .leftJoin(opponentPlayers, eq(gameLineups.playerId, opponentPlayers.id))
  .where(eq(gameLineups.gameId, Number(id)))
  .orderBy(gameLineups.battingOrder);
  return NextResponse.json(lineup);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { lineupEntries } = body as { lineupEntries: { playerId: number; battingOrder: number; position?: string }[] };

  // Replace existing lineup
  await db.delete(gameLineups).where(eq(gameLineups.gameId, Number(id)));

  for (const entry of lineupEntries) {
    await db.insert(gameLineups).values({
      gameId: Number(id),
      playerId: entry.playerId,
      battingOrder: entry.battingOrder,
      position: entry.position,
    });
  }

  const lineup = await db.select({
    id: gameLineups.id,
    gameId: gameLineups.gameId,
    playerId: gameLineups.playerId,
    battingOrder: gameLineups.battingOrder,
    position: gameLineups.position,
    createdAt: gameLineups.createdAt,
    player: opponentPlayers,
  })
  .from(gameLineups)
  .leftJoin(opponentPlayers, eq(gameLineups.playerId, opponentPlayers.id))
  .where(eq(gameLineups.gameId, Number(id)))
  .orderBy(gameLineups.battingOrder);

  return NextResponse.json(lineup, { status: 201 });
}
