'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSeasons, getGames, getOpponents } from '@/lib/services/db';
import type { Season, OpponentTeam } from '@/types';
import { formatShortDate } from '@/lib/utils';

interface GameRow {
  id: number;
  gameDate: string;
  myScore: number | null;
  opponentScore: number | null;
  status: string | null;
  homeAway: string | null;
  opponentTeamName: string | null;
  opponentTeamId: number | null;
}

export default function DashboardPage() {
  const [activeSeason, setActiveSeason] = useState<Season | null>(null);
  const [recentGames, setRecentGames] = useState<GameRow[]>([]);
  const [opponents, setOpponents] = useState<OpponentTeam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [seasons, games, teams] = await Promise.all([
        getSeasons(),
        getGames(),
        getOpponents(),
      ]);
      const active = seasons.find((s) => s.isActive === 1) ?? null;
      setActiveSeason(active);
      const filtered = active ? games.filter((g) => g.seasonId === active.id) : games;
      setRecentGames(filtered.slice(0, 8) as GameRow[]);
      setOpponents(active ? teams.filter((t) => t.seasonId === active.id) : teams);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="text-slate-400 text-center py-16">Loading...</div>;

  const completedGames = recentGames.filter((g) => g.status === 'completed');
  const upcomingGames = recentGames.filter((g) => g.status === 'upcoming' || g.status === 'in_progress');

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">
            ⚾ Diamond<span className="text-blue-400">Scout</span>
          </h1>
          <p className="text-slate-400 mt-1">
            {activeSeason ? activeSeason.name : 'No active season'}
          </p>
        </div>
        <Link
          href="/games/new"
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
        >
          + New Game
        </Link>
      </div>

      {!activeSeason && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center mb-8">
          <p className="text-slate-400 text-lg mb-4">No active season found.</p>
          <Link href="/seasons" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
            Create a Season
          </Link>
        </div>
      )}

      {activeSeason && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Games Played', value: String(completedGames.length), color: 'text-green-400' },
            { label: 'Upcoming / Live', value: String(upcomingGames.length), color: 'text-blue-400' },
            { label: 'Opponents', value: String(opponents.length), color: 'text-purple-400' },
            { label: 'Season', value: activeSeason.name, color: 'text-yellow-400' },
          ].map((stat) => (
            <div key={stat.label} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold font-mono ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-slate-800 border border-slate-700 rounded-xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
            <h2 className="font-semibold text-white">Recent Games</h2>
            <Link href="/games" className="text-blue-400 text-sm hover:text-blue-300">View all →</Link>
          </div>
          <div className="divide-y divide-slate-700">
            {recentGames.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">No games recorded yet.</p>
            ) : (
              recentGames.slice(0, 6).map((game) => (
                <Link
                  key={game.id}
                  href={`/games/${game.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-slate-700 transition-colors"
                >
                  <div>
                    <p className="text-white text-sm font-medium">{game.opponentTeamName ?? 'Unknown'}</p>
                    <p className="text-slate-400 text-xs">{formatShortDate(game.gameDate)} · {game.homeAway}</p>
                  </div>
                  <div className="text-right">
                    {game.status === 'completed' ? (
                      <span className="font-mono text-sm text-white">{game.myScore ?? '?'} – {game.opponentScore ?? '?'}</span>
                    ) : game.status === 'in_progress' ? (
                      <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full">Live</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full">Upcoming</span>
                    )}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
            <h2 className="font-semibold text-white">Opponent Teams</h2>
            <Link href="/opponents" className="text-blue-400 text-sm hover:text-blue-300">Manage →</Link>
          </div>
          <div className="divide-y divide-slate-700">
            {opponents.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-slate-400 text-sm mb-3">No opponents added yet.</p>
                <Link href="/opponents" className="text-blue-400 text-sm hover:text-blue-300">Add an opponent →</Link>
              </div>
            ) : (
              opponents.map((team) => {
                const teamGames = recentGames.filter((g) => g.opponentTeamId === team.id);
                const wins = teamGames.filter((g) => g.status === 'completed' && (g.myScore ?? 0) > (g.opponentScore ?? 0)).length;
                const losses = teamGames.filter((g) => g.status === 'completed' && (g.myScore ?? 0) < (g.opponentScore ?? 0)).length;
                return (
                  <Link
                    key={team.id}
                    href={`/opponents/${team.id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-slate-700 transition-colors"
                  >
                    <div>
                      <p className="text-white text-sm font-medium">{team.name}</p>
                      <p className="text-slate-400 text-xs">{team.league ?? 'No league'}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400">{teamGames.length} games</span>
                      {teamGames.length > 0 && (
                        <p className="text-xs font-mono">
                          <span className="text-green-400">{wins}W</span>{' '}
                          <span className="text-red-400">{losses}L</span>
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
