'use client';

import { useState, useEffect } from 'react';
import type { MyTeam, Season } from '@/types';
import * as svc from '@/lib/services/db';

export default function MyTeamPage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [myTeams, setMyTeams] = useState<MyTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', seasonId: '' });

  useEffect(() => {
    Promise.all([
      svc.getSeasons(),
      svc.getMyTeams(),
    ]).then(([s, t]) => {
      setSeasons(s);
      setMyTeams(t);
      setLoading(false);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await svc.createMyTeam({ name: form.name, seasonId: form.seasonId ? Number(form.seasonId) : null });
    setShowForm(false);
    setForm({ name: '', seasonId: '' });
    setMyTeams(await svc.getMyTeams());
  }

  async function deleteTeam(id: number) {
    if (!confirm('Delete this team?')) return;
    await svc.deleteMyTeam(id);
    setMyTeams(await svc.getMyTeams());
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">My Team</h1>
          <p className="text-slate-400 text-sm mt-1">Your team name used in game records</p>
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
          <h2 className="font-semibold text-white">Add Team</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Team Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Thunder"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Season</label>
              <select
                value={form.seasonId}
                onChange={(e) => setForm({ ...form, seasonId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="">No season</option>
                {seasons.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">
              Save Team
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm">
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-slate-400 text-center py-8">Loading...</div>
      ) : myTeams.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center">
          <p className="text-slate-400">No teams yet. Add your team name to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {myTeams.map((team) => {
            const season = seasons.find((s) => s.id === team.seasonId);
            return (
              <div key={team.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white">{team.name}</h3>
                  <p className="text-slate-400 text-sm">{season?.name ?? 'No season'}</p>
                </div>
                <button
                  onClick={() => deleteTeam(team.id)}
                  className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg text-xs"
                >
                  Delete
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
