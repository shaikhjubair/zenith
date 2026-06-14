import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'url';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  defaultValue?: string | number;
}

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, string | number>) => void;
  title: string;
  fields: FieldConfig[];
  submitLabel?: string;
}

export const FormModal = React.memo(function FormModal({ isOpen, onClose, onSubmit, title, fields, submitLabel = 'Save' }: FormModalProps) {
  const [formData, setFormData] = useState<Record<string, string | number>>({});
  const firstInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      const defaults: Record<string, string | number> = {};
      fields.forEach(f => {
        if (f.defaultValue !== undefined) defaults[f.name] = f.defaultValue;
      });
      setFormData(defaults);
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [isOpen]); // Removed `fields` to prevent re-renders when parent ticks

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  const handleChange = (name: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/60 backdrop-blur-[20px]"
            onPointerDown={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-[480px] bg-surface-container-high/90 backdrop-blur-[40px] border border-white/20 rounded-[32px] p-8 relative overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.5),inset_1px_1px_0px_rgba(255,255,255,0.15)] z-10"
          >
            {/* Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-primary/15 blur-[50px] pointer-events-none rounded-full"></div>

            {/* Header */}
            <div className="flex justify-between items-center mb-8 relative z-10">
              <h3 className="text-[24px] font-bold text-on-surface tracking-tight">{title}</h3>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-5 relative z-10">
              {fields.map((field, i) => (
                <div key={field.name} className="flex flex-col gap-2">
                  <label className="text-[12px] font-semibold text-on-surface-variant uppercase tracking-widest">
                    {field.label}
                  </label>
                  {field.type === 'textarea' ? (
                    <textarea
                      ref={i === 0 ? firstInputRef as any : undefined}
                      required={field.required}
                      placeholder={field.placeholder}
                      value={(formData[field.name] as string) || ''}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                      className="w-full bg-surface-container-lowest/60 border border-white/10 rounded-xl px-4 py-3 text-[16px] text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/50 focus:bg-surface/60 transition-all resize-none h-24"
                    />
                  ) : field.type === 'select' ? (
                    <select
                      ref={i === 0 ? firstInputRef as any : undefined}
                      required={field.required}
                      value={(formData[field.name] as string) || ''}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                      className="w-full bg-surface-container-lowest/60 border border-white/10 rounded-xl px-4 py-3 text-[16px] text-on-surface focus:outline-none focus:border-primary/50 focus:bg-surface/60 transition-all appearance-none cursor-pointer"
                    >
                      <option value="" className="bg-surface-container text-on-surface-variant">Select...</option>
                      {field.options?.map(opt => (
                        <option key={opt.value} value={opt.value} className="bg-surface-container text-on-surface">{opt.label}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      ref={i === 0 ? firstInputRef as any : undefined}
                      type={field.type}
                      required={field.required}
                      placeholder={field.placeholder}
                      value={formData[field.name] ?? ''}
                      onChange={(e) => handleChange(field.name, field.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
                      step={field.type === 'number' ? 'any' : undefined}
                      className="w-full bg-surface-container-lowest/60 border border-white/10 rounded-xl px-4 py-3 text-[16px] text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/50 focus:bg-surface/60 transition-all"
                    />
                  )}
                </div>
              ))}

              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3.5 rounded-xl bg-white/5 border border-white/10 text-on-surface text-[12px] font-bold uppercase tracking-widest hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 rounded-xl bg-primary text-on-primary text-[12px] font-bold uppercase tracking-widest hover:opacity-90 transition-opacity shadow-[0_4px_20px_rgba(255,180,166,0.3)]"
                >
                  {submitLabel}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
});
