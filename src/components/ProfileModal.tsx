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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, avatarUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-4 bg-black/60 backdrop-blur-sm min-h-[100dvh]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-0"
          onClick={onClose}
        ></motion.div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-surface-container-high border border-white/10 rounded-[32px] p-6 shadow-2xl max-h-[85dvh] overflow-y-auto flex flex-col gap-4 m-auto z-10"
        >
          <div className="pb-4 border-b border-white/10 flex justify-between items-center">
            <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              User Profile
            </h3>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-on-surface-variant transition-colors z-20 relative">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Profile Picture</label>
              <div className="flex items-center gap-4">
                {formData.avatarUrl && (
                  <img src={formData.avatarUrl} alt="Avatar Preview" className="w-10 h-10 rounded-full object-cover aspect-square shrink-0" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full bg-surface-container/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-on-surface focus:outline-none focus:border-primary/50 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/20 file:text-primary hover:file:bg-primary/30"
                />
              </div>
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
