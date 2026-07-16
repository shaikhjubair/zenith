import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { X, Database, Cpu, Code2, FlaskConical, Calculator, ArrowLeft, Plus, Save, Clock, AlertTriangle, Minus } from 'lucide-react';
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
  topics?: { id: string; title: string; isDone: boolean; term?: 'midterm' | 'final' }[];
  syllabus?: {
    term: 'midterm' | 'final';
    chapterTitle: string;
    subTopics: { id: string; title: string; isCompleted: boolean }[];
  }[];
  notes?: { id: string; content: string; date: string; }[];
  exams?: { id: string; title: string; date: string; }[];
  midtermClasses?: number;
  finalClasses?: number;
  completedClasses?: number; // legacy
  term?: 'midterm' | 'final';
  marksTracker?: {
    midterm?: {
      classTests?: number[];
      missedClasses?: number;
      assignment?: number;
      midExam?: number;
      finalExam?: number;
      classPerformance?: number;
    },
    final?: {
      classTests?: number[];
      missedClasses?: number;
      assignment?: number;
      midExam?: number;
      finalExam?: number;
      classPerformance?: number;
    }
  };
  last_auto_increment_date?: string;
}
// SCHEDULE_DATA is now loaded dynamically from STORES.studySchedule

export const useCurrentTime = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  return time;
};

export const getClassStatus = (timeStr: string, currentTime: Date) => {
  try {
    const extractStartEndTimes = (str: string) => {
      if (!str) return { startMins: -1, endMins: -1 };
      const regex = /(\d{1,2})\D*(\d{2})\D*(AM|PM)/gi;
      const matches = [...str.matchAll(regex)];
      
      if (matches.length === 0) return { startMins: -1, endMins: -1 };
      
      const parseMatch = (m: RegExpMatchArray) => {
          let h = parseInt(m[1], 10);
          let min = parseInt(m[2], 10);
          let p = m[3].toUpperCase();
          if (p === 'PM' && h !== 12) h += 12;
          if (p === 'AM' && h === 12) h = 0;
          return h * 60 + min;
      };

      const startMins = parseMatch(matches[0]);
      const endMins = matches.length > 1 ? parseMatch(matches[matches.length - 1]) : startMins;

      return { startMins, endMins };
    };

    const { startMins, endMins } = extractStartEndTimes(timeStr);
    const nowMins = currentTime.getHours() * 60 + currentTime.getMinutes();
    
    if (startMins === -1 || endMins === -1) return 'upcoming'; // parse failed
    if (nowMins > endMins) return 'ended';
    if (nowMins >= startMins && nowMins <= endMins) return 'active';
    return 'upcoming';
  } catch {
    return 'upcoming';
  }
};

export const isCourseMatch = (routineCourseName: string, activeCurriculumName: string) => {
  const rc = routineCourseName.toLowerCase();
  const ac = activeCurriculumName.toLowerCase();
  
  if (rc.includes(ac) || ac.includes(rc)) return true;
  if (rc.includes('calculus') && ac.includes('calculus')) return true;
  if (rc.includes('circuit') && ac.includes('circuit')) return true;
  if (rc.includes('electronic') && ac.includes('electronic')) return true;
  if (rc.includes('object oriented') && (ac.includes('object oriented') || ac.includes('oop'))) return true;
  if (rc.includes('oop') && (ac.includes('oop') || ac.includes('object oriented'))) return true;
  if (rc.split(':')[0].trim() === ac.split(':')[0].trim()) return true;
  
  return false;
};

const ClassRoutineWidget = () => {
  const currentTime = useCurrentTime();
  const dayIndex = currentTime.getDay();
  const daysMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const todayStr = daysMap[dayIndex];
  
  const [studySchedule] = useStore<any>(STORES.studySchedule);
  const todaysClasses = (studySchedule || []).filter((c: any) => c.day === todayStr);
  
  const formattedDate = currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="col-span-12 bg-surface-container/30 rounded-[32px] p-8 border border-white/5 glass-edge shadow-lg relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
      <div className="relative z-10 flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
           <div>
             <h3 className="text-[28px] font-bold text-on-surface tracking-tight">Summer 2026 Routine</h3>
             <p className="text-primary font-medium tracking-wide uppercase text-sm mt-1">{formattedDate}</p>
           </div>
        </div>
        
        <div>
           <h4 className="text-[14px] font-bold text-on-surface-variant uppercase tracking-widest mb-4 flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_rgba(var(--secondary-rgb),0.8)]"></div>
             Today's Classes
           </h4>
           {todaysClasses.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {todaysClasses.map((cls, idx) => {
                 const status = getClassStatus(cls.time, currentTime);
                 const isActive = status === 'active';
                 const isEnded = status === 'ended';
                 
                 return (
                   <div key={idx} className={`p-5 rounded-2xl border transition-all ${isActive ? 'bg-primary/20 border-primary/50 shadow-[0_0_20px_rgba(255,180,166,0.3)]' : isEnded ? 'bg-white/5 border-white/5 opacity-50 grayscale-[50%]' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}>
                     <div className="flex justify-between items-start mb-3">
                       <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${isActive ? 'bg-primary text-on-primary animate-pulse' : isEnded ? 'bg-surface-container text-on-surface-variant/50' : 'bg-surface-container-high text-on-surface-variant'}`}>
                         {isActive ? 'Happening Now' : isEnded ? 'Ended' : cls.time}
                       </span>
                       <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${cls.type === 'Lab' ? 'bg-tertiary/20 text-tertiary' : 'bg-secondary/20 text-secondary'}`}>
                         {cls.type}
                       </span>
                     </div>
                     <h5 className={`font-bold text-[16px] mb-1 ${isActive ? 'text-on-surface' : isEnded ? 'text-on-surface-variant' : 'text-on-surface/90'}`}>{cls.course}</h5>
                     <p className="text-[14px] font-medium text-on-surface-variant flex items-center gap-1">
                       Room: <span className={isActive ? 'text-primary' : 'text-on-surface'}>{cls.room}</span>
                     </p>
                   </div>
                 );
               })}
             </div>
           ) : (
             <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-2 shadow-inner">
               <span className="text-4xl">🌴</span>
               <h5 className="text-lg font-bold text-primary">No Classes Today</h5>
               <p className="text-on-surface-variant text-sm">Focus on self-study and project building.</p>
             </div>
           )}
        </div>
        
        <div>
           <h4 className="text-[14px] font-bold text-on-surface-variant uppercase tracking-widest mb-4 flex items-center gap-2 mt-2">
             <div className="w-2 h-2 rounded-full bg-on-surface-variant"></div>
             Weekly Overview
           </h4>
           <div className="flex overflow-x-auto gap-4 pb-4 custom-scrollbar">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(dayName => {
                const [studySchedule] = useStore<any>(STORES.studySchedule);
                const dayClasses = (studySchedule || []).filter((c: any) => c.day === dayName);
                return (
                  <div key={dayName} className={`min-w-[200px] shrink-0 border border-white/5 p-5 rounded-2xl flex flex-col ${dayClasses.length > 0 ? 'bg-surface-container-lowest/50' : 'bg-surface-container-lowest/10 opacity-70'}`}>
                    <h5 className={`font-bold uppercase tracking-widest mb-3 text-[12px] ${dayName === todayStr ? 'text-primary' : 'text-on-surface-variant'}`}>{dayName} {dayName === todayStr && '(Today)'}</h5>
                    <div className="flex flex-col gap-3 flex-1">
                      {dayClasses.length > 0 ? dayClasses.map((cls, idx) => (
                        <div key={idx} className="flex flex-col gap-1 border-l-2 border-primary/20 pl-3">
                          <span className="text-[11px] text-on-surface-variant font-mono">{cls.time} • Rm {cls.room}</span>
                          <span className="text-[13px] font-medium text-on-surface/90 truncate">{cls.course}</span>
                        </div>
                      )) : (
                        <div className="flex-1 flex items-center justify-center py-4">
                          <span className="text-[12px] font-semibold text-on-surface-variant/50 uppercase tracking-widest">No Classes</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
           </div>
        </div>
      </div>
    </div>
  );
};

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

      <div className="text-5xl sm:text-6xl md:text-[64px] font-bold text-primary font-mono tracking-tight leading-none mb-6 break-all">
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
  const currentTime = useCurrentTime();
  const [courses, actions, loading] = useStore<StudyCourse>(STORES.studyCourses);
  const [showAddModal, setShowAddModal] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);
  const [topicToDelete, setTopicToDelete] = useState<string | null>(null);
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'topics' | 'notes' | 'exams' | 'marks'>('topics');
  const [studySchedule, scheduleActions] = useStore<any>(STORES.studySchedule);
  
  const [newTopic, setNewTopic] = useState('');
  const [newNote, setNewNote] = useState('');
  const [newExamTitle, setNewExamTitle] = useState('');
  const [newExamDate, setNewExamDate] = useState('');

  useEffect(() => {
    // We bypass the corrupted cache by forcing a clean slate if the courses are missing or corrupted
    const currentCourses = JSON.parse(localStorage.getItem('zenith_studyCourses') || '[]');
    
    // Check if we already have the perfect lowercase version
    const isPerfect = currentCourses.some((c: any) => c.title.includes('CSE 1115') && c.syllabus?.[0]?.term === 'midterm');
    
    if (!isPerfect) {
      // Create pristine courses with STRICT lowercase 'midterm' and 'final' terms
      const pristineCourses = [
        {
          id: "eee-2113-circuits",
          title: "EEE 2113: Electrical Circuits",
          subtitle: "Sadiku 5th Ed",
          icon: "Cpu",
          color: "tertiary",
          isLab: false,
          attendedClasses: 0,
          schedule: [
            { day: "Sun", time: "12:31 PM - 01:50 PM", room: "428" },
            { day: "Wed", time: "12:31 PM - 01:50 PM", room: "428" }
          ],
          syllabus: [
            { term: 'midterm', chapterTitle: 'Ch 1 & 2: Basic Concepts', subTopics: [
              { id: 'c-1', title: '1.1-1.6 Units, Voltage, Power', isCompleted: false },
              { id: 'c-2', title: "2.1-2.4 Ohm's Law, Nodes", isCompleted: false },
              { id: 'c-3', title: '2.5-2.8 Series/Parallel', isCompleted: false }
            ]},
            { term: 'midterm', chapterTitle: 'Ch 3 & 4: Analysis & Theorems', subTopics: [
              { id: 'c-4', title: '3.1-3.5 Nodal & Mesh', isCompleted: false },
              { id: 'c-5', title: '4.1-4.4 Superposition', isCompleted: false },
              { id: 'c-6', title: '4.5-4.8 Thevenin, Norton', isCompleted: false }
            ]},
            { term: 'final', chapterTitle: 'Ch 6 & 7: Capacitors & Inductors', subTopics: [
              { id: 'c-7', title: '6.1-6.5 Series/Parallel Caps', isCompleted: false },
              { id: 'c-8', title: '7.1-7.6 Source-Free RC/RL', isCompleted: false }
            ]},
            { term: 'final', chapterTitle: 'Ch 9, 10 & 11: AC Circuits', subTopics: [
              { id: 'c-9', title: '9.1-9.7 Sinusoids, Phasors', isCompleted: false },
              { id: 'c-10', title: '10.1-10.6 AC Nodal, Mesh', isCompleted: false }
            ]}
          ]
        },
        {
          id: "cse-1115-theory",
          title: "CSE 1115: Object Oriented Programming",
          subtitle: "Java Theory",
          icon: "Code2",
          color: "primary",
          isLab: false,
          attendedClasses: 0,
          schedule: [
            { day: "Tue", time: "03:11 PM - 04:30 PM", room: "305" },
            { day: "Sat", time: "03:11 PM - 04:30 PM", room: "305" }
          ],
          syllabus: [
            { term: 'midterm', chapterTitle: 'Ch 2 & 3: Intro & Objects', subTopics: [
              { id: 'th-1', title: '2.1-2.5 Basic Syntax', isCompleted: false },
              { id: 'th-2', title: '3.1-3.4 Classes & Methods', isCompleted: false },
              { id: 'th-3', title: '3.5-3.6 Constructors', isCompleted: false }
            ]},
            { term: 'midterm', chapterTitle: 'Ch 4 & 5: Control Statements', subTopics: [
              { id: 'th-4', title: '4.1-4.8 if, while & Assignment', isCompleted: false },
              { id: 'th-5', title: '5.1-5.8 for, switch, break', isCompleted: false }
            ]},
            { term: 'midterm', chapterTitle: 'Ch 6 & 7: Methods & Arrays', subTopics: [
              { id: 'th-6', title: '6.1-6.5 Static Methods & Math', isCompleted: false },
              { id: 'th-7', title: '7.1-7.11 Arrays & ArrayLists', isCompleted: false }
            ]},
            { term: 'final', chapterTitle: 'Ch 8 & 9: Classes & Inheritance', subTopics: [
              { id: 'th-8', title: '8.1-8.14 Overloaded Constructors', isCompleted: false },
              { id: 'th-9', title: '9.1-9.8 Superclasses & Subclasses', isCompleted: false }
            ]},
            { term: 'final', chapterTitle: 'Ch 10 & 11: Polymorphism & Exceptions', subTopics: [
              { id: 'th-10', title: '10.1-10.8 Abstract Classes & Interfaces', isCompleted: false },
              { id: 'th-11', title: '11.1-11.8 Try, Catch, Finally', isCompleted: false }
            ]}
          ]
        },
        {
          id: "cse-1116-lab",
          title: "CSE 1116: OOP Laboratory",
          subtitle: "Java Lab",
          icon: "Database",
          color: "secondary",
          isLab: true,
          attendedClasses: 0,
          schedule: [
            { day: "Tue", time: "08:30 AM - 11:00 AM", room: "426" }
          ],
          syllabus: [
            { term: 'midterm', chapterTitle: 'Lab 1-4: Basics & Control Flow', subTopics: [
              { id: 'lab-1', title: 'IDE Setup, Print & Scanner I/O', isCompleted: false },
              { id: 'lab-2', title: 'Instantiating Objects & Loops', isCompleted: false }
            ]},
            { term: 'midterm', chapterTitle: 'Lab 5-6: Methods & Arrays', subTopics: [
              { id: 'lab-3', title: 'Overloading & Static Variables', isCompleted: false },
              { id: 'lab-4', title: '1D/2D Arrays, Searching', isCompleted: false }
            ]},
            { term: 'final', chapterTitle: 'Lab 7-10: OOP & Polymorphism', subTopics: [
              { id: 'lab-5', title: 'Constructors, Encapsulation', isCompleted: false },
              { id: 'lab-6', title: 'Abstract Classes & Interfaces', isCompleted: false }
            ]},
            { term: 'final', chapterTitle: 'Lab 11-12: Exceptions & I/O', subTopics: [
              { id: 'lab-7', title: 'Try-Catch & Custom Exceptions', isCompleted: false },
              { id: 'lab-8', title: 'File I/O (Read/Write)', isCompleted: false }
            ]}
          ]
        }
      ];

      // Note to AI: Replace setStudyCourses with the actual action/state setter
      // Since the user is using `actions.add` or similar in a custom useStore,
      // it's safer to just forcefully overwrite localStorage and dispatch the event
      localStorage.setItem('zenith_studyCourses', JSON.stringify(pristineCourses));
      window.dispatchEvent(new CustomEvent('zenith-store-update', { detail: STORES.studyCourses }));
      
      // Force page reload once to apply fresh state
      window.location.reload();
    }
  }, []);

  useEffect(() => {
    if (loading || !courses) return;

    // Check if CSE 1116 Lab exists, if not, add it with full syllabus
    if (!courses.some(c => c.title.includes('CSE 1116'))) {
      const oopLabCourse = {
        id: "cse-1116-lab-" + Date.now(),
        title: "CSE 1116: OOP Laboratory",
        subtitle: "Java Lab",
        icon: "Database",
        color: "secondary",
        isLab: true,
        attendedClasses: 0,
        schedule: [
          { day: "Tue", time: "08:30 AM - 11:00 AM", room: "426" }
        ],
        syllabus: [
          { term: 'midterm', chapterTitle: 'Lab 1-2: Java Basics', subTopics: [
            { id: 'lab-1', title: 'IDE Setup, Print & Data Types', isCompleted: false },
            { id: 'lab-2', title: 'Operators & Scanner I/O', isCompleted: false }
          ]},
          { term: 'midterm', chapterTitle: 'Lab 3-4: Classes & Control Flow', subTopics: [
            { id: 'lab-3', title: 'Instantiating Objects & Basic Methods', isCompleted: false },
            { id: 'lab-4', title: 'If-Else, Switch, For & While Loops', isCompleted: false }
          ]},
          { term: 'midterm', chapterTitle: 'Lab 5-6: Methods & Arrays', subTopics: [
            { id: 'lab-5', title: 'Method Overloading & Static Variables', isCompleted: false },
            { id: 'lab-6', title: '1D/2D Arrays, Searching & Sorting', isCompleted: false }
          ]},
          { term: 'final', chapterTitle: 'Lab 7-8: Advanced OOP', subTopics: [
            { id: 'lab-7', title: 'Constructors, Encapsulation & Composition', isCompleted: false },
            { id: 'lab-8', title: 'Inheritance & Method Overriding', isCompleted: false }
          ]},
          { term: 'final', chapterTitle: 'Lab 9-10: Polymorphism', subTopics: [
            { id: 'lab-9', title: 'Abstract Classes & Dynamic Dispatch', isCompleted: false },
            { id: 'lab-10', title: 'Implementing Multiple Interfaces', isCompleted: false }
          ]},
          { term: 'final', chapterTitle: 'Lab 11-12: Exceptions & I/O', subTopics: [
            { id: 'lab-11', title: 'Try-Catch & Custom Exceptions', isCompleted: false },
            { id: 'lab-12', title: 'File I/O (Read/Write)', isCompleted: false }
          ]}
        ]
      };
      
      // Add the course using the actions object
      actions.add(oopLabCourse as any);
    }
  }, [courses, loading, actions]);

  useEffect(() => {
    // Only run when data is loaded
    if (loading || courses === undefined) return;

    // 1. Fix Electronics Lab
    const eee2124 = courses.find((c: any) => c.title.includes('EEE 2124'));
    if (eee2124 && !eee2124.isLab) {
      actions.update(eee2124.id!, { isLab: true });
    }

    const mathCourse = courses.find((c: any) => c.title.includes('MATH 1151'));
    
    const fullOfficialSyllabus = [
      { term: 'midterm', chapterTitle: 'Ch 0: Functions', subTopics: [
        { id: 'm1-1', title: '0.1-0.2 Definition, Domain & Range', isCompleted: false },
        { id: 'm1-2', title: '0.3-0.5 Function Families (Exponential, Log)', isCompleted: false },
        { id: 'm1-3', title: '0.2 Translation, Reflection, Even & Odd', isCompleted: false }
      ]},
      { term: 'midterm', chapterTitle: 'Ch 1 & 2: Limits, Continuity & Derivative', subTopics: [
        { id: 'm1-4', title: '1.1-1.3 Informal Limits', isCompleted: false },
        { id: 'm1-5', title: '1.5 Continuity & Differentiability', isCompleted: false },
        { id: 'm1-6', title: '2.1 Tangent Line & Rates of Change', isCompleted: false },
        { id: 'm1-7', title: '2.6 The Chain Rule', isCompleted: false }
      ]},
      { term: 'final', chapterTitle: 'Ch 5 & 6: Integration & Applications', subTopics: [
        { id: 'm1-8', title: '5.1-5.3 Indefinite Integral & Substitution', isCompleted: false },
        { id: 'm1-9', title: '5.5-5.6 Definite Integral & Fundamental Theorem', isCompleted: false },
        { id: 'm1-10', title: '6.1 Area between two curves', isCompleted: false },
        { id: 'm1-11', title: '6.4 Arc Length', isCompleted: false }
      ]},
      { term: 'final', chapterTitle: 'Ch 7: Integration Techniques', subTopics: [
        { id: 'm1-12', title: '7.2 Integration by Parts', isCompleted: false },
        { id: 'm1-13', title: '7.4 Trigonometric Substitution', isCompleted: false }
      ]}
    ];

    const freshPractice = [
      { id: 'p-1', term: 'midterm', title: 'Q1-Q6: Midterm Practice Set (Spring 2024)', isDone: false },
      { id: 'p-2', term: 'midterm', title: 'Central Review Worksheet', isDone: false },
      { id: 'p-3', term: 'final', title: 'Final Exam Practice Problems (Spring 2024)', isDone: false }
    ];

    if (!mathCourse) {
      actions.add({
        id: "math-1151-" + Date.now(),
        title: "MATH 1151: Fundamental Calculus",
        subtitle: "Anton Calculus 10th Ed",
        icon: "Calculator",
        color: "blue",
        isLab: false,
        attendedClasses: 0,
        syllabus: fullOfficialSyllabus,
        practice: freshPractice
      } as any);
    } else {
      // Safely check if we need to force the update to avoid infinite loops
      const needsUpdate = !mathCourse.practice || !mathCourse.practice[0]?.term || mathCourse.syllabus?.[0]?.subTopics?.[0]?.title !== '0.1-0.2 Definition, Domain & Range';
      if (needsUpdate) {
        actions.update(mathCourse.id!, { 
            syllabus: fullOfficialSyllabus,
            practice: freshPractice 
        });
      }
    }
  }, [courses, loading, actions]);

  useEffect(() => {
    if (loading || !courses.length) return;
    const daysMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const todayStr = daysMap[currentTime.getDay()];
    const todayStamp = currentTime.toLocaleDateString('en-CA');

    courses.forEach(course => {
      const globalClasses = (studySchedule || []).filter((s: any) => s.day === todayStr && s.course === course.title);
      const courseLocalClasses = (course.schedule || []).filter((s: any) => s.day === todayStr);
      const todayClassesForCourse = courseLocalClasses.length > 0 ? courseLocalClasses : globalClasses;
      const endedClass = todayClassesForCourse.find(c => getClassStatus(c.time, currentTime) === 'ended');
      
      if (endedClass && course.last_auto_increment_date !== todayStamp) {
        const isLab = course.title.toLowerCase().includes('lab') || course.title.toLowerCase().includes('laboratory');
        const maxClasses = isLab ? 12 : 24;
        const currentCompleted = course.completedClasses || 0;
        
        if (currentCompleted < maxClasses) {
          actions.update(course.id!, {
            completedClasses: currentCompleted + 1,
            last_auto_increment_date: todayStamp
          });
        } else {
          actions.update(course.id!, { last_auto_increment_date: todayStamp });
        }
      }
    });
  }, [currentTime, courses, loading, actions]);



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

  const handleAddTopic = async () => {
    if (!activeCourse || !newTopic.trim() || activeCourse.id === undefined) return;
    const term = activeCourse.term || 'midterm';
    const topic = { id: Date.now().toString(), title: newTopic.trim(), isDone: false, term };
    const topics = [...(activeCourse.topics || []), topic];
    try {
      await actions.update(activeCourse.id, { topics });
      setNewTopic('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleTopic = (topicId: string) => {
    if (!activeCourse || activeCourse.id === undefined) return;
    const topics = (activeCourse.topics || []).map(t => t.id === topicId ? { ...t, isDone: !t.isDone } : t);
    actions.update(activeCourse.id, { topics });
  };

  const handleToggleSyllabusSubTopic = (chapterIndex: number, subTopicId: string) => {
    if (!activeCourse || !activeCourse.syllabus || activeCourse.id === undefined) return;
    const term = activeCourse.term || 'midterm';
    
    // Create a deep copy of the syllabus
    const newSyllabus = JSON.parse(JSON.stringify(activeCourse.syllabus));
    const termChapters = newSyllabus.filter((s: any) => s.term === term);
    
    if (termChapters[chapterIndex]) {
      const subTopic = termChapters[chapterIndex].subTopics.find((st: any) => st.id === subTopicId);
      if (subTopic) {
        subTopic.isCompleted = !subTopic.isCompleted;
      }
    }
    
    actions.update(activeCourse.id, { syllabus: newSyllabus });
  };

  const handleAddNote = async () => {
    if (!activeCourse || !newNote.trim() || activeCourse.id === undefined) return;
    const note = { id: Date.now().toString(), content: newNote.trim(), date: new Date().toISOString() };
    const notes = [...(activeCourse.notes || []), note];
    try {
      await actions.update(activeCourse.id, { notes });
      setNewNote('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddExam = async () => {
    if (!activeCourse || !newExamTitle.trim() || !newExamDate || activeCourse.id === undefined) return;
    const exam = { id: Date.now().toString(), title: newExamTitle.trim(), date: newExamDate };
    const exams = [...(activeCourse.exams || []), exam];
    try {
      await actions.update(activeCourse.id, { exams });
      setNewExamTitle('');
      setNewExamDate('');
    } catch (err) {
      console.error(err);
    }
  };

  const renderActiveCourse = () => {
    if (!activeCourse) return null;

    return (
      <div className="col-span-12 flex flex-col gap-8 relative z-10 w-full">
        <div className="flex items-center gap-4">
          <button onClick={() => setActiveCourseId(null)} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-on-surface">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h2 className="text-4xl md:text-[40px] font-bold text-on-surface leading-none tracking-tight break-words">{activeCourse.title}</h2>
            <p className="text-primary mt-1">{activeCourse.subtitle}</p>
          </div>
          <div className="bg-surface-container/50 border border-white/10 rounded-full p-1 flex">
            <button 
              onClick={() => actions.update(activeCourse.id!, { term: 'midterm' })}
              className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-widest transition-colors ${(!activeCourse.term || activeCourse.term === 'midterm') ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              Midterm
            </button>
            <button 
              onClick={() => actions.update(activeCourse.id!, { term: 'final' })}
              className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-widest transition-colors ${activeCourse.term === 'final' ? 'bg-secondary text-on-primary shadow-lg shadow-secondary/20' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              Final
            </button>
          </div>
        </div>

        <div className="bg-surface-container/30 rounded-[32px] overflow-hidden border border-white/5 glass-edge shadow-lg flex flex-col w-full">
          <div className="flex border-b border-white/5 w-full overflow-x-auto">
            {['topics', 'notes', 'exams', 'marks', 'practice'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`shrink-0 px-4 flex-1 py-4 text-center text-sm font-medium uppercase tracking-widest transition-colors ${
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
                {(() => {
                  const currentTerm = activeCourse.term || 'midterm';
                  const hasSyllabus = activeCourse.syllabus && activeCourse.syllabus.length > 0;
                  
                  let completedCount = 0;
                  let totalCount = 0;
                  let termTopics: any[] = (activeCourse.topics || []).filter((t: any) => !t.term || (t.term || '').toLowerCase() === (currentTerm || '').toLowerCase());
                  let termSyllabus: any[] = [];
                  
                  completedCount = termTopics.filter((t: any) => t.isDone).length;
                  totalCount = termTopics.length;
                  
                  if (hasSyllabus) {
                    termSyllabus = activeCourse.syllabus!.filter((s: any) => (s.term || '').toLowerCase() === (currentTerm || '').toLowerCase());
                    termSyllabus.forEach((chapter: any) => {
                      totalCount += chapter.subTopics.length;
                      completedCount += chapter.subTopics.filter((st: any) => st.isCompleted).length;
                    });
                  }
                  
                  return (
                    <>
                      {totalCount > 0 && (
                        <div className="flex flex-col gap-2 mb-2">
                          <div className="flex justify-between items-center text-sm font-semibold uppercase tracking-widest text-on-surface-variant">
                            <span>Syllabus Progress ({currentTerm})</span>
                            <span className={currentTerm === 'midterm' ? 'text-primary' : 'text-secondary'}>{Math.round((completedCount / totalCount) * 100)}%</span>
                          </div>
                          <div className="w-full bg-black/20 rounded-full h-2 overflow-hidden shadow-inner border border-white/5">
                            <div className={`${currentTerm === 'midterm' ? 'bg-primary shadow-[0_0_10px_rgba(255,255,255,0.2)]' : 'bg-secondary shadow-[0_0_10px_rgba(255,255,255,0.2)]'} h-full transition-all duration-1000 relative`} style={{ width: `${(completedCount / totalCount) * 100}%` }}>
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20"></div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <form onSubmit={(e) => { e.preventDefault(); handleAddTopic(); }} className="flex flex-col sm:flex-row flex-wrap gap-4 mb-4">
                        <input
                          type="text"
                          value={newTopic}
                          onChange={(e) => setNewTopic(e.target.value)}
                          placeholder={`New topic for ${currentTerm}...`}
                          className={`flex-1 w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-on-surface outline-none transition-colors ${currentTerm === 'midterm' ? 'focus:border-primary/50' : 'focus:border-secondary/50'}`}
                        />
                        <button type="submit" className={`w-full sm:w-auto px-6 py-3 rounded-xl text-on-primary font-medium transition-colors flex items-center justify-center gap-2 ${currentTerm === 'midterm' ? 'bg-primary hover:bg-primary/90' : 'bg-secondary hover:bg-secondary/90'}`}>
                          <Plus className="w-5 h-5" /> Add
                        </button>
                      </form>

                      <div className="flex flex-col gap-4">
                        {hasSyllabus && (
                          <div className="mt-6 space-y-6 w-full">
                            {termSyllabus.map((chapter: any, chapterIndex: number) => (
                              <div key={chapterIndex} className="bg-surface-container-low/30 p-4 rounded-2xl border border-white/5 w-full">
                                {/* Chapter Title */}
                                <h4 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: currentTerm === 'midterm' ? 'rgba(var(--primary-rgb), 1)' : 'rgba(var(--secondary-rgb), 1)' }}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${currentTerm === 'midterm' ? 'bg-primary' : 'bg-secondary'}`}></span>
                                  {chapter.chapterTitle}
                                </h4>
                                
                                {/* Sub-Topics List */}
                                <div className="space-y-2 pl-3 border-l-2 border-white/10 ml-[3px] w-full">
                                  {chapter.subTopics && chapter.subTopics.map((subTopic: any) => (
                                    <div 
                                      key={subTopic.id} 
                                      onClick={() => handleToggleSyllabusSubTopic(chapterIndex, subTopic.id)}
                                      className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer group w-full"
                                    >
                                      {/* Checkbox */}
                                      <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors shrink-0 ${subTopic.isCompleted ? (currentTerm === 'midterm' ? 'bg-primary border-primary text-on-primary' : 'bg-secondary border-secondary text-on-primary') : `border-gray-500 border group-hover:border-${currentTerm === 'midterm' ? 'primary' : 'secondary'}/50`}`}>
                                        {subTopic.isCompleted && (
                                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                        )}
                                      </div>
                                      {/* Topic Title */}
                                      <span className={`text-sm transition-all flex-1 ${subTopic.isCompleted ? 'text-gray-500 line-through' : 'text-gray-200 group-hover:text-white'}`}>
                                        {subTopic.title}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {termTopics.length > 0 && (
                          <div className={hasSyllabus ? "mt-4 space-y-2 w-full pt-4 border-t border-white/10" : "space-y-2 w-full"}>
                            {termTopics.map((topic: any) => (
                              <div key={topic.id} className={`flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/5 transition-all group ${topic.isDone ? 'opacity-50' : ''}`}>
                                <button 
                                  onClick={() => handleToggleTopic(topic.id)}
                                  className={`w-6 h-6 rounded border flex items-center justify-center transition-colors shrink-0 ${topic.isDone ? (currentTerm === 'midterm' ? 'bg-primary border-primary text-on-primary' : 'bg-secondary border-secondary text-on-primary') : `border-white/20 hover:border-${currentTerm === 'midterm' ? 'primary' : 'secondary'}/50 text-transparent`}`}
                                >
                                  <svg className={`w-4 h-4 ${topic.isDone ? 'block' : 'hidden'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                </button>
                                <span className={`text-[16px] flex-1 ${topic.isDone ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>{topic.title}</span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setTopicToDelete(topic.id); }}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 rounded-lg hover:bg-red-500/20 flex items-center justify-center text-on-surface-variant hover:text-red-400 shrink-0"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        {totalCount === 0 && (
                          <p className="text-on-surface-variant/50 text-center py-8">No topics added for {currentTerm} yet.</p>
                        )}
                      </div>
                    </>
                  );
                })()}
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
            {activeTab === 'marks' && (() => {
              const currentTerm = activeCourse.term || 'midterm';
              const marks = activeCourse.marksTracker?.[currentTerm] || { classTests: [], missedClasses: 0, assignment: 0, midExam: 0, finalExam: 0, classPerformance: 0 };
              const isLab = activeCourse.title.toLowerCase().includes('lab') || activeCourse.title.toLowerCase().includes('laboratory');
              
              const updateMarks = (field: string, value: any) => {
                const newMarks: any = { ...activeCourse.marksTracker };
                if (!newMarks[currentTerm]) newMarks[currentTerm] = { classTests: [], missedClasses: 0, assignment: 0, midExam: 0, finalExam: 0, classPerformance: 0 };
                newMarks[currentTerm][field] = value;
                actions.update(activeCourse.id!, { marksTracker: newMarks });
              };

              let totalMarks = 0;
              let attendanceScore = 5;
              const missed = marks.missedClasses || 0;

              if (isLab) {
                if (missed >= 5) attendanceScore = 3;
                else if (missed >= 3) attendanceScore = 4;
                
                totalMarks += (marks.classPerformance || 0) + attendanceScore + (marks.assignment || 0) + ((marks.classTests && marks.classTests[0]) || 0) + (marks.midExam || 0) + (marks.finalExam || 0);
              } else {
                if (missed >= 4) attendanceScore = 4;
                
                const cts = [...(marks.classTests || [])].map(v => Number(v) || 0).sort((a,b) => b - a).slice(0, 3);
                const ctSum = cts.reduce((a,b) => a + b, 0);
                
                totalMarks += ctSum + attendanceScore + (marks.assignment || 0) + (marks.midExam || 0) + (marks.finalExam || 0);
              }

              const InputRow = ({ label, value, onChange, max }: any) => (
                <div className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
                  <span className="text-on-surface-variant font-medium">{label} <span className="text-[10px] text-on-surface-variant/50 ml-1">(Max {max})</span></span>
                  <input type="number" min="0" max={max} value={value || ''} onChange={e => onChange(Number(e.target.value))} className="w-20 bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-on-surface text-center outline-none focus:border-primary/50 transition-colors" />
                </div>
              );

              return (
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="flex-1 bg-surface-container-low/50 rounded-2xl p-6 border border-white/5 shadow-inner">
                    <h3 className="text-xl font-bold text-on-surface mb-6 flex items-center gap-2">
                      <Calculator className="w-5 h-5 text-primary" />
                      {isLab ? 'Lab' : 'Theory'} Assessment
                    </h3>
                    
                    <div className="flex flex-col">
                      {isLab && <InputRow label="Class Performance" max={30} value={marks.classPerformance} onChange={(v: number) => updateMarks('classPerformance', v)} />}
                      
                      <div className="flex justify-between items-center py-3 border-b border-white/5">
                        <span className="text-on-surface-variant font-medium">Missed Classes <span className="text-[10px] text-on-surface-variant/50 ml-1">(Score: {attendanceScore}/5)</span></span>
                        <input type="number" min="0" value={marks.missedClasses || ''} onChange={e => updateMarks('missedClasses', Number(e.target.value))} className="w-20 bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-on-surface text-center outline-none focus:border-primary/50 transition-colors" />
                      </div>

                      <InputRow label="Assignment" max={5} value={marks.assignment} onChange={(v: number) => updateMarks('assignment', v)} />
                      
                      {isLab ? (
                        <InputRow label="Class Test" max={20} value={marks.classTests?.[0]} onChange={(v: number) => updateMarks('classTests', [v])} />
                      ) : (
                        <div className="py-3 border-b border-white/5">
                          <span className="text-on-surface-variant font-medium mb-3 block">Class Tests <span className="text-[10px] text-on-surface-variant/50 ml-1">(Best 3 of 4, Max 20)</span></span>
                          <div className="grid grid-cols-4 gap-2">
                            {[0, 1, 2, 3].map(i => (
                              <input key={i} type="number" min="0" max="20" placeholder={`CT${i+1}`} value={marks.classTests?.[i] ?? ''} 
                                onChange={e => {
                                  const newCts = [...(marks.classTests || [])];
                                  newCts[i] = Number(e.target.value);
                                  updateMarks('classTests', newCts);
                                }} 
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-2 py-1.5 text-on-surface text-center outline-none focus:border-primary/50 transition-colors" 
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      <InputRow label="Mid Exam" max={isLab ? 20 : 30} value={marks.midExam} onChange={(v: number) => updateMarks('midExam', v)} />
                      <InputRow label="Final Exam" max={isLab ? 20 : 40} value={marks.finalExam} onChange={(v: number) => updateMarks('finalExam', v)} />
                    </div>
                  </div>

                  <div className="w-full md:w-64 shrink-0 flex flex-col gap-4">
                    <div className="bg-gradient-to-br from-surface-container to-surface-container-high rounded-2xl p-6 border border-white/10 shadow-xl flex flex-col items-center justify-center relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full"></div>
                      <h4 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-2 relative z-10">Total Marks</h4>
                      <div className="flex items-baseline gap-1 relative z-10">
                        <span className={`text-6xl font-black ${totalMarks >= 80 ? 'text-green-400' : totalMarks >= 60 ? 'text-primary' : 'text-on-surface'}`}>{totalMarks}</span>
                        <span className="text-on-surface-variant text-xl font-bold">/100</span>
                      </div>
                      <div className="mt-4 text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full bg-black/20 text-on-surface-variant border border-white/5">
                        {currentTerm} Term
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {activeTab === 'practice' && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-on-surface">Practice Problems</h3>
                
                {/* Midterm Practice */}
                <div>
                  <h4 className="text-sm font-bold text-primary mb-3">Midterm Practice</h4>
                  <div className="space-y-2">
                      <div className="p-3 rounded-xl bg-white/5 border border-white/5">Central Review Worksheet (Math 1151)</div>
                      <div className="p-3 rounded-xl bg-white/5 border border-white/5">Mid Exam Practice Problems (Spring 2024)</div>
                  </div>
                </div>

                {/* Final Practice */}
                <div>
                  <h4 className="text-sm font-bold text-secondary mb-3">Final Practice</h4>
                  <div className="space-y-2">
                      <div className="p-3 rounded-xl bg-white/5 border border-white/5">Final Exam Practice Problems (Spring 2024)</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative overflow-x-hidden overflow-y-auto box-border z-0 h-full w-full flex-1 flex flex-col">
      <div 
        className="fixed inset-0 bg-cover bg-center mix-blend-overlay opacity-40 pointer-events-none z-[-2]"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=2560&auto=format&fit=crop')" }}
      ></div>
      <div className="fixed inset-0 bg-black/60 pointer-events-none z-[-1]"></div>

      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
        className="max-w-6xl w-full mx-auto grid grid-cols-12 gap-4 md:gap-8 relative z-10 flex-1"
      >
        {activeCourse ? renderActiveCourse() : (
          <>
            <div className="col-span-12 relative z-10 mb-2">
              <h2 className="text-5xl md:text-[64px] font-bold text-on-surface tracking-tight mb-2 leading-none break-words">Deep Work</h2>
              <p className="text-[18px] text-primary">10-Hour Intensive Routine Active</p>
            </div>

            <ClassRoutineWidget />

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
                  {courses.map((course) => {
                    const daysMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                    const todayStr = daysMap[currentTime.getDay()];
                    
                    const globalClasses = (studySchedule || []).filter((s: any) => s.day === todayStr && s.course === course.title);
                    const courseLocalClasses = (course.schedule || []).filter((s: any) => s.day === todayStr);
                    const todayClassesForCourse = courseLocalClasses.length > 0 ? courseLocalClasses : globalClasses;

                    const currentTimeMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
                    const extractStartEndTimes = (timeStr: string) => {
                      if (!timeStr) return { startMins: -1, endMins: -1 };
                      const regex = /(\d{1,2})\D*(\d{2})\D*(AM|PM)/gi;
                      const matches = [...timeStr.matchAll(regex)];
                      
                      if (matches.length === 0) return { startMins: -1, endMins: -1 };
                      
                      const parseMatch = (m: RegExpMatchArray) => {
                          let h = parseInt(m[1], 10);
                          let min = parseInt(m[2], 10);
                          let p = m[3].toUpperCase();
                          if (p === 'PM' && h !== 12) h += 12;
                          if (p === 'AM' && h === 12) h = 0;
                          return h * 60 + min;
                      };

                      const startMins = parseMatch(matches[0]);
                      const endMins = matches.length > 1 ? parseMatch(matches[matches.length - 1]) : startMins;

                      return { startMins, endMins };
                    };

                    let classStatus: 'ongoing' | 'upcoming' | 'completed' | null = null;
                    
                    todayClassesForCourse.forEach((s: any) => {
                      const { startMins, endMins } = extractStartEndTimes(s.time);
                      
                      if (startMins !== -1 && endMins !== -1) {
                        if (currentTimeMinutes >= startMins && currentTimeMinutes <= endMins) {
                          classStatus = 'ongoing';
                        } else if (currentTimeMinutes < startMins && classStatus !== 'ongoing') {
                          classStatus = 'upcoming';
                        } else if (currentTimeMinutes > endMins && classStatus !== 'ongoing' && classStatus !== 'upcoming') {
                          classStatus = 'completed';
                        }
                      }
                    });

                    let badgeUI = null;
                    if (classStatus === 'ongoing') {
                       badgeUI = (
                          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/20 border border-primary/30 text-primary text-[10px] font-bold uppercase tracking-widest shadow-[0_0_10px_rgba(var(--primary-rgb),0.2)]">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                            Class Now
                          </span>
                       );
                    } else if (classStatus === 'upcoming') {
                       badgeUI = (
                          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary/20 border border-secondary/30 text-secondary text-[10px] font-bold uppercase tracking-widest">
                            Upcoming Today
                          </span>
                       );
                    } else if (classStatus === 'completed') {
                       badgeUI = (
                          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-on-surface-variant/50 text-[10px] font-bold uppercase tracking-widest">
                            Class Ended
                          </span>
                       );
                    }

                    const currentTerm = course.term || 'midterm';
                    
                    // Calculate Attendance Percentage
                    const maxClasses = course.isLab ? 12 : 24;
                    const attendedCount = course.attendedClasses || course.completedClasses || 0;
                    const attendancePercentage = Math.min(100, Math.max(0, (attendedCount / maxClasses) * 100));

                    // Calculate Syllabus Percentage (assuming course.syllabus holds the topics)
                    let totalTopics = 0;
                    let completedTopics = 0;
                    if (course.syllabus && course.syllabus.length > 0) {
                      // If syllabus has nested subTopics
                      course.syllabus.forEach((chapter: any) => {
                        if (chapter.subTopics) {
                          totalTopics += chapter.subTopics.length;
                          completedTopics += chapter.subTopics.filter((topic: any) => topic.isCompleted).length;
                        }
                      });
                    } else {
                      const termTopics = (course.topics || []).filter((t: any) => !t.term || t.term === currentTerm);
                      totalTopics = termTopics.length;
                      completedTopics = termTopics.filter((t: any) => t.isDone).length;
                    }
                    const syllabusPercentage = totalTopics === 0 ? 0 : Math.min(100, Math.max(0, (completedTopics / totalTopics) * 100));

                    return (
                    <div
                      key={course.id}
                      className="flex flex-col gap-3 p-5 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group relative"
                      onClick={() => setActiveCourseId(course.id!)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl bg-${course.color}/20 flex items-center justify-center text-${course.color}`}>
                          {getIcon(course.icon)}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-[18px] text-on-surface flex items-center flex-wrap gap-2">
                            {course.title}
                            {badgeUI}
                          </h4>
                          <p className="text-[12px] text-on-surface-variant font-semibold tracking-widest uppercase mt-0.5">{course.subtitle}</p>
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

                      <div className="flex flex-col gap-4 mt-2">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex justify-between items-center text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                             <span>Syllabus Progress ({currentTerm})</span>
                             <span>{completedTopics} / {totalTopics} Topics</span>
                          </div>
                          <div className="w-full bg-black/20 rounded-full h-1.5 overflow-hidden shadow-inner">
                             <div className={`bg-${course.color}-500 bg-${course.color} opacity-70 h-full transition-all duration-500`} style={{ width: `${syllabusPercentage}%`, backgroundColor: course.color === 'green' ? '#22c55e' : course.color === 'yellow' ? '#eab308' : course.color === 'blue' ? '#3b82f6' : course.color === 'red' ? '#ef4444' : course.color === 'purple' ? '#a855f7' : '' }}></div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5 pt-2 border-t border-white/5">
                          <div className="flex justify-between items-center text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                             <span className="flex items-center gap-1">Attendance <span className="text-[9px] lowercase opacity-50">(Oct 22)</span></span>
                             <div className="flex items-center gap-1.5">
                               <span>{attendedCount} / {maxClasses}</span>
                               <div className="flex items-center gap-0.5 ml-1">
                                 <button 
                                   onClick={(e) => { 
                                     e.stopPropagation(); 
                                     const newVal = Math.max(0, attendedCount - 1);
                                     actions.update(course.id!, { attendedClasses: newVal, completedClasses: newVal });
                                   }}
                                   disabled={attendedCount <= 0}
                                   className="w-5 h-5 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center text-on-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                 >
                                   <Minus className="w-3 h-3" />
                                 </button>
                                 <button 
                                   onClick={(e) => { 
                                     e.stopPropagation(); 
                                     const newVal = Math.min(maxClasses, attendedCount + 1);
                                     actions.update(course.id!, { attendedClasses: newVal, completedClasses: newVal });
                                   }}
                                   disabled={attendedCount >= maxClasses}
                                   className="w-5 h-5 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center text-on-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                 >
                                   <Plus className="w-3 h-3" />
                                 </button>
                               </div>
                             </div>
                          </div>
                          <div className="w-full bg-black/20 rounded-full h-1.5 overflow-hidden shadow-inner">
                             <div className={`bg-${course.color}-500 bg-${course.color} h-full transition-all duration-500`} style={{ width: `${attendancePercentage}%`, backgroundColor: course.color === 'green' ? '#22c55e' : course.color === 'yellow' ? '#eab308' : course.color === 'blue' ? '#3b82f6' : course.color === 'red' ? '#ef4444' : course.color === 'purple' ? '#a855f7' : '' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )})}
                </div>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-4 flex flex-col gap-8 relative z-10">
              <TimerWidget />
            </div>
          </>
        )}

        <ConfirmModal
          isOpen={topicToDelete !== null}
          onClose={() => setTopicToDelete(null)}
          onConfirm={() => {
            if (activeCourse && activeCourse.id !== undefined && topicToDelete) {
              const topics = (activeCourse.topics || []).filter(t => t.id !== topicToDelete);
              actions.update(activeCourse.id, { topics });
            }
            setTopicToDelete(null);
          }}
          title="Delete Topic"
          message="Are you sure you want to delete this topic?"
        />

        <ConfirmModal
          isOpen={courseToDelete !== null}
          onClose={() => setCourseToDelete(null)}
          onConfirm={() => {
            if (courseToDelete) {
              actions.remove(courseToDelete);
              if (activeCourseId === courseToDelete) setActiveCourseId(null);
            }
            setCourseToDelete(null);
          }}
          title="Delete Course"
          message="Delete this course? All syllabus and marks data will be lost."
        />

        <FormModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSubmit={async (data) => {
            const courseTitle = data.title as string;
            await actions.add({
              title: courseTitle,
              subtitle: data.subtitle as string,
              icon: data.icon as string,
              color: data.color as string,
              topics: [],
              notes: [],
              exams: [],
              midtermClasses: 0,
              finalClasses: 0,
              completedClasses: 0,
              term: 'midterm',
              marksTracker: {
                midterm: { classTests: [], missedClasses: 0, assignment: 0, midExam: 0, classPerformance: 0 },
                final: { classTests: [], missedClasses: 0, assignment: 0, finalExam: 0, classPerformance: 0 }
              }
            });
            if (data.scheduleDay && data.scheduleStartTime && data.scheduleEndTime) {
              await scheduleActions.add({
                course: courseTitle,
                day: data.scheduleDay as string,
                time: `${data.scheduleStartTime} - ${data.scheduleEndTime}`,
                room: (data.scheduleRoom as string) || 'TBA',
                type: courseTitle.toLowerCase().includes('lab') || courseTitle.toLowerCase().includes('laboratory') ? 'Lab' : 'Theory'
              });
            }
            setShowAddModal(false);
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
            {
              name: 'scheduleDay',
              label: 'Schedule Day',
              type: 'select',
              required: false,
              defaultValue: 'Sun',
              options: [
                { value: 'Sun', label: 'Sunday' },
                { value: 'Mon', label: 'Monday' },
                { value: 'Tue', label: 'Tuesday' },
                { value: 'Wed', label: 'Wednesday' },
                { value: 'Thu', label: 'Thursday' },
                { value: 'Fri', label: 'Friday' },
                { value: 'Sat', label: 'Saturday' },
              ],
            },
            { name: 'scheduleStartTime', label: 'Start Time', type: 'text', required: false, placeholder: 'e.g. 10:00AM' },
            { name: 'scheduleEndTime', label: 'End Time', type: 'text', required: false, placeholder: 'e.g. 11:30AM' },
            { name: 'scheduleRoom', label: 'Room', type: 'text', required: false, placeholder: 'e.g. 302' },
          ]}
        />
      </motion.div>
    </div>
  );
}
