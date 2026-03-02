'use client';

import { create } from 'zustand';
import type { GameLineup, OpponentPlayer, Pitch, UndoAction } from '@/types';

export type GameTrackingStep =
  | 'pitch_location'
  | 'pitch_type'
  | 'pitch_result'
  | 'batted_ball'
  | 'hit_type'
  | 'hit_result'
  | 'position_sequence'
  | 'pa_complete';

interface GameStore {
  // Game context
  gameId: number | null;
  currentInning: number;
  currentHalfInning: 'top' | 'bottom';
  outs: number;

  // Lineup
  lineup: (GameLineup & { player: OpponentPlayer })[];
  currentBatterIndex: number;

  // Current PA
  currentPAId: number | null;
  currentPitches: Pitch[];
  currentStep: GameTrackingStep;

  // Pending pitch data (being built up through steps)
  pendingLocationX: number | null;
  pendingLocationY: number | null;
  pendingPitchType: string | null;
  pendingPitchResult: string | null;

  // Pending batted ball data
  pendingSprayX: number | null;
  pendingSprayY: number | null;
  pendingFieldLocation: string | null;
  pendingHitType: string | null;
  pendingHitResult: string | null;
  pendingPositions: number[];
  pendingRbi: number;

  // Undo stack
  undoStack: UndoAction[];

  // Walk/K prompts
  showWalkPrompt: boolean;
  showKPrompt: boolean;

  // Actions
  initGame: (gameId: number, lineup: (GameLineup & { player: OpponentPlayer })[]) => void;
  setCurrentPAId: (id: number | null) => void;
  addPitch: (pitch: Pitch) => void;
  setPendingLocation: (x: number, y: number) => void;
  setPendingPitchType: (type: string) => void;
  setPendingPitchResult: (result: string) => void;
  setPendingSpray: (x: number, y: number, location: string) => void;
  setPendingHitType: (type: string) => void;
  setPendingHitResult: (result: string) => void;
  addPendingPosition: (pos: number) => void;
  clearPendingPositions: () => void;
  setPendingRbi: (rbi: number) => void;
  setStep: (step: GameTrackingStep) => void;
  clearPendingPitch: () => void;
  advanceBatter: (outRecorded: boolean) => void;
  addUndo: (action: UndoAction) => void;
  popUndo: () => UndoAction | undefined;
  removePitchFromCurrent: (pitchId: number) => void;
  setShowWalkPrompt: (show: boolean) => void;
  setShowKPrompt: (show: boolean) => void;
  reset: () => void;
}

const initialState = {
  gameId: null,
  currentInning: 1,
  currentHalfInning: 'top' as const,
  outs: 0,
  lineup: [],
  currentBatterIndex: 0,
  currentPAId: null,
  currentPitches: [],
  currentStep: 'pitch_location' as GameTrackingStep,
  pendingLocationX: null,
  pendingLocationY: null,
  pendingPitchType: null,
  pendingPitchResult: null,
  pendingSprayX: null,
  pendingSprayY: null,
  pendingFieldLocation: null,
  pendingHitType: null,
  pendingHitResult: null,
  pendingPositions: [],
  pendingRbi: 0,
  undoStack: [],
  showWalkPrompt: false,
  showKPrompt: false,
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  initGame: (gameId, lineup) =>
    set({ ...initialState, gameId, lineup, currentStep: 'pitch_location' }),

  setCurrentPAId: (id) => set({ currentPAId: id, currentPitches: [] }),

  addPitch: (pitch) =>
    set((state) => ({ currentPitches: [...state.currentPitches, pitch] })),

  setPendingLocation: (x, y) =>
    set({ pendingLocationX: x, pendingLocationY: y }),

  setPendingPitchType: (type) => set({ pendingPitchType: type }),

  setPendingPitchResult: (result) => set({ pendingPitchResult: result }),

  setPendingSpray: (x, y, location) =>
    set({ pendingSprayX: x, pendingSprayY: y, pendingFieldLocation: location }),

  setPendingHitType: (type) => set({ pendingHitType: type }),

  setPendingHitResult: (result) => set({ pendingHitResult: result }),

  addPendingPosition: (pos) =>
    set((state) => ({ pendingPositions: [...state.pendingPositions, pos] })),

  clearPendingPositions: () => set({ pendingPositions: [] }),

  setPendingRbi: (rbi) => set({ pendingRbi: rbi }),

  setStep: (step) => set({ currentStep: step }),

  clearPendingPitch: () =>
    set({
      pendingLocationX: null,
      pendingLocationY: null,
      pendingPitchType: null,
      pendingPitchResult: null,
      pendingSprayX: null,
      pendingSprayY: null,
      pendingFieldLocation: null,
      pendingHitType: null,
      pendingHitResult: null,
      pendingPositions: [],
      pendingRbi: 0,
      currentStep: 'pitch_location',
    }),

  advanceBatter: (outRecorded) => {
    const state = get();
    let newOuts = state.outs + (outRecorded ? 1 : 0);
    let newInning = state.currentInning;
    let newHalf = state.currentHalfInning;
    let newBatterIndex = (state.currentBatterIndex + 1) % Math.max(state.lineup.length, 1);

    if (newOuts >= 3) {
      newOuts = 0;
      if (newHalf === 'top') {
        newHalf = 'bottom';
      } else {
        newHalf = 'top';
        newInning++;
      }
    }

    set({
      outs: newOuts,
      currentInning: newInning,
      currentHalfInning: newHalf,
      currentBatterIndex: newBatterIndex,
      currentPAId: null,
      currentPitches: [],
      currentStep: 'pitch_location',
    });
  },

  addUndo: (action) =>
    set((state) => ({ undoStack: [...state.undoStack, action] })),

  popUndo: () => {
    const state = get();
    if (state.undoStack.length === 0) return undefined;
    const last = state.undoStack[state.undoStack.length - 1];
    set({ undoStack: state.undoStack.slice(0, -1) });
    return last;
  },

  removePitchFromCurrent: (pitchId) =>
    set((state) => ({
      currentPitches: state.currentPitches.filter((p) => p.id !== pitchId),
    })),

  setShowWalkPrompt: (show) => set({ showWalkPrompt: show }),
  setShowKPrompt: (show) => set({ showKPrompt: show }),

  reset: () => set(initialState),
}));
