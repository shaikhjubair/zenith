import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Database, Cpu, Code2, FlaskConical, Calculator, ArrowLeft, Plus, Save, Clock, AlertTriangle } from 'lucide-react';
import { useStore } from '../useStore';
import { STORES } from '../db';
import { FormModal } from '../components/FormModal';
import { ConfirmModal } from '../components/ConfirmModal';

interface StudyCourse {
  id?: number;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  topics?: { id: string; title: string; isDone: boolean; }[];
  notes?: { id: string; content: string; date: string; }[];
  exams?: { id: string; title: string; date: string; }[];
}

const TimerWidget = () => {
  const [timerMode, setTimerMode] = useState<'stopwatch' | 'countdown'>('stopwatch');
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [inputMinutes, setInputMinutes] = useState(25);

  useEffect(() => {
    let interval: any;
    if (timerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(s => {
          if (timerMode === 'countdown') {
            if (s <= 1) {
              setTimerRunning(false);
              return 0;
            }
            return s - 1;
          }
          return s + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerMode]);

  const toggleTimer = () => {
    if (!timerRunning && timerMode === 'countdown' && timerSeconds === 0) {
       setTimerSeconds(inputMinutes * 60);
    }
    setTimerRunning(!timerRunning);
  };
  
  const resetTimer = () => {
    setTimerRunning(false);
    setTimerSeconds(timerMode === 'countdown' ? inputMinutes * 60 : 0);
  };

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-surface-container/30 rounded-[32px] p-8 border border-white/5 glass-edge flex flex-col items-center shadow-lg w-full relative z-10 max-w-full overflow-hidden">
      <div className="flex flex-col md:flex-row flex-wrap justify-center gap-4 mb-4 w-full">
        <button onClick={() => { setTimerMode('stopwatch'); setTimerRunning(false); setTimerSeconds(0); }} className={`w-full md:w-auto px-4 py-2 rounded-xl text-sm font-medium transition-colors ${timerMode === 'stopwatch' ? 'bg-primary text-on-primary' : 'bg-white/5 text-on-surface-variant hover:bg-white/10'}`}>Stopwatch</button>
        <button onClick={() => { setTimerMode('countdown'); setTimerRunning(false); setTimerSeconds(inputMinutes * 60); }} className={`w-full md:w-auto px-4 py-2 rounded-xl text-sm font-medium transition-colors ${timerMode === 'countdown' ? 'bg-primary text-on-primary' : 'bg-white/5 text-on-surface-variant hover:bg-white/10'}`}>Countdown</button>
      </div>
      
      {timerMode === 'countdown' && !timerRunning && timerSeconds === inputMinutes * 60 && (
         <div className="mb-4 flex items-center gap-2">
            <input type="number" value={inputMinutes} onChange={e => { setInputMinutes(Number(e.target.value)); setTimerSeconds(Number(e.target.value) * 60); }} className="bg-black/20 text-on-surface border border-white/10 rounded-lg px-3 py-1 w-20 text-center outline-none focus:border-primary/50" />
            <span className="text-on-surface-variant">min</span>
         </div>
      )}

      <div className="text-6xl md:text-[64px] font-bold text-primary font-mono tracking-tight leading-none mb-6 break-all">
        {formatTime(timerSeconds)}
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap gap-4 w-full">
        <button onClick={toggleTimer} className="flex-1 px-8 py-3 rounded-xl bg-primary text-on-primary font-medium hover:bg-primary/90 transition-colors">
          {timerRunning ? 'Pause' : 'Start'}
        </button>
        <button onClick={resetTimer} className="flex-1 px-8 py-3 rounded-xl bg-white/5 text-on-surface font-medium hover:bg-white/10 transition-colors border border-white/10">
          Reset
        </button>
      </div>
    </div>
  );
};

export function StudyModule() {
  const [courses, actions, loading] = useStore<StudyCourse>(STORES.studyCourses);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeCourseId, setActiveCourseId] = useState<number | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'topics' | 'notes' | 'exams'>('topics');

  const [newTopic, setNewTopic] = useState('');
  const [newNote, setNewNote] = useState('');
  const [newExamTitle, setNewExamTitle] = useState('');
  const [newExamDate, setNewExamDate] = useState('');

  if (loading) {
    return (
      <div className="max-w-6xl w-full mx-auto flex items-center justify-center h-full">
        <div className="w-12 h-12 rounded-full border-[3px] border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'data_object': return <Database className="w-6 h-6" />;
      case 'memory': return <Cpu className="w-6 h-6" />;
      case 'code': return <Code2 className="w-6 h-6" />;
      case 'science': return <FlaskConical className="w-6 h-6" />;
      case 'calculate': return <Calculator className="w-6 h-6" />;
      default: return <Database className="w-6 h-6" />;
    }
  };

  const activeCourse = courses.find(c => c.id === activeCourseId);

  // Exam Alert Logic
  const allExams = courses.flatMap(c => (c.exams || []).map(e => ({ ...e, courseId: c.id, courseTitle: c.title })));
  const futureExams = allExams.filter(e => Date.parse(e.date) > Date.now());
  const closestExam = futureExams.sort((a, b) => Date.parse(a.date) - Date.parse(b.date))[0];
  const isUrgent = closestExam && (Date.parse(closestExam.date) - Date.now() <= 48 * 60 * 60 * 1000);

  const handleAddTopic = () => {
    if (!activeCourse || !newTopic.trim() || activeCourse.id === undefined) return;
    const topic = { id: Date.now().toString(), title: newTopic.trim(), isDone: false };
    const topics = [...(activeCourse.topics || []), topic];
    actions.update(activeCourse.id, { topics });
    setNewTopic('');
  };

  const handleToggleTopic = (topicId: string) => {
    if (!activeCourse || activeCourse.id === undefined) return;
    const topics = (activeCourse.topics || []).map(t => t.id === topicId ? { ...t, isDone: !t.isDone } : t);
    actions.update(activeCourse.id, { topics });
  };

  const handleAddNote = () => {
    if (!activeCourse || !newNote.trim() || activeCourse.id === undefined) return;
    const note = { id: Date.now().toString(), content: newNote.trim(), date: new Date().toISOString() };
    const notes = [...(activeCourse.notes || []), note];
    actions.update(activeCourse.id, { notes });
    setNewNote('');
  };

  const handleAddExam = () => {
    if (!activeCourse || !newExamTitle.trim() || !newExamDate || activeCourse.id === undefined) return;
    const exam = { id: Date.now().toString(), title: newExamTitle.trim(), date: newExamDate };
    const exams = [...(activeCourse.exams || []), exam];
    actions.update(activeCourse.id, { exams });
    setNewExamTitle('');
    setNewExamDate('');
  };

  const renderActiveCourse = () => {
    if (!activeCourse) return null;

    return (
      <div className="col-span-12 flex flex-col gap-8 relative z-10 w-full">
        <div className="flex items-center gap-4">
          <button onClick={() => setActiveCourseId(null)} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-on-surface">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-4xl md:text-[40px] font-bold text-on-surface leading-none tracking-tight break-words">{activeCourse.title}</h2>
            <p className="text-primary mt-1">{activeCourse.subtitle}</p>
          </div>
        </div>

        <div className="bg-surface-container/30 rounded-[32px] overflow-hidden border border-white/5 glass-edge shadow-lg flex flex-col w-full">
          <div className="flex border-b border-white/5 w-full">
            {['topics', 'notes', 'exams'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 py-4 text-center text-sm font-medium uppercase tracking-widest transition-colors ${
                  activeTab === tab ? 'bg-primary/10 text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:bg-white/5 hover:text-on-surface'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-8 min-h-[400px]">
            {activeTab === 'topics' && (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row flex-wrap gap-4">
                  <input
                    type="text"
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTopic()}
                    placeholder="New topic to study..."
                    className="flex-1 w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-on-surface outline-none focus:border-primary/50 transition-colors"
                  />
                  <button onClick={handleAddTopic} className="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary text-on-primary font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                    <Plus className="w-5 h-5" /> Add
                  </button>
                </div>
                <div className="flex flex-col gap-3">
                  {(activeCourse.topics || []).map(topic => (
                    <div key={topic.id} className={`flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/5 transition-all ${topic.isDone ? 'opacity-50' : ''}`}>
                      <button 
                        onClick={() => handleToggleTopic(topic.id)}
                        className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${topic.isDone ? 'bg-primary border-primary text-on-primary' : 'border-white/20 hover:border-primary/50 text-transparent'}`}
                      >
                        <svg className={`w-4 h-4 ${topic.isDone ? 'block' : 'hidden'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      </button>
                      <span className={`text-[16px] flex-1 ${topic.isDone ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>{topic.title}</span>
                    </div>
                  ))}
                  {(!activeCourse.topics || activeCourse.topics.length === 0) && (
                    <p className="text-on-surface-variant/50 text-center py-8">No topics added yet.</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-4">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Write your study notes here..."
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-4 text-on-surface outline-none focus:border-primary/50 transition-colors min-h-[120px] resize-none"
                  />
                  <div className="flex justify-end">
                    <button onClick={handleAddNote} className="px-6 py-3 rounded-xl bg-primary text-on-primary font-medium hover:bg-primary/90 transition-colors flex items-center gap-2">
                      <Save className="w-5 h-5" /> Save Note
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  {[...(activeCourse.notes || [])].reverse().map(note => (
                    <div key={note.id} className="p-5 rounded-2xl bg-white/5 border border-white/5 relative group">
                      <p className="text-sm text-primary/80 mb-2 font-mono">{new Date(note.date).toLocaleString()}</p>
                      <p className="text-on-surface whitespace-pre-wrap">{note.content}</p>
                    </div>
                  ))}
                  {(!activeCourse.notes || activeCourse.notes.length === 0) && (
                    <p className="text-on-surface-variant/50 text-center py-8">No notes yet.</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'exams' && (
              <div className="flex flex-col gap-6">
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={newExamTitle}
                    onChange={(e) => setNewExamTitle(e.target.value)}
                    placeholder="Exam title..."
                    className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-on-surface outline-none focus:border-primary/50 transition-colors"
                  />
                  <input
                    type="datetime-local"
                    value={newExamDate}
                    onChange={(e) => setNewExamDate(e.target.value)}
                    className="bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-on-surface outline-none focus:border-primary/50 transition-colors [color-scheme:dark]"
                  />
                  <button onClick={handleAddExam} className="px-6 py-3 rounded-xl bg-primary text-on-primary font-medium hover:bg-primary/90 transition-colors flex items-center gap-2">
                    <Plus className="w-5 h-5" /> Add
                  </button>
                </div>
                <div className="flex flex-col gap-3">
                  {(activeCourse.exams || []).map(exam => (
                    <div key={exam.id} className="flex items-center gap-4 p-5 rounded-2xl border border-white/5 bg-white/5">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                        <Clock className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-medium text-on-surface">{exam.title}</h4>
                        <p className="text-on-surface-variant">{new Date(exam.date).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                  {(!activeCourse.exams || activeCourse.exams.length === 0) && (
                    <p className="text-on-surface-variant/50 text-center py-8">No upcoming exams.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative overflow-x-hidden overflow-y-auto box-border z-0 h-full w-full max-w-full -m-4 md:-m-8 p-4 md:p-8 flex-1 flex flex-col">
      <div className="absolute inset-0 bg-[url('/study_bg.png')] bg-cover bg-center mix-blend-overlay opacity-50 pointer-events-none z-0"></div>
      <div className="absolute inset-0 bg-black/60 pointer-events-none z-0"></div>

      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
        className="max-w-6xl w-full mx-auto grid grid-cols-12 gap-8 relative z-10 flex-1"
      >
        {activeCourse ? renderActiveCourse() : (
          <>
            <div className="col-span-12 relative z-10 mb-2">
              <h2 className="text-5xl md:text-[64px] font-bold text-on-surface tracking-tight mb-2 leading-none break-words">Deep Work</h2>
              <p className="text-[18px] text-primary">10-Hour Intensive Routine Active</p>
            </div>

            {isUrgent && (
              <div className="col-span-12 relative z-10">
                <div className="animate-pulse bg-red-500/20 border border-red-500/50 rounded-2xl p-6 flex items-center gap-6 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
                  <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
                    <AlertTriangle className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-red-400">Upcoming Exam Alert!</h3>
                    <p className="text-red-200 mt-1">
                      {closestExam.courseTitle} - {closestExam.title} is coming up on {new Date(closestExam.date).toLocaleString()}.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="col-span-12 lg:col-span-8 flex flex-col gap-8 relative z-10">
              <div className="bg-surface-container/30 rounded-[32px] p-8 border border-white/5 glass-edge flex-1 shadow-lg">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-medium text-on-surface">Active Curriculum</h3>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
                  >
                    <span className="text-xl leading-none">+</span>
                  </button>
                </div>
                <div className="space-y-4">
                  {courses.length === 0 && (
                    <p className="text-on-surface-variant/50 text-center py-8">No courses yet. Add one to get started.</p>
                  )}
                  {courses.map((course) => (
                    <div
                      key={course.id}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group relative"
                      onClick={() => setActiveCourseId(course.id!)}
                    >
                      <div className={`w-12 h-12 rounded-xl bg-${course.color}/20 flex items-center justify-center text-${course.color}`}>
                        {getIcon(course.icon)}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-[18px] text-on-surface">{course.title}</h4>
                        <p className="text-[12px] text-on-surface-variant font-semibold tracking-widest uppercase">{course.subtitle}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (course.id !== undefined) setCourseToDelete(course.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/20 flex items-center justify-center text-on-surface-variant hover:text-red-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-4 flex flex-col gap-8 relative z-10">
              <TimerWidget />
            </div>
          </>
        )}

        <FormModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSubmit={(data) => {
            actions.add({
              title: data.title as string,
              subtitle: data.subtitle as string,
              icon: data.icon as string,
              color: data.color as string,
              topics: [],
              notes: [],
              exams: [],
            });
          }}
          title="Add Course"
          fields={[
            { name: 'title', label: 'Title', type: 'text', required: true, placeholder: 'e.g. Advanced Algorithms' },
            { name: 'subtitle', label: 'Subtitle', type: 'text', required: true, placeholder: 'e.g. Module 4: Graph Theory' },
            {
              name: 'icon',
              label: 'Icon',
              type: 'select',
              required: true,
              defaultValue: 'data_object',
              options: [
                { value: 'data_object', label: 'Data Object' },
                { value: 'memory', label: 'Memory' },
                { value: 'code', label: 'Code' },
                { value: 'science', label: 'Science' },
                { value: 'calculate', label: 'Calculate' },
              ],
            },
            {
              name: 'color',
              label: 'Color',
              type: 'select',
              required: true,
              defaultValue: 'primary',
              options: [
                { value: 'primary', label: 'Primary' },
                { value: 'secondary', label: 'Secondary' },
                { value: 'tertiary', label: 'Tertiary' },
              ],
            },
          ]}
        />
      </motion.div>
    </div>
  );
}
