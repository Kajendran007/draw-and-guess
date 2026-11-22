const express = require('express'), http = require('http'), path = require('path'), crypto = require('crypto');
const { Server } = require('socket.io');
const WORDS = require('./words');

const PORT = process.env.PORT || 3000;
const MAX = +process.env.PLAYERS || 11;          // max players per room
const MIN = +process.env.MIN_PLAYERS || 2;        // minimum players needed to start
const ROUND_S = +process.env.ROUND_SECONDS || 90;
const BREAK_S = 7;
const ALPHA = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

const app = express(), server = http.createServer(app), io = new Server(server);
app.use(express.static(path.join(__dirname, 'public')));
app.get('/room/:id', (q, r) => r.sendFile(path.join(__dirname, 'public', 'index.html')));

const rooms = new Map();
const rnd = n => crypto.randomInt(n);
const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const cleanName = s => String(s || '').replace(/\s+/g, ' ').trim().slice(0, 16);
const num = v => Math.min(1, Math.max(0, +v || 0));
const fail = (ack, error) => typeof ack === 'function' && ack({ error });

function makeRoom() {
  let id;
  do { id = Array.from({ length: 6 }, () => ALPHA[rnd(ALPHA.length)]).join(''); } while (rooms.has(id));
  const room = { id, players: [], hostId: null, phase: 'lobby', round: 0, order: [], drawerId: null, word: null,
    used: new Set(), strokes: [], points: 0, correct: new Set(), endsAt: 0, timer: null, last: null, cleanup: null };
  rooms.set(id, room);
  return room;
}

function viewFor(room, pid) {
  const playing = room.phase === 'playing', drawer = pid === room.drawerId;
  return {
    roomId: room.id, phase: room.phase, hostId: room.hostId, max: MAX, you: pid,
    round: room.round + 1, totalRounds: room.order.length || MAX, roundSeconds: ROUND_S,
    remaining: Math.max(0, room.endsAt - Date.now()),
    drawerId: playing || room.phase === 'roundEnd' ? room.drawerId : null,
    word: playing && drawer ? room.word : null,                 // only the drawer ever receives the word during a round
    wordLen: playing ? norm(room.word).length : null,
    last: room.last,
    players: room.players.map(p => ({ id: p.id, name: p.name, score: p.score, connected: p.connected, guessed: room.correct.has(p.id) })),
  };
}
function broadcast(room) {
  room.players.forEach(p => p.connected && io.to(p.socketId).emit('state', viewFor(room, p.id)));
}
function attach(socket, room, p) {
  socket.data = { roomId: room.id, pid: p.id };
  socket.join(room.id);
  p.socketId = socket.id; p.connected = true;
  clearTimeout(room.cleanup);
  socket.emit('canvas_sync', room.strokes);
}

function startRound(room) {
  room.drawerId = room.order[room.round];
  let w; do { w = WORDS[rnd(WORDS.length)]; } while (room.used.has(w) && room.used.size < WORDS.length);
  room.used.add(w); room.word = w;
  room.strokes = []; room.points = 0; room.correct = new Set(); room.last = null;
  room.phase = 'playing'; room.endsAt = Date.now() + ROUND_S * 1000;
  clearTimeout(room.timer); room.timer = setTimeout(() => endRound(room), ROUND_S * 1000);
  io.to(room.id).emit('canvas_sync', []);
  broadcast(room);
}
function endRound(room) {
  if (room.phase !== 'playing') return;
  clearTimeout(room.timer);
  const drawer = room.players.find(p => p.id === room.drawerId);
  const delta = room.correct.size > 0 ? -1 : 1;
  drawer.score += delta;
  room.last = { round: room.round + 1, word: room.word, drawerName: drawer.name, drawerDelta: delta,
    correctNames: room.players.filter(p => room.correct.has(p.id)).map(p => p.name) };
  room.phase = 'roundEnd'; room.endsAt = Date.now() + BREAK_S * 1000;
  room.timer = setTimeout(() => nextRound(room), BREAK_S * 1000);
  broadcast(room);
}
function nextRound(room) {
  room.round++;
  if (room.round >= room.order.length) { room.phase = 'final'; room.endsAt = 0; room.drawerId = null; broadcast(room); }
  else startRound(room);
}
const ctx = socket => {
  const room = rooms.get(socket.data && socket.data.roomId);
  return { room, p: room && room.players.find(x => x.id === socket.data.pid) };
};

io.on('connection', socket => {
  socket.on('create_room', ({ name } = {}, ack) => {
    name = cleanName(name);
    if (!name) return fail(ack, 'Enter your name first.');
    const room = makeRoom();
    const p = { id: crypto.randomUUID(), name, score: 0, socketId: null, connected: false };
    room.players.push(p); room.hostId = p.id;
    attach(socket, room, p); broadcast(room);
    ack && ack({ roomId: room.id, playerId: p.id });
  });

  socket.on('join_room', ({ roomId, name, playerId } = {}, ack) => {
    const room = rooms.get(String(roomId || '').toUpperCase());
    if (!room) return fail(ack, 'Room not found. Check the code or link.');
    let p = playerId && room.players.find(x => x.id === playerId);
    if (!p) {                                                  // brand-new player
      name = cleanName(name);
      if (room.phase !== 'lobby') return fail(ack, 'This game has already started.');
      if (room.players.length >= MAX) return fail(ack, `Room is full (${MAX}/${MAX}).`);
      if (!name) return fail(ack, 'Enter your name first.');
      if (room.players.some(x => x.name.toLowerCase() === name.toLowerCase())) return fail(ack, 'That name is taken. Pick another.');
      p = { id: crypto.randomUUID(), name, score: 0, socketId: null, connected: false };
      room.players.push(p);
    }
    attach(socket, room, p); broadcast(room);
    ack && ack({ roomId: room.id, playerId: p.id });
  });

  socket.on('start_game', () => {
    const { room, p } = ctx(socket);
    if (!room || !p || p.id !== room.hostId || room.phase !== 'lobby' || room.players.length < MIN) return;
    room.players.forEach(x => (x.score = 0));
    room.order = room.players.map(x => x.id);
    for (let i = room.order.length - 1; i > 0; i--) { const j = rnd(i + 1); [room.order[i], room.order[j]] = [room.order[j], room.order[i]]; }
    room.round = 0; room.used.clear();
    startRound(room);
  });

  // ---- drawing (server only accepts it from the current drawer) ----
  const isDrawer = () => { const { room, p } = ctx(socket); return room && p && room.phase === 'playing' && p.id === room.drawerId ? room : null; };
  socket.on('stroke_start', d => {
    const room = isDrawer(); if (!room || !d || room.points > 40000) return;
    const c = /^#[0-9a-f]{6}$/i.test(d.c) ? d.c : '#1d2433';
    const s = { c, w: Math.min(80, Math.max(1, +d.w || 6)), p: [[num(d.x), num(d.y)]] };
    room.strokes.push(s); room.points++;
    socket.to(room.id).emit('stroke_start', { c: s.c, w: s.w, x: s.p[0][0], y: s.p[0][1] });
  });
  socket.on('stroke_point', d => {
    const room = isDrawer(); if (!room || !d || !room.strokes.length || room.points > 40000) return;
    const x = num(d.x), y = num(d.y);
    room.strokes[room.strokes.length - 1].p.push([x, y]); room.points++;
    socket.to(room.id).emit('stroke_point', { x, y });
  });
  socket.on('undo', () => { const room = isDrawer(); if (!room) return; room.strokes.pop(); io.to(room.id).emit('canvas_sync', room.strokes); });
  socket.on('clear', () => { const room = isDrawer(); if (!room) return; room.strokes = []; io.to(room.id).emit('canvas_sync', []); });

  // ---- guessing (validated here, never on the client) ----
  socket.on('guess', (text, ack) => {
    const { room, p } = ctx(socket);
    const reply = status => typeof ack === 'function' && ack({ status });
    if (!room || !p || room.phase !== 'playing') return reply('closed');
    if (p.id === room.drawerId) return reply('drawer');
    if (room.correct.has(p.id)) return reply('already');       // no double scoring
    const g = norm(String(text || '').slice(0, 60));
    if (!g) return reply('empty');
    if (g !== norm(room.word)) return reply('wrong');
    room.correct.add(p.id); p.score += 1;
    reply('correct');
    if (room.correct.size >= room.players.length - 1) endRound(room); else broadcast(room);
  });

  socket.on('play_again', () => {
    const { room, p } = ctx(socket);
    if (!room || !p || p.id !== room.hostId || room.phase !== 'final') return;
    room.players = room.players.filter(x => x.connected);
    room.players.forEach(x => (x.score = 0));
    Object.assign(room, { phase: 'lobby', round: 0, order: [], drawerId: null, word: null, last: null, strokes: [], endsAt: 0 });
    broadcast(room);
  });

  socket.on('disconnect', () => {
    const { room, p } = ctx(socket);
    if (!room || !p || p.socketId !== socket.id) return;
    if (room.phase === 'lobby') {                               // free the slot
      room.players = room.players.filter(x => x !== p);
      if (room.hostId === p.id && room.players[0]) room.hostId = room.players[0].id;
    } else p.connected = false;                                 // keep the slot so they can rejoin
    if (!room.players.some(x => x.connected)) {
      room.cleanup = setTimeout(() => { clearTimeout(room.timer); rooms.delete(room.id); }, room.phase === 'lobby' ? 1000 : 5 * 60 * 1000);
    } else broadcast(room);
  });
});

server.listen(PORT, () => console.log(`Draw & Guess running at http://localhost:${PORT}  (players per room: ${MAX})`));
