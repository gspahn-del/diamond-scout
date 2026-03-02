import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pitches, plateAppearances } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; pitchId: string }> }) {
  const { pitchId } = await params;
  const pitchResult = await db.select().from(pitches).where(eq(pitches.id, Number(pitchId)));
  const pitch = pitchResult[0];
  if (!pitch) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const paId = pitch.plateAppearanceId;
  await db.delete(pitches).where(eq(pitches.id, Number(pitchId)));

  // Update pitch count
  if (paId) {
    const allPitches = await db.select().from(pitches)
      .where(eq(pitches.plateAppearanceId, paId));
    const count = allPitches.length;
    await db.update(plateAppearances)
      .set({ pitchCount: count, updatedAt: new Date().toISOString() })
      .where(eq(plateAppearances.id, paId));
  }

  return NextResponse.json({ ok: true });
}
