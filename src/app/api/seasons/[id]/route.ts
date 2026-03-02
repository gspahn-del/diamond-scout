import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { seasons } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await db.select().from(seasons).where(eq(seasons.id, Number(id)));
  const season = result[0];
  if (!season) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(season);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { name, year, startDate, endDate, isActive } = body;

  if (isActive === 1) {
    await db.update(seasons).set({ isActive: 0 });
  }

  const result = await db.update(seasons)
    .set({ name, year, startDate, endDate, isActive, updatedAt: new Date().toISOString() })
    .where(eq(seasons.id, Number(id)))
    .returning();

  return NextResponse.json(result[0]);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.delete(seasons).where(eq(seasons.id, Number(id)));
  return NextResponse.json({ ok: true });
}
