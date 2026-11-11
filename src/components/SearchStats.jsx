import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Hash, Layers, ArrowDown, Target, Maximize2, Activity } from 'lucide-react';

const ALGO_COLORS = { bfs: '#0A84FF', dfs: '#BF5AF2', ids: '#30D158' };

function StatItem({ icon: Icon, label, value, color, unit }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="flex flex-col gap-1.5 p-3 rounded-[16px] liquid-glass-light transition-all duration-200"
      style={{
        border: '0.5px solid rgba(255,255,255,0.08)',
      }}
    >
      <div className="flex items-center gap-1.5">
        <Icon size={12} strokeWidth={2} style={{ color: 'rgba(255,255,255,0.4)' }} />
        <span className="text-[11px] label-tertiary">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span
          className="text-lg font-bold font-mono tracking-tight"
          style={{ color: color || 'rgba(255,255,255,0.95)', letterSpacing: '-0.02em' }}
        >
          {value !== null && value !== undefined ? value.toLocaleString() : '—'}
        </span>
        {unit && <span className="text-[10px] label-tertiary font-mono">{unit}</span>}
      </div>
    </motion.div>
  );
}

export default function SearchStats({ metrics, selectedAlgo, status }) {
  const accentColor = ALGO_COLORS[selectedAlgo] || '#0A84FF';
  const hasMetrics = metrics && metrics.generated !== undefined;

  return (
    <div className="liquid-glass p-5 rounded-[24px] flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={14} style={{ color: accentColor }} />
          <span className="text-xs font-semibold label-primary tracking-tight">Execution Metrics</span>
        </div>

        {status && (
          <span
            className="text-[11px] font-semibold px-3 py-0.5 rounded-full flex items-center gap-1.5"
            style={
              status === 'solved'
                ? { background: 'rgba(48,209,88,0.18)', color: '#30D158', border: '0.5px solid rgba(48,209,88,0.35)' }
                : status === 'searching'
                  ? { background: `${accentColor}18`, color: accentColor, border: `0.5px solid ${accentColor}35` }
                  : status === 'failed'
                    ? { background: 'rgba(255,69,58,0.18)', color: '#FF453A', border: '0.5px solid rgba(255,69,58,0.35)' }
                    : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '0.5px solid rgba(255,255,255,0.08)' }
            }
          >
            {status === 'searching' && (
              <span className="w-1.5 h-1.5 rounded-full animate-ping" style={{ background: accentColor }} />
            )}
            {status === 'solved' ? '✓ Solved' :
             status === 'searching' ? 'Searching…' :
             status === 'failed' ? 'Exhausted' :
             'Ready'}
          </span>
        )}
      </div>

      {/* Stats Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={hasMetrics ? 'has-metrics' : 'empty'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-2 gap-2.5"
        >
          <StatItem
            icon={Hash}
            label="Generated"
            value={hasMetrics ? metrics.generated : null}
            color={accentColor}
          />
          <StatItem
            icon={Layers}
            label="Expanded"
            value={hasMetrics ? metrics.expanded : null}
          />
          <StatItem
            icon={ArrowDown}
            label="Max Depth"
            value={hasMetrics ? metrics.maxDepth : null}
          />
          <StatItem
            icon={Maximize2}
            label="Max Frontier"
            value={hasMetrics ? metrics.maxFrontier : null}
          />
          <StatItem
            icon={Target}
            label="Solution Cost"
            value={hasMetrics ? metrics.solutionCost : null}
            unit="moves"
            color="#30D158"
          />
          <StatItem
            icon={Clock}
            label="Execution Time"
            value={hasMetrics ? parseFloat(metrics.time?.toFixed(1)) : null}
            unit="ms"
          />
        </motion.div>
      </AnimatePresence>

      {!hasMetrics && (
        <p className="text-[11px] label-tertiary text-center py-1">
          Click Run or press Space to execute
        </p>
      )}
    </div>
  );
}
