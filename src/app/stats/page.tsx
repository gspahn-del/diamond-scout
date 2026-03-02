'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import * as svc from '@/lib/services/db';

const PITCH_COLORS: Record<string, string> = {
  fastball: '#ef4444', curveball: '#3b82f6', slider: '#22c55e',
  changeup: '#f97316', cutter: '#eab308', sinker: '#14b8a6',
  splitter: '#f43f5e', knuckleball: '#a855f7', other: '#9ca3af',
};

const HIT_COLORS: Record<string, string> = {
  ground_ball: '#a16207', fly_ball: '#0ea5e9', line_drive: '#eab308',
  bunt: '#a855f7', popup: '#64748b',
};

interface Overview {
  season: { name: string; year: number } | null;
  gamesPlayed: number;
  gamesUpcoming: number;
  totalPitches: number;
  totalBattedBalls: number;
  totalPAs: number;
  pitchTypeCounts: Record<string, number>;
  hitTypeCounts: Record<string, number>;
  recentGames: {
    id: number; gameDate: string; myScore: number | null; opponentScore: number | null;
    status: string | null; opponentTeamName: string | null;
  }[];
}

export default function StatsPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    svc.getStatsOverview().then((data) => {
      setOverview(data as Overview);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-slate-400 text-center py-16">Loading analytics...</div>;
  if (!overview) return <div className="text-red-400 text-center py-8">Failed to load stats</div>;

  const pitchData = Object.entries(overview.pitchTypeCounts)
    .map(([type, count]) => ({ name: type.charAt(0).toUpperCase() + type.slice(1), count, color: PITCH_COLORS[type] ?? '#9ca3af' }))
    .sort((a, b) => b.count - a.count);

  const hitTypeData = Object.entries(overview.hitTypeCounts)
    .map(([type, count]) => ({
      name: type.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      value: count,
      color: HIT_COLORS[type] ?? '#6b7280',
    }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">Analytics</h1>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Season', value: overview.season?.name ?? 'N/A', color: 'text-blue-400' },
          { label: 'Games Scouted', value: String(overview.gamesPlayed), color: 'text-green-400' },
          { label: 'Pitches Tracked', value: String(overview.totalPitches), color: 'text-purple-400' },
          { label: 'Batted Balls', value: String(overview.totalBattedBalls), color: 'text-yellow-400' },
        ].map((s) => (
          <div key={s.label} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">{s.label}</p>
            <p className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Pitch type distribution */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h2 className="font-semibold text-white mb-4">Pitch Types Seen</h2>
          {pitchData.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">No pitch data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={pitchData} layout="vertical">
                <XAxis type="number" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis type="category" dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} width={80} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                  labelStyle={{ color: '#f8fafc' }}
                  itemStyle={{ color: '#94a3b8' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                  {pitchData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Hit type distribution */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h2 className="font-semibold text-white mb-4">Hit Type Distribution</h2>
          {hitTypeData.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">No batted ball data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={hitTypeData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  label={false}
                  labelLine={false}
                >
                  {hitTypeData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                  itemStyle={{ color: '#94a3b8' }}
                />
                <Legend
                  formatter={(value) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent game results */}
      {overview.recentGames.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl">
          <div className="px-5 py-4 border-b border-slate-700">
            <h2 className="font-semibold text-white">Recent Game Results</h2>
          </div>
          <div className="divide-y divide-slate-700/50">
            {overview.recentGames.map((game) => (
              <div key={game.id} className="flex items-center justify-between px-5 py-3">
                <span className="text-white text-sm">{game.opponentTeamName ?? 'Unknown'}</span>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 text-xs">{game.gameDate}</span>
                  {game.status === 'completed' && (
                    <span className="font-mono text-white text-sm">
                      {game.myScore ?? '?'} – {game.opponentScore ?? '?'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
