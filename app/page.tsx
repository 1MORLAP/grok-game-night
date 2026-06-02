"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Play, Pause, SkipForward, RotateCcw, Plus, X, Unlock, Lock, 
  Users, Trophy, Info, Volume2, VolumeX 
} from "lucide-react";
import { toast } from "sonner";

// ============ TYPES & CONSTANTS ============

type GameId = 'bowling' | 'pool' | 'ping-pong' | 'foosball' | 'dominoes';
type RoundNum = 1 | 2 | 3 | 4 | 5;

interface MatchEntry {
  round: RoundNum;
  game: GameId;
  teamA: string[];
  teamB: string[];
  scoreA: number | null;
  scoreB: number | null;
  locked: boolean;
}

const GAMES: { id: GameId; label: string; icon: string; neon: string }[] = [
  { id: 'bowling', label: 'Bowling', icon: '🎳', neon: 'cyan' },
  { id: 'pool', label: 'Pool Table', icon: '🎱', neon: 'lime' },
  { id: 'ping-pong', label: 'Ping Pong', icon: '🏓', neon: 'magenta' },
  { id: 'foosball', label: 'Foosball', icon: '⚽', neon: 'yellow' },
  { id: 'dominoes', label: 'Dominoes', icon: '🁣', neon: 'orange' },
];

const ROUND_LABELS = [1, 2, 3, 4, 5] as const;
const ROUND_TIME = 25 * 60;
const BREAK_TIME = 5 * 60;

const EVENT_INFO = {
  title: "GAME NIGHT",
  date: "SATURDAY JUNE 6, 2026",
  time: "5:00 PM — 9:00 PM",
  venue: "THE BOWLING AREA",
  hosts: "PARAISO BAY & GRAN PARAISO WELLNESS GROUP",
};

const RULES = [
  "Five 25-minute rounds. One game per round per team pair.",
  "5-minute breaks between rounds — hydrate and reset.",
  "Each round you will be assigned to one of the five stations.",
  "Play hard, cheer louder, keep it friendly.",
  "At the end of each round, captains report scores here.",
  "Have fun. This is for the group.",
];

// ============ HELPERS ============

function normalizeName(n: string): string {
  return n.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function isTomasz(name: string): boolean {
  return normalizeName(name) === 'tomasz';
}

function formatMMSS(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function getEntryKey(round: RoundNum, game: GameId) {
  return `${round}-${game}`;
}

function getNeonClass(gameId: GameId) {
  const g = GAMES.find(x => x.id === gameId)!;
  return `neon-border-${g.neon} game-${g.id === 'ping-pong' ? 'pingpong' : g.id}`;
}

// ============ MAIN COMPONENT ============

export default function ParaisoGameNight() {
  // --- Identity (name is optional for access; "Guest" default allows anyone in immediately) ---
  const [currentName, setCurrentName] = useState<string>("");
  const [showNameEditor, setShowNameEditor] = useState(false);
  const [editingName, setEditingName] = useState("");
  const isAdmin = currentName ? isTomasz(currentName) : false;

  // --- Roster (known players for pickers) ---
  const [roster, setRoster] = useState<string[]>([]);

  // --- Match entries ---
  const [entries, setEntries] = useState<MatchEntry[]>([]);

  // --- Timer / Round state ---
  const [currentRound, setCurrentRound] = useState<0 | RoundNum>(0);
  const [isBreak, setIsBreak] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [startedRounds, setStartedRounds] = useState<RoundNum[]>([]);

  // --- UI state ---
  const [view, setView] = useState<'intro' | 'games' | 'scorecard'>('intro');
  const [selectedRound, setSelectedRound] = useState<RoundNum>(1);
  const [selectedGame, setSelectedGame] = useState<GameId>('bowling');

  // --- Team builders for current slot (ephemeral until saved) ---
  const [teamA, setTeamA] = useState<string[]>([]);
  const [teamB, setTeamB] = useState<string[]>([]);
  const [scoreA, setScoreA] = useState<number | null>(null);
  const [scoreB, setScoreB] = useState<number | null>(null);

  // --- Sounds ---
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);

  // --- Derived ---
  const maxStarted = startedRounds.length > 0 ? Math.max(...startedRounds) : 0;

  const canEnterNames = (r: RoundNum) => r === 1 || r <= maxStarted + 1;
  const canEnterScores = (r: RoundNum) => r <= maxStarted;

  const currentEntry = useMemo(() => {
    return entries.find(e => e.round === selectedRound && e.game === selectedGame) || null;
  }, [entries, selectedRound, selectedGame]);

  const isSlotLocked = !!(currentEntry?.locked && !isAdmin);
  const namesLocked = isSlotLocked;
  const scoresAllowed = canEnterScores(selectedRound) && (!currentEntry?.locked || isAdmin);

  const totalSlots = 25;
  const completedSlots = entries.filter(e => e.scoreA != null && e.scoreB != null).length;

  // Leaderboard computation
  const leaderboard = useMemo(() => {
    const playerTotals: Record<string, { round: number[]; total: number; games: number }> = {};

    // Seed from roster + any names that appear in entries
    const allNames = new Set<string>(roster);
    entries.forEach(e => {
      e.teamA.forEach(n => allNames.add(n));
      e.teamB.forEach(n => allNames.add(n));
    });

    allNames.forEach(name => {
      playerTotals[name] = { round: [0,0,0,0,0], total: 0, games: 0 };
    });

    entries.forEach(entry => {
      const rIdx = entry.round - 1;
      const hasScores = entry.scoreA != null && entry.scoreB != null;
      if (!hasScores) return;

      entry.teamA.forEach(name => {
        if (!playerTotals[name]) playerTotals[name] = { round: [0,0,0,0,0], total: 0, games: 0 };
        const val = entry.scoreA!;
        playerTotals[name].round[rIdx] += val;
        playerTotals[name].total += val;
        playerTotals[name].games += 1;
      });
      entry.teamB.forEach(name => {
        if (!playerTotals[name]) playerTotals[name] = { round: [0,0,0,0,0], total: 0, games: 0 };
        const val = entry.scoreB!;
        playerTotals[name].round[rIdx] += val;
        playerTotals[name].total += val;
        playerTotals[name].games += 1;
      });
    });

    return Object.entries(playerTotals)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total);
  }, [entries, roster]);

  // Round completion (for checkmarks)
  const roundComplete = (r: RoundNum) => {
    return GAMES.every(g => {
      const e = entries.find(x => x.round === r && x.game === g.id);
      return !!e && e.scoreA != null && e.scoreB != null;
    });
  };

  // ============ PERSISTENCE ============
  const saveAll = useCallback((partial?: any) => {
    try {
      if (partial?.roster) localStorage.setItem('gn-roster', JSON.stringify(partial.roster));
      if (partial?.entries) localStorage.setItem('gn-entries', JSON.stringify(partial.entries));
      if (partial?.timer) localStorage.setItem('gn-timer', JSON.stringify(partial.timer));
      if (partial?.sound != null) localStorage.setItem('gn-sound', JSON.stringify(partial.sound));
      if (partial?.currentName) localStorage.setItem('gn-current-name', partial.currentName);
    } catch {}
  }, []);

  // Hydrate on mount
  useEffect(() => {
    try {
      const savedName = localStorage.getItem('gn-current-name') || "";
      if (savedName) {
        setCurrentName(savedName);
      } else {
        // Default to Guest so anyone can access the app immediately without a blocking gate
        const guest = "Guest";
        setCurrentName(guest);
        localStorage.setItem('gn-current-name', guest);
      }

      const savedRoster = localStorage.getItem('gn-roster');
      if (savedRoster) setRoster(JSON.parse(savedRoster));
      else {
        // Seed a couple for immediate play / testing. Include "Guest" so the default identity can be picked into teams right away.
        const seed = ["Guest", "Tomasz", "Alex", "Jordan", "Sam", "Taylor"];
        setRoster(seed);
        localStorage.setItem('gn-roster', JSON.stringify(seed));
      }

      const savedEntries = localStorage.getItem('gn-entries');
      if (savedEntries) setEntries(JSON.parse(savedEntries));

      const savedTimer = localStorage.getItem('gn-timer');
      if (savedTimer) {
        const t = JSON.parse(savedTimer);
        setCurrentRound(t.currentRound ?? 0);
        setIsBreak(!!t.isBreak);
        setTimeRemaining(t.timeRemaining ?? 0);
        setTimerRunning(false); // never auto-resume
        setStartedRounds(t.startedRounds ?? []);
      }

      const savedSound = localStorage.getItem('gn-sound');
      if (savedSound !== null) setSoundEnabled(JSON.parse(savedSound));
    } catch (e) {
      console.warn('hydrate failed', e);
    }
  }, []);

  // Persist key pieces when they change
  useEffect(() => {
    // Always persist (including the "Guest" default so reloads don't force re-entry)
    if (currentName) saveAll({ currentName });
  }, [currentName, saveAll]);

  useEffect(() => {
    saveAll({ roster });
  }, [roster, saveAll]);

  useEffect(() => {
    saveAll({ entries });
  }, [entries, saveAll]);

  useEffect(() => {
    saveAll({ 
      timer: { currentRound, isBreak, timeRemaining, startedRounds }
    });
  }, [currentRound, isBreak, timeRemaining, startedRounds, saveAll]);

  useEffect(() => {
    saveAll({ sound: soundEnabled });
  }, [soundEnabled, saveAll]);

  // ============ TIMER COUNTDOWN ============
  useEffect(() => {
    if (!timerRunning || timeRemaining <= 0) return;
    const id = setInterval(() => {
      setTimeRemaining(prev => {
        const next = prev - 1;
        if (next <= 0) {
          setTimerRunning(false);
          // gentle haptic-like feedback
          playSound('submit');
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [timerRunning, timeRemaining]);

  // ============ SOUNDS (Web Audio) ============
  function getAudio() {
    if (!audioCtx) {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (Ctx) {
        const ctx = new Ctx();
        setAudioCtx(ctx);
        return ctx;
      }
    }
    return audioCtx;
  }

  function playSound(type: 'tap' | 'tick' | 'submit' | 'scroll') {
    if (!soundEnabled) return;
    const ctx = getAudio();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filt = ctx.createBiquadFilter();

      if (type === 'tap') {
        osc.type = 'square';
        osc.frequency.value = 920;
        gain.gain.value = 0.22;
        filt.type = 'lowpass';
        filt.frequency.value = 1400;
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
        osc.start();
        osc.stop(ctx.currentTime + 0.09);
      } else if (type === 'tick') {
        osc.type = 'sawtooth';
        osc.frequency.value = 380 + Math.random() * 40;
        gain.gain.value = 0.12;
        filt.type = 'bandpass';
        filt.frequency.value = 620;
        filt.Q.value = 4;
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.06);
        osc.start();
        osc.stop(ctx.currentTime + 0.07);
      } else if (type === 'submit') {
        // two-tone success
        const o1 = ctx.createOscillator();
        const g1 = ctx.createGain();
        o1.type = 'sine'; o1.frequency.value = 680;
        g1.gain.value = 0.18;
        g1.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);
        o1.connect(g1); g1.connect(ctx.destination);
        o1.start(); o1.stop(ctx.currentTime + 0.24);

        const o2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        o2.type = 'sine'; o2.frequency.value = 920;
        g2.gain.value = 0.15;
        g2.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.32);
        o2.connect(g2); g2.connect(ctx.destination);
        o2.start(ctx.currentTime + 0.06); o2.stop(ctx.currentTime + 0.34);
        return;
      } else if (type === 'scroll') {
        osc.type = 'sine';
        osc.frequency.value = 240;
        gain.gain.value = 0.06;
        filt.type = 'lowpass'; filt.frequency.value = 800;
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);
        osc.start();
        osc.stop(ctx.currentTime + 0.045);
      }

      osc.connect(filt);
      filt.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
    } catch {}
  }

  // Throttled scroll tick
  const lastScrollTick = React.useRef(0);
  function onScrollTick() {
    const now = Date.now();
    if (now - lastScrollTick.current > 140) {
      lastScrollTick.current = now;
      playSound('scroll');
    }
  }

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    if (next) playSound('tap');
  };

  // ============ NAME (now optional — anyone can access immediately; defaults to "Guest") ============
  function startNameEdit() {
    setEditingName(currentName || "Guest");
    setShowNameEditor(true);
    playSound('tap');
  }

  function saveEditedName() {
    let name = editingName.trim();
    if (!name) name = "Guest";

    const wasAdmin = isTomasz(currentName);
    setCurrentName(name);

    if (!roster.includes(name) && name !== "Guest") {
      const newRoster = [...roster, name];
      setRoster(newRoster);
      saveAll({ roster: newRoster });
    }

    setShowNameEditor(false);
    playSound('tap');

    if (isTomasz(name) && !wasAdmin) {
      toast.success("Admin mode activated — timer + unlock controls enabled");
    }
  }

  function cancelNameEdit() {
    setShowNameEditor(false);
    playSound('tap');
  }

  // ============ DATA MUTATORS ============

  function addToRoster(name: string) {
    const clean = name.trim();
    if (!clean || roster.includes(clean)) return;
    const next = [...roster, clean];
    setRoster(next);
    playSound('tap');
  }

  function togglePlayerToTeam(name: string, team: 'A' | 'B') {
    if (namesLocked) return;

    const inA = teamA.includes(name);
    const inB = teamB.includes(name);

    if (team === 'A') {
      if (inA) {
        setTeamA(teamA.filter(n => n !== name));
      } else {
        setTeamB(teamB.filter(n => n !== name));
        setTeamA([...teamA, name]);
        playSound('tick');
      }
    } else {
      if (inB) {
        setTeamB(teamB.filter(n => n !== name));
      } else {
        setTeamA(teamA.filter(n => n !== name));
        setTeamB([...teamB, name]);
        playSound('tick');
      }
    }
  }

  function removeFromTeam(name: string, team: 'A' | 'B') {
    if (namesLocked) return;
    if (team === 'A') setTeamA(teamA.filter(n => n !== name));
    else setTeamB(teamB.filter(n => n !== name));
    playSound('tap');
  }

  function saveCurrentTeams() {
    if (!canEnterNames(selectedRound) && !isAdmin) {
      toast.error("Names for this round are locked until the previous round starts");
      return;
    }
    // Persist the current team selection as an entry (scores may be null)
    const newEntry: MatchEntry = {
      round: selectedRound,
      game: selectedGame,
      teamA: [...teamA],
      teamB: [...teamB],
      scoreA: currentEntry?.scoreA ?? null,
      scoreB: currentEntry?.scoreB ?? null,
      locked: currentEntry?.locked ?? false,
    };

    setEntries(prev => {
      const without = prev.filter(e => !(e.round === selectedRound && e.game === selectedGame));
      return [...without, newEntry];
    });
    playSound('tap');
    toast.success("Teams saved for this slot");
  }

  function submitScores() {
    if (!canEnterScores(selectedRound)) {
      toast.error("Scores open when the round starts");
      return;
    }
    if (scoreA == null || scoreB == null) {
      toast.error("Enter both team scores");
      return;
    }

    const finalTeamsA = teamA.length ? teamA : (currentEntry?.teamA ?? []);
    const finalTeamsB = teamB.length ? teamB : (currentEntry?.teamB ?? []);

    if (finalTeamsA.length === 0 || finalTeamsB.length === 0) {
      toast.error("Add at least one player to each team");
      return;
    }

    const newEntry: MatchEntry = {
      round: selectedRound,
      game: selectedGame,
      teamA: [...finalTeamsA],
      teamB: [...finalTeamsB],
      scoreA,
      scoreB,
      locked: !isAdmin, // non-admins lock it immediately
    };

    setEntries(prev => {
      const without = prev.filter(e => !(e.round === selectedRound && e.game === selectedGame));
      return [...without, newEntry];
    });

    playSound('submit');
    toast.success(`Scores saved — Round ${selectedRound} • ${GAMES.find(g=>g.id===selectedGame)!.label}`);

    // Auto-sync teams if they were pending
    if (teamA.length === 0 && finalTeamsA.length) setTeamA(finalTeamsA);
    if (teamB.length === 0 && finalTeamsB.length) setTeamB(finalTeamsB);
  }

  function unlockEntry() {
    if (!isAdmin || !currentEntry) return;
    setEntries(prev => prev.map(e => 
      (e.round === selectedRound && e.game === selectedGame)
        ? { ...e, locked: false }
        : e
    ));
    playSound('tap');
    toast("Entry unlocked — you can edit");
  }

  function lockEntry() {
    if (!isAdmin || !currentEntry) return;
    setEntries(prev => prev.map(e => 
      (e.round === selectedRound && e.game === selectedGame)
        ? { ...e, locked: true }
        : e
    ));
    playSound('tap');
    toast("Entry locked");
  }

  // Load entry into the form when selection or entries change
  useEffect(() => {
    const e = entries.find(x => x.round === selectedRound && x.game === selectedGame);
    if (e) {
      setTeamA(e.teamA);
      setTeamB(e.teamB);
      setScoreA(e.scoreA);
      setScoreB(e.scoreB);
    } else {
      setTeamA([]);
      setTeamB([]);
      setScoreA(null);
      setScoreB(null);
    }
  }, [selectedRound, selectedGame, entries]);

  // ============ TIMER CONTROLS (ADMIN) ============
  function startRound(round: RoundNum) {
    setCurrentRound(round);
    setIsBreak(false);
    setTimeRemaining(ROUND_TIME);
    setTimerRunning(true);
    setStartedRounds(prev => {
      const next = Array.from(new Set([...prev, round])).sort() as RoundNum[];
      return next;
    });
    playSound('submit');
    toast.success(`Round ${round} started — 25 minutes`);
  }

  function toggleTimerRun() {
    if (currentRound === 0) return;
    setTimerRunning(r => !r);
    playSound('tap');
  }

  function startBreakNow() {
    if (currentRound === 0) return;
    setIsBreak(true);
    setTimeRemaining(BREAK_TIME);
    setTimerRunning(true);
    playSound('submit');
    toast(`Break started after Round ${currentRound}`);
  }

  function endBreakStartNext() {
    const next = (currentRound as number) + 1 as RoundNum;
    if (next > 5) {
      setCurrentRound(5);
      setIsBreak(false);
      setTimeRemaining(0);
      setTimerRunning(false);
      toast("Event complete — great night!");
      return;
    }
    startRound(next);
  }

  function resetPhaseTime() {
    setTimeRemaining(isBreak ? BREAK_TIME : ROUND_TIME);
    playSound('tap');
  }

  // ============ ROUND / GAME SELECTION ============
  function selectRound(r: RoundNum) {
    setSelectedRound(r);
    playSound('tick');
    // if names not yet unlocked for this round, warn once
    if (!canEnterNames(r) && !isAdmin) {
      toast.info(`Round ${r} names unlock after Round ${r-1} starts`);
    }
  }

  function selectGame(g: GameId) {
    setSelectedGame(g);
    playSound('tick');
  }

  // Auto-save teams when they change (if names are allowed)
  useEffect(() => {
    if (!canEnterNames(selectedRound) && !isAdmin) return;
    // debounce-ish: only persist if we have a meaningful change vs stored
    const e = entries.find(x => x.round === selectedRound && x.game === selectedGame);
    const teamsChanged = 
      (e?.teamA?.join(',') !== teamA.join(',')) || 
      (e?.teamB?.join(',') !== teamB.join(','));
    if (teamsChanged && (teamA.length > 0 || teamB.length > 0 || e)) {
      // persist silently
      const newEntry: MatchEntry = {
        round: selectedRound,
        game: selectedGame,
        teamA: [...teamA],
        teamB: [...teamB],
        scoreA: e?.scoreA ?? null,
        scoreB: e?.scoreB ?? null,
        locked: e?.locked ?? false,
      };
      setEntries(prev => {
        const without = prev.filter(x => !(x.round === selectedRound && x.game === selectedGame));
        return [...without, newEntry];
      });
    }
  }, [teamA, teamB]); // eslint-disable-line

  // ============ RENDER ============

  const gameInfo = GAMES.find(g => g.id === selectedGame)!;
  const phaseLabel = currentRound === 0 
    ? "PRE-EVENT" 
    : isBreak ? `BREAK (AFTER R${currentRound})` : `ROUND ${currentRound}`;
  const timerColor = isBreak ? "neon-yellow" : "neon-lime";

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#f5f5f0] pb-20" onScroll={onScrollTick}>
      {/* STICKY TIMER + HEADER */}
      <div className="timer-bar sticky top-0 z-50 px-4 py-3 flex items-center gap-3 border-b border-[#3a3a35] bg-[#0a0a0a]">
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <div className={`font-poster text-3xl tracking-[-2px] ${timerColor}`}>{phaseLabel}</div>
            <div className="font-mono text-xs text-[#666] pt-1">JUNE 6 • BOWLING AREA</div>
          </div>
          <div className="font-poster text-[42px] leading-none tracking-[-3.5px] tabular-nums mt-[-4px]">
            {formatMMSS(timeRemaining)}
          </div>
        </div>

        {/* Admin timer controls */}
        {isAdmin && currentRound === 0 && (
          <button onClick={() => startRound(1)} className="font-brush text-sm px-5 py-2 border-2 border-white active:bg-white active:text-black rounded">START ROUND 1</button>
        )}

        {isAdmin && currentRound > 0 && (
          <div className="flex flex-col items-end gap-1 text-[10px]">
            <div className="flex gap-1">
              <button onClick={toggleTimerRun} className="px-3 py-1 border border-white/70 rounded flex items-center gap-1 active:bg-white/10">
                {timerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {timerRunning ? 'PAUSE' : 'RESUME'}
              </button>
              <button onClick={resetPhaseTime} className="px-3 py-1 border border-white/70 rounded flex items-center gap-1 active:bg-white/10">
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
            {!isBreak && (
              <button onClick={startBreakNow} className="text-[10px] px-3 py-0.5 border border-[#ffe24d] text-[#ffe24d] rounded active:bg-[#ffe24d]/10">START 5-MIN BREAK</button>
            )}
            {isBreak && (
              <button onClick={endBreakStartNext} className="text-[10px] px-3 py-0.5 border border-[#a3ff4d] text-[#a3ff4d] rounded active:bg-[#a3ff4d]/10">END BREAK — START R{currentRound + 1}</button>
            )}
          </div>
        )}

        {/* User + Sound (name is now editable; click to set/change so anyone can access without a blocking gate) */}
        <div className="flex flex-col items-end text-right text-xs leading-none gap-1 pl-2 border-l border-[#3a3a35] min-w-[92px]">
          {!showNameEditor ? (
            <div
              onClick={startNameEdit}
              className="flex items-center gap-1.5 cursor-pointer active:opacity-70"
              title="Click to set or change your name (used for teams & leaderboard)"
            >
              <span className="font-chalk text-sm text-[#ddd] underline decoration-dotted underline-offset-2">{currentName}</span>
              {isAdmin && <span className="admin-badge">ADMIN</span>}
              <span className="text-[8px] text-[#666]">edit</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 w-full">
              <input
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveEditedName();
                  if (e.key === 'Escape') cancelNameEdit();
                }}
                className="bg-[#111] border border-[#555] text-xs px-2 py-0.5 rounded font-chalk w-20 focus:outline-none focus:border-white"
                placeholder="Name"
                autoFocus
              />
              <button onClick={saveEditedName} className="text-[10px] px-1.5 py-px border border-[#a3ff4d] text-[#a3ff4d] rounded active:bg-[#a3ff4d]/10">OK</button>
              <button onClick={cancelNameEdit} className="text-[10px] px-1 py-px text-[#888]">×</button>
            </div>
          )}
          <button onClick={toggleSound} className="sound-toggle flex items-center gap-1 active:bg-[#222]">
            {soundEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
            SOUND
          </button>
        </div>
      </div>

      {/* VIEW SWITCHER */}
      <div className="flex border-b border-[#3a3a35] bg-[#111] sticky top-[72px] z-40">
        {[
          { id: 'intro', label: 'INTRO & RULES', icon: Info },
          { id: 'games', label: 'GAMES & SCORES', icon: Users },
          { id: 'scorecard', label: 'SCORECARD', icon: Trophy },
        ].map((v) => {
          const Icon = v.icon;
          const active = view === v.id;
          return (
            <button
              key={v.id}
              onClick={() => { setView(v.id as any); playSound('tap'); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs tracking-[1.5px] font-brush border-b-2 transition ${active ? 'border-white text-white' : 'border-transparent text-[#888] hover:text-[#ccc]'}`}
            >
              <Icon className="w-3.5 h-3.5" /> {v.label}
            </button>
          );
        })}
      </div>

      {/* ========== INTRO / RULES ========== */}
      {view === 'intro' && (
        <div className="max-w-2xl mx-auto px-5 pt-8 pb-12">
          <div className="text-center mb-8">
            <div className="font-brush text-[13px] tracking-[4px] text-[#888] mb-1">{EVENT_INFO.hosts}</div>
            <div className="poster-title text-7xl leading-none mb-1">{EVENT_INFO.title}</div>
            <div className="font-poster text-2xl tracking-[-1px] text-[#ddd]">{EVENT_INFO.date}</div>
            <div className="text-[#888] mt-1">{EVENT_INFO.time} • {EVENT_INFO.venue}</div>
          </div>

          <div className="chalkboard p-6 mb-8">
            <div className="font-brush text-xl mb-4 text-[#ddd]">STRUCTURE</div>
            <div className="grid grid-cols-1 gap-y-2 text-sm font-chalk">
              <div>5 ROUNDS — each 25 minutes long</div>
              <div>5-MINUTE BREAKS between rounds</div>
              <div>ONE GAME PER ROUND: Bowling, Pool, Ping Pong, Foosball, Dominoes</div>
              <div className="text-[#a3ff4d] mt-1">Round 1 names &amp; teams available immediately.</div>
              <div>Each next round’s assignments unlock when the previous round starts.</div>
            </div>
          </div>

          <div className="poster-card p-6 mb-8">
            <div className="font-brush text-xl mb-3 text-[#ddd]">THE RULES</div>
            <ul className="font-chalk space-y-3 text-[15px] leading-tight">
              {RULES.map((r, i) => <li key={i} className="pl-1">• {r}</li>)}
            </ul>
          </div>

          <div className="text-center text-[10px] text-[#555] font-mono tracking-widest">
            LOCAL DEVICE SHELL — READY FOR SHARED BACKEND LATER
          </div>
        </div>
      )}

      {/* ========== GAMES SCREEN ========== */}
      {view === 'games' && (
        <div className="max-w-2xl mx-auto px-4 pt-5 pb-16">
          {/* ROUND SELECTOR — slot machine style */}
          <div className="mb-2 flex items-center justify-between px-1">
            <div className="font-brush text-xs tracking-[2px] text-[#777]">SELECT ROUND</div>
            <div className="text-[10px] text-[#555] font-mono">NAMES UNLOCK 1 ROUND AHEAD • SCORES WHEN STARTED</div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 selector-scroll">
            {ROUND_LABELS.map((r) => {
              const started = startedRounds.includes(r);
              const unlocked = canEnterNames(r);
              const complete = roundComplete(r);
              const isActive = r === selectedRound;
              return (
                <button
                  key={r}
                  onClick={() => selectRound(r)}
                  className={`round-slot rounded-xl min-w-[78px] text-center active:scale-[0.985] ${isActive ? 'active' : ''} ${started ? '' : unlocked ? 'unlocked' : 'locked'}`}
                >
                  {r}
                  {complete && <div className="text-[10px] text-[#a3ff4d] mt-[-2px]">✓</div>}
                </button>
              );
            })}
          </div>

          {/* GAME SELECTOR */}
          <div className="mt-5 mb-2 px-1">
            <div className="font-brush text-xs tracking-[2px] text-[#777]">GAME FOR ROUND {selectedRound}</div>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {GAMES.map((g) => {
              const active = g.id === selectedGame;
              return (
                <button
                  key={g.id}
                  onClick={() => selectGame(g.id)}
                  className={`game-btn rounded-xl py-3 text-center text-[10px] leading-none active:scale-[0.985] ${active ? 'active' : ''} ${getNeonClass(g.id)}`}
                >
                  <div className="text-2xl mb-1">{g.icon}</div>
                  <div className="font-brush tracking-wide">{g.label.split(' ')[0]}</div>
                </button>
              );
            })}
          </div>

          {/* CURRENT SLOT FORM */}
          <div className={`mt-6 poster-card p-5 rounded-2xl ${getNeonClass(selectedGame)}`}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-3xl">{gameInfo.icon}</span>
              <div>
                <div className="font-brush text-xl leading-none">{gameInfo.label}</div>
                <div className="text-xs text-[#888]">ROUND {selectedRound} • {canEnterScores(selectedRound) ? 'SCORING OPEN' : 'WAITING FOR ROUND START'}</div>
              </div>
              {currentEntry?.locked && (
                <div className="ml-auto locked-indicator flex items-center gap-1 text-[#888]">
                  <Lock className="w-3 h-3" /> LOCKED
                </div>
              )}
            </div>

            {/* TEAMS */}
            <div className="mb-5">
              <div className="flex gap-4">
                {/* Team A */}
                <div className="flex-1">
                  <div className="font-brush text-xs tracking-[1px] mb-1.5 text-[#888]">TEAM A</div>
                  <div className="min-h-[52px] chalkboard rounded-xl p-2 flex flex-wrap gap-1.5">
                    {teamA.length === 0 && <div className="text-[#555] text-xs px-2 pt-1">No players yet</div>}
                    {teamA.map(name => (
                      <div key={name} className="player-chip text-sm">
                        {name}
                        {!namesLocked && <button onClick={() => removeFromTeam(name, 'A')} className="text-[#666]"><X className="w-3 h-3" /></button>}
                      </div>
                    ))}
                  </div>
                </div>
                {/* Team B */}
                <div className="flex-1">
                  <div className="font-brush text-xs tracking-[1px] mb-1.5 text-[#888]">TEAM B</div>
                  <div className="min-h-[52px] chalkboard rounded-xl p-2 flex flex-wrap gap-1.5">
                    {teamB.length === 0 && <div className="text-[#555] text-xs px-2 pt-1">No players yet</div>}
                    {teamB.map(name => (
                      <div key={name} className="player-chip text-sm">
                        {name}
                        {!namesLocked && <button onClick={() => removeFromTeam(name, 'B')} className="text-[#666]"><X className="w-3 h-3" /></button>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Roster picker */}
              {!namesLocked && (
                <div className="mt-3">
                  <div className="text-[10px] text-[#666] mb-1 px-0.5 font-mono tracking-widest">ROSTER — TAP TO ASSIGN</div>
                  <div className="flex flex-wrap gap-1.5">
                    {roster.map(name => {
                      const inA = teamA.includes(name);
                      const inB = teamB.includes(name);
                      const isYou = name === currentName;
                      return (
                        <button
                          key={name}
                          onClick={() => {
                            if (inA) togglePlayerToTeam(name, 'B');
                            else if (inB) togglePlayerToTeam(name, 'A');
                            else togglePlayerToTeam(name, 'A');
                          }}
                          className={`player-chip active:scale-[0.985] text-sm ${isYou ? 'ring-1 ring-offset-2 ring-offset-[#161613] ring-[#a3ff4d]' : ''} ${inA ? 'neon-border-cyan' : inB ? 'neon-border-lime' : ''}`}
                        >
                          {name}{isYou && <span className="text-[9px] opacity-60">(you)</span>}
                          {inA && <span className="text-[9px] text-[#67f6ff]">A</span>}
                          {inB && <span className="text-[9px] text-[#a3ff4d]">B</span>}
                        </button>
                      );
                    })}
                    {/* Add new */}
                    <AddPlayerInline onAdd={(n) => {
                      addToRoster(n);
                      // auto-assign to first empty team or A
                      if (teamA.length <= teamB.length) setTeamA([...teamA, n]);
                      else setTeamB([...teamB, n]);
                    }} />
                  </div>
                </div>
              )}
            </div>

            {/* SCORES */}
            <div>
              <div className="font-brush text-xs tracking-[1px] mb-1.5 text-[#888]">FINAL SCORES</div>
              <div className="flex items-center gap-3">
                <div>
                  <div className="text-[10px] text-[#666] mb-0.5">TEAM A</div>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={scoreA ?? ''}
                    onChange={e => setScoreA(e.target.value === '' ? null : Math.max(0, parseInt(e.target.value)))}
                    disabled={!scoresAllowed}
                    className="score-input rounded"
                    placeholder="—"
                  />
                </div>
                <div className="pt-5 text-[#555] font-poster text-xl">VS</div>
                <div>
                  <div className="text-[10px] text-[#666] mb-0.5">TEAM B</div>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={scoreB ?? ''}
                    onChange={e => setScoreB(e.target.value === '' ? null : Math.max(0, parseInt(e.target.value)))}
                    disabled={!scoresAllowed}
                    className="score-input rounded"
                    placeholder="—"
                  />
                </div>

                <div className="flex-1" />

                {currentEntry?.locked && isAdmin && (
                  <button onClick={unlockEntry} className="flex items-center gap-1 text-xs border border-[#a3ff4d] text-[#a3ff4d] px-3 py-2 rounded active:bg-[#a3ff4d]/10">
                    <Unlock className="w-3.5 h-3.5" /> UNLOCK
                  </button>
                )}
                {!currentEntry?.locked && isAdmin && currentEntry && (
                  <button onClick={lockEntry} className="flex items-center gap-1 text-xs border border-[#888] px-3 py-2 rounded active:bg-white/5">
                    <Lock className="w-3.5 h-3.5" /> LOCK
                  </button>
                )}
              </div>
            </div>

            {/* ACTIONS */}
            <div className="mt-5 flex gap-2">
              {!namesLocked && (
                <button onClick={saveCurrentTeams} className="flex-1 font-brush tracking-widest py-3 border-2 border-white text-sm active:bg-white active:text-black rounded">SAVE NAMES / TEAMS</button>
              )}
              <button
                onClick={submitScores}
                disabled={!scoresAllowed || scoreA == null || scoreB == null}
                className="flex-1 font-brush tracking-widest py-3 border-2 border-white bg-white text-black text-sm disabled:opacity-40 disabled:bg-transparent disabled:text-white active:bg-[#a3ff4d] active:border-[#a3ff4d] rounded"
              >
                SUBMIT SCORES {scoreA != null && scoreB != null ? `(${scoreA}–${scoreB})` : ''}
              </button>
            </div>
            <div className="text-center text-[10px] text-[#555] mt-2 font-mono">
              {isSlotLocked ? "LOCKED — only admin can change" : scoresAllowed ? "Entry will lock for non-admins after submit" : "Scores open once round starts"}
            </div>
          </div>
        </div>
      )}

      {/* ========== SCORECARD ========== */}
      {view === 'scorecard' && (
        <div className="max-w-3xl mx-auto px-4 pt-6 pb-16">
          <div className="flex items-baseline justify-between mb-3 px-1">
            <div>
              <div className="font-brush text-2xl">SCORECARD</div>
              <div className="text-xs text-[#777]">{completedSlots} / {totalSlots} GAMES RECORDED</div>
            </div>
            <div className="text-right text-xs text-[#666]">SORTED BY TOTAL • LOCAL ONLY</div>
          </div>

          {/* Round progress */}
          <div className="flex gap-2 mb-6">
            {[1,2,3,4,5].map(r => (
              <div key={r} className={`flex-1 text-center py-1.5 rounded border ${roundComplete(r as RoundNum) ? 'border-[#a3ff4d] bg-[#a3ff4d]/5' : 'border-[#3a3a35] bg-[#161613]'}`}>
                <div className="font-poster text-lg">R{r}</div>
                <div className="text-[10px] text-[#777] -mt-0.5">{roundComplete(r as RoundNum) ? 'COMPLETE ✓' : '—'}</div>
              </div>
            ))}
          </div>

          {/* Leaderboard */}
          {leaderboard.length === 0 && (
            <div className="chalkboard p-8 text-center text-[#888]">No scores yet. Play some games!</div>
          )}

          {leaderboard.length > 0 && (
            <div className="overflow-x-auto">
              <table className="scorecard-table w-full min-w-[620px]">
                <thead>
                  <tr>
                    <th className="text-left py-2 pl-2">PLAYER</th>
                    <th className="text-center">R1</th>
                    <th className="text-center">R2</th>
                    <th className="text-center">R3</th>
                    <th className="text-center">R4</th>
                    <th className="text-center">R5</th>
                    <th className="text-right pr-2">TOTAL</th>
                    <th className="text-right pr-1 text-[#666]">GAMES</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((row, idx) => (
                    <tr key={row.name} className="leaderboard-row">
                      <td className="py-2 pl-2 font-medium flex items-center gap-2">
                        {row.name}
                        {row.name === currentName && <span className="text-[9px] text-[#a3ff4d]">(you)</span>}
                      </td>
                      {row.round.map((pts, i) => (
                        <td key={i} className="text-center tabular-nums font-mono text-sm">{pts || '—'}</td>
                      ))}
                      <td className="text-right pr-2 font-poster text-xl tabular-nums">{row.total}</td>
                      <td className="text-right pr-2 text-xs text-[#666] font-mono">{row.games}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-8 text-center text-[10px] text-[#555]">Each player receives the full team score for every game they play.</div>
        </div>
      )}

      {/* Bottom hint bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-[#3a3a35] text-[10px] text-[#555] font-mono text-center py-1.5 tracking-widest">
        GAME NIGHT • {currentName}{isAdmin ? ' (ADMIN)' : ''} — tap name above to personalize
      </div>
    </div>
  );
}

// Small inline add player component
function AddPlayerInline({ onAdd }: { onAdd: (name: string) => void }) {
  const [val, setVal] = useState("");
  return (
    <div className="flex items-center gap-1 text-sm">
      <input
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && val.trim()) { onAdd(val); setVal(''); } }}
        placeholder="+ add"
        className="bg-[#222] border border-[#444] text-xs px-2 py-1 rounded w-20 focus:outline-none"
      />
      <button
        onClick={() => { if (val.trim()) { onAdd(val); setVal(''); } }}
        className="text-[#a3ff4d] px-1"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
