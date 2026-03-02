'use client';

import { useState } from 'react';
import { FieldDiagram } from '@/components/field/FieldDiagram';
import { PositionSelector } from '@/components/game/PositionSelector';
import type { FieldLocation, HitType, HitResult } from '@/types';
import { sprayToFieldLocation } from '@/lib/field/coordinates';

interface Props {
  onComplete: (data: {
    sprayX: number;
    sprayY: number;
    fieldLocation: FieldLocation;
    hitType: HitType;
    hitResult: HitResult;
    outByPositions: number[];
    rbiCount: number;
  }) => void;
  onCancel: () => void;
}

type Step = 'location' | 'hit_type' | 'hit_result' | 'position_sequence' | 'rbi';

const HIT_TYPES: { value: HitType; label: string; emoji: string }[] = [
  { value: 'ground_ball', label: 'Ground Ball', emoji: '⬇' },
  { value: 'fly_ball', label: 'Fly Ball', emoji: '⬆' },
  { value: 'line_drive', label: 'Line Drive', emoji: '➡' },
  { value: 'bunt', label: 'Bunt', emoji: '📏' },
  { value: 'popup', label: 'Popup', emoji: '🔼' },
];

const HIT_RESULTS: { value: HitResult; label: string; color: string; needsPositions?: boolean }[] = [
  { value: 'single', label: 'Single', color: 'bg-green-600 hover:bg-green-700' },
  { value: 'double', label: 'Double', color: 'bg-blue-600 hover:bg-blue-700' },
  { value: 'triple', label: 'Triple', color: 'bg-yellow-600 hover:bg-yellow-700' },
  { value: 'homerun', label: 'Home Run', color: 'bg-red-600 hover:bg-red-700' },
  { value: 'out', label: 'Out', color: 'bg-slate-600 hover:bg-slate-500', needsPositions: true },
  { value: 'double_play', label: 'Double Play', color: 'bg-slate-600 hover:bg-slate-500', needsPositions: true },
  { value: 'error', label: 'Error', color: 'bg-orange-600 hover:bg-orange-700', needsPositions: true },
  { value: 'fielders_choice', label: "FC", color: 'bg-orange-600 hover:bg-orange-700', needsPositions: true },
  { value: 'sacrifice', label: 'Sacrifice', color: 'bg-purple-600 hover:bg-purple-700', needsPositions: true },
];

export function BattedBallInput({ onComplete, onCancel }: Props) {
  const [step, setStep] = useState<Step>('location');
  const [sprayX, setSprayX] = useState<number | null>(null);
  const [sprayY, setSprayY] = useState<number | null>(null);
  const [fieldLocation, setFieldLocation] = useState<FieldLocation | null>(null);
  const [hitType, setHitType] = useState<HitType | null>(null);
  const [hitResult, setHitResult] = useState<HitResult | null>(null);
  const [positions, setPositions] = useState<number[]>([]);
  const [rbiCount, setRbiCount] = useState(0);

  function handleLocationSelect(sx: number, sy: number, fl: FieldLocation) {
    setSprayX(sx);
    setSprayY(sy);
    setFieldLocation(fl);
  }

  function confirmLocation() {
    if (sprayX != null && sprayY != null) setStep('hit_type');
  }

  function handleHitType(ht: HitType) {
    setHitType(ht);
    setStep('hit_result');
  }

  function handleHitResult(hr: HitResult) {
    setHitResult(hr);
    const needsPos = HIT_RESULTS.find((r) => r.value === hr)?.needsPositions;
    if (needsPos) {
      setStep('position_sequence');
    } else {
      setStep('rbi');
    }
  }

  function handlePositionConfirm() {
    setStep('rbi');
  }

  function handleFinalConfirm() {
    if (sprayX != null && sprayY != null && hitType && hitResult && fieldLocation) {
      onComplete({
        sprayX,
        sprayY,
        fieldLocation,
        hitType,
        hitResult,
        outByPositions: positions,
        rbiCount,
      });
    }
  }

  return (
    <div className="space-y-4">
      {/* Progress indicator */}
      <div className="flex gap-1">
        {(['location', 'hit_type', 'hit_result', 'rbi'] as Step[]).map((s, i) => (
          <div
            key={s}
            className={`flex-1 h-1 rounded-full ${
              step === s ? 'bg-blue-500' : i < ['location', 'hit_type', 'hit_result', 'rbi'].indexOf(step) ? 'bg-blue-800' : 'bg-slate-700'
            }`}
          />
        ))}
      </div>

      {step === 'location' && (
        <div className="space-y-3">
          <h3 className="text-white font-semibold text-center">Where did the ball go?</h3>
          <FieldDiagram
            onLocationSelect={handleLocationSelect}
            selectedX={sprayX}
            selectedY={sprayY}
          />
          {fieldLocation && (
            <div className="text-center">
              <span className="text-blue-400 text-sm font-medium">→ {fieldLocation}</span>
              <span className="text-slate-400 text-xs ml-2">
                ({sprayX?.toFixed(0)}, {sprayY?.toFixed(0)})
              </span>
            </div>
          )}
          <button
            onClick={confirmLocation}
            disabled={sprayX == null}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium disabled:opacity-40"
          >
            Confirm Location →
          </button>
        </div>
      )}

      {step === 'hit_type' && (
        <div className="space-y-3">
          <h3 className="text-white font-semibold text-center">Hit Type</h3>
          <div className="grid grid-cols-2 gap-2">
            {HIT_TYPES.map(({ value, label, emoji }) => (
              <button
                key={value}
                onClick={() => handleHitType(value)}
                className="py-4 bg-slate-700 hover:bg-slate-600 active:bg-blue-700 text-white rounded-xl transition-colors text-left px-4"
              >
                <span className="text-2xl block mb-1">{emoji}</span>
                <span className="font-medium text-sm">{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'hit_result' && (
        <div className="space-y-3">
          <h3 className="text-white font-semibold text-center">Result</h3>
          <div className="grid grid-cols-2 gap-2">
            {HIT_RESULTS.map(({ value, label, color }) => (
              <button
                key={value}
                onClick={() => handleHitResult(value)}
                className={`py-4 ${color} text-white rounded-xl font-medium text-sm transition-colors`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'position_sequence' && (
        <div className="space-y-3">
          <h3 className="text-white font-semibold text-center">Fielding Sequence</h3>
          <PositionSelector
            sequence={positions}
            onAdd={(pos) => setPositions([...positions, pos])}
            onClear={() => setPositions([])}
            onConfirm={handlePositionConfirm}
          />
          <button
            onClick={handlePositionConfirm}
            className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-sm"
          >
            Skip (no specific fielder)
          </button>
        </div>
      )}

      {step === 'rbi' && (
        <div className="space-y-4">
          <h3 className="text-white font-semibold text-center">RBIs</h3>
          <div className="flex gap-3 justify-center">
            {[0, 1, 2, 3, 4].map((n) => (
              <button
                key={n}
                onClick={() => setRbiCount(n)}
                className={`w-14 h-14 rounded-full text-xl font-bold transition-colors ${
                  rbiCount === n ? 'bg-blue-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="bg-slate-900 rounded-lg p-3 text-sm text-slate-300">
            <p><strong className="text-white">{hitResult?.replace('_', ' ').toUpperCase()}</strong></p>
            <p>{hitType?.replace('_', ' ')} · {fieldLocation}</p>
            {positions.length > 0 && <p>Play: {positions.join('-')}</p>}
          </div>
          <button
            onClick={handleFinalConfirm}
            className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-lg"
          >
            ✓ Record Play
          </button>
        </div>
      )}

      <button
        onClick={onCancel}
        className="w-full py-2 text-slate-400 hover:text-white text-sm"
      >
        ← Back
      </button>
    </div>
  );
}
