import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { opponentPlayers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const players = await db.select().from(opponentPlayers)
    .where(eq(opponentPlayers.teamId, Number(id)))
    .orderBy(opponentPlayers.jerseyNumber);
  return NextResponse.json(players);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { firstName, lastName, jerseyNumber, bats, throws: throwHand, primaryPosition, notes } = body;
  if (!firstName || !lastName) {
    return NextResponse.json({ error: 'firstName and lastName required' }, { status: 400 });
  }
  const result = await db.insert(opponentPlayers)
    .values({
      teamId: Number(id),
      firstName,
      lastName,
      jerseyNumber,
      bats: bats ?? 'R',
      throws: throwHand ?? 'R',
      primaryPosition,
      notes,
    })
    .returning();
  return NextResponse.json(result[0], { status: 201 });
}
