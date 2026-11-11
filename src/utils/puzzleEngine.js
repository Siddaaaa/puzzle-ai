/**
 * PUZZLE.AI — 8-Puzzle Engine
 * Core puzzle utilities: generation, validation, solvability, moves.
 */

export const GOAL_STATE = [1, 2, 3, 4, 5, 6, 7, 8, 0];

/** Count inversions to determine solvability */
export function isSolvable(state) {
  const tiles = state.filter(t => t !== 0);
  let inversions = 0;
  for (let i = 0; i < tiles.length; i++) {
    for (let j = i + 1; j < tiles.length; j++) {
      if (tiles[i] > tiles[j]) inversions++;
    }
  }
  return inversions % 2 === 0;
}

/** Check if puzzle is at goal state */
export function isGoalState(state) {
  return state.every((v, i) => v === GOAL_STATE[i]);
}

/** Find blank tile position */
export function findBlank(state) {
  return state.indexOf(0);
}

/** Get index from row, col */
export function idx(row, col) {
  return row * 3 + col;
}

/** Get row, col from index */
export function pos(index) {
  return { row: Math.floor(index / 3), col: index % 3 };
}

/** Get legal moves from current state */
export function getLegalMoves(state) {
  const blank = findBlank(state);
  const { row, col } = pos(blank);
  const moves = [];
  
  if (row > 0) moves.push({ direction: 'up', tileIndex: blank - 3 });
  if (row < 2) moves.push({ direction: 'down', tileIndex: blank + 3 });
  if (col > 0) moves.push({ direction: 'left', tileIndex: blank - 1 });
  if (col < 2) moves.push({ direction: 'right', tileIndex: blank + 1 });
  
  return moves;
}

/** Apply a move: swap tile at tileIndex with blank */
export function applyMove(state, tileIndex) {
  const blank = findBlank(state);
  const newState = [...state];
  [newState[blank], newState[tileIndex]] = [newState[tileIndex], newState[blank]];
  return newState;
}

/** Check if a tile can move (is adjacent to blank) */
export function canMove(state, tileIndex) {
  const blank = findBlank(state);
  const legalMoves = getLegalMoves(state);
  return legalMoves.some(m => m.tileIndex === tileIndex);
}

/** Generate a random solvable puzzle */
export function generateRandomPuzzle(shuffles = 30) {
  let state = [...GOAL_STATE];
  let lastBlank = -1;
  
  for (let i = 0; i < shuffles; i++) {
    const blank = findBlank(state);
    const moves = getLegalMoves(state).filter(m => m.tileIndex !== lastBlank);
    if (moves.length === 0) continue;
    const move = moves[Math.floor(Math.random() * moves.length)];
    state = applyMove(state, move.tileIndex);
    lastBlank = blank;
  }
  
  return state;
}

/** Generate puzzle by difficulty */
export function generateByDifficulty(difficulty) {
  const shuffleCounts = { easy: 10, medium: 25, hard: 50, expert: 100 };
  const shuffles = shuffleCounts[difficulty] || 30;
  return generateRandomPuzzle(shuffles);
}

/** Calculate Manhattan distance (heuristic) */
export function manhattanDistance(state) {
  let dist = 0;
  for (let i = 0; i < 9; i++) {
    if (state[i] === 0) continue;
    const goalPos = pos(GOAL_STATE.indexOf(state[i]));
    const curPos = pos(i);
    dist += Math.abs(curPos.row - goalPos.row) + Math.abs(curPos.col - goalPos.col);
  }
  return dist;
}

/** Count tiles out of place */
export function misplacedTiles(state) {
  return state.filter((v, i) => v !== 0 && v !== GOAL_STATE[i]).length;
}

/** Validate a custom state input */
export function validateState(state) {
  if (!Array.isArray(state) || state.length !== 9) {
    return { valid: false, error: 'State must be an array of 9 numbers' };
  }
  const sorted = [...state].sort((a, b) => a - b);
  if (!sorted.every((v, i) => v === i)) {
    return { valid: false, error: 'State must contain exactly the digits 0-8' };
  }
  if (!isSolvable(state)) {
    return { valid: false, error: 'This configuration is not solvable' };
  }
  return { valid: true };
}
