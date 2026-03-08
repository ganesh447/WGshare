import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { data, type Flatmate, type InventoryItem, type Bill, type CleanTask, type CleanAssignment, type Transaction, type Notification as AppNotification, type CurrentUser, type Flat } from '@/lib/data';

type AppState = {
  currentView: string;
  setCurrentView: (v: string) => void;
  flatmates: Flatmate[];
  inventory: InventoryItem[];
  bills: Bill[];
  cleanTasks: CleanTask[];
  cleanSchedule: CleanAssignment[];
  transactions: Transaction[];
  notifications: AppNotification[];
  currentUser: CurrentUser | null;
  flat: Flat | null;
  trashDone: Record<string, { done: boolean; doneAt: string | null }>;
  trashSched: Record<string, string>;
  refresh: () => void;
  updateData: (key: string, value: any) => void;
  toast: (message: string, type?: string) => void;
  toasts: Array<{ id: string; message: string; type: string }>;
};

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentView, setCurrentView] = useState('dashboard');
  const [tick, setTick] = useState(0);
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: string }>>([]);

  const refresh = useCallback(() => setTick(t => t + 1), []);

  const updateData = useCallback((key: string, value: any) => {
    data.set(key, value);
    setTick(t => t + 1);
  }, []);

  const toast = useCallback((message: string, type: string = 'info') => {
    const id = data.generateId();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  // Read all data reactively
  const flatmates = data.get<Flatmate[]>(data.keys.flatmates) || [];
  const inventory = data.get<InventoryItem[]>(data.keys.inventory) || [];
  const bills = data.get<Bill[]>(data.keys.bills) || [];
  const cleanTasks = data.get<CleanTask[]>(data.keys.cleanTasks) || [];
  const cleanSchedule = data.get<CleanAssignment[]>(data.keys.cleanSched) || [];
  const transactions = data.get<Transaction[]>(data.keys.transactions) || [];
  const notifications = data.get<AppNotification[]>(data.keys.notifications) || [];
  const currentUser = data.get<CurrentUser>(data.keys.currentUser);
  const flat = data.get<Flat>(data.keys.flat);
  const trashDone = data.get<Record<string, { done: boolean; doneAt: string | null }>>(data.keys.trashDone) || {};
  const trashSched = data.get<Record<string, string>>(data.keys.trashSched) || {};

  // Suppress lint warning for tick dependency
  void tick;

  return (
    <AppContext.Provider value={{
      currentView, setCurrentView,
      flatmates, inventory, bills, cleanTasks, cleanSchedule,
      transactions, notifications, currentUser, flat,
      trashDone, trashSched,
      refresh, updateData, toast, toasts,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
