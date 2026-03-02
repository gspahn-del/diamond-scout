import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAvg(avg: number): string {
  if (isNaN(avg)) return '.000';
  return avg.toFixed(3).replace(/^0/, '');
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatShortDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function positionLabel(pos: string): string {
  const map: Record<string, string> = {
    P: '1-P', C: '2-C', '1B': '3-1B', '2B': '4-2B',
    '3B': '5-3B', SS: '6-SS', LF: '7-LF', CF: '8-CF', RF: '9-RF',
  };
  return map[pos] || pos;
}

export function positionNumber(pos: string): number {
  const map: Record<string, number> = {
    P: 1, C: 2, '1B': 3, '2B': 4, '3B': 5, SS: 6, LF: 7, CF: 8, RF: 9,
  };
  return map[pos] || 0;
}

export function numberToPosition(num: number): string {
  const map: Record<number, string> = {
    1: 'P', 2: 'C', 3: '1B', 4: '2B', 5: '3B', 6: 'SS', 7: 'LF', 8: 'CF', 9: 'RF',
  };
  return map[num] || String(num);
}

export function pitchTypeLabel(type: string): string {
  const map: Record<string, string> = {
    fastball: 'Fastball', curveball: 'Curveball', slider: 'Slider',
    changeup: 'Changeup', knuckleball: 'Knuckleball', cutter: 'Cutter',
    sinker: 'Sinker', splitter: 'Splitter', other: 'Other',
  };
  return map[type] || type;
}

export function pitchResultLabel(result: string): string {
  const map: Record<string, string> = {
    ball: 'Ball', called_strike: 'Called Strike', swinging_strike: 'Swinging Strike',
    foul: 'Foul', foul_tip: 'Foul Tip', in_play: 'In Play',
    hit_by_pitch: 'HBP', intentional_ball: 'Int. Ball',
  };
  return map[result] || result;
}

export function hitTypeLabel(type: string): string {
  const map: Record<string, string> = {
    ground_ball: 'Ground Ball', fly_ball: 'Fly Ball', line_drive: 'Line Drive',
    bunt: 'Bunt', popup: 'Popup',
  };
  return map[type] || type;
}

export function hitResultLabel(result: string): string {
  const map: Record<string, string> = {
    single: 'Single', double: 'Double', triple: 'Triple', homerun: 'Home Run',
    out: 'Out', error: 'Error', fielders_choice: "Fielder's Choice",
    double_play: 'Double Play', sacrifice: 'Sacrifice',
  };
  return map[result] || result;
}

export function paResultLabel(result: string): string {
  const map: Record<string, string> = {
    single: 'Single', double: 'Double', triple: 'Triple', homerun: 'Home Run',
    walk: 'Walk', strikeout_swinging: 'K (Swinging)', strikeout_looking: 'K (Looking)',
    hbp: 'HBP', sac_fly: 'Sac Fly', sac_bunt: 'Sac Bunt',
    fielders_choice: "Fielder's Choice", error: 'Error', double_play: 'Double Play',
    triple_play: 'Triple Play', reach_on_error: 'ROE', pop_out: 'Pop Out',
    fly_out: 'Fly Out', ground_out: 'Ground Out', line_out: 'Line Out',
  };
  return map[result] || result;
}

export function pct(num: number, denom: number): number {
  if (denom === 0) return 0;
  return Math.round((num / denom) * 1000) / 10;
}
