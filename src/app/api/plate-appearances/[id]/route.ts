import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { plateAppearances, pitches, battedBalls } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const paId = Number(id);

  await db.delete(pitches).where(eq(pitches.plateAppearanceId, paId));
  await db.delete(battedBalls).where(eq(battedBalls.plateAppearanceId, paId));
  await db.delete(plateAppearances).where(eq(plateAppearances.id, paId));

  return NextResponse.json({ ok: true });
}
