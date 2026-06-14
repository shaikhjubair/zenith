import React, { createContext, useContext, useEffect, useState } from 'react';
import { useStore } from '../useStore';
import { STORES } from '../db';

interface NotificationContextType {
  permission: NotificationPermission;
  requestPermission: () => Promise<void>;
  hasUnread: boolean;
  clearUnread: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  permission: 'default',
  requestPermission: async () => {},
  hasUnread: false,
  clearUnread: () => {},
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [hasUnread, setHasUnread] = useState(false);
  const [notifiedTasks, setNotifiedTasks] = useState<Set<number>>(new Set());

  const [taskQueue] = useStore<any>(STORES.taskQueue);
  const [studyCourses] = useStore<any>(STORES.studyCourses);

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

  const triggerNotification = (title: string, body: string, path: string) => {
    setHasUnread(true);
    if (permission === 'granted') {
      const notification = new Notification(title, {
        body,
      });
      notification.onclick = () => {
        window.focus();
        window.dispatchEvent(new CustomEvent('NAVIGATE_MODULE', { detail: path }));
        notification.close();
        setHasUnread(false);
      };
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (taskQueue && taskQueue.length > 0) {
        const pendingTask = taskQueue.find((t: any) => !notifiedTasks.has(t.id));
        if (pendingTask) {
          triggerNotification('Task Reminder', `Don't forget to work on: ${pendingTask.title}`, 'tasks');
          setNotifiedTasks(prev => new Set(prev).add(pendingTask.id));
        }
      }

      if (studyCourses && studyCourses.length > 0) {
        const pendingCourse = studyCourses.find((c: any) => c.completed < c.total && !notifiedTasks.has(c.id + 10000));
        if (pendingCourse) {
          triggerNotification('Study Goal', `Time to complete: ${pendingCourse.title}`, 'study');
          setNotifiedTasks(prev => new Set(prev).add(pendingCourse.id + 10000));
        }
      }
    }, 60000); 

    return () => clearInterval(interval);
  }, [taskQueue, studyCourses, permission, notifiedTasks]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (permission === 'default') {
        requestPermission();
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [permission]);

  return (
    <NotificationContext.Provider value={{ permission, requestPermission, hasUnread, clearUnread: () => setHasUnread(false) }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
