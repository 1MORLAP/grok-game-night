# 🎲 Grok Game Night

**AI-powered party games and activities for friends, family, and chaotic game nights.**  
Built with Next.js + Grok (xAI).

## Features

- **Quick Picker** — Filter by number of players, time, and vibe. Get a curated shortlist of games instantly.
- **Grok Trivia** — Multiple-choice trivia. Use local deck or generate fresh themed rounds with Grok.
- **Prompt Party (Charades)** — Timed acting prompts. Grok can write category-specific decks (xAI office, sci-fi, memes...).
- **Would You Rather** — Vote on dilemmas. Generate new ones live with Grok.
- **Live Scoreboard** — Add players, track points in real time. Persists in localStorage. Big friendly numbers.
- **Grok Custom** — Describe any game idea ("5-minute game about terrible superpowers") and Grok invents rules + examples on the spot.

Everything works without an API key using smart local fallbacks. Connect your `XAI_API_KEY` for the full Grok experience.

## Quick Start

```bash
# 1. Clone
git clone https://github.com/1MORLAP/grok-game-night.git
cd grok-game-night

# 2. Install
npm install

# 3. (Optional but recommended) Enable live Grok generations
cp .env.example .env.local
# Edit .env.local and add your key from https://console.x.ai/

# 4. Run
npm run dev
```

Open http://localhost:3000 and start dealing games.

## Using Grok Generations

1. Get a key at https://console.x.ai/
2. Put it in `.env.local` as `XAI_API_KEY=...`
3. In the app, hit any **"Grok"** button in Trivia, Charades, WYR or Custom.

The API route lives at `app/api/generate/route.ts` and talks directly to `https://api.x.ai/v1`.

## Tech

- Next.js 16 (App Router)
- TypeScript + Tailwind
- Lucide icons, canvas-confetti, sonner toasts
- No heavy UI library — just fast, fun, party-ready components

## Deploy

Deploy anywhere Next.js runs (Vercel is one click). Remember to set the `XAI_API_KEY` environment variable in production if you want live generations.

## Contributing

PRs welcome. Add a new game mode, improve prompt quality, or make the scoreboard support teams. Keep it delightful and low-friction.

## License

MIT — have fun, be kind, blame Grok when the prompts get weird.

---

Made for game night. Powered by Grok.
