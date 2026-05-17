import { create } from 'zustand';
import { BattleMatch } from '../types';

interface BattleState {
  currentMatch: BattleMatch | null;
  activeMatches: BattleMatch[];
  waitingMatches: BattleMatch[];
  setCurrentMatch: (match: BattleMatch | null) => void;
  setActiveMatches: (matches: BattleMatch[]) => void;
  setWaitingMatches: (matches: BattleMatch[]) => void;
  clearMatches: () => void;
}

export const useBattleStore = create<BattleState>((set) => ({
  currentMatch: null,
  activeMatches: [],
  waitingMatches: [],
  setCurrentMatch: (match) => set({ currentMatch: match }),
  setActiveMatches: (matches) => set({ activeMatches: matches }),
  setWaitingMatches: (matches) => set({ waitingMatches: matches }),
  clearMatches: () => set({ activeMatches: [], waitingMatches: [] })
}));
