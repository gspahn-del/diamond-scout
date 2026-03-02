'use client';

interface Props {
  onLocationSelect: (x: number, y: number) => void;
  selectedX?: number | null;
  selectedY?: number | null;
}

// 7 columns × 7 rows grid (inner 3x3 + surrounding border zones)
// locationX: -1.5 to +1.5, locationY: -0.5 to +1.5

const COLS = 7;
const ROWS = 7;

function getLocationXY(col: number, row: number): [number, number] {
  // col 0-6 → x from -1.5 to +1.5
  const x = -1.5 + (col / (COLS - 1)) * 3.0;
  // row 0-6 → y from +1.5 to -0.5 (inverted for SVG)
  const y = 1.5 - (row / (ROWS - 1)) * 2.0;
  return [x, y];
}

function isInZone(col: number, row: number): boolean {
  return col >= 2 && col <= 4 && row >= 2 && row <= 4;
}

function isBorderZone(col: number, row: number): boolean {
  return (col >= 1 && col <= 5 && row >= 1 && row <= 5) && !isInZone(col, row);
}

function isFarZone(col: number, row: number): boolean {
  return !isInZone(col, row) && !isBorderZone(col, row);
}

export function StrikeZone({ onLocationSelect, selectedX, selectedY }: Props) {
  const cellSize = 48;
  const width = COLS * cellSize;
  const height = ROWS * cellSize;

  return (
    <div className="touch-none">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full max-w-[340px] mx-auto cursor-crosshair"
        onClick={(e) => {
          const rect = (e.target as SVGElement).ownerSVGElement!.getBoundingClientRect();
          const svgX = ((e.clientX - rect.left) / rect.width) * width;
          const svgY = ((e.clientY - rect.top) / rect.height) * height;
          const col = Math.floor(svgX / cellSize);
          const row = Math.floor(svgY / cellSize);
          if (col >= 0 && col < COLS && row >= 0 && row < ROWS) {
            const [lx, ly] = getLocationXY(col + 0.5, row + 0.5);
            onLocationSelect(lx, ly);
          }
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          const touch = e.changedTouches[0];
          const rect = (e.target as SVGElement).ownerSVGElement!.getBoundingClientRect();
          const svgX = ((touch.clientX - rect.left) / rect.width) * width;
          const svgY = ((touch.clientY - rect.top) / rect.height) * height;
          const col = Math.floor(svgX / cellSize);
          const row = Math.floor(svgY / cellSize);
          if (col >= 0 && col < COLS && row >= 0 && row < ROWS) {
            const [lx, ly] = getLocationXY(col + 0.5, row + 0.5);
            onLocationSelect(lx, ly);
          }
        }}
      >
        {/* Cells */}
        {Array.from({ length: ROWS }, (_, row) =>
          Array.from({ length: COLS }, (_, col) => {
            const inZone = isInZone(col, row);
            const border = isBorderZone(col, row);
            const far = isFarZone(col, row);

            const fill = inZone
              ? 'rgba(59,130,246,0.12)'
              : border
              ? 'rgba(100,116,139,0.08)'
              : 'rgba(30,41,59,0.5)';

            const stroke = inZone ? '#3b82f6' : '#334155';
            const strokeW = inZone ? 1.5 : 0.5;

            // Check if this cell is selected
            const [cellX, cellY] = getLocationXY(col + 0.5, row + 0.5);
            const isSelected =
              selectedX != null &&
              selectedY != null &&
              Math.abs(cellX - selectedX) < 3 / COLS &&
              Math.abs(cellY - selectedY) < 2 / ROWS;

            return (
              <g key={`${col}-${row}`}>
                <rect
                  x={col * cellSize}
                  y={row * cellSize}
                  width={cellSize}
                  height={cellSize}
                  fill={isSelected ? 'rgba(59,130,246,0.5)' : fill}
                  stroke={isSelected ? '#93c5fd' : stroke}
                  strokeWidth={strokeW}
                  rx={2}
                />
                {isSelected && (
                  <circle
                    cx={col * cellSize + cellSize / 2}
                    cy={row * cellSize + cellSize / 2}
                    r={10}
                    fill="#3b82f6"
                    opacity={0.9}
                  />
                )}
              </g>
            );
          })
        )}

        {/* Zone labels */}
        <text x={width / 2} y={2.5 * cellSize + 2} textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.3)" fontSize={9}>
          Strike Zone
        </text>

        {/* Corner labels */}
        <text x={4} y={14} fill="rgba(100,116,139,0.6)" fontSize={9}>HI</text>
        <text x={4} y={height - 4} fill="rgba(100,116,139,0.6)" fontSize={9}>LO</text>
        <text x={width - 25} y={height / 2} fill="rgba(100,116,139,0.6)" fontSize={9}>OUT</text>
        <text x={2} y={height / 2} fill="rgba(100,116,139,0.6)" fontSize={9}>IN</text>
      </svg>
      <p className="text-center text-slate-500 text-xs mt-1">Tap location where pitch crossed the plate</p>
    </div>
  );
}
