'use client';

import { useMemo } from 'react';
import type { PitchHeatMapDot } from '@/types';
import { PITCH_TYPE_COLORS } from '@/lib/field/colors';

interface Props {
  pitches: PitchHeatMapDot[];
  filterType?: 'all' | 'swings' | 'whiffs' | 'called_strikes' | 'in_play';
  selectedPitchType?: string;
}

const WIDTH = 280;
const HEIGHT = 280;
const MARGIN = 20;

// Strike zone in SVG space
const ZONE_LEFT = MARGIN + 40;
const ZONE_RIGHT = WIDTH - MARGIN - 40;
const ZONE_TOP = MARGIN + 20;
const ZONE_BOTTOM = HEIGHT - MARGIN - 30;
const ZONE_W = ZONE_RIGHT - ZONE_LEFT;
const ZONE_H = ZONE_BOTTOM - ZONE_TOP;

function locationToSvg(locationX: number, locationY: number) {
  // locationX: -1.5 to +1.5, locationY: -0.5 to +1.5
  const svgX = ZONE_LEFT + ((locationX + 1.5) / 3.0) * ZONE_W;
  const svgY = ZONE_BOTTOM - ((locationY + 0.5) / 2.0) * ZONE_H;
  return [svgX, svgY];
}

export function StrikeZoneHeatMap({ pitches, filterType = 'all', selectedPitchType }: Props) {
  const filteredPitches = useMemo(() => {
    let result = pitches.filter((p) => p.locationX != null && p.locationY != null);
    if (selectedPitchType) result = result.filter((p) => p.pitchType === selectedPitchType);
    if (filterType === 'swings') {
      result = result.filter((p) => ['swinging_strike', 'foul', 'in_play', 'foul_tip'].includes(p.pitchResult));
    } else if (filterType === 'whiffs') {
      result = result.filter((p) => p.pitchResult === 'swinging_strike');
    } else if (filterType === 'called_strikes') {
      result = result.filter((p) => p.pitchResult === 'called_strike');
    } else if (filterType === 'in_play') {
      result = result.filter((p) => p.pitchResult === 'in_play');
    }
    return result;
  }, [pitches, filterType, selectedPitchType]);

  const pitchTypeColors: Record<string, string> = {
    all: '#3b82f6',
    ...PITCH_TYPE_COLORS,
  };

  function getDotColor(pitchType: string, pitchResult: string): string {
    if (pitchResult === 'called_strike') return '#ef4444';
    if (pitchResult === 'swinging_strike') return '#f97316';
    if (pitchResult === 'ball') return '#3b82f6';
    if (pitchResult === 'in_play') return '#22c55e';
    if (pitchResult === 'foul' || pitchResult === 'foul_tip') return '#eab308';
    return selectedPitchType ? (PITCH_TYPE_COLORS[pitchType] ?? '#9ca3af') : '#9ca3af';
  }

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full">
        {/* Background */}
        <rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="#0f172a" rx={8} />

        {/* Far-outside shading */}
        <rect x={ZONE_LEFT - 40} y={ZONE_TOP - 20} width={ZONE_W + 80} height={ZONE_H + 40} fill="rgba(100,116,139,0.1)" rx={4} />

        {/* Border/chase zone */}
        <rect x={ZONE_LEFT - 15} y={ZONE_TOP - 10} width={ZONE_W + 30} height={ZONE_H + 20} fill="rgba(100,116,139,0.15)" />

        {/* Strike zone */}
        <rect x={ZONE_LEFT} y={ZONE_TOP} width={ZONE_W} height={ZONE_H} fill="rgba(59,130,246,0.08)" stroke="#475569" strokeWidth={1.5} />

        {/* Zone grid (3x3) */}
        {[1/3, 2/3].map((f) => (
          <g key={f}>
            <line x1={ZONE_LEFT + ZONE_W * f} y1={ZONE_TOP} x2={ZONE_LEFT + ZONE_W * f} y2={ZONE_BOTTOM} stroke="#334155" strokeWidth={0.5} />
            <line x1={ZONE_LEFT} y1={ZONE_TOP + ZONE_H * f} x2={ZONE_RIGHT} y2={ZONE_TOP + ZONE_H * f} stroke="#334155" strokeWidth={0.5} />
          </g>
        ))}

        {/* Labels */}
        <text x={WIDTH / 2} y={HEIGHT - 5} textAnchor="middle" fill="#64748b" fontSize={9}>Outside →</text>
        <text x={ZONE_LEFT} y={HEIGHT - 5} textAnchor="start" fill="#64748b" fontSize={9}>← Inside</text>
        <text x={5} y={ZONE_TOP + ZONE_H / 2} textAnchor="middle" fill="#64748b" fontSize={9} transform={`rotate(-90, 5, ${ZONE_TOP + ZONE_H / 2})`}>
          High
        </text>

        {/* Batter silhouette hint */}
        <text x={ZONE_RIGHT + 8} y={ZONE_BOTTOM} fill="#334155" fontSize={28}>🏏</text>

        {/* Count label */}
        <text x={ZONE_LEFT} y={ZONE_TOP - 5} fill="#64748b" fontSize={9}>
          {filteredPitches.length} pitch{filteredPitches.length !== 1 ? 'es' : ''}
        </text>

        {/* Pitch dots */}
        {filteredPitches.map((pitch) => {
          const [svgX, svgY] = locationToSvg(pitch.locationX!, pitch.locationY!);
          return (
            <circle
              key={pitch.id}
              cx={svgX}
              cy={svgY}
              r={5}
              fill={getDotColor(pitch.pitchType, pitch.pitchResult)}
              stroke="rgba(0,0,0,0.4)"
              strokeWidth={0.5}
              opacity={0.75}
            />
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs">
        {[
          { color: '#ef4444', label: 'Called K' },
          { color: '#f97316', label: 'Swinging K' },
          { color: '#3b82f6', label: 'Ball' },
          { color: '#22c55e', label: 'In Play' },
          { color: '#eab308', label: 'Foul' },
        ].map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1 text-slate-400">
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: color }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
