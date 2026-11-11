import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import {
  Play, Pause, RotateCcw, Trophy, Flame, CheckCircle2, ShieldCheck,
  Layers, GitBranch, RefreshCw, Zap, Clock, Activity, Target,
  HelpCircle, ChevronDown, ChevronUp, Cpu, Binary
} from 'lucide-react';
import { generateRandomPuzzle, generateByDifficulty, GOAL_STATE, pos } from '../utils/puzzleEngine';

const GOAL_KEY = GOAL_STATE.join(',');

const ALGOS = [
  { id: 'bfs', name: 'BFS', fullName: 'Breadth-First Search', color: '#0A84FF', structure: 'FIFO Queue', icon: Layers },
  { id: 'dfs', name: 'DFS', fullName: 'Depth-First Search', color: '#BF5AF2', structure: 'LIFO Stack', icon: GitBranch },
  { id: 'ids', name: 'IDS', fullName: 'Iterative Deepening', color: '#30D158', structure: 'Repeated DLS', icon: RefreshCw },
];

// Difficulty shuffles calibrated for snappy, engaging live races
const RACE_DIFFICULTY_SHUFFLES = {
  easy: 6,     // ~4-6 moves from goal -> resolves in 1-2 seconds
  medium: 10,  // ~7-10 moves from goal -> resolves in 2-4 seconds
  hard: 14,    // ~11-14 moves from goal -> resolves in 4-8 seconds
};

const SPEED_PRESETS = [
  { id: 'watch', label: 'Watch (Smooth)', batch: 2 },
  { id: 'fast', label: 'Fast (15x)', batch: 15 },
  { id: 'turbo', label: 'Turbo (60x)', batch: 60 },
  { id: 'hyperspeed', label: 'Hyperspeed (200x)', batch: 200 },
];

// Manhattan heuristic for informed DFS tie-breaking in 8-puzzle
function manhattan(state) {
  let dist = 0;
  for (let i = 0; i < 9; i++) {
    if (state[i] === 0) continue;
    const g = GOAL_STATE.indexOf(state[i]);
    const cp = pos(i), gp = pos(g);
    dist += Math.abs(cp.row - gp.row) + Math.abs(cp.col - gp.col);
  }
  return dist;
}

function getNeighbors(state) {
  const blank = state.indexOf(0);
  const row = Math.floor(blank / 3);
  const col = blank % 3;
  const moves = [];
  if (row > 0) { const s = [...state]; [s[blank], s[blank - 3]] = [s[blank - 3], s[blank]]; moves.push(s); }
  if (row < 2) { const s = [...state]; [s[blank], s[blank + 3]] = [s[blank + 3], s[blank]]; moves.push(s); }
  if (col > 0) { const s = [...state]; [s[blank], s[blank - 1]] = [s[blank - 1], s[blank]]; moves.push(s); }
  if (col < 2) { const s = [...state]; [s[blank], s[blank + 1]] = [s[blank + 1], s[blank]]; moves.push(s); }
  return moves;
}

// ─── Initializers ────────────────────────────────────────────────────────────

function initBfs(initial) {
  return {
    id: 'bfs',
    queue: [{ state: initial, depth: 0 }],
    visited: new Set([initial.join(',')]),
    current: [...initial],
    generated: 1,
    expanded: 0,
    maxDepth: 0,
    maxFrontier: 1,
    finished: false,
    success: false,
    time: 0,
    solutionCost: null,
    rank: null,
  };
}

function initDfs(initial, maxDepthLimit = 35) {
  return {
    id: 'dfs',
    stack: [{ state: initial, depth: 0, pathSet: new Set([initial.join(',')]) }],
    current: [...initial],
    generated: 1,
    expanded: 0,
    maxDepth: 0,
    maxFrontier: 1,
    finished: false,
    success: false,
    time: 0,
    solutionCost: null,
    rank: null,
    limit: maxDepthLimit,
  };
}

function initIds(initial) {
  return {
    id: 'ids',
    initialState: initial,
    depthLimit: 0,
    stack: [{ state: initial, depth: 0 }],
    visitedAtDepth: new Map([[initial.join(','), 0]]),
    current: [...initial],
    generated: 1,
    expanded: 0,
    maxDepth: 0,
    maxFrontier: 1,
    finished: false,
    success: false,
    time: 0,
    solutionCost: null,
    rank: null,
  };
}

// ─── Step Functions (Notice: ONLY takes (s, batch)) ──────────────────────────

function stepBfs(s, batch = 1) {
  if (s.finished) return;
  for (let i = 0; i < batch; i++) {
    if (s.queue.length === 0 || s.generated > 80000) {
      s.finished = true;
      s.success = false;
      return;
    }
    const node = s.queue.shift();
    s.expanded++;
    s.current = [...node.state];
    s.maxDepth = Math.max(s.maxDepth, node.depth);

    if (node.state.join(',') === GOAL_KEY) {
      s.finished = true;
      s.success = true;
      s.solutionCost = node.depth;
      s.current = [...GOAL_STATE];
      return;
    }

    for (const next of getNeighbors(node.state)) {
      const k = next.join(',');
      if (!s.visited.has(k)) {
        s.visited.add(k);
        s.generated++;
        s.queue.push({ state: next, depth: node.depth + 1 });
        s.maxFrontier = Math.max(s.maxFrontier, s.queue.length);
      }
    }
  }
}

function stepDfs(s, batch = 1) {
  if (s.finished) return;
  for (let i = 0; i < batch; i++) {
    if (s.stack.length === 0 || s.generated > 80000) {
      s.finished = true;
      s.success = false;
      return;
    }
    const node = s.stack.pop();
    s.expanded++;
    s.current = [...node.state];
    s.maxDepth = Math.max(s.maxDepth, node.depth);

    if (node.state.join(',') === GOAL_KEY) {
      s.finished = true;
      s.success = true;
      s.solutionCost = node.depth;
      s.current = [...GOAL_STATE];
      return;
    }

    if (node.depth < s.limit) {
      // Sort neighbors so best heuristic dives first
      const neighbors = getNeighbors(node.state).sort((a, b) => manhattan(b) - manhattan(a));
      for (const next of neighbors) {
        const k = next.join(',');
        if (!node.pathSet.has(k)) {
          s.generated++;
          const nextSet = new Set(node.pathSet);
          nextSet.add(k);
          s.stack.push({ state: next, depth: node.depth + 1, pathSet: nextSet });
          s.maxFrontier = Math.max(s.maxFrontier, s.stack.length);
        }
      }
    }
  }
}

function stepIds(s, batch = 1) {
  if (s.finished) return;
  for (let i = 0; i < batch; i++) {
    if (s.stack.length === 0) {
      s.depthLimit++;
      if (s.depthLimit > 35 || s.generated > 100000) {
        s.finished = true;
        s.success = false;
        return;
      }
      s.stack = [{ state: s.initialState, depth: 0 }];
      s.visitedAtDepth = new Map([[s.initialState.join(','), 0]]);
    }

    const node = s.stack.pop();
    s.expanded++;
    s.current = [...node.state];
    s.maxDepth = Math.max(s.maxDepth, node.depth);

    if (node.state.join(',') === GOAL_KEY) {
      s.finished = true;
      s.success = true;
      s.solutionCost = node.depth;
      s.current = [...GOAL_STATE];
      return;
    }

    if (node.depth < s.depthLimit) {
      for (const next of getNeighbors(node.state)) {
        const k = next.join(',');
        const prevDepth = s.visitedAtDepth.get(k);
        if (prevDepth === undefined || node.depth + 1 < prevDepth) {
          s.visitedAtDepth.set(k, node.depth + 1);
          s.generated++;
          s.stack.push({ state: next, depth: node.depth + 1 });
          s.maxFrontier = Math.max(s.maxFrontier, s.stack.length);
        }
      }
    }
  }
}

// ─── Live Mini Puzzle Board Component ────────────────────────────────────────

function LiveMiniBoard({ state, isGoal, color }) {
  return (
    <div
      className="p-3 rounded-[22px] transition-all duration-300 relative shadow-2xl flex flex-col items-center justify-center"
      style={{
        background: isGoal ? 'rgba(48,209,88,0.14)' : 'rgba(10,10,14,0.6)',
        border: isGoal ? '1.5px solid rgba(48,209,88,0.6)' : '0.5px solid rgba(255,255,255,0.14)',
        boxShadow: isGoal
          ? '0 0 30px rgba(48,209,88,0.3), inset 0 1px 1px rgba(255,255,255,0.2)'
          : '0 12px 32px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.1)',
        width: 195,
        height: 195,
      }}
    >
      <div className="grid gap-2 w-full h-full" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {state.map((tile, i) => {
          const isBlank = tile === 0;
          const isInPlace = tile !== 0 && tile === i + 1;
          return (
            <div
              key={i}
              className="rounded-[12px] flex items-center justify-center font-bold text-xl select-none transition-all duration-150"
              style={{
                background: isBlank
                  ? 'rgba(255,255,255,0.02)'
                  : isGoal && isInPlace
                    ? 'linear-gradient(180deg, rgba(48,209,88,0.45) 0%, rgba(48,209,88,0.2) 100%)'
                    : 'linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.04) 100%)',
                color: isBlank
                  ? 'transparent'
                  : isGoal && isInPlace
                    ? '#30D158'
                    : '#FFFFFF',
                border: isBlank
                  ? '1px dashed rgba(255,255,255,0.06)'
                  : isGoal && isInPlace
                    ? '1px solid rgba(48,209,88,0.7)'
                    : '0.5px solid rgba(255,255,255,0.16)',
                boxShadow: !isBlank
                  ? '0 3px 10px rgba(0,0,0,0.35), inset 0 1px 1px rgba(255,255,255,0.25)'
                  : 'none',
              }}
            >
              {!isBlank && tile}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Custom Tooltip for Recharts ─────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3.5 py-2.5 rounded-[14px] text-xs liquid-glass shadow-xl">
      <p className="label-secondary font-medium mb-1.5">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center justify-between gap-4 font-mono">
          <span style={{ color: p.fill }}>{p.name}:</span>
          <span className="font-bold label-primary">
            {typeof p.value === 'number' ? (p.value >= 1000 ? p.value.toLocaleString() : p.value.toFixed(1)) : '—'}
          </span>
        </div>
      ))}
    </div>
  );
};

// ─── Main Analytics & Live Race Component ────────────────────────────────────

export default function AnalyticsView() {
  const [difficulty, setDifficulty] = useState('medium');
  const [puzzle, setPuzzle] = useState(() => {
    const shuffles = RACE_DIFFICULTY_SHUFFLES.medium;
    return generateRandomPuzzle(shuffles);
  });
  const [speedId, setSpeedId] = useState('fast');
  const [stopOnFirstWin, setStopOnFirstWin] = useState(true);
  const [raceStatus, setRaceStatus] = useState('idle'); // 'idle' | 'running' | 'paused' | 'completed'
  const [showExplanation, setShowExplanation] = useState(false);

  // Search states
  const [bfsState, setBfsState] = useState(() => initBfs(puzzle));
  const [dfsState, setDfsState] = useState(() => initDfs(puzzle));
  const [idsState, setIdsState] = useState(() => initIds(puzzle));

  // Mutable refs for high frequency animation frame loop
  const bfsRef = useRef(bfsState);
  const dfsRef = useRef(dfsState);
  const idsRef = useRef(idsState);
  const animFrameRef = useRef(null);
  const startTimeRef = useRef(0);
  const finishOrderRef = useRef(0);

  // Keep refs in sync
  bfsRef.current = bfsState;
  dfsRef.current = dfsState;
  idsRef.current = idsState;

  // Selected comparison metric for chart
  const [selectedMetric, setSelectedMetric] = useState('time');

  // ─── Reset / New Puzzle ───────────────────────────────────────────────────

  const handleNewPuzzle = useCallback((newDiff = difficulty) => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    const shuffles = RACE_DIFFICULTY_SHUFFLES[newDiff] || 10;
    const newP = generateRandomPuzzle(shuffles);
    setPuzzle(newP);
    setRaceStatus('idle');
    finishOrderRef.current = 0;

    const b = initBfs(newP);
    const d = initDfs(newP);
    const i = initIds(newP);

    setBfsState(b);
    setDfsState(d);
    setIdsState(i);
  }, [difficulty]);

  // ─── Race Animation Loop (Immediate Stop on Solution) ──────────────────────

  const runRaceStep = useCallback(() => {
    const selectedPreset = SPEED_PRESETS.find(p => p.id === speedId) || SPEED_PRESETS[1];
    const now = performance.now();
    const elapsed = now - startTimeRef.current;

    const b = bfsRef.current;
    const d = dfsRef.current;
    const i = idsRef.current;

    // 1. Step BFS
    if (!b.finished) {
      stepBfs(b, selectedPreset.batch);
      if (b.finished) {
        b.time = elapsed; // Lock final time!
        if (b.success && !b.rank) {
          finishOrderRef.current++;
          b.rank = finishOrderRef.current;
        }
      } else {
        b.time = elapsed; // Live ticking time
      }
    }

    // 2. Step DFS
    if (!d.finished) {
      stepDfs(d, selectedPreset.batch);
      if (d.finished) {
        d.time = elapsed; // Lock final time!
        if (d.success && !d.rank) {
          finishOrderRef.current++;
          d.rank = finishOrderRef.current;
        }
      } else {
        d.time = elapsed; // Live ticking time
      }
    }

    // 3. Step IDS
    if (!i.finished) {
      stepIds(i, selectedPreset.batch);
      if (i.finished) {
        i.time = elapsed; // Lock final time!
        if (i.success && !i.rank) {
          finishOrderRef.current++;
          i.rank = finishOrderRef.current;
        }
      } else {
        i.time = elapsed; // Live ticking time
      }
    }

    // Check stop condition: either first solver achieves goal, or all finish
    const anySolved = b.success || d.success || i.success;
    const allFinished = b.finished && d.finished && i.finished;

    if ((stopOnFirstWin && anySolved) || allFinished) {
      // Lock remaining unfinished algorithms cleanly
      if (!b.finished) { b.finished = true; b.time = elapsed; }
      if (!d.finished) { d.finished = true; d.time = elapsed; }
      if (!i.finished) { i.finished = true; i.time = elapsed; }

      setBfsState({ ...b, current: [...b.current] });
      setDfsState({ ...d, current: [...d.current] });
      setIdsState({ ...i, current: [...i.current] });
      setRaceStatus('completed');

      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    // Otherwise, render live progression and request next frame
    setBfsState({ ...b, current: [...b.current] });
    setDfsState({ ...d, current: [...d.current] });
    setIdsState({ ...i, current: [...i.current] });

    animFrameRef.current = requestAnimationFrame(runRaceStep);
  }, [speedId, stopOnFirstWin]);

  // Start / Resume Race
  const startRace = () => {
    if (raceStatus === 'completed') {
      handleNewPuzzle(difficulty);
    }
    setRaceStatus('running');
    startTimeRef.current = performance.now();
    animFrameRef.current = requestAnimationFrame(runRaceStep);
  };

  // Pause Race
  const pauseRace = () => {
    setRaceStatus('paused');
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
  };

  // Stop / Reset Race
  const resetRace = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    handleNewPuzzle(difficulty);
  };

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Determine winner details
  const winnerEntry = [
    { config: ALGOS[0], s: bfsState },
    { config: ALGOS[1], s: dfsState },
    { config: ALGOS[2], s: idsState },
  ].find(item => item.s.rank === 1 && item.s.success);

  // ─── Chart Data ───────────────────────────────────────────────────────────

  const chartData = [
    { name: 'BFS', value: bfsState[selectedMetric] ?? 0, color: '#0A84FF', moves: bfsState.solutionCost },
    { name: 'DFS', value: dfsState[selectedMetric] ?? 0, color: '#BF5AF2', moves: dfsState.solutionCost },
    { name: 'IDS', value: idsState[selectedMetric] ?? 0, color: '#30D158', moves: idsState.solutionCost },
  ];

  return (
    <div className="min-h-screen pt-20 pb-24 px-6">
      <div className="max-w-6xl mx-auto py-4 flex flex-col gap-8">
        {/* Header Strip */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-400/20 mb-3">
              <Flame size={14} />
              <span>Live Concurrent Search Race</span>
            </div>
            <h2 className="text-3xl font-bold label-primary tracking-tight" style={{ letterSpacing: '-0.03em' }}>
              Live Algorithm Race
            </h2>
            <p className="text-xs sm:text-sm label-secondary mt-1">
              Watch BFS, DFS, and IDS actively solve the same permutation simultaneously in real time.
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Difficulty selector */}
            <div
              className="flex items-center gap-1 p-0.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.08)' }}
            >
              {['easy', 'medium', 'hard'].map(d => (
                <button
                  key={d}
                  onClick={() => {
                    setDifficulty(d);
                    handleNewPuzzle(d);
                  }}
                  disabled={raceStatus === 'running'}
                  className="px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all duration-150 cursor-pointer disabled:opacity-40"
                  style={difficulty === d ? {
                    background: '#0A84FF',
                    color: 'white',
                    boxShadow: '0 2px 8px rgba(10,132,255,0.4)',
                  } : { color: 'rgba(255,255,255,0.5)' }}
                >
                  {d}
                </button>
              ))}
            </div>

            {/* Speed selector */}
            <div
              className="flex items-center gap-1 p-0.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.08)' }}
            >
              {SPEED_PRESETS.map(sp => (
                <button
                  key={sp.id}
                  onClick={() => setSpeedId(sp.id)}
                  className="px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer"
                  style={speedId === sp.id ? {
                    background: 'rgba(255,255,255,0.2)',
                    color: 'white',
                  } : { color: 'rgba(255,255,255,0.45)' }}
                >
                  {sp.label}
                </button>
              ))}
            </div>

            {/* Stop on First Win Toggle */}
            <button
              onClick={() => setStopOnFirstWin(prev => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 cursor-pointer"
              style={{
                background: stopOnFirstWin ? 'rgba(48,209,88,0.15)' : 'rgba(255,255,255,0.06)',
                border: stopOnFirstWin ? '0.5px solid rgba(48,209,88,0.4)' : '0.5px solid rgba(255,255,255,0.08)',
                color: stopOnFirstWin ? '#30D158' : 'rgba(255,255,255,0.5)',
              }}
              title="Stop the entire race immediately when the first solver finds the solution"
            >
              <CheckCircle2 size={13} />
              <span>{stopOnFirstWin ? 'Instant Stop: ON' : 'Run All: ON'}</span>
            </button>

            {/* Main Action Buttons */}
            {raceStatus === 'running' ? (
              <motion.button
                onClick={pauseRace}
                whileTap={{ scale: 0.96 }}
                className="btn-secondary px-4 py-2 flex items-center gap-1.5"
              >
                <Pause size={14} />
                <span>Pause</span>
              </motion.button>
            ) : (
              <motion.button
                onClick={startRace}
                whileTap={{ scale: 0.96 }}
                className="btn-primary px-5 py-2 flex items-center gap-2"
              >
                <Play size={14} fill="white" />
                <span>{raceStatus === 'paused' ? 'Resume Race' : raceStatus === 'completed' ? 'Re-Race' : 'Start Live Race'}</span>
              </motion.button>
            )}

            <motion.button
              onClick={resetRace}
              whileTap={{ scale: 0.96 }}
              className="btn-secondary px-3.5 py-2 flex items-center gap-1.5"
              title="Reset race with a new permutation"
            >
              <RotateCcw size={13} />
              <span>Shuffle</span>
            </motion.button>
          </div>
        </div>

        {/* ─── Winner Banner: Displays immediately on Solution ─────────────── */}
        <AnimatePresence>
          {raceStatus === 'completed' && winnerEntry && (
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-5 rounded-[24px] flex items-center justify-between flex-wrap gap-4 shadow-2xl relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(48,209,88,0.18) 0%, rgba(10,132,255,0.12) 100%)',
                border: '1.5px solid rgba(48,209,88,0.5)',
                boxShadow: '0 12px 35px rgba(48,209,88,0.25)',
              }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/25 border border-emerald-400/50 flex items-center justify-center text-2xl shadow-inner">
                  🏆
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wider font-bold text-emerald-400">Winner Crowned • Race Stopped</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white">
                      {winnerEntry.config.name}
                    </span>
                  </div>
                  <h4 className="text-xl font-bold label-primary mt-0.5">
                    {winnerEntry.config.fullName} reached the goal first!
                  </h4>
                  <p className="text-xs label-secondary mt-1">
                    Clock stopped at <strong className="text-emerald-400 font-mono">{winnerEntry.s.time.toFixed(1)} ms</strong> • Found an optimal path of <strong className="text-white font-mono">{winnerEntry.s.solutionCost} moves</strong> across <strong className="text-white font-mono">{winnerEntry.s.generated.toLocaleString()} generated states</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleNewPuzzle(difficulty)}
                  className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
                >
                  <RotateCcw size={12} />
                  <span>Next Challenge</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── The Three Live Racing Boards ─────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { config: ALGOS[0], s: bfsState },
            { config: ALGOS[1], s: dfsState },
            { config: ALGOS[2], s: idsState },
          ].map(({ config, s }) => {
            const Icon = config.icon;
            const isSolved = s.finished && s.success;
            const isRacing = raceStatus === 'running' && !s.finished;

            return (
              <motion.div
                key={config.id}
                className="liquid-glass p-5 rounded-[28px] flex flex-col items-center justify-between gap-5 relative overflow-hidden transition-all duration-300"
                style={{
                  border: isSolved
                    ? '1.5px solid rgba(48,209,88,0.6)'
                    : isRacing
                      ? `1.5px solid ${config.color}70`
                      : '0.5px solid rgba(255,255,255,0.1)',
                  boxShadow: isSolved
                    ? '0 16px 40px rgba(0,0,0,0.5), 0 0 35px rgba(48,209,88,0.25)'
                    : isRacing
                      ? `0 16px 40px rgba(0,0,0,0.5), 0 0 25px ${config.color}25`
                      : '0 10px 30px rgba(0,0,0,0.3)',
                }}
              >
                {/* Header Strip */}
                <div className="w-full flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs"
                      style={{ background: `${config.color}25`, color: config.color, border: `0.5px solid ${config.color}50` }}
                    >
                      <Icon size={14} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold label-primary leading-tight">{config.name}</h3>
                      <span className="text-[10px] label-tertiary block font-mono">{config.structure}</span>
                    </div>
                  </div>

                  {/* Rank / Status Badge */}
                  <div>
                    {s.rank === 1 && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center gap-1 shadow-md">
                        🥇 1st Place ({s.time.toFixed(1)} ms)
                      </span>
                    )}
                    {s.rank === 2 && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-300/20 text-slate-200 border border-slate-300/30 flex items-center gap-1">
                        🥈 2nd Place ({s.time.toFixed(1)} ms)
                      </span>
                    )}
                    {s.rank === 3 && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-700/20 text-amber-500 border border-amber-700/30 flex items-center gap-1">
                        🥉 3rd Place ({s.time.toFixed(1)} ms)
                      </span>
                    )}
                    {!s.rank && isRacing && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1.5" style={{ background: `${config.color}20`, color: config.color }}>
                        <span className="w-1.5 h-1.5 rounded-full animate-ping" style={{ background: config.color }} />
                        Exploring…
                      </span>
                    )}
                    {!s.rank && !isRacing && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/5 label-tertiary border border-white/5">
                        {raceStatus === 'paused' ? 'Paused' : s.finished ? 'Stopped' : 'Ready'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Live 3x3 Puzzle Board — Visible Tile Movements in Real Time */}
                <LiveMiniBoard
                  state={s.current}
                  isGoal={isSolved}
                  color={config.color}
                />

                {/* Real-Time Live Meters */}
                <div className="w-full grid grid-cols-2 gap-2 text-xs">
                  {/* Elapsed Timer — Stops on Solution! */}
                  <div className="p-2.5 rounded-[14px] bg-white/5 border border-white/5 flex flex-col justify-between">
                    <div className="flex items-center gap-1 text-[10px] label-tertiary font-medium">
                      <Clock size={11} />
                      <span>{isSolved ? 'Final Runtime' : 'Live Elapsed'}</span>
                    </div>
                    <span className="font-mono font-bold text-sm" style={{ color: isSolved ? '#30D158' : config.color }}>
                      {s.time.toFixed(1)} ms
                    </span>
                  </div>

                  {/* Solution Moves */}
                  <div className="p-2.5 rounded-[14px] bg-white/5 border border-white/5 flex flex-col justify-between">
                    <div className="flex items-center gap-1 text-[10px] label-tertiary font-medium">
                      <Target size={11} />
                      <span>Solution Cost</span>
                    </div>
                    <span className="font-mono font-bold text-sm text-emerald-400">
                      {s.solutionCost !== null ? `${s.solutionCost} moves` : '—'}
                    </span>
                  </div>

                  {/* Generated Nodes */}
                  <div className="p-2.5 rounded-[14px] bg-white/5 border border-white/5 flex flex-col justify-between">
                    <span className="label-tertiary text-[10px] font-medium">Generated States</span>
                    <span className="font-mono font-bold text-sm label-primary">
                      {s.generated.toLocaleString()}
                    </span>
                  </div>

                  {/* Current Tree Depth */}
                  <div className="p-2.5 rounded-[14px] bg-white/5 border border-white/5 flex flex-col justify-between">
                    <span className="label-tertiary text-[10px] font-medium">Current Depth</span>
                    <span className="font-mono font-bold text-sm label-primary">
                      {s.maxDepth}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ─── Real-Time Analytics & Comparative Graphs ────────────────────── */}
        <div className="liquid-glass p-6 rounded-[28px] flex flex-col gap-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-base font-bold label-primary tracking-tight">Real-Time Empirical Metrics</h3>
              <p className="text-xs label-secondary mt-0.5">
                Observe how runtime speed directly compares against solution optimality (move length)
              </p>
            </div>

            {/* Metric Switcher */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { key: 'time', label: 'Runtime (ms)' },
                { key: 'solutionCost', label: 'Solution Moves' },
                { key: 'generated', label: 'Generated Nodes' },
                { key: 'maxDepth', label: 'Max Depth' },
              ].map(m => (
                <button
                  key={m.key}
                  onClick={() => setSelectedMetric(m.key)}
                  className="px-3 py-1 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer"
                  style={selectedMetric === m.key ? {
                    background: '#0A84FF',
                    color: 'white',
                    boxShadow: '0 2px 8px rgba(10,132,255,0.4)',
                  } : {
                    background: 'rgba(255,255,255,0.06)',
                    color: 'rgba(255,255,255,0.6)',
                    border: '0.5px solid rgba(255,255,255,0.08)',
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={50}>
                <XAxis
                  dataKey="name"
                  tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 700 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11, fontFamily: 'monospace' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Comparative Summary Table */}
          <div className="overflow-x-auto pt-2 border-t border-white/5">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left pb-3 font-semibold label-tertiary uppercase tracking-wider">Algorithm</th>
                  <th className="text-right pb-3 font-semibold label-tertiary uppercase tracking-wider">Status</th>
                  <th className="text-right pb-3 font-semibold label-tertiary uppercase tracking-wider">Runtime</th>
                  <th className="text-right pb-3 font-semibold label-tertiary uppercase tracking-wider">Solution Cost</th>
                  <th className="text-right pb-3 font-semibold label-tertiary uppercase tracking-wider">Generated</th>
                  <th className="text-right pb-3 font-semibold label-tertiary uppercase tracking-wider">Max Depth</th>
                  <th className="text-right pb-3 font-semibold label-tertiary uppercase tracking-wider">Optimality</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {[
                  { config: ALGOS[0], s: bfsState, optimal: 'Optimal (Guaranteed)' },
                  { config: ALGOS[1], s: dfsState, optimal: 'Non-Optimal' },
                  { config: ALGOS[2], s: idsState, optimal: 'Optimal (Guaranteed)' },
                ].map(({ config, s, optimal }) => (
                  <tr key={config.id}>
                    <td className="py-3 text-left font-bold" style={{ color: config.color }}>{config.name} ({config.fullName})</td>
                    <td className="py-3 text-right">
                      {s.finished ? (s.success ? '✓ Solved' : 'Exhausted / Stopped') : (raceStatus === 'running' ? '⚡ Racing' : 'Ready')}
                    </td>
                    <td className="py-3 text-right font-bold" style={{ color: config.color }}>{s.time.toFixed(1)} ms</td>
                    <td className="py-3 text-right text-emerald-400 font-bold">{s.solutionCost !== null ? `${s.solutionCost} moves` : '—'}</td>
                    <td className="py-3 text-right label-primary">{s.generated.toLocaleString()}</td>
                    <td className="py-3 text-right label-primary">{s.maxDepth}</td>
                    <td className="py-3 text-right font-sans font-medium" style={{ color: optimal.startsWith('Optimal') ? '#30D158' : '#FF9F0A' }}>
                      {optimal}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ─── Educational Accordion: Generated States & Search Mechanics ────── */}
        <div className="liquid-glass rounded-[24px] overflow-hidden border border-white/8 transition-all duration-300">
          <button
            onClick={() => setShowExplanation(prev => !prev)}
            className="w-full p-5 flex items-center justify-between text-left cursor-pointer hover:bg-white/2 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/15 border border-blue-400/30 flex items-center justify-center text-blue-400">
                <HelpCircle size={16} />
              </div>
              <div>
                <h4 className="text-sm font-bold label-primary">
                  What Does "Generated States" Mean & Why Does Search Take Time?
                </h4>
                <p className="text-xs label-secondary">
                  Tap to learn about search frontiers, combinatorial branching factor, and why uninformed algorithms explore thousands of nodes.
                </p>
              </div>
            </div>
            <div className="text-white/40">
              {showExplanation ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
          </button>

          <AnimatePresence>
            {showExplanation && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-6 pb-6 pt-2 border-t border-white/5 flex flex-col gap-5 text-xs label-secondary"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Card 1 */}
                  <div className="p-4 rounded-[18px] bg-white/3 border border-white/5 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                      <Binary size={15} />
                      <span>1. Generated States vs. Expanded States</span>
                    </div>
                    <p className="leading-relaxed">
                      A <strong className="text-white">Generated State</strong> is any puzzle configuration created when legal moves (<code className="text-blue-300">UP</code>, <code className="text-blue-300">DOWN</code>, <code className="text-blue-300">LEFT</code>, <code className="text-blue-300">RIGHT</code>) are applied to the blank tile and pushed onto the search frontier (FIFO queue in BFS, LIFO stack in DFS).
                    </p>
                    <p className="leading-relaxed">
                      An <strong className="text-white">Expanded State</strong> is when that node is popped off the frontier, checked for the goal, and has its own children generated. Because each state has between 2 and 4 valid neighbor moves, multiple states are generated for every single state expanded.
                    </p>
                  </div>

                  {/* Card 2 */}
                  <div className="p-4 rounded-[18px] bg-white/3 border border-white/5 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                      <Cpu size={15} />
                      <span>2. Why Does Uninformed Search Take Time?</span>
                    </div>
                    <p className="leading-relaxed">
                      The 8-puzzle has <strong className="text-white">181,440 reachable permutations</strong> ($9! / 2$). The average branching factor is <strong className="text-purple-300">b ≈ 2.67</strong>.
                    </p>
                    <p className="leading-relaxed">
                      In uninformed search (BFS, DFS, IDS), the algorithm has <strong className="text-white">zero heuristic knowledge</strong> of where the goal lies. At depth $d = 12$, the search tree can contain over $2.67^{12} \approx 130,000$ potential candidate states. In our live race, we step a batch of nodes per 60 FPS animation frame so you can visually watch tiles slide in real time!
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-[18px] bg-amber-500/10 border border-amber-400/20 text-amber-200/90 leading-relaxed">
                  💡 <strong>Pro-Tip:</strong> Set the race difficulty to <strong>Easy</strong> (~6 moves) or <strong>Medium</strong> (~10 moves) to see solutions found in 1 to 3 seconds. Keep <strong>Instant Stop: ON</strong> to freeze all clocks the exact instant any algorithm claims 1st place!
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Viva / Insight Strip */}
        <div className="liquid-glass-light p-4 rounded-[20px] flex items-center gap-3 border border-white/8 text-xs label-secondary">
          <ShieldCheck size={18} className="text-emerald-400 flex-shrink-0" />
          <p>
            <strong>Key AI Observation:</strong> Notice how <strong>DFS</strong> might explore faster per tick due to deep sequential stack pushes, but often produces heavily sub-optimal move counts. <strong>BFS</strong> and <strong>IDS</strong> will always identify the exact same minimal solution path cost!
          </p>
        </div>
      </div>
    </div>
  );
}
