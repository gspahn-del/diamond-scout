'use client';

import { numberToPosition } from '@/lib/utils';

interface Props {
  sequence: number[];
  onAdd: (pos: number) => void;
  onClear: () => void;
  onConfirm: () => void;
  label?: string;
}

const POSITIONS = [
  { num: 1, abbr: 'P', name: 'Pitcher' },
  { num: 2, abbr: 'C', name: 'Catcher' },
  { num: 3, abbr: '1B', name: 'First Base' },
  { num: 4, abbr: '2B', name: 'Second Base' },
  { num: 5, abbr: '3B', name: 'Third Base' },
  { num: 6, abbr: 'SS', name: 'Shortstop' },
  { num: 7, abbr: 'LF', name: 'Left Field' },
  { num: 8, abbr: 'CF', name: 'Center Field' },
  { num: 9, abbr: 'RF', name: 'Right Field' },
];

export function PositionSelector({ sequence, onAdd, onClear, onConfirm, label = 'Select fielding sequence' }: Props) {
  const sequenceStr = sequence.map((n) => `${n}-${numberToPosition(n)}`).join(' → ');

  return (
    <div className="space-y-4">
      <div>
        <p className="text-slate-400 text-sm mb-2">{label}</p>
        <div className="bg-slate-900 rounded-lg px-4 py-3 min-h-[48px] flex items-center">
          {sequence.length === 0 ? (
            <span className="text-slate-600 text-sm">Tap positions in order (e.g., 6→3 for 6-3 groundout)</span>
          ) : (
            <span className="text-white font-mono text-lg font-bold">
              {sequence.join('-')}
              <span className="text-slate-400 text-sm ml-2">({sequenceStr})</span>
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {POSITIONS.map(({ num, abbr, name }) => (
          <button
            key={num}
            onClick={() => onAdd(num)}
            title={name}
            className="flex flex-col items-center py-3 bg-slate-700 hover:bg-slate-600 active:bg-blue-700 rounded-xl transition-colors"
          >
            <span className="text-blue-400 text-xl font-bold font-mono">{num}</span>
            <span className="text-white text-sm font-medium">{abbr}</span>
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={onClear}
          disabled={sequence.length === 0}
          className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl disabled:opacity-40 text-sm font-medium"
        >
          ← Clear
        </button>
        <button
          onClick={onConfirm}
          disabled={sequence.length === 0}
          className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl disabled:opacity-40 text-sm font-medium"
        >
          Confirm {sequence.join('-')}
        </button>
      </div>
    </div>
  );
}
