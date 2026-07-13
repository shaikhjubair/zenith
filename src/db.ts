import { doc, getDoc, setDoc } from 'firebase/firestore';
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
