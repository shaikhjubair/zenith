import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Activity, Target, Save } from 'lucide-react';
import { useUserProfile } from '../context/UserProfileContext';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { profile, updateProfile } = useUserProfile();
  const [formData, setFormData] = useState(profile);

  useEffect(() => {
    if (isOpen) {
      setFormData(profile);
    }
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(formData);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        ></motion.div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-surface/90 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl z-10"
        >
          <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
            <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              User Profile
            </h3>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-on-surface-variant transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Profile Picture URL</label>
              <input
                type="text"
                value={formData.avatarUrl}
                onChange={e => setFormData({...formData, avatarUrl: e.target.value})}
                placeholder="https://example.com/avatar.jpg"
                className="w-full bg-surface-container/50 border border-white/10 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Height</label>
                <input
                  type="text"
                  value={formData.height}
                  onChange={e => setFormData({...formData, height: e.target.value})}
                  placeholder="e.g. 5'10&quot; or 178cm"
                  className="w-full bg-surface-container/50 border border-white/10 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Weight</label>
                <input
                  type="text"
                  value={formData.weight}
                  onChange={e => setFormData({...formData, weight: e.target.value})}
                  placeholder="e.g. 75kg"
                  className="w-full bg-surface-container/50 border border-white/10 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider flex items-center gap-2">
                <Target className="w-3 h-3" /> Primary Fitness Goal
              </label>
              <input
                type="text"
                value={formData.primaryGoal}
                onChange={e => setFormData({...formData, primaryGoal: e.target.value})}
                placeholder="e.g. Reduce belly fat and build muscle"
                className="w-full bg-surface-container/50 border border-white/10 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 mt-2">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${formData.isFasting ? 'bg-tertiary/20 text-tertiary' : 'bg-surface-container text-on-surface-variant'}`}>
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-on-surface text-sm">Fasting / Roza Mode</p>
                  <p className="text-xs text-on-surface-variant">Adjusts AI coaching expectations</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={formData.isFasting} onChange={e => setFormData({...formData, isFasting: e.target.checked})} />
                <div className="w-11 h-6 bg-surface-container peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-tertiary"></div>
              </label>
            </div>
            
            <div className="pt-4">
              <button type="submit" className="w-full bg-primary text-on-primary py-3 rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                <Save className="w-5 h-5" /> Save Profile
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
