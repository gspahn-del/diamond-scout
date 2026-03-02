import Dexie, { type Table } from 'dexie';
import type {
  Season, MyTeam, OpponentTeam, OpponentPlayer, Game, PlateAppearance,
  Pitch, BattedBall, ScoutingNote, GameLineup,
} from '@/types';

class DiamondScoutDB extends Dexie {
  seasons!: Table<Season>;
  myTeams!: Table<MyTeam>;
  opponentTeams!: Table<OpponentTeam>;
  opponentPlayers!: Table<OpponentPlayer>;
  games!: Table<Game>;
  gameLineups!: Table<GameLineup>;
  plateAppearances!: Table<PlateAppearance>;
  pitches!: Table<Pitch>;
  battedBalls!: Table<BattedBall>;
  scoutingNotes!: Table<ScoutingNote>;

  constructor() {
    super('DiamondScout');
    this.version(1).stores({
      seasons: '++id',
      myTeams: '++id, seasonId',
      opponentTeams: '++id, seasonId',
      opponentPlayers: '++id, teamId',
      games: '++id, seasonId, opponentTeamId, status',
      gameLineups: '++id, gameId, playerId',
      plateAppearances: '++id, gameId, playerId',
      pitches: '++id, gameId, plateAppearanceId, batterId',
      battedBalls: '++id, gameId, plateAppearanceId, batterId',
      scoutingNotes: '++id, playerId, gameId, seasonId',
    });
  }
}

export const clientDb = new DiamondScoutDB();
