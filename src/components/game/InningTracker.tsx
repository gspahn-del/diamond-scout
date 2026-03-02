interface Props {
  inning: number;
  halfInning: 'top' | 'bottom';
  outs: number;
  myScore?: number;
  opponentScore?: number;
}

export function InningTracker({ inning, halfInning, outs, myScore, opponentScore }: Props) {
  return (
    <div className="bg-slate-900 rounded-xl px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="text-center">
          <p className="text-slate-400 text-xs">Inning</p>
          <p className="text-white text-2xl font-bold font-mono">
            {halfInning === 'top' ? '▲' : '▼'}{inning}
          </p>
        </div>
        <div className="w-px h-10 bg-slate-700" />
        <div className="text-center">
          <p className="text-slate-400 text-xs mb-1">Outs</p>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full border-2 ${
                  i < outs
                    ? 'bg-red-500 border-red-500'
                    : 'bg-transparent border-slate-600'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {(myScore !== undefined || opponentScore !== undefined) && (
        <div className="text-right">
          <p className="text-slate-400 text-xs">Score</p>
          <p className="text-white font-mono text-xl font-bold">
            {myScore ?? 0}–{opponentScore ?? 0}
          </p>
        </div>
      )}
    </div>
  );
}
