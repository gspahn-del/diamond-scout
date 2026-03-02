import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { myTeams } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await db.select().from(myTeams).where(eq(myTeams.id, Number(id)));
  const team = result[0];
  if (!team) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(team);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const result = await db.update(myTeams).set({ ...body, updatedAt: new Date().toISOString() })
    .where(eq(myTeams.id, Number(id))).returning();
  return NextResponse.json(result[0]);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.delete(myTeams).where(eq(myTeams.id, Number(id)));
  return NextResponse.json({ ok: true });
}
