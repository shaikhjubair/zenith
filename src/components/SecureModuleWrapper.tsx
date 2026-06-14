import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface SecureModuleWrapperProps {
  children: React.ReactNode;
  moduleName: string;
}

const EmojiLock = ({ status }: { status: 'idle' | 'success' | 'error' }) => {
  const color = status === 'success' ? '#22c55e' : status === 'error' ? '#ef4444' : 'currentColor';
  
  return (
    <motion.svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className="w-10 h-10"
      animate={
        status === 'error' 
          ? { x: [-15, 15, -10, 10, 0], filter: 'drop-shadow(0 0 15px rgba(239,68,68,0.8))' } 
          : status === 'success'
            ? { y: [-5, 5, -5], transition: { repeat: Infinity, duration: 2, ease: "easeInOut" } }
            : {}
      }
      transition={status === 'error' ? { duration: 0.4 } : { type: "spring", stiffness: 300, damping: 15 }}
    >
      {/* Lock Shackle */}
      <motion.path 
        d="M7 11V7a5 5 0 0 1 10 0v4" 
        animate={status === 'success' ? { d: "M7 11V7a5 5 0 0 1 10 0" } : { d: "M7 11V7a5 5 0 0 1 10 0v4" }}
        transition={{ type: "spring", stiffness: 300, damping: 15 }}
      />
      {/* Lock Body */}
      <rect x="3" y="11" width="18" height="11" rx="3" ry="3" />
      
      {/* Eyes */}
      <motion.path 
        d="M8 15h.01M16 15h.01" 
        strokeWidth="3"
        strokeLinecap="round"
        animate={
          status === 'success' ? { d: "M7 15q1.5 -2.5 3 0 M14 15q1.5 -2.5 3 0", strokeWidth: 1.5 } : 
          status === 'error' ? { d: "M7 14.5l2 1 M17 14.5l-2 1", strokeWidth: 2.5 } : 
          { d: "M8 15h.01M16 15h.01", strokeWidth: 3 }
        }
        transition={{ type: "spring", stiffness: 300, damping: 15 }}
      />
      
      {/* Keyhole / Mouth */}
      <motion.path 
        d="M12 17v2.5"
        strokeLinecap="round"
        animate={
          status === 'success' ? { d: "M10 17.5q2 2.5 4 0" } : 
          status === 'error' ? { d: "M10 19.5q2 -2.5 4 0" } : 
          { d: "M12 17v2.5" }
        }
        transition={{ type: "spring", stiffness: 300, damping: 15 }}
      />
    </motion.svg>
  );
};

export function SecureModuleWrapper({ children, moduleName }: SecureModuleWrapperProps) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [authStatus, setAuthStatus] = useState<'idle' | 'error' | 'success'>('idle');
  const [isChecking, setIsChecking] = useState(false);

  const CORRECT_PIN = '2133';

  const handleKeyPress = (num: string) => {
    if (authStatus === 'error') setAuthStatus('idle');
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      
      if (newPin.length === 4) {
        setIsChecking(true);
        if (newPin === CORRECT_PIN) {
          setAuthStatus('success');
          setTimeout(() => setIsUnlocked(true), 2000);
        } else {
          setAuthStatus('error');
          if (navigator.vibrate) navigator.vibrate(200);
          setTimeout(() => {
            setAuthStatus('idle');
            setPin('');
            setIsChecking(false);
          }, 1000);
        }
      }
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
    }
    if (authStatus === 'error') setAuthStatus('idle');
  };

  return (
    <div className="relative flex-1 flex flex-col h-full w-full">
      <div className="flex-1 flex flex-col">{children}</div>

      <AnimatePresence>
        {!isUnlocked && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/95 backdrop-blur-md w-full min-h-full p-4 md:p-8"
          >
            {/* Background Aurora Blur for Lock Screen */}
            <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none overflow-hidden">
              <div className="absolute w-96 h-96 bg-primary/20 rounded-full blur-[120px] mix-blend-screen animate-pulse duration-10000 -top-20 -left-20"></div>
              <div className="absolute w-96 h-96 bg-secondary/20 rounded-full blur-[120px] mix-blend-screen animate-pulse duration-7000 delay-1000 bottom-0 right-0"></div>
            </div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={authStatus === 'error' ? { opacity: 1, scale: 1, x: [-15, 15, -10, 10, 0] } : { opacity: 1, scale: 1, x: 0 }}
              transition={authStatus === 'error' ? { duration: 0.4 } : { type: "spring", stiffness: 300, damping: 15 }}
              className="relative z-10 bg-surface-container-high/60 backdrop-blur-[60px] border border-white/20 rounded-[40px] p-8 flex flex-col items-center justify-center shadow-[0_30px_100px_rgba(0,0,0,0.6),inset_1px_1px_0px_rgba(255,255,255,0.2)] w-full max-w-sm min-h-[400px]"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-32 bg-primary/15 blur-[60px] rounded-full pointer-events-none"></div>

              <motion.div 
                animate={
                  authStatus === 'success'
                    ? { scale: 4, filter: 'drop-shadow(0 0 15px #22c55e)' } 
                    : authStatus === 'error'
                      ? { x: [-10, 10, -10, 10, 0] } 
                      : isChecking
                        ? { scale: 4 }
                        : {}
                }
                transition={{ duration: authStatus === 'success' || isChecking ? 0.5 : 0.4 }}
                className={`w-20 h-20 rounded-[20px] bg-gradient-to-br flex items-center justify-center shadow-[0_0_40px_rgba(255,180,166,0.15),inset_1px_1px_0px_rgba(255,255,255,0.2)] border z-50 ${
                  authStatus === 'success' ? 'from-green-500/30 to-surface/10 border-green-500/50 text-green-500' : 
                  authStatus === 'error' ? 'from-error/30 to-surface/10 border-error/50 text-error' : 
                  'from-primary/30 to-surface/10 border-primary/30 text-primary'
                }`}
              >
                <EmojiLock status={authStatus} />
              </motion.div>

        <AnimatePresence>
          {!isChecking && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="w-full flex flex-col items-center overflow-hidden pt-6"
            >
              <h2 className="text-[24px] font-bold text-on-surface mb-2">{moduleName} Locked</h2>
              <p className="text-[14px] text-on-surface-variant text-center mb-8">
                Enter your secure PIN to access this sensitive module.
              </p>

              {/* PIN Dots */}
              <div className="flex gap-4 mb-8">
                {[0, 1, 2, 3].map((i) => (
                  <motion.div 
                    key={i}
                    animate={authStatus === 'error' ? { x: [-5, 5, -5, 5, 0] } : {}}
                    transition={{ duration: 0.4 }}
                    className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                      i < pin.length 
                        ? authStatus === 'error'
                          ? 'bg-error border-error shadow-[0_0_15px_rgba(255,82,82,0.5)]' 
                          : 'bg-primary border-primary shadow-[0_0_15px_rgba(255,180,166,0.5)]'
                        : 'bg-transparent border-white/20'
                    }`}
                  />
                ))}
              </div>

              {/* Keypad */}
              <div className="grid grid-cols-3 gap-4 w-full">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleKeyPress(num.toString())}
                    className="h-16 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-primary/20 border border-white/5 hover:border-white/20 text-2xl font-medium text-on-surface transition-all flex items-center justify-center shadow-sm"
                  >
                    {num}
                  </button>
                ))}
                <div /> {/* Empty slot */}
                <button
                  onClick={() => handleKeyPress('0')}
                  className="h-16 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-primary/20 border border-white/5 hover:border-white/20 text-2xl font-medium text-on-surface transition-all flex items-center justify-center shadow-sm"
                >
                  0
                </button>
                <button
                  onClick={handleDelete}
                  className="h-16 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-error/20 border border-white/5 hover:border-white/20 text-on-surface-variant hover:text-error transition-all flex items-center justify-center shadow-sm"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {authStatus === 'error' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute -bottom-16 left-1/2 -translate-x-1/2 bg-error/20 border border-error/50 text-error px-6 py-2 rounded-full text-sm font-bold whitespace-nowrap shadow-lg backdrop-blur-md"
                >
                  Wrong Password
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
