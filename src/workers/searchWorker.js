/**
 * PUZZLE.AI — Search Algorithm Web Worker
 * Runs BFS, DFS, IDS in background to keep UI responsive.
 * Emits execution events and collects the search tree topology for interactive visualization.
 */

function stateKey(state) {
  return state.join(',');
}

function findBlank(state) {
  return state.indexOf(0);
}

function getNeighbors(state) {
  const blank = findBlank(state);
  const row = Math.floor(blank / 3);
  const col = blank % 3;
  const moves = [];
  
  // Up
  if (row > 0) {
    const s = [...state];
    [s[blank], s[blank - 3]] = [s[blank - 3], s[blank]];
    moves.push({ state: s, move: 'up', movedTile: s[blank] });
  }
  // Down
  if (row < 2) {
    const s = [...state];
    [s[blank], s[blank + 3]] = [s[blank + 3], s[blank]];
    moves.push({ state: s, move: 'down', movedTile: s[blank] });
  }
  // Left
  if (col > 0) {
    const s = [...state];
    [s[blank], s[blank - 1]] = [s[blank - 1], s[blank]];
    moves.push({ state: s, move: 'left', movedTile: s[blank] });
  }
  // Right
  if (col < 2) {
    const s = [...state];
    [s[blank], s[blank + 1]] = [s[blank + 1], s[blank]];
    moves.push({ state: s, move: 'right', movedTile: s[blank] });
  }
  
  return moves;
}

const GOAL_STATE = [1, 2, 3, 4, 5, 6, 7, 8, 0];
const GOAL_KEY = stateKey(GOAL_STATE);

function rebuildPath(parent, goalState) {
  const path = [{ state: goalState, move: null }];
  let key = stateKey(goalState);
  
  while (parent.has(key) && parent.get(key) !== null) {
    const { state: parentState, move } = parent.get(key);
    path.unshift({ state: parentState, move: null });
    path[1] = { state: path[1].state, move };
    key = stateKey(parentState);
  }
  
  const fixedPath = [{ state: path[0].state, move: null }];
  for (let i = 1; i < path.length; i++) {
    fixedPath.push({ state: path[i].state, move: path[i].move });
  }
  
  return fixedPath;
}

// ─── BFS ─────────────────────────────────────────────────────────────────────

function bfs(initial) {
  const startTime = performance.now();
  const queue = [{ id: 0, state: initial, depth: 0, parentId: null, move: null }];
  const visited = new Set([stateKey(initial)]);
  const parent = new Map();
  parent.set(stateKey(initial), null);
  
  let generated = 1;
  let expanded = 0;
  let maxFrontier = 1;
  let maxDepth = 0;
  let nodeIdCounter = 0;

  // Track tree nodes for UI visualization (capped to avoid memory blowup)
  const treeNodes = [];
  const MAX_TREE_NODES = 120;

  treeNodes.push({
    id: 0,
    state: initial,
    depth: 0,
    parentId: null,
    move: null,
    status: 'root'
  });
  
  while (queue.length > 0) {
    if (generated > 150000) {
      return {
        success: false,
        reason: 'Search node limit reached (150,000 states)',
        treeNodes,
        metrics: { generated, expanded, maxDepth, maxFrontier, time: performance.now() - startTime }
      };
    }
    
    const current = queue.shift();
    expanded++;
    maxDepth = Math.max(maxDepth, current.depth);

    const recordedNode = treeNodes.find(n => n.id === current.id);
    if (recordedNode && recordedNode.status !== 'root') {
      recordedNode.status = 'expanded';
    }
    
    if (stateKey(current.state) === GOAL_KEY) {
      const path = rebuildPath(parent, current.state);
      const solutionKeySet = new Set(path.map(p => stateKey(p.state)));
      
      for (const node of treeNodes) {
        if (solutionKeySet.has(stateKey(node.state))) {
          node.isSolution = true;
        }
      }
      
      return {
        success: true,
        path,
        treeNodes,
        metrics: {
          generated,
          expanded,
          solutionCost: path.length - 1,
          maxDepth,
          maxFrontier,
          time: performance.now() - startTime
        }
      };
    }
    
    for (const { state: next, move } of getNeighbors(current.state)) {
      const key = stateKey(next);
      if (!visited.has(key)) {
        visited.add(key);
        generated++;
        nodeIdCounter++;
        parent.set(key, { state: current.state, move });
        
        const childNode = {
          id: nodeIdCounter,
          state: next,
          depth: current.depth + 1,
          parentId: current.id,
          move
        };
        queue.push(childNode);
        maxFrontier = Math.max(maxFrontier, queue.length);

        if (treeNodes.length < MAX_TREE_NODES) {
          treeNodes.push({
            ...childNode,
            status: stateKey(next) === GOAL_KEY ? 'goal' : 'frontier'
          });
        }
      }
    }
  }
  
  return {
    success: false,
    reason: 'State space exhausted without reaching goal state',
    treeNodes,
    metrics: { generated, expanded, maxDepth, maxFrontier, time: performance.now() - startTime }
  };
}

// ─── DFS ─────────────────────────────────────────────────────────────────────

function dfs(initial, maxDepthLimit = 60) {
  const startTime = performance.now();
  const stack = [{ id: 0, state: initial, depth: 0, parentId: null, move: null }];
  const visited = new Set([stateKey(initial)]);
  const parent = new Map();
  parent.set(stateKey(initial), null);
  
  let generated = 1;
  let expanded = 0;
  let maxFrontier = 1;
  let maxDepth = 0;
  let nodeIdCounter = 0;

  const treeNodes = [];
  const MAX_TREE_NODES = 120;

  treeNodes.push({
    id: 0,
    state: initial,
    depth: 0,
    parentId: null,
    move: null,
    status: 'root'
  });
  
  while (stack.length > 0) {
    if (generated > 150000) {
      return {
        success: false,
        reason: 'Search node limit reached (150,000 states)',
        treeNodes,
        metrics: { generated, expanded, maxDepth, maxFrontier, time: performance.now() - startTime }
      };
    }
    
    const current = stack.pop();
    expanded++;
    maxDepth = Math.max(maxDepth, current.depth);

    const recordedNode = treeNodes.find(n => n.id === current.id);
    if (recordedNode && recordedNode.status !== 'root') {
      recordedNode.status = 'expanded';
    }
    
    if (stateKey(current.state) === GOAL_KEY) {
      const path = rebuildPath(parent, current.state);
      const solutionKeySet = new Set(path.map(p => stateKey(p.state)));
      
      for (const node of treeNodes) {
        if (solutionKeySet.has(stateKey(node.state))) {
          node.isSolution = true;
        }
      }
      
      return {
        success: true,
        path,
        treeNodes,
        metrics: {
          generated,
          expanded,
          solutionCost: path.length - 1,
          maxDepth,
          maxFrontier,
          time: performance.now() - startTime
        }
      };
    }
    
    if (current.depth < maxDepthLimit) {
      for (const { state: next, move } of getNeighbors(current.state)) {
        const key = stateKey(next);
        if (!visited.has(key)) {
          visited.add(key);
          generated++;
          nodeIdCounter++;
          parent.set(key, { state: current.state, move });
          
          const childNode = {
            id: nodeIdCounter,
            state: next,
            depth: current.depth + 1,
            parentId: current.id,
            move
          };
          stack.push(childNode);
          maxFrontier = Math.max(maxFrontier, stack.length);

          if (treeNodes.length < MAX_TREE_NODES) {
            treeNodes.push({
              ...childNode,
              status: stateKey(next) === GOAL_KEY ? 'goal' : 'frontier'
            });
          }
        }
      }
    }
  }
  
  return {
    success: false,
    reason: `Depth limit (${maxDepthLimit}) reached without reaching goal state`,
    treeNodes,
    metrics: { generated, expanded, maxDepth, maxFrontier, time: performance.now() - startTime }
  };
}

// ─── IDS ─────────────────────────────────────────────────────────────────────

function ids(initial) {
  const startTime = performance.now();
  let totalGenerated = 1;
  let totalExpanded = 0;
  let maxFrontierOverall = 1;
  let finalTreeNodes = [];
  
  for (let depthLimit = 0; depthLimit <= 50; depthLimit++) {
    const result = depthLimitedSearch(initial, depthLimit);
    totalGenerated += result.generated;
    totalExpanded += result.expanded;
    maxFrontierOverall = Math.max(maxFrontierOverall, result.maxFrontier);
    if (result.treeNodes && result.treeNodes.length > 0) {
      finalTreeNodes = result.treeNodes;
    }
    
    if (result.success) {
      return {
        success: true,
        path: result.path,
        treeNodes: finalTreeNodes,
        metrics: {
          generated: totalGenerated,
          expanded: totalExpanded,
          solutionCost: result.path.length - 1,
          maxDepth: depthLimit,
          maxFrontier: maxFrontierOverall,
          time: performance.now() - startTime
        }
      };
    }
    
    if (totalGenerated > 350000) {
      return {
        success: false,
        reason: 'IDS node limit exceeded (350,000 total states generated)',
        treeNodes: finalTreeNodes,
        metrics: { generated: totalGenerated, expanded: totalExpanded, maxDepth: depthLimit, maxFrontier: maxFrontierOverall, time: performance.now() - startTime }
      };
    }
  }
  
  return {
    success: false,
    reason: 'IDS reached depth limit 50 without goal state',
    treeNodes: finalTreeNodes,
    metrics: { generated: totalGenerated, expanded: totalExpanded, maxDepth: 50, maxFrontier: maxFrontierOverall, time: performance.now() - startTime }
  };
}

function depthLimitedSearch(initial, limit) {
  const stack = [{ id: 0, state: initial, depth: 0, parentId: null, move: null, path: [{ state: initial, move: null }] }];
  const visitedAtDepth = new Map();
  visitedAtDepth.set(stateKey(initial), 0);
  
  let generated = 0;
  let expanded = 0;
  let maxFrontier = 1;
  let nodeIdCounter = 0;

  const treeNodes = [{
    id: 0,
    state: initial,
    depth: 0,
    parentId: null,
    move: null,
    status: 'root'
  }];
  
  while (stack.length > 0) {
    const current = stack.pop();
    expanded++;
    
    if (stateKey(current.state) === GOAL_KEY) {
      const solutionKeySet = new Set(current.path.map(p => stateKey(p.state)));
      for (const node of treeNodes) {
        if (solutionKeySet.has(stateKey(node.state))) {
          node.isSolution = true;
        }
      }
      return { success: true, path: current.path, generated, expanded, maxFrontier, treeNodes };
    }
    
    if (current.depth < limit) {
      for (const { state: next, move } of getNeighbors(current.state)) {
        const key = stateKey(next);
        const prevDepth = visitedAtDepth.get(key);
        
        if (prevDepth === undefined || current.depth + 1 < prevDepth) {
          visitedAtDepth.set(key, current.depth + 1);
          generated++;
          nodeIdCounter++;
          
          const childNode = {
            id: nodeIdCounter,
            state: next,
            depth: current.depth + 1,
            parentId: current.id,
            move,
            path: [...current.path, { state: next, move }]
          };
          stack.push(childNode);
          maxFrontier = Math.max(maxFrontier, stack.length);

          if (treeNodes.length < 120) {
            treeNodes.push({
              id: nodeIdCounter,
              state: next,
              depth: current.depth + 1,
              parentId: current.id,
              move,
              status: stateKey(next) === GOAL_KEY ? 'goal' : 'frontier'
            });
          }
        }
      }
    }
    
    if (generated > 80000) break;
  }
  
  return { success: false, generated, expanded, maxFrontier, treeNodes };
}

// ─── Message Handler ──────────────────────────────────────────────────────────

self.onmessage = function(e) {
  const { algorithm, initialState } = e.data;
  
  try {
    let result;
    
    if (algorithm === 'bfs') {
      result = bfs(initialState);
    } else if (algorithm === 'dfs') {
      result = dfs(initialState);
    } else if (algorithm === 'ids') {
      result = ids(initialState);
    } else {
      self.postMessage({ type: 'error', message: 'Unknown algorithm: ' + algorithm });
      return;
    }
    
    self.postMessage({ type: 'result', algorithm, ...result });
  } catch (err) {
    self.postMessage({ type: 'error', message: err.message });
  }
};
