import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { myTeams } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const seasonId = searchParams.get('seasonId');
  const query = seasonId
    ? await db.select().from(myTeams).where(eq(myTeams.seasonId, Number(seasonId)))
    : await db.select().from(myTeams);
  return NextResponse.json(query);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, seasonId } = body;
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });
  const result = await db.insert(myTeams).values({ name, seasonId }).returning();
  return NextResponse.json(result[0], { status: 201 });
}
