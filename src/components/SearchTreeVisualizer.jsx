import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Network, CheckCircle2, ArrowRight, CornerDownRight, ZoomIn, Eye, Sparkles } from 'lucide-react';

const ALGO_COLORS = {
  bfs: '#0A84FF',
  dfs: '#BF5AF2',
  ids: '#30D158',
};

// Compact mini 3x3 tile grid for tree node previews
function CompactPuzzleState({ state, isSolution, isGoal, isSelected, accentColor }) {
  return (
    <div
      className="grid gap-[1px] p-1 rounded-[8px] transition-all duration-200"
      style={{
        gridTemplateColumns: 'repeat(3, 1fr)',
        width: 46,
        height: 46,
        background: isSolution
          ? 'linear-gradient(135deg, rgba(48,209,88,0.3) 0%, rgba(48,209,88,0.1) 100%)'
          : isSelected
            ? `${accentColor}30`
            : 'rgba(0,0,0,0.4)',
        border: isSolution
          ? '1px solid rgba(48,209,88,0.7)'
          : isSelected
            ? `1.5px solid ${accentColor}`
            : '0.5px solid rgba(255,255,255,0.12)',
        boxShadow: isSolution
          ? '0 0 12px rgba(48,209,88,0.3)'
          : isSelected
            ? `0 0 12px ${accentColor}40`
            : 'none',
      }}
    >
      {state.map((t, idx) => (
        <div
          key={idx}
          className="flex items-center justify-center rounded-[3px] font-mono text-[8px] font-bold"
          style={{
            background: t === 0 ? 'transparent' : 'rgba(255,255,255,0.08)',
            color: t === 0 ? 'transparent' : isSolution ? '#30D158' : 'rgba(255,255,255,0.9)',
          }}
        >
          {t === 0 ? '' : t}
        </div>
      ))}
    </div>
  );
}

export default function SearchTreeVisualizer({
  treeNodes = [],
  selectedAlgo = 'bfs',
  onSelectNode,
  selectedNodeId,
}) {
  const [hoveredNode, setHoveredNode] = useState(null);
  const accentColor = ALGO_COLORS[selectedAlgo] || '#0A84FF';

  if (!treeNodes || treeNodes.length === 0) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center gap-3 liquid-glass-light rounded-[24px]">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.1)' }}
        >
          <Network size={22} className="label-tertiary" />
        </div>
        <p className="text-sm font-semibold label-secondary">Search Tree Topology</p>
        <p className="text-xs label-tertiary max-w-sm leading-relaxed">
          Execute BFS, DFS, or IDS in the playground to stream the actual search tree hierarchy and expanded states.
        </p>
      </div>
    );
  }

  // Group nodes by depth
  const depthGroups = treeNodes.reduce((acc, node) => {
    const d = node.depth;
    if (!acc[d]) acc[d] = [];
    acc[d].push(node);
    return acc;
  }, {});

  const depths = Object.keys(depthGroups)
    .map(Number)
    .sort((a, b) => a - b)
    .slice(0, 7);

  const activeInspectNode = treeNodes.find(n => n.id === (hoveredNode ?? selectedNodeId)) || treeNodes[0];

  return (
    <div className="flex flex-col gap-4">
      {/* Topology Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Network size={16} style={{ color: accentColor }} />
          <h3 className="text-sm font-semibold label-primary tracking-tight">Search Tree Topology</h3>
          <span className="text-[11px] font-mono label-tertiary">
            ({treeNodes.length} sampled nodes across {depths.length} depth levels)
          </span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] label-secondary">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: '#30D158' }} />
            <span>Solution Path</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: accentColor }} />
            <span>Frontier</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.3)' }} />
            <span>Expanded</span>
          </div>
        </div>
      </div>

      {/* Main visualization grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-4">
        {/* Horizontal Tree Scroll */}
        <div
          className="p-3.5 rounded-[20px] overflow-x-auto space-y-4"
          style={{
            background: 'rgba(0,0,0,0.35)',
            border: '0.5px solid rgba(255,255,255,0.08)',
            maxHeight: 380,
          }}
        >
          {depths.map(depth => (
            <div key={depth} className="flex items-start gap-3">
              {/* Depth Label */}
              <div className="w-16 flex-shrink-0 pt-2 text-right text-[11px] font-mono label-tertiary">
                Depth {depth}
              </div>

              {/* Nodes at this depth */}
              <div className="flex items-center gap-2 flex-wrap flex-1">
                {depthGroups[depth].slice(0, 14).map(node => {
                  const isSolution = node.isSolution;
                  const isSelected = (selectedNodeId ?? 0) === node.id;
                  const isHovered = hoveredNode === node.id;

                  return (
                    <motion.div
                      key={node.id}
                      onClick={() => onSelectNode?.(node)}
                      onMouseEnter={() => setHoveredNode(node.id)}
                      onMouseLeave={() => setHoveredNode(null)}
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.94 }}
                      className="cursor-pointer transition-all duration-150 relative group"
                      title={`Node #${node.id} (Move: ${node.move || 'Root'}, Depth: ${node.depth})`}
                    >
                      <CompactPuzzleState
                        state={node.state}
                        isSolution={isSolution}
                        isGoal={node.status === 'goal'}
                        isSelected={isSelected || isHovered}
                        accentColor={accentColor}
                      />

                      {/* Small move badge */}
                      {node.move && (
                        <div
                          className="absolute -top-1.5 -right-1 px-1 rounded-[4px] text-[8px] uppercase font-bold"
                          style={{
                            background: isSolution ? '#30D158' : 'rgba(255,255,255,0.2)',
                            color: isSolution ? '#000' : '#fff',
                          }}
                        >
                          {node.move[0]}
                        </div>
                      )}
                    </motion.div>
                  );
                })}

                {depthGroups[depth].length > 14 && (
                  <span className="text-[10px] label-tertiary font-mono self-center px-1">
                    +{depthGroups[depth].length - 14} more
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Node Inspector Panel */}
        {activeInspectNode && (
          <div
            className="p-4 rounded-[20px] liquid-glass-light flex flex-col justify-between"
            style={{
              border: '0.5px solid rgba(255,255,255,0.1)',
            }}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold label-primary tracking-tight">Node Inspector</span>
                <span
                  className="text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold"
                  style={{
                    background: activeInspectNode.isSolution
                      ? 'rgba(48,209,88,0.2)'
                      : `${accentColor}20`,
                    color: activeInspectNode.isSolution ? '#30D158' : accentColor,
                    border: `0.5px solid ${activeInspectNode.isSolution ? '#30D15840' : accentColor + '40'}`,
                  }}
                >
                  {activeInspectNode.isSolution
                    ? 'Solution Step'
                    : activeInspectNode.depth === 0
                      ? 'Root Node'
                      : activeInspectNode.status || 'Frontier'}
                </span>
              </div>

              {/* 3x3 Tile preview */}
              <div className="flex justify-center my-2">
                <div
                  className="grid gap-1 p-2 rounded-[16px] liquid-glass"
                  style={{
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    width: 104,
                    height: 104,
                  }}
                >
                  {activeInspectNode.state.map((t, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-center rounded-[4px] font-semibold text-xs"
                      style={{
                        background: t === 0 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.08)',
                        color: t === 0 ? 'transparent' : activeInspectNode.isSolution ? '#30D158' : '#fff',
                      }}
                    >
                      {t === 0 ? '' : t}
                    </div>
                  ))}
                </div>
              </div>

              {/* Metadata */}
              <div className="space-y-1.5 text-xs label-secondary mt-3">
                <div className="flex justify-between">
                  <span className="label-tertiary">Node ID:</span>
                  <span className="font-mono label-primary">#{activeInspectNode.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="label-tertiary">Tree Depth:</span>
                  <span className="font-mono label-primary">{activeInspectNode.depth}</span>
                </div>
                <div className="flex justify-between">
                  <span className="label-tertiary">Transition:</span>
                  <span className="font-mono uppercase font-semibold" style={{ color: accentColor }}>
                    {activeInspectNode.move || 'Initial State'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="label-tertiary">Parent ID:</span>
                  <span className="font-mono label-primary">
                    {activeInspectNode.parentId !== null ? `#${activeInspectNode.parentId}` : 'None (Root)'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onSelectNode?.(activeInspectNode)}
              className="mt-4 w-full py-2 px-3 rounded-full text-xs font-semibold btn-secondary flex items-center justify-center gap-1.5"
            >
              <ZoomIn size={12} />
              <span>Project on Board</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
