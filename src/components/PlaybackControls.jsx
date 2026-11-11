import { motion } from 'framer-motion';
import { Play, Pause, SkipBack, RotateCcw, ChevronLeft, ChevronRight, Gauge } from 'lucide-react';

const ALGO_COLORS = { bfs: '#0A84FF', dfs: '#BF5AF2', ids: '#30D158' };
const SPEED_OPTIONS = [
  { label: '0.5×', value: 2000 },
  { label: '1×', value: 800 },
  { label: '2×', value: 400 },
  { label: '4×', value: 150 },
];

export default function PlaybackControls({
  isPlaying,
  currentStep,
  totalSteps,
  onPlay,
  onPause,
  onPrev,
  onNext,
  onReset,
  onSpeedChange,
  speed,
  selectedAlgo,
  disabled,
}) {
  const accentColor = ALGO_COLORS[selectedAlgo] || '#0A84FF';
  const progress = totalSteps > 1 ? (currentStep / (totalSteps - 1)) * 100 : 0;

  const IconBtn = ({ onClick, icon: Icon, disabled: d, label, accent, shortcut }) => (
    <motion.button
      onClick={onClick}
      disabled={d}
      whileTap={!d ? { scale: 0.92 } : {}}
      whileHover={!d ? { scale: 1.05 } : {}}
      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
        accent ? 'shadow-lg' : 'hover:bg-white/10'
      }`}
      style={{
        background: accent
          ? `linear-gradient(180deg, ${accentColor} 0%, ${accentColor}CC 100%)`
          : 'rgba(255,255,255,0.08)',
        border: accent ? `0.5px solid rgba(255,255,255,0.4)` : '0.5px solid rgba(255,255,255,0.12)',
        color: accent ? 'white' : 'rgba(255,255,255,0.9)',
        boxShadow: accent ? `0 4px 16px ${accentColor}40` : 'none',
      }}
      aria-label={label}
      title={`${label} ${shortcut ? `(${shortcut})` : ''}`}
    >
      <Icon size={15} strokeWidth={2.2} />
    </motion.button>
  );

  return (
    <div className="liquid-glass p-5 rounded-[24px] flex flex-col gap-4">
      {/* Progress header & Scrubber */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold label-primary tracking-tight">Solution Playback</span>
            <span className="text-[10px] px-2 py-0.2 rounded-full font-mono bg-white/10 label-secondary border border-white/10">
              Interactive Scrubber
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold" style={{ color: accentColor }}>
              {totalSteps > 0 ? `Move ${currentStep} of ${totalSteps - 1}` : '—'}
            </span>
            <span className="text-[11px] label-tertiary">({Math.round(progress)}%)</span>
          </div>
        </div>

        {/* Progress track */}
        <div
          className="relative h-2 rounded-full overflow-hidden p-0.5"
          style={{ background: 'rgba(0,0,0,0.4)', border: '0.5px solid rgba(255,255,255,0.08)' }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${accentColor} 0%, #30D158 100%)`,
              boxShadow: `0 0 10px ${accentColor}60`,
            }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.15 }}
          />
        </div>
      </div>

      {/* Control Buttons Strip */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* Playback Transport Buttons */}
        <div className="flex items-center gap-2">
          <IconBtn
            onClick={onReset}
            icon={SkipBack}
            disabled={disabled || currentStep === 0}
            label="Rewind to Initial State"
            shortcut="0"
          />
          <IconBtn
            onClick={onPrev}
            icon={ChevronLeft}
            disabled={disabled || currentStep === 0}
            label="Previous Step"
            shortcut="←"
          />
          <IconBtn
            onClick={isPlaying ? onPause : onPlay}
            icon={isPlaying ? Pause : Play}
            disabled={disabled || totalSteps === 0}
            label={isPlaying ? 'Pause Playback' : 'Play Solution'}
            accent
            shortcut="Space"
          />
          <IconBtn
            onClick={onNext}
            icon={ChevronRight}
            disabled={disabled || currentStep >= totalSteps - 1}
            label="Next Step"
            shortcut="→"
          />
          <IconBtn
            onClick={onReset}
            icon={RotateCcw}
            disabled={disabled}
            label="Replay from Beginning"
          />
        </div>

        {/* Speed Segmented Pill */}
        <div className="flex items-center gap-1.5">
          <Gauge size={13} className="label-tertiary hidden sm:inline" />
          <div
            className="flex items-center gap-1 p-0.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.08)' }}
          >
            {SPEED_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => onSpeedChange(opt.value)}
                className="px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer"
                style={speed === opt.value ? {
                  background: accentColor,
                  color: 'white',
                  boxShadow: `0 2px 8px ${accentColor}40`,
                } : {
                  color: 'rgba(255,255,255,0.5)',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
