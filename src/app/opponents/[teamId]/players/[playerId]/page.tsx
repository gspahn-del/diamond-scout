'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import type { OpponentPlayer, OpponentTeam, PlayerStats, SprayDot, PitchHeatMapDot, Tendencies, PlateAppearanceWithPitches } from '@/types';
import * as svc from '@/lib/services/db';
import { SprayChart } from '@/components/field/SprayChart';
import { StrikeZoneHeatMap } from '@/components/field/StrikeZoneHeatMap';
import { TendencySummary } from '@/components/players/TendencySummary';
import { AtBatLog } from '@/components/players/AtBatLog';
import { FieldZoneTable } from '@/components/field/FieldZoneTable';
import { formatAvg } from '@/lib/utils';

type Tab = 'overview' | 'spray' | 'pitches' | 'atbats';

export default function PlayerDetailPage({ params }: { params: Promise<{ teamId: string; playerId: string }> }) {
  const { teamId, playerId } = use(params);
  const [player, setPlayer] = useState<OpponentPlayer | null>(null);
  const [team, setTeam] = useState<OpponentTeam | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [sprayDots, setSprayDots] = useState<SprayDot[]>([]);
  const [pitchDots, setPitchDots] = useState<PitchHeatMapDot[]>([]);
  const [tendencies, setTendencies] = useState<Tendencies | null>(null);
  const [pas, setPas] = useState<PlateAppearanceWithPitches[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [pitchFilter, setPitchFilter] = useState<'all' | 'swings' | 'whiffs' | 'called_strikes' | 'in_play'>('all');
  const [hitTypeFilter, setHitTypeFilter] = useState<string>('all');
  const [hitResultFilter, setHitResultFilter] = useState<string>('all');
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');

  useEffect(() => {
    Promise.all([
      svc.getPlayer(Number(playerId)),
      svc.getOpponent(Number(teamId)),
      svc.getPlayerStats(Number(playerId)),
      svc.getPlayerSprayData(Number(playerId)),
      svc.getPlayerPitchData(Number(playerId)),
      svc.getPlayerTendencies(Number(playerId)),
    ]).then(([p, t, s, spray, pitches, tend]) => {
      setPlayer(p ?? null);
      setTeam(t ?? null);
      setStats(s);
      setSprayDots(spray);
      setPitchDots(pitches);
      setTendencies(tend);
      setNotesValue(p?.notes ?? '');
      setLoading(false);
    });
  }, [teamId, playerId]);

  // Fetch PAs for atbat log
  useEffect(() => {
    if (activeTab === 'atbats') {
      svc.getPlayerPAs(Number(playerId)).then((data) => {
        setPas(data);
      });
    }
  }, [activeTab, playerId]);

  async function saveNotes() {
    await svc.updatePlayer(Number(playerId), { ...player, notes: notesValue, throws: player?.throws });
    setPlayer((prev) => prev ? { ...prev, notes: notesValue } : prev);
    setEditingNotes(false);
  }

  const filteredSprayDots = sprayDots.filter((d) => {
    if (hitTypeFilter !== 'all' && d.hitType !== hitTypeFilter) return false;
    if (hitResultFilter !== 'all' && d.hitResult !== hitResultFilter) return false;
    return true;
  });

  if (loading) return <div className="text-slate-400 text-center py-16">Loading...</div>;
  if (!player) return <div className="text-red-400 text-center py-16">Player not found</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400 mb-6 no-print">
        <Link href="/opponents" className="hover:text-white">Opponents</Link>
        <span>/</span>
        <Link href={`/opponents/${teamId}`} className="hover:text-white">{team?.name}</Link>
        <span>/</span>
        <span className="text-white">{player.firstName} {player.lastName}</span>
      </div>

      {/* Player Header */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              {player.jerseyNumber && (
                <span className="text-4xl font-bold font-mono text-blue-400">#{player.jerseyNumber}</span>
              )}
              <h1 className="text-3xl font-bold text-white">
                {player.firstName} {player.lastName}
              </h1>
            </div>
            <div className="flex flex-wrap gap-3 mt-2">
              {player.primaryPosition && (
                <span className="px-2 py-0.5 bg-blue-600/20 text-blue-400 rounded text-sm">{player.primaryPosition}</span>
              )}
              <span className="text-slate-400 text-sm">
                Bats: <strong className="text-white">{player.bats}</strong>
              </span>
              <span className="text-slate-400 text-sm">
                Throws: <strong className="text-white">{player.throws}</strong>
              </span>
            </div>
          </div>

          {/* Print + Stat line */}
          <div className="flex flex-col items-end gap-2">
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm no-print"
          >
            🖨 Print
          </button>
          {stats && stats.pa > 0 && (
            <div className="flex gap-4 flex-shrink-0">
              {[
                { label: 'AVG', value: formatAvg(stats.avg), highlight: stats.avg >= 0.3 },
                { label: 'OBP', value: formatAvg(stats.obp) },
                { label: 'SLG', value: formatAvg(stats.slg) },
                { label: 'OPS', value: formatAvg(stats.ops), highlight: stats.ops >= 0.9 },
              ].map(({ label, value, highlight }) => (
                <div key={label} className="text-center">
                  <p className={`text-xl font-bold font-mono ${highlight ? 'text-green-400' : 'text-white'}`}>{value}</p>
                  <p className="text-slate-400 text-xs">{label}</p>
                </div>
              ))}
            </div>
          )}
          </div>
        </div>

        {/* Scouting notes */}
        <div className="mt-4 border-t border-slate-700 pt-4">
          {editingNotes ? (
            <div className="space-y-2">
              <textarea
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
                rows={3}
                placeholder="Scouting notes..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              />
              <div className="flex gap-2">
                <button onClick={saveNotes} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm">Save</button>
                <button onClick={() => setEditingNotes(false)} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <p className="text-slate-300 text-sm flex-1">{player.notes || <span className="text-slate-500">No scouting notes. Click to add...</span>}</p>
              <button onClick={() => setEditingNotes(true)} className="text-blue-400 text-xs hover:text-blue-300 shrink-0 no-print">Edit notes</button>
            </div>
          )}
        </div>
      </div>

      {/* Full stat line */}
      {stats && stats.pa > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-6 overflow-x-auto">
          <div className="flex gap-4 min-w-max">
            {[
              ['PA', stats.pa], ['AB', stats.ab], ['H', stats.h],
              ['2B', stats.doubles], ['3B', stats.triples], ['HR', stats.homeRuns],
              ['BB', stats.bb], ['K', stats.k], ['HBP', stats.hbp],
              ['RBI', stats.rbi],
            ].map(([label, value]) => (
              <div key={String(label)} className="text-center min-w-[40px]">
                <p className="text-white font-bold font-mono text-lg">{value}</p>
                <p className="text-slate-400 text-xs">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-800 rounded-lg p-1 border border-slate-700 no-print">
        {([
          { key: 'overview', label: 'Overview' },
          { key: 'spray', label: '🎯 Spray Chart' },
          { key: 'pitches', label: '🎳 Strike Zone' },
          { key: 'atbats', label: '📋 At-Bats' },
        ] as { key: Tab; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === key ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && tendencies && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="font-semibold text-white mb-4">Tendencies</h2>
          <TendencySummary tendencies={tendencies} />
        </div>
      )}

      {activeTab === 'spray' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 bg-slate-800 border border-slate-700 rounded-xl p-4 no-print">
            <div>
              <label className="text-slate-400 text-xs mb-1 block">Hit Type</label>
              <select
                value={hitTypeFilter}
                onChange={(e) => setHitTypeFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm"
              >
                <option value="all">All Types</option>
                <option value="ground_ball">Ground Ball</option>
                <option value="fly_ball">Fly Ball</option>
                <option value="line_drive">Line Drive</option>
                <option value="bunt">Bunt</option>
                <option value="popup">Popup</option>
              </select>
            </div>
            <div>
              <label className="text-slate-400 text-xs mb-1 block">Result</label>
              <select
                value={hitResultFilter}
                onChange={(e) => setHitResultFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm"
              >
                <option value="all">All Results</option>
                <option value="single">Singles</option>
                <option value="double">Doubles</option>
                <option value="triple">Triples</option>
                <option value="homerun">Home Runs</option>
                <option value="out">Outs</option>
              </select>
            </div>
            <div className="flex items-end text-slate-400 text-sm">
              {filteredSprayDots.length} batted balls
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <h3 className="font-semibold text-white mb-3">Spray Chart</h3>
              <SprayChart dots={filteredSprayDots} />
              {/* Legend */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
                {[
                  { color: '#22c55e', label: 'Single (●)' },
                  { color: '#3b82f6', label: 'Double (●)' },
                  { color: '#eab308', label: 'Triple (▲)' },
                  { color: '#ef4444', label: 'Home Run (◆)' },
                  { color: '#6b7280', label: 'Out (●)' },
                ].map(({ color, label }) => (
                  <span key={label} className="flex items-center gap-1 text-xs text-slate-400">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: color }} />
                    {label}
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <h3 className="font-semibold text-white mb-3">Zone Breakdown</h3>
              <FieldZoneTable balls={filteredSprayDots as any} />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'pitches' && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Strike Zone ({pitchDots.length} pitches)</h2>
            <div className="flex gap-2 no-print">
              {(['all', 'swings', 'whiffs', 'called_strikes', 'in_play'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setPitchFilter(f)}
                  className={`px-2 py-1 rounded text-xs ${pitchFilter === f ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                >
                  {f.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
          <div className="max-w-sm mx-auto">
            <StrikeZoneHeatMap pitches={pitchDots} filterType={pitchFilter} />
          </div>
        </div>
      )}

      {activeTab === 'atbats' && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="font-semibold text-white mb-4">At-Bat Log</h2>
          <AtBatLog pas={pas} />
          {pas.length === 0 && sprayDots.length > 0 && (
            <p className="text-slate-400 text-sm text-center">At-bat detail available from game tracking.</p>
          )}
        </div>
      )}
    </div>
  );
}
