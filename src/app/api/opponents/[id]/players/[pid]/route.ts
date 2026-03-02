import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { opponentPlayers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string; pid: string }> }) {
  const { pid } = await params;
  const result = await db.select().from(opponentPlayers).where(eq(opponentPlayers.id, Number(pid)));
  const player = result[0];
  if (!player) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(player);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; pid: string }> }) {
  const { pid } = await params;
  const body = await req.json();
  const { firstName, lastName, jerseyNumber, bats, throws: throwHand, primaryPosition, notes } = body;
  const result = await db.update(opponentPlayers)
    .set({
      firstName,
      lastName,
      jerseyNumber,
      bats,
      throws: throwHand,
      primaryPosition,
      notes,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(opponentPlayers.id, Number(pid)))
    .returning();
  return NextResponse.json(result[0]);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; pid: string }> }) {
  const { pid } = await params;
  await db.delete(opponentPlayers).where(eq(opponentPlayers.id, Number(pid)));
  return NextResponse.json({ ok: true });
}
