import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import Header from './components/Header';
import HomeView from './components/HomeView';
import PlaygroundView from './components/PlaygroundView';
import AnalyticsView from './components/AnalyticsView';
import { X, Keyboard, Command } from 'lucide-react';

const pageTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] }
};

function ShortcutsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: '↑ ↓ ← →', alt: 'W A S D', desc: 'Slide tiles into blank space' },
    { key: 'Space', desc: 'Run search algorithm or toggle solution playback' },
    { key: 'R', desc: 'Shuffle puzzle to a fresh solvable state' },
    { key: '1, 2, 3', desc: 'Quick switch: Overview, Playground, Analytics' },
    { key: 'M', desc: 'Toggle Dark / Light appearance' },
    { key: '?', desc: 'Show / hide this shortcuts cheat sheet' },
    { key: 'Esc', desc: 'Close dialogs or clear inspector' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="liquid-glass p-6 rounded-[28px] max-w-md w-full shadow-2xl relative"
        style={{
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.25)',
        }}
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2">
            <Keyboard size={16} className="text-blue-400" />
            <h3 className="text-sm font-bold label-primary tracking-tight">macOS Keyboard Shortcuts</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center label-secondary hover:label-primary hover:bg-white/10 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        <div className="space-y-3">
          {shortcuts.map((s, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-white/5">
              <span className="label-secondary">{s.desc}</span>
              <div className="flex items-center gap-1">
                <kbd className="kbd-badge">{s.key}</kbd>
                {s.alt && <kbd className="kbd-badge text-white/40">{s.alt}</kbd>}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-3 text-center">
          <button
            onClick={onClose}
            className="btn-primary w-full text-xs py-2"
          >
            Got It
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function AppContent() {
  const [activeView, setActiveView] = useState('home');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const { theme, toggle } = useTheme();

  // Global Keybindings
  useEffect(() => {
    const handleGlobalKey = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      if (e.key === '?' || (e.key === '/' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        setShowShortcuts(prev => !prev);
      } else if (e.key === 'Escape') {
        setShowShortcuts(false);
      } else if (e.key === '1') {
        setActiveView('home');
      } else if (e.key === '2') {
        setActiveView('playground');
      } else if (e.key === '3') {
        setActiveView('analytics');
      } else if (e.key === 'm' || e.key === 'M') {
        if (!e.metaKey && !e.ctrlKey) {
          toggle();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [toggle]);

  return (
    <div
      className="min-h-screen relative overflow-hidden transition-colors duration-300"
      style={{
        background: theme === 'dark' ? '#0A0A0C' : '#F5F5F7',
      }}
    >
      {/* Apple-style Ambient Luminous Background Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Orb 1: Royal Blue top-center */}
        <motion.div
          animate={{
            x: [0, 40, -30, 0],
            y: [0, -30, 20, 0],
            scale: [1, 1.15, 0.95, 1],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-32 left-1/4 w-[550px] h-[550px] rounded-full blur-[130px] opacity-25 dark:opacity-20"
          style={{ background: '#0A84FF' }}
        />

        {/* Orb 2: Electric Purple / Indigo bottom-right */}
        <motion.div
          animate={{
            x: [0, -50, 40, 0],
            y: [0, 40, -30, 0],
            scale: [1, 0.9, 1.1, 1],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/3 -right-20 w-[600px] h-[600px] rounded-full blur-[140px] opacity-20 dark:opacity-15"
          style={{ background: '#BF5AF2' }}
        />

        {/* Orb 3: Mint / Emerald bottom-left */}
        <motion.div
          animate={{
            x: [0, 30, -40, 0],
            y: [0, -20, 30, 0],
            scale: [1, 1.1, 0.9, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-40 left-10 w-[500px] h-[500px] rounded-full blur-[130px] opacity-15 dark:opacity-10"
          style={{ background: '#30D158' }}
        />
      </div>

      {/* Main Content Layer (Z-10) */}
      <div className="relative z-10">
        <Header
          activeView={activeView}
          setActiveView={setActiveView}
          onToggleShortcuts={() => setShowShortcuts(prev => !prev)}
        />

        <AnimatePresence mode="wait">
          {activeView === 'home' && (
            <motion.div key="home" {...pageTransition}>
              <HomeView setActiveView={setActiveView} />
            </motion.div>
          )}
          {activeView === 'playground' && (
            <motion.div key="playground" {...pageTransition}>
              <PlaygroundView />
            </motion.div>
          )}
          {activeView === 'analytics' && (
            <motion.div key="analytics" {...pageTransition}>
              <AnalyticsView />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Shortcuts Modal */}
      <ShortcutsModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
