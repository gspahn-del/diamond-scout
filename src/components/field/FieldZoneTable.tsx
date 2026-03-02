import type { BattedBall } from '@/types';
import { fieldZoneStats } from '@/lib/stats/calculations';
import { formatAvg } from '@/lib/utils';

interface Props {
  balls: BattedBall[];
}

export function FieldZoneTable({ balls }: Props) {
  const stats = fieldZoneStats(balls).filter((z) => z.abs > 0);

  if (stats.length === 0) {
    return <p className="text-slate-400 text-sm text-center py-4">No batted ball data yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-slate-400 text-xs uppercase tracking-wider border-b border-slate-700">
            <th className="px-4 py-2 text-left">Location</th>
            <th className="px-4 py-2 text-center">AB</th>
            <th className="px-4 py-2 text-center">H</th>
            <th className="px-4 py-2 text-center">2B</th>
            <th className="px-4 py-2 text-center">3B</th>
            <th className="px-4 py-2 text-center">HR</th>
            <th className="px-4 py-2 text-center">Outs</th>
            <th className="px-4 py-2 text-center">AVG</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/50">
          {stats.map((row) => (
            <tr key={row.location} className="hover:bg-slate-700/30">
              <td className="px-4 py-2 font-medium text-white">{row.label}</td>
              <td className="px-4 py-2 text-center font-mono text-slate-300">{row.abs}</td>
              <td className="px-4 py-2 text-center font-mono text-green-400">{row.hits}</td>
              <td className="px-4 py-2 text-center font-mono text-blue-400">{row.doubles}</td>
              <td className="px-4 py-2 text-center font-mono text-yellow-400">{row.triples}</td>
              <td className="px-4 py-2 text-center font-mono text-red-400">{row.homeRuns}</td>
              <td className="px-4 py-2 text-center font-mono text-slate-400">{row.outs}</td>
              <td className="px-4 py-2 text-center font-mono text-white font-semibold">{formatAvg(row.avg)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
