import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Pause, Square, CheckSquare, Plus, SquareMenu, Play, X, RefreshCcw, Timer, Clock, ArrowRight, ChevronLeft, ChevronRight, Activity } from 'lucide-react';
import { useStore } from '../useStore';
import { STORES, getSetting } from '../db';
import { FormModal } from '../components/FormModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { useGlobalTimer } from '../context/GlobalTimerContext';

interface Task {
  id?: number;
  title: string;
  completed: boolean;
}

interface QueueItem {
  id?: number;
  title: string;
  time: string;
  color: string;
  totalMins?: number; 
  completedSeconds?: number; 
}

interface HeatmapLog {
  [dateString: string]: {
    totalSecs: number;
    tasks: { title: string; secs: number }[];
  }
}

const QUEUE_MODAL_FIELDS = [
  { name: 'title', label: 'Title', type: 'text', required: true, placeholder: 'What are you working on?' },
  { name: 'time', label: 'Estimated Time', type: 'text', placeholder: 'e.g. 120m or 2h' },
  { name: 'color', label: 'Color', type: 'select', options: [
    { value: 'bg-primary', label: 'Primary' },
    { value: 'bg-secondary', label: 'Secondary' },
    { value: 'bg-tertiary', label: 'Tertiary' },
  ], defaultValue: 'bg-primary' },
] as const;

type TimerMode = 'pomodoro' | 'countdown' | 'stopwatch';

function getQueueItemState(totalWorkMins: number, completedSeconds: number) {
  let secsRemainingToProcess = completedSeconds;
  let workSecsRemaining = totalWorkMins * 60;
  let part = 1;
  const partsTotal = Math.ceil(totalWorkMins / 30);
  
  while (true) {
    const workBlockSecs = Math.min(30 * 60, workSecsRemaining);
    
    if (secsRemainingToProcess < workBlockSecs) {
      return { phase: 'focus', part, partsTotal, secsLeftInPhase: workBlockSecs - secsRemainingToProcess, isFinished: false };
    }
    secsRemainingToProcess -= workBlockSecs;
    workSecsRemaining -= workBlockSecs;
    
    if (workSecsRemaining <= 0) {
      return { phase: 'done', part, partsTotal, secsLeftInPhase: 0, isFinished: true };
    }
    
    if (secsRemainingToProcess < 5 * 60) {
      return { phase: 'break', part, partsTotal, secsLeftInPhase: (5 * 60) - secsRemainingToProcess, isFinished: false };
    }
    secsRemainingToProcess -= (5 * 60);
    part++;
  }
}

export function TasksModule() {
  const [tasks, taskActions, tasksLoading] = useStore<Task>(STORES.tasks);
  const [queue, queueActions, queueLoading] = useStore<QueueItem>(STORES.taskQueue);

  const [showQueueModal, setShowQueueModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'task' | 'queue', id: number } | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showTaskInput, setShowTaskInput] = useState(false);

  // --- Heatmap State ---
  const [heatmapData, setHeatmapData] = useState<HeatmapLog>({});
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedHeatmapDate, setSelectedHeatmapDate] = useState<string | null>(null);

  useEffect(() => {
    // Poll the db for heatmap data occasionally to stay synced, or just on mount
    getSetting<HeatmapLog>('focus_heatmap_data').then(data => {
      if (data) setHeatmapData(data);
    });
    const interval = setInterval(() => {
      getSetting<HeatmapLog>('focus_heatmap_data').then(data => {
        if (data) setHeatmapData(data);
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // --- Advanced Timer State ---
  const { mode, isRunning, initialTime, activeQueueId, displaySeconds, toggleTimer, stopTimer, switchMode, loadTimer, clearActiveQueue } = useGlobalTimer();

  const h = Math.floor(displaySeconds / 3600);
  const m = Math.floor((displaySeconds % 3600) / 60);
  const s = displaySeconds % 60;
  const timeString = h > 0 
    ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

  let progressPercent = 0;
  if (mode === 'stopwatch') {
    progressPercent = (displaySeconds % 60) / 60 * 100;
  } else {
    progressPercent = initialTime > 0 ? ((initialTime - displaySeconds) / initialTime) * 100 : 0;
  }
  const strokeDashoffset = 283 - (283 * progressPercent) / 100;

  const activeTask = queue.find(q => q.id === activeQueueId) || (queue.length > 0 ? queue[0] : null);
  const displayTitle = activeTask ? activeTask.title : (mode === 'stopwatch' ? 'Master Stopwatch' : 'Focus Session');
  
  let activeStateLabel = '';
  if (activeTask && activeQueueId) {
     const st = getQueueItemState(activeTask.totalMins || 30, activeTask.completedSeconds || 0);
     activeStateLabel = `• ${st.phase === 'break' ? 'Break Phase' : 'Focus Phase'} (Part ${st.part} of ${st.partsTotal})`;
  }

  const displaySubtitle = activeTask 
    ? `Loaded from session queue. Press play to track time. ${activeStateLabel}` 
    : 'Select an item from the queue or start an independent timer.';

  const loading = tasksLoading || queueLoading;

  const toggleTask = (id: number) => {
    const task = tasks.find(t => t.id === id);
    if (task) taskActions.update(id, { completed: !task.completed });
  };

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      taskActions.add({ title: newTaskTitle.trim(), completed: false });
      setNewTaskTitle('');
      setShowTaskInput(false);
    }
  };

  const handleCloseQueueModal = useCallback(() => setShowQueueModal(false), []);
  
  const handleSubmitQueueModal = useCallback(async (data: any) => {
    const title = data.title as string;
    let timeStr = (data.time as string) || '30m';
    const color = (data.color as string) || 'bg-primary';

    if (timeStr.toLowerCase().includes('h') && !timeStr.toLowerCase().includes('m')) {
       const hours = parseInt(timeStr.match(/(\d+)/)?.[1] || '1', 10);
       timeStr = `${hours * 60}m`;
    }

    const match = timeStr.match(/(\d+)/);
    let totalMins = match ? parseInt(match[1], 10) : 30;

    await queueActions.add({
      title,
      time: timeStr,
      color,
      totalMins,
      completedSeconds: 0
    });
  }, [queueActions]);

  // --- Heatmap Generation Data ---
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayIndex = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay(); 
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const day = String(i + 1).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const paddedDays = [...Array(firstDayIndex).fill(null), ...daysArray];

  const todayStr = new Date().toISOString().split('T')[0];
  const todaySecs = heatmapData[todayStr]?.totalSecs || 0;
  const todayHrs = Math.floor(todaySecs / 3600);
  const todayMinsRemainder = Math.floor((todaySecs % 3600) / 60);
  const dailyEnergyString = todayHrs > 0 ? `${todayHrs} Hours ${todayMinsRemainder} Minutes` : `${todayMinsRemainder} Minutes`;

  if (loading) {
    return (
      <div className="max-w-6xl w-full mx-auto flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-on-surface-variant text-sm uppercase tracking-widest font-semibold">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div 
        className="fixed inset-0 z-[-2] bg-cover bg-center opacity-40 mix-blend-screen"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2564&auto=format&fit=crop')" }}
      />
      <div className="fixed inset-0 z-[-1] bg-gradient-to-t from-background via-background/90 to-background/40 pointer-events-none"></div>

      <div className="max-w-6xl w-full mx-auto grid grid-cols-1 xl:grid-cols-12 gap-8 h-full relative z-0">
        <div className="xl:col-span-8 flex flex-col gap-8">
        
        <div className="glass-panel rounded-2xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
          
          <div className="flex flex-wrap items-center gap-2 mb-6 relative z-10 bg-surface-container-high/50 w-fit p-1 rounded-xl border border-white/5">
             <button onClick={() => switchMode('pomodoro')} className={`px-4 py-2 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors ${mode === 'pomodoro' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}>Pomodoro</button>
             <button onClick={() => switchMode('countdown')} className={`px-4 py-2 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors ${mode === 'countdown' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}>Countdown</button>
             <button onClick={() => switchMode('stopwatch')} className={`px-4 py-2 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors ${mode === 'stopwatch' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}>Stopwatch</button>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8 relative z-10 w-full">
            <div className="min-w-0 max-w-full">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold tracking-wide uppercase mb-4 border border-primary/30">
                {isRunning && <span className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0"></span>}
                {!isRunning && <span className="w-2 h-2 rounded-full bg-primary/50 shrink-0"></span>}
                {isRunning ? 'In Progress' : 'Paused'}
              </span>
              <h3 className="text-[32px] sm:text-[48px] md:text-[56px] font-bold text-on-surface tracking-tight mb-2 leading-tight break-words">{displayTitle}</h3>
              <p className="text-[14px] sm:text-[16px] text-on-surface-variant max-w-xl break-words">{displaySubtitle}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={toggleTimer} className="w-12 h-12 rounded-xl bg-surface-container hover:bg-white/10 transition-colors text-on-surface flex items-center justify-center shadow-lg border border-white/5">
                {isRunning ? <Pause className="w-6 h-6" fill="currentColor" /> : <Play className="w-6 h-6" fill="currentColor" />}
              </button>
              <button onClick={stopTimer} className="w-12 h-12 rounded-xl bg-surface-container hover:bg-white/10 transition-colors text-on-surface flex items-center justify-center shadow-lg border border-white/5">
                <RefreshCcw className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-12 relative z-10">
            <div className="relative w-64 h-64 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90 absolute inset-0" viewBox="0 0 100 100">
                <circle cx="50" cy="50" fill="none" r="45" stroke="rgba(255,255,255,0.05)" strokeWidth="4"></circle>
                <circle cx="50" cy="50" fill="none" r="45" stroke="currentColor" strokeLinecap="round" strokeWidth="4" className="text-primary transition-all duration-1000 ease-linear" strokeDasharray="283" strokeDashoffset={strokeDashoffset}></circle>
              </svg>
              <div className="flex flex-col items-center justify-center relative z-10">
                <span className="text-6xl font-bold tracking-tighter text-on-surface">{timeString}</span>
                <span className="text-[14px] font-semibold text-on-surface-variant uppercase tracking-wider mt-2">{mode}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="glass-panel rounded-2xl p-6">
            <h4 className="text-2xl font-medium mb-4 flex items-center gap-2">
              <SquareMenu className="text-tertiary w-6 h-6" />
              Current Context
            </h4>
            <ul className="flex flex-col gap-3">
              <AnimatePresence>
                {tasks.map(task => (
                  <motion.li 
                    layout
                    key={task.id}
                    className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${task.completed ? 'hover:bg-white/5 group' : 'bg-white/5 border border-white/10'} group relative`}
                    onClick={() => toggleTask(task.id!)}
                  >
                    {task.completed ? <CheckSquare className="text-primary mt-0.5 group-hover:scale-110 transition-transform shrink-0" /> : <Square className="text-on-surface-variant mt-0.5 shrink-0" />}
                    <span className={`text-[14px] md:text-[16px] flex-1 break-words min-w-0 ${task.completed ? 'text-on-surface-variant line-through opacity-70' : 'text-on-surface'}`}>{task.title}</span>
                    <button onClick={(e) => { e.stopPropagation(); setDeleteTarget({ type: 'task', id: task.id! }); }} className="opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded-md hover:bg-red-500/20 flex items-center justify-center text-on-surface-variant hover:text-red-400 shrink-0 mt-0.5"><X className="w-4 h-4" /></button>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
            {showTaskInput ? (
              <div className="mt-3 flex items-center gap-2">
                <input type="text" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleAddTask(); if (e.key === 'Escape') { setShowTaskInput(false); setNewTaskTitle(''); } }} placeholder="New task..." autoFocus className="flex-1 bg-surface-container-lowest/60 border border-white/10 rounded-lg px-3 py-2 text-[14px] text-on-surface focus:outline-none focus:border-primary/50 transition-all" />
                <button onClick={handleAddTask} className="w-8 h-8 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary flex items-center justify-center transition-colors"><Plus className="w-4 h-4" /></button>
              </div>
            ) : (
              <button onClick={() => setShowTaskInput(true)} className="mt-3 w-full p-2 rounded-lg border border-dashed border-white/15 flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:border-white/30 transition-colors cursor-pointer text-[12px] font-semibold uppercase tracking-wider gap-1"><Plus className="w-4 h-4" /> Add Task</button>
            )}
          </div>

          <div className="glass-panel rounded-2xl p-6 flex flex-col justify-center items-center text-center">
            <h4 className="text-[12px] font-semibold text-on-surface-variant uppercase tracking-widest mb-6">Daily Focus Energy</h4>
            <div className="w-32 h-32 rounded-full bg-surface-container-high/50 border border-white/10 flex items-center justify-center mb-6 relative shadow-[0_0_30px_rgba(255,180,166,0.1)]">
               <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl"></div>
               <Activity className="w-12 h-12 text-primary relative z-10" />
            </div>
            {todaySecs === 0 ? (
               <p className="text-on-surface-variant text-sm font-medium">No sessions completed today.</p>
            ) : (
               <>
                 <span className="text-[32px] font-bold text-on-surface tracking-tighter leading-none mb-2">{dailyEnergyString}</span>
                 <span className="text-[12px] font-bold text-primary uppercase tracking-widest bg-primary/20 px-3 py-1 rounded-full border border-primary/30">Total Active Focus</span>
               </>
            )}
          </div>
        </div>
      </div>

      <div className="xl:col-span-4 flex flex-col gap-8">
        <div className="glass-panel rounded-2xl p-6 flex-1">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-2xl font-medium">Session Queue</h4>
            <span className="text-[12px] font-semibold bg-surface-container-high px-2 py-1 rounded text-on-surface-variant uppercase tracking-wider">{queue.length} Tasks</span>
          </div>
          <div className="flex flex-col gap-4">
             <AnimatePresence>
               {queue.map(q => {
                 const totalMins = q.totalMins || 30;
                 const compSecs = q.completedSeconds || 0;
                 const state = getQueueItemState(totalMins, compSecs);
                 
                 const progressPercent = Math.min(100, (compSecs / (totalMins * 60)) * 100);
                 
                 return (
                   <motion.div 
                      layout 
                      key={q.id} 
                      onClick={() => !state.isFinished && loadTimer(q.id!, q.totalMins ? q.totalMins * 60 : 30 * 60, state.phase as 'focus' | 'break')}
                      className={`p-4 rounded-xl flex flex-col gap-4 border transition-colors cursor-pointer group shadow-sm ${q.id === activeQueueId ? 'bg-primary/10 border-primary/40 ring-1 ring-primary/20' : 'bg-surface-container-high/50 border-white/5 hover:border-white/20'} ${state.isFinished ? 'opacity-50 grayscale' : ''}`}
                   >
                     <div className="flex items-start gap-3 w-full">
                       <div className={`w-2 h-10 rounded-full ${q.color} mt-1`} />
                       <div className="flex-1 min-w-0">
                         <h5 className={`text-[14px] font-bold uppercase tracking-widest transition-colors truncate ${q.id === activeQueueId ? 'text-primary' : 'text-on-surface group-hover:text-primary'} ${state.isFinished ? 'line-through' : ''}`}>{q.title}</h5>
                         <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                           <span className="text-[12px] font-semibold text-on-surface-variant uppercase tracking-wider">{q.time}</span>
                           {!state.isFinished && <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${q.id === activeQueueId ? 'bg-primary/20 text-primary' : 'bg-white/10 text-on-surface-variant'}`}>{state.phase === 'break' ? 'Break' : 'Focus'} (Part {state.part}/{state.partsTotal})</span>}
                           {state.isFinished && <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/20 px-2 py-0.5 rounded">Completed</span>}
                         </div>
                       </div>
                       <div className="flex flex-col items-end gap-2 shrink-0">
                         <button
                           onClick={(e) => { e.stopPropagation(); setDeleteTarget({ type: 'queue', id: q.id! }); }}
                           className="opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded-md hover:bg-red-500/20 flex items-center justify-center text-on-surface-variant hover:text-red-400 shrink-0"
                         >
                           <X className="w-4 h-4" />
                         </button>
                         {q.id === activeQueueId && !state.isFinished && <ArrowRight className="w-4 h-4 text-primary animate-pulse" />}
                         {state.isFinished && <CheckSquare className="w-4 h-4 text-primary" />}
                       </div>
                     </div>
                     
                     {/* Internal Progress Bar */}
                     <div className="w-full bg-black/20 rounded-full h-1.5 overflow-hidden">
                       <div className={`${q.color.replace('bg-', 'bg-')} h-full transition-all duration-1000 shadow-[0_0_10px_rgba(255,255,255,0.5)]`} style={{ width: `${progressPercent}%` }} />
                     </div>
                   </motion.div>
                 );
               })}
             </AnimatePresence>
             <div onClick={() => setShowQueueModal(true)} className="p-4 rounded-xl border border-dashed border-white/20 flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:border-white/40 transition-colors cursor-pointer bg-white/5 mt-2 shadow-sm">
                <Plus className="mr-2 w-5 h-5" />
                <span className="text-[12px] font-bold uppercase tracking-widest">Add Flow Task</span>
             </div>
          </div>
        </div>
      </div>

      {/* 12-Month Standalone Consistency Heatmap Box */}
      <div className="xl:col-span-12 glass-panel rounded-2xl p-8 relative overflow-hidden group border border-white/5 bg-surface-container/30 mt-4 shadow-xl">
         <div className="absolute -bottom-10 -right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 relative z-10 gap-4">
           <div>
             <h4 className="text-[20px] font-bold text-on-surface tracking-wide">12-Month Consistency</h4>
             <p className="text-on-surface-variant text-sm">Track your daily focus blocks and productivity patterns.</p>
           </div>
           <div className="flex gap-2 w-full sm:w-auto">
              <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="p-2 bg-surface-container hover:bg-white/10 rounded-lg transition-colors border border-white/5"><ChevronLeft className="w-5 h-5" /></button>
              <div className="flex-1 sm:flex-none px-6 py-2 bg-surface-container rounded-lg border border-white/5 flex items-center justify-center min-w-[160px]">
                <span className="text-[14px] font-bold uppercase tracking-widest">{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
              </div>
              <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="p-2 bg-surface-container hover:bg-white/10 rounded-lg transition-colors border border-white/5"><ChevronRight className="w-5 h-5" /></button>
           </div>
         </div>
         
         <div className="grid grid-cols-7 gap-2 md:gap-3 relative z-10 max-w-5xl mx-auto">
           {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <span key={d} className="text-center text-[12px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">{d}</span>)}
           {paddedDays.map((dateStr, idx) => {
             if (!dateStr) return <div key={`empty-${idx}`} className="aspect-square" />;
             const dayData = heatmapData[dateStr];
             const totalMins = dayData ? Math.floor(dayData.totalSecs / 60) : 0;
             const intensityClass = totalMins > 120 ? 'bg-primary border-primary/50 text-on-primary shadow-[0_0_15px_rgba(255,180,166,0.4)]' 
               : totalMins > 60 ? 'bg-primary/80 border-primary/40 text-on-primary' 
               : totalMins > 0 ? 'bg-primary/40 border-primary/20 text-white' 
               : 'bg-white/5 border-white/5 text-on-surface-variant hover:bg-white/10 hover:border-white/20';

             const dayNum = dateStr.split('-')[2].replace(/^0/, '');
             
             return (
               <div 
                 key={dateStr}
                 onClick={() => setSelectedHeatmapDate(dateStr)}
                 className={`aspect-square rounded-xl border flex items-center justify-center cursor-pointer transition-all relative group/block hover:scale-105 ${intensityClass}`}
               >
                 <span className="text-[12px] md:text-[14px] font-bold z-10">{dayNum}</span>
               </div>
             );
           })}
         </div>
      </div>

      {/* Heatmap Detail Popup */}
      <AnimatePresence>
        {selectedHeatmapDate && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setSelectedHeatmapDate(null)}
          >
            <div className="bg-surface-container-high border border-white/10 p-6 rounded-2xl max-w-sm w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
               <button onClick={() => setSelectedHeatmapDate(null)} className="absolute top-4 right-4 text-on-surface-variant hover:text-white"><X className="w-5 h-5" /></button>
               <h4 className="text-xl font-bold mb-1">{new Date(selectedHeatmapDate).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</h4>
               
               {(() => {
                 const data = heatmapData[selectedHeatmapDate];
                 if (!data || data.totalSecs === 0) return <p className="text-on-surface-variant text-sm mt-4 font-medium tracking-wide">No focus time logged on this day.</p>;
                 
                 const hrs = Math.floor(data.totalSecs / 3600);
                 const mins = Math.floor((data.totalSecs % 3600) / 60);
                 return (
                   <>
                     <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 text-primary font-bold text-[10px] rounded-full uppercase tracking-widest mt-2 mb-6 border border-primary/30">
                       {hrs > 0 ? `${hrs}h ` : ''}{mins}m Tracked
                     </div>
                     
                     <h5 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-3 border-b border-white/10 pb-2">Completed Tasks</h5>
                     <ul className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                       {data.tasks.map((t, idx) => {
                         const taskMins = Math.floor(t.secs / 60);
                         return (
                         <li key={idx} className="flex justify-between items-center bg-white/5 p-2.5 rounded-lg border border-white/5">
                           <span className="text-[12px] font-medium text-on-surface truncate pr-4">{t.title}</span>
                           <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest bg-surface-container px-2 py-1 rounded">{taskMins}m</span>
                         </li>
                         );
                       })}
                     </ul>
                   </>
                 )
               })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <FormModal
        isOpen={showQueueModal}
        onClose={handleCloseQueueModal}
        onSubmit={handleSubmitQueueModal}
        title="Add Flow Task"
        submitLabel="Add Task"
        fields={QUEUE_MODAL_FIELDS as any}
      />
      </div>
    </>
  );
}
