'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { OpponentTeam, Season } from '@/types';
import * as svc from '@/lib/services/db';

export default function OpponentsPage() {
  const [teams, setTeams] = useState<OpponentTeam[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', league: '', notes: '' });

  useEffect(() => {
    Promise.all([
      svc.getOpponents(),
      svc.getSeasons(),
    ]).then(([t, s]) => {
      setTeams(t);
      setSeasons(s);
      setLoading(false);
    });
  }, []);

  const activeSeason = seasons.find((s) => s.isActive === 1);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await svc.createOpponent({ ...form, seasonId: activeSeason?.id ?? null });
    setShowForm(false);
    setForm({ name: '', league: '', notes: '' });
    setTeams(await svc.getOpponents());
  }

  async function deleteTeam(id: number, name: string) {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
    await svc.deleteOpponent(id);
    setTeams((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Opponent Teams</h1>
          <p className="text-slate-400 text-sm mt-1">
            {activeSeason ? activeSeason.name : 'All seasons'}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
        >
          + Add Team
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-800 border border-slate-700 rounded-xl p-5 mb-6 space-y-4">
          <h2 className="font-semibold text-white">Add Opponent Team</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Team Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Riverside Hawks"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">League / Division</label>
              <input
                type="text"
                value={form.league}
                onChange={(e) => setForm({ ...form, league: e.target.value })}
                placeholder="Section 4A"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-slate-400 mb-1">Scouting Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="General notes on this team..."
                rows={2}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">
              Add Team
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm">
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-slate-400 text-center py-8">Loading...</div>
      ) : teams.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center">
          <div className="text-5xl mb-4">⚾</div>
          <p className="text-slate-400 text-lg mb-2">No opponent teams yet</p>
          <p className="text-slate-500 text-sm">Add your first opponent to start scouting</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <div key={team.id} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden hover:border-blue-500 transition-colors group">
              <Link href={`/opponents/${team.id}`} className="block p-5">
                <h3 className="text-white font-semibold text-lg group-hover:text-blue-400 transition-colors">{team.name}</h3>
                {team.league && <p className="text-slate-400 text-sm mt-0.5">{team.league}</p>}
                {team.notes && (
                  <p className="text-slate-500 text-xs mt-2 line-clamp-2">{team.notes}</p>
                )}
              </Link>
              <div className="px-5 py-3 border-t border-slate-700 flex items-center justify-between">
                <Link
                  href={`/opponents/${team.id}`}
                  className="text-blue-400 text-xs hover:text-blue-300"
                >
                  View Roster →
                </Link>
                <button
                  onClick={() => deleteTeam(team.id, team.name)}
                  className="text-red-400 text-xs hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
