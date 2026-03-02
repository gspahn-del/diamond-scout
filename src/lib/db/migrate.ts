import { pool } from './index';

export async function runMigrations() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS seasons (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        year INTEGER NOT NULL,
        start_date TEXT,
        end_date TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS'),
        updated_at TEXT DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
      );
      CREATE TABLE IF NOT EXISTS my_teams (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        season_id INTEGER REFERENCES seasons(id),
        created_at TEXT DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS'),
        updated_at TEXT DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
      );
      CREATE TABLE IF NOT EXISTS opponent_teams (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        league TEXT,
        notes TEXT,
        season_id INTEGER REFERENCES seasons(id),
        created_at TEXT DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS'),
        updated_at TEXT DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
      );
      CREATE TABLE IF NOT EXISTS opponent_players (
        id SERIAL PRIMARY KEY,
        team_id INTEGER REFERENCES opponent_teams(id),
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        jersey_number TEXT,
        bats TEXT DEFAULT 'R',
        throws TEXT DEFAULT 'R',
        primary_position TEXT,
        notes TEXT,
        created_at TEXT DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS'),
        updated_at TEXT DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
      );
      CREATE TABLE IF NOT EXISTS games (
        id SERIAL PRIMARY KEY,
        season_id INTEGER REFERENCES seasons(id),
        my_team_id INTEGER REFERENCES my_teams(id),
        opponent_team_id INTEGER REFERENCES opponent_teams(id),
        game_date TEXT NOT NULL,
        location TEXT,
        home_away TEXT DEFAULT 'home',
        my_score INTEGER,
        opponent_score INTEGER,
        status TEXT DEFAULT 'upcoming',
        notes TEXT,
        created_at TEXT DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS'),
        updated_at TEXT DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
      );
      CREATE TABLE IF NOT EXISTS plate_appearances (
        id SERIAL PRIMARY KEY,
        game_id INTEGER REFERENCES games(id),
        player_id INTEGER REFERENCES opponent_players(id),
        inning INTEGER NOT NULL,
        pa_number INTEGER NOT NULL,
        pitch_count INTEGER DEFAULT 0,
        result TEXT,
        result_detail TEXT,
        created_at TEXT DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS'),
        updated_at TEXT DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
      );
      CREATE TABLE IF NOT EXISTS pitches (
        id SERIAL PRIMARY KEY,
        plate_appearance_id INTEGER REFERENCES plate_appearances(id),
        game_id INTEGER REFERENCES games(id),
        pitcher_id INTEGER,
        batter_id INTEGER REFERENCES opponent_players(id),
        sequence_number INTEGER NOT NULL,
        pitch_type TEXT NOT NULL,
        pitch_result TEXT NOT NULL,
        location_x REAL,
        location_y REAL,
        velocity INTEGER,
        created_at TEXT DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
      );
      CREATE TABLE IF NOT EXISTS batted_balls (
        id SERIAL PRIMARY KEY,
        plate_appearance_id INTEGER REFERENCES plate_appearances(id),
        game_id INTEGER REFERENCES games(id),
        batter_id INTEGER REFERENCES opponent_players(id),
        hit_type TEXT NOT NULL,
        hit_result TEXT NOT NULL,
        field_location TEXT NOT NULL,
        spray_x REAL,
        spray_y REAL,
        exit_angle REAL,
        out_by_positions TEXT,
        rbi_count INTEGER DEFAULT 0,
        created_at TEXT DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
      );
      CREATE TABLE IF NOT EXISTS scouting_notes (
        id SERIAL PRIMARY KEY,
        player_id INTEGER REFERENCES opponent_players(id),
        game_id INTEGER REFERENCES games(id),
        season_id INTEGER REFERENCES seasons(id),
        note_type TEXT DEFAULT 'general',
        content TEXT NOT NULL,
        created_at TEXT DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS'),
        updated_at TEXT DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
      );
      CREATE TABLE IF NOT EXISTS game_lineups (
        id SERIAL PRIMARY KEY,
        game_id INTEGER REFERENCES games(id),
        player_id INTEGER REFERENCES opponent_players(id),
        batting_order INTEGER NOT NULL,
        position TEXT,
        created_at TEXT DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
      );
    `);
    console.log('✅ Database migrations complete');
  } finally {
    client.release();
  }
}
