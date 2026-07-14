import { doc, getDoc, setDoc, collection, getDocs, addDoc } from 'firebase/firestore';
import { db, auth } from './firebase';

export const STORES = {
  settings: 'settings',
  tasks: 'tasks',
  taskQueue: 'task_queue',
  expenses: 'expenses',
  skillsCourses: 'skills_courses',
  skillsNotes: 'skills_notes',
  sportsExercises: 'sports_exercises',
  libraryBooks: 'library_books',
  libraryPassages: 'library_passages',
  spiritualPrayers: 'spiritual_prayers',
  spiritualLiterature: 'spiritual_literature',
  dietEntries: 'diet_entries',
  dietMeals: 'diet_meals',
  studyCourses: 'study_courses',
  studySchedule: 'study_schedule',
} as const;

export type StoreName = (typeof STORES)[keyof typeof STORES];

const generateId = () => {
  return Date.now().toString() + Math.random().toString(36).substring(2, 9);
};

export function seedUserRoutine(email: string) {
  if (email !== 'shaikh.jubair.2025@gmail.com') return;

  const coursesKey = 'zenith_study_courses';
  const scheduleKey = 'zenith_study_schedule';
  
  const existingCourses = localStorage.getItem(coursesKey);
  
  if (!existingCourses || existingCourses === '[]') {
    const courses = [
      { id: generateId(), title: 'MATH 1151: Fundamental Calculus', subtitle: 'Theory', icon: 'Calculator', color: 'blue', midtermClasses: 12, finalClasses: 12 },
      { 
        id: generateId(), 
        title: 'EEE 2113: Electrical Circuits', 
        subtitle: 'Theory', 
        icon: 'Cpu', 
        color: 'yellow', 
        midtermClasses: 12, 
        finalClasses: 12,
        syllabus: [
          // MIDTERM TOPICS
          {
            term: 'midterm',
            chapterTitle: 'Chapter 1: Basic Concepts',
            subTopics: [
              { id: '1.1', title: '1.1-1.2 Systems of Units & Charge and Current', isCompleted: false },
              { id: '1.2', title: '1.3-1.4 Voltage, Power and Energy', isCompleted: false },
              { id: '1.3', title: '1.5-1.6 Circuit Elements & Applications', isCompleted: false }
            ]
          },
          {
            term: 'midterm',
            chapterTitle: 'Chapter 2: Basic Laws',
            subTopics: [
              { id: '2.1', title: '2.1-2.2 Ohm\'s Law', isCompleted: false },
              { id: '2.2', title: '2.3-2.4 Nodes, Branches, Loops & Kirchhoff\'s Laws', isCompleted: false },
              { id: '2.3', title: '2.5-2.6 Series and Parallel Resistors', isCompleted: false },
              { id: '2.4', title: '2.7-2.8 Wye-Delta Transformations', isCompleted: false }
            ]
          },
          {
            term: 'midterm',
            chapterTitle: 'Chapter 3: Methods of Analysis',
            subTopics: [
              { id: '3.1', title: '3.1-3.3 Nodal Analysis (with Voltage Sources)', isCompleted: false },
              { id: '3.2', title: '3.4-3.5 Mesh Analysis (with Current Sources)', isCompleted: false }
            ]
          },
          {
            term: 'midterm',
            chapterTitle: 'Chapter 4: Circuit Theorems',
            subTopics: [
              { id: '4.1', title: '4.1-4.2 Linearity Property & Superposition', isCompleted: false },
              { id: '4.2', title: '4.3-4.4 Source Transformation & Thevenin\'s Theorem', isCompleted: false },
              { id: '4.3', title: '4.5-4.8 Norton\'s Theorem & Maximum Power Transfer', isCompleted: false }
            ]
          },
          
          // FINAL TOPICS
          {
            term: 'final',
            chapterTitle: 'Chapter 6: Capacitors and Inductors',
            subTopics: [
              { id: '6.1', title: '6.1-6.3 Capacitors & Series/Parallel Capacitors', isCompleted: false },
              { id: '6.2', title: '6.4-6.5 Inductors & Series/Parallel Inductors', isCompleted: false }
            ]
          },
          {
            term: 'final',
            chapterTitle: 'Chapter 7: First-Order Circuits',
            subTopics: [
              { id: '7.1', title: '7.1-7.3 Source-Free RC and RL Circuits', isCompleted: false },
              { id: '7.2', title: '7.4-7.5 Singularity Functions & Step Response of RC', isCompleted: false },
              { id: '7.3', title: '7.6 Step Response of an RL Circuit', isCompleted: false }
            ]
          },
          {
            term: 'final',
            chapterTitle: 'Chapter 9: Sinusoids and Phasors',
            subTopics: [
              { id: '9.1', title: '9.1-9.3 Sinusoids & Phasors', isCompleted: false },
              { id: '9.2', title: '9.4-9.5 Phasor Relationships for Circuit Elements', isCompleted: false },
              { id: '9.3', title: '9.6-9.7 Impedance, Admittance & Kirchhoff\'s Laws in Frequency Domain', isCompleted: false }
            ]
          },
          {
            term: 'final',
            chapterTitle: 'Chapter 10: Sinusoidal Steady-State Analysis',
            subTopics: [
              { id: '10.1', title: '10.1-10.3 Nodal & Mesh Analysis', isCompleted: false },
              { id: '10.2', title: '10.4-10.6 Superposition, Thevenin & Norton Equivalent Circuits', isCompleted: false }
            ]
          },
          {
            term: 'final',
            chapterTitle: 'Chapter 11: AC Power Analysis',
            subTopics: [
              { id: '11.1', title: '11.1-11.3 Instantaneous, Average & Max Average Power Transfer', isCompleted: false },
              { id: '11.2', title: '11.4-11.6 Effective/RMS Value, Apparent Power & Power Factor', isCompleted: false }
            ]
          }
        ]
      },
      { id: generateId(), title: 'CSE 1115: Object Oriented Programming', subtitle: 'Theory', icon: 'Code2', color: 'green', midtermClasses: 12, finalClasses: 12 },
      { id: generateId(), title: 'CSE 1116: OOP Laboratory', subtitle: 'Lab', icon: 'Code2', color: 'green', midtermClasses: 6, finalClasses: 6 },
      { id: generateId(), title: 'EEE 2124: Electronics Laboratory', subtitle: 'Lab', icon: 'Cpu', color: 'yellow', midtermClasses: 6, finalClasses: 6 },
    ];
    
    const schedule = [
      { id: generateId(), course: 'MATH 1151: Fundamental Calculus', type: 'Theory', day: 'Sun', time: '09:51AM - 11:10AM', room: '731' },
      { id: generateId(), course: 'MATH 1151: Fundamental Calculus', type: 'Theory', day: 'Wed', time: '09:51AM - 11:10AM', room: '731' },
      
      { id: generateId(), course: 'EEE 2113: Electrical Circuits', type: 'Theory', day: 'Sun', time: '12:31PM - 01:50PM', room: '428' },
      { id: generateId(), course: 'EEE 2113: Electrical Circuits', type: 'Theory', day: 'Wed', time: '12:31PM - 01:50PM', room: '428' },
      
      { id: generateId(), course: 'CSE 1115: Object Oriented Programming', type: 'Theory', day: 'Sat', time: '03:11PM - 04:30PM', room: '305' },
      { id: generateId(), course: 'CSE 1115: Object Oriented Programming', type: 'Theory', day: 'Tue', time: '03:11PM - 04:30PM', room: '305' },
      
      { id: generateId(), course: 'CSE 1116: OOP Laboratory', type: 'Lab', day: 'Tue', time: '08:30AM - 11:00AM', room: '426' },
      
      { id: generateId(), course: 'EEE 2124: Electronics Laboratory', type: 'Lab', day: 'Wed', time: '02:00PM - 04:30PM', room: '504' }
    ];

    localStorage.setItem(coursesKey, JSON.stringify(courses));
    localStorage.setItem(scheduleKey, JSON.stringify(schedule));
    window.dispatchEvent(new CustomEvent('zenith-store-update', { detail: coursesKey }));
    window.dispatchEvent(new CustomEvent('zenith-store-update', { detail: scheduleKey }));
  }
}

// --- Settings helpers ---

export function getLocalApiKey(): string {
  const user = auth.currentUser;
  if (!user) return '';
  return localStorage.getItem(`GEMINI_API_KEY_${user?.uid}`) || '';
}

export function setLocalApiKey(key: string): void {
  const user = auth.currentUser;
  if (!user) return;
  if (!key) {
    localStorage.removeItem(`GEMINI_API_KEY_${user?.uid}`);
  } else {
    localStorage.setItem(`GEMINI_API_KEY_${user?.uid}`, key);
  }
}

export async function getSetting<T>(key: string): Promise<T | undefined> {
  const user = auth.currentUser;
  if (!user) return undefined;
  
  const docRef = doc(db, `users/${user?.uid}/settings`, key);
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) {
    return snapshot.data().value as T;
  }
  return undefined;
}

export async function setSetting<T>(key: string, value: T): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;
  
  const docRef = doc(db, `users/${user?.uid}/settings`, key);
  await setDoc(docRef, { value });
}

// --- Heatmap Data Engine ---
export interface HeatmapLog {
  [dateString: string]: {
    totalSecs: number;
    tasks: { title: string; secs: number }[];
  }
}

export async function logFocusTime(title: string, secs: number): Promise<void> {
  if (secs <= 0) return;
  const data = await getSetting<HeatmapLog>('focus_heatmap_data') || {};
  const today = new Date().toISOString().split('T')[0];
  
  if (!data[today]) {
    data[today] = { totalSecs: 0, tasks: [] };
  }
  
  data[today].totalSecs += secs;
  
  const existingTask = data[today].tasks.find(t => t.title === title);
  if (existingTask) {
    existingTask.secs += secs;
  } else {
    data[today].tasks.push({ title, secs });
  }
  
  await setSetting('focus_heatmap_data', data);
}

// --- Data Export & Import (Disabled for Firebase) ---

export async function exportData(): Promise<string> {
  return JSON.stringify({ message: "Export disabled in cloud mode." });
}

export async function importData(jsonString: string): Promise<void> {
  console.log("Import disabled in cloud mode.");
}

export function patchSyllabusData() {
  const coursesKey = 'zenith_study_courses';
  const existingCoursesStr = localStorage.getItem(coursesKey);
  if (!existingCoursesStr) return;
  try {
    const courses = JSON.parse(existingCoursesStr);
    let patched = false;
    for (let course of courses) {
      if (course.title.includes('EEE 2113') || course.title.includes('Electrical Circuits')) {
        if (!course.syllabus || course.syllabus.length === 0) {
          course.syllabus = [
            // MIDTERM TOPICS
            { term: 'midterm', chapterTitle: 'Chapter 1: Basic Concepts', subTopics: [ { id: '1.1', title: '1.1-1.2 Systems of Units & Charge and Current', isCompleted: false }, { id: '1.2', title: '1.3-1.4 Voltage, Power and Energy', isCompleted: false }, { id: '1.3', title: '1.5-1.6 Circuit Elements & Applications', isCompleted: false } ] },
            { term: 'midterm', chapterTitle: 'Chapter 2: Basic Laws', subTopics: [ { id: '2.1', title: '2.1-2.2 Ohm\'s Law', isCompleted: false }, { id: '2.2', title: '2.3-2.4 Nodes, Branches, Loops & Kirchhoff\'s Laws', isCompleted: false }, { id: '2.3', title: '2.5-2.6 Series and Parallel Resistors', isCompleted: false }, { id: '2.4', title: '2.7-2.8 Wye-Delta Transformations', isCompleted: false } ] },
            { term: 'midterm', chapterTitle: 'Chapter 3: Methods of Analysis', subTopics: [ { id: '3.1', title: '3.1-3.3 Nodal Analysis (with Voltage Sources)', isCompleted: false }, { id: '3.2', title: '3.4-3.5 Mesh Analysis (with Current Sources)', isCompleted: false } ] },
            { term: 'midterm', chapterTitle: 'Chapter 4: Circuit Theorems', subTopics: [ { id: '4.1', title: '4.1-4.2 Linearity Property & Superposition', isCompleted: false }, { id: '4.2', title: '4.3-4.4 Source Transformation & Thevenin\'s Theorem', isCompleted: false }, { id: '4.3', title: '4.5-4.8 Norton\'s Theorem & Maximum Power Transfer', isCompleted: false } ] },
            // FINAL TOPICS
            { term: 'final', chapterTitle: 'Chapter 6: Capacitors and Inductors', subTopics: [ { id: '6.1', title: '6.1-6.3 Capacitors & Series/Parallel Capacitors', isCompleted: false }, { id: '6.2', title: '6.4-6.5 Inductors & Series/Parallel Inductors', isCompleted: false } ] },
            { term: 'final', chapterTitle: 'Chapter 7: First-Order Circuits', subTopics: [ { id: '7.1', title: '7.1-7.3 Source-Free RC and RL Circuits', isCompleted: false }, { id: '7.2', title: '7.4-7.5 Singularity Functions & Step Response of RC', isCompleted: false }, { id: '7.3', title: '7.6 Step Response of an RL Circuit', isCompleted: false } ] },
            { term: 'final', chapterTitle: 'Chapter 9: Sinusoids and Phasors', subTopics: [ { id: '9.1', title: '9.1-9.3 Sinusoids & Phasors', isCompleted: false }, { id: '9.2', title: '9.4-9.5 Phasor Relationships for Circuit Elements', isCompleted: false }, { id: '9.3', title: '9.6-9.7 Impedance, Admittance & Kirchhoff\'s Laws in Frequency Domain', isCompleted: false } ] },
            { term: 'final', chapterTitle: 'Chapter 10: Sinusoidal Steady-State Analysis', subTopics: [ { id: '10.1', title: '10.1-10.3 Nodal & Mesh Analysis', isCompleted: false }, { id: '10.2', title: '10.4-10.6 Superposition, Thevenin & Norton Equivalent Circuits', isCompleted: false } ] },
            { term: 'final', chapterTitle: 'Chapter 11: AC Power Analysis', subTopics: [ { id: '11.1', title: '11.1-11.3 Instantaneous, Average & Max Average Power Transfer', isCompleted: false }, { id: '11.2', title: '11.4-11.6 Effective/RMS Value, Apparent Power & Power Factor', isCompleted: false } ] }
          ];
          patched = true;
        }
      }
    }
    if (patched) {
      localStorage.setItem(coursesKey, JSON.stringify(courses));
      window.dispatchEvent(new CustomEvent('zenith-store-update', { detail: coursesKey }));
      console.log("Patched EEE 2113 Syllabus successfully!");
    }
  } catch(e) {
    console.error("Failed to patch syllabus", e);
  }
}

export function patchOOPCourses() {
  try {
    const coursesKey = STORES.studyCourses;
    const existingStr = localStorage.getItem(coursesKey);
    if (!existingStr) return;
    
    let courses = JSON.parse(existingStr);
    
    // Check if already patched to avoid infinite patching
    if (courses.some((c: any) => c.id === 'cse-1115-theory')) return;
    
    // Filter out old OOP courses
    courses = courses.filter((c: any) => 
      !c.title.includes('CSE 1115') && 
      !c.title.includes('CSE 1116') && 
      !c.title.includes('Object Oriented Programming')
    );
    
    // Push new pristine objects
    courses.push({
      id: "cse-1115-theory",
      title: "CSE 1115: Object Oriented Programming",
      subtitle: "Theory",
      icon: "Code2",
      color: "green",
      isLab: false,
      midtermClasses: 12,
      finalClasses: 12,
      schedule: [
        { day: "Tue", time: "03:11 PM - 04:30 PM", room: "305" },
        { day: "Sat", time: "03:11 PM - 04:30 PM", room: "305" }
      ],
      progress: 0,
      marks: [],
      syllabus: []
    });
    
    courses.push({
      id: "cse-1116-lab",
      title: "CSE 1116: OOP Laboratory",
      subtitle: "Lab",
      icon: "Code2",
      color: "green",
      isLab: true,
      midtermClasses: 6,
      finalClasses: 6,
      schedule: [
        { day: "Tue", time: "08:30 AM - 11:00 AM", room: "426" }
      ],
      progress: 0,
      marks: [],
      syllabus: []
    });
    
    localStorage.setItem(coursesKey, JSON.stringify(courses));
    window.dispatchEvent(new CustomEvent('zenith-store-update', { detail: coursesKey }));
    console.log("Patched OOP courses successfully!");
  } catch (e) {
    console.error("Failed to patch OOP courses", e);
  }
}

export function patchOOPSyllabus() {
  try {
    const coursesKey = STORES.studyCourses;
    const existingStr = localStorage.getItem(coursesKey);
    if (!existingStr) return;
    
    let courses = JSON.parse(existingStr);
    let patched = false;
    
    for (let course of courses) {
      if (course.id === 'cse-1115-theory') {
        if (!course.syllabus || course.syllabus.length === 0 || course.syllabus[0]?.chapterTitle?.includes("Chapter 2 & 3") === false) {
          course.syllabus = [
            // THEORY: MIDTERM TOPICS
            {
              term: 'Midterm',
              chapterTitle: 'Chapter 2 & 3: Intro to Java, Classes & Objects',
              subTopics: [
                { id: 'th-1.1', title: '2.1-2.5 Basic Syntax, Output & Data Types', isCompleted: false },
                { id: 'th-1.2', title: '3.1-3.4 Classes, Objects, Methods & Inst Variables', isCompleted: false },
                { id: 'th-1.3', title: '3.5-3.6 Constructors & Floating-Point Numbers', isCompleted: false }
              ]
            },
            {
              term: 'Midterm',
              chapterTitle: 'Chapter 4 & 5: Control Statements',
              subTopics: [
                { id: 'th-2.1', title: '4.1-4.8 if, if...else, while & Assignment Operators', isCompleted: false },
                { id: 'th-2.2', title: '4.9-4.11 Increment/Decrement & Primitive Types', isCompleted: false },
                { id: 'th-2.3', title: '5.1-5.5 for, do...while & switch Statements', isCompleted: false },
                { id: 'th-2.4', title: '5.6-5.8 break, continue & Logical Operators', isCompleted: false }
              ]
            },
            {
              term: 'Midterm',
              chapterTitle: 'Chapter 6: Methods: A Deeper Look',
              subTopics: [
                { id: 'th-3.1', title: '6.1-6.5 Static Methods, Math Class & Declarations', isCompleted: false },
                { id: 'th-3.2', title: '6.6-6.10 Argument Promotion, Scope & Method Overloading', isCompleted: false }
              ]
            },
            {
              term: 'Midterm',
              chapterTitle: 'Chapter 7: Arrays and ArrayLists',
              subTopics: [
                { id: 'th-4.1', title: '7.1-7.4 Declaring, Creating & Initializing Arrays', isCompleted: false },
                { id: 'th-4.2', title: '7.5-7.8 Exception Handling (Intro), Multidimensional Arrays', isCompleted: false },
                { id: 'th-4.3', title: '7.9-7.11 Variable-Length Arguments & Command-Line Args', isCompleted: false }
              ]
            },
            
            // THEORY: FINAL TOPICS
            {
              term: 'Final',
              chapterTitle: 'Chapter 8: Classes and Objects: A Deeper Look',
              subTopics: [
                { id: 'th-5.1', title: '8.1-8.4 Time Class Case Study & Controlling Access', isCompleted: false },
                { id: 'th-5.2', title: '8.5-8.8 Overloaded Constructors, Set/Get & Composition', isCompleted: false },
                { id: 'th-5.3', title: '8.9-8.14 Enums, Garbage Collection & static Class Members', isCompleted: false }
              ]
            },
            {
              term: 'Final',
              chapterTitle: 'Chapter 9: Object-Oriented Programming: Inheritance',
              subTopics: [
                { id: 'th-6.1', title: '9.1-9.4 Superclasses, Subclasses & protected Members', isCompleted: false },
                { id: 'th-6.2', title: '9.5-9.8 Constructors in Subclasses & Object Class', isCompleted: false }
              ]
            },
            {
              term: 'Final',
              chapterTitle: 'Chapter 10: OOP: Polymorphism & Interfaces',
              subTopics: [
                { id: 'th-7.1', title: '10.1-10.4 Polymorphism, Abstract Classes & Methods', isCompleted: false },
                { id: 'th-7.2', title: '10.5-10.8 Interfaces (Declaration & Implementation)', isCompleted: false }
              ]
            },
            {
              term: 'Final',
              chapterTitle: 'Chapter 11: Exception Handling',
              subTopics: [
                { id: 'th-8.1', title: '11.1-11.4 Try, Catch, Finally & Exception Hierarchy', isCompleted: false },
                { id: 'th-8.2', title: '11.5-11.8 Throwing Exceptions & Chained Exceptions', isCompleted: false }
              ]
            }
          ];
          patched = true;
        }
      }
      
      if (course.id === 'cse-1116-lab' || course.title.includes('CSE 1116')) {
        course.syllabus = [
          // MIDTERM
          {
            term: 'Midterm',
            chapterTitle: 'Lab 1-2: Java Basics',
            subTopics: [
              { id: 'lab-m1', title: 'IDE Setup, Print & Data Types', isCompleted: false },
              { id: 'lab-m2', title: 'Operators & Scanner I/O', isCompleted: false }
            ]
          },
          {
            term: 'Midterm',
            chapterTitle: 'Lab 3-4: Classes & Control Flow',
            subTopics: [
              { id: 'lab-m3', title: 'Instantiating Objects & Basic Methods', isCompleted: false },
              { id: 'lab-m4', title: 'If-Else, Switch, For & While Loops', isCompleted: false }
            ]
          },
          {
            term: 'Midterm',
            chapterTitle: 'Lab 5-6: Methods & Arrays',
            subTopics: [
              { id: 'lab-m5', title: 'Method Overloading & Static Variables', isCompleted: false },
              { id: 'lab-m6', title: '1D/2D Arrays, Searching & Sorting', isCompleted: false }
            ]
          },
          // FINAL
          {
            term: 'Final',
            chapterTitle: 'Lab 7-8: Advanced OOP',
            subTopics: [
              { id: 'lab-f1', title: 'Constructors, Encapsulation & Composition', isCompleted: false },
              { id: 'lab-f2', title: 'Inheritance & Method Overriding', isCompleted: false }
            ]
          },
          {
            term: 'Final',
            chapterTitle: 'Lab 9-10: Polymorphism',
            subTopics: [
              { id: 'lab-f3', title: 'Abstract Classes & Dynamic Dispatch', isCompleted: false },
              { id: 'lab-f4', title: 'Implementing Multiple Interfaces', isCompleted: false }
            ]
          },
          {
            term: 'Final',
            chapterTitle: 'Lab 11-12: Exceptions & I/O',
            subTopics: [
              { id: 'lab-f5', title: 'Try-Catch & Custom Exceptions', isCompleted: false },
              { id: 'lab-f6', title: 'File I/O (Read/Write)', isCompleted: false }
            ]
          }
        ];
        patched = true;
      }
    }
    
    if (patched) {
      localStorage.setItem(coursesKey, JSON.stringify(courses));
      window.dispatchEvent(new CustomEvent('zenith-store-update', { detail: coursesKey }));
      console.log("Patched OOP Syllabus successfully!");
    }
  } catch (e) {
    console.error("Failed to patch OOP syllabus", e);
  }
}

if (typeof window !== 'undefined') {
  setTimeout(() => {
    patchSyllabusData();
    patchOOPCourses();
    patchOOPSyllabus();
  }, 2000);
}
