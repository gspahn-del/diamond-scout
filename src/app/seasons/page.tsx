'use client';

import { useState, useEffect } from 'react';
import type { Season } from '@/types';
import { formatDate } from '@/lib/utils';
import * as svc from '@/lib/services/db';

export default function SeasonsPage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSeason, setEditingSeason] = useState<Season | null>(null);
  const [form, setForm] = useState({ name: '', year: new Date().getFullYear(), startDate: '', endDate: '' });

  useEffect(() => {
    fetchSeasons();
  }, []);

  async function fetchSeasons() {
    const data = await svc.getSeasons();
    setSeasons(data);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingSeason) {
      await svc.updateSeason(editingSeason.id, form);
    } else {
      await svc.createSeason(form);
    }
    setShowForm(false);
    setEditingSeason(null);
    setForm({ name: '', year: new Date().getFullYear(), startDate: '', endDate: '' });
    fetchSeasons();
  }

  async function setActive(id: number) {
    await svc.setActiveSeason(id);
    fetchSeasons();
  }

  async function deleteSeason(id: number) {
    if (!confirm('Delete this season? This will NOT delete games or teams.')) return;
    await svc.deleteSeason(id);
    fetchSeasons();
  }

  function openEdit(season: Season) {
    setEditingSeason(season);
    setForm({
      name: season.name,
      year: season.year,
      startDate: season.startDate ?? '',
      endDate: season.endDate ?? '',
    });
    setShowForm(true);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Seasons</h1>
        <button
          onClick={() => { setShowForm(!showForm); setEditingSeason(null); setForm({ name: '', year: new Date().getFullYear(), startDate: '', endDate: '' }); }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
        >
          + New Season
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-800 border border-slate-700 rounded-xl p-5 mb-6 space-y-4">
          <h2 className="font-semibold text-white">{editingSeason ? 'Edit Season' : 'New Season'}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Season Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Spring 2025"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Year</label>
              <input
                type="number"
                value={form.year}
                onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Start Date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">End Date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">
              {editingSeason ? 'Save Changes' : 'Create Season'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setEditingSeason(null); }}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-slate-400 text-center py-8">Loading...</div>
      ) : seasons.length === 0 ? (
        <div className="text-slate-400 text-center py-12">No seasons yet. Create your first season!</div>
      ) : (
        <div className="space-y-3">
          {seasons.map((season) => (
            <div key={season.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-white">{season.name}</h3>
                  {season.isActive === 1 && (
                    <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full">Active</span>
                  )}
                </div>
                <p className="text-slate-400 text-sm">
                  {season.year}
                  {season.startDate && ` · ${formatDate(season.startDate)}`}
                  {season.endDate && ` – ${formatDate(season.endDate)}`}
                </p>
              </div>
              <div className="flex gap-2">
                {season.isActive !== 1 && (
                  <button
                    onClick={() => setActive(season.id)}
                    className="px-3 py-1.5 bg-green-600/20 hover:bg-green-600/40 text-green-400 rounded-lg text-xs"
                  >
                    Set Active
                  </button>
                )}
                <button
                  onClick={() => openEdit(season)}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteSeason(season.id)}
                  className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg text-xs"
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
