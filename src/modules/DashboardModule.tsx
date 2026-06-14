import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Brain, Activity, Droplet } from 'lucide-react';
import { useStore } from '../useStore';
import { STORES, getSetting } from '../db';
import { useUserProfile } from '../context/UserProfileContext';

export function DashboardModule() {
  const [studyCourses] = useStore<any>(STORES.studyCourses);
  const [dietEntries] = useStore<any>(STORES.dietEntries);
  const [sportsExercises] = useStore<any>(STORES.sportsExercises);
  
  const { profile } = useUserProfile();
  const [aiInsight, setAiInsight] = useState<string>('');
  const [insightLoading, setInsightLoading] = useState(false);

  useEffect(() => {
    const fetchInsight = async () => {
      const apiKey = localStorage.getItem('GEMINI_API_KEY');
      if (!apiKey) return;
      
      setInsightLoading(true);
      try {
        const dietContext = dietEntries.slice(0, 7).map((d: any) => `Date: ${d.date}, Calories: ${d.calories}, Hydration: ${d.hydration}ml, Fasting: ${d.isFasting}`).join('; ');
        
        const promptContext = `Profile: Height ${profile.height}, Weight ${profile.weight}, Goal: ${profile.primaryGoal}. Fasting Mode: ${profile.isFasting}. Diet History: ${dietContext}`;
        
        const systemPrompt = `Act as an elite life coach and doctor. Analyze my recent activity, diet, and fasting data. Give a harsh, direct, and actionable 3-sentence review on my lifestyle improvement.\n\nContext: ${promptContext}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt }] }]
          })
        });

        if (!response.ok) throw new Error('API Error');
        const data = await response.json();
        setAiInsight(data.candidates?.[0]?.content?.parts?.[0]?.text || 'No insights generated.');
      } catch (err) {
        setAiInsight('Failed to connect to AI Coach. Check your API Key.');
      } finally {
        setInsightLoading(false);
      }
    };

    fetchInsight();
    
    const handleKeyUpdate = () => fetchInsight();
    window.addEventListener('API_KEY_UPDATED', handleKeyUpdate);
    return () => window.removeEventListener('API_KEY_UPDATED', handleKeyUpdate);
  }, [dietEntries, profile]);


  return (
    <>
      <div 
        className="fixed inset-0 z-[-2] bg-cover bg-center opacity-30 mix-blend-screen"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')" }}
      />
      <div className="fixed inset-0 z-[-1] bg-gradient-to-t from-background via-background/80 to-background/20 pointer-events-none"></div>

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
        
        <div className="relative w-full h-48 sm:h-64 mt-4 z-10">
          <svg className="w-full h-full overflow-visible drop-shadow-[0_0_15px_rgba(192,193,255,0.4)]" viewBox="0 0 1000 200" preserveAspectRatio="none">
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
            <path 
              d="M 0,180 C 100,160 150,190 250,140 C 350,90 400,150 500,100 C 600,50 650,110 750,70 C 850,30 900,60 1000,20 L 1000,200 L 0,200 Z" 
              fill="url(#trendGradient)" 
            />
            <path 
              d="M 0,180 C 100,160 150,190 250,140 C 350,90 400,150 500,100 C 600,50 650,110 750,70 C 850,30 900,60 1000,20" 
              fill="none" 
              stroke="url(#lineGradient)" 
              strokeWidth="6" 
              strokeLinecap="round"
              className="drop-shadow-[0_0_10px_rgba(101,31,255,0.8)]"
            />
            {/* Simulated Data Points */}
            {[
              { x: 0, y: 180 }, { x: 250, y: 140 }, { x: 500, y: 100 },
              { x: 750, y: 70 }, { x: 1000, y: 20 }
            ].map((pt, i) => (
              <circle key={i} cx={pt.x} cy={pt.y} r="6" fill="#fff" stroke="#651fff" strokeWidth="3" className="drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]" />
            ))}
          </svg>
        </div>
      </div>

      {/* Pro Coach AI Insight */}
      <div className="lg:col-span-12 bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 rounded-[32px] p-8 glass-card relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-primary/20 transition-colors duration-700"></div>
        <div className="flex gap-6 items-start relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex flex-shrink-0 items-center justify-center text-primary border border-primary/30 shadow-[0_0_15px_rgba(255,180,166,0.3)]">
            <Sparkles className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-on-surface flex items-center gap-2 mb-2">
              Pro Coach Insight
            </h3>
            {insightLoading ? (
               <div className="flex items-center gap-2 text-on-surface-variant">
                 <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                 <span>Analyzing your biological metrics...</span>
               </div>
            ) : (
               <p className="text-on-surface-variant text-base leading-relaxed">
                 {aiInsight || "Add your API Key in Settings to enable Pro Coach insights."}
               </p>
            )}
          </div>
        </div>
      </div>

    </motion.div>
    </>
  );
}
