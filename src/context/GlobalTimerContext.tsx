import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { logFocusTime } from '../db';
import { useStore } from '../useStore';
import { STORES } from '../db';

export type TimerMode = 'pomodoro' | 'countdown' | 'stopwatch';

interface QueueItem {
  id?: number;
  title: string;
  time: string;
  color: string;
  totalMins?: number; 
  completedSeconds?: number; 
}

interface GlobalTimerState {
  mode: TimerMode;
  isRunning: boolean;
  initialTime: number;          // Total block time in seconds
  activeQueueId: number | null;
  displaySeconds: number;       // The live calculated time to display
  toggleTimer: () => void;
  stopTimer: () => void;
  switchMode: (m: TimerMode) => void;
  loadTimer: (qId: number, blockSecs: number, phase: 'focus' | 'break') => void;
  clearActiveQueue: () => void;
}

const GlobalTimerContext = createContext<GlobalTimerState | null>(null);

export function GlobalTimerProvider({ children }: { children: React.ReactNode }) {
  const [queue, queueActions] = useStore<QueueItem>(STORES.taskQueue);

  const [mode, setMode] = useState<TimerMode>('pomodoro');
  const [isRunning, setIsRunning] = useState(false);
  const [initialTime, setInitialTime] = useState(25 * 60);
  const [activeQueueId, setActiveQueueId] = useState<number | null>(null);

  // Exact timestamp math
  const [targetEndTime, setTargetEndTime] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  
  // Stored state when paused
  const [pausedTimeLeft, setPausedTimeLeft] = useState<number>(25 * 60);
  const [pausedTimeElapsed, setPausedTimeElapsed] = useState<number>(0);
  
  // Incremental logging tracking
  const [lastLogTimestamp, setLastLogTimestamp] = useState<number | null>(null);

  // Live display value
  const [displaySeconds, setDisplaySeconds] = useState<number>(25 * 60);

  const logIncremental = useCallback(() => {
    if (!lastLogTimestamp) return;
    const now = Date.now();
    const elapsedSecs = Math.floor((now - lastLogTimestamp) / 1000);
    if (elapsedSecs > 0) {
      const activeTask = queue.find(q => q.id === activeQueueId);
      const titleToLog = activeTask ? activeTask.title : (mode === 'stopwatch' ? 'Master Stopwatch' : 'Independent Block');
      
      logFocusTime(titleToLog, elapsedSecs);
      
      if (activeTask) {
         queueActions.update(activeTask.id!, { completedSeconds: (activeTask.completedSeconds || 0) + elapsedSecs });
      }
    }
  }, [lastLogTimestamp, activeQueueId, queue, mode, queueActions]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        const now = Date.now();
        
        if (mode === 'stopwatch' && startTime) {
          const elapsed = Math.floor((now - startTime) / 1000);
          setDisplaySeconds(elapsed);
        } else if (targetEndTime) {
          const left = Math.ceil((targetEndTime - now) / 1000);
          if (left <= 0) {
            setIsRunning(false);
            setDisplaySeconds(0);
            logIncremental();
            setLastLogTimestamp(null);
            setActiveQueueId(null);
          } else {
            setDisplaySeconds(left);
          }
        }
      }, 500); 
    }
    return () => clearInterval(interval);
  }, [isRunning, mode, startTime, targetEndTime, logIncremental]);

  const toggleTimer = () => {
    const now = Date.now();
    if (isRunning) {
      logIncremental();
      setIsRunning(false);
      setLastLogTimestamp(null);
      
      if (mode === 'stopwatch' && startTime) {
        setPausedTimeElapsed(Math.floor((now - startTime) / 1000));
      } else if (targetEndTime) {
        setPausedTimeLeft(Math.ceil((targetEndTime - now) / 1000));
      }
    } else {
      setIsRunning(true);
      setLastLogTimestamp(now);
      
      if (mode === 'stopwatch') {
        setStartTime(now - pausedTimeElapsed * 1000);
      } else {
        setTargetEndTime(now + pausedTimeLeft * 1000);
      }
    }
  };

  const stopTimer = () => {
    if (isRunning) logIncremental();
    setIsRunning(false);
    setLastLogTimestamp(null);
    if (mode === 'stopwatch') {
      setPausedTimeElapsed(0);
      setDisplaySeconds(0);
    } else {
      setPausedTimeLeft(initialTime);
      setDisplaySeconds(initialTime);
    }
  };

  const switchMode = (m: TimerMode) => {
    if (isRunning) logIncremental();
    setIsRunning(false);
    setLastLogTimestamp(null);
    setMode(m);
    setActiveQueueId(null);
    
    if (m === 'pomodoro') {
      setInitialTime(25 * 60);
      setPausedTimeLeft(25 * 60);
      setDisplaySeconds(25 * 60);
    } else if (m === 'countdown') {
      setInitialTime(10 * 60);
      setPausedTimeLeft(10 * 60);
      setDisplaySeconds(10 * 60);
    } else {
      setPausedTimeElapsed(0);
      setDisplaySeconds(0);
    }
  };

  const loadTimer = (qId: number, blockSecs: number, phase: 'focus' | 'break') => {
    if (isRunning) logIncremental();
    setIsRunning(false);
    setLastLogTimestamp(null);
    
    setMode('countdown');
    setActiveQueueId(qId);
    setInitialTime(blockSecs);
    setPausedTimeLeft(blockSecs);
    setDisplaySeconds(blockSecs);
  };

  const clearActiveQueue = () => {
    setActiveQueueId(null);
  };

  return (
    <GlobalTimerContext.Provider value={{
      mode, isRunning, initialTime, activeQueueId, displaySeconds,
      toggleTimer, stopTimer, switchMode, loadTimer, clearActiveQueue
    }}>
      {children}
    </GlobalTimerContext.Provider>
  );
}

export function useGlobalTimer() {
  const context = useContext(GlobalTimerContext);
  if (!context) throw new Error('useGlobalTimer must be used within GlobalTimerProvider');
  return context;
}
