import type { FieldLocation } from '@/types';

// Spray chart coordinate system:
// sprayX: -50 (LF foul) to +50 (RF foul), 0 = center
// sprayY: 0 (home plate) to 100 (deep center)
//
// SVG canvas: 400 wide x 380 tall
// Home plate at SVG (200, 355)

export const SVG_WIDTH = 400;
export const SVG_HEIGHT = 380;
export const HOME_PLATE_X = 200;
export const HOME_PLATE_Y = 355;

export function sprayToSvg(sprayX: number, sprayY: number): [number, number] {
  const svgX = HOME_PLATE_X + (sprayX / 50) * 180;
  const svgY = HOME_PLATE_Y - (sprayY / 100) * 330;
  return [svgX, svgY];
}

export function svgToSpray(svgX: number, svgY: number): [number, number] {
  const sprayX = ((svgX - HOME_PLATE_X) / 180) * 50;
  const sprayY = ((HOME_PLATE_Y - svgY) / 330) * 100;
  return [
    Math.max(-50, Math.min(50, sprayX)),
    Math.max(0, Math.min(100, sprayY)),
  ];
}

export function sprayToFieldLocation(sprayX: number, sprayY: number): FieldLocation {
  const x = sprayX;
  const y = sprayY;

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

// Strike zone coordinate system:
// locationX: -1.5 (far inside to RHB) to +1.5 (far outside to RHB)
// locationY: -0.5 (below zone) to +1.5 (above zone)
// Zone: -0.83 <= X <= 0.83, 0.0 <= Y <= 1.0

export const ZONE_WIDTH = 200;
export const ZONE_HEIGHT = 220;
export const ZONE_LEFT = 20;
export const ZONE_TOP = 10;

export function locationToZoneSvg(locationX: number, locationY: number): [number, number] {
  // Map locationX: -1.5..+1.5 to SVG x: 0..ZONE_WIDTH
  const svgX = ZONE_LEFT + ((locationX + 1.5) / 3.0) * ZONE_WIDTH;
  // Map locationY: -0.5..+1.5 to SVG y: ZONE_HEIGHT..0 (inverted)
  const svgY = ZONE_TOP + ((1.5 - locationY) / 2.0) * ZONE_HEIGHT;
  return [svgX, svgY];
}

export function zoneSvgToLocation(svgX: number, svgY: number): [number, number] {
  const locationX = ((svgX - ZONE_LEFT) / ZONE_WIDTH) * 3.0 - 1.5;
  const locationY = 1.5 - ((svgY - ZONE_TOP) / ZONE_HEIGHT) * 2.0;
  return [
    Math.max(-1.5, Math.min(1.5, locationX)),
    Math.max(-0.5, Math.min(1.5, locationY)),
  ];
}

export function isInZone(locationX: number, locationY: number): boolean {
  return locationX >= -0.83 && locationX <= 0.83 && locationY >= 0.0 && locationY <= 1.0;
}
