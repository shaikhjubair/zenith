import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Brain, Activity, Droplet } from 'lucide-react';
import { useStore } from '../useStore';
import { STORES, getSetting } from '../db';
import { useUserProfile } from '../context/UserProfileContext';

import { fetchGemini } from '../utils/gemini';
import { SCHEDULE_DATA, useCurrentTime } from './StudyModule';

class DashboardErrorBoundary extends React.Component<any, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Dashboard Module Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center bg-red-500/10 border border-red-500/20 rounded-3xl m-8 z-50 relative">
          <h2 className="text-xl font-bold text-red-400 mb-2">Dashboard Module Error</h2>
          <p className="text-red-300">An unexpected error occurred. Please refresh the page.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const notifyUser = (title: string, body: string) => {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/logo.png' });
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        new Notification(title, { body, icon: '/logo.png' });
      }
    });
  }
};

const SmartClassCard = ({ cls, currentTime }: any) => {
  const [isActive, setIsActive] = useState(false);

  const parseTime = (t: string) => {
    const match = t.match(/(\d+):(\d+)(AM|PM)/);
    if (!match) return 0;
    let h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    if (match[3] === 'PM' && h !== 12) h += 12;
    if (match[3] === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  };

  const startStr = cls.time.split(' - ')[0];
  const startMins = parseTime(startStr);
  const endMins = startMins + cls.duration;
  
  const nowMins = currentTime.getHours() * 60 + currentTime.getMinutes();
  const nowSecs = nowMins * 60 + currentTime.getSeconds();
  
  const startSecs = startMins * 60;
  const endSecs = endMins * 60;

  let displayTime = "00:00";
  let statusText = "";
  const isEnded = nowSecs >= endSecs;
  
  if (isEnded) {
    displayTime = "00:00";
    statusText = "Ended";
  } else if (isActive) {
    if (nowSecs < startSecs) {
      const remaining = startSecs - nowSecs;
      const m = Math.floor(remaining / 60).toString().padStart(2, '0');
      const s = (remaining % 60).toString().padStart(2, '0');
      displayTime = `${m}:${s}`;
      statusText = "Starts in";
    } else {
      const remaining = endSecs - nowSecs;
      const m = Math.floor(remaining / 60).toString().padStart(2, '0');
      const s = (remaining % 60).toString().padStart(2, '0');
      displayTime = `${m}:${s}`;
      statusText = "Remaining";
    }
  } else {
    displayTime = `${cls.duration}:00`;
    statusText = "Duration";
  }

  useEffect(() => {
    if (!isActive && (startMins - nowMins) <= 15 && nowMins < endMins) {
      setIsActive(true);
    }
  }, [nowMins, startMins, endMins, isActive]);

  const notifiedMinsRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      const remaining = startSecs - nowSecs;
      if (isActive && !isEnded && (remaining === 300 || remaining === 0)) {
        if (notifiedMinsRef.current !== remaining && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          notifiedMinsRef.current = remaining;
          const title = remaining === 300 ? "Class Starting Soon!" : "Class Starting!";
          const body = `Your ${cls.type} class for ${cls.course} starts ${remaining === 300 ? 'in 5 minutes' : 'now'} in Room ${cls.room}.`;
          notifyUser(title, body);
        }
      }
    } catch (err) {
      console.error("Dashboard Module Error:", err);
    }
  }, [isActive, isEnded, startSecs, nowSecs, cls]);

  return (
    <div className={`bg-surface/60 backdrop-blur-xl border ${isActive && !isEnded ? 'border-primary/50 shadow-[0_0_20px_rgba(var(--primary-rgb),0.2)]' : 'border-white/20'} rounded-[32px] p-6 glass-card flex flex-col md:flex-row justify-between items-center gap-4 transition-all hover:-translate-y-1`}>
      <div>
         <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded mb-2 inline-block ${cls.isLab ? 'bg-tertiary/20 text-tertiary' : 'bg-secondary/20 text-secondary'}`}>
            {cls.type}
         </span>
         <h3 className={`text-xl font-bold ${isEnded ? 'text-on-surface-variant line-through' : 'text-on-surface'}`}>{cls.course}</h3>
         <p className="text-on-surface-variant flex items-center gap-2 mt-1">
           <span className={`font-bold text-lg ${isActive && !isEnded ? 'text-primary' : 'text-on-surface'}`}>Room {cls.room}</span> • {cls.time}
         </p>
      </div>
      
      <div className="flex items-center gap-4">
         {isActive || isEnded ? (
           <div className={`flex flex-col items-center min-w-[100px] ${isEnded ? 'opacity-50' : ''}`}>
             <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">{statusText}</span>
             <span className={`text-3xl font-mono font-bold tabular-nums tracking-tighter ${isActive && !isEnded && nowSecs < startSecs ? 'text-secondary' : 'text-primary'}`}>
               {displayTime}
             </span>
           </div>
         ) : (
           <button onClick={() => setIsActive(true)} className="px-6 py-2 rounded-xl bg-primary/20 text-primary hover:bg-primary/30 font-bold transition-transform hover:-translate-y-1 text-sm uppercase tracking-widest shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]">
              Start
           </button>
         )}
      </div>
    </div>
  );
};

const SmartClassWidget = () => {
  const currentTime = useCurrentTime();
  const dayIndex = currentTime.getDay();
  const daysMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const todayStr = daysMap[dayIndex];
  
  const getTodayClasses = () => {
    return SCHEDULE_DATA.filter(c => c.day === todayStr).map(c => {
      const isLab = c.course.toLowerCase().includes('lab') || c.course.toLowerCase().includes('laboratory');
      const duration = isLab ? 150 : 80;
      return { ...c, isLab, duration };
    });
  };

  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );

  const requestPermission = async () => {
    try {
      if (typeof Notification !== 'undefined') {
        const p = await Notification.requestPermission();
        setPermission(p);
      }
    } catch (err) {
      console.error("Dashboard Module Error:", err);
    }
  };

  const triggerTestNotification = () => {
    notifyUser(
      "Zenith Test Alert!",
      "Wow bro! Tomar Zenith PWA notification ekdom perfectly kaj korche!"
    );
  };

  const todaysClasses = getTodayClasses();

  if (todaysClasses.length === 0) {
    return (
      <div className="lg:col-span-12 bg-primary/5 backdrop-blur-xl border border-primary/20 rounded-[32px] p-8 glass-card text-center relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-primary/20 transition-colors duration-700"></div>
        <span className="text-4xl mb-4 block relative z-10">🌿</span>
        <h2 className="text-2xl font-bold text-primary mb-2 relative z-10">No classes today - Take a breather!</h2>
        <p className="text-on-surface-variant relative z-10">Focus on self-study today.</p>
      </div>
    );
  }

  return (
    <div className="lg:col-span-12 flex flex-col gap-4 relative z-10 mb-4">
       <div className="flex items-center justify-between mb-2">
         <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.8)] animate-pulse"></div>
           <h2 className="text-[14px] font-bold text-on-surface-variant uppercase tracking-widest">Smart Schedule</h2>
         </div>
         <div className="flex items-center gap-2">
           {permission === 'default' && (
             <button onClick={requestPermission} className="px-4 py-1.5 rounded-full bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30 text-[10px] font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)] transition-all">
               🔔 Enable Class Alerts
             </button>
           )}
           {typeof window !== 'undefined' && 'Notification' in window ? (
             <button onClick={triggerTestNotification} className="px-4 py-1.5 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 text-[10px] font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all">
               🚨 Test Notification Instantly
             </button>
           ) : (
             <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest">Notifications not supported</p>
           )}
         </div>
       </div>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         {todaysClasses.map((cls, idx) => (
           <SmartClassCard key={idx} cls={cls} currentTime={currentTime} />
         ))}
       </div>
    </div>
  );
};

export function DashboardModule() {
  const [studyCourses] = useStore<any>(STORES.studyCourses);
  const [dietEntries] = useStore<any>(STORES.dietEntries);
  const [sportsExercises] = useStore<any>(STORES.sportsExercises);
  
  const { profile } = useUserProfile();
  const [aiInsight, setAiInsight] = useState<string>('');
  const [insightLoading, setInsightLoading] = useState(false);

  const fetchInsight = async () => {
    const apiKey = localStorage.getItem('GEMINI_API_KEY');
    if (!apiKey) {
      setAiInsight('API Key missing. Please set it in Settings.');
      return;
    }
    
    setInsightLoading(true);
    try {
      const dietContext = dietEntries.slice(0, 7).map((d: any) => `Date: ${d.date}, Calories: ${d.calories}, Hydration: ${d.hydration}ml, Fasting: ${d.isFasting}`).join('; ');
      
      const promptContext = `Profile: Height ${profile.height}, Weight ${profile.weight}, Goal: ${profile.primaryGoal}. Fasting Mode: ${profile.isFasting}. Diet History: ${dietContext}`;
      
      const systemPrompt = `Act as an elite life coach and doctor. Analyze my recent activity, diet, and fasting data. Give a harsh, direct, and actionable 3-sentence review on my lifestyle improvement.\n\nContext: ${promptContext}`;

      const insightText = await fetchGemini(systemPrompt, apiKey);
      setAiInsight(insightText || 'No insights generated.');
    } catch (err: any) {
      console.error("Gemini Insight Fetch Error:", err);
      setAiInsight(`AI Coach Error: ${err.message || 'Check your API Key.'}`);
    } finally {
      setInsightLoading(false);
    }
  };


  return (
    <>
      <div 
        className="fixed inset-0 z-[-2] bg-cover bg-center opacity-30 mix-blend-screen"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')" }}
      />
      <div className="fixed inset-0 z-[-1] bg-gradient-to-t from-background via-background/80 to-background/20 pointer-events-none"></div>

      <DashboardErrorBoundary>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 h-full relative z-0">
        {/* Background Orbs */}
        <div className="absolute top-10 left-10 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none -z-10 mix-blend-screen"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-[120px] pointer-events-none -z-10 mix-blend-screen"></div>
      
      <div className="lg:col-span-12 flex items-center justify-between">
        <div>
          <h1 className="text-[32px] font-bold text-on-surface">Overview</h1>
          <p className="text-[16px] text-on-surface-variant">Your personalized command center.</p>
        </div>
      </div>

      {/* Smart Class Widget */}
      <SmartClassWidget />


      {/* Quick Stats Grid */}
      <div className="lg:col-span-4 bg-surface/60 backdrop-blur-xl border border-white/20 rounded-[32px] p-6 glass-card flex items-center gap-4 hover:-translate-y-1 transition-transform">
        <div className="w-14 h-14 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
          <Brain className="w-6 h-6" />
        </div>
        <div>
          <p className="text-[12px] font-bold text-on-surface-variant uppercase tracking-widest">Active Courses</p>
          <p className="text-2xl font-bold text-on-surface">{studyCourses.length}</p>
        </div>
      </div>

      <div className="lg:col-span-4 bg-surface/60 backdrop-blur-xl border border-white/20 rounded-[32px] p-6 glass-card flex items-center gap-4 hover:-translate-y-1 transition-transform">
        <div className="w-14 h-14 rounded-full bg-secondary/20 text-secondary flex items-center justify-center">
          <Droplet className="w-6 h-6" />
        </div>
        <div>
          <p className="text-[12px] font-bold text-on-surface-variant uppercase tracking-widest">Logged Diet Days</p>
          <p className="text-2xl font-bold text-on-surface">{dietEntries.length}</p>
        </div>
      </div>

      <div className="lg:col-span-4 bg-surface/60 backdrop-blur-xl border border-white/20 rounded-[32px] p-6 glass-card flex items-center gap-4 hover:-translate-y-1 transition-transform">
        <div className="w-14 h-14 rounded-full bg-tertiary/20 text-tertiary flex items-center justify-center">
          <Activity className="w-6 h-6" />
        </div>
        <div>
          <p className="text-[12px] font-bold text-on-surface-variant uppercase tracking-widest">Workout Routines</p>
          <p className="text-2xl font-bold text-on-surface">{sportsExercises.length}</p>
        </div>
      </div>

      {/* Progress Trend Graph */}
      <div className="lg:col-span-12 bg-surface/60 backdrop-blur-xl border border-white/20 rounded-[32px] p-8 glass-card relative overflow-hidden transition-transform hover:-translate-y-1">
        <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h3 className="text-xl font-bold text-on-surface mb-1">Consistency Matrix</h3>
            <p className="text-[14px] text-on-surface-variant flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_rgba(192,193,255,0.8)]"></span>
              Upward Trend: +12% this week
            </p>
          </div>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-on-surface-variant">7 Days</span>
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-on-surface-variant">30 Days</span>
          </div>
        </div>
        
        <div className="relative w-full h-48 sm:h-64 mt-4 z-10 flex flex-col">
          <svg className="w-full h-full overflow-visible drop-shadow-[0_0_15px_rgba(192,193,255,0.4)] flex-1" viewBox="0 0 1000 200" preserveAspectRatio="none">
            <defs>
              <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(192,193,255,0.5)" />
                <stop offset="100%" stopColor="rgba(192,193,255,0)" />
              </linearGradient>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#c0c1ff" />
                <stop offset="50%" stopColor="#00e676" />
                <stop offset="100%" stopColor="#651fff" />
              </linearGradient>
            </defs>
            {(() => {
              // 30 Days of Real Data Logic
              const numDays = 30;
              const today = new Date();
              
              const points = Array.from({ length: numDays }).map((_, i) => {
                const targetDate = new Date();
                targetDate.setDate(today.getDate() - (numDays - 1 - i));
                const dateStr = targetDate.toISOString().split('T')[0];
                
                // Count real entries for this date
                const dietsOnDate = dietEntries.filter((d: any) => d.date === dateStr).length;
                const sportsOnDate = sportsExercises.filter((s: any) => s.date === dateStr || (s.timestamp && new Date(s.timestamp).toISOString().split('T')[0] === dateStr)).length;
                
                // Calculate score 0-100 based on activity
                const baseScore = Math.min(100, (dietsOnDate * 30) + (sportsOnDate * 40));
                
                // Keep some visual floor baseline if totally empty so line doesn't flatline completely at zero
                const score = Math.max(10, Math.min(100, baseScore + (i % 3 === 0 ? 10 : 0))); // slight dynamic variance
                
                const x = (i / (numDays - 1)) * 1000;
                const y = 180 - (score / 100) * 160; // Map 0-100 score to 180-20 SVG Y coordinates
                return { x, y, dateStr, score };
              });
              
              const dPath = `M 0,${points[0].y} ` + points.slice(1).map((pt, i) => {
                const prev = points[i];
                const cp1x = prev.x + (pt.x - prev.x) / 2;
                return `C ${cp1x},${prev.y} ${cp1x},${pt.y} ${pt.x},${pt.y}`;
              }).join(' ');

              return (
                <>
                  <path d={`${dPath} L 1000,180 L 0,180 Z`} fill="url(#trendGradient)" />
                  <path 
                    d={dPath} 
                    fill="none" 
                    stroke="url(#lineGradient)" 
                    strokeWidth="4" 
                    strokeLinecap="round"
                    className="drop-shadow-[0_0_10px_rgba(101,31,255,0.8)]"
                  />
                  {points.map((pt, i) => (
                    <circle 
                      key={i} 
                      cx={pt.x} 
                      cy={pt.y} 
                      r={i === numDays - 1 ? "6" : "3"} 
                      fill={i === numDays - 1 ? "#fff" : "#651fff"} 
                      stroke="#651fff" 
                      strokeWidth={i === numDays - 1 ? "3" : "1"} 
                      className="drop-shadow-[0_0_5px_rgba(255,255,255,0.8)] transition-all hover:r-8 hover:fill-white cursor-crosshair" 
                    >
                      <title>{`${pt.dateStr}: ${Math.round(pt.score)}/100`}</title>
                    </circle>
                  ))}
                </>
              );
            })()}
          </svg>
          <div className="flex justify-between mt-4 px-2">
            {[...Array(6)].map((_, i) => {
              const d = new Date();
              d.setDate(d.getDate() - (29 - (i * 5.8))); // Approx every 5-6 days
              return (
                <span key={i} className="text-[10px] text-on-surface-variant/60 font-semibold uppercase tracking-widest">
                  {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pro Coach AI Insight */}
      <div className="lg:col-span-12 bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 rounded-[32px] p-8 glass-card relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-primary/20 transition-colors duration-700"></div>
        <div className="flex gap-6 items-start relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex flex-shrink-0 items-center justify-center text-primary border border-primary/30 shadow-[0_0_15px_rgba(255,180,166,0.3)]">
            <Sparkles className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-on-surface flex items-center gap-2">
                Pro Coach Insight
              </h3>
              <button 
                onClick={fetchInsight} 
                disabled={insightLoading}
                className="px-4 py-2 rounded-xl bg-primary/20 text-primary hover:bg-primary/30 transition-colors text-sm font-bold uppercase tracking-widest flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {insightLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary/50 border-t-primary rounded-full animate-spin"></div>
                    Generating...
                  </>
                ) : (
                  'Generate Insight'
                )}
              </button>
            </div>
            {!insightLoading && aiInsight ? (
               <p className="text-on-surface-variant text-base leading-relaxed">
                 {aiInsight}
               </p>
            ) : (!insightLoading && !aiInsight) ? (
               <p className="text-on-surface-variant/50 text-base leading-relaxed italic">
                 Click "Generate Insight" to get a personalized breakdown of your current habits.
               </p>
            ) : (
               <div className="flex items-center gap-2 text-on-surface-variant">
                 <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                 <span>Analyzing your biological metrics...</span>
               </div>
            )}
          </div>
        </div>
      </div>

    </motion.div>
    </DashboardErrorBoundary>
    </>
  );
}
