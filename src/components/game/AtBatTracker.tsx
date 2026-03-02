'use client';

import { useState, useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { StrikeZone } from '@/components/field/StrikeZone';
import { BattedBallInput } from '@/components/game/BattedBallInput';
import { PitchSequence } from '@/components/game/PitchSequence';
import { InningTracker } from '@/components/game/InningTracker';
import type { GameLineup, OpponentPlayer, Pitch, FieldLocation, HitType, HitResult } from '@/types';
import { calculateCountFromPitches } from '@/lib/stats/calculations';
import { pitchTypeLabel, pitchResultLabel } from '@/lib/utils';
import * as svc from '@/lib/services/db';

const PITCH_TYPES = [
  { value: 'fastball', label: 'Fastball', short: 'FB', color: 'bg-red-700 hover:bg-red-800' },
  { value: 'curveball', label: 'Curveball', short: 'CB', color: 'bg-blue-700 hover:bg-blue-800' },
  { value: 'slider', label: 'Slider', short: 'SL', color: 'bg-green-700 hover:bg-green-800' },
  { value: 'changeup', label: 'Changeup', short: 'CH', color: 'bg-orange-700 hover:bg-orange-800' },
  { value: 'cutter', label: 'Cutter', short: 'CT', color: 'bg-yellow-700 hover:bg-yellow-800' },
  { value: 'sinker', label: 'Sinker', short: 'SI', color: 'bg-teal-700 hover:bg-teal-800' },
  { value: 'splitter', label: 'Splitter', short: 'SP', color: 'bg-pink-700 hover:bg-pink-800' },
  { value: 'knuckleball', label: 'Knuckleball', short: 'KN', color: 'bg-purple-700 hover:bg-purple-800' },
  { value: 'other', label: 'Other', short: '?', color: 'bg-slate-600 hover:bg-slate-500' },
];

const PITCH_RESULTS = [
  { value: 'ball', label: 'Ball', color: 'bg-blue-600 hover:bg-blue-700' },
  { value: 'called_strike', label: 'Called Strike', color: 'bg-red-600 hover:bg-red-700' },
  { value: 'swinging_strike', label: 'Swinging Strike', color: 'bg-orange-600 hover:bg-orange-700' },
  { value: 'foul', label: 'Foul', color: 'bg-yellow-600 hover:bg-yellow-700' },
  { value: 'foul_tip', label: 'Foul Tip', color: 'bg-yellow-500 hover:bg-yellow-600' },
  { value: 'in_play', label: 'In Play', color: 'bg-green-600 hover:bg-green-700' },
  { value: 'hit_by_pitch', label: 'HBP', color: 'bg-purple-600 hover:bg-purple-700' },
  { value: 'intentional_ball', label: 'Int. Ball', color: 'bg-blue-400 hover:bg-blue-500' },
];

const PA_RESULTS_FOR_RESULT: Record<string, string> = {
  ball_4: 'walk',
  intentional_ball_4: 'walk',
  called_strike_3: 'strikeout_looking',
  swinging_strike_3: 'strikeout_swinging',
  hit_by_pitch: 'hbp',
};

interface Props {
  gameId: number;
  initialLineup: (GameLineup & { player: OpponentPlayer })[];
  myScore?: number;
  opponentScore?: number;
}

export function AtBatTracker({ gameId, initialLineup, myScore, opponentScore }: Props) {
  const store = useGameStore();

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showWalkConfirm, setShowWalkConfirm] = useState(false);
  const [showKConfirm, setShowKConfirm] = useState(false);
  const [kType, setKType] = useState<'looking' | 'swinging'>('swinging');

  useEffect(() => {
    if (store.gameId !== gameId) {
      store.initGame(gameId, initialLineup);
    }
  }, [gameId]);

  const currentBatter = store.lineup[store.currentBatterIndex];
  const { balls, strikes } = calculateCountFromPitches(store.currentPitches);

  async function ensurePA(): Promise<number> {
    if (store.currentPAId) return store.currentPAId;

    if (!currentBatter) throw new Error('No batter');

    const pa = await svc.createPA({
      gameId,
      playerId: currentBatter.playerId,
      inning: store.currentInning,
      paNumber: Date.now(), // unique PA number
    });
    store.setCurrentPAId(pa.id);
    store.addUndo({ type: 'plate_appearance', plateAppearanceId: pa.id });
    return pa.id;
  }

  async function handlePitchLocation(x: number, y: number) {
    store.setPendingLocation(x, y);
    store.setStep('pitch_type');
  }

  async function handlePitchType(type: string) {
    store.setPendingPitchType(type);
    store.setStep('pitch_result');
  }

  async function handlePitchResult(result: string) {
    store.setPendingPitchResult(result);

    // Immediately save pitch
    setSaving(true);
    try {
      const paId = await ensurePA();

      const savedPitch = await svc.createPitch({
        gameId,
        plateAppearanceId: paId,
        batterId: currentBatter?.playerId,
        sequenceNumber: store.currentPitches.length + 1,
        pitchType: store.pendingPitchType as import('@/types').PitchType,
        pitchResult: result as import('@/types').PitchResult,
        locationX: store.pendingLocationX,
        locationY: store.pendingLocationY,
      });
      store.addPitch(savedPitch);
      store.addUndo({ type: 'pitch', pitchId: savedPitch.id });

      // Recalculate count with new pitch
      const newPitches = [...store.currentPitches, savedPitch];
      const newCount = calculateCountFromPitches(newPitches);

      // Check for auto-events
      if (result === 'in_play') {
        store.setStep('batted_ball');
      } else if (result === 'hit_by_pitch') {
        await completePa('hbp', paId, false);
      } else if (newCount.balls >= 4 && result !== 'in_play') {
        setShowWalkConfirm(true);
        store.setStep('pitch_location');
      } else if (newCount.strikes >= 3) {
        setKType(result === 'called_strike' ? 'looking' : 'swinging');
        setShowKConfirm(true);
        store.setStep('pitch_location');
      } else {
        store.clearPendingPitch();
        store.setStep('pitch_location');
      }
    } catch (err) {
      console.error('Pitch save error:', err);
      setMessage('Error: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving(false);
    }
  }

  async function handleBattedBall(data: {
    sprayX: number; sprayY: number; fieldLocation: FieldLocation;
    hitType: HitType; hitResult: HitResult; outByPositions: number[]; rbiCount: number;
  }) {
    setSaving(true);
    try {
      const paId = store.currentPAId ?? await ensurePA();

      // Save batted ball
      await svc.createBattedBall({
        gameId,
        plateAppearanceId: paId,
        batterId: currentBatter?.playerId,
        hitType: data.hitType,
        hitResult: data.hitResult,
        fieldLocation: data.fieldLocation,
        sprayX: data.sprayX,
        sprayY: data.sprayY,
        outByPositions: data.outByPositions ? JSON.stringify(data.outByPositions) : null,
        rbiCount: data.rbiCount,
      });

      // Map to PA result
      let paResult: string = data.hitResult;
      if (data.hitResult === 'out' || data.hitResult === 'double_play') {
        if (data.hitType === 'fly_ball' || data.hitType === 'popup') paResult = 'fly_out';
        else if (data.hitType === 'ground_ball') paResult = data.hitResult === 'double_play' ? 'double_play' : 'ground_out';
        else if (data.hitType === 'line_drive') paResult = 'line_out';
      } else if (data.hitResult === 'sacrifice') {
        paResult = data.hitType === 'bunt' ? 'sac_bunt' : 'sac_fly';
      }

      const isOut = ['out', 'double_play', 'sacrifice', 'error'].includes(data.hitResult) ||
        ['fly_out', 'ground_out', 'line_out', 'sac_fly', 'sac_bunt'].includes(paResult);
      const outCount = data.hitResult === 'double_play' ? 2 : isOut ? 1 : 0;

      await completePa(paResult, paId, isOut, outCount > 1);
    } finally {
      setSaving(false);
    }
  }

  async function completePa(result: string, paId: number, isOut: boolean, doublePlay = false) {
    // Update PA result
    await svc.updatePA(paId, { result, pitchCount: store.currentPitches.length });

    store.clearPendingPitch();

    // Handle outs
    const outsToAdd = doublePlay ? 2 : isOut ? 1 : 0;
    if (outsToAdd === 2 && store.outs + 1 >= 3) {
      // First out ends inning, second out in next
      store.advanceBatter(true);
    } else {
      for (let i = 0; i < outsToAdd; i++) {
        store.advanceBatter(true);
      }
      if (outsToAdd === 0) store.advanceBatter(false);
    }

    setMessage(`✓ ${result.replace(/_/g, ' ').toUpperCase()} recorded`);
    setTimeout(() => setMessage(''), 2000);
  }

  async function handleWalkConfirm() {
    const paId = store.currentPAId ?? await ensurePA();
    await completePa('walk', paId, false);
    setShowWalkConfirm(false);
  }

  async function handleKConfirm() {
    const paId = store.currentPAId ?? await ensurePA();
    await completePa(kType === 'looking' ? 'strikeout_looking' : 'strikeout_swinging', paId, true);
    setShowKConfirm(false);
  }

  async function undoLastPitch() {
    const lastAction = store.popUndo();
    if (!lastAction) return;

    if (lastAction.type === 'pitch' && lastAction.pitchId) {
      await svc.deletePitch(lastAction.pitchId);
      store.removePitchFromCurrent(lastAction.pitchId);
      store.setStep('pitch_location');
      setMessage('Pitch undone');
    } else if (lastAction.type === 'plate_appearance' && lastAction.plateAppearanceId) {
      if (!confirm('Undo entire at-bat? This removes all pitches for this PA.')) {
        store.addUndo(lastAction); // put it back
        return;
      }
      await svc.deletePA(lastAction.plateAppearanceId);
      store.setCurrentPAId(null);
      store.setStep('pitch_location');
      // Back up batter
      const prevIndex = (store.currentBatterIndex - 1 + store.lineup.length) % store.lineup.length;
      setMessage('At-bat undone');
    }
    setTimeout(() => setMessage(''), 2000);
  }

  if (!currentBatter) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-400">No lineup set. Please set up the lineup first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Inning / Score */}
      <InningTracker
        inning={store.currentInning}
        halfInning={store.currentHalfInning}
        outs={store.outs}
        myScore={myScore}
        opponentScore={opponentScore}
      />

      {/* Current batter */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl px-5 py-4">
        <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">At Bat</p>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-blue-400 font-mono text-2xl font-bold mr-2">
              #{currentBatter.player?.jerseyNumber ?? '?'}
            </span>
            <span className="text-white text-xl font-semibold">
              {currentBatter.player?.firstName} {currentBatter.player?.lastName}
            </span>
          </div>
          <div className="text-right">
            <p className="text-slate-400 text-xs">{currentBatter.player?.primaryPosition}</p>
            <p className="text-white font-mono text-xl font-bold">{balls}-{strikes}</p>
            <p className="text-slate-500 text-xs">{balls}B-{strikes}S count</p>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className="bg-green-900/50 border border-green-700 text-green-400 text-sm text-center py-2 rounded-lg">
          {message}
        </div>
      )}

      {/* Walk confirm dialog */}
      {showWalkConfirm && (
        <div className="bg-blue-900/50 border border-blue-600 rounded-xl p-4 text-center space-y-3">
          <p className="text-blue-300 font-semibold">⚾ 4 Balls — Walk?</p>
          <div className="flex gap-3">
            <button onClick={handleWalkConfirm} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
              Yes, Walk
            </button>
            <button onClick={() => setShowWalkConfirm(false)} className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Strikeout confirm */}
      {showKConfirm && (
        <div className="bg-red-900/50 border border-red-600 rounded-xl p-4 text-center space-y-3">
          <p className="text-red-300 font-semibold">⚡ 3 Strikes — Strikeout?</p>
          <div className="flex gap-2 justify-center mb-2">
            <button
              onClick={() => setKType('swinging')}
              className={`px-3 py-1.5 rounded-lg text-sm ${kType === 'swinging' ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-300'}`}
            >
              Swinging
            </button>
            <button
              onClick={() => setKType('looking')}
              className={`px-3 py-1.5 rounded-lg text-sm ${kType === 'looking' ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-300'}`}
            >
              Looking
            </button>
          </div>
          <div className="flex gap-3">
            <button onClick={handleKConfirm} className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium">
              Yes, K
            </button>
            <button onClick={() => setShowKConfirm(false)} className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Main input area */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        {store.currentStep === 'pitch_location' && (
          <div>
            <h3 className="text-white font-semibold text-center mb-3">Pitch Location</h3>
            <StrikeZone
              onLocationSelect={handlePitchLocation}
              selectedX={store.pendingLocationX}
              selectedY={store.pendingLocationY}
            />
          </div>
        )}

        {store.currentStep === 'pitch_type' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold">Pitch Type</h3>
              <button onClick={() => store.setStep('pitch_location')} className="text-slate-400 text-sm hover:text-white">← Back</button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {PITCH_TYPES.map(({ value, label, short, color }) => (
                <button
                  key={value}
                  onClick={() => handlePitchType(value)}
                  className={`${color} text-white py-3 rounded-xl text-center transition-colors`}
                >
                  <span className="block text-lg font-bold">{short}</span>
                  <span className="block text-xs">{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {store.currentStep === 'pitch_result' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold">Result — {pitchTypeLabel(store.pendingPitchType ?? '')}</h3>
              <button onClick={() => store.setStep('pitch_type')} className="text-slate-400 text-sm hover:text-white">← Back</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {PITCH_RESULTS.map(({ value, label, color }) => (
                <button
                  key={value}
                  onClick={() => handlePitchResult(value)}
                  disabled={saving}
                  className={`${color} text-white py-4 rounded-xl text-sm font-medium transition-colors disabled:opacity-60`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {store.currentStep === 'batted_ball' && (
          <BattedBallInput
            onComplete={handleBattedBall}
            onCancel={() => store.setStep('pitch_result')}
          />
        )}
      </div>

      {/* Pitch sequence display */}
      {store.currentPitches.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <PitchSequence pitches={store.currentPitches} />
        </div>
      )}

      {/* Undo buttons */}
      <div className="flex gap-2">
        <button
          onClick={undoLastPitch}
          className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm"
        >
          ↩ Undo Last Pitch
        </button>
      </div>

      {/* Lineup list */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl">
        <p className="px-4 py-2 text-slate-400 text-xs uppercase border-b border-slate-700">Batting Order</p>
        {store.lineup.map((entry, i) => (
          <div
            key={entry.id}
            className={`flex items-center gap-3 px-4 py-2 text-sm ${
              i === store.currentBatterIndex ? 'bg-blue-900/30 border-l-2 border-blue-500' : ''
            }`}
          >
            <span className="text-slate-500 w-5 text-center font-mono">{i + 1}</span>
            <span className="text-white font-mono text-blue-400 w-6">
              {entry.player?.jerseyNumber ?? '#'}
            </span>
            <span className={`flex-1 ${i === store.currentBatterIndex ? 'text-white font-medium' : 'text-slate-400'}`}>
              {entry.player?.firstName} {entry.player?.lastName}
            </span>
            <span className="text-slate-500 text-xs">{entry.player?.primaryPosition}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
