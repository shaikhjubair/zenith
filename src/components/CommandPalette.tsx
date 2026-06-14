import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ChevronRight } from 'lucide-react';

interface CommandPaletteProps {
  onNavigate: (module: string) => void;
}

const MODULES = [
  { id: 'dashboard', name: 'Dashboard', desc: 'AI Insights & Overview' },
  { id: 'study', name: 'Study', desc: 'Curriculum & Exams' },
  { id: 'skills', name: 'Skills', desc: 'Skill Matrix & Notes' },
  { id: 'tasks', name: 'Tasks', desc: 'Focus Timer & Tasks' },
  { id: 'expense', name: 'Expense', desc: 'Financial Ledger' },
  { id: 'diet', name: 'Diet', desc: 'Nutrition & Fasting' },
  { id: 'sports', name: 'Sports', desc: 'Fitness & Workouts' },
  { id: 'library', name: 'Library', desc: 'Books & Passages' },
  { id: 'spiritual', name: 'Spiritual', desc: 'Prayers & Literature' },
];

export function CommandPalette({ onNavigate }: CommandPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filtered = MODULES.filter(m => 
    m.name.toLowerCase().includes(query.toLowerCase()) || 
    m.desc.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (id: string) => {
    onNavigate(id);
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh] p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="relative w-full max-w-2xl bg-surface-container-high/95 border border-white/20 rounded-2xl shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col"
          >
            <div className="flex items-center gap-4 p-4 border-b border-white/10 relative z-10">
              <Search className="w-6 h-6 text-primary" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search modules... (e.g. Diet, Skills)"
                className="flex-1 bg-transparent text-[20px] text-on-surface focus:outline-none placeholder:text-on-surface-variant/50 font-medium"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && filtered.length > 0) {
                    handleSelect(filtered[0].id);
                  }
                }}
              />
              <div className="px-2 py-1 bg-white/5 rounded text-[12px] font-bold text-on-surface-variant border border-white/10 uppercase tracking-widest">
                ESC
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto p-2 relative z-10 custom-scrollbar">
              {filtered.length === 0 ? (
                <p className="text-center text-on-surface-variant py-8">No matching modules found.</p>
              ) : (
                <div className="flex flex-col gap-1">
                  {filtered.map((m, i) => (
                    <button
                      key={m.id}
                      onClick={() => handleSelect(m.id)}
                      className={`flex items-center justify-between p-4 rounded-xl transition-colors hover:bg-white/10 border border-transparent hover:border-white/5 group ${i === 0 ? 'bg-white/5 border-white/5' : ''}`}
                    >
                      <div className="flex flex-col items-start text-left">
                        <span className="text-[16px] font-bold text-on-surface group-hover:text-primary transition-colors">{m.name}</span>
                        <span className="text-[13px] text-on-surface-variant">{m.desc}</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-on-surface-variant/50 group-hover:text-primary transition-colors group-hover:translate-x-1" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[50%] h-12 bg-primary/20 blur-[40px] pointer-events-none rounded-t-full"></div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
