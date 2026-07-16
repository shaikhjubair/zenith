import React, { useState, useCallback, useMemo } from 'react';
import { motion } from 'motion/react';
import { BrainCircuit, BookOpen, CheckCircle2, ChevronRight, Folder, X, Plus, Minus } from 'lucide-react';
import { useStore } from '../useStore';
import { STORES } from '../db';
import { FormModal } from '../components/FormModal';
import { ConfirmModal } from '../components/ConfirmModal';

interface Course {
  id?: number;
  title: string;
  completed: number;
  total: number;
  color: string;
}

interface Note {
  id?: number;
  title: string;
  tag: string;
  tagColor: string;
  description: string;
  date: string;
}

const TAG_COLOR_MAP: Record<string, string> = {
  Tech: 'bg-blue-700',
  Business: 'bg-purple-700',
  'Soft Skill': 'bg-teal-700',
  Design: 'bg-rose-700',
  Other: 'bg-amber-700',
};

const TAG_SHADOW_MAP: Record<string, string> = {
  'bg-blue-700': '0_0_15px_rgba(29,78,216,0.5)',
  'bg-purple-700': '0_0_15px_rgba(126,34,206,0.5)',
  'bg-teal-700': '0_0_15px_rgba(15,118,110,0.5)',
  'bg-rose-700': '0_0_15px_rgba(190,18,60,0.5)',
  'bg-amber-700': '0_0_15px_rgba(180,83,9,0.5)',
};

const CIRCUMFERENCE = 2 * Math.PI * 40; // 251.2

const NOTE_FIELDS = [
  { name: 'title', label: 'Title', type: 'text', required: true, placeholder: 'Enter note title...' },
  { name: 'tag', label: 'Tag', type: 'select', required: true, defaultValue: 'Tech', options: [
      { value: 'Tech', label: 'Tech' },
      { value: 'Business', label: 'Business' },
      { value: 'Soft Skill', label: 'Soft Skill' },
      { value: 'Design', label: 'Design' },
      { value: 'Other', label: 'Other' },
    ]
  },
  { name: 'description', label: 'Description', type: 'textarea', required: true, placeholder: 'Write your note...' },
] as const;

const COURSE_FIELDS = [
  { name: 'title', label: 'Course Title', type: 'text', required: true, placeholder: 'e.g. Advanced React' },
  { name: 'total', label: 'Total Modules', type: 'number', required: true, placeholder: 'e.g. 20' },
  { name: 'color', label: 'Color', type: 'select', required: true, defaultValue: '#00ffff', options: [
      { value: '#00ffff', label: 'Cyan' },
      { value: '#ff007f', label: 'Pink' },
      { value: '#ff6600', label: 'Orange' },
      { value: '#00ff66', label: 'Green' },
      { value: '#b652ff', label: 'Purple' },
    ]
  },
] as const;

export function SkillsModule() {
  const [courses, courseActions, coursesLoading] = useStore<Course>(STORES.skillsCourses);
  const [notes, noteActions, notesLoading] = useStore<Note>(STORES.skillsNotes);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<number | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<number | null>(null);

  const loading = coursesLoading || notesLoading;

  const handleCloseNoteModal = useCallback(() => setShowNoteModal(false), []);
  const handleAddNote = useCallback((data: any) => {
    const tag = data.tag as string;
    const tagColor = TAG_COLOR_MAP[tag] || 'bg-amber-700';
    noteActions.add({
      title: data.title as string,
      tag,
      tagColor,
      description: data.description as string,
      date: new Date().toLocaleDateString(),
    });
  }, [noteActions]);

  const handleCloseCourseModal = useCallback(() => {
    setShowCourseModal(false);
    setEditingCourse(null);
  }, []);
  
  const handleAddCourse = useCallback((data: any) => {
    if (editingCourse) {
      courseActions.update(editingCourse.id!, {
        title: data.title as string,
        total: Number(data.total) || 1,
        color: data.color as string,
      });
    } else {
      courseActions.add({
        title: data.title as string,
        completed: 0,
        total: Number(data.total) || 1,
        color: data.color as string,
      });
    }
    setEditingCourse(null);
  }, [courseActions, editingCourse]);

  const updateCourseProgress = (course: Course, increment: number) => {
    const newCompleted = Math.max(0, Math.min(course.total, course.completed + increment));
    courseActions.update(course.id!, { completed: newCompleted });
  };

  if (loading) {
    return (
      <div className="max-w-6xl w-full mx-auto flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-on-surface-variant text-sm uppercase tracking-widest font-semibold">Loading skills...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl w-full mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 h-full">

      <div className="md:col-span-12 glass-card rounded-[32px] p-8 flex flex-col h-fit relative overflow-hidden shadow-lg border border-white/10 group">
        <div className="absolute inset-0 bg-[url('/skills_bg.png')] bg-cover bg-center mix-blend-overlay opacity-30 pointer-events-none z-0"></div>
        <div className="absolute inset-0 bg-black/40 pointer-events-none z-0"></div>
        <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4 relative z-10">
          <div className="flex items-center gap-3">
             <BookOpen className="text-primary w-6 h-6" />
             <h3 className="text-2xl text-on-surface font-medium">Active Courses</h3>
          </div>
          <button
            onClick={() => setShowCourseModal(true)}
            className="bg-primary/20 text-primary px-4 py-2 rounded-lg text-[12px] font-bold uppercase tracking-widest hover:bg-primary/30 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Course
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
          {courses.length === 0 && (
            <p className="text-on-surface-variant text-sm col-span-full py-8 text-center bg-white/5 rounded-xl border border-dashed border-white/20">No courses tracked. Add one to begin.</p>
          )}
          {courses.map((course) => {
            const pct = course.total > 0 ? Math.round((course.completed / course.total) * 100) : 0;
            const offset = CIRCUMFERENCE - (pct / 100) * CIRCUMFERENCE;
            return (
              <div key={course.id} className="flex flex-col items-center bg-surface-container/30 p-6 rounded-xl border border-white/5 relative group hover:border-white/20 transition-all shadow-sm">
                  <button
                    onClick={() => setCourseToDelete(course.id!)}
                    className="absolute top-2 right-2 w-6 h-6 rounded-md hover:bg-red-500/20 flex items-center justify-center text-on-surface-variant hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    title="Delete Course"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { setEditingCourse(course); setShowCourseModal(true); }}
                    className="absolute top-2 right-10 w-6 h-6 rounded-md hover:bg-primary/20 flex items-center justify-center text-on-surface-variant hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    title="Edit Course"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                  </button>
                <div className="relative w-32 h-32 mb-4 group-hover:scale-105 transition-transform duration-500">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" fill="transparent" r="40" strokeWidth="10" className="text-surface-variant stroke-current" />
                    <circle cx="50" cy="50" fill="transparent" r="40" strokeWidth="10" className="stroke-current transition-all duration-700 ease-out" strokeDasharray={CIRCUMFERENCE.toString()} strokeDashoffset={offset} strokeLinecap="round" style={{ stroke: course.color, filter: `drop-shadow(0 0 8px ${course.color}80)` }} />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold text-on-surface">{pct}%</span>
                  </div>
                </div>
                <h4 className="text-[14px] font-bold uppercase tracking-widest text-on-surface text-center mb-1">{course.title}</h4>
                <p className="text-[12px] font-semibold text-on-surface-variant uppercase tracking-wider mb-4">{course.completed}/{course.total} Modules</p>
                <div className="flex gap-2 w-full">
                   <button onClick={() => updateCourseProgress(course, -1)} className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 rounded border border-white/10 flex justify-center text-on-surface-variant transition-colors"><Minus className="w-4 h-4" /></button>
                   <button onClick={() => updateCourseProgress(course, 1)} className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 rounded border border-white/10 flex justify-center text-primary transition-colors" style={{ color: course.color, borderColor: `${course.color}40`, backgroundColor: `${course.color}15` }}><Plus className="w-4 h-4" /></button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="md:col-span-12 glass-card rounded-2xl p-6">
        <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <BrainCircuit className="text-secondary w-6 h-6" />
            <h3 className="text-2xl font-medium text-on-surface">Notes Vault</h3>
          </div>
          <button
            onClick={() => setShowNoteModal(true)}
            className="bg-primary/20 text-primary px-4 py-2 rounded-lg text-[12px] font-bold uppercase tracking-widest hover:bg-primary/30 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> New Note
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {notes.length === 0 && (
             <p className="text-on-surface-variant text-sm col-span-full py-8 text-center bg-white/5 rounded-xl border border-dashed border-white/20">No notes in vault.</p>
          )}
          {notes.map((note) => {
            const shadow = TAG_SHADOW_MAP[note.tagColor] || '0_0_15px_rgba(180,83,9,0.5)';
            return (
              <div
                key={note.id}
                className={`${note.tagColor} p-5 rounded-xl border border-white/20 hover:border-white/40 transition-all cursor-pointer group relative overflow-hidden`}
                style={{ boxShadow: shadow.replace(/_/g, ' ') }}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); setNoteToDelete(note.id!); }}
                  className="absolute top-2 right-2 w-6 h-6 rounded-md bg-black/30 hover:bg-red-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10"
                >
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-1 bg-white/20 text-white text-[10px] rounded uppercase font-bold tracking-wider">{note.tag}</span>
                  <span className="text-[10px] font-semibold text-white/80 uppercase tracking-widest">{note.date}</span>
                </div>
                <h4 className="text-[14px] font-bold tracking-widest uppercase text-white mb-2 leading-relaxed">{note.title}</h4>
                <p className="text-sm text-white/80 line-clamp-3">{note.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      <FormModal
        isOpen={showNoteModal}
        onClose={handleCloseNoteModal}
        onSubmit={handleAddNote}
        title="New Note"
        fields={NOTE_FIELDS as any}
        submitLabel="Add Note"
      />

      <FormModal
        isOpen={showCourseModal}
        onClose={handleCloseCourseModal}
        onSubmit={handleAddCourse}
        title={editingCourse ? "Edit Course" : "Add Course"}
        fields={COURSE_FIELDS.map(f => {
          if (!editingCourse) return f;
          return { ...f, defaultValue: (editingCourse as any)[f.name] };
        })}
        submitLabel={editingCourse ? "Save Changes" : "Start Tracking"}
      />

    </div>
  );
}
