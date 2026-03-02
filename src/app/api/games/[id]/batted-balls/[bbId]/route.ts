import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { battedBalls } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; bbId: string }> }) {
  const { bbId } = await params;
  await db.delete(battedBalls).where(eq(battedBalls.id, Number(bbId)));
  return NextResponse.json({ ok: true });
}
