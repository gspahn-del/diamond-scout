import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { opponentTeams, seasons } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const seasonId = searchParams.get('seasonId');

  if (seasonId) {
    const teams = await db.select().from(opponentTeams)
      .where(eq(opponentTeams.seasonId, Number(seasonId)));
    return NextResponse.json(teams);
  }

  // If no seasonId provided, get active season teams
  const activeSeasonResult = await db.select().from(seasons).where(eq(seasons.isActive, 1));
  const activeSeason = activeSeasonResult[0];
  if (activeSeason) {
    const teams = await db.select().from(opponentTeams)
      .where(eq(opponentTeams.seasonId, activeSeason.id));
    return NextResponse.json(teams);
  }

  const teams = await db.select().from(opponentTeams);
  return NextResponse.json(teams);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, league, notes, seasonId } = body;
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });
  const result = await db.insert(opponentTeams).values({ name, league, notes, seasonId }).returning();
  return NextResponse.json(result[0], { status: 201 });
}
