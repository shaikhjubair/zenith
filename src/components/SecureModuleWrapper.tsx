import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Unlock, X, ShieldCheck } from 'lucide-react';

interface SecureModuleWrapperProps {
  children: React.ReactNode;
  moduleName: string;
}

export function SecureModuleWrapper({ children, moduleName }: SecureModuleWrapperProps) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [simulateUnlock, setSimulateUnlock] = useState(false);

  const CORRECT_PIN = '2133';

  const handleKeyPress = (num: string) => {
    if (error) setError(false);
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      
      if (newPin.length === 4) {
        setIsChecking(true);
        if (newPin === CORRECT_PIN) {
          setSuccess(true);
          setTimeout(() => setIsUnlocked(true), 1500);
        } else {
          setSimulateUnlock(true);
          setTimeout(() => {
            setSimulateUnlock(false);
            setError(true);
            if (navigator.vibrate) navigator.vibrate(200);
            setTimeout(() => {
              setPin('');
              setIsChecking(false);
            }, 500);
          }, 150);
        }
      }
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
    }
    if (error) setError(false);
  };

  if (isUnlocked) {
    return <>{children}</>;
  }

  return (
    <motion.div 
      animate={success ? { opacity: 0, scale: 0.95 } : { opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="flex-1 flex flex-col items-center justify-center relative overflow-hidden -m-8 p-8"
    >
      {/* Background Aurora Blur for Lock Screen */}
      <div className="absolute inset-0 bg-background/50 backdrop-blur-3xl z-0 flex items-center justify-center">
        <div className="absolute w-96 h-96 bg-primary/20 rounded-full blur-[120px] mix-blend-screen animate-pulse duration-10000 -top-20 -left-20"></div>
        <div className="absolute w-96 h-96 bg-secondary/20 rounded-full blur-[120px] mix-blend-screen animate-pulse duration-7000 delay-1000 bottom-0 right-0"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={error ? { opacity: 1, scale: 1, x: [-10, 10, -10, 10, 0] } : { opacity: 1, scale: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 bg-surface-container-high/60 backdrop-blur-[60px] border border-white/20 rounded-[40px] p-10 flex flex-col items-center justify-center shadow-[0_30px_100px_rgba(0,0,0,0.6),inset_1px_1px_0px_rgba(255,255,255,0.2)] w-full max-w-sm min-h-[550px]"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-32 bg-primary/15 blur-[60px] rounded-full pointer-events-none"></div>

        <motion.div 
          animate={
            success 
              ? { scale: 4, filter: 'drop-shadow(0 0 15px #22c55e)' } 
              : error 
                ? { x: [-10, 10, -10, 10, 0] } 
                : isChecking
                  ? { scale: 4 }
                  : {}
          }
          transition={{ duration: success || isChecking ? 0.5 : 0.4 }}
          className={`w-16 h-16 rounded-[20px] bg-gradient-to-br flex items-center justify-center shadow-[0_0_40px_rgba(255,180,166,0.15),inset_1px_1px_0px_rgba(255,255,255,0.2)] border z-50 ${
            success || simulateUnlock ? 'from-green-500/30 to-surface/10 border-green-500/50' : 
            error ? 'from-error/30 to-surface/10 border-error/50' : 
            'from-primary/30 to-surface/10 border-primary/30'
          }`}
        >
          {success || simulateUnlock ? (
            <Unlock className="w-8 h-8 text-green-500" strokeWidth={1.5} />
          ) : (
            <Lock className={`w-8 h-8 ${error ? 'text-error' : 'text-primary'}`} strokeWidth={1.5} />
          )}
        </motion.div>

        <AnimatePresence>
          {!isChecking && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className="w-full flex flex-col items-center overflow-hidden"
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
              animate={error ? { x: [-5, 5, -5, 5, 0] } : {}}
              transition={{ duration: 0.4 }}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                i < pin.length 
                  ? error 
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
        
              {error && (
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
  );
}
