'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { SprayDot, HitType, HitResult } from '@/types';
import { HIT_RESULT_COLORS, HIT_TYPE_SHAPES, shapePath } from '@/lib/field/colors';
import { sprayToSvg, SVG_WIDTH, SVG_HEIGHT, HOME_PLATE_X, HOME_PLATE_Y } from '@/lib/field/coordinates';

interface SprayChartProps {
  dots: SprayDot[];
  width?: number;
  height?: number;
  onDotClick?: (dot: SprayDot) => void;
}

interface Tooltip {
  dot: SprayDot;
  x: number;
  y: number;
}

export function SprayChart({ dots, width = SVG_WIDTH, height = SVG_HEIGHT, onDotClick }: SprayChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);

    // Set up zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 6])
      .on('zoom', (event) => {
        svg.select('g.zoom-group').attr('transform', event.transform);
      });

    svg.call(zoom);

    return () => {
      svg.on('.zoom', null);
    };
  }, []);

  // Scale factors
  const scaleX = width / SVG_WIDTH;
  const scaleY = height / SVG_HEIGHT;

  // Field rendering helpers (all in natural SVG_WIDTH x SVG_HEIGHT space, then scaled)
  const cx = HOME_PLATE_X;
  const cy = HOME_PLATE_Y;
  const foulAngle = Math.PI / 4; // 45 degrees

  // Outfield wall distance
  const wallDist = 310;
  const centerDist = 340;

  // Compute field path
  const leftFoulLine = `M ${cx} ${cy} L ${cx - wallDist * Math.cos(foulAngle)} ${cy - wallDist * Math.sin(foulAngle)}`;
  const rightFoulLine = `M ${cx} ${cy} L ${cx + wallDist * Math.cos(foulAngle)} ${cy - wallDist * Math.sin(foulAngle)}`;

  // Arc endpoints
  const lfEnd = [cx - wallDist * Math.cos(foulAngle), cy - wallDist * Math.sin(foulAngle)];
  const rfEnd = [cx + wallDist * Math.cos(foulAngle), cy - wallDist * Math.sin(foulAngle)];

  // Build foul territory arcs
  const outfieldArc = `M ${lfEnd[0]} ${lfEnd[1]} A ${centerDist} ${centerDist} 0 0 1 ${rfEnd[0]} ${rfEnd[1]}`;
  const warnTrackOuter = centerDist + 15;
  const warnLfEnd = [cx - warnTrackOuter * Math.cos(foulAngle), cy - warnTrackOuter * Math.sin(foulAngle)];
  const warnRfEnd = [cx + warnTrackOuter * Math.cos(foulAngle), cy - warnTrackOuter * Math.sin(foulAngle)];
  const warningTrackArc = `M ${warnLfEnd[0]} ${warnLfEnd[1]} A ${warnTrackOuter} ${warnTrackOuter} 0 0 1 ${warnRfEnd[0]} ${warnRfEnd[1]}`;

  // Infield dirt circle
  const infieldRadius = 95;
  const pitcherMound = [cx, cy - 60];

  // Base positions (diamond)
  const baseDist = 60;
  const firstBase = [cx + baseDist, cy - baseDist];
  const secondBase = [cx, cy - baseDist * 2];
  const thirdBase = [cx - baseDist, cy - baseDist];
  const homePlate = [cx, cy];

  return (
    <div className="relative inline-block w-full">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="w-full touch-none"
        style={{ maxHeight: height }}
      >
        <defs>
          <radialGradient id="grassGrad" cx="50%" cy="80%" r="70%">
            <stop offset="0%" stopColor="#16a34a" />
            <stop offset="100%" stopColor="#14532d" />
          </radialGradient>
          <radialGradient id="infieldGrad" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#a16207" />
            <stop offset="100%" stopColor="#92400e" />
          </radialGradient>
          <clipPath id="fieldClip">
            <path d={`M ${cx} ${cy} L ${lfEnd[0]} ${lfEnd[1]} A ${centerDist} ${centerDist} 0 0 1 ${rfEnd[0]} ${rfEnd[1]} Z`} />
          </clipPath>
        </defs>

        <g className="zoom-group">
          {/* Background */}
          <rect x={0} y={0} width={SVG_WIDTH} height={SVG_HEIGHT} fill="#0f172a" />

          {/* Outfield grass */}
          <path
            d={`M ${cx} ${cy} L ${lfEnd[0]} ${lfEnd[1]} A ${centerDist} ${centerDist} 0 0 1 ${rfEnd[0]} ${rfEnd[1]} Z`}
            fill="url(#grassGrad)"
          />

          {/* Warning track */}
          <path
            d={`M ${cx} ${cy} L ${warnLfEnd[0]} ${warnLfEnd[1]} A ${warnTrackOuter} ${warnTrackOuter} 0 0 1 ${warnRfEnd[0]} ${warnRfEnd[1]} Z`}
            fill="#92400e"
            opacity={0.5}
          />

          {/* Re-draw outfield grass on top (inner) */}
          <path
            d={`M ${cx} ${cy} L ${lfEnd[0]} ${lfEnd[1]} A ${centerDist} ${centerDist} 0 0 1 ${rfEnd[0]} ${rfEnd[1]} Z`}
            fill="url(#grassGrad)"
            clipPath="url(#fieldClip)"
          />

          {/* Infield dirt */}
          <circle cx={cx} cy={cy - baseDist} r={infieldRadius} fill="url(#infieldGrad)" />

          {/* Infield grass (inner diamond) */}
          <polygon
            points={`${firstBase[0]},${firstBase[1]} ${secondBase[0]},${secondBase[1]} ${thirdBase[0]},${thirdBase[1]} ${homePlate[0]},${homePlate[1]}`}
            fill="#16a34a"
          />

          {/* Foul lines */}
          <line x1={cx} y1={cy} x2={lfEnd[0]} y2={lfEnd[1]} stroke="white" strokeWidth={1.5} opacity={0.8} />
          <line x1={cx} y1={cy} x2={rfEnd[0]} y2={rfEnd[1]} stroke="white" strokeWidth={1.5} opacity={0.8} />

          {/* Outfield arc */}
          <path d={outfieldArc} fill="none" stroke="white" strokeWidth={1.5} opacity={0.6} />

          {/* Warning track arc */}
          <path d={warningTrackArc} fill="none" stroke="#d97706" strokeWidth={1} opacity={0.5} />

          {/* Base paths */}
          <line x1={homePlate[0]} y1={homePlate[1]} x2={firstBase[0]} y2={firstBase[1]} stroke="#d97706" strokeWidth={1} opacity={0.6} />
          <line x1={firstBase[0]} y1={firstBase[1]} x2={secondBase[0]} y2={secondBase[1]} stroke="#d97706" strokeWidth={1} opacity={0.6} />
          <line x1={secondBase[0]} y1={secondBase[1]} x2={thirdBase[0]} y2={thirdBase[1]} stroke="#d97706" strokeWidth={1} opacity={0.6} />
          <line x1={thirdBase[0]} y1={thirdBase[1]} x2={homePlate[0]} y2={homePlate[1]} stroke="#d97706" strokeWidth={1} opacity={0.6} />

          {/* Bases */}
          {[firstBase, secondBase, thirdBase].map(([bx, by], i) => (
            <rect
              key={i}
              x={bx - 5}
              y={by - 5}
              width={10}
              height={10}
              fill="white"
              transform={`rotate(45, ${bx}, ${by})`}
            />
          ))}

          {/* Home plate */}
          <polygon
            points={`${cx},${cy - 8} ${cx + 7},${cy - 4} ${cx + 7},${cy + 3} ${cx - 7},${cy + 3} ${cx - 7},${cy - 4}`}
            fill="white"
          />

          {/* Pitcher's mound */}
          <circle cx={pitcherMound[0]} cy={pitcherMound[1]} r={8} fill="#a16207" opacity={0.8} />
          <circle cx={pitcherMound[0]} cy={pitcherMound[1]} r={2} fill="#d97706" />

          {/* Field position labels */}
          {[
            { label: 'LF', x: cx - 140, y: cy - 180 },
            { label: 'CF', x: cx, y: cy - 230 },
            { label: 'RF', x: cx + 140, y: cy - 180 },
            { label: 'SS', x: cx - 55, y: cy - 95 },
            { label: '2B', x: cx + 35, y: cy - 100 },
            { label: '3B', x: cx - 100, y: cy - 50 },
            { label: '1B', x: cx + 90, y: cy - 50 },
          ].map(({ label, x, y }) => (
            <text key={label} x={x} y={y} fill="rgba(255,255,255,0.4)" fontSize={11} textAnchor="middle" dominantBaseline="middle">
              {label}
            </text>
          ))}

          {/* Spray dots */}
          {dots.map((dot) => {
            if (dot.sprayX == null || dot.sprayY == null) return null;
            const [svgX, svgY] = sprayToSvg(dot.sprayX, dot.sprayY);
            const color = HIT_RESULT_COLORS[dot.hitResult] ?? '#9ca3af';
            const shape = HIT_TYPE_SHAPES[dot.hitType] ?? 'circle';
            const path = shapePath(shape, svgX, svgY, 6);

            return (
              <path
                key={dot.id}
                d={path}
                fill={color}
                stroke="rgba(0,0,0,0.5)"
                strokeWidth={0.5}
                opacity={0.85}
                className="spray-dot cursor-pointer"
                onMouseEnter={(e) => {
                  const rect = svgRef.current?.getBoundingClientRect();
                  if (rect) {
                    setTooltip({ dot, x: e.clientX - rect.left, y: e.clientY - rect.top });
                  }
                }}
                onMouseLeave={() => setTooltip(null)}
                onClick={() => onDotClick?.(dot)}
              />
            );
          })}
        </g>
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute z-50 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-xs shadow-xl pointer-events-none"
          style={{ left: tooltip.x + 10, top: tooltip.y - 10 }}
        >
          <p className="font-semibold text-white">{tooltip.dot.hitResult.replace('_', ' ').toUpperCase()}</p>
          <p className="text-slate-300">{tooltip.dot.hitType.replace('_', ' ')}</p>
          {tooltip.dot.gameDate && <p className="text-slate-400">{tooltip.dot.gameDate}</p>}
          {tooltip.dot.outByPositions && <p className="text-slate-400">Play: {tooltip.dot.outByPositions}</p>}
        </div>
      )}
    </div>
  );
}
