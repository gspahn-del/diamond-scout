import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { opponentPlayers, plateAppearances, games, opponentTeams } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { calculatePlayerStats } from '@/lib/stats/calculations';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const teamId = Number(id);

  const teamResult = await db.select().from(opponentTeams).where(eq(opponentTeams.id, teamId));
  const team = teamResult[0];
  if (!team) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const players = await db.select().from(opponentPlayers)
    .where(eq(opponentPlayers.teamId, teamId));

  const playerStats = await Promise.all(players.map(async (p) => {
    const pas = await db.select().from(plateAppearances)
      .where(eq(plateAppearances.playerId, p.id));
    return calculatePlayerStats(p.id, `${p.firstName} ${p.lastName}`, p.jerseyNumber, p.primaryPosition, pas);
  }));

  // Aggregate
  const totals = playerStats.reduce(
    (acc, s) => ({
      pa: acc.pa + s.pa,
      ab: acc.ab + s.ab,
      h: acc.h + s.h,
      doubles: acc.doubles + s.doubles,
      triples: acc.triples + s.triples,
      homeRuns: acc.homeRuns + s.homeRuns,
      bb: acc.bb + s.bb,
      k: acc.k + s.k,
      rbi: acc.rbi + s.rbi,
    }),
    { pa: 0, ab: 0, h: 0, doubles: 0, triples: 0, homeRuns: 0, bb: 0, k: 0, rbi: 0 }
  );

  const avg = totals.ab > 0 ? totals.h / totals.ab : 0;
  const obpDenom = totals.ab + totals.bb;
  const obp = obpDenom > 0 ? (totals.h + totals.bb) / obpDenom : 0;
  const totalBases = (totals.h - totals.doubles - totals.triples - totals.homeRuns) +
    totals.doubles * 2 + totals.triples * 3 + totals.homeRuns * 4;
  const slg = totals.ab > 0 ? totalBases / totals.ab : 0;

  // Count games vs this team
  const teamGames = await db.select().from(games)
    .where(eq(games.opponentTeamId, teamId));

  return NextResponse.json({
    teamId,
    teamName: team.name,
    gamesPlayed: teamGames.filter((g) => g.status === 'completed').length,
    playerStats,
    ...totals,
    avg,
    obp,
    slg,
    ops: obp + slg,
  });
}
