import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { games, battedBalls, pitches, opponentTeams, seasons, plateAppearances } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const seasonId = searchParams.get('seasonId');

  const activeSeasonResult = seasonId
    ? await db.select().from(seasons).where(eq(seasons.id, Number(seasonId)))
    : await db.select().from(seasons).where(eq(seasons.isActive, 1));
  const activeSeason = activeSeasonResult[0];

  const allGames = await db.select().from(games)
    .where(activeSeason ? eq(games.seasonId, activeSeason.id) : eq(games.seasonId, -1));

  const completedGames = allGames.filter((g) => g.status === 'completed');
  const upcomingGames = allGames.filter((g) => g.status === 'upcoming');

  // Pitch type breakdown
  const allPitches = await db.select().from(pitches);
  const pitchTypeCounts: Record<string, number> = {};
  for (const p of allPitches) {
    pitchTypeCounts[p.pitchType] = (pitchTypeCounts[p.pitchType] ?? 0) + 1;
  }

  // Hit type breakdown
  const allBalls = await db.select().from(battedBalls);
  const hitTypeCounts: Record<string, number> = {};
  for (const b of allBalls) {
    hitTypeCounts[b.hitType] = (hitTypeCounts[b.hitType] ?? 0) + 1;
  }

  // Hits by pitch type (approx: count "in_play" pitches that resulted in hits)
  const allPAs = await db.select().from(plateAppearances);

  const recentGames = await db.select({
    id: games.id,
    gameDate: games.gameDate,
    myScore: games.myScore,
    opponentScore: games.opponentScore,
    status: games.status,
    homeAway: games.homeAway,
    opponentTeamName: opponentTeams.name,
  })
  .from(games)
  .leftJoin(opponentTeams, eq(games.opponentTeamId, opponentTeams.id));

  return NextResponse.json({
    season: activeSeason,
    gamesPlayed: completedGames.length,
    gamesUpcoming: upcomingGames.length,
    totalPitches: allPitches.length,
    totalBattedBalls: allBalls.length,
    totalPAs: allPAs.length,
    pitchTypeCounts,
    hitTypeCounts,
    recentGames: recentGames.slice(0, 10),
  });
}
