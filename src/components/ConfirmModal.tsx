import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}

export function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Delete Confirmation", 
  message = "Are you sure you want to delete this item? This action cannot be undone." 
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-sm glass-card rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 border border-red-500/30">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <h3 className="text-xl font-semibold text-on-surface mb-2">{title}</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                {message}
              </p>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-white/5 border-t border-white/5">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl font-semibold text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-all text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => { onConfirm(); onClose(); }}
                className="flex-1 py-2.5 rounded-xl font-semibold text-white bg-red-500/80 hover:bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all text-sm"
              >
                Confirm Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
