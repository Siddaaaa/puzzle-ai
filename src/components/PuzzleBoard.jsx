import { motion, AnimatePresence } from 'framer-motion';
import { canMove, isGoalState, GOAL_STATE, pos, findBlank } from '../utils/puzzleEngine';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react';

const ALGO_COLORS = {
  bfs: '#0A84FF',
  dfs: '#BF5AF2',
  ids: '#30D158',
};

// Calculate Manhattan distance for an individual tile to its goal slot
function getTileManhattan(tile, currentIndex) {
  if (tile === 0) return 0;
  const goalIndex = GOAL_STATE.indexOf(tile);
  const currentPos = pos(currentIndex);
  const goalPos = pos(goalIndex);
  return Math.abs(currentPos.row - goalPos.row) + Math.abs(currentPos.col - goalPos.col);
}

// Direction the tile would move into the blank slot
function getMoveDirection(state, tileIndex) {
  const blank = findBlank(state);
  const tPos = pos(tileIndex);
  const bPos = pos(blank);
  if (tPos.row === bPos.row + 1 && tPos.col === bPos.col) return 'up';
  if (tPos.row === bPos.row - 1 && tPos.col === bPos.col) return 'down';
  if (tPos.col === bPos.col + 1 && tPos.row === bPos.row) return 'left';
  if (tPos.col === bPos.col - 1 && tPos.row === bPos.row) return 'right';
  return null;
}

export default function PuzzleBoard({
  state,
  onTileClick,
  selectedAlgo,
  isGoal,
  isAnimating,
  showHeuristics = false,
}) {
  const accentColor = ALGO_COLORS[selectedAlgo] || '#0A84FF';

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Board Surface with Liquid Glass */}
      <div
        className="relative p-4 rounded-[28px] liquid-glass"
        style={{
          border: isGoal
            ? '1.5px solid rgba(48,209,88,0.5)'
            : '0.5px solid rgba(255,255,255,0.14)',
          boxShadow: isGoal
            ? '0 0 45px rgba(48,209,88,0.25), 0 16px 40px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.25)'
            : '0 16px 40px rgba(0,0,0,0.45), inset 0 1px 2px rgba(255,255,255,0.18)',
          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div
          className="grid gap-2.5"
          style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}
          role="grid"
          aria-label="8-Puzzle board"
        >
          <AnimatePresence mode="popLayout">
            {state.map((tile, index) => {
              const movable = tile !== 0 && canMove(state, index) && !isAnimating;
              const isBlank = tile === 0;
              const isInPlace = tile !== 0 && tile === index + 1;
              const manhattan = getTileManhattan(tile, index);
              const direction = movable ? getMoveDirection(state, index) : null;

              return (
                <motion.div
                  key={tile}
                  layout
                  layoutId={`tile-${tile}`}
                  onClick={() => movable && onTileClick(index)}
                  className={`relative flex flex-col items-center justify-center select-none ${
                    movable ? 'cursor-pointer apple-tile movable group' : isBlank ? 'cursor-default' : 'apple-tile cursor-default'
                  }`}
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: 20,
                    background: isBlank
                      ? 'rgba(255,255,255,0.02)'
                      : isInPlace && isGoal
                        ? 'linear-gradient(145deg, rgba(48,209,88,0.28) 0%, rgba(48,209,88,0.12) 100%)'
                        : undefined,
                    borderColor: isBlank
                      ? 'rgba(255,255,255,0.05)'
                      : isInPlace && isGoal
                        ? 'rgba(48,209,88,0.6)'
                        : undefined,
                  }}
                  whileHover={movable ? { scale: 1.05, y: -2 } : {}}
                  whileTap={movable ? { scale: 0.94 } : {}}
                  transition={{
                    layout: { type: 'spring', stiffness: 520, damping: 36 },
                    scale: { duration: 0.12 }
                  }}
                  role="gridcell"
                  aria-label={isBlank ? 'Empty space' : `Tile ${tile}${movable ? ', movable' : ''}`}
                  tabIndex={movable ? 0 : -1}
                  onKeyDown={e => {
                    if (movable && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      onTileClick(index);
                    }
                  }}
                >
                  {/* Subtle directional icon on movable hover */}
                  {movable && (
                    <div
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-80 transition-opacity duration-150"
                      style={{ color: accentColor }}
                    >
                      {direction === 'up' && <ArrowUp size={13} strokeWidth={2.5} />}
                      {direction === 'down' && <ArrowDown size={13} strokeWidth={2.5} />}
                      {direction === 'left' && <ArrowLeft size={13} strokeWidth={2.5} />}
                      {direction === 'right' && <ArrowRight size={13} strokeWidth={2.5} />}
                    </div>
                  )}

                  {/* Tile Number with Apple Refined Typography */}
                  {!isBlank && (
                    <span
                      className="font-semibold tracking-tight"
                      style={{
                        fontSize: 32,
                        letterSpacing: '-0.03em',
                        color: isInPlace && isGoal
                          ? '#30D158'
                          : movable
                            ? 'rgba(255,255,255,0.98)'
                            : 'rgba(255,255,255,0.85)',
                        textShadow: isInPlace && isGoal
                          ? '0 0 16px rgba(48,209,88,0.6)'
                          : '0 2px 8px rgba(0,0,0,0.4)',
                      }}
                    >
                      {tile}
                    </span>
                  )}

                  {/* Heuristic badge overlay (when enabled) */}
                  {!isBlank && showHeuristics && (
                    <div
                      className="absolute bottom-2 left-2 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-medium flex items-center gap-0.5"
                      style={{
                        background: manhattan === 0 ? 'rgba(48,209,88,0.2)' : 'rgba(255,255,255,0.1)',
                        color: manhattan === 0 ? '#30D158' : 'rgba(255,255,255,0.65)',
                        border: `0.5px solid ${manhattan === 0 ? 'rgba(48,209,88,0.4)' : 'rgba(255,255,255,0.1)'}`,
                      }}
                    >
                      {manhattan === 0 ? <Check size={8} strokeWidth={3} /> : `h=${manhattan}`}
                    </div>
                  )}

                  {/* Empty slot inner indicator */}
                  {isBlank && (
                    <div className="w-4 h-4 rounded-full border border-dashed border-white/10" />
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Ambient goal shimmer overlay */}
        <AnimatePresence>
          {isGoal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 rounded-[28px] pointer-events-none"
              style={{
                background: 'radial-gradient(circle at center, rgba(48,209,88,0.15) 0%, transparent 70%)',
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Goal state indicator banner */}
      <AnimatePresence>
        {isGoal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold liquid-glass-light"
            style={{
              borderColor: 'rgba(48,209,88,0.4)',
              color: '#30D158',
              boxShadow: '0 4px 16px rgba(48,209,88,0.2)',
            }}
          >
            <Sparkles size={14} />
            <span>Goal State Achieved — Clean Solution!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
