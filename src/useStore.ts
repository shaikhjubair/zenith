import { useState, useEffect, useMemo, useRef } from 'react';
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query } from 'firebase/firestore';
import { db, auth } from './firebase';

export type StoreName = string;

interface StoreActions<T extends { id?: string | number }> {
  add: (item: Omit<T, 'id'>) => Promise<void>;
  update: (id: string | number, updates: Partial<T>) => Promise<void>;
  remove: (id: string | number) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useStore<T extends { id?: string | number }>(storeName: StoreName): [T[], StoreActions<T>, boolean] {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const storeRef = useRef(storeName);
  storeRef.current = storeName;

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(collection(db, `users/${user?.uid}/${storeRef.current}`));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
      setItems(data);
      setLoading(false);
    }, (error) => {
      console.error(`[useStore] Firestore sync error for ${storeRef.current}:`, error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [storeName]);

  const actions: StoreActions<T> = useMemo(() => ({
    add: async (item) => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        await addDoc(collection(db, `users/${user?.uid}/${storeRef.current}`), item as any);
      } catch (err) {
        console.error(`[useStore] Failed to add to ${storeRef.current}:`, err);
      }
    },

    update: async (id, updates) => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        const docRef = doc(db, `users/${user?.uid}/${storeRef.current}`, id.toString());
        await updateDoc(docRef, updates as any);
      } catch (err) {
        console.error(`[useStore] Failed to update ${storeRef.current}:`, err);
      }
    },

    remove: async (id) => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        const docRef = doc(db, `users/${user?.uid}/${storeRef.current}`, id.toString());
        await deleteDoc(docRef);
      } catch (err) {
        console.error(`[useStore] Failed to remove from ${storeRef.current}:`, err);
      }
    },

    refresh: async () => {
      // With onSnapshot, refresh is essentially a no-op since it's real-time
    },
  }), []);

  return [items, actions, loading];
}
