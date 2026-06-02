# 🎳 Game Night • June 6, 2026

**Paraiso Bay & Gran Paraiso Wellness Group**  
Saturday, June 6 2026 • 5:00 PM – 9:00 PM • The Bowling Area

Mobile-first local-shell web app for tracking 5 rounds of:
Bowling • Pool Table • Ping Pong • Foosball • Dominoes

## Features (Current Build)

- **Mandatory name gate** — every device must enter a name before anything else. Cannot be skipped.
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

Open on phone-sized viewport (or desktop). Enter any name to begin. Enter **Tomasz** (or “tomasz!” etc.) on one device to test admin controls.

## Production build

```bash
npm run build
```

## Future / Backend Notes

The structures (`MatchEntry`, round timer state, roster, derived leaderboard) are designed so a later shared backend (multi-device sync, real-time, persistent across phones) can be dropped in with minimal UI change.

## Deployment (when ready)

```bash
npm i -g vercel@latest
vercel
```

Set any required env (none for the local shell).

## License / Credit

Built for the June 6 game night. Local interactive shell.
