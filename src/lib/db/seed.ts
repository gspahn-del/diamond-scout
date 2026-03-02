/**
 * Seed script — run with: npx tsx src/lib/db/seed.ts
 */
import { pool } from './index';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function r(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function choice<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function rFloat(min: number, max: number) { return Math.random() * (max - min) + min; }

const PITCH_TYPES = ['fastball', 'curveball', 'slider', 'changeup', 'cutter', 'sinker', 'splitter'];
const HIT_TYPES = ['ground_ball', 'fly_ball', 'line_drive', 'bunt', 'popup'];
const POSITIONS_LIST = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'];

// ─── Realistic pitch sequence generator ───────────────────────────────────────

type PitchResult = 'ball' | 'called_strike' | 'swinging_strike' | 'foul' | 'in_play' | 'hit_by_pitch';
type PAResult = 'single' | 'double' | 'triple' | 'homerun' | 'walk' | 'strikeout_swinging' | 'strikeout_looking' | 'hbp' | 'ground_out' | 'fly_out' | 'line_out' | 'pop_out' | 'double_play' | 'sac_fly';
type HitResult = 'single' | 'double' | 'triple' | 'homerun' | 'out' | 'error' | 'fielders_choice' | 'double_play' | 'sacrifice';
type HitType = 'ground_ball' | 'fly_ball' | 'line_drive' | 'bunt' | 'popup';

function generatePA(bats: string): {
  pitches: { pitchType: string; pitchResult: string; locX: number; locY: number }[];
  paResult: PAResult;
  battedBall?: { hitType: HitType; hitResult: HitResult; sprayX: number; sprayY: number; fieldLocation: string };
} {
  // Outcome probabilities
  const roll = Math.random();
  let paResult: PAResult;
  let battedBall: { hitType: HitType; hitResult: HitResult; sprayX: number; sprayY: number; fieldLocation: string } | undefined;

  if (roll < 0.25) paResult = 'single';
  else if (roll < 0.33) paResult = 'double';
  else if (roll < 0.35) paResult = 'triple';
  else if (roll < 0.38) paResult = 'homerun';
  else if (roll < 0.46) paResult = 'walk';
  else if (roll < 0.55) paResult = 'strikeout_swinging';
  else if (roll < 0.60) paResult = 'strikeout_looking';
  else if (roll < 0.62) paResult = 'hbp';
  else if (roll < 0.68) paResult = 'ground_out';
  else if (roll < 0.74) paResult = 'double_play';
  else if (roll < 0.80) paResult = 'fly_out';
  else if (roll < 0.85) paResult = 'line_out';
  else if (roll < 0.88) paResult = 'pop_out';
  else paResult = 'sac_fly';

  // Generate pitch sequence leading to outcome
  const pitches: { pitchType: string; pitchResult: string; locX: number; locY: number }[] = [];
  let balls = 0, strikes = 0;
  const primaryPitchType = choice(PITCH_TYPES.slice(0, 5));

  const maxPitches = paResult === 'walk' ? 6 : paResult.includes('strikeout') ? 7 : r(1, 6);

  while (pitches.length < maxPitches - 1 || pitches.length === 0) {
    const inZone = Math.random() > 0.35;
    const locX = inZone ? rFloat(-0.8, 0.8) : rFloat(-1.4, 1.4) * (Math.random() > 0.5 ? 1 : -1);
    const locY = inZone ? rFloat(0.1, 0.9) : rFloat(-0.4, 1.4);

    let pr: PitchResult;
    if (!inZone) {
      pr = Math.random() > 0.3 ? 'ball' : choice(['swinging_strike', 'foul'] as PitchResult[]);
    } else {
      const r2 = Math.random();
      if (r2 < 0.25) pr = 'called_strike';
      else if (r2 < 0.45) pr = 'swinging_strike';
      else if (r2 < 0.65) pr = 'foul';
      else pr = 'ball';
    }

    if (pr === 'ball') balls++;
    else if (pr === 'called_strike' || pr === 'swinging_strike') strikes++;
    else if (pr === 'foul' && strikes < 2) strikes++;

    if (balls >= 4 && paResult !== 'walk') { balls = 3; }
    if (strikes >= 3) { strikes = 2; }

    pitches.push({ pitchType: choice([primaryPitchType, primaryPitchType, choice(PITCH_TYPES)]), pitchResult: pr, locX, locY });

    if (balls >= 4 || strikes >= 3) break;
  }

  // Final pitch
  let finalPR: string;
  const finalInZone = Math.random() > 0.25;
  const finalLocX = finalInZone ? rFloat(-0.7, 0.7) : rFloat(-1.3, 1.3);
  const finalLocY = finalInZone ? rFloat(0.1, 0.9) : rFloat(-0.3, 1.3);

  if (paResult === 'walk') finalPR = 'ball';
  else if (paResult === 'strikeout_swinging') finalPR = 'swinging_strike';
  else if (paResult === 'strikeout_looking') finalPR = 'called_strike';
  else if (paResult === 'hbp') finalPR = 'hit_by_pitch';
  else finalPR = 'in_play';

  pitches.push({ pitchType: choice([primaryPitchType, primaryPitchType, choice(PITCH_TYPES)]), pitchResult: finalPR, locX: finalLocX, locY: finalLocY });

  // Generate batted ball for in-play outcomes
  if (finalPR === 'in_play') {
    const pullSide = bats === 'R' ? -1 : 1;
    const pullBias = Math.random();
    let sprayX: number, sprayY: number;
    let hitType: HitType;
    let hitResult: HitResult;
    let fieldLocation: string;

    if (['single', 'double', 'triple', 'homerun'].includes(paResult)) {
      // Hit ball — tend to be pulled
      if (paResult === 'homerun') {
        hitType = 'fly_ball';
        hitResult = 'homerun';
        sprayX = rFloat(-40, 40) * pullSide * (Math.random() < 0.6 ? 1 : -1);
        sprayY = rFloat(85, 100);
        fieldLocation = sprayX < -15 ? 'LF' : sprayX > 15 ? 'RF' : 'CF';
      } else if (paResult === 'triple') {
        hitType = choice(['fly_ball', 'line_drive'] as HitType[]);
        hitResult = 'triple';
        sprayX = rFloat(15, 45) * pullSide;
        sprayY = rFloat(70, 95);
        fieldLocation = sprayX < -20 ? 'LF' : sprayX > 20 ? 'RF' : 'CF';
      } else if (paResult === 'double') {
        hitType = choice(['fly_ball', 'line_drive', 'ground_ball'] as HitType[]);
        hitResult = 'double';
        sprayX = rFloat(-40, 40);
        sprayY = rFloat(55, 90);
        fieldLocation = sprayX < -20 ? 'LF' : sprayX > 20 ? 'RF' : 'CF';
      } else { // single
        const hitTypeRoll = Math.random();
        if (hitTypeRoll < 0.5) { hitType = 'ground_ball'; sprayY = rFloat(5, 35); }
        else if (hitTypeRoll < 0.8) { hitType = 'line_drive'; sprayY = rFloat(25, 65); }
        else { hitType = 'fly_ball'; sprayY = rFloat(40, 75); }
        hitResult = 'single';
        // Singles tend to be to the pull side or up the middle
        sprayX = pullBias < 0.5 ? rFloat(5, 40) * pullSide : rFloat(-10, 10);
        fieldLocation = getFieldLocation(sprayX, sprayY);
      }
    } else if (paResult === 'ground_out' || paResult === 'double_play') {
      hitType = 'ground_ball';
      hitResult = paResult === 'double_play' ? 'double_play' : 'out';
      sprayX = rFloat(-40, 40);
      sprayY = rFloat(5, 25);
      fieldLocation = getFieldLocation(sprayX, sprayY);
    } else if (paResult === 'fly_out') {
      hitType = 'fly_ball';
      hitResult = 'out';
      sprayX = rFloat(-40, 40);
      sprayY = rFloat(40, 90);
      fieldLocation = getFieldLocation(sprayX, sprayY);
    } else if (paResult === 'line_out') {
      hitType = 'line_drive';
      hitResult = 'out';
      sprayX = rFloat(-40, 40);
      sprayY = rFloat(20, 60);
      fieldLocation = getFieldLocation(sprayX, sprayY);
    } else if (paResult === 'pop_out') {
      hitType = 'popup';
      hitResult = 'out';
      sprayX = rFloat(-20, 20);
      sprayY = rFloat(5, 30);
      fieldLocation = getFieldLocation(sprayX, sprayY);
    } else if (paResult === 'sac_fly') {
      hitType = 'fly_ball';
      hitResult = 'sacrifice';
      sprayX = rFloat(-40, 40);
      sprayY = rFloat(50, 90);
      fieldLocation = getFieldLocation(sprayX, sprayY);
    } else {
      hitType = 'ground_ball';
      hitResult = 'out';
      sprayX = 0;
      sprayY = 20;
      fieldLocation = 'SS';
    }

    battedBall = { hitType, hitResult, sprayX: Math.round(sprayX * 10) / 10, sprayY: Math.round(sprayY * 10) / 10, fieldLocation };
  }

  return { pitches, paResult, battedBall };
}

function getFieldLocation(x: number, y: number): string {
  if (y < 5) return 'C';
  if (y < 15) return 'P';
  if (x > 10 && y < 25) return '1B';
  if (x < -10 && y < 25) return '3B';
  if (x > 0 && y < 30) return '2B';
  if (x <= 0 && y < 30) return 'SS';
  if (y >= 30) {
    if (x < -20) return 'LF';
    if (x < -8) return 'LC';
    if (x <= 8) return 'CF';
    if (x <= 20) return 'RC';
    return 'RF';
  }
  return 'CF';
}

// ─── Main Seed Script ──────────────────────────────────────────────────────────

(async () => {
  const client = await pool.connect();
  try {
    console.log('Clearing existing seed data...');
    await client.query(`
      DELETE FROM scouting_notes;
      DELETE FROM batted_balls;
      DELETE FROM pitches;
      DELETE FROM plate_appearances;
      DELETE FROM game_lineups;
      DELETE FROM games;
      DELETE FROM opponent_players;
      DELETE FROM opponent_teams;
      DELETE FROM my_teams;
      DELETE FROM seasons;
    `);

    // ─── Season ───────────────────────────────────────────────────────────────────

    const seasonRes = await client.query(
      `INSERT INTO seasons (name, year, start_date, end_date, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      ['Spring 2025', 2025, '2025-03-01', '2025-06-15', 1]
    );
    const seasonId = seasonRes.rows[0].id as number;
    console.log('Created season:', seasonId);

    // ─── My Team ─────────────────────────────────────────────────────────────────

    const myTeamRes = await client.query(
      `INSERT INTO my_teams (name, season_id) VALUES ($1, $2) RETURNING id`,
      ['Grand Rapids Thunderhawks', seasonId]
    );
    const myTeamId = myTeamRes.rows[0].id as number;

    // ─── Opponent Teams ───────────────────────────────────────────────────────────

    const teams = [
      { name: 'Riverside Hawks', league: 'Section 4A', notes: 'Aggressive hitters, heavy pull side. Watch for bunters.' },
      { name: 'Valley Mustangs', league: 'Section 4A', notes: 'Strong pitching staff. Patient hitters.' },
      { name: 'Coastal Sharks', league: 'Section 4B', notes: 'Speed on the bases. Many lefty hitters.' },
    ];

    const teamIds: number[] = [];
    for (const t of teams) {
      const res = await client.query(
        `INSERT INTO opponent_teams (name, league, notes, season_id) VALUES ($1, $2, $3, $4) RETURNING id`,
        [t.name, t.league, t.notes, seasonId]
      );
      teamIds.push(res.rows[0].id as number);
    }
    console.log('Created teams:', teamIds);

    // ─── Players ──────────────────────────────────────────────────────────────────

    const FIRST_NAMES = ['Jake', 'Marcus', 'Tyler', 'Ryan', 'Connor', 'Ethan', 'Zach', 'Alex', 'Jordan', 'Cole', 'Mason', 'Logan', 'Dylan', 'Austin', 'Hunter', 'Brady', 'Cody', 'Blake', 'Luke', 'Drew'];
    const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Davis', 'Miller', 'Wilson', 'Taylor', 'Anderson', 'Garcia', 'Martinez', 'Robinson', 'Clark', 'Rodriguez', 'Lewis', 'Lee', 'Walker', 'Hall', 'Allen'];
    const BATS_OPTIONS: ('R' | 'L' | 'S')[] = ['R', 'R', 'R', 'L', 'L', 'S'];

    const playerIdsByTeam: Record<number, number[]> = {};

    for (const teamId of teamIds) {
      const playerCount = r(12, 15);
      playerIdsByTeam[teamId] = [];
      const usedNumbers = new Set<number>();

      for (let i = 0; i < playerCount; i++) {
        let num: number;
        do { num = r(1, 35); } while (usedNumbers.has(num));
        usedNumbers.add(num);

        const pos = i < POSITIONS_LIST.length ? POSITIONS_LIST[i] : choice(POSITIONS_LIST);
        const bats = choice(BATS_OPTIONS);
        const throws: 'R' | 'L' = Math.random() < 0.85 ? 'R' : 'L';

        const res = await client.query(`
          INSERT INTO opponent_players (team_id, first_name, last_name, jersey_number, bats, throws, primary_position, notes)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id
        `, [
          teamId,
          choice(FIRST_NAMES),
          choice(LAST_NAMES),
          String(num),
          bats, throws, pos,
          pos === 'C' ? 'Good game caller, slow runner.' : pos === 'SS' ? 'Slick fielder, contact hitter.' : '',
        ]);
        playerIdsByTeam[teamId].push(res.rows[0].id as number);
      }
      console.log(`Created ${playerCount} players for team ${teamId}`);
    }

    // ─── Games ────────────────────────────────────────────────────────────────────

    const GAME_CONFIGS = [
      { teamIdx: 0, date: '2025-03-15', myScore: 3, oppScore: 5, homeAway: 'home' },
      { teamIdx: 0, date: '2025-03-29', myScore: 7, oppScore: 2, homeAway: 'away' },
      { teamIdx: 1, date: '2025-04-05', myScore: 4, oppScore: 4, homeAway: 'home' },
      { teamIdx: 1, date: '2025-04-19', myScore: 6, oppScore: 1, homeAway: 'away' },
      { teamIdx: 2, date: '2025-05-03', myScore: 2, oppScore: 8, homeAway: 'home' },
    ];

    const gameIds: number[] = [];
    for (const cfg of GAME_CONFIGS) {
      const res = await client.query(`
        INSERT INTO games (season_id, my_team_id, opponent_team_id, game_date, location, home_away, my_score, opponent_score, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'completed')
        RETURNING id
      `, [seasonId, myTeamId, teamIds[cfg.teamIdx], cfg.date, cfg.homeAway === 'home' ? 'Thunderhawks Field' : 'Away Field', cfg.homeAway, cfg.myScore, cfg.oppScore]);
      gameIds.push(res.rows[0].id as number);
    }
    console.log('Created games:', gameIds);

    // ─── Seed plate appearances and pitches ───────────────────────────────────────

    for (let gi = 0; gi < gameIds.length; gi++) {
      const gameId = gameIds[gi];
      const teamId = teamIds[GAME_CONFIGS[gi].teamIdx];
      const teamPlayers = playerIdsByTeam[teamId];

      // Create lineup (first 9 players in batting order)
      const lineupPlayers = teamPlayers.slice(0, 9);
      for (let li = 0; li < lineupPlayers.length; li++) {
        await client.query(`
          INSERT INTO game_lineups (game_id, player_id, batting_order, position) VALUES ($1, $2, $3, $4)
        `, [gameId, lineupPlayers[li], li + 1, POSITIONS_LIST[li]]);
      }

      // Simulate ~7 innings × 3 batters = ~21-35 PAs
      const totalInnings = r(7, 9);
      let paNumber = 0;
      let batterIdx = 0;

      for (let inn = 1; inn <= totalInnings; inn++) {
        const outsInInning = 3;
        let outs = 0;
        let attemptsInInning = 0;

        while (outs < outsInInning && attemptsInInning < 8) {
          attemptsInInning++;
          const playerId = lineupPlayers[batterIdx % lineupPlayers.length];
          batterIdx++;
          paNumber++;

          // Get player bats
          const playerRow = await client.query('SELECT bats FROM opponent_players WHERE id = $1', [playerId]);
          const bats = playerRow.rows[0]?.bats ?? 'R';

          const { pitches: paP, paResult, battedBall } = generatePA(bats);

          const paRes = await client.query(`
            INSERT INTO plate_appearances (game_id, player_id, inning, pa_number, pitch_count, result)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
          `, [gameId, playerId, inn, paNumber, paP.length, paResult]);
          const paId = paRes.rows[0].id as number;

          for (let pi = 0; pi < paP.length; pi++) {
            const p = paP[pi];
            await client.query(`
              INSERT INTO pitches (plate_appearance_id, game_id, batter_id, sequence_number, pitch_type, pitch_result, location_x, location_y)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, [paId, gameId, playerId, pi + 1, p.pitchType, p.pitchResult, p.locX, p.locY]);
          }

          if (battedBall) {
            const rbi = paResult === 'homerun' ? r(1, 4) : paResult === 'double' || paResult === 'single' ? r(0, 2) : 0;
            await client.query(`
              INSERT INTO batted_balls (plate_appearance_id, game_id, batter_id, hit_type, hit_result, field_location, spray_x, spray_y, rbi_count)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `, [paId, gameId, playerId, battedBall.hitType, battedBall.hitResult, battedBall.fieldLocation, battedBall.sprayX, battedBall.sprayY, rbi]);
          }

          // Count outs
          const isOut = ['strikeout_swinging', 'strikeout_looking', 'ground_out', 'fly_out', 'line_out', 'pop_out', 'sac_fly'].includes(paResult);
          const isDP = paResult === 'double_play';
          if (isDP) outs += 2;
          else if (isOut) outs += 1;
        }
      }
      console.log(`Seeded game ${gameId}: ${paNumber} PAs across ${totalInnings} innings`);
    }

    // ─── Scouting notes ───────────────────────────────────────────────────────────

    const sampleNotes = [
      ['hitting', 'Strong pull hitter. Struggles with inside fastballs up in the zone.'],
      ['hitting', 'Likes the first pitch. Attack him early with fastballs.'],
      ['hitting', 'Patient hitter. Will work the count. Mix off-speed.'],
      ['hitting', 'Chase rate is high on breaking balls below the zone.'],
      ['fielding', 'Good range at shortstop. Strong arm.'],
      ['mental', 'Gets frustrated after strikeouts. Press him in 0-2 counts.'],
    ];

    for (const teamId of teamIds) {
      const players = playerIdsByTeam[teamId].slice(0, 5);
      for (const pid of players) {
        const note = choice(sampleNotes);
        await client.query(`
          INSERT INTO scouting_notes (player_id, season_id, note_type, content) VALUES ($1, $2, $3, $4)
        `, [pid, seasonId, note[0], note[1]]);
      }
    }

    console.log('\n✅ Seed complete!');
    const summary = await client.query('SELECT COUNT(*) as cnt FROM plate_appearances');
    const pitchCount = await client.query('SELECT COUNT(*) as cnt FROM pitches');
    const ballCount = await client.query('SELECT COUNT(*) as cnt FROM batted_balls');
    console.log(`  ${summary.rows[0].cnt} plate appearances`);
    console.log(`  ${pitchCount.rows[0].cnt} pitches`);
    console.log(`  ${ballCount.rows[0].cnt} batted balls`);
  } finally {
    client.release();
    await pool.end();
  }
})();
