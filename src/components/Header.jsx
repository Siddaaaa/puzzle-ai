import { motion } from 'framer-motion';
import { Sun, Moon, Keyboard, Grid3X3, Sparkles } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function Header({ activeView, setActiveView, onToggleShortcuts }) {
  const { theme, toggle } = useTheme();
  
  const navItems = [
    { id: 'home', label: 'Overview' },
    { id: 'playground', label: 'Playground' },
    { id: 'analytics', label: 'Analytics' },
  ];

  return (
    <header className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="pointer-events-auto liquid-glass flex items-center justify-between gap-3 sm:gap-6 px-4 py-2 rounded-full max-w-4xl w-full"
        style={{
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
        }}
      >
        {/* Brand */}
        <motion.button
          onClick={() => setActiveView('home')}
          className="flex items-center gap-2.5 group cursor-pointer pl-1"
          whileTap={{ scale: 0.95 }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center shadow-sm"
            style={{
              background: 'linear-gradient(135deg, #1A90FF 0%, #0055CC 100%)',
              border: '0.5px solid rgba(255, 255, 255, 0.3)',
            }}
          >
            <Grid3X3 size={13} color="white" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-semibold tracking-tight label-primary flex items-center gap-1">
            PUZZLE<span style={{ color: '#0A84FF' }}>.AI</span>
          </span>
        </motion.button>

        {/* Floating Segmented Nav */}
        <nav
          className="flex items-center gap-1 p-1 rounded-full relative"
          style={{ background: 'rgba(255, 255, 255, 0.05)' }}
          role="navigation"
          aria-label="Main navigation"
        >
          {navItems.map(item => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`relative px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors duration-150 cursor-pointer ${
                  isActive ? 'text-white font-semibold' : 'label-secondary hover:label-primary'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-pill"
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.08) 100%)',
                      border: '0.5px solid rgba(255, 255, 255, 0.28)',
                      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.3)',
                    }}
                    transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                  />
                )}
                <span className="relative z-10 flex items-center">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Right Tools */}
        <div className="flex items-center gap-1.5 pr-1">
          {/* Keyboard Shortcuts Trigger */}
          <motion.button
            onClick={onToggleShortcuts}
            whileTap={{ scale: 0.9 }}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150 label-secondary hover:label-primary cursor-pointer hover:bg-white/10"
            title="Keyboard shortcuts (?)"
            aria-label="View keyboard shortcuts"
          >
            <Keyboard size={15} strokeWidth={2} />
          </motion.button>

          {/* Theme switcher */}
          <motion.button
            onClick={toggle}
            whileTap={{ scale: 0.9 }}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150 label-secondary hover:label-primary cursor-pointer hover:bg-white/10"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode (M)`}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark'
              ? <Sun size={15} strokeWidth={2} />
              : <Moon size={15} strokeWidth={2} />
            }
          </motion.button>
        </div>
      </motion.div>
    </header>
  );
}
