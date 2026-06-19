import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Accessibility, Shell, Plus, X, Loader2, Play, Square, AlertTriangle, CheckCircle2, Circle, CalendarX, Sparkles } from 'lucide-react';
import { useStore } from '../useStore';
import { STORES } from '../db';
import { FormModal } from '../components/FormModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { useUserProfile } from '../context/UserProfileContext';

const fetchGemini = async (prompt: string, key: string) => {
  let model = 'gemini-1.5-flash';
  let url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  let response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] })
  });
  if (!response.ok) {
    let errorData: any = {};
    try { errorData = await response.json(); } catch(e) {}
    if (errorData.error?.code === 404 || response.status === 404) {
      model = 'gemini-1.5-pro';
      url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] })
      });
      if (!response.ok) throw new Error(await response.text());
    } else {
      throw new Error(JSON.stringify(errorData));
    }
  }
  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
};

interface ExerciseSet {
  setNum: number;
  targetReps?: number | null;
  targetTime?: string;
  actualReps?: number | null;
  actualTime?: string;
  weight?: number;
  done: boolean;
}

interface Exercise {
  id?: number;
  date?: string; // Specific date logging
  name: string;
  muscles: string;
  icon: string;
  sets: ExerciseSet[];
}

const ICON_MAP: Record<string, React.ReactNode> = {
  accessibility: <Accessibility className="w-8 h-8" />,
  shell: <Shell className="w-8 h-8" />,
};

const ICON_COLOR_MAP: Record<string, { bg: string; text: string; border: string }> = {
  accessibility: { bg: 'bg-primary/20', text: 'text-primary', border: 'border-primary/30' },
  shell: { bg: 'bg-tertiary/20', text: 'text-tertiary', border: 'border-tertiary/30' },
};

const getLocalIso = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const parseSecs = (str: string) => {
  if (!str) return 0;
  const minMatch = str.match(/(\d+)m/);
  const secMatch = str.match(/(\d+)s/);
  let secs = 0;
  if (minMatch) secs += parseInt(minMatch[1]) * 60;
  if (secMatch) secs += parseInt(secMatch[1]);
  if (!minMatch && !secMatch) return parseInt(str) || 0; // fallback
  return secs;
};

const isTimeBased = (exercise: Exercise) => {
  return exercise.sets.length > 0 && exercise.sets[0].targetTime !== undefined;
};

const computeIntensityForSet = (s: ExerciseSet, isTimed: boolean) => {
  if (isTimed) {
    const act = parseSecs(s.actualTime || '');
    const tgt = parseSecs(s.targetTime || '');
    if (tgt === 0) return act > 0 ? 100 : (s.done ? 100 : 0);
    return Math.min(100, Math.round((act / tgt) * 100));
  } else {
    if (s.actualReps === null || s.actualReps === undefined) return s.done ? 100 : 0;
    if (!s.targetReps) return s.actualReps > 0 ? 100 : (s.done ? 100 : 0);
    return Math.min(100, Math.round((s.actualReps / s.targetReps) * 100));
  }
};

export function SportsModule() {
  const [exercises, actions, loading] = useStore<Exercise>(STORES.sportsExercises);
  const { profile } = useUserProfile();
  
  const [aiInsight, setAiInsight] = useState('');
  const [insightLoading, setInsightLoading] = useState(false);
  const [showAddExercise, setShowAddExercise] = useState(false);
  
  // UX Enhancements States
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);

  // Live Timer per set
  const [activeTimerSetId, setActiveTimerSetId] = useState<string | null>(null);
  const [activeTimerValue, setActiveTimerValue] = useState<number>(0);

  // Deletion Modal States
  const [deletionTarget, setDeletionTarget] = useState<{ type: 'exercise' | 'set', exerciseId: number, setIndex?: number } | null>(null);

  // Heatmap Popup States
  const [selectedHeatmapDay, setSelectedHeatmapDay] = useState<{ dateStr: string, iso: string, dayExs: Exercise[] } | null>(null);

  // Date Logic
  const todayIso = useMemo(() => getLocalIso(new Date()), []);
  const getEffectiveDate = (ex: Exercise) => ex.date || todayIso;

  const todaysExercises = useMemo(() => {
    return exercises.filter(ex => getEffectiveDate(ex) === todayIso);
  }, [exercises, todayIso]);

  // Dynamic Heatmap Data
  const currentMonthDays = useMemo(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  }, []);

  const computeStatsForDay = (dayExs: Exercise[]) => {
    let totalVolume = 0;
    let totalIntensity = 0;
    let totalSets = 0;
    
    dayExs.forEach(ex => {
      const isTimed = isTimeBased(ex);
      ex.sets.forEach(s => {
        totalSets++;
        totalIntensity += computeIntensityForSet(s, isTimed);
        if (s.actualReps && s.weight) {
          totalVolume += s.actualReps * s.weight;
        }
      });
    });
    
    const avgIntensity = totalSets > 0 ? Math.round(totalIntensity / totalSets) : 0;
    const estTime = dayExs.length * 15;
    
    return {
      volume: totalVolume.toLocaleString(),
      intensity: `${avgIntensity}%`,
      avgIntensityRaw: avgIntensity,
      estTime: `${estTime} min`,
    };
  };

  const heatmapData = useMemo(() => {
    return Array.from({ length: currentMonthDays }).map((_, i) => {
      const d = new Date();
      d.setDate(i + 1);
      const iso = getLocalIso(d);
      
      const dayExs = exercises.filter(e => getEffectiveDate(e) === iso);
      const stats = computeStatsForDay(dayExs);
      
      const heat = stats.avgIntensityRaw / 100;
      let color = 'bg-surface-container-high border-white/5';
      let textColor = 'text-on-surface-variant';
      if (heat >= 0.8) { color = 'bg-primary shadow-[0_0_8px_rgba(255,180,166,0.6)] border border-primary/50'; textColor = 'text-on-primary'; }
      else if (heat >= 0.5) { color = 'bg-primary/80 border border-primary/40'; textColor = 'text-on-primary'; }
      else if (heat >= 0.2) { color = 'bg-primary/40 border border-primary/20'; textColor = 'text-white'; }
      else if (heat > 0 || dayExs.length > 0) { color = 'bg-primary/20 border border-primary/20'; textColor = 'text-white'; }
      
      return { 
        iso, 
        dateStr: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), 
        color, 
        textColor,
        dayExs 
      };
    });
  }, [currentMonthDays, exercises, todayIso]);

  // Live Global Session Timer Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isWorkoutActive) {
      interval = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
    } else {
      setSessionTime(0);
    }
    return () => clearInterval(interval);
  }, [isWorkoutActive]);

  // Live Timer Per Set Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTimerSetId) {
      interval = setInterval(() => {
        setActiveTimerValue(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTimerSetId]);

  const handleToggleSetTimer = (exercise: Exercise, setIndex: number) => {
    const setId = `${exercise.id}-${setIndex}`;
    const set = exercise.sets[setIndex];
    
    if (activeTimerSetId === setId) {
      // Stop timer and persist
      handleUpdateSet(exercise, setIndex, { actualTime: `${activeTimerValue}s`, done: true });
      setActiveTimerSetId(null);
    } else {
      // Stop any existing timer first
      if (activeTimerSetId) {
        const [oldExId, oldSetIdx] = activeTimerSetId.split('-');
        const oldEx = exercises.find(e => e.id === parseInt(oldExId));
        if (oldEx) handleUpdateSet(oldEx, parseInt(oldSetIdx), { actualTime: `${activeTimerValue}s`, done: true });
      }
      // Start new timer
      const startSecs = parseSecs(set.actualTime || '');
      setActiveTimerValue(startSecs);
      setActiveTimerSetId(setId);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleAddSet = (exercise: Exercise) => {
    const nextSetNum = exercise.sets.length > 0 ? Math.max(...exercise.sets.map(s => s.setNum)) + 1 : 1;
    const isTimed = isTimeBased(exercise);
    const newSet: ExerciseSet = isTimed
      ? { setNum: nextSetNum, targetTime: '', actualTime: '', done: false }
      : { setNum: nextSetNum, targetReps: null, actualReps: null, weight: 0, done: false };
    actions.update(exercise.id!, { sets: [...exercise.sets, newSet] });
  };

  const confirmDeletion = () => {
    if (!deletionTarget) return;
    
    if (deletionTarget.type === 'exercise') {
      actions.remove(deletionTarget.exerciseId);
    } else if (deletionTarget.type === 'set' && deletionTarget.setIndex !== undefined) {
      const exercise = exercises.find(e => e.id === deletionTarget.exerciseId);
      if (exercise) {
        const updatedSets = exercise.sets
          .filter((_, i) => i !== deletionTarget.setIndex)
          .map((s, i) => ({ ...s, setNum: i + 1 }));
        actions.update(exercise.id!, { sets: updatedSets });
      }
    }
    setDeletionTarget(null);
  };

  const handleUpdateSet = (exercise: Exercise, setIndex: number, updates: Partial<ExerciseSet>) => {
    const isTimed = isTimeBased(exercise);
    const updatedSets = exercise.sets.map((s, i) => {
      if (i === setIndex) {
        const merged = { ...s, ...updates };
        // Auto mark as done if actuals are provided
        if (isTimed && merged.actualTime && merged.actualTime !== '') merged.done = true;
        if (!isTimed && merged.actualReps !== null && merged.actualReps !== undefined) merged.done = true;
        return merged;
      }
      return s;
    });
    actions.update(exercise.id!, { sets: updatedSets });
  };

  const handleToggleDone = (exercise: Exercise, setIndex: number) => {
    const updatedSets = exercise.sets.map((s, i) =>
      i === setIndex ? { ...s, done: !s.done } : s
    );
    actions.update(exercise.id!, { sets: updatedSets });
  };

  const handleAddExercise = (data: Record<string, string | number>) => {
    const isTimed = data.type === 'time';
    const defaultSet: ExerciseSet = isTimed
      ? { setNum: 1, targetTime: '', actualTime: '', done: false }
      : { setNum: 1, targetReps: null, actualReps: null, weight: 0, done: false };
    actions.add({
      date: todayIso, // Explicitly log to today
      name: data.name as string,
      muscles: data.muscles as string,
      icon: data.icon as string,
      sets: [defaultSet],
    });
  };

  const todaysStats = useMemo(() => computeStatsForDay(todaysExercises), [todaysExercises]);

  const handleTodaysRoutine = async () => {
    const apiKey = localStorage.getItem('GEMINI_API_KEY');
    if (!apiKey) {
      setAiInsight('Please add your API Key in Settings to enable the AI Coach.');
      return;
    }
    setInsightLoading(true);
    try {
      const systemPrompt = `You are a strict fitness coach. Goal: Core/Belly fat reduction and muscle building (Push-ups, Squats, etc.). Fasting Mode is ${profile.isFasting ? 'ON' : 'OFF'}. If Fasting is ON, strictly recommend a lighter, energy-conserving routine close to Iftar time. If Fasting is OFF, push them hard. Provide a concise bulleted list of exercises to do today.`;
      const insight = await fetchGemini(systemPrompt, apiKey);
      setAiInsight(insight);
    } catch (err: any) {
      setAiInsight(`Error: ${err.message}`);
    } finally {
      setInsightLoading(false);
    }
  };

  const handleReviewPerformance = async () => {
    const apiKey = localStorage.getItem('GEMINI_API_KEY');
    if (!apiKey) {
      setAiInsight('Please add your API Key in Settings to enable the AI Coach.');
      return;
    }
    setInsightLoading(true);
    try {
      const exerciseContext = todaysExercises.map((e: any) => `${e.name} (${e.sets.filter((s: any) => s.done).length} sets done)`).join(', ');
      const systemPrompt = `You are a strict fitness coach. Fasting Mode is ${profile.isFasting ? 'ON' : 'OFF'}. Today's logged exercises: ${exerciseContext || 'None logged'}. Volume load: ${todaysStats.volume}kg. Tell them how well they did, if they hit enough volume/intensity, and give harsh but motivating feedback for tomorrow.`;
      const insight = await fetchGemini(systemPrompt, apiKey);
      setAiInsight(insight);
    } catch (err: any) {
      setAiInsight(`Error: ${err.message}`);
    } finally {
      setInsightLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1400px] w-full mx-auto flex flex-col h-full gap-8 items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-on-surface-variant text-sm mt-4 tracking-widest uppercase font-semibold">Loading exercises…</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] w-full mx-auto flex flex-col h-full gap-8 relative pb-20 z-0 overflow-x-hidden">
      
      {/* Abstract Mesh Background */}
      <div className="absolute top-0 right-10 w-[500px] h-[500px] bg-tertiary/20 rounded-full blur-[120px] pointer-events-none -z-10 mix-blend-screen"></div>
      <div className="absolute bottom-20 left-10 w-[400px] h-[400px] bg-primary/20 rounded-full blur-[120px] pointer-events-none -z-10 mix-blend-screen"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[150px] pointer-events-none -z-10 mix-blend-screen"></div>

      <header className="flex justify-between items-end mb-2">
        <h2 className="text-[32px] font-bold text-primary tracking-tight leading-none">Sports & Action</h2>
      </header>

      {/* AI Coach Card */}
      <div className="bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 rounded-[32px] p-6 glass-card relative overflow-hidden group z-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-primary/20 transition-colors duration-700"></div>
        <div className="flex gap-4 items-start relative z-10 flex-col md:flex-row">
          <div className="w-12 h-12 rounded-2xl bg-primary/20 flex flex-shrink-0 items-center justify-center text-primary border border-primary/30 shadow-[0_0_15px_rgba(255,180,166,0.3)]">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="flex-1 w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
              <h3 className="text-xl font-bold text-on-surface">AI Fitness Coach</h3>
              <div className="flex gap-3 w-full md:w-auto">
                <button 
                  onClick={handleTodaysRoutine}
                  disabled={insightLoading}
                  className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider hover:bg-primary/20 transition-colors border border-primary/20 disabled:opacity-50 whitespace-nowrap flex-1 md:flex-none"
                >
                  Today's Routine
                </button>
                <button 
                  onClick={handleReviewPerformance}
                  disabled={insightLoading}
                  className="bg-primary/20 text-primary px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider hover:bg-primary/30 transition-colors border border-primary/30 disabled:opacity-50 whitespace-nowrap flex-1 md:flex-none"
                >
                  Review Performance
                </button>
              </div>
            </div>
            {insightLoading ? (
              <div className="flex items-center gap-2 text-on-surface-variant text-sm mt-2">
                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                <span>Analyzing muscle fatigue and generating routine...</span>
              </div>
            ) : aiInsight ? (
              <p className="text-on-surface-variant text-sm leading-relaxed mt-2 whitespace-pre-wrap">{aiInsight}</p>
            ) : (
              <p className="text-on-surface-variant/60 text-sm mt-2">Generate a harsh, volume-heavy routine or review your daily stats.</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        <div className="lg:col-span-8 glass-card rounded-[24px] p-8 flex flex-col justify-between relative overflow-hidden group shadow-lg border border-white/10">
          <div className="absolute inset-0 bg-[url('/fitness_bg.png')] bg-cover bg-center mix-blend-overlay opacity-30 pointer-events-none z-0"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-50 pointer-events-none z-0"></div>
          <div className="relative z-10 flex justify-between items-start mb-8">
            <div>
              <h3 className="text-[32px] font-bold mb-2 text-on-surface">Today's Focus</h3>
              <p className="text-[16px] text-on-surface-variant">Core & Upper Body Hypertrophy</p>
            </div>
            
            <button 
              onClick={() => setIsWorkoutActive(!isWorkoutActive)}
              className={`px-6 py-3 rounded-xl text-[12px] uppercase tracking-widest font-bold flex items-center gap-2 transition-all shadow-lg ${isWorkoutActive ? 'bg-surface-container-high text-primary border border-primary/50 shadow-[0_4px_20px_rgba(255,180,166,0.2)]' : 'bg-primary text-on-primary hover:bg-primary/90 shadow-[0_4px_15px_rgba(255,180,166,0.3)]'}`}
            >
              {isWorkoutActive ? (
                <>
                  <Square className="w-4 h-4 fill-current" /> Pause Session
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" /> Start Session
                </>
              )}
            </button>
          </div>
          
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-6 mt-auto">
            <div className="bg-surface-container-low/50 p-6 rounded-2xl border border-white/5 backdrop-blur-md">
              <span className="text-[12px] font-semibold text-on-surface-variant uppercase tracking-widest block mb-2">Volume Load</span>
              <span className="text-[32px] font-bold text-primary tracking-tight">{todaysStats.volume} kg</span>
            </div>
            <div className="bg-surface-container-low/50 p-6 rounded-2xl border border-white/5 backdrop-blur-md">
              <span className="text-[12px] font-semibold text-on-surface-variant uppercase tracking-widest block mb-2">Intensity</span>
              <span className="text-[32px] font-bold text-tertiary tracking-tight">{todaysStats.intensity}</span>
            </div>
            <div className="bg-surface-container-low/50 p-6 rounded-2xl border border-white/5 backdrop-blur-md">
              <span className="text-[12px] font-semibold text-on-surface-variant uppercase tracking-widest block mb-2">Est. Time</span>
              <span className="text-[32px] font-bold text-on-surface tracking-tight">{todaysStats.estTime}</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 glass-card rounded-[24px] p-8 flex flex-col shadow-lg border border-white/10">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-[24px] font-medium text-on-surface">Consistency</h3>
            <span className="text-[12px] font-bold text-primary uppercase tracking-widest">{new Date().toLocaleString('default', { month: 'short', year: 'numeric' })}</span>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <div className="grid grid-cols-7 gap-2 md:gap-3 mb-3 text-center text-[12px] font-bold text-on-surface-variant uppercase tracking-widest w-full px-2 max-w-5xl mx-auto">
              <div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div><div>S</div>
            </div>
            <div className="grid grid-cols-7 gap-2 md:gap-3 px-2 max-w-5xl mx-auto w-full">
              {heatmapData.map((data, i) => {
                return (
                  <div 
                    key={i} 
                    onClick={() => setSelectedHeatmapDay({ dateStr: data.dateStr, iso: data.iso, dayExs: data.dayExs })}
                    className={`aspect-square rounded-xl flex items-center justify-center border ${data.color} hover:scale-110 hover:z-10 transition-all cursor-pointer shadow-sm`} 
                    title={data.dateStr}
                  >
                    <span className={`text-[12px] md:text-[14px] font-bold ${data.textColor}`}>{i + 1}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-8 flex items-center justify-between text-[12px] font-semibold text-on-surface-variant uppercase tracking-widest px-2">
            <span>Less</span>
            <div className="flex gap-1.5">
              <div className="w-4 h-4 rounded-sm bg-white/5 border border-white/5"></div>
              <div className="w-4 h-4 rounded-sm bg-primary/20 border border-primary/20"></div>
              <div className="w-4 h-4 rounded-sm bg-primary/40 border border-primary/40"></div>
              <div className="w-4 h-4 rounded-sm bg-primary/70 border border-primary/70"></div>
              <div className="w-4 h-4 rounded-sm bg-primary border border-primary/50 shadow-[0_0_8px_rgba(255,180,166,0.6)]"></div>
            </div>
            <span>More</span>
          </div>
        </div>

        <div className="lg:col-span-12 glass-card rounded-[32px] p-4 md:p-10 shadow-xl border border-white/10 relative z-10">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-[24px] font-medium text-on-surface mt-2 flex items-center">
              Today's Session
              <span className="ml-4 text-[12px] font-bold text-primary uppercase tracking-widest px-4 py-1.5 bg-primary/10 rounded-full border border-primary/20 shadow-sm">
                {new Date(todayIso + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </h3>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddExercise(true)}
                className="px-6 h-12 rounded-xl bg-primary/20 hover:bg-primary/30 transition-colors text-primary flex items-center justify-center border border-primary/30 shadow-sm gap-2 font-bold uppercase tracking-widest text-[12px]"
              >
                <Plus className="w-4 h-4" /> Add Exercise
              </button>
            </div>
          </div>

          <div className="space-y-8">
            {todaysExercises.length === 0 && (
              <div className="text-center py-16 text-on-surface-variant">
                <p className="text-lg mb-2">No exercises logged today.</p>
                <p className="text-sm opacity-60">Click the + button above to begin your session.</p>
              </div>
            )}

            {todaysExercises.map(exercise => {
              const isTimed = isTimeBased(exercise);
              const iconColors = ICON_COLOR_MAP[exercise.icon] || ICON_COLOR_MAP.accessibility;

              return (
                <div key={exercise.id} className="bg-surface-container-lowest/50 rounded-[24px] p-8 border border-white/5 backdrop-blur-md group/card">
                  <div className="flex items-center gap-6 mb-8">
                    <div className={`w-16 h-16 rounded-2xl ${iconColors.bg} flex items-center justify-center ${iconColors.text} border ${iconColors.border}`}>
                      {ICON_MAP[exercise.icon] || <Accessibility className="w-8 h-8" />}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-[20px] font-bold text-on-surface mb-1">{exercise.name}</h4>
                      <p className="text-[12px] font-semibold text-on-surface-variant uppercase tracking-widest">{exercise.muscles}</p>
                    </div>
                    <button
                      onClick={() => setDeletionTarget({ type: 'exercise', exerciseId: exercise.id! })}
                      className="w-10 h-10 rounded-xl bg-white/5 hover:bg-error/20 border border-white/10 flex items-center justify-center text-on-surface-variant hover:text-error transition-colors opacity-0 group-hover/card:opacity-100"
                      title="Delete exercise"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                      <thead>
                        <tr className="text-[12px] font-semibold text-on-surface-variant border-b border-white/10 uppercase tracking-widest">
                          <th className="pb-4 w-20">Set</th>
                          {isTimed ? (
                            <>
                              <th className="pb-4 px-6">Target Time</th>
                              <th className="pb-4 px-6">Actual Time</th>
                            </>
                          ) : (
                            <>
                              <th className="pb-4 px-6">Target Reps</th>
                              <th className="pb-4 px-6">Actual Reps</th>
                              <th className="pb-4 px-6">Weight (kg)</th>
                            </>
                          )}
                          <th className="pb-4 text-right">Status</th>
                          <th className="pb-4 w-12"></th>
                        </tr>
                      </thead>
                      <tbody className="text-[16px]">
                        {exercise.sets.map((set, setIndex) => {
                          const setId = `${exercise.id}-${setIndex}`;
                          const isTimerActive = activeTimerSetId === setId;
                          const currentActualTime = isTimerActive ? `${activeTimerValue}s` : (set.actualTime || '');

                          return (
                            <tr
                              key={set.setNum}
                              className={`${setIndex < exercise.sets.length - 1 ? 'border-b border-white/5' : ''} hover:bg-white/5 transition-colors group/row`}
                            >
                              <td className="py-4 text-on-surface-variant font-medium">{set.setNum}</td>
                              {isTimed ? (
                                <>
                                  <td className="py-4 px-6">
                                    <input
                                      type="text"
                                      value={set.targetTime || ''}
                                      onChange={(e) => handleUpdateSet(exercise, setIndex, { targetTime: e.target.value })}
                                      placeholder="Target..."
                                      className="w-32 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-center text-on-surface focus:outline-none focus:border-primary transition-colors"
                                    />
                                  </td>
                                  <td className="py-4 px-6">
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="text"
                                        value={currentActualTime}
                                        onChange={(e) => {
                                          if (isTimerActive) setActiveTimerSetId(null);
                                          handleUpdateSet(exercise, setIndex, { actualTime: e.target.value });
                                        }}
                                        placeholder="Actual..."
                                        className={`w-32 px-4 py-2 rounded-lg bg-white/5 border text-center font-bold text-on-surface focus:outline-none transition-colors ${isTimerActive ? 'border-error/50 bg-error/10' : 'border-white/10 focus:border-primary focus:bg-primary/10'}`}
                                      />
                                      <button 
                                        onClick={() => handleToggleSetTimer(exercise, setIndex)}
                                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors shadow-sm ${isTimerActive ? 'bg-error text-on-error animate-pulse shadow-[0_0_15px_rgba(255,82,82,0.4)]' : 'bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30'}`}
                                        title={isTimerActive ? "Stop Timer & Save" : "Start Live Timer"}
                                      >
                                        {isTimerActive ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                                      </button>
                                    </div>
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td className="py-4 px-6">
                                    <input
                                      type="number"
                                      value={set.targetReps ?? ''}
                                      onChange={(e) => handleUpdateSet(exercise, setIndex, { targetReps: e.target.value === '' ? null : parseInt(e.target.value) })}
                                      placeholder="Target..."
                                      className="w-24 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-center text-on-surface focus:outline-none focus:border-primary transition-colors"
                                    />
                                  </td>
                                  <td className="py-4 px-6">
                                    <input
                                      type="number"
                                      value={set.actualReps ?? ''}
                                      onChange={(e) => handleUpdateSet(exercise, setIndex, { actualReps: e.target.value === '' ? null : parseInt(e.target.value) })}
                                      placeholder="-"
                                      className="w-24 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-center font-bold text-on-surface focus:outline-none focus:border-primary focus:bg-primary/10 transition-colors"
                                    />
                                  </td>
                                  <td className="py-4 px-6">
                                    <input
                                      type="number"
                                      value={set.weight ?? 0}
                                      onChange={(e) => handleUpdateSet(exercise, setIndex, { weight: parseFloat(e.target.value) || 0 })}
                                      className="w-24 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-center text-on-surface focus:outline-none focus:border-primary transition-colors"
                                    />
                                  </td>
                                </>
                              )}
                              <td className="py-4 text-right">
                                <button onClick={() => handleToggleDone(exercise, setIndex)} className="focus:outline-none hover:scale-110 transition-transform">
                                  <div className={`transition-all ${set.done ? 'text-tertiary drop-shadow-[0_0_8px_rgba(137,206,255,0.6)]' : 'text-on-surface-variant opacity-30 hover:opacity-80'}`}>
                                    {set.done ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                                  </div>
                                </button>
                              </td>
                              <td className="py-4 text-center">
                                <button
                                  onClick={() => setDeletionTarget({ type: 'set', exerciseId: exercise.id!, setIndex })}
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors opacity-0 group-hover/row:opacity-100"
                                  title="Delete set"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <button
                    onClick={() => handleAddSet(exercise)}
                    className="mt-6 text-primary text-[12px] font-bold uppercase tracking-widest hover:underline flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add Set
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sticky Active Session Tracker */}
      <AnimatePresence>
        {isWorkoutActive && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between gap-8 bg-surface-container-high/90 backdrop-blur-2xl border border-primary/30 p-4 pr-6 pl-8 rounded-[32px] shadow-[0_30px_80px_rgba(0,0,0,0.8),0_0_40px_rgba(255,180,166,0.15)]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none rounded-[32px]"></div>
            
            <div className="flex items-center gap-4 relative z-10">
              <div className="relative flex items-center justify-center">
                 <div className="absolute inset-0 bg-primary/40 rounded-full animate-ping blur-sm"></div>
                 <div className="w-3.5 h-3.5 bg-primary rounded-full relative z-10 shadow-[0_0_15px_rgba(255,180,166,1)]"></div>
              </div>
              <span className="text-[14px] font-bold uppercase tracking-widest text-primary">Live Session</span>
            </div>
            
            <div className="text-[32px] font-mono font-bold text-on-surface tracking-tighter w-[120px] text-center relative z-10 drop-shadow-md">
              {formatTime(sessionTime)}
            </div>

            <button
              onClick={() => setIsWorkoutActive(false)}
              className="px-8 py-3.5 bg-error/20 hover:bg-error/30 border border-error/50 text-error rounded-2xl text-[12px] font-bold uppercase tracking-widest transition-colors shadow-sm relative z-10"
            >
              End Session
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal 
        isOpen={deletionTarget !== null}
        onClose={() => setDeletionTarget(null)}
        onConfirm={confirmDeletion}
        title={`Delete ${deletionTarget?.type === 'exercise' ? 'Exercise' : 'Set'}`}
        message={`Are you sure you want to permanently delete this ${deletionTarget?.type}? This action cannot be undone.`}
      />

      {/* Heatmap Popover */}
      <AnimatePresence>
        {selectedHeatmapDay && (() => {
          const popupStats = computeStatsForDay(selectedHeatmapDay.dayExs);
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedHeatmapDay(null)}
              className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm p-4"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                onClick={e => e.stopPropagation()}
                className="bg-surface-container-high/90 backdrop-blur-[40px] border border-white/20 rounded-[32px] p-8 w-full max-w-[400px] shadow-[0_30px_80px_rgba(0,0,0,0.5),inset_1px_1px_0px_rgba(255,255,255,0.15)] relative overflow-hidden"
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-primary/10 blur-[40px] pointer-events-none rounded-full"></div>
                
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div>
                    <h3 className="text-[24px] font-bold text-on-surface tracking-tight">
                      {selectedHeatmapDay.dateStr}
                    </h3>
                    <p className="text-[14px] text-on-surface-variant">Daily Activity Summary</p>
                  </div>
                  <button onClick={() => setSelectedHeatmapDay(null)} className="text-on-surface-variant hover:text-on-surface bg-white/5 w-8 h-8 rounded-full flex items-center justify-center">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {selectedHeatmapDay.dayExs.length === 0 ? (
                  <div className="text-center py-8 relative z-10">
                    <CalendarX className="w-12 h-12 text-on-surface-variant opacity-20 mb-4 mx-auto" />
                    <p className="text-on-surface-variant italic font-medium">No activity logged for this date.</p>
                  </div>
                ) : (
                  <div className="space-y-4 relative z-10">
                    <div className="bg-surface-container/50 border border-white/5 p-4 rounded-xl flex justify-between items-center">
                      <span className="text-[14px] text-on-surface-variant font-medium">Exercises Logged</span>
                      <span className="text-[18px] font-bold text-on-surface">{selectedHeatmapDay.dayExs.length}</span>
                    </div>
                    <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl flex justify-between items-center">
                      <span className="text-[14px] text-primary font-medium">Volume Load</span>
                      <span className="text-[18px] font-bold text-primary">{popupStats.volume} kg</span>
                    </div>
                    <div className="bg-tertiary/10 border border-tertiary/20 p-4 rounded-xl flex justify-between items-center">
                      <span className="text-[14px] text-tertiary font-medium">Intensity Level</span>
                      <span className="text-[18px] font-bold text-tertiary">{popupStats.intensity}</span>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      <FormModal
        isOpen={showAddExercise}
        onClose={() => setShowAddExercise(false)}
        onSubmit={handleAddExercise}
        title="Add Exercise"
        submitLabel="Add"
        fields={[
          {
            name: 'name', label: 'Exercise or Sport', type: 'select', required: true,
            options: [
              { value: 'Push-ups', label: 'Push-ups' },
              { value: 'Pull-ups', label: 'Pull-ups' },
              { value: 'Mountain Climbers', label: 'Mountain Climbers' },
              { value: 'Dumbbell Workouts', label: 'Dumbbell Workouts' },
              { value: 'Core/Belly Fat Reduction', label: 'Core/Belly Fat Reduction' },
              { value: 'Football', label: 'Football' },
              { value: 'Cricket', label: 'Cricket' },
              { value: 'Badminton', label: 'Badminton' },
              { value: 'Running', label: 'Running' },
              { value: 'Table Tennis', label: 'Table Tennis' },
              { value: 'Swimming', label: 'Swimming' },
            ],
          },
          { name: 'muscles', label: 'Target Area', type: 'text', required: true, placeholder: 'e.g. Full Body, Chest...' },
          {
            name: 'icon', label: 'Icon', type: 'select', required: true,
            options: [
              { value: 'accessibility', label: 'Accessibility (body)' },
              { value: 'shell', label: 'Shell (core)' },
            ],
          },
          {
            name: 'type', label: 'Set Type', type: 'select', required: true,
            options: [
              { value: 'reps', label: 'Reps-based' },
              { value: 'time', label: 'Time-based' },
            ],
          },
        ]}
      />
    </div>
  );
}
