import type { Tendencies } from '@/types';

interface Props {
  tendencies: Tendencies;
}

function PctBar({ pct, color = 'bg-blue-500' }: { pct: number; color?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-slate-700 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${Math.min(pct * 100, 100)}%` }} />
      </div>
      <span className="text-slate-300 text-xs font-mono w-10 text-right">{(pct * 100).toFixed(0)}%</span>
    </div>
  );
}

export function TendencySummary({ tendencies }: Props) {
  const t = tendencies;
  if (t.totalBattedBalls === 0) {
    return <p className="text-slate-400 text-sm text-center py-4">No batted ball data yet.</p>;
  }

  return (
    <div className="space-y-6">
      {/* Direction */}
      <div>
        <h4 className="text-slate-400 text-xs uppercase tracking-wider mb-3">Hit Direction</h4>
        <div className="space-y-2">
          <div>
            <span className="text-slate-300 text-xs mb-1 block">Pull%</span>
            <PctBar pct={t.pullPct} color="bg-orange-500" />
          </div>
          <div>
            <span className="text-slate-300 text-xs mb-1 block">Center%</span>
            <PctBar pct={t.centerPct} color="bg-blue-500" />
          </div>
          <div>
            <span className="text-slate-300 text-xs mb-1 block">Oppo%</span>
            <PctBar pct={t.oppoPct} color="bg-green-500" />
          </div>
        </div>
      </div>

      {/* Hit Types */}
      <div>
        <h4 className="text-slate-400 text-xs uppercase tracking-wider mb-3">Hit Type ({t.totalBattedBalls} BIP)</h4>
        <div className="space-y-2">
          <div>
            <span className="text-slate-300 text-xs mb-1 block">GB%</span>
            <PctBar pct={t.gbPct} color="bg-amber-600" />
          </div>
          <div>
            <span className="text-slate-300 text-xs mb-1 block">FB%</span>
            <PctBar pct={t.fbPct} color="bg-sky-500" />
          </div>
          <div>
            <span className="text-slate-300 text-xs mb-1 block">LD%</span>
            <PctBar pct={t.ldPct} color="bg-yellow-500" />
          </div>
          {t.buntPct > 0 && (
            <div>
              <span className="text-slate-300 text-xs mb-1 block">Bunt%</span>
              <PctBar pct={t.buntPct} color="bg-purple-500" />
            </div>
          )}
        </div>
      </div>

      {/* Plate Discipline */}
      <div>
        <h4 className="text-slate-400 text-xs uppercase tracking-wider mb-3">Plate Discipline</h4>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Chase%', value: t.chaseRate, color: 'text-red-400' },
            { label: 'Whiff%', value: t.whiffRate, color: 'text-orange-400' },
            { label: '1st Pitch%', value: t.firstPitchSwingPct, color: 'text-blue-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-slate-900 rounded-lg p-3 text-center">
              <p className={`text-xl font-bold font-mono ${color}`}>
                {(value * 100).toFixed(0)}%
              </p>
              <p className="text-slate-400 text-xs mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Whiff by pitch type */}
      {Object.keys(t.whiffByPitchType).length > 0 && (
        <div>
          <h4 className="text-slate-400 text-xs uppercase tracking-wider mb-3">Whiff Rate by Pitch</h4>
          <div className="space-y-2">
            {Object.entries(t.whiffByPitchType).sort((a, b) => b[1] - a[1]).map(([type, rate]) => (
              <div key={type}>
                <span className="text-slate-300 text-xs mb-1 block capitalize">{type}</span>
                <PctBar pct={rate} color="bg-red-500" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
