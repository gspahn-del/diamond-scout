'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SeasonStore {
  activeSeasonId: number | null;
  setActiveSeasonId: (id: number | null) => void;
}

export const useSeasonStore = create<SeasonStore>()(
  persist(
    (set) => ({
      activeSeasonId: null,
      setActiveSeasonId: (id) => set({ activeSeasonId: id }),
    }),
    { name: 'diamond-scout-season' }
  )
);
