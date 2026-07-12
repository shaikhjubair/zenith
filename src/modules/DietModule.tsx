import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FormModal } from '../components/FormModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { useStore } from '../useStore';
import { STORES } from '../db';
import { Plus, Minus, X, Info, Droplet, Activity, Sparkles } from 'lucide-react';
import { useUserProfile } from '../context/UserProfileContext';

const fetchGemini = async (prompt: string, key: string) => {
  // 1. Fetch available models
  const modelsUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
  const modelsRes = await fetch(modelsUrl);
  if (!modelsRes.ok) throw new Error("Failed to fetch available models.");
  const modelsData = await modelsRes.json();
  
  // 2. Find a working model
  const validModels = modelsData.models.filter((m: any) => 
    m.supportedGenerationMethods?.includes("generateContent") && m.name.includes("gemini")
  );
  if (validModels.length === 0) throw new Error("No compatible Gemini models found.");
  
  const selectedModel = validModels.find((m: any) => m.name.includes("1.5-flash"))?.name || validModels[0].name;

  // 3. Request generation
  const url = `https://generativelanguage.googleapis.com/v1beta/${selectedModel}:generateContent?key=${key}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] })
  });

  if (!response.ok) {
    if (response.status === 503) throw new Error("503");
    throw new Error(await response.text());
  }
  const data = await response.json();
  if (data.error) throw new Error("error");
  return data.candidates[0].content.parts[0].text;
};

interface DietEntry {
  id?: number;
  date: string;
  calories: number;
  hydration: number;
  hydrationGoal: number;
  isFasting: boolean;
  isMonThuFast?: boolean;
  cheatMeals: number;
  cheatBudget: number;
}

interface DietMeal {
  id?: number;
  date: string;
  mealType: string;
  food: string;
  calories: number;
}

function getDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

function getCurrentWeekDates(today: Date): Date[] {
  const dayOfWeek = today.getDay();
  const offsetFromSat = (dayOfWeek + 1) % 7;
  const saturday = new Date(today);
  saturday.setDate(today.getDate() - offsetFromSat);
  saturday.setHours(0, 0, 0, 0);

  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(saturday);
    d.setDate(saturday.getDate() + i);
    dates.push(d);
  }
  return dates;
}

const DAY_LABELS = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export function DietModule() {
  const [entries, actions, loading] = useStore<DietEntry>(STORES.dietEntries);
  const [meals, mealActions, mealsLoading] = useStore<DietMeal>(STORES.dietMeals);
  const { profile } = useUserProfile();

  const [aiInsight, setAiInsight] = useState('');
  const [insightLoading, setInsightLoading] = useState(false);
  const [suggestedMeals, setSuggestedMeals] = useState<any[]>([]);

  const handleMealPlan = async () => {
    const apiKey = localStorage.getItem('GEMINI_API_KEY');
    if (!apiKey) {
      setAiInsight('Please add your API Key in Settings to enable the AI Dietitian.');
      return;
    }
    setInsightLoading(true);
    setSuggestedMeals([]);
    try {
      const systemPrompt = `You are a strict nutritionist. Budget 3500 BDT. Goal: Muscle gain, fat loss. Based on my routine, reply ONLY with a valid JSON array of today's recommended meals. DO NOT use markdown asterisks (*). DO NOT write any text outside the JSON array. Format exactly like this: [{ "mealType": "Breakfast", "food": "2 Parathas, Dal, 1 Egg", "calories": 450 }]`;
      const insight = await fetchGemini(systemPrompt, apiKey);
      
      if (typeof insight === 'string' && (insight.includes('503') || insight.toLowerCase().includes('"error"'))) {
        setAiInsight("The AI model is currently experiencing high demand. Please try again in a few moments.");
        return;
      }

      const cleanJson = insight.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      
      if (Array.isArray(parsed)) {
        for (const meal of parsed) {
          mealActions.add({
            date: selectedDayDate,
            mealType: meal.mealType,
            food: meal.food,
            calories: Number(meal.calories) || 0
          });
        }
        setAiInsight("Meal plan generated and automatically added to today's tracker!");
      } else {
        setAiInsight("The AI model returned an invalid format. Please try again.");
      }
    } catch (err: any) {
      if (err.message.includes('503') || err.message.toLowerCase().includes('error') || err.message.toLowerCase().includes('fetch')) {
        setAiInsight("The AI model is currently experiencing high demand. Please try again in a few moments.");
      } else {
        setAiInsight("Could not parse plan. The AI model output was invalid. Please try again.");
      }
    } finally {
      setInsightLoading(false);
    }
  };

  const handleEndOfDayReview = async () => {
    const apiKey = localStorage.getItem('GEMINI_API_KEY');
    if (!apiKey) {
      setAiInsight('Please add your API Key in Settings to enable the AI Dietitian.');
      return;
    }
    if (!selectedEntry) {
      setAiInsight('Select a date on the calendar first to review it.');
      return;
    }
    setInsightLoading(true);
    setSuggestedMeals([]);
    try {
      const mealsContext = meals.map((m: any) => `${m.mealType}: ${m.food} (${m.calories}kcal)`).join(', ');
      const systemPrompt = `Review my logged meals and hydration today based on my 3500 BDT budget and muscle gain goals. Reply in MAXIMUM 2 short sentences. Be harsh and direct. NO markdown asterisks (*). Logged Meals: ${mealsContext || 'None'}. Hydration: ${selectedEntry.hydration}/${selectedEntry.hydrationGoal}ml. Cheat Meals: ${selectedEntry.cheatMeals}/${selectedEntry.cheatBudget}.`;
      const insight = await fetchGemini(systemPrompt, apiKey);
      setAiInsight(insight);
    } catch (err: any) {
      if (err.message.includes('503') || err.message.toLowerCase().includes('error') || err.message.toLowerCase().includes('fetch')) {
        setAiInsight("The AI model is currently experiencing high demand. Please try again in a few moments.");
      } else {
        setAiInsight(`Error: ${err.message}`);
      }
    } finally {
      setInsightLoading(false);
    }
  };
  
  const [showCalorieModal, setShowCalorieModal] = useState(false);
  const [showMealModal, setShowMealModal] = useState(false);
  const [selectedDayDate, setSelectedDayDate] = useState<string>('');
  const [mealToDelete, setMealToDelete] = useState<number | null>(null);

  const today = useMemo(() => new Date(), []);
  const todayStr = getDateStr(today);
  const weekDates = useMemo(() => getCurrentWeekDates(today), [today]);

  // Ensure selected date is set
  useEffect(() => {
    if (!selectedDayDate) setSelectedDayDate(todayStr);
  }, [selectedDayDate, todayStr]);

  const todayEntry = entries.find(e => e.date === todayStr);
  const selectedEntry = entries.find(e => e.date === selectedDayDate);

  // Auto-create today's entry
  useEffect(() => {
    if (!loading && entries.length >= 0 && !entries.find(e => e.date === todayStr)) {
      actions.add({
        date: todayStr,
        calories: 0,
        hydration: 0,
        hydrationGoal: 8,
        isFasting: false,
        isMonThuFast: false,
        cheatMeals: 0,
        cheatBudget: 2,
      });
    }
  }, [loading, todayStr, entries.length, actions]);

  const weekEntryMap = useMemo(() => {
    const map: Record<string, DietEntry> = {};
    for (const entry of entries) { map[entry.date] = entry; }
    return map;
  }, [entries]);

  const mealsForSelectedDay = useMemo(() => {
    return meals.filter(m => m.date === selectedDayDate);
  }, [meals, selectedDayDate]);

  const totalCaloriesForSelectedDay = useMemo(() => {
    return mealsForSelectedDay.reduce((sum, m) => sum + m.calories, 0);
  }, [mealsForSelectedDay]);

  const monthlyStats = useMemo(() => {
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const monthEntries = entries.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    let totalCals = 0;
    let fastDays = 0;
    let totalHydration = 0;
    let daysWithHydration = 0;

    monthEntries.forEach(e => {
      totalCals += e.calories;
      if (e.isFasting || e.isMonThuFast) fastDays++;
      if (e.hydration > 0) {
        totalHydration += e.hydration;
        daysWithHydration++;
      }
    });

    return {
      avgCalories: monthEntries.length ? Math.round(totalCals / monthEntries.length) : 0,
      fastDays,
      avgHydration: daysWithHydration ? (totalHydration / daysWithHydration).toFixed(1) : '0',
    };
  }, [entries, today]);

  const handleHydrationAdd = () => {
    if (!todayEntry || !todayEntry.id) return;
    if (todayEntry.hydration < todayEntry.hydrationGoal) {
      actions.update(todayEntry.id, { hydration: todayEntry.hydration + 1 });
    }
  };

  const handleHydrationRemove = () => {
    if (!todayEntry || !todayEntry.id) return;
    if (todayEntry.hydration > 0) {
      actions.update(todayEntry.id, { hydration: todayEntry.hydration - 1 });
    }
  };

  const handleFastingToggle = () => {
    if (!todayEntry || !todayEntry.id) return;
    actions.update(todayEntry.id, { isFasting: !todayEntry.isFasting });
  };

  const handleMonThuFastToggle = () => {
    if (!todayEntry || !todayEntry.id) return;
    actions.update(todayEntry.id, { isMonThuFast: !todayEntry.isMonThuFast });
  };

  const handleDayCellClick = (dateStr: string) => {
    setSelectedDayDate(dateStr);
  };

  const handleCalorieSubmit = (data: Record<string, string | number>) => {
    const dateStr = selectedDayDate;
    const existingEntry = entries.find(e => e.date === dateStr);
    const calories = Number(data.calories) || 0;

    if (existingEntry && existingEntry.id) {
      actions.update(existingEntry.id, { calories });
    } else {
      actions.add({
        date: dateStr, calories, hydration: 0, hydrationGoal: 8,
        isFasting: false, isMonThuFast: false, cheatMeals: 0, cheatBudget: 2,
      });
    }
  };

  const handleMealSubmit = (data: Record<string, string | number>) => {
    mealActions.add({
      date: selectedDayDate,
      mealType: data.mealType as string,
      food: data.food as string,
      calories: Number(data.calories) || 0,
    });
  };

  if (loading || mealsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  const hydration = todayEntry?.hydration ?? 0;
  const hydrationGoal = todayEntry?.hydrationGoal ?? 8;
  const isFasting = todayEntry?.isFasting ?? false;
  const isMonThuFast = todayEntry?.isMonThuFast ?? false;
  const cheatMeals = todayEntry?.cheatMeals ?? 0;
  const cheatBudget = todayEntry?.cheatBudget ?? 2;
  const hydrationLiters = ((hydration / hydrationGoal) * 3.0).toFixed(1);

  const formatCalories = (cal: number | undefined): string => {
    if (cal === undefined || cal === null) return '--';
    if (cal === 0) return '0';
    if (cal >= 1000) return (cal / 1000).toFixed(1) + 'k';
    return String(cal);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 h-full relative z-0 min-h-[80vh] flex-1 overflow-x-hidden">
      
      {/* Abstract Mesh Background */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none -z-10 mix-blend-screen"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-[120px] pointer-events-none -z-10 mix-blend-screen"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-tertiary/10 rounded-full blur-[150px] pointer-events-none -z-10 mix-blend-screen"></div>
      {/* Smart Fasting Alert */}
      <AnimatePresence>
        {(selectedEntry?.isFasting || selectedEntry?.isMonThuFast) && (
          <motion.div 
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            className="lg:col-span-12"
          >
            <div className="bg-secondary/10 border border-secondary/30 rounded-2xl p-4 flex items-center gap-4 text-secondary backdrop-blur-md shadow-[0_0_20px_rgba(192,193,255,0.15)]">
              <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center shrink-0">
                <Droplet className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <h4 className="text-[14px] font-bold uppercase tracking-widest mb-0.5">Fasting Active</h4>
                <p className="text-[15px] font-medium text-on-surface">You are fasting on this day. Prioritize hydration during Suhoor and Iftar.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Dietitian Card */}
      <div className="lg:col-span-12 bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 rounded-[32px] p-6 glass-card relative overflow-hidden group mb-2 z-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-primary/20 transition-colors duration-700"></div>
        <div className="flex gap-4 items-start relative z-10 flex-col md:flex-row">
          <div className="w-12 h-12 rounded-2xl bg-primary/20 flex flex-shrink-0 items-center justify-center text-primary border border-primary/30 shadow-[0_0_15px_rgba(255,180,166,0.3)]">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="flex-1 w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
              <h3 className="text-xl font-bold text-on-surface">AI Dietitian & Coach</h3>
              <div className="flex gap-3 w-full md:w-auto">
                <button 
                  onClick={handleMealPlan}
                  disabled={insightLoading}
                  className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider hover:bg-primary/20 transition-colors border border-primary/20 disabled:opacity-50 whitespace-nowrap flex-1 md:flex-none"
                >
                  Daily Meal Plan
                </button>
                <button 
                  onClick={handleEndOfDayReview}
                  disabled={insightLoading}
                  className="bg-primary/20 text-primary px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider hover:bg-primary/30 transition-colors border border-primary/30 disabled:opacity-50 whitespace-nowrap flex-1 md:flex-none"
                >
                  End of Day Review
                </button>
              </div>
            </div>
            {insightLoading ? (
              <div className="flex items-center gap-2 text-on-surface-variant text-sm mt-2">
                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                <span>Analyzing biological macros and routines...</span>
              </div>
            ) : aiInsight ? (
              <>
                <p className="text-on-surface-variant text-sm leading-relaxed mt-2 whitespace-pre-wrap">{aiInsight}</p>
                {suggestedMeals.length > 0 && (
                  <div className="mt-4 flex flex-col gap-2">
                    {suggestedMeals.map((m, idx) => (
                      <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-3 flex justify-between items-center group hover:bg-white/10 transition-colors">
                        <div>
                          <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-0.5">{m.mealType}</p>
                          <p className="text-sm font-medium text-on-surface">{m.food}</p>
                          <p className="text-xs text-on-surface-variant">{m.calories} kcal</p>
                        </div>
                        <button 
                          onClick={() => {
                            mealActions.add({ date: selectedDayDate, mealType: m.mealType, food: m.food, calories: m.calories });
                            setSuggestedMeals(prev => prev.filter((_, i) => i !== idx));
                          }}
                          className="bg-primary/20 text-primary px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-primary/40 transition-colors shadow-sm whitespace-nowrap"
                        >
                          + Add
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="text-on-surface-variant/60 text-sm mt-2">Generate a daily meal plan based on your routine, or review your daily log compliance.</p>
            )}
          </div>
        </div>
      </div>

      {/* Cyclical Planner */}
      <div className="lg:col-span-8 lg:row-span-2 bg-surface/60 backdrop-blur-xl border border-white/20 border-t-white/30 border-l-white/30 rounded-[32px] p-8 flex flex-col gap-6 shadow-[0_4px_30px_rgba(0,0,0,0.1)] glass-card relative z-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-medium text-primary">Cyclical Planner</h2>
          <span className="text-[12px] font-semibold text-on-surface-variant uppercase tracking-widest">Sat - Fri</span>
        </div>
        <div className="flex-1 flex gap-2">
          {weekDates.map((date, i) => {
            const dateStr = getDateStr(date);
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDayDate;
            const entry = weekEntryMap[dateStr];
            
            // Calculate meals for this specific day
            const dayMeals = meals.filter(m => m.date === dateStr);
            const mealCals = dayMeals.reduce((sum, m) => sum + m.calories, 0);
            
            // Prefer manually logged calories if > 0, otherwise sum of meals
            const displayCals = (entry?.calories && entry.calories > 0) ? entry.calories : mealCals;
            const dayIsFasting = entry?.isFasting || entry?.isMonThuFast || false;
            
            return (
              <div
                key={DAY_LABELS[i]}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDayCellClick(dateStr); }}
                className={`flex-1 rounded-xl border flex flex-col items-center py-4 relative overflow-hidden transition-colors cursor-pointer z-20
                  ${isSelected ? 'bg-primary/10 border-primary/60' : 'bg-surface-container/50 border-white/10 hover:border-white/20'}
                  ${isToday ? 'shadow-[0_0_15px_rgba(255,180,166,0.1)]' : ''}`}
              >
                {isToday && <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-primary"></div>}
                <span className={`text-[12px] font-semibold tracking-wider uppercase mb-2 ${isToday ? 'text-primary' : dayIsFasting ? 'text-secondary' : 'text-on-surface-variant'}`}>{DAY_LABELS[i]}</span>
                {dayIsFasting && <span className="text-xs text-secondary mt-1 mb-2">Fast</span>}
                <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center mt-auto ${isSelected ? 'border-primary text-primary font-bold bg-primary/10' : dayIsFasting ? 'border-secondary text-secondary font-bold' : 'border-primary/30 text-on-surface/50'}`}>
                  {formatCalories(displayCals)}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-end">
          <button 
            onClick={() => setShowCalorieModal(true)}
            className="text-[12px] font-bold uppercase tracking-widest text-primary hover:text-primary-container transition-colors"
          >
            Override Daily Calories
          </button>
        </div>
      </div>

      {/* Hydration */}
      <div className="lg:col-span-4 bg-surface/60 backdrop-blur-xl border border-white/20 border-t-white/30 border-l-white/30 rounded-[32px] p-6 flex flex-col justify-between glass-card transition-transform hover:-translate-y-1">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-[16px] text-on-surface-variant mb-1 font-medium">Hydration</h3>
            <div className="text-[32px] font-bold text-tertiary tracking-tight">{hydrationLiters}L</div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleHydrationRemove} className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-on-surface hover:bg-white/10 transition-colors">
              <Minus className="w-4 h-4" />
            </button>
            <button onClick={handleHydrationAdd} className="w-8 h-8 rounded-full bg-tertiary/20 border border-tertiary/30 flex items-center justify-center text-tertiary hover:bg-tertiary/30 transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap mt-4">
          {Array.from({ length: hydrationGoal }, (_, i) => i + 1).map((i) => (
             <div
               key={i}
               className={`w-8 h-10 rounded transition-colors ${i <= hydration ? 'bg-tertiary/20 border-tertiary/50' : 'bg-surface-container border-white/10'} border`}
             ></div>
          ))}
        </div>
      </div>

      {/* Fasting / Roza Mode (Global) */}
      <div className="lg:col-span-4 bg-surface/60 backdrop-blur-xl border border-white/20 border-t-white/30 border-l-white/30 rounded-[32px] p-6 flex items-center justify-between glass-card transition-transform hover:-translate-y-1">
        <div>
          <h3 className="text-[16px] text-on-surface-variant mb-1 font-medium flex items-center gap-2">
            Global Fasting / Roza
            <Info className="w-4 h-4 text-tertiary opacity-50" />
          </h3>
          <p className="text-[12px] font-semibold text-tertiary uppercase tracking-widest">
            {profile.isFasting ? 'Active Mode' : 'Standard Mode'}
          </p>
        </div>
        <div
          onClick={() => updateProfile({ isFasting: !profile.isFasting })}
          className={`w-14 h-8 rounded-full p-1 flex items-center cursor-pointer transition-colors ${profile.isFasting ? 'bg-tertiary/40 shadow-[0_0_15px_rgba(255,200,100,0.2)] border border-tertiary/50' : 'bg-surface-container'}`}
        >
          <div className={`w-6 h-6 rounded-full transition-transform shadow-sm ${profile.isFasting ? 'bg-tertiary translate-x-6' : 'bg-on-surface-variant/50 translate-x-0'}`}></div>
        </div>
      </div>

      {/* Intermittent Fasting */}
      <div className="lg:col-span-4 bg-surface/60 backdrop-blur-xl border border-white/20 border-t-white/30 border-l-white/30 rounded-[32px] p-6 flex items-center justify-between glass-card transition-transform hover:-translate-y-1">
        <div>
          <h3 className="text-[16px] text-on-surface-variant mb-1 font-medium">Daily Fast (Local)</h3>
          <p className="text-[12px] font-semibold text-primary uppercase tracking-widest">
            {isFasting ? 'Active' : 'Inactive'}
          </p>
        </div>
        <div
          onClick={handleFastingToggle}
          className={`w-14 h-8 rounded-full p-1 flex items-center cursor-pointer transition-colors ${isFasting ? 'bg-primary-container shadow-[0_0_15px_rgba(255,126,103,0.3)]' : 'bg-surface-container'}`}
        >
          <div className={`w-6 h-6 rounded-full transition-transform shadow-sm ${isFasting ? 'bg-on-primary-container translate-x-6' : 'bg-on-surface-variant/50 translate-x-0'}`}></div>
        </div>
      </div>

      {/* Mon/Thu Sunnah Fasting Toggle */}
      <div className="lg:col-span-4 bg-surface/60 backdrop-blur-xl border border-white/20 border-t-white/30 border-l-white/30 rounded-[32px] p-6 flex items-center justify-between glass-card transition-transform hover:-translate-y-1">
        <div>
          <h3 className="text-[16px] text-on-surface-variant mb-1 font-medium flex items-center gap-2">
            Mon / Thu Sunnah
            <Info className="w-4 h-4 text-secondary opacity-50" />
          </h3>
          <p className="text-[12px] font-semibold text-secondary uppercase tracking-widest">
            {isMonThuFast ? 'Observing' : 'Not Observing'}
          </p>
        </div>
        <div
          onClick={handleMonThuFastToggle}
          className={`w-14 h-8 rounded-full p-1 flex items-center cursor-pointer transition-colors ${isMonThuFast ? 'bg-secondary/40 shadow-[0_0_15px_rgba(192,193,255,0.2)] border border-secondary/50' : 'bg-surface-container'}`}
        >
          <div className={`w-6 h-6 rounded-full transition-transform shadow-sm ${isMonThuFast ? 'bg-secondary translate-x-6' : 'bg-on-surface-variant/50 translate-x-0'}`}></div>
        </div>
      </div>

      {/* Cheat Budget */}
      <div className="lg:col-span-4 bg-surface/60 backdrop-blur-xl border border-white/20 border-t-white/30 border-l-white/30 rounded-[32px] p-6 relative overflow-hidden glass-card">
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-error/10 rounded-full blur-xl"></div>
        <h3 className="text-[16px] text-on-surface-variant mb-4 font-medium relative z-10">Cheat Budget</h3>
        <div className="flex items-end gap-2 relative z-10 w-full mb-4">
           <span className="text-[32px] font-bold text-error leading-none">{cheatMeals}</span>
           <span className="text-[16px] text-on-surface-variant pb-1 font-medium">/ {cheatBudget} Meals</span>
        </div>
        <div className="w-full bg-surface-container-highest h-2 rounded-full mt-4 overflow-hidden relative z-10">
           <div
             className="bg-error h-full rounded-full shadow-[0_0_10px_rgba(255,180,171,0.5)]"
             style={{ width: cheatBudget > 0 ? `${(cheatMeals / cheatBudget) * 100}%` : '0%' }}
           ></div>
        </div>
      </div>

      {/* Monthly Overview */}
      <div className="lg:col-span-4 bg-surface/60 backdrop-blur-xl border border-white/20 border-t-white/30 border-l-white/30 rounded-[32px] p-6 relative overflow-hidden glass-card">
        <h3 className="text-[16px] text-on-surface-variant mb-6 font-medium relative z-10">Monthly Overview</h3>
        <div className="flex flex-col gap-4 relative z-10">
          <div className="flex justify-between items-center">
            <span className="text-sm text-on-surface">Avg Daily Calories</span>
            <span className="text-lg font-bold text-primary">{monthlyStats.avgCalories} kcal</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-on-surface">Total Fasting Days</span>
            <span className="text-lg font-bold text-secondary">{monthlyStats.fastDays} days</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-on-surface">Avg Hydration</span>
            <span className="text-lg font-bold text-tertiary">{monthlyStats.avgHydration} / 8</span>
          </div>
        </div>
      </div>

      {/* Meal Planner UI */}
      <div className="lg:col-span-12 bg-surface/60 backdrop-blur-xl border border-white/20 border-t-white/30 border-l-white/30 rounded-[32px] p-8 flex flex-col gap-6 shadow-[0_4px_30px_rgba(0,0,0,0.1)] glass-card">
        <div className="flex justify-between items-center mb-2 border-b border-white/10 pb-4">
          <div>
            <h2 className="text-2xl font-medium text-on-surface">Meal Planner</h2>
            <p className="text-[14px] text-on-surface-variant mt-1">
              For {new Date(selectedDayDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              <span className="ml-4 px-2 py-1 bg-primary/10 text-primary rounded-md text-[12px] font-bold">Total: {totalCaloriesForSelectedDay} kcal</span>
            </p>
          </div>
          <button 
            onClick={() => setShowMealModal(true)}
            className="bg-primary/20 text-primary px-4 py-2 rounded-lg text-[12px] font-bold uppercase tracking-widest hover:bg-primary/30 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Food
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(mealType => {
            const mealsOfType = mealsForSelectedDay.filter(m => m.mealType === mealType);
            
            return (
              <div key={mealType} className="bg-surface-container/30 rounded-2xl p-4 border border-white/5 h-full">
                <h4 className="text-[12px] font-semibold text-on-surface-variant uppercase tracking-widest mb-4 pb-2 border-b border-white/10">
                  {mealType}
                </h4>
                {mealsOfType.length === 0 ? (
                  <p className="text-[14px] text-on-surface-variant/50 italic text-center py-4">No foods logged</p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    <AnimatePresence>
                      {mealsOfType.map(meal => (
                        <motion.li 
                          layout 
                          initial={{ opacity: 0, y: 5 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          exit={{ opacity: 0, scale: 0.95 }}
                          key={meal.id} 
                          className="group flex justify-between items-start bg-white/5 p-3 rounded-xl border border-white/5 hover:border-white/20 transition-all"
                        >
                          <div>
                            <p className="text-[14px] font-medium text-on-surface leading-tight">{meal.food}</p>
                            <p className="text-[12px] text-primary font-bold mt-1">{meal.calories} kcal</p>
                          </div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setMealToDelete(meal.id!); }}
                            className="text-on-surface-variant hover:text-error opacity-0 group-hover:opacity-100 transition-opacity p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <FormModal
        isOpen={showCalorieModal}
        onClose={() => setShowCalorieModal(false)}
        onSubmit={handleCalorieSubmit}
        title={`Log Calories (${selectedDayDate})`}
        fields={[
          {
            name: 'calories',
            label: 'Total Daily Calories',
            type: 'number',
            required: true,
            placeholder: 'Enter total calories...',
            defaultValue: selectedEntry?.calories ?? 0,
          },
        ]}
      />

      <FormModal
        isOpen={showMealModal}
        onClose={() => setShowMealModal(false)}
        onSubmit={handleMealSubmit}
        title={`Add Food (${selectedDayDate})`}
        fields={[
          {
            name: 'mealType',
            label: 'Meal Type',
            type: 'select',
            required: true,
            options: [
              { value: 'Breakfast', label: 'Breakfast' },
              { value: 'Lunch', label: 'Lunch' },
              { value: 'Dinner', label: 'Dinner' },
              { value: 'Snack', label: 'Snack' },
            ]
          },
          {
            name: 'food',
            label: 'Food Item',
            type: 'text',
            required: true,
            placeholder: 'e.g., Grilled Chicken Salad'
          },
          {
            name: 'calories',
            label: 'Calories',
            type: 'number',
            required: true,
            placeholder: 'e.g., 450'
          }
        ]}
      />

      <ConfirmModal 
        isOpen={mealToDelete !== null}
        onClose={() => setMealToDelete(null)}
        onConfirm={() => mealToDelete !== null && mealActions.remove(mealToDelete)}
        title="Delete Food Item"
        message="Are you sure you want to permanently delete this food item from your meal planner?"
      />

    </motion.div>
  );
}
