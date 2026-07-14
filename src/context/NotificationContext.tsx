import React, { createContext, useContext, useEffect, useState } from 'react';
import { useStore } from '../useStore';
import { STORES } from '../db';

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  path: string;
  date: Date;
  isUnread: boolean;
}

interface NotificationContextType {
  permission: NotificationPermission;
  requestPermission: () => Promise<void>;
  notifications: NotificationItem[];
  hasUnread: boolean;
  clearUnread: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  permission: 'default',
  requestPermission: async () => {},
  notifications: [],
  hasUnread: false,
  clearUnread: () => {},
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notifiedSet, setNotifiedSet] = useState<Set<string>>(new Set());

  const [taskQueue] = useStore<any>(STORES.taskQueue);
  const [tasks] = useStore<any>('tasks'); // The TasksModule uses 'tasks' store
  const [studyCourses] = useStore<any>(STORES.studyCourses);
  const [studySchedule] = useStore<any>(STORES.studySchedule);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) return;
    const perm = await Notification.requestPermission();
    setPermission(perm);
  };

  const addNotification = (id: string, title: string, body: string, path: string) => {
    if (notifiedSet.has(id)) return;
    
    setNotifiedSet(prev => new Set(prev).add(id));
    setNotifications(prev => [{
      id, title, body, path, date: new Date(), isUnread: true
    }, ...prev]);

    if (permission === 'granted') {
      const notification = new Notification(title, { body });
      notification.onclick = () => {
        window.focus();
        window.dispatchEvent(new CustomEvent('NAVIGATE_MODULE', { detail: path }));
        notification.close();
      };
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      // Study Module Logic: Exams within 3 days
      if (studyCourses && studyCourses.length > 0) {
        const now = new Date();
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(now.getDate() + 3);

        studyCourses.forEach((c: any) => {
          if (c.exams) {
            c.exams.forEach((exam: any) => {
              const examDate = new Date(exam.date);
              if (examDate >= now && examDate <= threeDaysFromNow) {
                addNotification(`exam-${exam.id}`, 'Upcoming Exam', `${c.title}: ${exam.title} is coming up on ${examDate.toLocaleDateString()}`, 'study');
              }
            });
          }
        });
      }

      // Tasks Module Logic: Outstanding tasks in queue
      if (taskQueue && taskQueue.length > 0) {
        const pendingQueue = taskQueue.filter((t: any) => (t.completedSeconds || 0) < ((t.totalMins || 0) * 60));
        if (pendingQueue.length > 0) {
          addNotification('tasks-queue-due', 'Tasks Due Today', `You have ${pendingQueue.length} items left in your task queue for today.`, 'tasks');
        }
      }
      
      // Uncompleted standalone tasks
      if (tasks && tasks.length > 0) {
        const pendingTasks = tasks.filter((t: any) => !t.completed);
        if (pendingTasks.length > 0) {
          addNotification('tasks-standalone-due', 'Outstanding Tasks', `You have ${pendingTasks.length} uncompleted tasks.`, 'tasks');
        }
      }

      // Class Schedule Notifications
      if (studySchedule && studySchedule.length > 0) {
        const now = new Date();
        const daysMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const todayStr = daysMap[now.getDay()];
        const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();

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

        let allClasses: any[] = [];
        if (studySchedule) allClasses = [...studySchedule];
        
        if (studyCourses) {
          studyCourses.forEach((c: any) => {
            if (c.schedule && Array.isArray(c.schedule)) {
              c.schedule.forEach((s: any) => {
                allClasses.push({
                  id: c.id + '-' + s.day,
                  course: c.title,
                  type: c.isLab ? 'Lab' : (c.subtitle || 'Theory'),
                  day: s.day,
                  time: s.time,
                  room: s.room
                });
              });
            }
          });
        }

        allClasses.forEach((cls: any) => {
          if (cls.day === todayStr) {
            const { startMins } = extractStartEndTimes(cls.time);
            
            if (startMins !== -1) {
              const remaining = startMins - currentTimeMinutes;
              const dateStr = now.toLocaleDateString();
              
              if (remaining === 10) {
                addNotification(`class-warn-${cls.id}-${dateStr}`, 'Class Starting Soon!', `Your ${cls.type} class for ${cls.course} starts in 10 minutes in Room ${cls.room}.`, 'dashboard');
              } else if (remaining === 0) {
                addNotification(`class-start-${cls.id}-${dateStr}`, 'Class Starting!', `Your ${cls.type} class for ${cls.course} is starting now in Room ${cls.room}.`, 'dashboard');
              }
            }
          }
        });
      }
    }, 15000); 

    return () => clearInterval(interval);
  }, [taskQueue, tasks, studyCourses, studySchedule, permission, notifiedSet]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (permission === 'default') {
        requestPermission();
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [permission]);

  const hasUnread = notifications.some(n => n.isUnread);
  
  const clearUnread = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isUnread: false })));
  };

  return (
    <NotificationContext.Provider value={{ permission, requestPermission, notifications, hasUnread, clearUnread }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
