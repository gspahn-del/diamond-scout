'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import type { Game, OpponentTeam, OpponentPlayer, PlateAppearance } from '@/types';
import * as svc from '@/lib/services/db';
import { formatDate, paResultLabel } from '@/lib/utils';

interface GameFull extends Game {
  opponentTeam?: OpponentTeam;
  lineup: { player: OpponentPlayer; battingOrder: number }[];
  plateAppearances: PlateAppearance[];
}

interface PlayerLine {
  player: OpponentPlayer;
  abs: number;
  hits: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  rbi: number;
  bb: number;
  k: number;
  pitches: number;
}

export default function GameSummaryPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = use(params);
  const [game, setGame] = useState<GameFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    svc.getGame(Number(gameId)).then((data) => {
      setGame(data as GameFull | null);
      setLoading(false);
    });
  }, [gameId]);

  async function completeGame() {
    setCompleting(true);
    await svc.updateGame(Number(gameId), { status: 'completed' });
    setGame((g) => g ? { ...g, status: 'completed' } : g);
    setCompleting(false);
  }

  if (loading) return <div className="text-slate-400 text-center py-16">Loading...</div>;
  if (!game) return <div className="text-red-400 text-center py-16">Game not found</div>;

  // Build per-player stats
  const playerLines: PlayerLine[] = (game.lineup ?? []).map(({ player }) => {
    const pas = game.plateAppearances.filter((pa) => pa.playerId === player.id);
    let abs = 0, hits = 0, doubles = 0, triples = 0, homeRuns = 0, rbi = 0, bb = 0, k = 0;

    for (const pa of pas) {
      const r = pa.result;
      if (!r) continue;
      if (!['walk', 'hbp', 'sac_fly', 'sac_bunt'].includes(r)) abs++;
      if (['single', 'double', 'triple', 'homerun'].includes(r)) hits++;
      if (r === 'double') doubles++;
      if (r === 'triple') triples++;
      if (r === 'homerun') homeRuns++;
      if (r === 'walk') bb++;
      if (r === 'strikeout_swinging' || r === 'strikeout_looking') k++;
      if (pa.resultDetail) {
        try { const d = JSON.parse(pa.resultDetail); rbi += d.rbi ?? 0; } catch {}
      }
    }

    const lastPa = pas[pas.length - 1];
    return { player, abs, hits, doubles, triples, homeRuns, rbi, bb, k, pitches: lastPa?.pitchCount ?? 0 };
  });

  const totalPitches = game.plateAppearances.reduce((sum, pa) => sum + (pa.pitchCount ?? 0), 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/games/${gameId}`} className="text-slate-400 hover:text-white text-sm no-print">← Tracking</Link>
        <h1 className="text-xl font-bold text-white flex-1">Game Summary</h1>
        <button
          onClick={() => window.print()}
          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm no-print"
        >
          🖨 Print
        </button>
        {game.status !== 'completed' && (
          <button
            onClick={completeGame}
            disabled={completing}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium no-print"
          >
            ✓ Complete Game
          </button>
        )}
        {game.status === 'completed' && (
          <span className="px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-xs">Completed</span>
        )}
      </div>

      {/* Game header */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-xl">vs {game.opponentTeam?.name ?? 'Opponent'}</h2>
            <p className="text-slate-400 text-sm">{formatDate(game.gameDate)} · {game.homeAway} · {game.location}</p>
          </div>
          <div className="text-center">
            <p className="text-white font-mono text-4xl font-bold">
              {game.myScore ?? '?'} – {game.opponentScore ?? '?'}
            </p>
            <p className="text-slate-400 text-xs">Us – Them</p>
          </div>
        </div>
      </div>

      {/* Box score */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl mb-6">
        <div className="px-5 py-3 border-b border-slate-700">
          <h2 className="font-semibold text-white">Opponent Box Score ({game.plateAppearances.length} PA, {totalPitches} pitches)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 text-xs uppercase tracking-wider border-b border-slate-700">
                <th className="px-4 py-2 text-left">#</th>
                <th className="px-4 py-2 text-left">Player</th>
                <th className="px-4 py-2 text-center">AB</th>
                <th className="px-4 py-2 text-center">H</th>
                <th className="px-4 py-2 text-center">2B</th>
                <th className="px-4 py-2 text-center">3B</th>
                <th className="px-4 py-2 text-center">HR</th>
                <th className="px-4 py-2 text-center">RBI</th>
                <th className="px-4 py-2 text-center">BB</th>
                <th className="px-4 py-2 text-center">K</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {playerLines.map(({ player, abs, hits, doubles, triples, homeRuns, rbi, bb, k }) => (
                <tr key={player.id} className="hover:bg-slate-700/30">
                  <td className="px-4 py-2 text-blue-400 font-mono">{player.jerseyNumber}</td>
                  <td className="px-4 py-2 text-white">{player.firstName} {player.lastName}</td>
                  <td className="px-4 py-2 text-center font-mono text-slate-300">{abs}</td>
                  <td className="px-4 py-2 text-center font-mono text-green-400">{hits}</td>
                  <td className="px-4 py-2 text-center font-mono text-blue-400">{doubles || '—'}</td>
                  <td className="px-4 py-2 text-center font-mono text-yellow-400">{triples || '—'}</td>
                  <td className="px-4 py-2 text-center font-mono text-red-400">{homeRuns || '—'}</td>
                  <td className="px-4 py-2 text-center font-mono text-white">{rbi}</td>
                  <td className="px-4 py-2 text-center font-mono text-slate-400">{bb || '—'}</td>
                  <td className="px-4 py-2 text-center font-mono text-orange-400">{k || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* At-bat results list */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl">
        <div className="px-5 py-3 border-b border-slate-700">
          <h2 className="font-semibold text-white">At-Bat Results</h2>
        </div>
        <div className="divide-y divide-slate-700/50">
          {game.plateAppearances.map((pa) => {
            const player = game.lineup?.find((l) => l.player?.id === pa.playerId)?.player;
            return (
              <div key={pa.id} className="px-5 py-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 text-xs w-12">Inn {pa.inning}</span>
                  <span className="text-slate-400 text-sm">
                    {player ? `${player.jerseyNumber} ${player.firstName} ${player.lastName}` : `Player #${pa.playerId}`}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 text-xs">{pa.pitchCount} pitches</span>
                  {pa.result && (
                    <span className={`text-sm font-mono ${
                      ['single', 'double', 'triple', 'homerun', 'walk', 'hbp'].includes(pa.result)
                        ? 'text-green-400' : 'text-slate-400'
                    }`}>
                      {paResultLabel(pa.result)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          {game.plateAppearances.length === 0 && (
            <p className="text-slate-400 text-sm text-center py-6">No plate appearances recorded.</p>
          )}
        </div>
      </div>
    </div>
  );
}
