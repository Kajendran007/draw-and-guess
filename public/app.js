const socket = io();
const $ = id => document.getElementById(id);
const COLORS = ['#1d2433', '#d6336c', '#12a594', '#ffd43b', '#2f80ed', '#ff8a3d', '#7b4bd1', '#8b5a2b'];
let S = null, roomId = null, myId = null, endAt = 0;
let strokes = [], drawing = false, color = COLORS[0], tool = 'pen';

const saved = JSON.parse(sessionStorage.getItem('dg') || '{}');
const urlRoom = (location.pathname.match(/^\/room\/(\w+)/) || [])[1];
const show = id => document.querySelectorAll('.page').forEach(p => p.classList.toggle('on', p.id === id));
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const ranked = () => [...S.players].sort((a, b) => b.score - a.score);

// ---------- entry pages ----------
$('toCreate').onclick = () => show('create');
$('toJoin').onclick = () => show('join');
document.querySelectorAll('.back').forEach(b => (b.onclick = () => show('home')));
if (urlRoom) { $('jCode').value = urlRoom; show('join'); if (saved.roomId === urlRoom) { roomId = urlRoom; myId = saved.playerId; } }

function entered(r, errId) {
  if (r.error) { $(errId).textContent = r.error; return; }
  roomId = r.roomId; myId = r.playerId;
  sessionStorage.setItem('dg', JSON.stringify({ roomId, playerId: myId }));
  history.replaceState(null, '', '/room/' + roomId);
}
$('doCreate').onclick = () => socket.emit('create_room', { name: $('cName').value }, r => entered(r, 'cErr'));
$('doJoin').onclick = () => socket.emit('join_room', { roomId: $('jCode').value.trim(), name: $('jName').value }, r => entered(r, 'jErr'));

// rejoin automatically after a refresh or a dropped connection
socket.on('connect', () => {
  if (!roomId || !myId) return;
  socket.emit('join_room', { roomId, playerId: myId }, r => {
    if (r.error) { sessionStorage.removeItem('dg'); roomId = myId = null; S = null; $('jCode').value = ''; $('jErr').textContent = r.error; show('join'); }
  });
});

socket.on('state', s => { S = s; endAt = Date.now() + s.remaining; render(); });

// ---------- rendering ----------
function render() {
  ({ lobby: renderLobby, playing: renderGame, roundEnd: renderScore, final: renderFinal })[S.phase]();
}
function renderLobby() {
  show('lobby');
  $('link').value = location.origin + '/room/' + S.roomId;
  const n = S.players.length, host = S.hostId === myId;
  $('count').textContent = `${n} / ${S.max} players`;
  $('lobbyHint').textContent = n < 2 ? `Need at least 2 players. Room code: ${S.roomId}` : n < S.max ? `${n} player(s) ready. Room code: ${S.roomId}` : host ? 'Everyone is here.' : 'Waiting for the host to start.';
  const ul = $('lobbyList'); ul.replaceChildren();
  S.players.forEach(p => { const li = el('li', p.id === myId ? 'me' : '', p.name); if (p.id === S.hostId) li.append(el('small', '', 'host')); ul.append(li); });
  for (let i = n; i < S.max; i++) ul.append(el('li', 'slot', 'Open seat'));
  $('start').style.display = host ? '' : 'none';
  $('start').disabled = n < 2;
}
$('copy').onclick = () => { $('link').select(); navigator.clipboard && navigator.clipboard.writeText($('link').value); $('copy').textContent = 'Copied'; setTimeout(() => ($('copy').textContent = 'Copy invite link'), 1500); };
$('start').onclick = () => socket.emit('start_game');

function renderGame() {
  show('game');
  const drawer = S.players.find(p => p.id === S.drawerId), isDrawer = S.drawerId === myId;
  const me = S.players.find(p => p.id === myId);
  $('roundInfo').textContent = `Round ${S.round} of ${S.totalRounds}` + (isDrawer ? ' · you draw' : ` · ${drawer.name} draws`);
  $('wordBox').textContent = isDrawer ? S.word : '_ '.repeat(S.wordLen).trim();
  $('tools').style.display = isDrawer ? '' : 'none';
  $('guessBox').style.display = isDrawer ? 'none' : '';
  $('guess').disabled = $('send').disabled = me.guessed;
  if (me.guessed) setMsg('You got it! +1 point', 'ok');
  else if (!$('msg').dataset.keep) setMsg('', '');
  $('cv').style.cursor = isDrawer ? 'crosshair' : 'default';
  const ul = $('gameList'); ul.replaceChildren();
  S.players.forEach(p => {
    const cls = [p.id === myId && 'me', p.id === S.drawerId && 'drawer', p.guessed && 'ok', !p.connected && 'off'].filter(Boolean).join(' ');
    ul.append(el('li', cls, p.name)); ul.lastChild.append(el('span', '', p.id === S.drawerId ? 'drawing' : (p.guessed ? '✓ ' : '') + p.score));
  });
}
function renderScore() {
  show('score');
  const l = S.last;
  $('sTitle').textContent = `Round ${l.round} of ${S.totalRounds} results`;
  $('sWord').textContent = `The word was “${l.word}”`;
  $('sInfo').textContent = (l.correctNames.length ? `Guessed by ${l.correctNames.join(', ')}. ` : 'Nobody guessed it. ') +
    `${l.drawerName} (drawer) ${l.drawerDelta > 0 ? '+1' : '−1'}.`;
  fillRank($('sRank'));
}
function renderFinal() {
  show('final');
  const r = ranked(), top = r.filter(p => p.score === r[0].score);
  $('winner').textContent = top.length > 1 ? `Tie: ${top.map(p => p.name).join(' & ')}` : `${r[0].name} wins!`;
  fillRank($('fRank'));
  const host = S.hostId === myId;
  $('again').style.display = host ? '' : 'none';
  $('againHint').textContent = host ? '' : 'Waiting for the host to start a new game.';
}
function fillRank(ol) {
  ol.replaceChildren();
  const r = ranked(), max = r[0].score;
  r.forEach((p, i) => { const li = el('li', p.score === max ? 'top' : '', `${i + 1}. ${p.name}${p.id === myId ? ' (you)' : ''}`); li.append(el('span', '', p.score)); ol.append(li); });
}
$('again').onclick = () => socket.emit('play_again');

setInterval(() => {
  if (!S) return;
  const left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
  if (S.phase === 'playing') { $('timer').textContent = left; $('timer').classList.toggle('low', left <= 10); }
  if (S.phase === 'roundEnd') $('next').textContent = left;
}, 250);

// ---------- guessing ----------
function setMsg(t, c) { $('msg').textContent = t; $('msg').className = 'msg ' + c; }
function sendGuess() {
  const v = $('guess').value;
  if (!v.trim()) return;                                   // ignore empty submissions
  socket.emit('guess', v, r => {
    const m = { correct: ['Correct! +1 point', 'ok'], wrong: ['Not quite. Try again.', 'bad'], already: ['You already got it.', 'ok'], closed: ['Round is over.', 'bad'] }[r.status];
    if (m) setMsg(...m);
  });
  $('guess').value = '';
}
$('send').onclick = sendGuess;
$('guess').onkeydown = e => e.key === 'Enter' && sendGuess();

// ---------- canvas ----------
const cv = $('cv'), g = cv.getContext('2d'), W = cv.width, H = cv.height;
function seg(s, i) {
  const [x, y] = s.p[i];
  g.strokeStyle = g.fillStyle = s.c; g.lineWidth = s.w; g.lineCap = g.lineJoin = 'round';
  if (i === 0) { g.beginPath(); g.arc(x * W, y * H, s.w / 2, 0, 7); g.fill(); return; }
  const [px, py] = s.p[i - 1];
  g.beginPath(); g.moveTo(px * W, py * H); g.lineTo(x * W, y * H); g.stroke();
}
function redraw() { g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); strokes.forEach(s => s.p.forEach((_, i) => seg(s, i))); }
redraw();
const canDraw = () => S && S.phase === 'playing' && S.drawerId === myId;
const pos = e => { const r = cv.getBoundingClientRect(); return [Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), Math.min(1, Math.max(0, (e.clientY - r.top) / r.height))]; };

cv.onpointerdown = e => {
  if (!canDraw()) return;
  cv.setPointerCapture(e.pointerId);
  const [x, y] = pos(e), size = +$('size').value;
  const s = { c: tool === 'eraser' ? '#ffffff' : color, w: tool === 'eraser' ? size * 2.5 : size, p: [[x, y]] };
  strokes.push(s); drawing = true; seg(s, 0);
  socket.emit('stroke_start', { c: s.c, w: s.w, x, y });
};
cv.onpointermove = e => {
  if (!drawing || !canDraw()) return;
  const s = strokes[strokes.length - 1], [x, y] = pos(e);
  s.p.push([x, y]); seg(s, s.p.length - 1);
  socket.emit('stroke_point', { x, y });
};
cv.onpointerup = cv.onpointercancel = () => (drawing = false);

socket.on('stroke_start', d => { strokes.push({ c: d.c, w: d.w, p: [[d.x, d.y]] }); seg(strokes[strokes.length - 1], 0); });
socket.on('stroke_point', d => { const s = strokes[strokes.length - 1]; if (!s) return; s.p.push([d.x, d.y]); seg(s, s.p.length - 1); });
socket.on('canvas_sync', data => { strokes = data; redraw(); });

COLORS.forEach((c, i) => {
  const b = el('button', 'swatch' + (i === 0 ? ' sel' : '')); b.style.background = c; b.setAttribute('aria-label', 'Color ' + c);
  b.onclick = () => { color = c; setTool('pen'); document.querySelectorAll('.swatch').forEach(x => x.classList.toggle('sel', x === b)); };
  $('swatches').append(b);
});
function setTool(t) { tool = t; $('pen').classList.toggle('sel', t === 'pen'); $('eraser').classList.toggle('sel', t === 'eraser'); }
$('pen').onclick = () => setTool('pen'); $('eraser').onclick = () => setTool('eraser'); setTool('pen');
$('undo').onclick = () => socket.emit('undo');
$('clear').onclick = () => socket.emit('clear');
