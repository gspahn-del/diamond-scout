import type { Pitch } from '@/types';

interface Props {
  pitches: Pitch[];
}

function PitchBall({ pitch }: { pitch: Pitch }) {
  const colors: Record<string, string> = {
    ball: 'bg-blue-500 text-white',
    called_strike: 'bg-red-600 text-white',
    swinging_strike: 'bg-orange-500 text-white',
    foul: 'bg-yellow-500 text-black',
    foul_tip: 'bg-yellow-400 text-black',
    in_play: 'bg-green-500 text-white',
    hit_by_pitch: 'bg-purple-500 text-white',
    intentional_ball: 'bg-blue-300 text-white',
  };

  const labels: Record<string, string> = {
    ball: 'B', called_strike: 'S', swinging_strike: 'S',
    foul: 'F', foul_tip: 'T', in_play: '✓',
    hit_by_pitch: 'H', intentional_ball: 'I',
  };

  const pitchAbbr: Record<string, string> = {
    fastball: 'FB', curveball: 'CB', slider: 'SL', changeup: 'CH',
    cutter: 'CT', sinker: 'SI', splitter: 'SP', knuckleball: 'KN', other: '?',
  };

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className={`w-8 h-8 rounded-full ${colors[pitch.pitchResult] ?? 'bg-slate-600 text-white'} flex items-center justify-center text-xs font-bold`}>
        {labels[pitch.pitchResult] ?? '?'}
      </div>
      <span className="text-[9px] text-slate-500">{pitchAbbr[pitch.pitchType] ?? '?'}</span>
    </div>
  );
}

export function PitchSequence({ pitches }: Props) {
  if (pitches.length === 0) {
    return <p className="text-slate-600 text-xs text-center">No pitches yet</p>;
  }

  // Calculate count
  let balls = 0;
  let strikes = 0;
  for (const p of pitches) {
    if (p.pitchResult === 'ball' || p.pitchResult === 'intentional_ball') balls++;
    else if (p.pitchResult === 'called_strike' || p.pitchResult === 'swinging_strike') strikes++;
    else if ((p.pitchResult === 'foul' || p.pitchResult === 'foul_tip') && strikes < 2) strikes++;
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1 flex-wrap">
        {pitches.map((p) => <PitchBall key={p.id} pitch={p} />)}
      </div>
      <p className="text-slate-400 text-xs text-center font-mono">
        Count: <span className="text-blue-400">{balls}B</span> – <span className="text-red-400">{strikes}S</span> ({pitches.length} pitches)
      </p>
    </div>
  );
}
