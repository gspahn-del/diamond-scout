'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import type { OpponentTeam, OpponentPlayer } from '@/types';
import * as svc from '@/lib/services/db';

const POSITIONS = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];

interface TeamWithPlayers extends OpponentTeam {
  players: OpponentPlayer[];
}

export default function TeamDetailPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = use(params);
  const [team, setTeam] = useState<TeamWithPlayers | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPlayerForm, setShowPlayerForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<OpponentPlayer | null>(null);
  const [playerForm, setPlayerForm] = useState({
    firstName: '', lastName: '', jerseyNumber: '',
    bats: 'R', throws: 'R', primaryPosition: '', notes: '',
  });

  useEffect(() => {
    fetchTeam();
  }, [teamId]);

  async function fetchTeam() {
    const data = await svc.getOpponentWithPlayers(Number(teamId));
    setTeam(data);
    setLoading(false);
  }

  function openAddPlayer() {
    setEditingPlayer(null);
    setPlayerForm({ firstName: '', lastName: '', jerseyNumber: '', bats: 'R', throws: 'R', primaryPosition: '', notes: '' });
    setShowPlayerForm(true);
  }

  function openEditPlayer(player: OpponentPlayer) {
    setEditingPlayer(player);
    setPlayerForm({
      firstName: player.firstName,
      lastName: player.lastName,
      jerseyNumber: player.jerseyNumber ?? '',
      bats: player.bats ?? 'R',
      throws: player.throws ?? 'R',
      primaryPosition: player.primaryPosition ?? '',
      notes: player.notes ?? '',
    });
    setShowPlayerForm(true);
  }

  async function handlePlayerSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingPlayer) {
      await svc.updatePlayer(editingPlayer.id, { ...playerForm, throws: playerForm.throws });
    } else {
      await svc.createPlayer(Number(teamId), { ...playerForm, throws: playerForm.throws });
    }
    setShowPlayerForm(false);
    setEditingPlayer(null);
    fetchTeam();
  }

  async function deletePlayer(id: number, name: string) {
    if (!confirm(`Remove ${name} from the roster?`)) return;
    await svc.deletePlayer(id);
    fetchTeam();
  }

  if (loading) return <div className="text-slate-400 text-center py-16">Loading...</div>;
  if (!team) return <div className="text-red-400 text-center py-16">Team not found</div>;

  const sortedPlayers = [...team.players].sort((a, b) => {
    const n1 = parseInt(a.jerseyNumber ?? '99', 10);
    const n2 = parseInt(b.jerseyNumber ?? '99', 10);
    return n1 - n2;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
        <Link href="/opponents" className="hover:text-white">Opponents</Link>
        <span>/</span>
        <span className="text-white">{team.name}</span>
      </div>

      {/* Team Header */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">{team.name}</h1>
            {team.league && <p className="text-slate-400 mt-1">{team.league}</p>}
            {team.notes && <p className="text-slate-500 text-sm mt-2">{team.notes}</p>}
          </div>
          <div className="flex gap-2">
            <Link
              href={`/spray-charts?teamId=${teamId}`}
              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm"
            >
              🎯 Spray Chart
            </Link>
          </div>
        </div>
      </div>

      {/* Roster */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <h2 className="font-semibold text-white">Roster ({team.players.length} players)</h2>
          <button
            onClick={openAddPlayer}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
          >
            + Add Player
          </button>
        </div>

        {showPlayerForm && (
          <div className="border-b border-slate-700 p-5">
            <form onSubmit={handlePlayerSubmit} className="space-y-4">
              <h3 className="font-semibold text-white">{editingPlayer ? 'Edit Player' : 'Add Player'}</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">First Name *</label>
                  <input
                    type="text"
                    value={playerForm.firstName}
                    onChange={(e) => setPlayerForm({ ...playerForm, firstName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Last Name *</label>
                  <input
                    type="text"
                    value={playerForm.lastName}
                    onChange={(e) => setPlayerForm({ ...playerForm, lastName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">#</label>
                  <input
                    type="text"
                    value={playerForm.jerseyNumber}
                    onChange={(e) => setPlayerForm({ ...playerForm, jerseyNumber: e.target.value })}
                    placeholder="7"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Bats</label>
                  <select
                    value={playerForm.bats}
                    onChange={(e) => setPlayerForm({ ...playerForm, bats: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="R">R</option>
                    <option value="L">L</option>
                    <option value="S">S (Switch)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Throws</label>
                  <select
                    value={playerForm.throws}
                    onChange={(e) => setPlayerForm({ ...playerForm, throws: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="R">R</option>
                    <option value="L">L</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Position</label>
                  <select
                    value={playerForm.primaryPosition}
                    onChange={(e) => setPlayerForm({ ...playerForm, primaryPosition: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Unknown</option>
                    {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="col-span-2 md:col-span-3">
                  <label className="block text-sm text-slate-400 mb-1">Notes</label>
                  <input
                    type="text"
                    value={playerForm.notes}
                    onChange={(e) => setPlayerForm({ ...playerForm, notes: e.target.value })}
                    placeholder="Scouting notes..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">
                  {editingPlayer ? 'Save' : 'Add Player'}
                </button>
                <button type="button" onClick={() => setShowPlayerForm(false)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {sortedPlayers.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-slate-400">No players on roster yet.</p>
            <button onClick={openAddPlayer} className="mt-3 text-blue-400 text-sm hover:text-blue-300">
              Add the first player →
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 text-xs uppercase tracking-wider border-b border-slate-700">
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Pos</th>
                  <th className="px-4 py-3 text-left">B/T</th>
                  <th className="px-4 py-3 text-left">Notes</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {sortedPlayers.map((player) => (
                  <tr key={player.id} className="hover:bg-slate-700/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-white font-semibold">{player.jerseyNumber ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/opponents/${teamId}/players/${player.id}`}
                        className="text-white hover:text-blue-400 font-medium"
                      >
                        {player.firstName} {player.lastName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{player.primaryPosition ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-300 font-mono">{player.bats}/{player.throws}</td>
                    <td className="px-4 py-3 text-slate-400 max-w-xs truncate">{player.notes ?? '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <Link
                          href={`/opponents/${teamId}/players/${player.id}`}
                          className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded text-xs"
                        >
                          Scout
                        </Link>
                        <button
                          onClick={() => openEditPlayer(player)}
                          className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deletePlayer(player.id, `${player.firstName} ${player.lastName}`)}
                          className="px-2 py-1 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded text-xs"
                        >
                          ×
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
