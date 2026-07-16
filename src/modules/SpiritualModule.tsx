import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { CalendarDays, Sun, Heart, Circle, Users, BookMarked, Plus, Minus, X, Clock, MapPin, CheckCircle2, Moon, BookOpen, UtensilsCrossed, CalendarX, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Coordinates, CalculationMethod, PrayerTimes, Madhab } from 'adhan';
import { useStore } from '../useStore';
import { STORES, getLocalApiKey } from '../db';
import { FormModal } from '../components/FormModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { useUserProfile } from '../context/UserProfileContext';
import { fetchGemini } from '../utils/gemini';

interface PrayerLog {
  id?: number;
  date: string;
  fajr: boolean; fajrJamaat: boolean;
  dhuhr: boolean; dhuhrJamaat: boolean;
  asr: boolean; asrJamaat: boolean;
  maghrib: boolean; maghribJamaat: boolean;
  isha: boolean; ishaJamaat: boolean;
  tahajjud: boolean;
  chasht: boolean;
  nafl: boolean;
  isDummy?: boolean;
}

interface LiteratureLog {
  id?: number;
  title: string;
  type: 'Al-Quran' | 'Hadith' | 'Islamic Books';
  current: number;
  total: number;
  isCompleted: boolean;
}

// BD Timezone Utilities
const getBDDate = () => new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }));
const getLocalIso = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};
const getBDIso = () => getLocalIso(getBDDate());

const BD_DISTRICTS: Record<string, [number, number]> = {
  'Dhaka': [23.8103, 90.4125],
  'Bagerhat': [22.6516, 89.7859],
  'Chittagong': [22.3569, 91.7832],
  'Khulna': [22.8456, 89.5403],
  'Sylhet': [24.8949, 91.8687],
  'Rajshahi': [24.3636, 88.6241],
  'Mymensingh': [24.7471, 90.4203],
  'Barisal': [22.7010, 90.3535],
  'Rangpur': [25.7439, 89.2752],
  'Comilla': [23.4607, 91.1809],
  'Faridpur': [23.6071, 89.8429],
  'Cox\'s Bazar': [21.4339, 92.0058]
};

const DEFAULT_ENTRY = (dateIso: string): Omit<PrayerLog, 'id'> => ({
  date: dateIso,
  fajr: false, fajrJamaat: false,
  dhuhr: false, dhuhrJamaat: false,
  asr: false, asrJamaat: false,
  maghrib: false, maghribJamaat: false,
  isha: false, ishaJamaat: false,
  tahajjud: false,
  chasht: false,
  nafl: false,
});

const SACRED_TEXT_FIELDS = [
  { name: 'title', label: 'Title / Surah', type: 'text', required: true, placeholder: 'e.g. Surah Al-Kahf' },
  { name: 'type', label: 'Category', type: 'select', required: true, defaultValue: 'Al-Quran', options: [
    { value: 'Al-Quran', label: 'Al-Quran' },
    { value: 'Hadith', label: 'Hadith' },
    { value: 'Islamic Books', label: 'Islamic Books' },
  ]},
  { name: 'total', label: 'Total Pages / Ayahs', type: 'number', required: true, placeholder: 'e.g. 110' },
] as const;

export function SpiritualModule() {
  const [logs, logActions, logsLoading] = useStore<PrayerLog>(STORES.spiritualPrayers);
  const [literature, litActions, litLoading] = useStore<LiteratureLog>(STORES.spiritualLiterature);
  const { profile } = useUserProfile();

  const [aiInsight, setAiInsight] = useState('');
  const [insightLoading, setInsightLoading] = useState(false);
  
  const [showReadingModal, setShowReadingModal] = useState(false);
  const [selectedDayInfo, setSelectedDayInfo] = useState<PrayerLog | null>(null);
  const [litToDelete, setLitToDelete] = useState<number | null>(null);
  
  const [district, setDistrict] = useState('Dhaka');
  const [isFasting, setIsFasting] = useState(false);
  const [now, setNow] = useState(getBDDate());

  // Ticking Clock
  useEffect(() => {
    const timer = setInterval(() => setNow(getBDDate()), 1000);
    return () => clearInterval(timer);
  }, []);

  const todayIso = useMemo(() => getBDIso(), [now]);

  const todayEntry = useMemo(
    () => logs.find((p) => p.date === todayIso),
    [logs, todayIso]
  );

  useEffect(() => {
    if (!logsLoading && logs.length >= 0 && !todayEntry) {
      logActions.add(DEFAULT_ENTRY(todayIso));
    }
  }, [logsLoading, todayEntry, logs.length, logActions, todayIso]);

  const handleCloseReadingModal = useCallback(() => setShowReadingModal(false), []);
  
  const handleSubmitReadingModal = useCallback((data: any) => {
    litActions.add({
      title: data.title as string,
      type: data.type as 'Al-Quran' | 'Hadith' | 'Islamic Books',
      current: 0,
      total: Number(data.total),
      isCompleted: false,
    });
    setShowReadingModal(false);
  }, [litActions]);

  const togglePrayer = (prayerName: keyof Omit<PrayerLog, 'id' | 'date'>) => {
    if (todayEntry && todayEntry.id) {
      logActions.update(todayEntry.id, { [prayerName]: !todayEntry[prayerName] });
    }
  };

  // Prayer Engine
  const prayerData = useMemo(() => {
    const coords = new Coordinates(BD_DISTRICTS[district][0], BD_DISTRICTS[district][1]);
    const params = CalculationMethod.Karachi();
    params.madhab = Madhab.Hanafi;
    const pt = new PrayerTimes(coords, now, params);
    const tomorrowPt = new PrayerTimes(coords, new Date(now.getTime() + 86400000), params);

    const format = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Dhaka' });

    // Calculate Active Waqt
    const currentMs = now.getTime();
    let activeWaqt = 'Isha (Previous)';
    let nextPrayerName = 'Fajr';
    let nextPrayerTime = pt.fajr;

    if (currentMs >= pt.fajr.getTime() && currentMs < pt.sunrise.getTime()) {
      activeWaqt = 'Fajr'; nextPrayerName = 'Sunrise'; nextPrayerTime = pt.sunrise;
    } else if (currentMs >= pt.sunrise.getTime() && currentMs < pt.dhuhr.getTime()) {
      activeWaqt = 'Chasht / Ishraq'; nextPrayerName = 'Dhuhr'; nextPrayerTime = pt.dhuhr;
    } else if (currentMs >= pt.dhuhr.getTime() && currentMs < pt.asr.getTime()) {
      activeWaqt = 'Dhuhr'; nextPrayerName = 'Asr'; nextPrayerTime = pt.asr;
    } else if (currentMs >= pt.asr.getTime() && currentMs < pt.maghrib.getTime()) {
      activeWaqt = 'Asr'; nextPrayerName = 'Maghrib'; nextPrayerTime = pt.maghrib;
    } else if (currentMs >= pt.maghrib.getTime() && currentMs < pt.isha.getTime()) {
      activeWaqt = 'Maghrib'; nextPrayerName = 'Isha'; nextPrayerTime = pt.isha;
    } else if (currentMs >= pt.isha.getTime()) {
      activeWaqt = 'Isha / Tahajjud'; 
      nextPrayerName = 'Fajr'; nextPrayerTime = tomorrowPt.fajr;
    }

    const diffMs = nextPrayerTime.getTime() - currentMs;
    const hrs = Math.floor(diffMs / 3600000);
    const mins = Math.floor((diffMs % 3600000) / 60000);
    const secs = Math.floor((diffMs % 60000) / 1000);
    const countdown = `${hrs > 0 ? `${hrs} hr ` : ''}${mins} min ${secs} sec`;

    // Iftar Countdown
    let iftarCountdown = null;
    if (isFasting) {
      if (currentMs < pt.maghrib.getTime()) {
        const iDiff = pt.maghrib.getTime() - currentMs;
        const ih = Math.floor(iDiff / 3600000);
        const im = Math.floor((iDiff % 3600000) / 60000);
        const is = Math.floor((iDiff % 60000) / 1000);
        iftarCountdown = `${ih}h ${im}m ${is}s`;
      } else {
        iftarCountdown = "Iftar Time!";
      }
    }

    return {
      subheSadiq: format(pt.fajr),
      sunrise: format(pt.sunrise),
      fajr: format(pt.fajr),
      fajrEnd: format(pt.sunrise),
      dhuhr: format(pt.dhuhr),
      dhuhrEnd: format(pt.asr),
      asr: format(pt.asr),
      asrEnd: format(pt.maghrib),
      maghrib: format(pt.maghrib),
      maghribEnd: format(pt.isha),
      isha: format(pt.isha),
      ishaEnd: format(tomorrowPt.fajr),
      activeWaqt, nextPrayerName, countdown, iftarCountdown
    };
  }, [district, now, isFasting]);

  // Literature stats
  const totalCompleted = literature.filter(l => l.isCompleted || l.current >= l.total).length;
  const activeLiterature = literature.filter(l => !l.isCompleted && l.current < l.total);
  const activeProgressPct = activeLiterature.length > 0 
    ? activeLiterature.reduce((acc, l) => acc + (l.current / l.total), 0) / activeLiterature.length * 100
    : 0;

  // Dynamic Heatmap Data (Current Month)
  const currentMonthDays = useMemo(() => {
    const today = getBDDate();
    return new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  }, [todayIso]);

  const heatmapData = useMemo(() => {
    const data: { date: string; intensity: number; log: PrayerLog | undefined }[] = [];
    const baseDate = getBDDate();
    
    for (let i = 1; i <= currentMonthDays; i++) {
      const cellDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), i);
      const dateStr = getLocalIso(cellDate);
      
      const entry = logs.find(p => p.date === dateStr);
      let intensity = 0;
      if (entry) {
        const count = [
          entry.fajr, entry.dhuhr, entry.asr, entry.maghrib, entry.isha, 
          entry.tahajjud, entry.chasht, entry.nafl
        ].filter(Boolean).length;
        
        if (count === 8) intensity = 4;
        else if (count >= 5) intensity = 3;
        else if (count >= 3) intensity = 2;
        else if (count > 0) intensity = 1;
      }
      data.push({ date: dateStr, intensity, log: entry });
    }
    return data;
  }, [logs, currentMonthDays, todayIso]);

  if (logsLoading || litLoading) {
    return (
      <div className="max-w-[1400px] w-full mx-auto flex flex-col h-full gap-8 items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const obligatoryPrayers = [
    { key: 'fajr', label: 'Fajr', jamaatKey: 'fajrJamaat', time: prayerData.fajr, endTime: prayerData.fajrEnd },
    { key: 'dhuhr', label: 'Dhuhr', jamaatKey: 'dhuhrJamaat', time: prayerData.dhuhr, endTime: prayerData.dhuhrEnd },
    { key: 'asr', label: 'Asr', jamaatKey: 'asrJamaat', time: prayerData.asr, endTime: prayerData.asrEnd },
    { key: 'maghrib', label: 'Maghrib', jamaatKey: 'maghribJamaat', time: prayerData.maghrib, endTime: prayerData.maghribEnd },
    { key: 'isha', label: 'Isha', jamaatKey: 'ishaJamaat', time: prayerData.isha, endTime: prayerData.ishaEnd },
  ] as const;

  const voluntaryPrayers = [
    { key: 'tahajjud', label: 'Tahajjud' },
    { key: 'chasht', label: 'Chasht' },
    { key: 'nafl', label: 'Nafl' },
  ] as const;

  const obCount = obligatoryPrayers.filter(p => todayEntry?.[p.key as keyof PrayerLog]).length;
  const obPct = (obCount / 5) * 100;
  
  const volCount = voluntaryPrayers.filter(p => todayEntry?.[p.key as keyof PrayerLog]).length;
  const volPct = (volCount / 3) * 100;

  const getSpiritualGuidance = async () => {
    const apiKey = getLocalApiKey();
    if (!apiKey) {
      setAiInsight('Please add your API Key in Settings to enable the Spiritual Guide.');
      return;
    }
    setInsightLoading(true);
    try {
      const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'tahajjud', 'chasht', 'nafl'];
      const completedPrayers = prayers.filter(p => (todayEntry as any)?.[p]);
      const prayerContext = completedPrayers.length > 0 ? completedPrayers.join(', ') : 'None yet';

      const systemPrompt = `You are a compassionate Islamic spiritual guide. Fasting Mode is ${isFasting ? 'ON' : 'OFF'} today. If Fasting mode is ON, advise on spiritual etiquette for fasting today. Provide a beautiful, highly relevant daily motivation. Share one specific Hadith or a short Quranic Ayah and explain its meaning briefly in the context of self-discipline. Review their prayer logs for today (${prayerContext}) and offer comforting, inspiring words to keep them steadfast.`;
      
      const insight = await fetchGemini(systemPrompt, apiKey);
      setAiInsight(insight);
    } catch (err: any) {
      setAiInsight(`Error: ${err.message}`);
    } finally {
      setInsightLoading(false);
    }
  };


  return (
    <>
      <div 
        className="fixed inset-0 bg-cover bg-center mix-blend-overlay opacity-30 pointer-events-none z-[-2]"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?q=80&w=2560&auto=format&fit=crop')" }}
      ></div>
      <div className="fixed inset-0 bg-black/70 pointer-events-none z-[-1]"></div>

      <div className="max-w-[1400px] w-full mx-auto flex flex-col h-full gap-8 relative z-0 pb-20 overflow-x-hidden">
      
      <div className="absolute top-0 left-10 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[150px] pointer-events-none -z-10 mix-blend-screen"></div>
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-tertiary/20 rounded-full blur-[150px] pointer-events-none -z-10 mix-blend-screen"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-secondary/10 rounded-full blur-[150px] pointer-events-none -z-10 mix-blend-screen"></div>

      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-2">
        <div>
          <h2 className="text-[64px] font-bold text-on-surface mb-2 tracking-tight leading-none">Spiritual Sanctuary</h2>
          <p className="text-[18px] text-on-surface-variant">Cultivate inner peace and track your daily devotionals.</p>
        </div>
        
        <div className="glass-card px-8 py-4 rounded-2xl flex items-center gap-6 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.4)] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="flex flex-col items-end relative z-10">
            <span className="text-[12px] font-bold text-primary uppercase tracking-widest mb-1">{now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'Asia/Dhaka' })}</span>
            <span className="text-[32px] font-mono font-bold text-on-surface leading-none tracking-tighter">
              {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Dhaka' })}
            </span>
          </div>
        </div>
      </header>

      {/* AI Spiritual Guide Card */}
      <div className="bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 rounded-[32px] p-6 glass-card relative overflow-hidden group z-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-primary/20 transition-colors duration-700"></div>
        <div className="flex gap-4 items-start relative z-10 flex-col md:flex-row">
          <div className="w-12 h-12 rounded-2xl bg-primary/20 flex flex-shrink-0 items-center justify-center text-primary border border-primary/30 shadow-[0_0_15px_rgba(255,180,166,0.3)]">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="flex-1 w-full">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-bold text-on-surface">AI Spiritual Guide</h3>
              <button 
                onClick={getSpiritualGuidance}
                disabled={insightLoading}
                className="bg-primary/20 text-primary px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider hover:bg-primary/30 transition-colors border border-primary/30 disabled:opacity-50 whitespace-nowrap"
              >
                {insightLoading ? 'Seeking...' : 'Seek Guidance'}
              </button>
            </div>
            {insightLoading ? (
              <div className="flex items-center gap-2 text-on-surface-variant text-sm mt-2">
                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                <span>Seeking wisdom and compiling daily guidance...</span>
              </div>
            ) : aiInsight ? (
              <p className="text-on-surface-variant text-sm leading-relaxed mt-2 whitespace-pre-wrap">{aiInsight}</p>
            ) : (
              <p className="text-on-surface-variant/60 text-sm mt-2">Seek profound spiritual guidance, daily motivation, and reflections on your devotional progress.</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 flex-1">
        <div className="xl:col-span-8 flex flex-col gap-8">
          
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Active Waqt & District */}
            <div className="glass-card rounded-[32px] p-8 flex flex-col justify-between shadow-xl border border-white/10 relative overflow-hidden group">
              <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors duration-500 pointer-events-none"></div>
              
              <div className="flex justify-between items-start mb-8 relative z-10">
                <div className="flex items-center gap-3">
                  <Clock className="w-6 h-6 text-primary" />
                  <h3 className="text-[20px] font-bold text-on-surface">Active Waqt</h3>
                </div>
                <div className="flex items-center gap-2 bg-surface-container/50 px-3 py-1.5 rounded-lg border border-white/5">
                  <MapPin className="w-4 h-4 text-on-surface-variant" />
                  <select 
                    value={district} 
                    onChange={e => setDistrict(e.target.value)}
                    className="bg-transparent text-[12px] font-bold uppercase tracking-widest text-on-surface outline-none cursor-pointer"
                  >
                    {Object.keys(BD_DISTRICTS).map(d => <option key={d} value={d} className="bg-surface text-on-surface">{d}</option>)}
                  </select>
                </div>
              </div>

              <div className="relative z-10 text-center py-6">
                <span className="text-[14px] font-bold uppercase tracking-widest text-on-surface-variant mb-2 block">Currently</span>
                <h2 className="text-[48px] font-bold text-primary tracking-tight leading-none mb-4">{prayerData.activeWaqt}</h2>
                <div className="inline-block px-6 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary font-mono text-[16px] font-bold shadow-[0_0_15px_rgba(255,180,166,0.3)]">
                  {prayerData.countdown} left until {prayerData.nextPrayerName}
                </div>
              </div>
            </div>

            {/* Fasting Widget */}
            <div className="glass-card rounded-[32px] p-8 flex flex-col justify-between shadow-xl border border-white/10 relative overflow-hidden group">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-tertiary/10 rounded-full blur-[60px] pointer-events-none transition-all group-hover:scale-110"></div>
              
              <div className="flex justify-between items-start mb-8 relative z-10">
                <div className="flex items-center gap-3">
                  <Moon className="w-6 h-6 text-tertiary" />
                  <h3 className="text-[20px] font-bold text-on-surface">Fasting Mode</h3>
                </div>
                <button 
                  onClick={() => setIsFasting(!isFasting)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${isFasting ? 'bg-tertiary' : 'bg-surface-container-highest'}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${isFasting ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="relative z-10 text-center py-6 flex-1 flex flex-col justify-center">
                {isFasting ? (
                  <>
                    <span className="text-[14px] font-bold uppercase tracking-widest text-on-surface-variant mb-2 block">Time until Iftar (Maghrib)</span>
                    <h2 className="text-[48px] font-mono font-bold text-tertiary tracking-tighter leading-none shadow-tertiary/50 drop-shadow-[0_0_10px_rgba(137,206,255,0.8)]">
                      {prayerData.iftarCountdown}
                    </h2>
                  </>
                ) : (
                  <div className="text-on-surface-variant text-[16px] flex flex-col items-center gap-4">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                      <UtensilsCrossed className="w-12 h-12 opacity-20" />
                    </div>
                    Toggle Fasting Mode to track Iftar countdown.
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Obligatory Prayers */}
            <div className="glass-card rounded-[32px] p-6 flex flex-col relative overflow-hidden shadow-lg border border-white/10">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-full bg-primary-container/20 flex items-center justify-center text-primary-container border border-primary-container/30">
                  <Sun className="w-6 h-6" />
                </div>
                <span className="text-[12px] font-semibold px-3 py-1 bg-surface-container-high rounded-full text-on-surface-variant border border-white/5 uppercase tracking-widest">Fardh</span>
              </div>
              <h4 className="text-[24px] font-medium text-on-surface">Obligatory</h4>
              <p className="text-[16px] text-on-surface-variant mt-1 mb-6">The five daily prayers</p>
              
              <div className="flex flex-col gap-3 flex-1">
                {obligatoryPrayers.map(prayer => {
                  const isDone = todayEntry?.[prayer.key as keyof PrayerLog];
                  const isJamaat = todayEntry?.[prayer.jamaatKey as keyof PrayerLog];
                  
                  return (
                    <div 
                      key={prayer.key}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        isDone 
                          ? 'bg-primary/10 border-primary/30' 
                          : 'bg-surface-container/50 border-white/5 hover:bg-surface-container hover:border-white/10'
                      }`}
                    >
                      <button 
                        onClick={() => togglePrayer(prayer.key as any)}
                        className="flex items-center gap-3 flex-1 text-left"
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                        ) : (
                          <Circle className="w-5 h-5 text-on-surface-variant shrink-0" />
                        )}
                        <div className="flex flex-col">
                           <span className={`text-[16px] font-medium leading-tight ${isDone ? 'text-primary' : 'text-on-surface'}`}>
                             {prayer.label}
                           </span>
                           <span className="text-[11px] font-bold text-on-surface-variant tracking-widest">{prayer.time} - {prayer.endTime}</span>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => togglePrayer(prayer.jamaatKey as any)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-widest transition-all ${
                          isJamaat ? 'bg-primary border-primary text-on-primary shadow-[0_0_10px_rgba(255,180,166,0.4)]' : 'bg-surface border-white/10 text-on-surface-variant hover:text-on-surface hover:border-white/20'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        Jamaat
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8">
                <div className="flex justify-between text-[12px] font-semibold mb-2 text-on-surface uppercase tracking-widest">
                  <span>Today</span>
                  <span>{obCount}/5</span>
                </div>
                <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full shadow-[0_0_10px_rgba(255,180,166,0.4)] transition-all duration-500" style={{width: `${obPct}%`}}></div>
                </div>
              </div>
            </div>

            {/* Voluntary Prayers */}
            <div className="glass-card rounded-[32px] p-6 flex flex-col relative overflow-hidden shadow-lg border border-white/10">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-full bg-tertiary-container/20 flex items-center justify-center text-tertiary-container border border-tertiary-container/30">
                  <Heart className="w-6 h-6" />
                </div>
                <span className="text-[12px] font-semibold px-3 py-1 bg-surface-container-high rounded-full text-on-surface-variant border border-white/5 uppercase tracking-widest">Sunnah / Nafl</span>
              </div>
              <h4 className="text-[24px] font-medium text-on-surface">Voluntary</h4>
              <p className="text-[16px] text-on-surface-variant mt-1 mb-6">Additional devotionals</p>
              
              <div className="flex flex-col gap-3 flex-1">
                {voluntaryPrayers.map(prayer => (
                  <button 
                    key={prayer.key}
                    onClick={() => togglePrayer(prayer.key as any)}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                      todayEntry?.[prayer.key as keyof PrayerLog] 
                        ? 'bg-tertiary/10 border-tertiary/30' 
                        : 'bg-surface-container/50 border-white/5 hover:bg-surface-container hover:border-white/10'
                    }`}
                  >
                    <span className={`text-[16px] font-medium ${todayEntry?.[prayer.key as keyof PrayerLog] ? 'text-tertiary' : 'text-on-surface'}`}>
                      {prayer.label}
                    </span>
                    {todayEntry?.[prayer.key as keyof PrayerLog] ? (
                      <CheckCircle2 className="w-5 h-5 text-tertiary" />
                    ) : (
                      <Circle className="w-5 h-5 text-on-surface-variant" />
                    )}
                  </button>
                ))}
              </div>

              <div className="mt-8">
                <div className="flex justify-between text-[12px] font-semibold mb-2 text-on-surface uppercase tracking-widest">
                  <span>Today</span>
                  <span>{volCount}/3</span>
                </div>
                <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full bg-tertiary rounded-full shadow-[0_0_10px_rgba(137,206,255,0.4)] transition-all duration-500" style={{width: `${volPct}%`}}></div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="xl:col-span-4 flex flex-col gap-8">
          <section className="glass-card rounded-[32px] p-8 shadow-lg border border-white/10 relative overflow-hidden group">
            <div className="absolute inset-0 bg-[url('/spiritual_bg.png')] bg-cover bg-center mix-blend-overlay opacity-30 pointer-events-none z-0"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-secondary/5 to-transparent opacity-50 pointer-events-none z-0"></div>
            <div className="relative z-10 flex justify-between items-start mb-8">
              <h3 className="text-[24px] font-medium text-on-surface flex items-center gap-3 leading-tight">
                <BookOpen className="text-secondary w-6 h-6 shrink-0" />
                Sacred Texts & Library
              </h3>
              <button 
                onClick={() => setShowReadingModal(true)}
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-secondary/20 hover:text-secondary hover:border-secondary/30 transition-all shrink-0"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-4 relative z-10">
              {literature.length === 0 ? (
                <p className="text-on-surface-variant text-sm italic">No active sacred texts.</p>
              ) : (
                literature.map(lit => {
                  if (!lit.title) return null;
                  
                  const pct = Math.min(100, (lit.current / lit.total) * 100);
                  const isDone = pct === 100 || lit.isCompleted;
                  return (
                    <div key={lit.id} className="group glass-card p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors relative">
                      <button 
                        onClick={() => lit.id && setLitToDelete(lit.id)}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-surface-container-highest border border-white/10 flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error/20 hover:border-error/30 opacity-0 group-hover:opacity-100 transition-all shadow-md z-10"
                        title="Delete Text"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <h5 className={`text-[16px] font-semibold ${isDone ? 'text-on-surface-variant' : 'text-on-surface'} mb-0.5`}>{lit.title}</h5>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${
                            lit.type === 'Al-Quran' ? 'bg-primary/20 text-primary border border-primary/20' : 
                            lit.type === 'Hadith' ? 'bg-tertiary/20 text-tertiary border border-tertiary/20' : 
                            'bg-secondary/20 text-secondary border border-secondary/20'
                          }`}>
                            {lit.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => lit.id && lit.current > 0 && litActions.update(lit.id, { current: lit.current - 1 })}
                            className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity text-on-surface-variant"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="text-[14px] font-bold text-secondary font-mono w-12 text-center">
                            {lit.current}/{lit.total}
                          </span>
                          <button 
                            onClick={() => lit.id && lit.current < lit.total && litActions.update(lit.id, { current: lit.current + 1, isCompleted: lit.current + 1 === lit.total })}
                            className="w-7 h-7 rounded-lg bg-secondary/20 border border-secondary/30 text-secondary flex items-center justify-center hover:bg-secondary/30 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden relative">
                        <div className={`absolute inset-y-0 left-0 ${isDone ? 'bg-on-surface-variant/50' : 'bg-gradient-to-r from-secondary to-tertiary'} rounded-full`} style={{width: `${pct}%`}}></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <section className="glass-card rounded-2xl p-6 flex flex-col shadow-lg border border-white/10 relative overflow-hidden group">
            <div className="absolute inset-0 bg-secondary/5 group-hover:bg-secondary/10 transition-colors duration-500 pointer-events-none"></div>
            <h3 className="text-[16px] text-on-surface-variant mb-4 font-medium relative z-10">Library Summary</h3>
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                  <BookMarked className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-on-surface">Completed Texts</span>
              </div>
              <span className="text-[24px] font-bold text-secondary">{totalCompleted}</span>
            </div>
            
            <div className="flex justify-between items-end mb-2 relative z-10">
              <span className="text-sm font-medium text-on-surface">Active Progress</span>
              <span className="text-[18px] font-bold text-on-surface">{Math.round(activeProgressPct)}%</span>
            </div>
            <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden relative z-10">
               <div className="h-full bg-gradient-to-r from-secondary to-primary rounded-full shadow-[0_0_10px_rgba(192,193,255,0.4)]" style={{width: `${activeProgressPct}%`}}></div>
            </div>
          </section>

          {/* Consistency Heatmap */}
          <section className="glass-card rounded-2xl p-8 relative overflow-hidden shadow-lg border border-white/10 flex-1">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/10 rounded-full blur-[60px] pointer-events-none"></div>
            
            <div className="flex justify-between items-start mb-8 relative z-10">
              <div>
                <h3 className="text-[24px] font-medium text-primary flex items-center gap-2 mb-2">
                  <CalendarDays className="w-6 h-6" />
                  Heatmap
                </h3>
                <span className="text-[12px] font-bold text-primary uppercase tracking-widest">{getBDDate().toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
              </div>
            </div>

            <div className="w-full relative z-10">
              <div className="grid grid-cols-7 gap-2 md:gap-3 mb-3 text-center text-[12px] font-bold text-on-surface-variant uppercase tracking-widest w-full max-w-5xl mx-auto">
                <div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div><div>S</div>
              </div>
              <div className="grid grid-cols-7 gap-2 md:gap-3 relative z-10 max-w-5xl mx-auto">
                {heatmapData.map((day, d) => {
                   let colorClass = 'bg-surface-container-high border-white/5';
                   if (day.intensity === 1) colorClass = 'bg-primary/20 border-primary/20';
                   if (day.intensity === 2) colorClass = 'bg-primary/50 border-primary/40';
                   if (day.intensity === 3) colorClass = 'bg-primary/80 border-primary/60';
                   if (day.intensity === 4) colorClass = 'bg-primary border-primary/50 shadow-[0_0_8px_rgba(255,180,166,0.4)]';
                   
                   return (
                     <div 
                       key={d} 
                       onClick={() => setSelectedDayInfo(day.log || { ...DEFAULT_ENTRY(day.date), isDummy: true })}
                       className={`w-full aspect-square rounded-[4px] sm:rounded-md border ${colorClass} hover:scale-110 hover:z-10 transition-all cursor-pointer shadow-sm flex items-center justify-center`}
                       title={new Date(day.date).toLocaleDateString()}
                     >
                       <span className={`text-[12px] md:text-[14px] font-bold ${day.intensity >= 3 ? 'text-on-primary' : day.intensity === 2 ? 'text-white' : 'text-on-surface-variant'}`}>
                         {day.date.split('-')[2].replace(/^0/, '')}
                       </span>
                     </div>
                   )
                })}
              </div>
            </div>
            
            <div className="flex justify-between items-center text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-4 pt-4 border-t border-white/5 relative z-10">
              <span>Less</span>
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-surface-container-high border border-white/5"></span>
                <span className="w-3 h-3 rounded-sm bg-primary/20 border border-primary/20"></span>
                <span className="w-3 h-3 rounded-sm bg-primary/50 border border-primary/40"></span>
                <span className="w-3 h-3 rounded-sm bg-primary/80 border border-primary/60"></span>
                <span className="w-3 h-3 rounded-sm bg-primary border border-primary/50 shadow-[0_0_8px_rgba(255,180,166,0.6)]"></span>
              </div>
              <span>More</span>
            </div>
          </section>

        </div>
      </div>

      {/* Heatmap Popover */}
      <AnimatePresence>
        {selectedDayInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedDayInfo(null)}
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
                    {new Date(selectedDayInfo.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </h3>
                  <p className="text-[14px] text-on-surface-variant">Daily Devotional Summary</p>
                </div>
                <button onClick={() => setSelectedDayInfo(null)} className="text-on-surface-variant hover:text-on-surface bg-white/5 w-8 h-8 rounded-full flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {selectedDayInfo.isDummy ? (
                <div className="text-center py-8 relative z-10">
                  <CalendarX className="w-12 h-12 text-on-surface-variant opacity-20 mb-4 mx-auto" />
                  <p className="text-on-surface-variant italic font-medium">No activity logged for this date.</p>
                </div>
              ) : (
                <div className="space-y-4 relative z-10">
                  <div className="grid grid-cols-2 gap-4">
                  {obligatoryPrayers.map(p => {
                    const done = selectedDayInfo[p.key as keyof PrayerLog];
                    const jamaat = selectedDayInfo[p.jamaatKey as keyof PrayerLog];
                    return (
                      <div key={p.key} className={`p-3 rounded-xl border ${done ? 'bg-primary/10 border-primary/30' : 'bg-surface-container/50 border-white/5'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          {done ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <Circle className="w-4 h-4 text-on-surface-variant" />}
                          <span className={`text-[14px] font-medium ${done ? 'text-primary' : 'text-on-surface-variant'}`}>{p.label}</span>
                        </div>
                        {done && jamaat && (
                          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-secondary mt-2">
                            <Users className="w-3 h-3" /> Jamaat
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                
                <div className="border-t border-white/10 pt-4 mt-4 grid grid-cols-3 gap-2">
                  {voluntaryPrayers.map(p => {
                    const done = selectedDayInfo[p.key as keyof PrayerLog];
                    return (
                      <div key={p.key} className={`p-2 flex flex-col items-center justify-center rounded-lg border ${done ? 'bg-tertiary/10 border-tertiary/30 text-tertiary' : 'bg-surface-container/50 border-white/5 text-on-surface-variant'}`}>
                        <span className="text-[11px] font-bold uppercase tracking-widest mb-1">{p.label}</span>
                        {done ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                      </div>
                    )
                  })}
                </div>
              </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <FormModal
        isOpen={showReadingModal}
        onClose={handleCloseReadingModal}
        onSubmit={handleSubmitReadingModal}
        title="Add Sacred Text"
        submitLabel="Add"
        fields={SACRED_TEXT_FIELDS as any}
      />

      <ConfirmModal
        isOpen={litToDelete !== null}
        onClose={() => setLitToDelete(null)}
        onConfirm={() => {
          if (litToDelete !== null) {
            litActions.remove(litToDelete);
            setLitToDelete(null);
          }
        }}
        title="Delete Sacred Text"
        message="Are you sure you want to remove this sacred text from your reading list?"
      />
    </div>
    </>
  );
}
