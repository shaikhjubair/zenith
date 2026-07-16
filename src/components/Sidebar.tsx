import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, 
  BrainCircuit, 
  ClipboardList, 
  Wallet, 
  Utensils, 
  HeartHandshake, 
  Dumbbell, 
  LibraryBig, 
  LogOut,
  Compass,
  X,
  LayoutDashboard
} from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

interface SidebarProps {
  activeModule: string;
  setActiveModule: (mod: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const MODULES = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, lockedByDefault: false },
  { id: 'study', label: 'Study', icon: Compass, lockedByDefault: true },
  { id: 'skills', label: 'Skills', icon: BrainCircuit, lockedByDefault: false },
  { id: 'tasks', label: 'Tasks', icon: ClipboardList, lockedByDefault: false },
  { id: 'expense', label: 'Expense', icon: Wallet, lockedByDefault: true },
  { id: 'diet', label: 'Diet', icon: Utensils, lockedByDefault: true },
  { id: 'spiritual', label: 'Spiritual', icon: HeartHandshake, lockedByDefault: false },
  { id: 'sports', label: 'Sports', icon: Dumbbell, lockedByDefault: false },
  { id: 'library', label: 'Library', icon: LibraryBig, lockedByDefault: false },
];

export function Sidebar({ activeModule, setActiveModule, isOpen, onClose }: SidebarProps) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[9999] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-surface-container-high/80 border border-white/20 p-8 rounded-[32px] max-w-sm w-full shadow-2xl flex flex-col gap-6"
            >
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4 border border-error/30">
                  <LogOut className="w-8 h-8 text-error" />
                </div>
                <h2 className="text-2xl font-bold text-on-surface mb-2">Sign Out of Zenith?</h2>
                <p className="text-[16px] text-on-surface-variant">Are you sure you want to end your current session?</p>
              </div>
              <div className="flex gap-4 mt-2">
                <button 
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-on-surface font-bold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => signOut(auth)}
                  className="flex-1 py-4 rounded-2xl bg-error text-white font-bold hover:bg-error/90 transition-colors shadow-lg shadow-error/20"
                >
                  Yes, Logout
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.aside 
        className={`fixed md:sticky top-0 left-0 h-[100dvh] w-72 bg-surface/80 backdrop-blur-xl border-r border-white/10 p-6 flex flex-col z-[100] transition-transform duration-300 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="flex items-center justify-between mb-12 mt-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-[0_0_20px_rgba(255,180,166,0.3)]">
                <Compass className="w-6 h-6 text-on-primary" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-on-surface">Zenith</h1>
            </div>
            <button onClick={onClose} className="md:hidden text-on-surface-variant hover:text-on-surface">
              <X className="w-5 h-5" />
            </button>
          </div>

        <nav className="flex flex-col gap-2">
          {MODULES.map((mod) => {
            const isActive = activeModule === mod.id;
            const Icon = mod.icon;
            
            return (
              <button
                key={mod.id}
                onClick={() => setActiveModule(mod.id)}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 ${
                  isActive 
                    ? 'bg-gradient-to-r from-primary to-secondary text-on-primary font-bold shadow-[0_4px_20px_rgba(255,180,166,0.3)] scale-[0.98]' 
                    : 'text-on-surface/70 hover:text-on-surface hover:bg-white/10'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-on-primary' : ''}`} />
                <span className="text-[16px]">{mod.label}</span>
                {mod.id === 'diet' && isActive && (
                  <span className="w-2 h-2 rounded-full bg-on-primary animate-pulse ml-auto"></span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

        <div className="p-8 pb-12 md:pb-8 relative">
          <button 
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full py-3 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-error/20 hover:text-error hover:border-error/50 transition-all duration-300 flex items-center justify-center gap-2 text-on-surface text-[16px] glass-edge"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </motion.aside>
    </>
  );
}
