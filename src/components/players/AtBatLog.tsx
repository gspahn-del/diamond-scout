import type { PlateAppearanceWithPitches } from '@/types';
import { formatShortDate, paResultLabel, pitchResultLabel, pitchTypeLabel } from '@/lib/utils';

interface Props {
  pas: PlateAppearanceWithPitches[];
}

function PitchDot({ result, type }: { result: string; type: string }) {
  const colors: Record<string, string> = {
    ball: 'bg-blue-500',
    called_strike: 'bg-red-500',
    swinging_strike: 'bg-orange-500',
    foul: 'bg-yellow-500',
    foul_tip: 'bg-yellow-400',
    in_play: 'bg-green-500',
    hit_by_pitch: 'bg-purple-500',
    intentional_ball: 'bg-blue-300',
  };
  const abbr: Record<string, string> = {
    ball: 'B', called_strike: 'CS', swinging_strike: 'SS',
    foul: 'F', foul_tip: 'FT', in_play: 'IP', hit_by_pitch: 'HBP', intentional_ball: 'IB',
  };
  return (
    <div
      className={`w-6 h-6 rounded-full ${colors[result] ?? 'bg-slate-600'} flex items-center justify-center`}
      title={`${pitchTypeLabel(type)} - ${pitchResultLabel(result)}`}
    >
      <span className="text-white text-[8px] font-bold">{abbr[result]}</span>
    </div>
  );
}

export function AtBatLog({ pas }: Props) {
  if (pas.length === 0) {
    return <p className="text-slate-400 text-sm text-center py-4">No at-bats recorded yet.</p>;
  }

  return (
    <div className="space-y-2">
      {pas.slice().reverse().map((pa) => (
        <div key={pa.id} className="bg-slate-900 rounded-lg p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-slate-400 text-xs">Inn. {pa.inning}</span>
                <span className="text-slate-400 text-xs">PA #{pa.paNumber}</span>
                {(pa as PlateAppearanceWithPitches & { gameDate?: string }).gameDate && <span className="text-slate-500 text-xs">{formatShortDate((pa as PlateAppearanceWithPitches & { gameDate?: string }).gameDate ?? null)}</span>}
              </div>
              {/* Pitch dots */}
              <div className="flex flex-wrap gap-1">
                {pa.pitches.map((pitch) => (
                  <PitchDot key={pitch.id} result={pitch.pitchResult} type={pitch.pitchType} />
                ))}
              </div>
            </div>
            <div className="text-right shrink-0">
              {pa.result && (
                <span className={`text-sm font-semibold font-mono ${
                  ['single', 'double', 'triple', 'homerun', 'walk', 'hbp'].includes(pa.result)
                    ? 'text-green-400'
                    : 'text-slate-400'
                }`}>
                  {paResultLabel(pa.result)}
                </span>
              )}
              <p className="text-slate-500 text-xs">{pa.pitchCount ?? 0} pitch{(pa.pitchCount ?? 0) !== 1 ? 'es' : ''}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
