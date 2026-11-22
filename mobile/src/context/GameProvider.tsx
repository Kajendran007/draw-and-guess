import React, { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameContext, GameState, Stroke } from './GameContext';

// ⬇️  Change this to your computer's local IP address (e.g. http://192.168.1.100:3000)
// You can find your IP by running: ipconfig (Windows) → look for IPv4 Address
export const SERVER_URL = 'http://10.0.2.2:3000'; // 10.0.2.2 = Android emulator → host machine

const STORAGE_KEY = 'dg_session';

export function GameProvider({ children }: { children: React.ReactNode }) {
  const socketRef = useRef<Socket | null>(null);
  const [state, setState] = useState<GameState | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [myId, setMyId] = useState<string | null>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [connected, setConnected] = useState(false);

  const getSocket = useCallback(() => {
    if (!socketRef.current) {
      const s = io(SERVER_URL, { transports: ['websocket'] });
      socketRef.current = s;

      s.on('connect', async () => {
        setConnected(true);
        // Try to rejoin existing session
        try {
          const saved = await AsyncStorage.getItem(STORAGE_KEY);
          if (saved) {
            const { roomId: rId, playerId } = JSON.parse(saved);
            if (rId && playerId) {
              s.emit('join_room', { roomId: rId, playerId }, (r: any) => {
                if (r?.error) {
                  AsyncStorage.removeItem(STORAGE_KEY);
                  setRoomId(null);
                  setMyId(null);
                } else {
                  setRoomId(rId);
                  setMyId(playerId);
                }
              });
            }
          }
        } catch {}
      });

      s.on('disconnect', () => setConnected(false));

      s.on('state', (s: GameState) => {
        setState(s);
      });

      s.on('canvas_sync', (data: Stroke[]) => {
        setStrokes(data);
      });

      s.on('stroke_start', (d: { c: string; w: number; x: number; y: number }) => {
        setStrokes(prev => {
          const ns = [...prev, { c: d.c, w: d.w, p: [[d.x, d.y]] as [number, number][] }];
          return ns;
        });
      });

      s.on('stroke_point', (d: { x: number; y: number }) => {
        setStrokes(prev => {
          if (!prev.length) return prev;
          const copy = prev.map((s, i) =>
            i === prev.length - 1
              ? { ...s, p: [...s.p, [d.x, d.y]] as [number, number][] }
              : s
          );
          return copy;
        });
      });
    }
    return socketRef.current;
  }, []);

  useEffect(() => {
    getSocket();
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [getSocket]);

  const createRoom = useCallback(
    (name: string, cb: (err?: string) => void) => {
      const s = getSocket();
      s.emit('create_room', { name }, async (r: any) => {
        if (r?.error) return cb(r.error);
        setRoomId(r.roomId);
        setMyId(r.playerId);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ roomId: r.roomId, playerId: r.playerId }));
        cb();
      });
    },
    [getSocket]
  );

  const joinRoom = useCallback(
    (roomId: string, name: string, cb: (err?: string) => void) => {
      const s = getSocket();
      s.emit('join_room', { roomId: roomId.trim().toUpperCase(), name }, async (r: any) => {
        if (r?.error) return cb(r.error);
        setRoomId(r.roomId);
        setMyId(r.playerId);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ roomId: r.roomId, playerId: r.playerId }));
        cb();
      });
    },
    [getSocket]
  );

  const startGame = useCallback(() => getSocket().emit('start_game'), [getSocket]);
  const playAgain = useCallback(() => getSocket().emit('play_again'), [getSocket]);

  const sendGuess = useCallback(
    (text: string, cb: (status: string) => void) => {
      getSocket().emit('guess', text, (r: any) => cb(r?.status ?? 'closed'));
    },
    [getSocket]
  );

  const sendStrokeStart = useCallback(
    (c: string, w: number, x: number, y: number) => {
      setStrokes(prev => [...prev, { c, w, p: [[x, y]] }]);
      getSocket().emit('stroke_start', { c, w, x, y });
    },
    [getSocket]
  );

  const sendStrokePoint = useCallback(
    (x: number, y: number) => {
      setStrokes(prev => {
        if (!prev.length) return prev;
        return prev.map((s, i) =>
          i === prev.length - 1 ? { ...s, p: [...s.p, [x, y]] as [number, number][] } : s
        );
      });
      getSocket().emit('stroke_point', { x, y });
    },
    [getSocket]
  );

  const sendUndo = useCallback(() => getSocket().emit('undo'), [getSocket]);
  const sendClear = useCallback(() => getSocket().emit('clear'), [getSocket]);

  const disconnect = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    socketRef.current?.disconnect();
    socketRef.current = null;
    setState(null);
    setRoomId(null);
    setMyId(null);
    setStrokes([]);
  }, []);

  return (
    <GameContext.Provider
      value={{
        state,
        roomId,
        myId,
        strokes,
        connected,
        createRoom,
        joinRoom,
        startGame,
        sendGuess,
        sendStrokeStart,
        sendStrokePoint,
        sendUndo,
        sendClear,
        playAgain,
        disconnect,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}
