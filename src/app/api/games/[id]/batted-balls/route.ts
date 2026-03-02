import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { battedBalls } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await db.select().from(battedBalls)
    .where(eq(battedBalls.gameId, Number(id)));
  return NextResponse.json(result);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { plateAppearanceId, batterId, hitType, hitResult, fieldLocation, sprayX, sprayY, outByPositions, rbiCount } = body;

  if (!hitType || !hitResult || !fieldLocation) {
    return NextResponse.json({ error: 'hitType, hitResult, fieldLocation required' }, { status: 400 });
  }

  const result = await db.insert(battedBalls)
    .values({
      plateAppearanceId,
      gameId: Number(id),
      batterId,
      hitType,
      hitResult,
      fieldLocation,
      sprayX,
      sprayY,
      outByPositions: outByPositions ? JSON.stringify(outByPositions) : null,
      rbiCount: rbiCount ?? 0,
    })
    .returning();

  return NextResponse.json(result[0], { status: 201 });
}
