import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shuffle, RotateCcw, Play, Square, Pencil, ChevronDown, ChevronUp, Zap, Network, LayoutGrid, Eye, EyeOff, Keyboard, Sparkles } from 'lucide-react';
import PuzzleBoard from './PuzzleBoard';
import AlgorithmSelector from './AlgorithmSelector';
import PlaybackControls from './PlaybackControls';
import SearchStats from './SearchStats';
import SearchTreeVisualizer from './SearchTreeVisualizer';
import { generateByDifficulty, applyMove, isGoalState, validateState, GOAL_STATE, manhattanDistance, misplacedTiles, findBlank, pos } from '../utils/puzzleEngine';

const ALGO_COLORS = { bfs: '#0A84FF', dfs: '#BF5AF2', ids: '#30D158' };
const DIFFICULTIES = ['easy', 'medium', 'hard', 'expert'];

export default function PlaygroundView() {
  const [state, setState] = useState(() => generateByDifficulty('medium'));
  const [selectedAlgo, setSelectedAlgo] = useState('bfs');
  const [difficulty, setDifficulty] = useState('medium');

  // Search state
  const [searchStatus, setSearchStatus] = useState('idle'); // idle | searching | solved | failed
  const [solution, setSolution] = useState(null); // array of {state, move}
  const [metrics, setMetrics] = useState(null);
  const [treeNodes, setTreeNodes] = useState([]);
  const [selectedTreeNodeId, setSelectedTreeNodeId] = useState(null);
  const [inspectState, setInspectState] = useState(null);
  const [activeTab, setActiveTab] = useState('board'); // 'board' | 'tree'
  const [showHeuristics, setShowHeuristics] = useState(false);
  const workerRef = useRef(null);

  // Playback state
  const [playbackStep, setPlaybackStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(800);
  const playIntervalRef = useRef(null);

  // Custom input
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [customError, setCustomError] = useState('');

  // Current displayed state (inspectState takes priority when clicked from tree)
  const displayState = inspectState || (solution && solution.length > 0
    ? solution[playbackStep]?.state || state
    : state);

  const isGoal = isGoalState(displayState);
  const accentColor = ALGO_COLORS[selectedAlgo];
  const currentManhattan = manhattanDistance(displayState);
  const currentMisplaced = misplacedTiles(displayState);

  // ─── Puzzle Controls ───────────────────────────────────────────────────────

  const handleTileClick = useCallback((index) => {
    if (searchStatus === 'searching' || solution) return;
    setInspectState(null);
    setState(prev => applyMove(prev, index));
  }, [searchStatus, solution]);

  const handleShuffle = useCallback(() => {
    setSolution(null);
    setSearchStatus('idle');
    setMetrics(null);
    setTreeNodes([]);
    setSelectedTreeNodeId(null);
    setInspectState(null);
    setPlaybackStep(0);
    setIsPlaying(false);
    setState(generateByDifficulty(difficulty));
  }, [difficulty]);

  const handleReset = useCallback(() => {
    setSolution(null);
    setSearchStatus('idle');
    setMetrics(null);
    setTreeNodes([]);
    setSelectedTreeNodeId(null);
    setInspectState(null);
    setPlaybackStep(0);
    setIsPlaying(false);
  }, []);

  // ─── Keyboard Direct Manipulation (Arrow keys + WASD + Space) ─────────────

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept when user is typing in input fields
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      const blank = findBlank(displayState);
      const { row, col } = pos(blank);

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        if (row < 2) {
          e.preventDefault();
          handleTileClick(blank + 3);
        }
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        if (row > 0) {
          e.preventDefault();
          handleTileClick(blank - 3);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        if (col < 2) {
          e.preventDefault();
          handleTileClick(blank + 1);
        }
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        if (col > 0) {
          e.preventDefault();
          handleTileClick(blank - 1);
        }
      } else if (e.key === ' ') {
        e.preventDefault();
        if (solution && solution.length > 0) {
          setIsPlaying(p => !p);
        } else if (searchStatus === 'idle') {
          runSearch();
        }
      } else if (e.key === 'r' || e.key === 'R') {
        if (!e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          handleShuffle();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [displayState, solution, searchStatus, handleTileClick, handleShuffle]);

  // ─── Worker / Search ───────────────────────────────────────────────────────

  const stopSearch = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setSearchStatus('idle');
  }, []);

  const runSearch = useCallback(() => {
    if (searchStatus === 'searching') {
      stopSearch();
      return;
    }

    setSolution(null);
    setMetrics(null);
    setTreeNodes([]);
    setSelectedTreeNodeId(null);
    setInspectState(null);
    setPlaybackStep(0);
    setIsPlaying(false);
    setSearchStatus('searching');

    const worker = new Worker(
      new URL('../workers/searchWorker.js', import.meta.url),
      { type: 'module' }
    );
    workerRef.current = worker;

    worker.onmessage = (e) => {
      const data = e.data;
      if (data.type === 'result') {
        if (data.treeNodes) {
          setTreeNodes(data.treeNodes);
        }
        if (data.success) {
          setSolution(data.path);
          setMetrics(data.metrics);
          setSearchStatus('solved');
        } else {
          setMetrics(data.metrics);
          setSearchStatus('failed');
        }
        worker.terminate();
        workerRef.current = null;
      } else if (data.type === 'error') {
        setSearchStatus('failed');
        worker.terminate();
        workerRef.current = null;
      }
    };

    worker.onerror = () => {
      setSearchStatus('failed');
      workerRef.current = null;
    };

    worker.postMessage({
      algorithm: selectedAlgo,
      initialState: state,
    });
  }, [searchStatus, selectedAlgo, state, stopSearch]);

  const handleSelectTreeNode = (node) => {
    setSelectedTreeNodeId(node.id);
    setInspectState(node.state);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (workerRef.current) workerRef.current.terminate();
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    };
  }, []);

  // ─── Playback ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (isPlaying && solution) {
      playIntervalRef.current = setInterval(() => {
        setPlaybackStep(prev => {
          if (prev >= solution.length - 1) {
            setIsPlaying(false);
            clearInterval(playIntervalRef.current);
            return prev;
          }
          return prev + 1;
        });
      }, playSpeed);
    } else {
      clearInterval(playIntervalRef.current);
    }
    return () => clearInterval(playIntervalRef.current);
  }, [isPlaying, solution, playSpeed]);

  const handlePlay = () => {
    if (playbackStep >= (solution?.length || 1) - 1) {
      setPlaybackStep(0);
    }
    setIsPlaying(true);
  };

  const handlePause = () => setIsPlaying(false);

  const handlePrev = () => {
    setIsPlaying(false);
    setPlaybackStep(prev => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setIsPlaying(false);
    setPlaybackStep(prev => Math.min((solution?.length || 1) - 1, prev + 1));
  };

  const handlePlaybackReset = () => {
    setIsPlaying(false);
    setPlaybackStep(0);
  };

  // ─── Custom Input ─────────────────────────────────────────────────────────

  const handleCustomApply = () => {
    const nums = customInput.trim().split(/[\s,]+/).map(Number);
    const result = validateState(nums);
    if (result.valid) {
      setState(nums);
      setSolution(null);
      setSearchStatus('idle');
      setMetrics(null);
      setCustomError('');
      setShowCustomInput(false);
    } else {
      setCustomError(result.error);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-20 px-6">
      <div className="max-w-6xl mx-auto py-4">
        {/* Page header with Apple typography */}
        <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-bold label-primary tracking-tight" style={{ letterSpacing: '-0.03em' }}>
              Puzzle Playground
            </h2>
            <p className="text-xs sm:text-sm label-secondary mt-1">
              Directly manipulate tiles with mouse or Arrow keys (<kbd className="kbd-badge">↑</kbd> <kbd className="kbd-badge">↓</kbd> <kbd className="kbd-badge">←</kbd> <kbd className="kbd-badge">→</kbd>), inspect heuristics, and run AI search.
            </p>
          </div>

          {/* Interactive Keyboard hint badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full liquid-glass-light text-xs label-secondary">
            <Keyboard size={13} />
            <span><kbd className="kbd-badge">Space</kbd> Run/Play</span>
            <span>•</span>
            <span><kbd className="kbd-badge">R</kbd> Shuffle</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          {/* Left Column: Board + Playback */}
          <div className="flex flex-col gap-6">
            {/* Liquid Glass Main Stage */}
            <div className="liquid-glass p-6 rounded-[28px] flex flex-col gap-5 relative overflow-hidden">
              {/* Toolbar */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                {/* Difficulty Pills */}
                <div className="flex items-center gap-1.5">
                  <div
                    className="flex items-center gap-1 p-0.5 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.08)' }}
                  >
                    {DIFFICULTIES.map(d => (
                      <button
                        key={d}
                        onClick={() => {
                          setDifficulty(d);
                          setState(generateByDifficulty(d));
                          setSolution(null);
                          setSearchStatus('idle');
                          setMetrics(null);
                          setPlaybackStep(0);
                        }}
                        className="px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all duration-150 cursor-pointer"
                        style={difficulty === d ? {
                          background: accentColor,
                          color: 'white',
                          boxShadow: `0 2px 8px ${accentColor}40`,
                        } : {
                          color: 'rgba(255,255,255,0.5)',
                        }}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Secondary Actions */}
                <div className="flex items-center gap-2">
                  {/* Heuristics HUD Toggle */}
                  <motion.button
                    onClick={() => setShowHeuristics(v => !v)}
                    whileTap={{ scale: 0.95 }}
                    className={`btn-secondary text-xs flex items-center gap-1.5 ${showHeuristics ? 'text-blue-400 border-blue-500/40' : ''}`}
                    title="Toggle Manhattan Distance HUD on tiles"
                  >
                    {showHeuristics ? <Eye size={13} /> : <EyeOff size={13} />}
                    <span>HUD {showHeuristics ? 'On' : 'Off'}</span>
                  </motion.button>

                  {/* Custom state drawer toggle */}
                  <motion.button
                    onClick={() => setShowCustomInput(v => !v)}
                    whileTap={{ scale: 0.95 }}
                    className="btn-secondary text-xs flex items-center gap-1.5"
                    aria-expanded={showCustomInput}
                  >
                    <Pencil size={12} strokeWidth={2} />
                    <span>Custom</span>
                    {showCustomInput ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </motion.button>

                  {/* Shuffle Button */}
                  <motion.button
                    onClick={handleShuffle}
                    whileTap={{ scale: 0.95 }}
                    className="btn-secondary text-xs flex items-center gap-1.5"
                    aria-label="Shuffle puzzle"
                  >
                    <Shuffle size={12} strokeWidth={2} />
                    <span>Shuffle</span>
                  </motion.button>

                  {solution && (
                    <motion.button
                      onClick={handleReset}
                      whileTap={{ scale: 0.95 }}
                      className="btn-secondary text-xs flex items-center gap-1.5"
                    >
                      <RotateCcw size={12} strokeWidth={2} />
                      <span>Clear</span>
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Custom Input Drawer */}
              <AnimatePresence>
                {showCustomInput && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div
                      className="p-4 rounded-[18px] liquid-glass-light"
                      style={{ border: '0.5px solid rgba(255,255,255,0.1)' }}
                    >
                      <p className="text-xs label-secondary mb-2">
                        Enter 9 numbers (0–8) separated by spaces. <span className="text-blue-400 font-mono">0</span> represents the empty slot.
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customInput}
                          onChange={e => { setCustomInput(e.target.value); setCustomError(''); }}
                          placeholder="e.g. 1 2 3 4 5 6 7 8 0"
                          className="flex-1 px-3 py-2 rounded-full text-xs font-mono outline-none"
                          style={{
                            background: 'rgba(0,0,0,0.4)',
                            border: '0.5px solid rgba(255,255,255,0.14)',
                            color: 'rgba(255,255,255,0.95)',
                          }}
                          onKeyDown={e => e.key === 'Enter' && handleCustomApply()}
                        />
                        <button
                          onClick={handleCustomApply}
                          className="btn-primary px-4 py-2 text-xs"
                        >
                          Apply Permutation
                        </button>
                      </div>
                      {customError && (
                        <p className="text-xs mt-2" style={{ color: '#FF453A' }}>{customError}</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* View Switcher Segmented Control */}
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="segment-control" style={{ width: 270 }}>
                  <button
                    onClick={() => setActiveTab('board')}
                    className={`segment-item flex items-center justify-center gap-1.5 ${activeTab === 'board' ? 'active' : ''}`}
                  >
                    <LayoutGrid size={13} strokeWidth={2} />
                    <span>Interactive Board</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('tree')}
                    className={`segment-item flex items-center justify-center gap-1.5 ${activeTab === 'tree' ? 'active' : ''}`}
                  >
                    <Network size={13} strokeWidth={2} />
                    <span>Search Tree</span>
                  </button>
                </div>

                {/* Live Heuristic HUD Indicators */}
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="label-tertiary">Manhattan:</span>
                    <span className="font-semibold text-blue-400">{currentManhattan}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="label-tertiary">Misplaced:</span>
                    <span className="font-semibold text-purple-400">{currentMisplaced}</span>
                  </div>

                  {inspectState && (
                    <button
                      onClick={() => setInspectState(null)}
                      className="text-xs text-blue-400 hover:underline flex items-center gap-1 pl-2"
                    >
                      Return to Live
                    </button>
                  )}
                </div>
              </div>

              {/* Content: Board or Search Tree */}
              {activeTab === 'board' ? (
                <div className="flex flex-col items-center justify-center gap-4 py-2">
                  <PuzzleBoard
                    state={displayState}
                    onTileClick={handleTileClick}
                    selectedAlgo={selectedAlgo}
                    isGoal={isGoal}
                    isAnimating={isPlaying || searchStatus === 'searching'}
                    showHeuristics={showHeuristics}
                  />

                  {/* Goal State Mini Reference */}
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <span className="text-[11px] label-tertiary">Goal Slot Order:</span>
                    <div className="flex items-center gap-1">
                      {GOAL_STATE.slice(0, 8).map(t => (
                        <span key={t} className="w-5 h-5 rounded-[4px] flex items-center justify-center text-[10px] font-mono font-semibold bg-white/5 label-secondary border border-white/10">
                          {t}
                        </span>
                      ))}
                      <span className="w-5 h-5 rounded-[4px] flex items-center justify-center text-[10px] font-mono text-white/20 border border-dashed border-white/10">
                        0
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <SearchTreeVisualizer
                  treeNodes={treeNodes}
                  selectedAlgo={selectedAlgo}
                  onSelectNode={handleSelectTreeNode}
                  selectedNodeId={selectedTreeNodeId}
                />
              )}
            </div>

            {/* Playback Controls (Animated when solution exists) */}
            <AnimatePresence>
              {solution && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                >
                  <PlaybackControls
                    isPlaying={isPlaying}
                    currentStep={playbackStep}
                    totalSteps={solution.length}
                    onPlay={handlePlay}
                    onPause={handlePause}
                    onPrev={handlePrev}
                    onNext={handleNext}
                    onReset={handlePlaybackReset}
                    onSpeedChange={setPlaySpeed}
                    speed={playSpeed}
                    selectedAlgo={selectedAlgo}
                    disabled={false}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column: Algorithm Selector + Live Stats */}
          <div className="flex flex-col gap-5">
            {/* Algorithm Selector Card */}
            <div className="liquid-glass p-5 rounded-[24px] flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-semibold label-primary tracking-tight mb-0.5">Search Strategy</h3>
                <p className="text-xs label-secondary">Select an unformed search algorithm</p>
              </div>

              <AlgorithmSelector
                selected={selectedAlgo}
                onChange={algo => {
                  setSelectedAlgo(algo);
                  setSolution(null);
                  setSearchStatus('idle');
                  setMetrics(null);
                  setPlaybackStep(0);
                  setIsPlaying(false);
                }}
              />

              {/* Action Button */}
              <motion.button
                onClick={runSearch}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2.5 py-3 rounded-full font-semibold text-sm transition-all duration-200 cursor-pointer shadow-lg"
                style={
                  searchStatus === 'searching'
                    ? {
                        background: 'linear-gradient(180deg, rgba(255,69,58,0.3) 0%, rgba(255,69,58,0.15) 100%)',
                        color: '#FF453A',
                        border: '0.5px solid rgba(255,69,58,0.4)',
                      }
                    : {
                        background: `linear-gradient(180deg, ${accentColor} 0%, ${accentColor}DD 100%)`,
                        color: 'white',
                        boxShadow: `0 6px 20px ${accentColor}40`,
                        border: '0.5px solid rgba(255,255,255,0.3)',
                      }
                }
              >
                {searchStatus === 'searching' ? (
                  <>
                    <Square size={14} fill="#FF453A" />
                    <span>Halt Search</span>
                  </>
                ) : (
                  <>
                    <Zap size={15} strokeWidth={2.5} />
                    <span>Run {selectedAlgo.toUpperCase()} Search</span>
                  </>
                )}
              </motion.button>
            </div>

            {/* Execution Metrics Panel */}
            <SearchStats
              metrics={metrics}
              selectedAlgo={selectedAlgo}
              status={searchStatus === 'idle' && !metrics ? null : searchStatus}
            />

            {/* Interactive Tips */}
            <div className="p-4 rounded-[20px] liquid-glass-light border border-white/5 text-xs space-y-2">
              <span className="font-semibold label-primary block">Pro-tip for Viva:</span>
              <p className="label-secondary leading-relaxed text-[11px]">
                Notice that BFS and IDS always produce the identical minimal solution cost, whereas DFS explores wildly deep paths before discovering a solution.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
