'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { OpponentTeam, OpponentPlayer, Season, MyTeam } from '@/types';
import * as svc from '@/lib/services/db';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface LineupEntry {
  playerId: number;
  player: OpponentPlayer;
  position: string;
}

function SortablePlayer({ entry, index, onRemove, onPositionChange }: {
  entry: LineupEntry;
  index: number;
  onRemove: (id: number) => void;
  onPositionChange: (id: number, pos: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: entry.playerId });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 bg-slate-700 rounded-lg px-3 py-2"
    >
      <span className="text-slate-500 text-xs w-5 text-center">{index + 1}</span>
      <span {...attributes} {...listeners} className="cursor-grab text-slate-500 text-xs">⠿⠿</span>
      <span className="text-blue-400 font-mono text-sm">#{entry.player.jerseyNumber}</span>
      <span className="text-white text-sm flex-1">{entry.player.firstName} {entry.player.lastName}</span>
      <input
        type="text"
        value={entry.position}
        onChange={(e) => onPositionChange(entry.playerId, e.target.value)}
        placeholder={entry.player.primaryPosition ?? 'Pos'}
        className="w-14 px-2 py-1 bg-slate-800 border border-slate-600 rounded text-white text-xs text-center"
      />
      <button
        onClick={() => onRemove(entry.playerId)}
        className="text-red-400 hover:text-red-300 text-sm px-1"
      >
        ×
      </button>
    </div>
  );
}

export default function NewGamePage() {
  const router = useRouter();
  const [step, setStep] = useState<'details' | 'lineup'>('details');
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [myTeams, setMyTeams] = useState<MyTeam[]>([]);
  const [opponents, setOpponents] = useState<OpponentTeam[]>([]);
  const [form, setForm] = useState({
    seasonId: '', myTeamId: '', opponentTeamId: '',
    gameDate: new Date().toISOString().split('T')[0],
    location: '', homeAway: 'home',
  });
  const [opponentPlayers, setOpponentPlayers] = useState<OpponentPlayer[]>([]);
  const [lineup, setLineup] = useState<LineupEntry[]>([]);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    Promise.all([
      svc.getSeasons(),
      svc.getMyTeams(),
      svc.getOpponents(),
    ]).then(([s, t, o]) => {
      setSeasons(s);
      setMyTeams(t);
      setOpponents(o);
      const active = s.find((x: Season) => x.isActive === 1);
      if (active) setForm((f) => ({ ...f, seasonId: String(active.id) }));
      if (t.length > 0) setForm((f) => ({ ...f, myTeamId: String(t[0].id) }));
    });
  }, []);

  useEffect(() => {
    if (form.opponentTeamId) {
      svc.getOpponentPlayers(Number(form.opponentTeamId)).then((players) => {
        setOpponentPlayers(players);
        setLineup(players.map((p: OpponentPlayer) => ({
          playerId: p.id, player: p, position: p.primaryPosition ?? '',
        })));
      });
    }
  }, [form.opponentTeamId]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setLineup((items) => {
        const oldIndex = items.findIndex((i) => i.playerId === active.id);
        const newIndex = items.findIndex((i) => i.playerId === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  function addToLineup(player: OpponentPlayer) {
    if (!lineup.find((e) => e.playerId === player.id)) {
      setLineup([...lineup, { playerId: player.id, player, position: player.primaryPosition ?? '' }]);
    }
  }

  function removeFromLineup(playerId: number) {
    setLineup(lineup.filter((e) => e.playerId !== playerId));
  }

  function updatePosition(playerId: number, position: string) {
    setLineup(lineup.map((e) => e.playerId === playerId ? { ...e, position } : e));
  }

  async function handleStartGame() {
    setSaving(true);
    try {
      // Create game
      const game = await svc.createGame({
        seasonId: form.seasonId ? Number(form.seasonId) : null,
        myTeamId: form.myTeamId ? Number(form.myTeamId) : null,
        opponentTeamId: Number(form.opponentTeamId),
        gameDate: form.gameDate,
        location: form.location,
        homeAway: form.homeAway,
      });

      // Save lineup
      if (lineup.length > 0) {
        await svc.saveLineup(game.id, lineup.map((e, i) => ({
          playerId: e.playerId,
          battingOrder: i + 1,
          position: e.position,
        })));
      }

      router.push(`/games/${game.id}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">New Game</h1>

      {/* Step 1: Game Details */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-4">
        <h2 className="font-semibold text-white mb-4">Game Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Date *</label>
            <input
              type="date"
              value={form.gameDate}
              onChange={(e) => setForm({ ...form, gameDate: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Home / Away</label>
            <select
              value={form.homeAway}
              onChange={(e) => setForm({ ...form, homeAway: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="home">Home</option>
              <option value="away">Away</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Opponent *</label>
            <select
              value={form.opponentTeamId}
              onChange={(e) => setForm({ ...form, opponentTeamId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              required
            >
              <option value="">Select opponent...</option>
              {opponents.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Location</label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Riverfront Field"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">My Team</label>
            <select
              value={form.myTeamId}
              onChange={(e) => setForm({ ...form, myTeamId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">Select my team...</option>
              {myTeams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Season</label>
            <select
              value={form.seasonId}
              onChange={(e) => setForm({ ...form, seasonId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">No season</option>
              {seasons.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Step 2: Lineup */}
      {form.opponentTeamId && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-4">
          <h2 className="font-semibold text-white mb-4">Batting Lineup (drag to reorder)</h2>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={lineup.map((e) => e.playerId)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2 mb-4">
                {lineup.map((entry, i) => (
                  <SortablePlayer
                    key={entry.playerId}
                    entry={entry}
                    index={i}
                    onRemove={removeFromLineup}
                    onPositionChange={updatePosition}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {/* Players not in lineup */}
          {opponentPlayers.filter((p) => !lineup.find((e) => e.playerId === p.id)).length > 0 && (
            <div>
              <p className="text-slate-400 text-xs mb-2">Tap to add to lineup:</p>
              <div className="flex flex-wrap gap-2">
                {opponentPlayers
                  .filter((p) => !lineup.find((e) => e.playerId === p.id))
                  .map((p) => (
                    <button
                      key={p.id}
                      onClick={() => addToLineup(p)}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-lg"
                    >
                      #{p.jerseyNumber} {p.firstName} {p.lastName}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      <button
        onClick={handleStartGame}
        disabled={!form.opponentTeamId || !form.gameDate || saving}
        className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold text-lg rounded-xl disabled:opacity-40 transition-colors"
      >
        {saving ? 'Creating Game...' : '▶ Start Game Tracking'}
      </button>
    </div>
  );
}
