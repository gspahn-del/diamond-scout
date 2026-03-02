import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { opponentPlayers, plateAppearances, battedBalls, pitches, games, opponentTeams } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { calculatePlayerStats } from '@/lib/stats/calculations';

function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(','),
    ...rows.map((row) =>
      headers.map((h) => {
        const val = row[h];
        if (val == null) return '';
        const str = String(val);
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      }).join(',')
    ),
  ];
  return lines.join('\n');
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const playerId = searchParams.get('playerId');
  const teamId = searchParams.get('teamId');
  const gameId = searchParams.get('gameId');

  let csv = '';
  let filename = 'export.csv';

  if (type === 'player-stats' && playerId) {
    const playerResult = await db.select().from(opponentPlayers).where(eq(opponentPlayers.id, Number(playerId)));
    const player = playerResult[0];
    if (!player) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const pas = await db.select().from(plateAppearances).where(eq(plateAppearances.playerId, Number(playerId)));
    const stats = calculatePlayerStats(player.id, `${player.firstName} ${player.lastName}`, player.jerseyNumber, player.primaryPosition, pas);
    csv = toCSV([stats as unknown as Record<string, unknown>]);
    filename = `${player.lastName}_${player.firstName}_stats.csv`;
  } else if (type === 'team-stats' && teamId) {
    const teamResult = await db.select().from(opponentTeams).where(eq(opponentTeams.id, Number(teamId)));
    const team = teamResult[0];
    const players = await db.select().from(opponentPlayers).where(eq(opponentPlayers.teamId, Number(teamId)));
    const rows = await Promise.all(players.map(async (p) => {
      const pas = await db.select().from(plateAppearances).where(eq(plateAppearances.playerId, p.id));
      const stats = calculatePlayerStats(p.id, `${p.firstName} ${p.lastName}`, p.jerseyNumber, p.primaryPosition, pas);
      return stats as unknown as Record<string, unknown>;
    }));
    csv = toCSV(rows);
    filename = `${team?.name ?? 'team'}_stats.csv`;
  } else if (type === 'pitch-data' && gameId) {
    const rows = await db.select().from(pitches).where(eq(pitches.gameId, Number(gameId)));
    csv = toCSV(rows as unknown as Record<string, unknown>[]);
    filename = `game_${gameId}_pitches.csv`;
  } else if (type === 'batted-balls' && playerId) {
    const rows = await db.select().from(battedBalls).where(eq(battedBalls.batterId, Number(playerId)));
    csv = toCSV(rows as unknown as Record<string, unknown>[]);
    filename = `player_${playerId}_batted_balls.csv`;
  } else {
    return NextResponse.json({ error: 'Invalid export type' }, { status: 400 });
  }

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
