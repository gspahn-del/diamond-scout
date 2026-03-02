'use client';

import { useState, useRef } from 'react';
import { sprayToSvg, svgToSpray, sprayToFieldLocation, SVG_WIDTH, SVG_HEIGHT, HOME_PLATE_X, HOME_PLATE_Y } from '@/lib/field/coordinates';
import type { FieldLocation } from '@/types';

interface Props {
  onLocationSelect: (sprayX: number, sprayY: number, fieldLocation: FieldLocation) => void;
  selectedX?: number | null;
  selectedY?: number | null;
}

export function FieldDiagram({ onLocationSelect, selectedX, selectedY }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  const cx = HOME_PLATE_X;
  const cy = HOME_PLATE_Y;
  const centerDist = 340;
  const wallDist = 310;
  const foulAngle = Math.PI / 4;

  const lfEnd = [cx - wallDist * Math.cos(foulAngle), cy - wallDist * Math.sin(foulAngle)];
  const rfEnd = [cx + wallDist * Math.cos(foulAngle), cy - wallDist * Math.sin(foulAngle)];
  const lfC = [cx - centerDist * Math.cos(foulAngle), cy - centerDist * Math.sin(foulAngle)];
  const rfC = [cx + centerDist * Math.cos(foulAngle), cy - centerDist * Math.sin(foulAngle)];

  const baseDist = 60;
  const firstBase = [cx + baseDist, cy - baseDist];
  const secondBase = [cx, cy - baseDist * 2];
  const thirdBase = [cx - baseDist, cy - baseDist];
  const pitcherMound = [cx, cy - 60];

  function handleTap(e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) {
    e.preventDefault();
    const rect = svgRef.current!.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in e) {
      const touch = e.changedTouches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const svgX = ((clientX - rect.left) / rect.width) * SVG_WIDTH;
    const svgY = ((clientY - rect.top) / rect.height) * SVG_HEIGHT;
    const [sprayX, sprayY] = svgToSpray(svgX, svgY);

    // Only register taps that are within the field
    if (sprayY < 0) return;

    const location = sprayToFieldLocation(sprayX, sprayY);
    onLocationSelect(sprayX, sprayY, location);
  }

  const selectedSvg = selectedX != null && selectedY != null ? sprayToSvg(selectedX, selectedY) : null;

  return (
    <div className="w-full touch-none">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="w-full max-w-sm mx-auto cursor-crosshair"
        onClick={handleTap}
        onTouchEnd={handleTap}
      >
        <defs>
          <radialGradient id="fdGrassGrad" cx="50%" cy="80%" r="70%">
            <stop offset="0%" stopColor="#16a34a" />
            <stop offset="100%" stopColor="#14532d" />
          </radialGradient>
          <radialGradient id="fdDirtGrad" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#a16207" />
            <stop offset="100%" stopColor="#92400e" />
          </radialGradient>
        </defs>

        <rect x={0} y={0} width={SVG_WIDTH} height={SVG_HEIGHT} fill="#0f172a" />

        {/* Outfield grass */}
        <path
          d={`M ${cx} ${cy} L ${lfC[0]} ${lfC[1]} A ${centerDist} ${centerDist} 0 0 1 ${rfC[0]} ${rfC[1]} Z`}
          fill="url(#fdGrassGrad)"
        />

        {/* Foul lines */}
        <line x1={cx} y1={cy} x2={lfEnd[0]} y2={lfEnd[1]} stroke="white" strokeWidth={1.5} opacity={0.7} />
        <line x1={cx} y1={cy} x2={rfEnd[0]} y2={rfEnd[1]} stroke="white" strokeWidth={1.5} opacity={0.7} />

        {/* Outfield arc */}
        <path d={`M ${lfC[0]} ${lfC[1]} A ${centerDist} ${centerDist} 0 0 1 ${rfC[0]} ${rfC[1]}`} fill="none" stroke="white" strokeWidth={1.5} opacity={0.6} />

        {/* Infield dirt */}
        <circle cx={cx} cy={cy - baseDist} r={95} fill="url(#fdDirtGrad)" />

        {/* Infield grass */}
        <polygon
          points={`${firstBase[0]},${firstBase[1]} ${secondBase[0]},${secondBase[1]} ${thirdBase[0]},${thirdBase[1]} ${cx},${cy}`}
          fill="#16a34a"
        />

        {/* Base lines */}
        <line x1={cx} y1={cy} x2={firstBase[0]} y2={firstBase[1]} stroke="#d97706" strokeWidth={1} opacity={0.5} />
        <line x1={firstBase[0]} y1={firstBase[1]} x2={secondBase[0]} y2={secondBase[1]} stroke="#d97706" strokeWidth={1} opacity={0.5} />
        <line x1={secondBase[0]} y1={secondBase[1]} x2={thirdBase[0]} y2={thirdBase[1]} stroke="#d97706" strokeWidth={1} opacity={0.5} />
        <line x1={thirdBase[0]} y1={thirdBase[1]} x2={cx} y2={cy} stroke="#d97706" strokeWidth={1} opacity={0.5} />

        {/* Bases */}
        {[firstBase, secondBase, thirdBase].map(([bx, by], i) => (
          <rect key={i} x={bx - 5} y={by - 5} width={10} height={10} fill="white" transform={`rotate(45, ${bx}, ${by})`} />
        ))}

        {/* Home plate */}
        <polygon points={`${cx},${cy - 8} ${cx + 7},${cy - 4} ${cx + 7},${cy + 3} ${cx - 7},${cy + 3} ${cx - 7},${cy - 4}`} fill="white" />

        {/* Pitcher's mound */}
        <circle cx={pitcherMound[0]} cy={pitcherMound[1]} r={7} fill="#a16207" opacity={0.8} />

        {/* Field position labels */}
        {[
          { label: 'LF', x: cx - 120, y: cy - 200 },
          { label: 'LC', x: cx - 60, y: cy - 230 },
          { label: 'CF', x: cx, y: cy - 245 },
          { label: 'RC', x: cx + 60, y: cy - 230 },
          { label: 'RF', x: cx + 120, y: cy - 200 },
          { label: 'SS', x: cx - 50, y: cy - 100 },
          { label: '2B', x: cx + 30, y: cy - 105 },
          { label: '3B', x: cx - 90, y: cy - 50 },
          { label: '1B', x: cx + 85, y: cy - 50 },
          { label: 'P', x: cx, y: cy - 55 },
        ].map(({ label, x, y }) => (
          <text key={label} x={x} y={y} fill="rgba(255,255,255,0.5)" fontSize={10} textAnchor="middle" dominantBaseline="middle">
            {label}
          </text>
        ))}

        {/* Selected position marker */}
        {selectedSvg && (
          <>
            <circle cx={selectedSvg[0]} cy={selectedSvg[1]} r={14} fill="rgba(59,130,246,0.3)" stroke="#3b82f6" strokeWidth={1.5} />
            <circle cx={selectedSvg[0]} cy={selectedSvg[1]} r={5} fill="#3b82f6" />
          </>
        )}

        {/* Crosshair overlay hint */}
        <text x={cx} y={cy - 290} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize={9}>
          Tap where the ball went
        </text>
      </svg>
    </div>
  );
}
