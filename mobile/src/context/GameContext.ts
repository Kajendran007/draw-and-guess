import { createContext, useContext } from 'react';

export interface Player {
  id: string;
  name: string;
  score: number;
  connected: boolean;
  guessed: boolean;
}

export interface LastRound {
  round: number;
  word: string;
  drawerName: string;
  drawerDelta: number;
  correctNames: string[];
}

export interface GameState {
  roomId: string;
  phase: 'lobby' | 'playing' | 'roundEnd' | 'final';
  hostId: string;
  max: number;
  you: string;
  round: number;
  totalRounds: number;
  roundSeconds: number;
  remaining: number;
  drawerId: string | null;
  word: string | null;
  wordLen: number | null;
  last: LastRound | null;
  players: Player[];
}

export interface Stroke {
  c: string;
  w: number;
  p: [number, number][];
}

export interface GameContextValue {
  state: GameState | null;
  roomId: string | null;
  myId: string | null;
  strokes: Stroke[];
  connected: boolean;
  createRoom: (name: string, cb: (err?: string) => void) => void;
  joinRoom: (roomId: string, name: string, cb: (err?: string) => void) => void;
  startGame: () => void;
  sendGuess: (text: string, cb: (status: string) => void) => void;
  sendStrokeStart: (c: string, w: number, x: number, y: number) => void;
  sendStrokePoint: (x: number, y: number) => void;
  sendUndo: () => void;
  sendClear: () => void;
  playAgain: () => void;
  disconnect: () => void;
}

export const GameContext = createContext<GameContextValue | null>(null);

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside GameProvider');
  return ctx;
}
