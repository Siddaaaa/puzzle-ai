import { motion } from 'framer-motion';
import { Layers, GitBranch, RefreshCw, CheckCircle2, XCircle, Database, HelpCircle } from 'lucide-react';

const ALGORITHMS = [
  {
    id: 'bfs',
    name: 'BFS',
    fullName: 'Breadth-First Search',
    icon: Layers,
    color: '#0A84FF',
    muted: 'rgba(10,132,255,0.12)',
    structure: 'FIFO Queue',
    description: 'Guarantees the shortest move path by expanding shallowest unexpanded nodes first.',
    complete: true,
    optimal: true,
    timeComp: 'O(b^d)',
    spaceComp: 'O(b^d)',
  },
  {
    id: 'dfs',
    name: 'DFS',
    fullName: 'Depth-First Search',
    icon: GitBranch,
    color: '#BF5AF2',
    muted: 'rgba(191,90,242,0.12)',
    structure: 'LIFO Stack',
    description: 'Dives deep into subtrees before backtracking. Low memory footprint, but non-optimal paths.',
    complete: false,
    optimal: false,
    timeComp: 'O(b^m)',
    spaceComp: 'O(b·m)',
  },
  {
    id: 'ids',
    name: 'IDS',
    fullName: 'Iterative Deepening Search',
    icon: RefreshCw,
    color: '#30D158',
    muted: 'rgba(48,209,88,0.12)',
    structure: 'Repeated DLS',
    description: 'Combines BFS optimality with DFS linear memory via progressive depth-limit iterations.',
    complete: true,
    optimal: true,
    timeComp: 'O(b^d)',
    spaceComp: 'O(b·d)',
  },
];

export default function AlgorithmSelector({ selected, onChange }) {
  const selectedAlgo = ALGORITHMS.find(a => a.id === selected) || ALGORITHMS[0];

  return (
    <div className="flex flex-col gap-3">
      {/* Segmented Control Pill */}
      <div
        className="segment-control p-1 relative"
        role="radiogroup"
        aria-label="Search algorithm selection"
      >
        {ALGORITHMS.map(algo => {
          const Icon = algo.icon;
          const isActive = selected === algo.id;
          return (
            <button
              key={algo.id}
              onClick={() => onChange(algo.id)}
              className={`relative z-10 segment-item flex items-center justify-center gap-1.5 font-semibold ${
                isActive ? 'text-white' : ''
              }`}
              role="radio"
              aria-checked={isActive}
            >
              {isActive && (
                <motion.div
                  layoutId="active-algo-pill"
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `linear-gradient(135deg, ${algo.color} 0%, ${algo.color}CC 100%)`,
                    boxShadow: `0 2px 10px ${algo.color}50`,
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <Icon size={12} strokeWidth={2.5} />
                <span>{algo.name}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Algorithm Card with Liquid Glass */}
      {selectedAlgo && (
        <motion.div
          key={selected}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="p-4 rounded-[20px] liquid-glass-light flex flex-col gap-3 relative overflow-hidden"
          style={{
            borderColor: `${selectedAlgo.color}35`,
          }}
        >
          {/* Subtle colored backlight */}
          <div
            className="absolute top-0 right-0 w-24 h-24 rounded-full blur-xl pointer-events-none opacity-20"
            style={{ background: selectedAlgo.color }}
          />

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold label-primary">{selectedAlgo.fullName}</span>
              <span className="text-[10px] font-mono px-2 py-0.2 rounded-full font-semibold" style={{ background: `${selectedAlgo.color}20`, color: selectedAlgo.color }}>
                {selectedAlgo.structure}
              </span>
            </div>
            <p className="text-xs label-secondary leading-relaxed">
              {selectedAlgo.description}
            </p>
          </div>

          {/* Properties Pill Row */}
          <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="label-tertiary">Optimal:</span>
              <span className="font-semibold flex items-center gap-0.5" style={{ color: selectedAlgo.optimal ? '#30D158' : '#FF453A' }}>
                {selectedAlgo.optimal ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                {selectedAlgo.optimal ? 'Guaranteed' : 'No'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="label-tertiary">Complete:</span>
              <span className="font-semibold flex items-center gap-0.5" style={{ color: selectedAlgo.complete ? '#30D158' : '#FF453A' }}>
                {selectedAlgo.complete ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                {selectedAlgo.complete ? 'Yes' : 'No'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 font-mono">
              <span className="label-tertiary">Space:</span>
              <span className="label-primary font-medium">{selectedAlgo.spaceComp}</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
