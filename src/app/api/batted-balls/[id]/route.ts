import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { battedBalls } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.delete(battedBalls).where(eq(battedBalls.id, Number(id)));
  return NextResponse.json({ ok: true });
}
