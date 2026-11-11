# PUZZLE.AI — 8-Puzzle AI Solver & State-Space Visualizer

> An Apple-inspired 8-Puzzle educational exploration platform combining classical AI search algorithms with macOS Sequoia / iPadOS fluid interfaces, liquid glass materials, and real-time empirical benchmarking.

---

## ✨ Features

- **Apple-Inspired Design Language:**
  - SF Pro typography stack and semantic design tokens.
  - Liquid Glass (`backdrop-filter: blur(28px)`) navigation, floating toolbars, and tactile puzzle tiles.
  - Smooth spring physics and fluid micro-interactions built with Framer Motion.
- **Interactive 8-Puzzle Playground:**
  - 3×3 direct-manipulation puzzle board with tactile feedback and legal move validation.
  - Solvable permutation generator (Parity & inversion validation).
  - Custom initial-state input and difficulty shuffles.
  - Live Heuristic HUD displaying Manhattan Distance ($h_1$) and Misplaced Tiles ($h_2$).
- **AI Search Algorithms:**
  - **Breadth-First Search (BFS):** FIFO Queue, guaranteed shortest path (optimal).
  - **Depth-First Search (DFS):** LIFO Stack, rapid deep-dive exploration.
  - **Iterative Deepening Search (IDS):** Combines BFS optimality with DFS $O(bd)$ space efficiency.
- **Dedicated Web Worker Engine:**
  - Heavy tree searches run off the main thread in a dedicated background Web Worker, ensuring a smooth 60 FPS UI.
- **Interactive Search Tree Visualizer:**
  - Live hierarchical tree diagram with depth layers, branch inspection, and node states.
- **Live Concurrent Algorithm Race:**
  - Simulates BFS, DFS, and IDS simultaneously on the exact same permutation.
  - Real-time tile animation and timer that halts the instant a solution is found.
  - Recharts comparative performance analytics (Runtime, Generated States, Expanded Nodes, Solution Cost).

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or later recommended)
- `npm` or `pnpm`

### Installation & Run

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/puzzle-ai.git
   cd puzzle-ai
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   Navigate to `http://localhost:5173`

---

## 🛠 Tech Stack

- **Framework:** React 18
- **Build Tool:** Vite
- **Styling:** Tailwind CSS + Custom Liquid Glass Materials
- **Animation:** Framer Motion
- **Icons:** Lucide React
- **Data Visualization:** Recharts
- **Concurrency:** Native Web Worker (`searchWorker.js`)

---

## 📁 Project Structure

```
puzzle-ai/
├── public/                 # Static assets
├── src/
│   ├── components/         # Apple-inspired UI views & components
│   │   ├── AlgorithmSelector.jsx
│   │   ├── AnalyticsView.jsx
│   │   ├── Header.jsx
│   │   ├── HomeView.jsx
│   │   ├── PlaybackControls.jsx
│   │   ├── PlaygroundView.jsx
│   │   ├── PuzzleBoard.jsx
│   │   ├── SearchStats.jsx
│   │   └── SearchTreeVisualizer.jsx
│   ├── utils/              # 8-Puzzle math, parity, heuristics & moves
│   │   └── puzzleEngine.js
│   ├── workers/            # Search Web Worker (BFS, DFS, IDS)
│   │   └── searchWorker.js
│   ├── App.jsx             # Main application orchestrator
│   ├── index.css           # Apple design tokens & liquid glass styles
│   └── main.jsx
├── design.md               # Complete AI search & architecture spec
├── index.html
├── package.json
└── tailwind.config.js
```

---

## 📄 License
MIT License. Created for AI educational exploration and Apple Human Interface Guidelines research.
