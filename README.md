# Draw & Guess

Real-time multiplayer drawing game (Node.js, Express, Socket.IO). 11 players per room, 11 rounds, each player draws once.

## Run
    npm install
    npm start            # http://localhost:3000

## Quick test with fewer players
    PLAYERS=3 ROUND_SECONDS=30 npm start     # (Windows PowerShell: $env:PLAYERS=3; npm start)

Open the app in several browser windows (use private windows so each has its own session), create a room in one,
and open the invite link in the others. Share your LAN IP (e.g. http://192.168.x.x:3000) for phones and other devices.

## Structure
    server.js        rooms, server-authoritative game state, scoring, timers, Socket.IO events
    words.js         secret word list
    public/          index.html, style.css, app.js (all 8 screens + canvas)
