'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import * as svc from '@/lib/services/db';

interface GameRow {
  id: number;
  gameDate: string;
  myScore: number | null;
  opponentScore: number | null;
  status: string | null;
  homeAway: string | null;
  location: string | null;
  opponentTeamName: string | null;
  opponentTeamId: number | null;
}

export default function GamesPage() {
  const [games, setGames] = useState<GameRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    svc.getGames().then((data) => {
      setGames(data);
      setLoading(false);
    });
  }, []);

  async function deleteGame(id: number) {
    if (!confirm('Delete this game and all its data?')) return;
    await svc.deleteGame(id);
    setGames((prev) => prev.filter((g) => g.id !== id));
  }

  const upcoming = games.filter((g) => g.status === 'upcoming' || g.status === 'in_progress');
  const completed = games.filter((g) => g.status === 'completed');

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Games</h1>
        <Link href="/games/new" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
          + New Game
        </Link>
      </div>

      {loading ? (
        <div className="text-slate-400 text-center py-8">Loading...</div>
      ) : games.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center">
          <p className="text-slate-400 text-lg mb-3">No games yet</p>
          <Link href="/games/new" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">
            Track Your First Game
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-slate-400 text-xs uppercase tracking-wider mb-3">In Progress / Upcoming</h2>
              <div className="space-y-2">
                {upcoming.map((game) => (
                  <div key={game.id} className="bg-slate-800 border border-slate-700 rounded-xl flex items-center px-5 py-4">
                    <div className="flex-1">
                      <p className="text-white font-medium">{game.opponentTeamName ?? 'Unknown'}</p>
                      <p className="text-slate-400 text-sm">{formatDate(game.gameDate)} · {game.homeAway} {game.location ? `· ${game.location}` : ''}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {game.status === 'in_progress' && (
                        <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full">Live</span>
                      )}
                      <Link href={`/games/${game.id}`} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs">
                        Track →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {completed.length > 0 && (
            <div>
              <h2 className="text-slate-400 text-xs uppercase tracking-wider mb-3">Completed ({completed.length})</h2>
              <div className="bg-slate-800 border border-slate-700 rounded-xl divide-y divide-slate-700">
                {completed.map((game) => (
                  <div key={game.id} className="flex items-center px-5 py-3 group">
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">{game.opponentTeamName ?? 'Unknown'}</p>
                      <p className="text-slate-400 text-xs">{formatDate(game.gameDate)} · {game.homeAway}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-white text-sm">
                        {game.myScore ?? '?'} – {game.opponentScore ?? '?'}
                      </span>
                      <Link href={`/games/${game.id}/summary`} className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs">
                        Summary
                      </Link>
                      <button
                        onClick={() => deleteGame(game.id)}
                        className="opacity-0 group-hover:opacity-100 px-2 py-1 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded text-xs transition-opacity"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
