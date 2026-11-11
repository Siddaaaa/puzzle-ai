# PUZZLE.AI — System Architecture & Specification

## 1. Executive Summary

**PUZZLE.AI** is an intelligent educational and research platform designed to demonstrate how artificial intelligence search algorithms navigate complex, discrete state spaces. The application pairs mathematically rigorous implementations of classical unformed search strategies with an interface grounded in Apple's Human Interface Guidelines (macOS Sequoia and iPadOS design language, selective Liquid Glass materials, system typography, spring-based direct manipulation, and keyboard-driven ergonomics).

---

## 2. Mathematical Formalization of the 8-Puzzle

The 8-puzzle is a classical problem in Artificial Intelligence with a discrete, deterministic, observable, and static environment.

### 2.1 State Space Representation
- **State Vector**: $S = [s_0, s_1, s_2, s_3, s_4, s_5, s_6, s_7, s_8]$ where $s_i \in \{0, 1, \dots, 8\}$.
- $s_i = 0$ represents the empty/blank tile.
- Matrix coordinates are mapped via row $r = \lfloor i / 3 \rfloor$ and column $c = i \pmod 3$.
- Total permutations: $9! = 362,880$.
- Solvable state space: Exactly half ($9! / 2 = 181,440$) states are reachable from any given configuration due to permutation parity.

### 2.2 Solvability Invariant (Inversions Parity)
An inversion occurs when a pair of tiles $(a, b)$ satisfies $a > b$ with index $(a) < \text{index}(b)$, excluding the blank tile ($0$).
$$\text{Inversions} = \sum_{i=0}^{7} \sum_{j=i+1}^{8} \mathbb{I}(S[i] > S[j] \land S[i] \neq 0 \land S[j] \neq 0)$$
- **Theorem**: An 8-puzzle state is solvable if and only if its inversion count is **even** (assuming the standard goal state $[1,2,3,4,5,6,7,8,0]$ where the blank is at the end).

### 2.3 Action Space & Transition Model
The blank tile $0$ can transition:
$$\text{Actions}(S) \subseteq \{\text{UP}, \text{DOWN}, \text{LEFT}, \text{RIGHT}\}$$
- $\text{UP}: r > 0 \implies \text{Swap}(0, \text{pos}(0) - 3)$
- $\text{DOWN}: r < 2 \implies \text{Swap}(0, \text{pos}(0) + 3)$
- $\text{LEFT}: c > 0 \implies \text{Swap}(0, \text{pos}(0) - 1)$
- $\text{RIGHT}: c < 2 \implies \text{Swap}(0, \text{pos}(0) + 1)$

### 2.4 Heuristic Admissibility
1. **Manhattan Distance ($h_1$)**:
   $$h_1(S) = \sum_{i: S[i] \neq 0} |r_i - r_i^*| + |c_i - c_i^*|$$
   Admissible and consistent; never overestimates the true move count.
2. **Misplaced Tiles ($h_2$)**:
   $$h_2(S) = \sum_{i: S[i] \neq 0} \mathbb{I}(S[i] \neq \text{Goal}[i])$$
   Strictly dominated by $h_1(S)$.

---

## 3. Search Algorithm Specifications

### 3.1 Breadth-First Search (BFS)
- **Data Structure**: First-In, First-Out (FIFO) queue for frontier; Hash Set for explored closed-list.
- **Completeness**: Guaranteed complete on finite state spaces.
- **Optimality**: Guaranteed optimal for unit-step cost (finds shortest move path).
- **Time Complexity**: $O(b^d)$ where $b$ is the effective branching factor ($\approx 2.67$) and $d$ is solution depth.
- **Space Complexity**: $O(b^d)$ (all generated nodes stored in memory/queue).

### 3.2 Depth-First Search (DFS)
- **Data Structure**: Last-In, First-Out (LIFO) stack; Hash Set for cycle detection.
- **Completeness**: Complete on finite state spaces with graph search (cycle detection).
- **Optimality**: Non-optimal. Tends to explore deep paths before shallow alternatives, yielding non-minimal move solutions.
- **Time Complexity**: $O(b^m)$ where $m$ is maximum depth limit.
- **Space Complexity**: $O(b \cdot m)$ (only tracks the active path plus unexpanded siblings).

### 3.3 Iterative Deepening Search (IDS)
- **Data Structure**: Repeated Depth-Limited Search (DLS) using recursive stack up to limit $L = 0, 1, 2, \dots$.
- **Completeness**: Complete.
- **Optimality**: Guaranteed optimal (finds first solution at minimal depth $d$).
- **Time Complexity**: $O(b^d)$ (redundant upper-level node generation is asymptotically dominated by the bottom layer: $\sum_{i=1}^{d} (d - i + 1) b^i = O(b^d)$).
- **Space Complexity**: $O(b \cdot d)$ (retains the linear space advantage of DFS while guaranteeing BFS optimality).

---

## 4. Apple Design System & Liquid Glass Integration

Grounding in `apple-design-skill` and Apple Human Interface Guidelines:

### 4.1 Ambient Light & Multi-layer Liquid Glass
- **Ambient Luminous Backdrop**: Three blurred, floating mesh light orbs (Royal Blue `#0A84FF`, Electric Purple `#BF5AF2`, Mint Emerald `#30D158`) in the canvas layer provide genuine chromatic luminosity for translucent surfaces to reflect and refract.
- **Liquid Glass Material**:
  - `background: rgba(26, 26, 30, 0.62)`
  - `backdrop-filter: blur(28px) saturate(180%)`
  - Specular rim light: `inset 0 1px 1px rgba(255, 255, 255, 0.14)`
  - Subtle drop shadow: `0 10px 30px rgba(0, 0, 0, 0.4)`
- **Liquid Glass Tiles**:
  - Tactile 3D glass tiles (`.apple-tile`) with subtle bevel highlights, large SF Pro numerals, directional arrow indicators, and spring hover dynamics.

### 4.2 Interaction & Direct Manipulation
- **Keyboard Direct Manipulation**:
  - Arrow Keys ($\uparrow, \downarrow, \leftarrow, \rightarrow$) and `W, A, S, D` slide tiles directly into the blank space.
  - `Space`: Run search algorithm or toggle solution playback.
  - `R`: Shuffle board to fresh solvable permutation.
  - `1, 2, 3`: Switch between Overview, Playground, and Analytics.
  - `M`: Toggle Light / Dark appearance.
  - `?`: Toggle macOS Keyboard Shortcuts cheat sheet modal.
- **Interactive Heuristics HUD**:
  - Live HUD toggle computes and displays real-time Manhattan distance and misplaced tiles per tile and globally.

### 4.3 Typography & Color
- Native system font stack (`-apple-system`, `BlinkMacSystemFont`, `"SF Pro Display"`, `"SF Pro Text"`, `"Segoe UI"`, `sans-serif`).
- Semantic Accents:
  - System Blue (`#0A84FF`): Primary actions & BFS
  - System Purple (`#BF5AF2`): DFS
  - System Green (`#30D158`): Goal state & IDS
  - System Red (`#FF453A`): Halt / alerts

---

## 5. Architectural Components

```
puzzle-ai/
├── src/
│   ├── main.jsx                 # Application entry point
│   ├── App.jsx                  # Root view coordinator, ambient light orbs & shortcuts modal
│   ├── index.css                # Apple typography, Liquid Glass materials, and tile styles
│   ├── contexts/
│   │   └── ThemeContext.jsx     # Dark/light appearance state provider
│   ├── utils/
│   │   └── puzzleEngine.js      # Solvability, inversion counter, legal moves, heuristics
│   ├── workers/
│   │   └── searchWorker.js      # Background Web Worker (BFS, DFS, IDS, Tree sampling)
│   └── components/
│       ├── Header.jsx           # Floating Liquid Glass pill dock navigation
│       ├── HomeView.jsx         # Apple landing page with interactive mini-puzzles
│       ├── PlaygroundView.jsx   # Keyboard-controlled board, heuristics HUD, search runner
│       ├── PuzzleBoard.jsx      # Tactile liquid glass tiles, directional arrows, spring physics
│       ├── AlgorithmSelector.jsx# Frosted glass segmented control with complexity specs
│       ├── PlaybackControls.jsx # Scrubber, speed pill, step forward/back, play/pause
│       ├── SearchStats.jsx      # Liquid glass stat tiles with animated indicators
│       ├── SearchTreeVisualizer.jsx # Interactive search tree topology & node inspector
│       └── AnalyticsView.jsx    # Live Algorithm Race arena & Recharts comparisons
```
