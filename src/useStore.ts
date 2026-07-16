import { useState, useEffect, useMemo, useRef } from 'react';

export type StoreName = string;

interface StoreActions<T extends { id?: string | number }> {
  add: (item: Omit<T, 'id'>) => Promise<void>;
  update: (id: string | number, updates: Partial<T>) => Promise<void>;
  remove: (id: string | number) => Promise<void>;
  refresh: () => Promise<void>;
}

// Generate a random ID since we aren't using Firestore doc IDs anymore
const generateId = () => {
  return Date.now().toString() + Math.random().toString(36).substring(2, 9);
};

export function useStore<T extends { id?: string | number }>(storeName: StoreName): [T[], StoreActions<T>, boolean] {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const storeRef = useRef(storeName);
  storeRef.current = storeName;

  const storageKey = `zenith_${storeName}`;

  const loadData = () => {
    try {
      const data = localStorage.getItem(storageKey);
      if (data) {
        setItems(JSON.parse(data));
      } else {
        setItems([]);
      }
    } catch (err) {
      console.error(`[useStore] Failed to parse ${storageKey} from localStorage:`, err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Setup listener for cross-tab or programmatic localStorage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === storageKey) {
        loadData();
      }
    };
    
    // Custom event listener for same-window updates
    const handleCustomChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail === storageKey) {
        loadData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('zenith-store-update', handleCustomChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('zenith-store-update', handleCustomChange);
    };
  }, [storeName]);

  const dispatchUpdate = () => {
    window.dispatchEvent(new CustomEvent('zenith-store-update', { detail: storageKey }));
  };

  const actions: StoreActions<T> = useMemo(() => ({
    add: async (item) => {
      try {
        const currentData = localStorage.getItem(storageKey);
        const currentItems = currentData ? JSON.parse(currentData) : [];
        const newItem = { id: generateId(), ...item } as unknown as T;
        const newItems = [...currentItems, newItem];
        localStorage.setItem(storageKey, JSON.stringify(newItems));
        dispatchUpdate();
      } catch (err) {
        console.error(`[useStore] Failed to add to ${storageKey}:`, err);
      }
    },

    update: async (id, updates) => {
      try {
        const currentData = localStorage.getItem(storageKey);
        const currentItems = currentData ? JSON.parse(currentData) : [];
        const newItems = currentItems.map((item: any) => 
          item.id === id ? { ...item, ...updates } : item
        );
        localStorage.setItem(storageKey, JSON.stringify(newItems));
        dispatchUpdate();
      } catch (err) {
        console.error(`[useStore] Failed to update ${storageKey}:`, err);
      }
    },

    remove: async (id) => {
      try {
        const currentData = localStorage.getItem(storageKey);
        const currentItems = currentData ? JSON.parse(currentData) : [];
        const newItems = currentItems.filter((item: any) => item.id !== id);
        localStorage.setItem(storageKey, JSON.stringify(newItems));
        dispatchUpdate();
      } catch (err) {
        console.error(`[useStore] Failed to remove from ${storageKey}:`, err);
      }
    },

    refresh: async () => {
      loadData();
    },
  }), [storeName]);

  return [items, actions, loading];
}
