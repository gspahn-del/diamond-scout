'use client';

import { useState, useEffect } from 'react';
import type { OpponentTeam, OpponentPlayer, SprayDot } from '@/types';
import { SprayChart } from '@/components/field/SprayChart';
import { FieldZoneTable } from '@/components/field/FieldZoneTable';
import * as svc from '@/lib/services/db';

export default function SprayChartsPage() {
  const [teams, setTeams] = useState<OpponentTeam[]>([]);
  const [players, setPlayers] = useState<OpponentPlayer[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedPlayer1, setSelectedPlayer1] = useState<string>('');
  const [selectedPlayer2, setSelectedPlayer2] = useState<string>('');
  const [mode, setMode] = useState<'team' | 'player' | 'compare'>('team');
  const [teamDots, setTeamDots] = useState<SprayDot[]>([]);
  const [player1Dots, setPlayer1Dots] = useState<SprayDot[]>([]);
  const [player2Dots, setPlayer2Dots] = useState<SprayDot[]>([]);
  const [hitTypeFilter, setHitTypeFilter] = useState('all');
  const [hitResultFilter, setHitResultFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    svc.getOpponents().then(setTeams);
  }, []);

  useEffect(() => {
    if (selectedTeam) {
      svc.getOpponentPlayers(Number(selectedTeam)).then(setPlayers);
      svc.getTeamSprayData(Number(selectedTeam)).then((data) => {
        setTeamDots(data);
      });
    }
  }, [selectedTeam]);

  useEffect(() => {
    if (selectedPlayer1) {
      svc.getPlayerSprayData(Number(selectedPlayer1)).then(setPlayer1Dots);
    }
  }, [selectedPlayer1]);

  useEffect(() => {
    if (selectedPlayer2) {
      svc.getPlayerSprayData(Number(selectedPlayer2)).then(setPlayer2Dots);
    }
  }, [selectedPlayer2]);

  function filterDots(dots: SprayDot[]) {
    return dots.filter((d) => {
      if (hitTypeFilter !== 'all' && d.hitType !== hitTypeFilter) return false;
      if (hitResultFilter !== 'all' && d.hitResult !== hitResultFilter) return false;
      return true;
    });
  }

  const filteredTeamDots = filterDots(teamDots);
  const filteredPlayer1Dots = filterDots(player1Dots);
  const filteredPlayer2Dots = filterDots(player2Dots);

  const player1 = players.find((p) => String(p.id) === selectedPlayer1);
  const player2 = players.find((p) => String(p.id) === selectedPlayer2);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">🎯 Spray Chart Analysis</h1>

      {/* Controls */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Team</label>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm"
            >
              <option value="">Select team...</option>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Hit Type</label>
            <select
              value={hitTypeFilter}
              onChange={(e) => setHitTypeFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm"
            >
              <option value="all">All Types</option>
              <option value="ground_ball">Ground Ball</option>
              <option value="fly_ball">Fly Ball</option>
              <option value="line_drive">Line Drive</option>
              <option value="bunt">Bunt</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Result</label>
            <select
              value={hitResultFilter}
              onChange={(e) => setHitResultFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm"
            >
              <option value="all">All Results</option>
              <option value="single">Singles</option>
              <option value="double">Doubles</option>
              <option value="triple">Triples</option>
              <option value="homerun">Home Runs</option>
              <option value="out">Outs</option>
              <option value="error">Errors</option>
            </select>
          </div>
          <div className="flex items-end">
            <div className="flex gap-1 w-full">
              {(['team', 'player', 'compare'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${mode === m ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                >
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {(mode === 'player' || mode === 'compare') && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Player 1</label>
              <select
                value={selectedPlayer1}
                onChange={(e) => setSelectedPlayer1(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm"
              >
                <option value="">Select player...</option>
                {players.map((p) => <option key={p.id} value={p.id}>#{p.jerseyNumber} {p.firstName} {p.lastName}</option>)}
              </select>
            </div>
            {mode === 'compare' && (
              <div>
                <label className="block text-sm text-slate-400 mb-1">Player 2</label>
                <select
                  value={selectedPlayer2}
                  onChange={(e) => setSelectedPlayer2(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm"
                >
                  <option value="">Select player...</option>
                  {players.map((p) => <option key={p.id} value={p.id}>#{p.jerseyNumber} {p.firstName} {p.lastName}</option>)}
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Charts */}
      {mode === 'team' && selectedTeam && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
            <h2 className="font-semibold text-white mb-3">
              Team Spray Chart ({filteredTeamDots.length} batted balls)
            </h2>
            <SprayChart dots={filteredTeamDots} />
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
            <h2 className="font-semibold text-white mb-3">Zone Breakdown</h2>
            <FieldZoneTable balls={filteredTeamDots as any} />
          </div>
        </div>
      )}

      {mode === 'player' && selectedPlayer1 && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
            <h2 className="font-semibold text-white mb-3">
              {player1?.firstName} {player1?.lastName} ({filteredPlayer1Dots.length} BIP)
            </h2>
            <SprayChart dots={filteredPlayer1Dots} />
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
            <h2 className="font-semibold text-white mb-3">Zone Breakdown</h2>
            <FieldZoneTable balls={filteredPlayer1Dots as any} />
          </div>
        </div>
      )}

      {mode === 'compare' && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
            <h2 className="font-semibold text-white mb-3">
              {player1 ? `${player1.firstName} ${player1.lastName}` : 'Player 1'} ({filteredPlayer1Dots.length} BIP)
            </h2>
            <SprayChart dots={filteredPlayer1Dots} />
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
            <h2 className="font-semibold text-white mb-3">
              {player2 ? `${player2.firstName} ${player2.lastName}` : 'Player 2'} ({filteredPlayer2Dots.length} BIP)
            </h2>
            <SprayChart dots={filteredPlayer2Dots} />
          </div>
        </div>
      )}

      {!selectedTeam && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center">
          <p className="text-slate-400 text-lg">Select a team to view spray charts</p>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 bg-slate-800 border border-slate-700 rounded-xl p-4">
        <h3 className="text-white text-sm font-semibold mb-3">Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs text-slate-400">
          {[
            { color: '#22c55e', label: '● Single (Ground/Circle)' },
            { color: '#3b82f6', label: '● Double' },
            { color: '#eab308', label: '▲ Triple (Fly ball)' },
            { color: '#ef4444', label: '◆ Home Run (Line drive)' },
            { color: '#6b7280', label: '■ Out (Bunt)' },
          ].map(({ color, label }) => (
            <span key={label} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full shrink-0" style={{ background: color }} />
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
