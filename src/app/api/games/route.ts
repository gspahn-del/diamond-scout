import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { games, opponentTeams, myTeams, seasons } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const seasonId = searchParams.get('seasonId');
  const opponentId = searchParams.get('opponentId');
  const status = searchParams.get('status');

  // Raw SQL join for game list with team names
  const rows = await db.select({
    id: games.id,
    seasonId: games.seasonId,
    myTeamId: games.myTeamId,
    opponentTeamId: games.opponentTeamId,
    gameDate: games.gameDate,
    location: games.location,
    homeAway: games.homeAway,
    myScore: games.myScore,
    opponentScore: games.opponentScore,
    status: games.status,
    notes: games.notes,
    createdAt: games.createdAt,
    updatedAt: games.updatedAt,
    opponentTeamName: opponentTeams.name,
    myTeamName: myTeams.name,
  })
  .from(games)
  .leftJoin(opponentTeams, eq(games.opponentTeamId, opponentTeams.id))
  .leftJoin(myTeams, eq(games.myTeamId, myTeams.id))
  .orderBy(desc(games.gameDate));

  let result = rows;
  if (seasonId) result = result.filter((g) => g.seasonId === Number(seasonId));
  if (opponentId) result = result.filter((g) => g.opponentTeamId === Number(opponentId));
  if (status) result = result.filter((g) => g.status === status);

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { seasonId, myTeamId, opponentTeamId, gameDate, location, homeAway, notes } = body;
  if (!gameDate || !opponentTeamId) {
    return NextResponse.json({ error: 'gameDate and opponentTeamId required' }, { status: 400 });
  }
  const result = await db.insert(games)
    .values({
      seasonId,
      myTeamId,
      opponentTeamId,
      gameDate,
      location,
      homeAway: homeAway ?? 'home',
      status: 'in_progress',
      notes,
    })
    .returning();
  return NextResponse.json(result[0], { status: 201 });
}
