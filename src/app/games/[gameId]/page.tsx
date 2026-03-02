'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { AtBatTracker } from '@/components/game/AtBatTracker';
import type { Game, OpponentTeam, GameLineup, OpponentPlayer } from '@/types';
import * as svc from '@/lib/services/db';

interface GameWithData extends Game {
  opponentTeam?: OpponentTeam;
  lineup: (GameLineup & { player: OpponentPlayer })[];
}

export default function GameTrackingPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = use(params);
  const [game, setGame] = useState<GameWithData | null>(null);
  const [loading, setLoading] = useState(true);
  const [myScore, setMyScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);

  useEffect(() => {
    svc.getGame(Number(gameId)).then((data) => {
      setGame(data as GameWithData | null);
      if (data) {
        setMyScore(data.myScore ?? 0);
        setOpponentScore(data.opponentScore ?? 0);
      }
      setLoading(false);
    });
  }, [gameId]);

  async function updateScore() {
    await svc.updateGame(Number(gameId), { myScore, opponentScore });
  }

  if (loading) return <div className="text-slate-400 text-center py-16">Loading game...</div>;
  if (!game) return <div className="text-red-400 text-center py-16">Game not found</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Link href="/games" className="text-slate-400 hover:text-white text-sm">← Games</Link>
        <h1 className="text-white font-semibold">vs {game.opponentTeam?.name ?? 'Unknown'}</h1>
        <Link
          href={`/games/${gameId}/summary`}
          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-lg"
        >
          Summary
        </Link>
      </div>

      {/* Score Editor */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-slate-400 text-sm">Us</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setMyScore((s) => Math.max(0, s - 1))} className="w-7 h-7 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm">-</button>
            <span className="text-white font-mono text-xl font-bold w-8 text-center">{myScore}</span>
            <button onClick={() => setMyScore((s) => s + 1)} className="w-7 h-7 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm">+</button>
          </div>
        </div>
        <span className="text-slate-500">—</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button onClick={() => setOpponentScore((s) => Math.max(0, s - 1))} className="w-7 h-7 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm">-</button>
            <span className="text-white font-mono text-xl font-bold w-8 text-center">{opponentScore}</span>
            <button onClick={() => setOpponentScore((s) => s + 1)} className="w-7 h-7 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm">+</button>
          </div>
          <span className="text-slate-400 text-sm">Opp</span>
        </div>
        <button onClick={updateScore} className="px-3 py-1 bg-blue-600/30 hover:bg-blue-600/50 text-blue-400 rounded text-xs">
          Save
        </button>
      </div>

      {game.lineup && game.lineup.length > 0 ? (
        <AtBatTracker
          gameId={Number(gameId)}
          initialLineup={game.lineup}
          myScore={myScore}
          opponentScore={opponentScore}
        />
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center">
          <p className="text-slate-400 mb-4">No lineup set for this game.</p>
          <Link
            href={`/games/new`}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
          >
            Set Up Lineup
          </Link>
        </div>
      )}
    </div>
  );
}
