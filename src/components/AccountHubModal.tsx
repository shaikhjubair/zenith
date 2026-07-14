import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, BookOpen, Key, Save, Plus, ShieldCheck, Download, Upload } from 'lucide-react';
import { useUserProfile } from '../context/UserProfileContext';
import { auth } from '../firebase';
import { EmailAuthProvider, reauthenticateWithCredential, deleteUser } from 'firebase/auth';
import { exportData, importData, getLocalApiKey, setLocalApiKey, STORES } from '../db';
import { useStore } from '../useStore';

interface AccountHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'personal' | 'study' | 'integrations';
}

export function AccountHubModal({ isOpen, onClose, defaultTab = 'personal' }: AccountHubModalProps) {
  const [activeTab, setActiveTab] = useState<'personal' | 'study' | 'integrations'>(defaultTab);
  const { profile, updateProfile } = useUserProfile();
  const [formData, setFormData] = useState(profile);
  const [apiKey, setApiKey] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [studyCourses, { add: addCourse }] = useStore<any>(STORES.studySchedule);
  const [newCourse, setNewCourse] = useState({
    course: '',
    day: 'Sun',
    timeStart: '',
    timeEnd: '',
    room: '',
    type: 'Theory'
  });

  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
      setFormData(profile);
      setApiKey(getLocalApiKey());
      setSaveStatus('');
    }
  }, [isOpen, profile, defaultTab]);

  if (!isOpen) return null;

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(formData);
    setSaveStatus('Profile updated successfully!');
    setTimeout(() => setSaveStatus(''), 2000);
  };

  const handleDeleteAccount = async () => {
    if (!auth.currentUser || !auth.currentUser.email) return;
    if (!deletePassword) {
      setDeleteError("Please enter your password.");
      return;
    }
    
    setIsDeleting(true);
    setDeleteError('');
    
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, deletePassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await deleteUser(auth.currentUser);
      onClose();
    } catch (err: any) {
      console.error("Account deletion error:", err);
      setDeleteError(err.message || "Failed to delete account. Incorrect password?");
      setIsDeleting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 300;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height = Math.round(height * (MAX_SIZE / width));
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width = Math.round(width * (MAX_SIZE / height));
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
            setFormData({ ...formData, avatarUrl: compressedBase64 });
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveKey = () => {
    const trimmed = apiKey.trim();
    if (trimmed === '') {
      setSaveStatus('Key cannot be empty.');
      setTimeout(() => setSaveStatus(''), 2000);
      return;
    }
    setLocalApiKey(trimmed);
    window.dispatchEvent(new Event('API_KEY_UPDATED'));
    setSaveStatus('Saved successfully!');
    setTimeout(() => setSaveStatus(''), 2000);
  };

  const handleClearKey = () => {
    setLocalApiKey('');
    setApiKey('');
    setSaveStatus('Key cleared.');
    setTimeout(() => setSaveStatus(''), 2000);
  };
  
  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourse.course || !newCourse.timeStart || !newCourse.timeEnd) {
      alert("Please fill required fields.");
      return;
    }
    
    // Format time to e.g. "09:51AM - 11:10AM"
    const formatTime = (time: string) => {
      const [h, m] = time.split(':');
      let hour = parseInt(h, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      if (hour > 12) hour -= 12;
      if (hour === 0) hour = 12;
      return `${hour.toString().padStart(2, '0')}:${m}${ampm}`;
    };
    
    const timeStr = `${formatTime(newCourse.timeStart)} - ${formatTime(newCourse.timeEnd)}`;
    
    await addCourse({
      course: newCourse.course,
      day: newCourse.day,
      time: timeStr,
      room: newCourse.room,
      type: newCourse.type
    });
    
    setNewCourse({
      course: '',
      day: 'Sun',
      timeStart: '',
      timeEnd: '',
      room: '',
      type: 'Theory'
    });
    setSaveStatus('Course added successfully!');
    setTimeout(() => setSaveStatus(''), 2000);
  };

  return (
    <AnimatePresence>
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
          className="relative w-full max-w-3xl bg-surface-container-high/90 border border-white/20 rounded-[32px] shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col md:flex-row h-[85vh] md:h-[600px]"
        >
          {/* Sidebar Tabs */}
          <div className="w-full md:w-64 bg-surface-container/50 border-b md:border-b-0 md:border-r border-white/10 p-4 flex flex-col gap-2 relative z-10 shrink-0">
            <h2 className="text-xl font-bold text-on-surface mb-4 px-4 pt-2">Account Hub</h2>
            <button 
              onClick={() => setActiveTab('personal')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'personal' ? 'bg-primary/20 text-primary font-bold' : 'text-on-surface-variant hover:bg-white/5 hover:text-on-surface'}`}
            >
              <User className="w-5 h-5" /> Personal Info
            </button>
            <button 
              onClick={() => setActiveTab('study')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'study' ? 'bg-primary/20 text-primary font-bold' : 'text-on-surface-variant hover:bg-white/5 hover:text-on-surface'}`}
            >
              <BookOpen className="w-5 h-5" /> Study Preferences
            </button>
            <button 
              onClick={() => setActiveTab('integrations')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'integrations' ? 'bg-primary/20 text-primary font-bold' : 'text-on-surface-variant hover:bg-white/5 hover:text-on-surface'}`}
            >
              <Key className="w-5 h-5" /> Integrations (API)
            </button>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 p-8 overflow-y-auto relative z-10">
            <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-on-surface-variant hover:text-on-surface transition-colors border border-white/5">
              <X className="w-5 h-5" />
            </button>

            {saveStatus && (
              <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-primary/20 text-primary border border-primary/30 px-4 py-2 rounded-full text-sm font-bold animate-fade-in z-50 backdrop-blur-md">
                {saveStatus}
              </div>
            )}

            {activeTab === 'personal' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <h3 className="text-2xl font-bold text-on-surface mb-6">Personal Information</h3>
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  
                  <div className="flex items-center gap-6">
                    <div className="shrink-0 relative group">
                      {formData.avatarUrl ? (
                        <img src={formData.avatarUrl} alt="Avatar" className="w-20 h-20 rounded-full object-cover border border-white/20" />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-surface-container border border-white/20 flex items-center justify-center text-on-surface-variant">
                          <User className="w-8 h-8" />
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <span className="text-xs font-bold">Edit</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-on-surface">{formData.name || 'Shaikh Jubair'}</h4>
                      <p className="text-sm text-on-surface-variant">{auth.currentUser?.email || 'shaikh.jubair.2025@gmail.com'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-on-surface-variant uppercase">Full Name</label>
                      <input type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary/50" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-on-surface-variant uppercase">Email (Read Only)</label>
                      <input type="text" value={auth.currentUser?.email || 'shaikh.jubair.2025@gmail.com'} readOnly className="w-full bg-surface-container/30 border border-white/5 rounded-xl px-4 py-3 text-on-surface-variant cursor-not-allowed" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-on-surface-variant uppercase">Phone Number</label>
                      <input type="text" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary/50" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-on-surface-variant uppercase">Date of Birth</label>
                      <input type="date" value={formData.dob || ''} onChange={e => setFormData({...formData, dob: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary/50" />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-semibold text-on-surface-variant uppercase">Address</label>
                      <input type="text" value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary/50" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-on-surface-variant uppercase">Height</label>
                      <input type="text" value={formData.height || ''} onChange={e => setFormData({...formData, height: e.target.value})} placeholder="e.g. 5'10&quot;" className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary/50" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-on-surface-variant uppercase">Weight</label>
                      <input type="text" value={formData.weight || ''} onChange={e => setFormData({...formData, weight: e.target.value})} placeholder="e.g. 75kg" className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary/50" />
                    </div>
                  </div>
                  
                  <button type="submit" className="w-full bg-primary text-on-primary py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                    <Save className="w-5 h-5" /> Save Profile
                  </button>
                </form>

                <div className="mt-8 pt-8 border-t border-error/20">
                  <h4 className="text-[14px] font-bold uppercase tracking-widest text-error mb-4">Danger Zone</h4>
                  {!showDeleteConfirm ? (
                    <button 
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full bg-error/10 text-error border border-error/20 py-3 rounded-xl font-bold hover:bg-error hover:text-white transition-colors"
                    >
                      Delete Account
                    </button>
                  ) : (
                    <div className="bg-error/10 border border-error/30 rounded-xl p-4 space-y-4">
                      <p className="text-sm text-error font-medium">This action cannot be undone. All your data will be permanently lost.</p>
                      <input 
                        type="password" 
                        placeholder="Enter password to confirm" 
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        className="w-full bg-black/30 border border-error/30 rounded-xl px-4 py-2 text-on-surface focus:outline-none focus:border-error"
                      />
                      {deleteError && <p className="text-xs text-error">{deleteError}</p>}
                      <div className="flex gap-2">
                        <button 
                          onClick={() => { setShowDeleteConfirm(false); setDeletePassword(''); setDeleteError(''); }}
                          className="flex-1 bg-surface border border-white/10 text-on-surface py-2 rounded-xl font-bold hover:bg-white/5 transition-colors"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleDeleteAccount}
                          disabled={isDeleting}
                          className="flex-1 bg-error text-white py-2 rounded-xl font-bold hover:bg-error/90 transition-colors disabled:opacity-50"
                        >
                          {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'study' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <h3 className="text-2xl font-bold text-on-surface mb-6">Study Preferences</h3>
                
                <div className="bg-surface-container/50 border border-white/10 rounded-2xl p-6 mb-6">
                  <h4 className="text-[14px] font-bold uppercase tracking-widest text-on-surface mb-4">Add Course Schedule</h4>
                  <form onSubmit={handleAddCourse} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-on-surface-variant uppercase">Course Name</label>
                      <input type="text" value={newCourse.course} onChange={e => setNewCourse({...newCourse, course: e.target.value})} required className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary/50" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-on-surface-variant uppercase">Day</label>
                        <select value={newCourse.day} onChange={e => setNewCourse({...newCourse, day: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary/50">
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-on-surface-variant uppercase">Room</label>
                        <input type="text" value={newCourse.room} onChange={e => setNewCourse({...newCourse, room: e.target.value})} required className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary/50" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-on-surface-variant uppercase">Start Time</label>
                        <input type="time" value={newCourse.timeStart} onChange={e => setNewCourse({...newCourse, timeStart: e.target.value})} required className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary/50" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-on-surface-variant uppercase">End Time</label>
                        <input type="time" value={newCourse.timeEnd} onChange={e => setNewCourse({...newCourse, timeEnd: e.target.value})} required className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary/50" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-on-surface-variant uppercase">Type</label>
                      <select value={newCourse.type} onChange={e => setNewCourse({...newCourse, type: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary/50">
                        <option value="Theory">Theory</option>
                        <option value="Lab">Lab</option>
                      </select>
                    </div>
                    <button type="submit" className="w-full bg-primary/20 text-primary border border-primary/30 py-3 rounded-xl font-bold hover:bg-primary/30 transition-colors flex items-center justify-center gap-2 mt-4">
                      <Plus className="w-5 h-5" /> Add Course
                    </button>
                  </form>
                </div>
                
                <div>
                  <h4 className="text-[14px] font-bold uppercase tracking-widest text-on-surface mb-4">Your Courses</h4>
                  {studyCourses.length === 0 ? (
                    <p className="text-on-surface-variant text-sm">No courses added yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {studyCourses.map((c: any, i: number) => (
                        <div key={c.id || i} className="bg-surface-container/30 border border-white/5 rounded-xl p-3 flex justify-between items-center">
                          <div>
                            <p className="font-bold text-on-surface">{c.course}</p>
                            <p className="text-xs text-on-surface-variant">{c.day} • {c.time} • Room {c.room} ({c.type})</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
              </motion.div>
            )}

            {activeTab === 'integrations' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <h3 className="text-2xl font-bold text-on-surface mb-6">Integrations</h3>
                
                <div className="bg-surface-container/50 border border-white/10 rounded-2xl p-6">
                  <h4 className="text-[14px] font-bold uppercase tracking-widest text-on-surface mb-2 flex items-center gap-2">
                    <Key className="w-4 h-4 text-primary" /> Gemini API Integration
                  </h4>
                  <p className="text-[14px] text-on-surface-variant mb-4">
                    Enter your Google Gemini API key to enable AI Dashboard insights. Keys are stored locally, isolated to your account.
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
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
