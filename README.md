# Appy Birthday

A relationship care manager for iOS & Android — track birthdays, anniversaries, gift ideas, prayer logs, and engagement scores. Powered by Claude AI for letter writing, gift suggestions, and relationship health reports.

## Project Structure

```
AppyBirthday/
├── App.js              # Main React Native app (all screens)
├── src/
│   ├── constants.js    # Colors, data constants, helper functions
│   ├── database.js     # SQLite CRUD layer (expo-sqlite)
│   ├── api.js          # AI calls via proxy server
│   └── notifications.js # Push notification scheduling
├── server/             # Backend proxy (deploy to Render.com)
│   ├── server.js
│   └── package.json
└── assets/             # Icons, splash screen
```

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Start the app

```bash
npx expo start
```

Scan the QR code with the **Expo Go** app on your phone, or press `w` for web.

### 3. Set up the AI backend (required for AI features)

The app needs a backend proxy to call the Anthropic API securely.

1. Create a free account at [render.com](https://render.com)
2. Click **New → Web Service** → connect your GitHub repo
3. Set the root directory to `server/`
4. Add environment variables:
   - `ANTHROPIC_API_KEY` — your key from [console.anthropic.com](https://console.anthropic.com)
   - `PROXY_SECRET` — any strong random string (e.g. `openssl rand -hex 32`)
5. After deploy, copy your Render URL (e.g. `https://appy-birthday-xyz.onrender.com`)
6. Edit `src/api.js`:
   - Set `PROXY_URL` to your Render URL
   - Set `PROXY_SECRET` to match your Render env var

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React Native + Expo |
| Local DB | expo-sqlite |
| AI Backend | Node.js proxy on Render.com |
| AI Model | Claude Sonnet (Anthropic) |
| Notifications | expo-notifications |
| Print/Export | expo-print, expo-sharing |
| Build & Deploy | EAS Build |

## Roadmap

See [appy_birthday_roadmap.md](appy_birthday_roadmap.md) for the full 7-phase production roadmap.

## Building for App Store

```bash
npm install -g eas-cli
eas login
eas build --platform ios     # or android
```
