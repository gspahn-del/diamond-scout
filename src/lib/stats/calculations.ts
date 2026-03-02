import type { PlateAppearance, Pitch, BattedBall, PlayerStats } from '@/types';

const HIT_RESULTS = new Set(['single', 'double', 'triple', 'homerun']);
const OUT_RESULTS = new Set([
  'strikeout_swinging', 'strikeout_looking', 'pop_out', 'fly_out',
  'ground_out', 'line_out', 'double_play', 'triple_play',
]);
const SAC_RESULTS = new Set(['sac_fly', 'sac_bunt']);

export function isHit(result: string | null): boolean {
  return HIT_RESULTS.has(result ?? '');
}

export function isAtBat(result: string | null): boolean {
  if (!result) return false;
  return !['walk', 'hbp', 'sac_fly', 'sac_bunt', 'intentional_ball'].includes(result);
}

export function isSacFly(result: string | null): boolean {
  return result === 'sac_fly';
}

export function calculatePlayerStats(
  playerId: number,
  playerName: string,
  jerseyNumber: string | null,
  primaryPosition: string | null,
  pas: PlateAppearance[],
): PlayerStats {
  let pa = 0, ab = 0, h = 0, singles = 0, doubles = 0, triples = 0;
  let homeRuns = 0, bb = 0, hbp = 0, k = 0, sf = 0, rbi = 0;

  for (const p of pas) {
    if (!p.result) continue;
    pa++;

    const r = p.result;
    if (isAtBat(r)) ab++;
    if (isHit(r)) { h++; }
    if (r === 'single') singles++;
    if (r === 'double') doubles++;
    if (r === 'triple') triples++;
    if (r === 'homerun') homeRuns++;
    if (r === 'walk' || r === 'intentional_ball') bb++;
    if (r === 'hbp') hbp++;
    if (r === 'strikeout_swinging' || r === 'strikeout_looking') k++;
    if (r === 'sac_fly') sf++;
    if (p.resultDetail) {
      try {
        const detail = JSON.parse(p.resultDetail);
        if (detail.rbi) rbi += detail.rbi;
      } catch {}
    }
  }

  const avg = ab > 0 ? h / ab : 0;
  const obpDenom = ab + bb + hbp + sf;
  const obp = obpDenom > 0 ? (h + bb + hbp) / obpDenom : 0;
  const totalBases = singles + doubles * 2 + triples * 3 + homeRuns * 4;
  const slg = ab > 0 ? totalBases / ab : 0;

  return {
    playerId,
    playerName,
    jerseyNumber,
    primaryPosition,
    pa, ab, h, singles, doubles, triples, homeRuns,
    bb, hbp, k, sf, rbi,
    avg, obp, slg,
    ops: obp + slg,
  };
}

export function calculateCountFromPitches(pitches: Pitch[]): { balls: number; strikes: number } {
  let balls = 0;
  let strikes = 0;
  for (const p of pitches) {
    if (p.pitchResult === 'ball' || p.pitchResult === 'intentional_ball') balls++;
    else if (p.pitchResult === 'called_strike' || p.pitchResult === 'swinging_strike') strikes++;
    else if (p.pitchResult === 'foul' || p.pitchResult === 'foul_tip') {
      if (strikes < 2) strikes++;
    }
  }
  return { balls, strikes };
}

export function fieldZoneStats(balls: BattedBall[]) {
  const LOCATIONS = ['LF', 'LC', 'CF', 'RC', 'RF', '1B', '2B', 'SS', '3B', 'P', 'C'] as const;
  const LABELS: Record<string, string> = {
    LF: 'Left Field', LC: 'Left-Center', CF: 'Center Field',
    RC: 'Right-Center', RF: 'Right Field',
    '1B': 'First Base', '2B': 'Second Base', SS: 'Shortstop',
    '3B': 'Third Base', P: 'Pitcher', C: 'Catcher',
  };

  return LOCATIONS.map((loc) => {
    const zBalls = balls.filter((b) => b.fieldLocation === loc);
    const hits = zBalls.filter((b) =>
      ['single', 'double', 'triple', 'homerun'].includes(b.hitResult)
    ).length;
    const abs = zBalls.length;
    const doubles = zBalls.filter((b) => b.hitResult === 'double').length;
    const triples = zBalls.filter((b) => b.hitResult === 'triple').length;
    const homeRuns = zBalls.filter((b) => b.hitResult === 'homerun').length;

    return {
      location: loc,
      label: LABELS[loc],
      abs,
      hits,
      doubles,
      triples,
      homeRuns,
      outs: abs - hits,
      avg: abs > 0 ? hits / abs : 0,
    };
  });
}
