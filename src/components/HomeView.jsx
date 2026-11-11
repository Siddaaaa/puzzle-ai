import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Layers, GitBranch, RefreshCw, ChevronRight, Zap, Play, CheckCircle2, ShieldCheck, Sparkles, Cpu } from 'lucide-react';

const ALGORITHMS = [
  {
    id: 'bfs',
    name: 'Breadth-First Search',
    abbr: 'BFS',
    tagline: 'Shortest path guarantee',
    description: 'Traverses the state space level by level using a FIFO queue. Unconditionally optimal for unit step costs.',
    structure: 'FIFO Queue',
    color: '#0A84FF',
    accentGrad: 'from-blue-500/20 to-blue-600/5',
    border: 'rgba(10,132,255,0.3)',
    icon: Layers,
    properties: ['Complete', 'Optimal', 'O(b^d) Memory'],
    badge: 'Shortest Move Path',
  },
  {
    id: 'dfs',
    name: 'Depth-First Search',
    abbr: 'DFS',
    tagline: 'Deep branch exploration',
    description: 'Plunges down each path until exhaustion or depth boundary. Extreme memory efficiency at the cost of optimality.',
    structure: 'LIFO Stack',
    color: '#BF5AF2',
    accentGrad: 'from-purple-500/20 to-purple-600/5',
    border: 'rgba(191,90,242,0.3)',
    icon: GitBranch,
    properties: ['Not Optimal', 'O(b·m) Memory', 'Fast Shallow Dives'],
    badge: 'Minimal Memory',
  },
  {
    id: 'ids',
    name: 'Iterative Deepening',
    abbr: 'IDS',
    tagline: 'Best of both worlds',
    description: 'Sequentially executes depth-limited DFS with incremental limits. Combines BFS optimality with DFS linear space.',
    structure: 'Repeated DLS',
    color: '#30D158',
    accentGrad: 'from-emerald-500/20 to-emerald-600/5',
    border: 'rgba(48,209,88,0.3)',
    icon: RefreshCw,
    properties: ['Complete', 'Optimal', 'O(b·d) Memory'],
    badge: 'Academic Benchmark',
  },
];

// Interactive Mini 3x3 Puzzle Display that reacts to hovering
function InteractiveMiniPuzzle({ color, isHovered }) {
  const [board, setBoard] = useState([1, 2, 3, 4, 0, 5, 7, 8, 6]);

  const handleShuffleMini = (e) => {
    e.stopPropagation();
    const shuffled = [...board].sort(() => Math.random() - 0.5);
    setBoard(shuffled);
  };

  return (
    <div
      onClick={handleShuffleMini}
      title="Click to shuffle mini puzzle"
      className="grid gap-1 p-1.5 rounded-[10px] cursor-pointer transition-transform duration-200"
      style={{
        gridTemplateColumns: 'repeat(3, 1fr)',
        width: 80,
        height: 80,
        background: 'rgba(0, 0, 0, 0.4)',
        border: `0.5px solid ${isHovered ? color : 'rgba(255,255,255,0.1)'}`,
        boxShadow: isHovered ? `0 0 20px ${color}30` : 'none',
      }}
    >
      {board.map((t, i) => (
        <div
          key={i}
          className="rounded-[4px] flex items-center justify-center text-[10px] font-bold font-mono transition-all duration-150"
          style={{
            background: t === 0 ? 'transparent' : 'rgba(255,255,255,0.08)',
            color: t === 0 ? 'transparent' : isHovered ? color : 'rgba(255,255,255,0.85)',
          }}
        >
          {t === 0 ? '' : t}
        </div>
      ))}
    </div>
  );
}

export default function HomeView({ setActiveView }) {
  const [hoveredAlgo, setHoveredAlgo] = useState(null);

  return (
    <div className="min-h-screen pt-20 pb-24 px-6 relative">
      {/* Hero Section */}
      <section className="pt-16 pb-16 text-center max-w-4xl mx-auto flex flex-col items-center">
        {/* Apple-style floating pill badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 text-xs font-medium liquid-glass-light"
          style={{
            borderColor: 'rgba(255,255,255,0.16)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.2)',
          }}
        >
          <Sparkles size={13} className="text-blue-400" />
          <span className="font-semibold text-blue-400">8-Puzzle AI Solver</span>
        </motion.div>

        {/* Apple Display Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-5xl sm:text-7xl font-bold tracking-tight mb-6 label-primary max-w-3xl leading-[1.08]"
          style={{ letterSpacing: '-0.035em' }}
        >
          Think.{' '}
          <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            Search.
          </span>{' '}
          Solve.
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-base sm:text-xl label-secondary mb-10 max-w-2xl mx-auto leading-relaxed font-normal"
        >
          Explore how intelligent agents navigate discrete state spaces with complete mathematical transparency, interactive step-by-step search, and liquid glass ergonomics.
        </motion.p>

        {/* Primary Call to Actions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-4 flex-wrap justify-center"
        >
          <motion.button
            onClick={() => setActiveView('playground')}
            className="btn-primary text-sm px-6 py-3 flex items-center gap-2 group"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <span>Open Puzzle Playground</span>
            <ArrowRight size={15} strokeWidth={2.5} className="group-hover:translate-x-0.5 transition-transform" />
          </motion.button>

          <motion.button
            onClick={() => setActiveView('analytics')}
            className="btn-secondary text-sm px-6 py-3 flex items-center gap-2 liquid-glass"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Zap size={14} className="text-amber-400" />
            <span>Live Algorithm Race</span>
          </motion.button>
        </motion.div>
      </section>

      {/* Algorithm Showcase Grid */}
      <section className="max-w-5xl mx-auto pt-6">
        <div className="flex items-center justify-between mb-6 px-1">
          <div>
            <h2 className="text-xs font-semibold tracking-widest uppercase label-tertiary">
              Three Classical Strategies
            </h2>
            <p className="text-sm label-secondary mt-0.5">
              Select an algorithm to examine its data structure and execution guarantees
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs label-tertiary">
            <Cpu size={14} />
            <span>Web Worker Multi-threaded</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {ALGORITHMS.map(algo => {
            const Icon = algo.icon;
            const isHovered = hoveredAlgo === algo.id;

            return (
              <motion.div
                key={algo.id}
                onMouseEnter={() => setHoveredAlgo(algo.id)}
                onMouseLeave={() => setHoveredAlgo(null)}
                onClick={() => setActiveView('playground')}
                className="liquid-glass p-6 rounded-[24px] flex flex-col justify-between gap-6 cursor-pointer relative overflow-hidden group transition-all duration-300"
                style={{
                  borderColor: isHovered ? algo.border : 'rgba(255,255,255,0.1)',
                  boxShadow: isHovered
                    ? `0 16px 40px rgba(0,0,0,0.5), 0 0 30px ${algo.color}25, inset 0 1px 1px rgba(255,255,255,0.2)`
                    : '0 10px 30px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.1)',
                  transform: isHovered ? 'translateY(-3px)' : 'none',
                }}
              >
                {/* Top glow accent */}
                <div
                  className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl pointer-events-none transition-opacity duration-300 ${
                    isHovered ? 'opacity-30' : 'opacity-10'
                  }`}
                  style={{ background: algo.color }}
                />

                <div>
                  {/* Top Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                      style={{
                        background: `${algo.color}18`,
                        color: algo.color,
                        border: `0.5px solid ${algo.color}40`,
                      }}
                    >
                      <Icon size={12} strokeWidth={2.5} />
                      <span>{algo.abbr}</span>
                    </div>

                    <InteractiveMiniPuzzle color={algo.color} isHovered={isHovered} />
                  </div>

                  {/* Title & Tagline */}
                  <h3 className="text-lg font-semibold label-primary tracking-tight">
                    {algo.name}
                  </h3>
                  <p className="text-xs font-medium mb-3" style={{ color: algo.color }}>
                    {algo.tagline}
                  </p>

                  {/* Description */}
                  <p className="text-xs label-secondary leading-relaxed mb-4">
                    {algo.description}
                  </p>

                  {/* Properties */}
                  <div className="flex flex-wrap gap-1.5">
                    {algo.properties.map(p => (
                      <span
                        key={p}
                        className="text-[11px] px-2.5 py-0.5 rounded-full font-medium"
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          color: 'rgba(255,255,255,0.65)',
                          border: '0.5px solid rgba(255,255,255,0.08)',
                        }}
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer Data Structure Info */}
                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] label-tertiary block">Internal Structure</span>
                    <span className="text-xs font-mono font-medium label-primary">{algo.structure}</span>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-medium group-hover:translate-x-1 transition-transform" style={{ color: algo.color }}>
                    <span>Launch</span>
                    <ChevronRight size={14} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Mathematical Rigor Banner */}
      <section className="max-w-5xl mx-auto mt-12">
        <div
          className="liquid-glass-light p-5 rounded-[20px] flex items-center justify-between flex-wrap gap-4"
          style={{ border: '0.5px solid rgba(255,255,255,0.08)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h4 className="text-sm font-semibold label-primary">Inversion Parity Guaranteed</h4>
              <p className="text-xs label-secondary">
                Permutations are verified for mathematical solvability (inversion parity count) before search initiation.
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveView('playground')}
            className="text-xs font-medium text-blue-400 hover:underline flex items-center gap-1"
          >
            Try random or custom states
            <ChevronRight size={13} />
          </button>
        </div>
      </section>
    </div>
  );
}
