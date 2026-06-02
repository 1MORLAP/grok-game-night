"use client";

import React, { useState, useEffect } from "react";
import { 
  Dice5, Brain, Users, Trophy, Sparkles, Clock, SkipForward, 
  Plus, Minus, RotateCcw, Play, Pause, Star, ExternalLink 
} from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "sonner";

// Types
type GameMode = "picker" | "trivia" | "charades" | "wyr" | "scoreboard" | "custom";

interface TriviaQuestion {
  q: string;
  options: string[];
  correct: number;
  fact?: string;
}

interface WyrQuestion {
  a: string;
  b: string;
}

interface Player {
  id: number;
  name: string;
  score: number;
}

// Curated game night classics + Grok-flavored
const GAME_LIBRARY = [
  { name: "Grok Would You Rather", players: "3+", time: "10m", energy: "any", desc: "Hilarious dilemmas powered by Grok" },
  { name: "Charades: xAI Edition", players: "4+", time: "15m", energy: "high", desc: "Act out Grok, Grok-isms, and sci-fi absurdity" },
  { name: "Two Truths and a Grok", players: "3+", time: "12m", energy: "any", desc: "One lie is suspiciously clever" },
  { name: "Never Have I Ever: AI Edition", players: "4+", time: "10m", energy: "chill", desc: "Tech, sci-fi, and life prompts" },
  { name: "The Password is Grok", players: "4+", time: "15m", energy: "high", desc: "Taboo-style with forbidden AI words" },
  { name: "Paper Telephone (Grok twist)", players: "5+", time: "20m", energy: "chill", desc: "Draw + caption chain with Grok captions" },
  { name: "Grok Roast Circle", players: "4+", time: "15m", energy: "wild", desc: "Loving roasts generated live" },
  { name: "Most Likely To...", players: "4+", time: "8m", energy: "any", desc: "The group votes — chaos ensues" },
  { name: "3-Question Interview", players: "3+", time: "12m", energy: "chill", desc: "Rapid deep + silly questions" },
  { name: "Mafia / Werewolf (Grok Narrator)", players: "6+", time: "30m", energy: "high", desc: "Grok as impartial moderator" },
  { name: "Codenames: Grok Agents", players: "4+", time: "20m", energy: "high", desc: "Spymasters give one-word clues" },
  { name: "Human or Grok?", players: "4+", time: "10m", energy: "any", desc: "Guess which answer came from Grok" },
];

const VIBES = ["any", "chill", "high", "wild"] as const;

const CHARADES_CATEGORIES = [
  "xAI Office Shenanigans",
  "Grok Hallucinations",
  "Sci-Fi Movie Moments",
  "Tech CEO Antics",
  "Internet Memes 2026",
  "Absurd Inventions",
];

export default function GrokGameNight() {
  const [mode, setMode] = useState<GameMode>("picker");
  const [playersCount, setPlayersCount] = useState(5);
  const [duration, setDuration] = useState(15);
  const [vibe, setVibe] = useState<(typeof VIBES)[number]>("any");
  const [pickedGames, setPickedGames] = useState<typeof GAME_LIBRARY>([]);

  // Trivia state
  const [triviaQuestions, setTriviaQuestions] = useState<TriviaQuestion[]>([]);
  const [triviaIndex, setTriviaIndex] = useState(0);
  const [triviaScore, setTriviaScore] = useState(0);
  const [triviaRevealed, setTriviaRevealed] = useState(false);
  const [triviaSelected, setTriviaSelected] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Charades state
  const [charadesPrompts, setCharadesPrompts] = useState<string[]>([]);
  const [charadesIndex, setCharadesIndex] = useState(0);
  const [charadesTimer, setCharadesTimer] = useState(60);
  const [charadesRunning, setCharadesRunning] = useState(false);
  const [charadesCategory, setCharadesCategory] = useState(CHARADES_CATEGORIES[0]);

  // WYR state
  const [wyrQuestions, setWyrQuestions] = useState<WyrQuestion[]>([]);
  const [wyrIndex, setWyrIndex] = useState(0);
  const [wyrVotes, setWyrVotes] = useState<{ a: number; b: number }>({ a: 0, b: 0 });

  // Scoreboard state
  const [scoreboard, setScoreboard] = useState<Player[]>([
    { id: 1, name: "Alex", score: 0 },
    { id: 2, name: "Jordan", score: 0 },
    { id: 3, name: "Sam", score: 0 },
  ]);
  const [newPlayerName, setNewPlayerName] = useState("");

  // Custom generator
  const [customPrompt, setCustomPrompt] = useState("");
  const [customResult, setCustomResult] = useState<any>(null);

  // Load scoreboard from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("grok-game-night-scoreboard");
    if (saved) {
      try {
        setScoreboard(JSON.parse(saved));
      } catch {}
    }
  }, []);

  // Persist scoreboard
  useEffect(() => {
    localStorage.setItem("grok-game-night-scoreboard", JSON.stringify(scoreboard));
  }, [scoreboard]);

  // Charades timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (charadesRunning && charadesTimer > 0) {
      interval = setInterval(() => {
        setCharadesTimer((t) => {
          if (t <= 1) {
            setCharadesRunning(false);
            confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [charadesRunning, charadesTimer]);

  // --- Game Logic ---

  function pickGames() {
    let filtered = GAME_LIBRARY.filter((g) => {
      const pOk = g.players.includes("+") 
        ? parseInt(g.players) <= playersCount 
        : true;
      const tOk = parseInt(g.time) <= duration + 5;
      const vOk = vibe === "any" || g.energy === vibe || g.energy === "any";
      return pOk && tOk && vOk;
    });

    if (filtered.length === 0) filtered = GAME_LIBRARY;

    // Shuffle + take 5
    const shuffled = [...filtered].sort(() => Math.random() - 0.5).slice(0, 5);
    setPickedGames(shuffled);
    setMode("picker");
    toast.success(`Picked ${shuffled.length} games for ${playersCount} players`);
  }

  function dealRandomGame() {
    const random = GAME_LIBRARY[Math.floor(Math.random() * GAME_LIBRARY.length)];
    setPickedGames([random]);
    setMode("picker");
    confetti({ particleCount: 120, spread: 70, origin: { y: 0.7 } });
  }

  // Trivia
  async function generateTrivia(useGrok = false) {
    setIsGenerating(true);
    if (useGrok) {
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "trivia",
            params: { count: 6, category: "pop culture, science, tech, and absurd facts" },
          }),
        });
        const json = await res.json();
        if (json.error) throw new Error(json.error);
        if (json.data?.questions) {
          setTriviaQuestions(json.data.questions);
          resetTriviaState();
          toast.success("Grok generated fresh trivia!");
          setIsGenerating(false);
          return;
        }
      } catch (e: any) {
        toast.error(e.message || "Grok generation failed — using local backup");
      }
    }
    // Local fallback generator (always works)
    const local = generateLocalTrivia();
    setTriviaQuestions(local);
    resetTriviaState();
    setIsGenerating(false);
    if (!useGrok) toast("Local trivia loaded — add XAI_API_KEY for Grok-powered sets");
  }

  function generateLocalTrivia(): TriviaQuestion[] {
    const templates = [
      { q: "What does Grok stand for in Hitchhiker's Guide?", options: ["A drink", "To understand", "A robot", "A sandwich"], correct: 1, fact: "Grok means 'to understand intuitively'." },
      { q: "Which company built me?", options: ["OpenAI", "xAI", "Anthropic", "Google DeepMind"], correct: 1 },
      { q: "In 2025, what was the most viral AI meme format?", options: ["Grok vs Claude rap battles", "Banana for scale", "AI Garfield", "All of the above"], correct: 3 },
      { q: "What is the ideal number of players for Werewolf?", options: ["3", "5-8", "9-15", "20+"], correct: 2 },
      { q: "Which game is best played with exactly zero prep?", options: ["Codenames", "Two Truths & a Lie", "Gloomhaven", "D&D 5e"], correct: 1 },
    ];
    return [...templates].sort(() => Math.random() - 0.5).slice(0, 5);
  }

  function resetTriviaState() {
    setTriviaIndex(0);
    setTriviaScore(0);
    setTriviaRevealed(false);
    setTriviaSelected(null);
  }

  function selectTriviaAnswer(idx: number) {
    if (triviaRevealed) return;
    setTriviaSelected(idx);
    setTriviaRevealed(true);

    const q = triviaQuestions[triviaIndex];
    const isCorrect = idx === q.correct;
    if (isCorrect) {
      setTriviaScore((s) => s + 1);
      confetti({ particleCount: 60, spread: 50 });
    }
  }

  function nextTrivia() {
    if (triviaIndex < triviaQuestions.length - 1) {
      setTriviaIndex((i) => i + 1);
      setTriviaRevealed(false);
      setTriviaSelected(null);
    } else {
      // Finished
      const pct = Math.round((triviaScore / triviaQuestions.length) * 100);
      if (pct >= 70) confetti({ particleCount: 200, spread: 90 });
      toast(`Game over! ${triviaScore}/${triviaQuestions.length} correct (${pct}%)`);
    }
  }

  // Charades
  async function generateCharades(useGrok = false) {
    setIsGenerating(true);
    if (useGrok) {
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "charades", params: { count: 8, category: charadesCategory } }),
        });
        const json = await res.json();
        if (json.error) throw new Error(json.error);
        if (json.data?.prompts) {
          setCharadesPrompts(json.data.prompts);
          resetCharades();
          toast.success(`Grok wrote ${json.data.prompts.length} prompts!`);
          setIsGenerating(false);
          return;
        }
      } catch (e: any) {
        toast.error(e.message || "Grok failed — local prompts instead");
      }
    }
    // Local
    const localPrompts = [
      "Grok trying to explain quantum physics to a cat",
      "Elon Musk discovering the xAI logo is a cat",
      "An AI writing its resignation letter",
      "Trying to use Grok to decide what to have for dinner",
      "A developer explaining their 47 microservices to their mom",
      "Grok winning at charades but refusing to tell you how",
    ].sort(() => Math.random() - 0.5).slice(0, 8);
    setCharadesPrompts(localPrompts);
    resetCharades();
    setIsGenerating(false);
  }

  function resetCharades() {
    setCharadesIndex(0);
    setCharadesTimer(60);
    setCharadesRunning(false);
  }

  function toggleCharadesTimer() {
    if (charadesPrompts.length === 0) return;
    setCharadesRunning(!charadesRunning);
  }

  function nextCharades() {
    if (charadesIndex < charadesPrompts.length - 1) {
      setCharadesIndex((i) => i + 1);
      setCharadesTimer(60);
      setCharadesRunning(false);
    } else {
      confetti({ particleCount: 150, spread: 80 });
      toast("Prompt deck finished! Great round.");
      setCharadesRunning(false);
    }
  }

  // Would You Rather
  async function generateWyr(useGrok = false) {
    setIsGenerating(true);
    if (useGrok) {
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "would-you-rather", params: { count: 6 } }),
        });
        const json = await res.json();
        if (json.error) throw new Error(json.error);
        if (json.data?.questions) {
          setWyrQuestions(json.data.questions);
          setWyrIndex(0);
          setWyrVotes({ a: 0, b: 0 });
          toast.success("Fresh dilemmas from Grok");
          setIsGenerating(false);
          return;
        }
      } catch (e: any) {
        toast.error("Falling back to local WYR");
      }
    }
    const local = [
      { a: "Have Grok as your only search engine for a year", b: "Have perfect memory but never be able to use Google again" },
      { a: "Live in a world where every joke is explained by Grok", b: "Live in a world where Grok only speaks in riddles" },
      { a: "Be the person who always wins at game night", b: "Be the person who brings the best snacks" },
    ];
    setWyrQuestions(local);
    setWyrIndex(0);
    setWyrVotes({ a: 0, b: 0 });
    setIsGenerating(false);
  }

  function voteWyr(which: "a" | "b") {
    setWyrVotes((v) => ({ ...v, [which]: v[which] + 1 }));
    if (wyrIndex < wyrQuestions.length - 1) {
      setTimeout(() => setWyrIndex((i) => i + 1), 420);
    } else {
      confetti({ particleCount: 90, spread: 60 });
      toast("Debate complete. Democracy wins.");
    }
  }

  // Scoreboard
  function addPlayer() {
    const name = newPlayerName.trim();
    if (!name) return;
    const newP: Player = {
      id: Date.now(),
      name,
      score: 0,
    };
    setScoreboard((s) => [...s, newP]);
    setNewPlayerName("");
    toast.success(`Added ${name}`);
  }

  function changeScore(id: number, delta: number) {
    setScoreboard((s) =>
      s.map((p) => (p.id === id ? { ...p, score: Math.max(0, p.score + delta) } : p))
    );
    if (delta > 0) {
      confetti({ particleCount: 40, spread: 45, origin: { y: 0.8 } });
    }
  }

  function removePlayer(id: number) {
    setScoreboard((s) => s.filter((p) => p.id !== id));
  }

  function resetScores() {
    setScoreboard((s) => s.map((p) => ({ ...p, score: 0 })));
    toast("Scores reset for a fresh night");
  }

  function sortPlayers() {
    setScoreboard((s) => [...s].sort((a, b) => b.score - a.score));
  }

  // Custom Grok game
  async function generateCustom() {
    if (!customPrompt.trim()) {
      toast.error("Describe the kind of game you want");
      return;
    }
    setIsGenerating(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "custom",
          params: { prompt: customPrompt.trim() },
        }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setCustomResult(json.data || json);
      confetti({ particleCount: 70, spread: 55 });
    } catch (e: any) {
      toast.error(e.message || "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  }

  const currentTrivia = triviaQuestions[triviaIndex];
  const currentCharade = charadesPrompts[charadesIndex];
  const currentWyr = wyrQuestions[wyrIndex];

  const hasApiKey = typeof window !== "undefined" && false; // we detect on server

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-400 via-fuchsia-400 to-cyan-400 flex items-center justify-center">
                <Dice5 className="w-5 h-5 text-black" />
              </div>
              <div>
                <div className="font-semibold tracking-tight text-xl">Grok Game Night</div>
                <div className="text-[10px] text-zinc-500 -mt-1">POWERED BY xAI</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <button
              onClick={dealRandomGame}
              className="game-btn-secondary flex items-center gap-2 px-4 h-9 rounded-full text-sm"
            >
              <Sparkles className="w-4 h-4" /> Deal random game
            </button>
            <a
              href="https://github.com/1MORLAP/grok-game-night"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 transition px-3"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
          </div>
        </div>

        {/* Mode nav */}
        <div className="border-t border-zinc-800 bg-zinc-950">
          <div className="max-w-5xl mx-auto px-6 flex gap-1 overflow-x-auto py-2 text-sm">
            {[
              { id: "picker", label: "Quick Picker", icon: Dice5 },
              { id: "trivia", label: "Grok Trivia", icon: Brain },
              { id: "charades", label: "Prompt Party", icon: Users },
              { id: "wyr", label: "Would You Rather", icon: Sparkles },
              { id: "scoreboard", label: "Scoreboard", icon: Trophy },
              { id: "custom", label: "Grok Custom", icon: Star },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setMode(id as GameMode)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full whitespace-nowrap transition ${
                  mode === id
                    ? "bg-zinc-800 text-white"
                    : "hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        {/* HERO / status bar */}
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <div className="uppercase tracking-[3px] text-xs text-zinc-500 mb-1">FRIDAY • FRIENDS • FUN</div>
            <h1 className="text-5xl font-semibold tracking-tighter">Let's play.</h1>
          </div>
          <div className="text-right text-sm text-zinc-500 max-w-[260px]">
            Real Grok generations available when you set <span className="font-mono text-accent">XAI_API_KEY</span> in <span className="font-mono">.env.local</span>
          </div>
        </div>

        {/* PICKER */}
        {mode === "picker" && (
          <div>
            <div className="game-card rounded-3xl p-8 mb-6">
              <div className="flex items-center gap-3 mb-6">
                <Dice5 className="w-6 h-6 accent" />
                <div className="font-semibold text-2xl tracking-tight">Quick Game Picker</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-xs uppercase tracking-widest text-zinc-500 mb-2">PLAYERS</div>
                  <div className="flex items-center gap-4">
                    <button onClick={() => setPlayersCount(Math.max(2, playersCount - 1))} className="game-btn-secondary w-10 h-10 rounded-full flex items-center justify-center">-</button>
                    <div className="text-5xl font-semibold tabular-nums w-16 text-center">{playersCount}</div>
                    <button onClick={() => setPlayersCount(Math.min(14, playersCount + 1))} className="game-btn-secondary w-10 h-10 rounded-full flex items-center justify-center">+</button>
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-widest text-zinc-500 mb-2">MAX MINUTES</div>
                  <input
                    type="range"
                    min={5}
                    max={45}
                    step={5}
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    className="w-full accent-violet-400"
                  />
                  <div className="text-4xl font-semibold tabular-nums mt-1">{duration} min</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-widest text-zinc-500 mb-2">VIBE</div>
                  <div className="flex flex-wrap gap-2">
                    {VIBES.map((v) => (
                      <button
                        key={v}
                        onClick={() => setVibe(v)}
                        className={`px-5 py-2 rounded-full text-sm border transition ${vibe === v ? "border-accent bg-zinc-900" : "border-zinc-800 hover:border-zinc-700"}`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button onClick={pickGames} className="game-btn flex-1 h-14 rounded-2xl text-lg flex items-center justify-center gap-2">
                  <Play className="w-5 h-5" /> Pick games for us
                </button>
                <button onClick={dealRandomGame} className="game-btn-secondary flex-1 h-14 rounded-2xl text-lg flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5" /> Surprise me
                </button>
              </div>
            </div>

            {pickedGames.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="font-medium text-sm text-zinc-400">RECOMMENDED FOR THIS CREW</div>
                  <button onClick={pickGames} className="text-xs flex items-center gap-1 text-accent hover:underline">
                    <RotateCcw className="w-3.5 h-3.5" /> reroll
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {pickedGames.map((g, i) => (
                    <div key={i} className="game-card rounded-2xl p-5 flex flex-col">
                      <div className="font-semibold text-lg tracking-tight mb-1">{g.name}</div>
                      <div className="text-sm text-zinc-400 mb-3 flex-1">{g.desc}</div>
                      <div className="flex gap-2 text-xs">
                        <span className="tag">{g.players} players</span>
                        <span className="tag">{g.time}</span>
                        <span className="tag">{g.energy}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TRIVIA */}
        {mode === "trivia" && (
          <div className="game-card rounded-3xl p-8">
            <div className="flex justify-between items-start mb-8">
              <div>
                <div className="flex items-center gap-3">
                  <Brain className="w-6 h-6 accent" />
                  <div className="text-2xl font-semibold tracking-tight">Grok Trivia</div>
                </div>
                <div className="text-zinc-400 mt-1">Answer fast. Grok knows things.</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-zinc-500">SCORE</div>
                <div className="text-4xl font-semibold tabular-nums">{triviaScore}<span className="text-base text-zinc-500">/{triviaQuestions.length || 5}</span></div>
              </div>
            </div>

            {!triviaQuestions.length ? (
              <div className="text-center py-10">
                <button onClick={() => generateTrivia(false)} disabled={isGenerating} className="game-btn px-10 h-14 rounded-2xl text-lg">Start Local Trivia</button>
                <div className="mt-4">
                  <button onClick={() => generateTrivia(true)} disabled={isGenerating} className="text-sm underline-offset-4 hover:underline text-accent flex items-center gap-1 mx-auto">
                    <Sparkles className="w-4 h-4" /> Generate fresh set with Grok
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm text-zinc-400">
                  QUESTION {triviaIndex + 1} / {triviaQuestions.length}
                </div>

                <div className="text-2xl font-medium tracking-tight mb-6 min-h-[72px]">{currentTrivia?.q}</div>

                <div className="grid grid-cols-1 gap-3">
                  {currentTrivia?.options.map((opt, idx) => {
                    const isCorrect = idx === currentTrivia.correct;
                    const isSelected = idx === triviaSelected;
                    let cls = "game-btn-secondary text-left h-auto py-4 px-5 rounded-2xl text-lg";
                    if (triviaRevealed) {
                      if (isCorrect) cls = "bg-emerald-500/10 border-emerald-500/60 text-emerald-400";
                      else if (isSelected) cls = "bg-red-500/10 border-red-500/50 text-red-400";
                    } else if (isSelected) {
                      cls = "border-accent bg-zinc-900";
                    }
                    return (
                      <button key={idx} disabled={triviaRevealed} onClick={() => selectTriviaAnswer(idx)} className={cls}>
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {triviaRevealed && currentTrivia?.fact && (
                  <div className="mt-4 text-sm p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400">{currentTrivia.fact}</div>
                )}

                <div className="flex gap-3 mt-8">
                  <button onClick={nextTrivia} disabled={!triviaRevealed} className="game-btn flex-1 h-12 rounded-2xl disabled:opacity-50">Next Question</button>
                  <button onClick={() => generateTrivia(false)} className="game-btn-secondary px-6 rounded-2xl">New Deck</button>
                  <button onClick={() => generateTrivia(true)} disabled={isGenerating} className="game-btn-secondary flex items-center gap-2 px-5 rounded-2xl">
                    <Sparkles className="w-4 h-4" /> Grok
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CHARADES / PROMPT PARTY */}
        {mode === "charades" && (
          <div className="game-card rounded-3xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 accent2" />
                <div>
                  <div className="text-2xl font-semibold tracking-tight">Prompt Party</div>
                  <div className="text-sm text-zinc-400">Charades, but make it 2026</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={charadesCategory}
                  onChange={(e) => setCharadesCategory(e.target.value)}
                  className="bg-zinc-900 border border-zinc-700 rounded-full px-4 py-1 text-sm"
                >
                  {CHARADES_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {!charadesPrompts.length ? (
              <div className="py-10 text-center">
                <button onClick={() => generateCharades(false)} className="game-btn px-10 h-14 rounded-2xl text-lg">Load Prompts</button>
                <div className="mt-3">
                  <button onClick={() => generateCharades(true)} className="text-accent text-sm flex gap-1 items-center mx-auto hover:underline"><Sparkles className="w-4 h-4"/> Use Grok</button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="uppercase text-xs tracking-[2px] text-zinc-500 mb-3">PROMPT {charadesIndex + 1} / {charadesPrompts.length}</div>

                <div className="min-h-[140px] flex items-center justify-center">
                  <div className="text-4xl sm:text-5xl font-semibold tracking-tighter leading-none px-6">{currentCharade}</div>
                </div>

                <div className="mt-8 flex items-center justify-center gap-4">
                  <button onClick={toggleCharadesTimer} className="game-btn h-14 w-14 rounded-full flex items-center justify-center">
                    {charadesRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                  </button>

                  <div className="font-mono text-7xl tabular-nums w-28 text-center tracking-[-3px]">{charadesTimer}</div>

                  <button onClick={nextCharades} className="game-btn-secondary h-14 px-8 rounded-full flex items-center gap-2">
                    <SkipForward className="w-4 h-4" /> NEXT
                  </button>
                </div>

                <div className="mt-6 flex justify-center gap-3">
                  <button onClick={resetCharades} className="text-xs text-zinc-400 hover:text-white">Reset round</button>
                  <button onClick={() => generateCharades(true)} className="text-xs text-accent flex items-center gap-1"><Sparkles className="w-3.5 h-3.5"/> New Grok deck</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* WOULD YOU RATHER */}
        {mode === "wyr" && (
          <div className="game-card rounded-3xl p-8 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <Sparkles className="w-6 h-6 accent3" />
              <div className="text-2xl font-semibold tracking-tight">Would You Rather</div>
            </div>

            {!wyrQuestions.length ? (
              <div className="text-center py-8">
                <button onClick={() => generateWyr(false)} className="game-btn h-14 px-10 rounded-2xl">Start</button>
                <p className="mt-3 text-sm"><button onClick={() => generateWyr(true)} className="text-accent underline">Generate with Grok</button></p>
              </div>
            ) : (
              <>
                <div className="text-center mb-4 text-sm text-zinc-400">DILEMMA {wyrIndex + 1} / {wyrQuestions.length}</div>
                <div className="space-y-3">
                  <button onClick={() => voteWyr("a")} className="game-btn w-full h-20 rounded-2xl text-xl px-8 text-left">{currentWyr?.a}</button>
                  <div className="text-center text-xs text-zinc-500 py-1">OR</div>
                  <button onClick={() => voteWyr("b")} className="game-btn w-full h-20 rounded-2xl text-xl px-8 text-left bg-[#67e8f9] hover:bg-[#a5f3fc] text-black">{currentWyr?.b}</button>
                </div>

                <div className="mt-6 flex justify-between text-sm text-zinc-400">
                  <div>A votes: <span className="font-mono text-white">{wyrVotes.a}</span></div>
                  <div>B votes: <span className="font-mono text-white">{wyrVotes.b}</span></div>
                </div>

                <button onClick={() => generateWyr(true)} disabled={isGenerating} className="mt-8 text-xs text-accent flex items-center gap-1 mx-auto">
                  <Sparkles className="w-3.5 h-3.5" /> More Grok dilemmas
                </button>
              </>
            )}
          </div>
        )}

        {/* SCOREBOARD */}
        {mode === "scoreboard" && (
          <div className="game-card rounded-3xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Trophy className="w-6 h-6 accent" />
                <div className="text-2xl font-semibold tracking-tight">Live Scoreboard</div>
              </div>
              <div className="flex gap-2">
                <button onClick={sortPlayers} className="game-btn-secondary px-4 h-9 rounded-full text-sm flex items-center gap-1"><Trophy className="w-4 h-4" /> Sort</button>
                <button onClick={resetScores} className="game-btn-secondary px-4 h-9 rounded-full text-sm">Reset</button>
              </div>
            </div>

            <div className="space-y-2 mb-8">
              {scoreboard
                .sort((a, b) => b.score - a.score)
                .map((player, idx) => (
                  <div key={player.id} className="flex items-center gap-3 bg-zinc-900/60 rounded-2xl px-5 h-16 group">
                    <div className="w-6 text-right font-mono text-xs text-zinc-500">{idx + 1}</div>
                    <div className="flex-1 font-medium text-lg">{player.name}</div>
                    <div className="font-mono text-4xl tabular-nums w-16 text-right pr-1">{player.score}</div>
                    <div className="flex gap-1 opacity-80 group-hover:opacity-100">
                      <button onClick={() => changeScore(player.id, -1)} className="w-9 h-9 rounded-full bg-zinc-800 hover:bg-red-500/20 active:bg-red-500/30 flex items-center justify-center"><Minus className="w-4 h-4" /></button>
                      <button onClick={() => changeScore(player.id, 1)} className="w-9 h-9 rounded-full bg-zinc-800 hover:bg-emerald-500/20 active:bg-emerald-500/30 flex items-center justify-center"><Plus className="w-4 h-4" /></button>
                      {scoreboard.length > 1 && (
                        <button onClick={() => removePlayer(player.id)} className="w-9 h-9 rounded-full bg-zinc-800 hover:bg-zinc-700 text-xs ml-1">×</button>
                      )}
                    </div>
                  </div>
                ))}
            </div>

            <div className="flex gap-2">
              <input
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addPlayer()}
                placeholder="New player name"
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-5 h-12 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
              />
              <button onClick={addPlayer} className="game-btn px-8 rounded-2xl">Add</button>
            </div>
            <p className="text-center text-xs text-zinc-500 mt-3">Scores are saved in your browser for this device.</p>
          </div>
        )}

        {/* CUSTOM GROK GENERATOR */}
        {mode === "custom" && (
          <div className="max-w-xl mx-auto">
            <div className="game-card rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-4">
                <Star className="w-6 h-6 accent3" />
                <div className="text-2xl font-semibold tracking-tight">Ask Grok for a game</div>
              </div>
              <p className="text-zinc-400 mb-6">Describe any vibe, theme, or constraint. Grok will invent a short game on the spot.</p>

              <div className="flex gap-2">
                <input
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && generateCustom()}
                  placeholder="e.g. a 5-minute game about terrible superpowers"
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-5 h-12"
                />
                <button onClick={generateCustom} disabled={isGenerating || !customPrompt.trim()} className="game-btn px-8 rounded-2xl disabled:opacity-60">Generate</button>
              </div>

              {customResult && (
                <div className="mt-8 border border-zinc-800 rounded-2xl p-6 bg-black/30">
                  <div className="font-semibold text-xl mb-1">{customResult.title}</div>
                  <div className="text-zinc-300 whitespace-pre-wrap text-[15px] leading-snug mb-5">{customResult.rules}</div>

                  {customResult.examples && (
                    <div>
                      <div className="uppercase text-xs tracking-widest mb-2 text-zinc-500">EXAMPLES</div>
                      <ul className="space-y-2 text-sm">
                        {customResult.examples.map((ex: string, i: number) => (
                          <li key={i} className="pl-4 border-l-2 border-accent/40">• {ex}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
            <p className="text-center mt-4 text-xs text-zinc-500">Requires XAI_API_KEY. Results are creative and sometimes unhinged in the best way.</p>
          </div>
        )}
      </main>

      <footer className="border-t border-zinc-800 py-6 text-xs text-center text-zinc-500">
        Built for game night. <span className="text-zinc-400">Made with Grok • xAI</span> • <a href="https://github.com/1MORLAP/grok-game-night" className="hover:text-zinc-300 underline-offset-2">Source</a>
      </footer>
    </div>
  );
}
