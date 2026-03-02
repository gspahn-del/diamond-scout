/**
 * Spray Chart Export Utility
 * Renders the baseball field + stats panel to a Canvas, then exports as PNG or PDF.
 */
import type { SprayDot } from '@/types';
import { HIT_RESULT_COLORS } from '@/lib/field/colors';
import { sprayToSvg, SVG_WIDTH, SVG_HEIGHT } from '@/lib/field/coordinates';

// ─── Canvas layout ─────────────────────────────────────────────────────────────
const HEADER_H = 56;
const STATS_W  = 280;
const PANEL_H  = 450; // stats panel is taller than field to fit all data
const CANVAS_W = SVG_WIDTH + STATS_W; // 680
const CANVAS_H = HEADER_H + PANEL_H;  // 506

// ─── Field constants (mirrors SprayChart.tsx) ──────────────────────────────────
const CX          = 200;
const CY          = 355;
const FOUL        = Math.PI / 4;
const CENTER_DIST = 340;
const WARN_DIST   = CENTER_DIST + 15;
const BASE_DIST   = 60;
// Arc angles in canvas screen space (y-down, clockwise)
const FIELD_START = Math.PI + FOUL;       // 225° → up-left
const FIELD_END   = 2 * Math.PI - FOUL;  // 315° → up-right

// ─── Field drawing ─────────────────────────────────────────────────────────────
function drawField(ctx: CanvasRenderingContext2D, ox: number, oy: number) {
  // Background
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(ox, oy, SVG_WIDTH, SVG_HEIGHT);

  // Warning-track sector (slightly larger, drawn first so grass overlaps)
  ctx.beginPath();
  ctx.moveTo(ox + CX, oy + CY);
  ctx.arc(ox + CX, oy + CY, WARN_DIST, FIELD_START, FIELD_END, false);
  ctx.closePath();
  ctx.fillStyle = '#92400e';
  ctx.fill();

  // Outfield grass sector
  const grassGrad = ctx.createRadialGradient(
    ox + CX, oy + CY - SVG_HEIGHT * 0.3, 0,
    ox + CX, oy + CY,                    CENTER_DIST,
  );
  grassGrad.addColorStop(0, '#16a34a');
  grassGrad.addColorStop(1, '#14532d');
  ctx.beginPath();
  ctx.moveTo(ox + CX, oy + CY);
  ctx.arc(ox + CX, oy + CY, CENTER_DIST, FIELD_START, FIELD_END, false);
  ctx.closePath();
  ctx.fillStyle = grassGrad;
  ctx.fill();

  // Infield dirt circle
  const dirtGrad = ctx.createRadialGradient(
    ox + CX, oy + CY - BASE_DIST, 0,
    ox + CX, oy + CY - BASE_DIST, 95,
  );
  dirtGrad.addColorStop(0, '#a16207');
  dirtGrad.addColorStop(1, '#92400e');
  ctx.beginPath();
  ctx.arc(ox + CX, oy + CY - BASE_DIST, 95, 0, Math.PI * 2);
  ctx.fillStyle = dirtGrad;
  ctx.fill();

  // Infield grass (diamond)
  ctx.beginPath();
  ctx.moveTo(ox + CX + BASE_DIST, oy + CY - BASE_DIST);  // 1B
  ctx.lineTo(ox + CX,             oy + CY - BASE_DIST * 2); // 2B
  ctx.lineTo(ox + CX - BASE_DIST, oy + CY - BASE_DIST);  // 3B
  ctx.lineTo(ox + CX,             oy + CY);               // HP
  ctx.closePath();
  ctx.fillStyle = '#16a34a';
  ctx.fill();

  // Foul lines
  const lx = ox + CX + CENTER_DIST * Math.cos(FIELD_START);
  const ly = oy + CY + CENTER_DIST * Math.sin(FIELD_START);
  const rx = ox + CX + CENTER_DIST * Math.cos(FIELD_END);
  const ry = oy + CY + CENTER_DIST * Math.sin(FIELD_END);
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(ox + CX, oy + CY); ctx.lineTo(lx, ly); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ox + CX, oy + CY); ctx.lineTo(rx, ry); ctx.stroke();

  // Outfield wall arc
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(ox + CX, oy + CY, CENTER_DIST, FIELD_START, FIELD_END, false);
  ctx.stroke();

  // Warning track arc
  ctx.strokeStyle = 'rgba(217,119,6,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(ox + CX, oy + CY, WARN_DIST, FIELD_START, FIELD_END, false);
  ctx.stroke();

  // Base paths
  const bases: [number, number][] = [
    [CX + BASE_DIST, CY - BASE_DIST],
    [CX,             CY - BASE_DIST * 2],
    [CX - BASE_DIST, CY - BASE_DIST],
    [CX,             CY],
  ];
  ctx.strokeStyle = 'rgba(217,119,6,0.6)';
  ctx.lineWidth = 1;
  for (let i = 0; i < bases.length; i++) {
    const [ax, ay] = bases[i];
    const [bx2, by2] = bases[(i + 1) % bases.length];
    ctx.beginPath();
    ctx.moveTo(ox + ax, oy + ay);
    ctx.lineTo(ox + bx2, oy + by2);
    ctx.stroke();
  }

  // Bases (white squares rotated 45°)
  for (let i = 0; i < 3; i++) {
    const [bx2, by2] = bases[i];
    ctx.save();
    ctx.translate(ox + bx2, oy + by2);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = 'white';
    ctx.fillRect(-5, -5, 10, 10);
    ctx.restore();
  }

  // Home plate
  ctx.beginPath();
  ctx.moveTo(ox + CX,     oy + CY - 8);
  ctx.lineTo(ox + CX + 7, oy + CY - 4);
  ctx.lineTo(ox + CX + 7, oy + CY + 3);
  ctx.lineTo(ox + CX - 7, oy + CY + 3);
  ctx.lineTo(ox + CX - 7, oy + CY - 4);
  ctx.closePath();
  ctx.fillStyle = 'white';
  ctx.fill();

  // Pitcher's mound
  ctx.beginPath();
  ctx.arc(ox + CX, oy + CY - 60, 8, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(161,98,7,0.8)';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(ox + CX, oy + CY - 60, 2, 0, Math.PI * 2);
  ctx.fillStyle = '#d97706';
  ctx.fill();

  // Field labels
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '11px system-ui,sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const labels = [
    { t: 'LF', x: CX - 140, y: CY - 180 },
    { t: 'CF', x: CX,       y: CY - 230 },
    { t: 'RF', x: CX + 140, y: CY - 180 },
    { t: 'SS', x: CX - 55,  y: CY - 95  },
    { t: '2B', x: CX + 35,  y: CY - 100 },
    { t: '3B', x: CX - 100, y: CY - 50  },
    { t: '1B', x: CX + 90,  y: CY - 50  },
  ];
  for (const { t, x, y } of labels) ctx.fillText(t, ox + x, oy + y);
}

// ─── Dot drawing ───────────────────────────────────────────────────────────────
type CanvasShape = 'circle' | 'small-circle' | 'triangle' | 'diamond' | 'square';
const HIT_TYPE_CANVAS_SHAPE: Record<string, CanvasShape> = {
  ground_ball: 'circle',
  fly_ball:    'triangle',
  line_drive:  'diamond',
  bunt:        'square',
  popup:       'small-circle',
};

function drawDots(ctx: CanvasRenderingContext2D, dots: SprayDot[], ox: number, oy: number) {
  const R = 6;
  for (const dot of dots) {
    if (dot.sprayX == null || dot.sprayY == null) continue;
    const [svgX, svgY] = sprayToSvg(dot.sprayX, dot.sprayY);
    const x     = ox + svgX;
    const y     = oy + svgY;
    const color = HIT_RESULT_COLORS[dot.hitResult] ?? '#9ca3af';
    const shape = HIT_TYPE_CANVAS_SHAPE[dot.hitType] ?? 'circle';

    ctx.globalAlpha = 0.85;
    ctx.fillStyle    = color;
    ctx.strokeStyle  = 'rgba(0,0,0,0.5)';
    ctx.lineWidth    = 0.5;
    ctx.beginPath();
    switch (shape) {
      case 'circle':
        ctx.arc(x, y, R, 0, Math.PI * 2);
        break;
      case 'small-circle':
        ctx.arc(x, y, R * 0.6, 0, Math.PI * 2);
        break;
      case 'triangle': {
        const h = R * 1.5;
        ctx.moveTo(x, y - h);
        ctx.lineTo(x + R * 1.2, y + R * 0.7);
        ctx.lineTo(x - R * 1.2, y + R * 0.7);
        break;
      }
      case 'diamond':
        ctx.moveTo(x,           y - R * 1.3);
        ctx.lineTo(x + R * 1.1, y);
        ctx.lineTo(x,           y + R * 1.3);
        ctx.lineTo(x - R * 1.1, y);
        break;
      case 'square':
        ctx.rect(x - R, y - R, R * 2, R * 2);
        break;
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// ─── Stats panel ───────────────────────────────────────────────────────────────
function drawStatsPanel(
  ctx: CanvasRenderingContext2D,
  dots: SprayDot[],
  x: number, y: number, w: number, h: number,
  title: string,
) {
  // Background + left border
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#334155';
  ctx.fillRect(x, y, 1, h);

  const PAD = 14;
  const BAR_W = w - PAD * 2 - 28; // space for count on right
  let py = y + PAD;

  // ── Chart title ──────────────────────────────────────────────────────────────
  ctx.fillStyle = '#f1f5f9';
  ctx.font = 'bold 13px system-ui,sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(title, x + PAD, py);
  py += 18;

  ctx.fillStyle = '#64748b';
  ctx.font = '11px system-ui,sans-serif';
  ctx.fillText(`${dots.length} batted balls`, x + PAD, py);
  py += 20;

  // ── Section helper ───────────────────────────────────────────────────────────
  function separator() {
    ctx.fillStyle = '#334155';
    ctx.fillRect(x + PAD, py, w - PAD * 2, 1);
    py += 10;
  }

  function sectionHeader(label: string) {
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 9px system-ui,sans-serif';
    ctx.letterSpacing = '0.05em';
    ctx.textAlign = 'left';
    ctx.fillText(label, x + PAD, py);
    py += 14;
  }

  function barRow(label: string, count: number, total: number, color: string) {
    const barFill = total > 0 ? Math.round((count / total) * BAR_W) : 0;
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px system-ui,sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(label, x + PAD, py);
    ctx.fillStyle = '#475569';
    ctx.font = '10px system-ui,sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(String(count), x + w - 8, py);
    py += 12;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x + PAD, py, BAR_W, 5);
    if (barFill > 0) {
      ctx.fillStyle = color;
      ctx.fillRect(x + PAD, py, barFill, 5);
    }
    py += 9;
  }

  // ── Hit Types ────────────────────────────────────────────────────────────────
  separator();
  sectionHeader('HIT TYPES');

  const htCounts: Record<string, number> = {};
  for (const d of dots) htCounts[d.hitType] = (htCounts[d.hitType] || 0) + 1;
  const htTotal = Math.max(...Object.values(htCounts), 1);

  const hitTypes = [
    { key: 'ground_ball', color: '#22c55e', label: 'Ground Ball' },
    { key: 'fly_ball',    color: '#3b82f6', label: 'Fly Ball'    },
    { key: 'line_drive',  color: '#ef4444', label: 'Line Drive'  },
    { key: 'bunt',        color: '#eab308', label: 'Bunt'        },
    { key: 'popup',       color: '#a855f7', label: 'Popup'       },
  ];
  for (const { key, color, label } of hitTypes) {
    barRow(label, htCounts[key] || 0, htTotal, color);
  }

  // ── Hit Results ──────────────────────────────────────────────────────────────
  separator();
  sectionHeader('HIT RESULTS');

  const hrCounts: Record<string, number> = {};
  for (const d of dots) hrCounts[d.hitResult] = (hrCounts[d.hitResult] || 0) + 1;

  const hitResults = [
    { key: 'single',          color: '#22c55e', label: 'Single'       },
    { key: 'double',          color: '#3b82f6', label: 'Double'       },
    { key: 'triple',          color: '#eab308', label: 'Triple'       },
    { key: 'homerun',         color: '#ef4444', label: 'Home Run'     },
    { key: 'out',             color: '#6b7280', label: 'Out'          },
    { key: 'double_play',     color: '#6b7280', label: 'Dbl Play'     },
    { key: 'error',           color: '#f97316', label: 'Error'        },
    { key: 'sacrifice',       color: '#a855f7', label: 'Sacrifice'    },
    { key: 'fielders_choice', color: '#f97316', label: "F's Choice"   },
  ];

  // 2-column dot layout
  const colW = Math.floor((w - PAD * 2) / 2);
  let col = 0;
  for (const { key, color, label } of hitResults) {
    const count = hrCounts[key] || 0;
    const colX = x + PAD + col * colW;
    ctx.beginPath();
    ctx.arc(colX + 5, py + 5, 4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '10px system-ui,sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${label}: ${count}`, colX + 13, py);
    col++;
    if (col >= 2) { col = 0; py += 17; }
  }
  if (col === 1) py += 17;

  // ── Pitch Types in Play ───────────────────────────────────────────────────────
  separator();
  sectionHeader('PITCH PUT IN PLAY');

  const ptCounts: Record<string, number> = {};
  for (const d of dots) {
    if (d.pitchType) ptCounts[d.pitchType] = (ptCounts[d.pitchType] || 0) + 1;
  }
  const pitchTypes = [
    { key: 'fastball',    color: '#ef4444', label: 'Fastball'    },
    { key: 'curveball',   color: '#3b82f6', label: 'Curveball'   },
    { key: 'slider',      color: '#22c55e', label: 'Slider'      },
    { key: 'changeup',    color: '#f97316', label: 'Changeup'    },
    { key: 'sinker',      color: '#14b8a6', label: 'Sinker'      },
    { key: 'cutter',      color: '#eab308', label: 'Cutter'      },
    { key: 'splitter',    color: '#f43f5e', label: 'Splitter'    },
    { key: 'knuckleball', color: '#a855f7', label: 'Knuckleball' },
    { key: 'other',       color: '#9ca3af', label: 'Other'       },
  ].filter(({ key }) => (ptCounts[key] || 0) > 0);

  if (pitchTypes.length === 0) {
    ctx.fillStyle = '#475569';
    ctx.font = '10px system-ui,sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('No pitch data recorded', x + PAD, py);
  } else {
    const ptTotal = Math.max(...pitchTypes.map(({ key }) => ptCounts[key] || 0), 1);
    for (const { key, color, label } of pitchTypes) {
      barRow(label, ptCounts[key] || 0, ptTotal, color);
    }
  }
}

// ─── Canvas builder (shared by PNG + PDF) ──────────────────────────────────────
function buildCanvas(dots: SprayDot[], title: string, scale = 1): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width  = Math.round(CANVAS_W * scale);
  canvas.height = Math.round(CANVAS_H * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);

  // Full background
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // ── Header ────────────────────────────────────────────────────────────────────
  ctx.fillStyle = '#f1f5f9';
  ctx.font = 'bold 16px system-ui,sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('⚾ DiamondScout – Spray Chart Export', 14, HEADER_H / 2);

  ctx.fillStyle = '#64748b';
  ctx.font = '11px system-ui,sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }), CANVAS_W - 14, HEADER_H / 2);

  ctx.fillStyle = '#334155';
  ctx.fillRect(0, HEADER_H - 1, CANVAS_W, 1);

  // ── Field ─────────────────────────────────────────────────────────────────────
  drawField(ctx, 0, HEADER_H);
  drawDots(ctx, dots, 0, HEADER_H);

  // ── Stats panel ───────────────────────────────────────────────────────────────
  drawStatsPanel(ctx, dots, SVG_WIDTH, HEADER_H, STATS_W, PANEL_H, title);

  return canvas;
}

// ─── Public exports ────────────────────────────────────────────────────────────
export function exportSprayChartPNG(dots: SprayDot[], title: string): void {
  const canvas = buildCanvas(dots, title, 2); // 2× for retina quality
  const safe   = title.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  const link   = document.createElement('a');
  link.download = `spray-chart-${safe}.png`;
  link.href     = canvas.toDataURL('image/png');
  link.click();
}

export async function exportSprayChartPDF(dots: SprayDot[], title: string): Promise<void> {
  const canvas = buildCanvas(dots, title, 2);
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [CANVAS_W, CANVAS_H],
    hotfixes: ['px_scaling'],
  });
  pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, CANVAS_W, CANVAS_H);
  const safe = title.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  pdf.save(`spray-chart-${safe}.pdf`);
}
