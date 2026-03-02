import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { games, plateAppearances, pitches, battedBalls, gameLineups, opponentPlayers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gid = Number(id);

  const gameResult = await db.select().from(games).where(eq(games.id, gid));
  const game = gameResult[0];
  if (!game) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const pas = await db.select().from(plateAppearances)
    .where(eq(plateAppearances.gameId, gid))
    .orderBy(plateAppearances.inning, plateAppearances.paNumber);

  const gamePitches = await db.select().from(pitches)
    .where(eq(pitches.gameId, gid))
    .orderBy(pitches.plateAppearanceId, pitches.sequenceNumber);

  const balls = await db.select().from(battedBalls)
    .where(eq(battedBalls.gameId, gid));

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
  .where(eq(gameLineups.gameId, gid))
  .orderBy(gameLineups.battingOrder);

  return NextResponse.json({ ...game, plateAppearances: pas, pitches: gamePitches, battedBalls: balls, lineup });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const result = await db.update(games)
    .set({ ...body, updatedAt: new Date().toISOString() })
    .where(eq(games.id, Number(id)))
    .returning();
  return NextResponse.json(result[0]);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gid = Number(id);
  // Cascade: delete pitches → batted balls → plate appearances → game
  const pas = await db.select().from(plateAppearances).where(eq(plateAppearances.gameId, gid));
  for (const pa of pas) {
    await db.delete(pitches).where(eq(pitches.plateAppearanceId, pa.id));
    await db.delete(battedBalls).where(eq(battedBalls.plateAppearanceId, pa.id));
  }
  await db.delete(plateAppearances).where(eq(plateAppearances.gameId, gid));
  await db.delete(gameLineups).where(eq(gameLineups.gameId, gid));
  await db.delete(games).where(eq(games.id, gid));
  return NextResponse.json({ ok: true });
}
