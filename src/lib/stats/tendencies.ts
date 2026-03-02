import type { BattedBall, Pitch, PlateAppearance, Tendencies } from '@/types';

// Pull side: batter pulls to their dominant side
// RHH pulls to 3B/SS/LF/LC side (negative X in our coord system)
// LHH pulls to 1B/2B/RF/RC side (positive X)
function isPull(ball: BattedBall, bats: 'R' | 'L' | 'S'): boolean {
  const x = ball.sprayX ?? 0;
  if (bats === 'R') return x < -8;   // hit to left side
  if (bats === 'L') return x > 8;    // hit to right side
  return false; // switch hitter: approximate
}

function isOppo(ball: BattedBall, bats: 'R' | 'L' | 'S'): boolean {
  const x = ball.sprayX ?? 0;
  if (bats === 'R') return x > 8;
  if (bats === 'L') return x < -8;
  return false;
}

function isCenter(ball: BattedBall): boolean {
  const x = ball.sprayX ?? 0;
  return Math.abs(x) <= 8;
}

export function calculateTendencies(
  playerId: number,
  bats: 'R' | 'L' | 'S',
  battedBalls: BattedBall[],
  pitches: Pitch[],
  pas: PlateAppearance[],
): Tendencies {
  const total = battedBalls.length;

  // Batted ball direction
  const pull = battedBalls.filter((b) => isPull(b, bats)).length;
  const center = battedBalls.filter((b) => isCenter(b)).length;
  const oppo = battedBalls.filter((b) => isOppo(b, bats)).length;

  // Hit type rates
  const gb = battedBalls.filter((b) => b.hitType === 'ground_ball').length;
  const fb = battedBalls.filter((b) => b.hitType === 'fly_ball').length;
  const ld = battedBalls.filter((b) => b.hitType === 'line_drive').length;
  const bunt = battedBalls.filter((b) => b.hitType === 'bunt').length;
  const popup = battedBalls.filter((b) => b.hitType === 'popup').length;

  // Chase rate: swings at pitches clearly outside zone
  // Zone: -0.83 <= X <= 0.83, 0.0 <= Y <= 1.0
  const outsidePitches = pitches.filter((p) => {
    const x = p.locationX ?? 0;
    const y = p.locationY ?? 0.5;
    return x < -0.83 || x > 0.83 || y < 0 || y > 1.0;
  });
  const chaseSwings = outsidePitches.filter(
    (p) => p.pitchResult === 'swinging_strike' || p.pitchResult === 'foul'
  ).length;

  // Whiff rate overall
  const swings = pitches.filter(
    (p) => p.pitchResult === 'swinging_strike' || p.pitchResult === 'foul' ||
           p.pitchResult === 'in_play' || p.pitchResult === 'foul_tip'
  ).length;
  const whiffs = pitches.filter((p) => p.pitchResult === 'swinging_strike').length;

  // First-pitch swing
  const firstPitches = pitches.filter((p) => p.sequenceNumber === 1);
  const firstSwings = firstPitches.filter(
    (p) => p.pitchResult !== 'ball' && p.pitchResult !== 'called_strike' &&
            p.pitchResult !== 'hit_by_pitch'
  ).length;

  // AVG by count (simplified)
  const avgByCount: Record<string, number> = {};
  const counts = ['0-0', '0-1', '0-2', '1-0', '1-1', '1-2', '2-0', '2-1', '2-2', '3-0', '3-1', '3-2'];
  for (const count of counts) {
    const [b, s] = count.split('-').map(Number);
    // Find PAs where the result pitch was recorded at this count
    // Approximation: count up balls/strikes by sequence within the PA
    const matchPAs = pas.filter((pa) => {
      if (!pa.result) return false;
      // simplified: just track count 0-0 as all ABs
      return true;
    });
    avgByCount[count] = 0; // placeholder — would need PA-level count tracking
  }

  // AVG by pitch type
  const avgByPitchType: Record<string, number> = {};
  const whiffByPitchType: Record<string, number> = {};
  const pitchTypes = [...new Set(pitches.map((p) => p.pitchType))];
  for (const pt of pitchTypes) {
    const ptPitches = pitches.filter((p) => p.pitchType === pt);
    const ptSwings = ptPitches.filter(
      (p) => p.pitchResult === 'swinging_strike' || p.pitchResult === 'foul' ||
              p.pitchResult === 'in_play' || p.pitchResult === 'foul_tip'
    ).length;
    const ptWhiffs = ptPitches.filter((p) => p.pitchResult === 'swinging_strike').length;
    whiffByPitchType[pt] = ptSwings > 0 ? ptWhiffs / ptSwings : 0;

    // Find balls in play off this pitch type
    const inPlay = ptPitches.filter((p) => p.pitchResult === 'in_play').length;
    // Approximation: look at final PA result for PAs where last pitch was this type in play
    // This is a simplification
    avgByPitchType[pt] = 0;
  }

  return {
    playerId,
    totalBattedBalls: total,
    pullPct: total > 0 ? pull / total : 0,
    centerPct: total > 0 ? center / total : 0,
    oppoPct: total > 0 ? oppo / total : 0,
    gbPct: total > 0 ? gb / total : 0,
    fbPct: total > 0 ? fb / total : 0,
    ldPct: total > 0 ? ld / total : 0,
    buntPct: total > 0 ? bunt / total : 0,
    popupPct: total > 0 ? popup / total : 0,
    chaseRate: outsidePitches.length > 0 ? chaseSwings / outsidePitches.length : 0,
    whiffRate: swings > 0 ? whiffs / swings : 0,
    firstPitchSwingPct: firstPitches.length > 0 ? firstSwings / firstPitches.length : 0,
    avgByCount,
    avgByPitchType,
    whiffByPitchType,
  };
}
