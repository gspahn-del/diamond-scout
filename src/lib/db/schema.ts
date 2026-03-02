import { sql } from 'drizzle-orm';
import {
  integer,
  pgTable,
  real,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const seasons = pgTable('seasons', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  year: integer('year').notNull(),
  startDate: text('start_date'),
  endDate: text('end_date'),
  isActive: integer('is_active').default(1),
  createdAt: text('created_at').default(sql`to_char(now(), 'YYYY-MM-DD HH24:MI:SS')`),
  updatedAt: text('updated_at').default(sql`to_char(now(), 'YYYY-MM-DD HH24:MI:SS')`),
});

export const myTeams = pgTable('my_teams', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  seasonId: integer('season_id').references(() => seasons.id),
  createdAt: text('created_at').default(sql`to_char(now(), 'YYYY-MM-DD HH24:MI:SS')`),
  updatedAt: text('updated_at').default(sql`to_char(now(), 'YYYY-MM-DD HH24:MI:SS')`),
});

export const opponentTeams = pgTable('opponent_teams', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  league: text('league'),
  notes: text('notes'),
  seasonId: integer('season_id').references(() => seasons.id),
  createdAt: text('created_at').default(sql`to_char(now(), 'YYYY-MM-DD HH24:MI:SS')`),
  updatedAt: text('updated_at').default(sql`to_char(now(), 'YYYY-MM-DD HH24:MI:SS')`),
});

export const opponentPlayers = pgTable('opponent_players', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id').references(() => opponentTeams.id),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  jerseyNumber: text('jersey_number'),
  bats: text('bats').default('R'),
  throws: text('throws').default('R'),
  primaryPosition: text('primary_position'),
  notes: text('notes'),
  createdAt: text('created_at').default(sql`to_char(now(), 'YYYY-MM-DD HH24:MI:SS')`),
  updatedAt: text('updated_at').default(sql`to_char(now(), 'YYYY-MM-DD HH24:MI:SS')`),
});

export const games = pgTable('games', {
  id: serial('id').primaryKey(),
  seasonId: integer('season_id').references(() => seasons.id),
  myTeamId: integer('my_team_id').references(() => myTeams.id),
  opponentTeamId: integer('opponent_team_id').references(() => opponentTeams.id),
  gameDate: text('game_date').notNull(),
  location: text('location'),
  homeAway: text('home_away').default('home'),
  myScore: integer('my_score'),
  opponentScore: integer('opponent_score'),
  status: text('status').default('upcoming'),
  notes: text('notes'),
  createdAt: text('created_at').default(sql`to_char(now(), 'YYYY-MM-DD HH24:MI:SS')`),
  updatedAt: text('updated_at').default(sql`to_char(now(), 'YYYY-MM-DD HH24:MI:SS')`),
});

export const plateAppearances = pgTable('plate_appearances', {
  id: serial('id').primaryKey(),
  gameId: integer('game_id').references(() => games.id),
  playerId: integer('player_id').references(() => opponentPlayers.id),
  inning: integer('inning').notNull(),
  paNumber: integer('pa_number').notNull(),
  pitchCount: integer('pitch_count').default(0),
  result: text('result'),
  resultDetail: text('result_detail'),
  createdAt: text('created_at').default(sql`to_char(now(), 'YYYY-MM-DD HH24:MI:SS')`),
  updatedAt: text('updated_at').default(sql`to_char(now(), 'YYYY-MM-DD HH24:MI:SS')`),
});

export const pitches = pgTable('pitches', {
  id: serial('id').primaryKey(),
  plateAppearanceId: integer('plate_appearance_id').references(() => plateAppearances.id),
  gameId: integer('game_id').references(() => games.id),
  pitcherId: integer('pitcher_id'),
  batterId: integer('batter_id').references(() => opponentPlayers.id),
  sequenceNumber: integer('sequence_number').notNull(),
  pitchType: text('pitch_type').notNull(),
  pitchResult: text('pitch_result').notNull(),
  locationX: real('location_x'),
  locationY: real('location_y'),
  velocity: integer('velocity'),
  createdAt: text('created_at').default(sql`to_char(now(), 'YYYY-MM-DD HH24:MI:SS')`),
});

export const battedBalls = pgTable('batted_balls', {
  id: serial('id').primaryKey(),
  plateAppearanceId: integer('plate_appearance_id').references(() => plateAppearances.id),
  gameId: integer('game_id').references(() => games.id),
  batterId: integer('batter_id').references(() => opponentPlayers.id),
  hitType: text('hit_type').notNull(),
  hitResult: text('hit_result').notNull(),
  fieldLocation: text('field_location').notNull(),
  sprayX: real('spray_x'),
  sprayY: real('spray_y'),
  exitAngle: real('exit_angle'),
  outByPositions: text('out_by_positions'),
  rbiCount: integer('rbi_count').default(0),
  createdAt: text('created_at').default(sql`to_char(now(), 'YYYY-MM-DD HH24:MI:SS')`),
});

export const scoutingNotes = pgTable('scouting_notes', {
  id: serial('id').primaryKey(),
  playerId: integer('player_id').references(() => opponentPlayers.id),
  gameId: integer('game_id').references(() => games.id),
  seasonId: integer('season_id').references(() => seasons.id),
  noteType: text('note_type').default('general'),
  content: text('content').notNull(),
  createdAt: text('created_at').default(sql`to_char(now(), 'YYYY-MM-DD HH24:MI:SS')`),
  updatedAt: text('updated_at').default(sql`to_char(now(), 'YYYY-MM-DD HH24:MI:SS')`),
});

export const gameLineups = pgTable('game_lineups', {
  id: serial('id').primaryKey(),
  gameId: integer('game_id').references(() => games.id),
  playerId: integer('player_id').references(() => opponentPlayers.id),
  battingOrder: integer('batting_order').notNull(),
  position: text('position'),
  createdAt: text('created_at').default(sql`to_char(now(), 'YYYY-MM-DD HH24:MI:SS')`),
});
