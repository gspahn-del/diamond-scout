import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { opponentTeams, opponentPlayers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const teamResult = await db.select().from(opponentTeams).where(eq(opponentTeams.id, Number(id)));
  const team = teamResult[0];
  if (!team) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const players = await db.select().from(opponentPlayers)
    .where(eq(opponentPlayers.teamId, Number(id)))
    .orderBy(opponentPlayers.jerseyNumber);

  return NextResponse.json({ ...team, players });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { name, league, notes } = body;
  const result = await db.update(opponentTeams)
    .set({ name, league, notes, updatedAt: new Date().toISOString() })
    .where(eq(opponentTeams.id, Number(id)))
    .returning();
  return NextResponse.json(result[0]);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.delete(opponentTeams).where(eq(opponentTeams.id, Number(id)));
  return NextResponse.json({ ok: true });
}
