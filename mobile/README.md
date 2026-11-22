# Draw & Guess - React Native (Expo) Mobile App

This is the mobile application frontend for **Draw & Guess**, built with React Native and Expo, connecting directly to the Node.js + Socket.io backend.

---

## 🚀 How to Run

### 1. Start the Backend Server
In the root `draw-and-guess` folder:
```bash
npm start
```
The server will run on `http://localhost:3000`.

---

### 2. Configure the Server URL (if testing on physical device)
Open `src/context/GameProvider.tsx`:
- By default, `SERVER_URL` connects to:
  - `http://10.0.2.2:3000` on Android Emulator
  - `http://localhost:3000` on iOS Simulator / Web
- If testing on a **physical iPhone or Android phone** connected to your local Wi-Fi:
  Find your computer's IP address with `ipconfig` (Windows) and set:
  ```ts
  export const SERVER_URL = 'http://192.168.x.x:3000';
  ```

---

### 3. Start the Expo Mobile App
In the `mobile` directory:
```bash
npx expo start
```

- **Run on iPhone (Expo Go)**:
  1. Install **Expo Go** from the Apple App Store.
  2. Scan the terminal QR code with your iPhone Camera app.
  3. The app will launch directly on your iPhone.

- **Run on Android**:
  Press `a` in the terminal to launch on a connected Android device or emulator.

- **Run on Web**:
  Press `w` in the terminal to preview in your desktop browser.

---

## 📱 Features Included
- **Minimum 2 players** to start a game (up to 11 players supported).
- **Smooth finger drawing canvas** (SVG paths with pen, eraser, color palette, size controls, undo, clear).
- **Real-time game state synchronization** using WebSockets (`socket.io-client`).
- **Full game flow**:
  - `Home`: Create or Join rooms.
  - `CreateRoom`: Host setup with room code generation.
  - `JoinRoom`: Room code input and validation.
  - `Lobby`: Player list, room code copy, start game trigger.
  - `Game`: Synchronized canvas, live countdown timer, word reveal for drawer / blanks for guessers, guess submission.
  - `Score`: Round results, drawer score updates, leaderboard.
  - `Final`: Winner celebrations and Play Again lobby reset.
