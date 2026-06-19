import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { X, Plus, Landmark, TrendingDown, Handshake, ShoppingCart, Briefcase, Zap, Car, UtensilsCrossed, Film, ArrowUp, Receipt, Settings2, Sparkles } from 'lucide-react';
import { FormModal } from '../components/FormModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { useStore } from '../useStore';
import { STORES } from '../db';

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

interface Expense {
  id?: number;
  title: string;
  subtitle: string;
  amount: number;
  date: string;
  icon: string;
  category: string;
  type: 'income' | 'expense' | 'p2p';
  receipt?: string;
}

function TransactionFormModal({ isOpen, onClose, onSubmit }: any) {
  const [formData, setFormData] = useState<any>({ type: 'expense', category: 'Food & Dining', amount: '' });
  const [receipt, setReceipt] = useState<string>('');

  if (!isOpen) return null;

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setReceipt(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setReceipt(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-[20px]" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative bg-surface-container-high/80 backdrop-blur-3xl border border-white/10 rounded-[32px] p-8 w-full max-w-md shadow-2xl flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-on-surface">New Transaction</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 text-on-surface-variant transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          <input type="text" placeholder="Title (Merchant...)" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary/50 transition-colors" />
          <input type="number" placeholder="Amount" value={formData.amount || ''} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary/50 transition-colors" />
          <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary/50 transition-colors">
            <option value="Groceries">Groceries</option>
            <option value="Salary">Salary</option>
            <option value="Bills">Bills</option>
            <option value="Transport">Transport</option>
            <option value="Food & Dining">Food & Dining</option>
            <option value="Entertainment">Entertainment</option>
            <option value="P2P">P2P</option>
          </select>
          <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary/50 transition-colors">
            <option value="expense">Expense</option>
            <option value="income">Income</option>
            <option value="p2p">P2P</option>
          </select>

          {/* Receipt Upload Zone */}
          <div 
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            className="w-full h-32 border-2 border-dashed border-white/20 rounded-xl flex items-center justify-center flex-col relative overflow-hidden group cursor-pointer hover:border-primary/50 transition-colors"
          >
            <input type="file" accept="image/*" onChange={handleFileSelect} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
            {receipt ? (
              <img src={receipt} alt="Receipt" className="w-full h-full object-cover" />
            ) : (
              <>
                <Receipt className="w-6 h-6 text-on-surface-variant mb-2 group-hover:text-primary transition-colors" />
                <span className="text-sm text-on-surface-variant font-medium">Drag receipt or click</span>
              </>
            )}
          </div>
        </div>
        <button 
          onClick={() => {
            if (!formData.title || !formData.amount) return;
            onSubmit({ ...formData, receipt });
            setFormData({ type: 'expense', category: 'Food & Dining', amount: '' });
            setReceipt('');
            onClose();
          }} 
          className="w-full py-4 rounded-xl bg-primary text-on-primary font-bold hover:bg-primary/90 transition-colors"
        >
          Add Transaction
        </button>
      </motion.div>
    </div>
  );
}

function SpendingChartModal({ isOpen, onClose, expenses }: any) {
  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    let max = 0;
    expenses.forEach((e: any) => {
      if (e.type === 'expense') {
        totals[e.category] = (totals[e.category] || 0) + Math.abs(e.amount);
        if (totals[e.category] > max) max = totals[e.category];
      }
    });
    return { totals, max };
  }, [expenses]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-[20px]" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative bg-surface-container-high/80 backdrop-blur-3xl border border-white/10 rounded-[40px] p-10 w-full max-w-2xl shadow-2xl flex flex-col gap-8">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-bold text-on-surface">Spending by Category</h3>
            <p className="text-on-surface-variant text-sm">Your recent expense distribution</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 text-on-surface-variant transition-colors"><X className="w-5 h-5" /></button>
        </div>
        
        <div className="flex flex-col gap-4">
          {Object.entries(categoryTotals.totals).sort((a:any,b:any)=>b[1]-a[1]).map(([cat, total]: any) => (
            <div key={cat} className="flex flex-col gap-2">
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-on-surface">{cat}</span>
                <span className="text-on-surface-variant">৳{total.toLocaleString()}</span>
              </div>
              <div className="w-full h-3 bg-black/30 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(total / categoryTotals.max) * 100}%` }}
                  transition={{ duration: 1, delay: 0.2, type: 'spring' }}
                  className={`h-full rounded-full ${CATEGORY_COLOR_MAP[cat]?.bar || 'bg-primary'}`}
                />
              </div>
            </div>
          ))}
          {Object.keys(categoryTotals.totals).length === 0 && (
            <p className="text-on-surface-variant text-center py-8">No expenses found.</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

const TYPE_COLOR_MAP: Record<string, { color: string; bg: string }> = {
  income:  { color: 'text-[#00e676]', bg: 'bg-[#00e676]' },
  expense: { color: 'text-[#ff5252]', bg: 'bg-[#ff5252]' },
  p2p:     { color: 'text-[#651fff]', bg: 'bg-[#651fff]' },
};

const CATEGORY_ICON_MAP: Record<string, string> = {
  Groceries: 'shopping_cart',
  Salary: 'work',
  Bills: 'bolt',
  Transport: 'directions_car',
  'Food & Dining': 'restaurant',
  Entertainment: 'movie',
  P2P: 'arrow_upward',
};

const CATEGORY_COLOR_MAP: Record<string, { dot: string; bar: string; shadow: string }> = {
  Groceries:       { dot: 'bg-[#ff5252]', bar: 'bg-[#ff5252]', shadow: 'shadow-[0_0_10px_rgba(255,82,82,0.5)]' },
  'Food & Dining': { dot: 'bg-[#ffab00]', bar: 'bg-[#ffab00]', shadow: 'shadow-[0_0_10px_rgba(255,171,0,0.5)]' },
  Transport:       { dot: 'bg-[#00e5ff]', bar: 'bg-[#00e5ff]', shadow: 'shadow-[0_0_10px_rgba(0,229,255,0.5)]' },
  Bills:           { dot: 'bg-[#ff9800]', bar: 'bg-[#ff9800]', shadow: 'shadow-[0_0_10px_rgba(255,152,0,0.5)]' },
  Entertainment:   { dot: 'bg-[#e040fb]', bar: 'bg-[#e040fb]', shadow: 'shadow-[0_0_10px_rgba(224,64,251,0.5)]' },
  Salary:          { dot: 'bg-[#00e676]', bar: 'bg-[#00e676]', shadow: 'shadow-[0_0_10px_rgba(0,230,118,0.5)]' },
  P2P:             { dot: 'bg-[#651fff]', bar: 'bg-[#651fff]', shadow: 'shadow-[0_0_10px_rgba(101,31,255,0.5)]' },
};

function formatCurrency(value: number): { dollars: string; cents: string } {
  const abs = Math.abs(value);
  const parts = abs.toFixed(2).split('.');
  const dollars = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return { dollars, cents: parts[1] };
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) {
    return `Today, ${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

const getCategoryIcon = (iconName: string) => {
  switch (iconName) {
    case 'shopping_cart': return <ShoppingCart className="w-5 h-5" />;
    case 'work': return <Briefcase className="w-5 h-5" />;
    case 'bolt': return <Zap className="w-5 h-5" />;
    case 'directions_car': return <Car className="w-5 h-5" />;
    case 'restaurant': return <UtensilsCrossed className="w-5 h-5" />;
    case 'movie': return <Film className="w-5 h-5" />;
    case 'arrow_upward': return <ArrowUp className="w-5 h-5" />;
    default: return <Receipt className="w-5 h-5" />;
  }
};

export function ExpenseModule() {
  const [expenses, actions, loading] = useStore<Expense>(STORES.expenses);
  const [showModal, setShowModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showChartModal, setShowChartModal] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [aiInsight, setAiInsight] = useState('');
  const [insightLoading, setInsightLoading] = useState(false);

  // Compute summary values from live data
  const { totalBalance, monthlySpend, lentOut, p2p } = useMemo(() => {
    let total = 0;
    let spend = 0;
    let lent = 0;
    const p2pItems: any[] = [];
    for (const e of expenses) {
      if (e.type === 'income') {
        total += Math.abs(e.amount);
      } else {
        total -= Math.abs(e.amount);
      }
      if (e.type === 'expense' || e.type === 'p2p') {
        spend += Math.abs(e.amount);
      }
      if (e.type === 'p2p') {
        lent += Math.abs(e.amount);
        p2pItems.push(e);
      }
    }
    return { totalBalance: total, monthlySpend: spend, lentOut: lent, p2p: p2pItems };
  }, [expenses]);

  const generateInsight = async () => {
    const apiKey = localStorage.getItem('GEMINI_API_KEY');
    if (!apiKey) {
      setAiInsight('Please add your API Key in Settings to enable the AI Financial Advisor.');
      return;
    }
    setInsightLoading(true);
    try {
      const p2pContext = p2p.map((t: any) => `${t.title}: ${t.amount} BDT`).join(', ');
      const systemPrompt = `You are an elite financial advisor. The user's fixed monthly expenses are: Rent 2667, Lift 250, WiFi 200, Maid 650, Dustbin 30, Electricity ~400, Gas ~250, Cycle Garage 250 (Total: 4747 BDT). Calculate their TRUE remaining disposable income from their current balance (${totalBalance} BDT) after deducting these fixed costs. Give them a strict daily spending limit for the rest of the month (assume 30 days total, adjust for days left if you can, otherwise just divide by 30). Explicitly list who owes them money or who they owe based on P2P transactions (${p2pContext || 'None'}). Be concise and highly analytical.`;
      
      const insight = await fetchGemini(systemPrompt, apiKey);
      setAiInsight(insight);
    } catch (err: any) {
      setAiInsight(`Error: ${err.message}`);
    } finally {
      setInsightLoading(false);
    }
  };

  const totalFmt = formatCurrency(totalBalance);
  const spendFmt = formatCurrency(monthlySpend);
  const lentFmt = formatCurrency(lentOut);

  // Compute daily spend for SVG Chart
  const { dailySpend, chartMax, targetThreshold } = useMemo(() => {
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const spendArr = new Array(daysInMonth).fill(0);
    for (const e of expenses) {
      if (e.type !== 'income') {
        const d = new Date(e.date);
        if (d.getMonth() === new Date().getMonth() && d.getFullYear() === new Date().getFullYear()) {
           spendArr[d.getDate() - 1] += Math.abs(e.amount);
        }
      }
    }
    // Cumulative sum
    for(let i=1; i<spendArr.length; i++) {
       spendArr[i] += spendArr[i-1];
    }
    
    // Smooth out future days with last known value to draw a flat line to the end of month? 
    // Or just let it be flat from current day
    const currentDay = new Date().getDate();
    for(let i=currentDay; i<spendArr.length; i++) {
        spendArr[i] = spendArr[currentDay - 1] || 0;
    }

    const target = 50000; // Target monthly budget limit
    const cMax = Math.max(...spendArr, target) * 1.2;
    return { dailySpend: spendArr, chartMax: cMax || 1, targetThreshold: target };
  }, [expenses]);

  if (loading) {
    return (
      <div className="max-w-6xl w-full mx-auto flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <p className="text-on-surface-variant text-sm">Loading expenses...</p>
        </div>
      </div>
    );
  }

  // Sort expenses by date descending for the ledger
  const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
      className="max-w-6xl w-full mx-auto flex flex-col gap-8 h-full relative z-0 min-h-[80vh] flex-1"
    >
        {/* Abstract Mesh Background */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none -z-10 mix-blend-screen"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-tertiary/20 rounded-full blur-[120px] pointer-events-none -z-10 mix-blend-screen"></div>
        <div className="fixed inset-0 bg-[url('https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay opacity-40 pointer-events-none z-[-2]"></div>
        <div className="fixed inset-0 bg-black/60 pointer-events-none z-[-1]"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 relative z-10">
            <div className="max-w-full">
              <h2 className="text-[28px] md:text-[32px] font-bold text-on-surface tracking-tight leading-none mb-1 break-words">Expense Ledger</h2>
              <p className="text-[14px] md:text-[16px] text-on-surface-variant break-words">Manage liquidity and allocations.</p>
            </div>
            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              <button
                onClick={() => setShowChartModal(true)}
                className="bg-white/5 text-on-surface px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-white/10 transition-colors border border-white/10 flex-1 md:flex-none whitespace-nowrap"
              >
                  <TrendingDown className="w-4 h-4 shrink-0" />
                  Visualize Spending
              </button>
              <button
                onClick={() => setShowAdjustModal(true)}
                className="bg-white/5 text-on-surface px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-white/10 transition-colors border border-white/10 flex-1 md:flex-none whitespace-nowrap"
              >
                  <Settings2 className="w-4 h-4 shrink-0" />
                  Adjust Balance
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="bg-primary/10 text-primary px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-primary/20 transition-colors border border-primary/20 flex-1 md:flex-none whitespace-nowrap"
              >
                  <Plus className="w-4 h-4 shrink-0" />
                  New Transaction
              </button>
            </div>
        </div>

        {/* Financial Health Hero Card */}
        <div className="relative rounded-[32px] overflow-hidden mb-2 shadow-[0_30px_60px_rgba(0,0,0,0.4)] border border-white/10 p-8">
          <div className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-60 z-0" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?q=80&w=2574&auto=format&fit=crop')" }}></div>
          <div className="absolute inset-0 bg-surface/70 backdrop-blur-[40px] z-0 pointer-events-none"></div>
          
          <div className="relative z-10 mb-8 flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border border-primary/30 shadow-[0_0_15px_rgba(255,180,166,0.3)]">
               <Landmark className="w-6 h-6" />
             </div>
             <div>
               <h3 className="text-[24px] font-bold text-on-surface">Financial Health</h3>
               <p className="text-[14px] font-semibold text-primary uppercase tracking-widest">At a Glance</p>
             </div>
          </div>

        {/* AI Advisor Card */}
        <div className="bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 rounded-[32px] p-6 glass-card relative overflow-hidden group mb-6 z-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-primary/20 transition-colors duration-700"></div>
          <div className="flex gap-4 items-start relative z-10 flex-col md:flex-row">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex flex-shrink-0 items-center justify-center text-primary border border-primary/30 shadow-[0_0_15px_rgba(255,180,166,0.3)]">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="flex-1 w-full">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-bold text-on-surface">Financial Advisor</h3>
                <button 
                  onClick={generateInsight}
                  disabled={insightLoading}
                  className="bg-primary/20 text-primary px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider hover:bg-primary/30 transition-colors border border-primary/30 disabled:opacity-50 whitespace-nowrap"
                >
                  {insightLoading ? 'Analyzing...' : 'Generate Insight'}
                </button>
              </div>
              {insightLoading ? (
                <div className="flex items-center gap-2 text-on-surface-variant text-sm mt-2">
                  <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                  <span>Crunching numbers and calculating liquidity...</span>
                </div>
              ) : aiInsight ? (
                <p className="text-on-surface-variant text-sm leading-relaxed mt-2 whitespace-pre-wrap">{aiInsight}</p>
              ) : (
                <p className="text-on-surface-variant/60 text-sm mt-2">Click Generate Insight for a strict financial breakdown and daily spending limit.</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
              <div className="glass-card rounded-2xl p-6 mesh-income relative overflow-hidden group hover:border-[#00e676]/50 transition-colors shadow-lg bg-black/20">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#00e676]/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                  <div className="flex justify-between items-start mb-4 relative z-10">
                      <div className="w-10 h-10 rounded-xl bg-white/5 backdrop-blur-md flex items-center justify-center text-[#00e676] border border-white/10 shadow-sm">
                          <Landmark className="w-5 h-5" />
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[12px] font-bold border ${totalBalance >= 0 ? 'bg-[#00e676]/10 text-[#00e676] border-[#00e676]/20' : 'bg-[#ff5252]/10 text-[#ff5252] border-[#ff5252]/20'}`}>
                        {totalBalance >= 0 ? '+' : '-'}৳{totalFmt.dollars}
                      </span>
                  </div>
                  <div className="relative z-10">
                      <p className="text-on-surface-variant text-[12px] font-semibold mb-1 uppercase tracking-wider">Total Balance</p>
                      <h2 className="text-[48px] md:text-[64px] font-bold text-on-surface tracking-tight leading-none">{totalBalance < 0 ? '-' : ''}৳{totalFmt.dollars}<span className="text-on-surface-variant text-[24px] md:text-[32px]">.{totalFmt.cents}</span></h2>
                  </div>
              </div>

              <div className="glass-card rounded-2xl p-6 mesh-expense relative overflow-hidden group hover:border-[#ff5252]/50 transition-colors shadow-lg bg-black/20">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff5252]/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                  <div className="flex justify-between items-start mb-4 relative z-10">
                      <div className="w-10 h-10 rounded-xl bg-white/5 backdrop-blur-md flex items-center justify-center text-[#ff5252] border border-white/10 shadow-sm">
                          <TrendingDown className="w-5 h-5" />
                      </div>
                      <span className="px-3 py-1 rounded-full bg-[#ff5252]/10 text-[#ff5252] text-[12px] font-bold border border-[#ff5252]/20">Spent</span>
                  </div>
                  <div className="relative z-10">
                      <p className="text-on-surface-variant text-[12px] font-semibold mb-1 uppercase tracking-wider">Monthly Spend</p>
                      <h2 className="text-[32px] font-bold text-on-surface tracking-tight mt-2">৳{spendFmt.dollars}<span className="text-on-surface-variant text-[18px]">.{spendFmt.cents}</span></h2>
                  </div>
              </div>

              <div className="glass-card rounded-2xl p-6 mesh-p2p relative overflow-hidden group hover:border-[#651fff]/50 transition-colors shadow-lg bg-black/20">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#651fff]/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                  <div className="flex justify-between items-start mb-4 relative z-10">
                      <div className="w-10 h-10 rounded-xl bg-white/5 backdrop-blur-md flex items-center justify-center text-[#651fff] border border-white/10 shadow-sm">
                          <Handshake className="w-5 h-5" />
                      </div>
                      <span className="px-3 py-1 rounded-full bg-[#651fff]/10 text-[#651fff] text-[12px] font-bold border border-[#651fff]/20">{lentOut > 0 ? 'Active' : 'None'}</span>
                  </div>
                  <div className="relative z-10">
                      <p className="text-on-surface-variant text-[12px] font-semibold mb-1 uppercase tracking-wider">Lent Out</p>
                      <h2 className="text-[32px] font-bold text-on-surface tracking-tight mt-2">৳{lentFmt.dollars}<span className="text-on-surface-variant text-[18px]">.{lentFmt.cents}</span></h2>
                  </div>
              </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[400px]">
            <div className="lg:col-span-2 glass-card rounded-2xl p-6 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-medium text-on-surface">Recent Ledger</h3>
                </div>
                <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                    {sortedExpenses.length === 0 && (
                      <div className="flex items-center justify-center h-full text-on-surface-variant text-sm">
                        No transactions yet. Add one to get started.
                      </div>
                    )}
                    {sortedExpenses.map((tx) => {
                        const typeStyle = TYPE_COLOR_MAP[tx.type] || TYPE_COLOR_MAP.expense;
                        const icon = tx.icon || CATEGORY_ICON_MAP[tx.category] || 'receipt';
                        const amountStr = tx.type === 'income'
                          ? `+৳${formatCurrency(tx.amount).dollars}.${formatCurrency(tx.amount).cents}`
                          : `-৳${formatCurrency(tx.amount).dollars}.${formatCurrency(tx.amount).cents}`;
                        const subtitle = `${tx.subtitle || tx.category} • ${formatDate(tx.date)}`;

                        return (
                          <div key={tx.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/5 hover:bg-white/10 transition-colors group/tx shadow-sm">
                              <div className="flex items-center gap-4 min-w-0">
                                  {tx.receipt ? (
                                    <div className="w-10 h-10 md:w-12 md:h-12 shrink-0 rounded-xl overflow-hidden border border-white/10 shadow-inner">
                                      <img src={tx.receipt} alt="Receipt" className="w-full h-full object-cover" />
                                    </div>
                                  ) : (
                                    <div className={`w-10 h-10 md:w-12 md:h-12 shrink-0 rounded-xl bg-white/5 flex items-center justify-center ${typeStyle.color} border border-white/10 shadow-inner`}>
                                        {getCategoryIcon(icon)}
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                      <p className="font-bold text-on-surface text-sm md:text-base truncate">{tx.title}</p>
                                      <p className="text-on-surface-variant text-xs md:text-sm truncate">{subtitle}</p>
                                  </div>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                  <p className={`font-bold text-sm md:text-base ${typeStyle.color}`}>{amountStr}</p>
                                  <button
                                    onClick={() => tx.id !== undefined && setDeleteId(tx.id)}
                                    className="w-7 h-7 rounded-lg bg-white/5 hover:bg-[#ff5252]/20 border border-white/10 hover:border-[#ff5252]/30 flex items-center justify-center text-on-surface-variant hover:text-[#ff5252] transition-all opacity-100 md:opacity-0 group-hover/tx:opacity-100"
                                    title="Delete transaction"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                              </div>
                          </div>
                        );
                    })}
                </div>
            </div>

            <div className="glass-card rounded-2xl p-6 flex flex-col relative z-10">
                <h3 className="text-2xl font-medium text-on-surface mb-6">Expense Ratio (Current Month)</h3>
                <div className="flex-grow flex flex-col gap-6 w-full h-full p-4 relative">
                    <div className="flex justify-between text-xs text-on-surface-variant mb-2">
                        <span>Day 1</span>
                        <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#00e5ff]"></div> Cumulative Spend</span>
                        <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#ff9800]"></div> Limit (৳{targetThreshold})</span>
                        <span>Day {dailySpend.length}</span>
                    </div>
                    <div className="flex-grow relative border-b border-l border-white/20">
                        <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                           <defs>
                             <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                               <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.4" />
                               <stop offset="100%" stopColor="#00e5ff" stopOpacity="0" />
                             </linearGradient>
                           </defs>
                           {/* Threshold Line */}
                           <line x1="0" y1={100 - (targetThreshold / chartMax * 100)} x2="100" y2={100 - (targetThreshold / chartMax * 100)} stroke="#ff9800" strokeWidth="1" strokeDasharray="4" />
                           {/* Spend Path Fill */}
                           <path d={`M0,100 ${dailySpend.map((val, i) => `L${(i / (dailySpend.length - 1)) * 100},${100 - (val / chartMax * 100)}`).join(' ')} L100,100 Z`} fill="url(#spendGradient)" />
                           {/* Spend Path Line */}
                           <path d={`M0,100 ${dailySpend.map((val, i) => `L${(i / (dailySpend.length - 1)) * 100},${100 - (val / chartMax * 100)}`).join(' ')}`} fill="none" stroke="#00e5ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                </div>
            </div>
        </div>

        <TransactionFormModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSubmit={(data: any) => {
            const amount = Number(data.amount) || 0;
            const category = data.category as string;
            const txType = data.type as string;
            const icon = CATEGORY_ICON_MAP[category] || 'receipt';
            
            actions.add({
              title: data.title as string,
              subtitle: category,
              amount: txType === 'income' ? Math.abs(amount) : -Math.abs(amount),
              date: new Date().toISOString(),
              icon,
              category,
              type: txType as 'income' | 'expense' | 'p2p',
              receipt: data.receipt,
            });
          }}
        />

        <SpendingChartModal 
          isOpen={showChartModal} 
          onClose={() => setShowChartModal(false)} 
          expenses={expenses} 
        />

        <FormModal
          isOpen={showAdjustModal}
          onClose={() => setShowAdjustModal(false)}
          onSubmit={(data) => {
            const targetBalance = Number(data.targetBalance) || 0;
            const diff = targetBalance - totalBalance;
            if (diff !== 0) {
              actions.add({
                title: 'Manual Balance Adjustment',
                subtitle: 'System',
                amount: diff,
                date: new Date().toISOString(),
                icon: 'settings',
                category: 'System',
                type: diff > 0 ? 'income' : 'expense',
              });
            }
          }}
          title="Adjust Balance"
          submitLabel="Sync Balance"
          fields={[
            { name: 'targetBalance', label: 'True Account Balance (৳)', type: 'number', required: true, placeholder: 'Enter exact actual balance...' },
          ]}
        />

        <ConfirmModal 
          isOpen={deleteId !== null}
          onClose={() => setDeleteId(null)}
          onConfirm={() => deleteId !== null && actions.remove(deleteId)}
          title="Delete Transaction"
          message="Are you sure you want to delete this transaction? It will be permanently removed from your ledger."
        />

    </motion.div>
  );
}
