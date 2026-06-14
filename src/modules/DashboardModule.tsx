import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Brain, Activity, Droplet } from 'lucide-react';
import { useStore } from '../useStore';
import { STORES } from '../db';

export function DashboardModule() {
  const [studyCourses] = useStore<any>(STORES.studyCourses);
  const [dietEntries] = useStore<any>(STORES.dietEntries);
  const [sportsExercises] = useStore<any>(STORES.sportsExercises);


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

    </motion.div>
    </>
  );
}
