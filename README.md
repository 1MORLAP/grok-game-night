# 🎳 Game Night • June 6, 2026

**Paraiso Bay & Gran Paraiso Wellness Group**  
Saturday, June 6 2026 • 5:00 PM – 9:00 PM • The Bowling Area

Mobile-first local-shell web app for tracking 5 rounds of:
Bowling • Pool Table • Ping Pong • Foosball • Dominoes

## Features (Current Build)

- **Name is optional for access** — the app opens immediately for anyone (defaults to "Guest"). Click your name in the top bar to set or change it at any time. Used for teams, "you" highlights, and admin (Tomasz). No blocking gate.
- **Admin mode** — only the name `Tomasz` (case-insensitive, punctuation-insensitive) unlocks timer controls and the ability to unlock/edit any locked entry.
- **Sticky event timer** — shows current phase (ROUND X or BREAK) + big MM:SS countdown. Admin gets inline Start / Pause / Resume / Advance controls.
- **Round unlocking rules** (exactly as specified):
  - Round 1 names + teams always available (even pre-event).
  - Round N+1 names/teams unlock only after Round N has started.
  - Scores for a round only become available once that round has started.
- **Slot-machine round selector** + game selector (5 stations).
- **Team A / Team B player pickers** with live roster + inline “+ add player”.
- **Manual score entry** (team totals). Each player on a team receives the full team score for that game.
- **Locking** — after scores are submitted, the entry locks for non-admins (names, teams, and scores become read-only). Admin can unlock + re-edit from the same UI.
- **Live Scorecard** — 25-slot progress, round checkmarks, full leaderboard (per-round totals + grand total, sorted by total score). Shows games played per person.
- **Chalkboard aesthetic** — distressed poster headlines, brush-painted “Game Night” accents, handwritten chalk text, neon cyan/lime/magenta/yellow/orange highlights, subtle grain texture.
- **Web Audio ambient sounds** — distinct taps, selector ticks, score-submit dings, and throttled scroll ticks. Visible mute toggle (persisted).
- 100% localStorage (device-only). Data model is intentionally backend-ready.

## Fonts (image-matched direction)

- Heavy distressed poster (Anton) for big titles and round numbers
- Brush/marker (Permanent Marker) for accents, game buttons, and primary CTAs
- Chalk/handwritten (Caveat) for rules, player names, labels, and scorecard

## Run locally

```bash
cd /Users/tomasz/grok-game-night
npm install
npm run dev
```

Open on phone-sized viewport (or desktop). Loads immediately as "Guest" so anyone can access. Click the name in the header to set your real name (for leaderboard, teams, and to unlock admin if you are "Tomasz"). Enter **Tomasz** (or “tomasz!” etc.) to test admin controls.

## Production build

```bash
npm run build
```

## Future / Backend Notes

The structures (`MatchEntry`, round timer state, roster, derived leaderboard) are designed so a later shared backend (multi-device sync, real-time, persistent across phones) can be dropped in with minimal UI change.

## Deployment

**Live at:**

- Production: [https://grok-game-night.vercel.app](https://grok-game-night.vercel.app)
- Vercel project: [https://vercel.com/tomek-group/grok-game-night](https://vercel.com/tomek-group/grok-game-night)
- GitHub repo connected for automatic deploys on push.

The CLI deployment (using `vercel --yes`) auto-detected Next.js, linked the GitHub repo (https://github.com/1MORLAP/grok-game-night), and set up the `grok-game-night.vercel.app` alias.

### Redeploy / update

```bash
npm i -g vercel@latest
cd /Users/tomasz/grok-game-night
vercel --prod
```

Or just push to the `main` branch on GitHub (CI/CD is wired via the connected repo).

No environment variables are required (pure client-side + localStorage app).

## License / Credit

Built for the June 6 game night. Local interactive shell.
