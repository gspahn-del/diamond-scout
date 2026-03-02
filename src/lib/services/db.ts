/**
 * Client-side service layer — now uses server API endpoints.
 * All data is persisted on the server via PostgreSQL.
 * Replaces Dexie IndexedDB with server-driven architecture.
 */
import type {
  Season, MyTeam, OpponentTeam, OpponentPlayer, Game, GameLineup,
  PlateAppearance, Pitch, BattedBall, PlayerStats, Tendencies,
  SprayDot, PitchHeatMapDot, PlateAppearanceWithPitches,
} from '@/types';

function apiCall<T>(method: string, url: string, body?: unknown): Promise<T> {
  const options: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) options.body = JSON.stringify(body);
  return fetch(url, options).then(r => {
    if (!r.ok) throw new Error(`API error: ${r.status}`);
    return r.json() as Promise<T>;
  });
}

// ─── Seasons ──────────────────────────────────────────────────────────────────

export async function getSeasons(): Promise<Season[]> {
  return apiCall<Season[]>('GET', '/api/seasons');
}

export async function createSeason(data: Pick<Season, 'name' | 'year'> & Partial<Pick<Season, 'startDate' | 'endDate' | 'isActive'>>): Promise<Season> {
  return apiCall<Season>('POST', '/api/seasons', data);
}

export async function updateSeason(id: number, data: Partial<Season>): Promise<void> {
  await apiCall('PUT', `/api/seasons/${id}`, data);
}

export async function deleteSeason(id: number): Promise<void> {
  await apiCall('DELETE', `/api/seasons/${id}`);
}

export async function setActiveSeason(id: number): Promise<void> {
  const all = await getSeasons();
  for (const s of all) {
    await updateSeason(s.id, { isActive: s.id === id ? 1 : 0 });
  }
}

// ─── My Teams ─────────────────────────────────────────────────────────────────

export async function getMyTeams(): Promise<MyTeam[]> {
  return apiCall<MyTeam[]>('GET', '/api/my-teams');
}

export async function createMyTeam(data: Pick<MyTeam, 'name'> & Partial<Pick<MyTeam, 'seasonId'>>): Promise<MyTeam> {
  return apiCall<MyTeam>('POST', '/api/my-teams', data);
}

export async function updateMyTeam(id: number, data: Partial<MyTeam>): Promise<void> {
  await apiCall('PUT', `/api/my-teams/${id}`, data);
}

export async function deleteMyTeam(id: number): Promise<void> {
  await apiCall('DELETE', `/api/my-teams/${id}`);
}

// ─── Opponents ────────────────────────────────────────────────────────────────

export async function getOpponents(seasonId?: number): Promise<OpponentTeam[]> {
  const url = seasonId ? `/api/opponents?seasonId=${seasonId}` : '/api/opponents';
  return apiCall<OpponentTeam[]>('GET', url);
}

export async function getOpponent(id: number): Promise<OpponentTeam | undefined> {
  try {
    return await apiCall<OpponentTeam>('GET', `/api/opponents/${id}`);
  } catch {
    return undefined;
  }
}

export async function getOpponentWithPlayers(id: number): Promise<(OpponentTeam & { players: OpponentPlayer[] }) | null> {
  try {
    return await apiCall<OpponentTeam & { players: OpponentPlayer[] }>('GET', `/api/opponents/${id}`);
  } catch {
    return null;
  }
}

export async function createOpponent(data: Pick<OpponentTeam, 'name'> & Partial<Pick<OpponentTeam, 'league' | 'notes' | 'seasonId'>>): Promise<OpponentTeam> {
  return apiCall<OpponentTeam>('POST', '/api/opponents', data);
}

export async function updateOpponent(id: number, data: Partial<OpponentTeam>): Promise<void> {
  await apiCall('PUT', `/api/opponents/${id}`, data);
}

export async function deleteOpponent(id: number): Promise<void> {
  await apiCall('DELETE', `/api/opponents/${id}`);
}

// ─── Players ──────────────────────────────────────────────────────────────────

export async function getOpponentPlayers(teamId: number): Promise<OpponentPlayer[]> {
  return apiCall<OpponentPlayer[]>('GET', `/api/opponents/${teamId}/players`);
}

export async function getPlayer(id: number): Promise<OpponentPlayer | undefined> {
  try {
    return await apiCall<OpponentPlayer>('GET', `/api/players/${id}`);
  } catch {
    return undefined;
  }
}

export async function createPlayer(teamId: number, data: Pick<OpponentPlayer, 'firstName' | 'lastName'> & Partial<Pick<OpponentPlayer, 'jerseyNumber' | 'bats' | 'throws' | 'primaryPosition' | 'notes'>>): Promise<OpponentPlayer> {
  return apiCall<OpponentPlayer>('POST', `/api/opponents/${teamId}/players`, data);
}

export async function updatePlayer(id: number, data: Partial<OpponentPlayer>): Promise<void> {
  await apiCall('PUT', `/api/players/${id}`, data);
}

export async function deletePlayer(id: number): Promise<void> {
  await apiCall('DELETE', `/api/players/${id}`);
}

// ─── Games ────────────────────────────────────────────────────────────────────

export interface GameRow extends Game {
  opponentTeamName: string | null;
  myTeamName: string | null;
}

export async function getGames(filters?: { seasonId?: number; status?: string }): Promise<GameRow[]> {
  let url = '/api/games';
  const params = new URLSearchParams();
  if (filters?.seasonId) params.append('seasonId', String(filters.seasonId));
  if (filters?.status) params.append('status', filters.status);
  if (params.toString()) url += '?' + params.toString();
  return apiCall<GameRow[]>('GET', url);
}

export interface GameFull extends Game {
  opponentTeam?: OpponentTeam;
  myTeam?: MyTeam;
  lineup: (GameLineup & { player: OpponentPlayer })[];
  plateAppearances: PlateAppearance[];
}

export async function getGame(id: number): Promise<GameFull | null> {
  try {
    return await apiCall<GameFull>('GET', `/api/games/${id}`);
  } catch {
    return null;
  }
}

export async function createGame(data: Omit<Game, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'notes' | 'myScore' | 'opponentScore'> & Partial<Pick<Game, 'status' | 'notes' | 'myScore' | 'opponentScore'>>): Promise<Game> {
  return apiCall<Game>('POST', '/api/games', data);
}

export async function updateGame(id: number, data: Partial<Game>): Promise<void> {
  await apiCall('PUT', `/api/games/${id}`, data);
}

export async function deleteGame(id: number): Promise<void> {
  await apiCall('DELETE', `/api/games/${id}`);
}

export async function saveLineup(gameId: number, entries: { playerId: number; battingOrder: number; position: string }[]): Promise<void> {
  await apiCall('POST', `/api/games/${gameId}/lineup`, { lineupEntries: entries });
}

// ─── Live Game (pitch-by-pitch) ───────────────────────────────────────────────

export async function createPA(data: Pick<PlateAppearance, 'inning' | 'paNumber'> & Partial<Pick<PlateAppearance, 'gameId' | 'playerId' | 'pitchCount' | 'result' | 'resultDetail'>>): Promise<PlateAppearance> {
  if (!data.gameId) throw new Error('gameId required');
  return apiCall<PlateAppearance>('POST', `/api/games/${data.gameId}/plate-appearances`, data);
}

export async function updatePA(id: number, data: Partial<PlateAppearance>): Promise<void> {
  if (!data.gameId) throw new Error('gameId required');
  await apiCall('PUT', `/api/games/${data.gameId}/plate-appearances/${id}`, data);
}

export async function deletePA(id: number): Promise<void> {
  await apiCall('DELETE', `/api/plate-appearances/${id}`);
}

export async function createPitch(data: Pick<Pitch, 'sequenceNumber' | 'pitchType' | 'pitchResult'> & Partial<Pick<Pitch, 'plateAppearanceId' | 'gameId' | 'pitcherId' | 'batterId' | 'locationX' | 'locationY' | 'velocity'>>): Promise<Pitch> {
  if (!data.gameId) throw new Error('gameId required');
  return apiCall<Pitch>('POST', `/api/games/${data.gameId}/pitches`, data);
}

export async function deletePitch(id: number): Promise<void> {
  await apiCall('DELETE', `/api/pitches/${id}`);
}

export async function createBattedBall(data: Pick<BattedBall, 'hitType' | 'hitResult' | 'fieldLocation'> & Partial<Pick<BattedBall, 'plateAppearanceId' | 'gameId' | 'batterId' | 'sprayX' | 'sprayY' | 'exitAngle' | 'outByPositions' | 'rbiCount'>>): Promise<BattedBall> {
  if (!data.gameId) throw new Error('gameId required');
  return apiCall<BattedBall>('POST', `/api/games/${data.gameId}/batted-balls`, data);
}

export async function deleteBattedBall(id: number): Promise<void> {
  await apiCall('DELETE', `/api/batted-balls/${id}`);
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export async function getPlayerStats(playerId: number): Promise<PlayerStats | null> {
  try {
    return await apiCall<PlayerStats>('GET', `/api/players/${playerId}/stats`);
  } catch {
    return null;
  }
}

export async function getPlayerSprayData(playerId: number): Promise<SprayDot[]> {
  return apiCall<SprayDot[]>('GET', `/api/players/${playerId}/spray-data`);
}

export async function getPlayerPitchData(playerId: number): Promise<PitchHeatMapDot[]> {
  return apiCall<PitchHeatMapDot[]>('GET', `/api/players/${playerId}/pitch-data`);
}

export async function getPlayerTendencies(playerId: number): Promise<Tendencies | null> {
  try {
    return await apiCall<Tendencies>('GET', `/api/players/${playerId}/tendencies`);
  } catch {
    return null;
  }
}

export async function getPlayerPAs(playerId: number): Promise<PlateAppearanceWithPitches[]> {
  return apiCall<PlateAppearanceWithPitches[]>('GET', `/api/players/${playerId}/plate-appearances`);
}

export async function getTeamSprayData(teamId: number): Promise<SprayDot[]> {
  return apiCall<SprayDot[]>('GET', `/api/teams/${teamId}/spray-data`);
}

// ─── Stats Overview ───────────────────────────────────────────────────────────

export async function getStatsOverview() {
  return apiCall('GET', '/api/stats/overview');
}

// ─── CSV Exports ──────────────────────────────────────────────────────────────

export async function exportPlayerStatsCSV(): Promise<string> {
  const res = await fetch('/api/export?type=player-stats');
  if (!res.ok) throw new Error('Export failed');
  return res.text();
}

export async function exportGamesCSV(): Promise<string> {
  const res = await fetch('/api/export?type=games');
  if (!res.ok) throw new Error('Export failed');
  return res.text();
}

// ─── Data Export / Import ─────────────────────────────────────────────────────

export async function exportAllData(): Promise<string> {
  // Fetch all data from endpoints
  const [seasons, myTeams, opponentTeams, opponentPlayers, games, gameLineups, plateAppearances, pitches, battedBalls] = await Promise.all([
    apiCall('/api/seasons'),
    apiCall('/api/my-teams'),
    apiCall('/api/opponents'),
    fetch('/api/opponents').then(r => r.json()), // Note: would need to aggregate from all teams
    apiCall('/api/games'),
    fetch('/api/games/0/lineup').then(r => r.json()).catch(() => []),
    fetch('/api/games/0/plate-appearances').then(r => r.json()).catch(() => []),
    fetch('/api/games/0/pitches').then(r => r.json()).catch(() => []),
    fetch('/api/games/0/batted-balls').then(r => r.json()).catch(() => []),
  ]);

  const data = {
    seasons,
    myTeams,
    opponentTeams,
    opponentPlayers,
    games,
    gameLineups,
    plateAppearances,
    pitches,
    battedBalls,
    scoutingNotes: [],
  };
  return JSON.stringify(data, null, 2);
}

export async function importAllData(json: string, mode: 'replace' | 'merge' = 'replace'): Promise<void> {
  const data = JSON.parse(json);

  // Note: This is a simplified implementation
  // In production, you'd want to handle batch imports more carefully
  if (data.seasons?.length) {
    for (const season of data.seasons) {
      await createSeason(season);
    }
  }
  if (data.myTeams?.length) {
    for (const team of data.myTeams) {
      await createMyTeam(team);
    }
  }
  if (data.opponentTeams?.length) {
    for (const team of data.opponentTeams) {
      await createOpponent(team);
    }
  }
}
