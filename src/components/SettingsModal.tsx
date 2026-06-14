import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, X, Download, Upload, Key, ShieldCheck } from 'lucide-react';
import { exportData, importData } from '../db';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    if (isOpen) {
      setApiKey(localStorage.getItem('GEMINI_API_KEY') || '');
      setSaveStatus('');
    }
  }, [isOpen]);

  const handleSaveKey = () => {
    const trimmed = apiKey.trim();
    if (trimmed === '') {
      setSaveStatus('Key cannot be empty.');
      setTimeout(() => setSaveStatus(''), 2000);
      return;
    }
    const isValidKey = trimmed.startsWith('AIza') || trimmed.startsWith('AQ.');
    if (!isValidKey) {
      setSaveStatus('Invalid Key Format.');
      setTimeout(() => setSaveStatus(''), 2000);
      return;
    }
    console.log("SENDING KEY TO GOOGLE:", trimmed);
    localStorage.setItem('GEMINI_API_KEY', trimmed);
    window.dispatchEvent(new Event('API_KEY_UPDATED'));
    setSaveStatus('Saved successfully!');
    setTimeout(() => setSaveStatus(''), 2000);
  };

  const handleClearKey = () => {
    localStorage.removeItem('GEMINI_API_KEY');
    setApiKey('');
    setSaveStatus('Key cleared.');
    setTimeout(() => setSaveStatus(''), 2000);
  };

  const handleExport = async () => {
    try {
      const data = await exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lifeos_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('Failed to export data.');
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const json = event.target?.result as string;
          await importData(json);
          alert('Data imported successfully! The application will now reload to apply changes.');
          window.location.reload();
        } catch (err) {
          alert('Failed to import data. Ensure the file is a valid LifeOS backup.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-surface-container-high/90 border border-white/20 rounded-[32px] p-8 shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-32 bg-primary/20 blur-[60px] pointer-events-none rounded-full"></div>

            <div className="flex justify-between items-center mb-8 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/30">
                  <Settings className="w-5 h-5" />
                </div>
                <h3 className="text-[24px] font-bold text-on-surface">System Settings</h3>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-on-surface-variant hover:text-on-surface transition-colors border border-white/5">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-8 relative z-10">
              
              {/* API Key Section */}
              <div className="bg-surface-container/50 border border-white/10 rounded-2xl p-6">
                <h4 className="text-[14px] font-bold uppercase tracking-widest text-on-surface mb-2 flex items-center gap-2">
                  <Key className="w-4 h-4 text-primary" /> Gemini API Integration
                </h4>
                <p className="text-[14px] text-on-surface-variant mb-4">
                  Enter your Google Gemini API key to enable AI Dashboard insights. Keys are stored locally in your browser.
                </p>
                <div className="flex gap-2">
                  <input 
                    type="password" 
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your Gemini API Key..." 
                    className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-[14px] font-mono text-on-surface focus:outline-none focus:border-primary/50 transition-colors"
                  />
                  <button onClick={handleClearKey} className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-on-surface font-bold text-[14px] hover:bg-error/20 hover:text-error hover:border-error/50 transition-colors flex items-center justify-center">
                    <X className="w-4 h-4" />
                  </button>
                  <button onClick={handleSaveKey} className="px-6 py-3 rounded-xl bg-primary text-on-primary font-bold text-[14px] hover:bg-primary/90 transition-colors flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> Save
                  </button>
                </div>
                {saveStatus && <p className="text-primary text-[12px] font-bold mt-2 animate-pulse">{saveStatus}</p>}
              </div>

              {/* Data Management Section */}
              <div className="bg-surface-container/50 border border-white/10 rounded-2xl p-6">
                <h4 className="text-[14px] font-bold uppercase tracking-widest text-on-surface mb-2">Data Management</h4>
                <p className="text-[14px] text-on-surface-variant mb-4">
                  Export your entire IndexedDB to a JSON file for backup, or import an existing backup.
                </p>
                <div className="flex gap-4">
                  <button onClick={handleExport} className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[14px] font-bold text-on-surface flex items-center justify-center gap-2 transition-colors">
                    <Download className="w-4 h-4" /> Export DB
                  </button>
                  <button onClick={handleImport} className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[14px] font-bold text-on-surface flex items-center justify-center gap-2 transition-colors">
                    <Upload className="w-4 h-4" /> Import DB
                  </button>
                </div>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
