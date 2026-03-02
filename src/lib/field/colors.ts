import type { HitResult, HitType } from '@/types';

export const HIT_RESULT_COLORS: Record<HitResult, string> = {
  single: '#22c55e',        // green
  double: '#3b82f6',        // blue
  triple: '#eab308',        // yellow/gold
  homerun: '#ef4444',       // red
  out: '#6b7280',           // gray
  error: '#f97316',         // orange
  fielders_choice: '#f97316',
  double_play: '#6b7280',
  sacrifice: '#a855f7',     // purple
};

export const HIT_RESULT_LABELS: Record<HitResult, string> = {
  single: 'Single',
  double: 'Double',
  triple: 'Triple',
  homerun: 'Home Run',
  out: 'Out',
  error: 'Error',
  fielders_choice: "Fielder's Choice",
  double_play: 'Double Play',
  sacrifice: 'Sacrifice',
};

export const PITCH_TYPE_COLORS: Record<string, string> = {
  fastball: '#ef4444',
  curveball: '#3b82f6',
  slider: '#22c55e',
  changeup: '#f97316',
  knuckleball: '#a855f7',
  cutter: '#eab308',
  sinker: '#14b8a6',
  splitter: '#f43f5e',
  other: '#9ca3af',
};

export type DotShape = 'circle' | 'triangle' | 'diamond' | 'square' | 'small-circle';

export const HIT_TYPE_SHAPES: Record<HitType, DotShape> = {
  ground_ball: 'circle',
  fly_ball: 'triangle',
  line_drive: 'diamond',
  bunt: 'square',
  popup: 'small-circle',
};

export const HIT_TYPE_LABELS: Record<HitType, string> = {
  ground_ball: 'Ground Ball',
  fly_ball: 'Fly Ball',
  line_drive: 'Line Drive',
  bunt: 'Bunt',
  popup: 'Popup',
};

// Returns SVG path data for a dot shape centered at (cx, cy) with radius r
export function shapePath(shape: DotShape, cx: number, cy: number, r: number): string {
  switch (shape) {
    case 'circle':
      return `M ${cx} ${cy} m -${r} 0 a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 -${2 * r} 0`;
    case 'small-circle':
      const sr = r * 0.6;
      return `M ${cx} ${cy} m -${sr} 0 a ${sr} ${sr} 0 1 0 ${2 * sr} 0 a ${sr} ${sr} 0 1 0 -${2 * sr} 0`;
    case 'triangle': {
      const h = r * 1.5;
      return `M ${cx} ${cy - h} L ${cx + r * 1.2} ${cy + r * 0.7} L ${cx - r * 1.2} ${cy + r * 0.7} Z`;
    }
    case 'diamond': {
      return `M ${cx} ${cy - r * 1.3} L ${cx + r * 1.1} ${cy} L ${cx} ${cy + r * 1.3} L ${cx - r * 1.1} ${cy} Z`;
    }
    case 'square': {
      const s = r * 1.0;
      return `M ${cx - s} ${cy - s} L ${cx + s} ${cy - s} L ${cx + s} ${cy + s} L ${cx - s} ${cy + s} Z`;
    }
  }
}
