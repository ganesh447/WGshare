// Data layer - localStorage wrapper with seed data

const KEYS = {
  flatmates: 'wgshare_flatmates',
  inventory: 'wgshare_inventory',
  bills: 'wgshare_bills',
  cleanTasks: 'wgshare_cleaning_tasks',
  cleanSched: 'wgshare_cleaning_schedule',
  trashSched: 'wgshare_trash_schedule',
  transactions: 'wgshare_transactions',
  notifications: 'wgshare_notifications',
  settings: 'wgshare_settings',
  currentUser: 'wgshare_currentUser',
  flat: 'wgshare_flat',
  trashDone: 'wgshare_trash_done',
};

export type Flatmate = {
  id: string;
  name: string;
  iban: string;
  active: boolean;
  color: number;
  joinedAt: string;
};

export type InventoryItem = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  minThreshold: number;
  unit: string;
  status: string;
  lastPurchasedBy: string | null;
  lastPurchaseDate: string | null;
  lastPurchaseCost: number | null;
  purchaseHistory: any[];
  notes: string;
  addedAt: string;
  assignedTo?: string | null;
};

export type Bill = {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  billingPeriod: string;
  splitAmount: number;
  status: string;
  paidBy: string | null;
  paymentDate: string | null;
  createdAt: string;
  isRecurring?: boolean;
  recurringMonths?: number;
};

export type CleanTask = {
  id: string;
  name: string;
  icon: string;
};

export type CleanAssignment = {
  id: string;
  taskId: string;
  taskName: string;
  taskIcon: string;
  assignedTo: string;
  weekStart: string;
  status: string;
  completedAt: string | null;
};

export type Transaction = {
  id: string;
  type: string;
  from: string;
  to: string[];
  amount: number;
  perPersonAmount: number;
  date: string;
  reference: string;
  billId?: string;
  itemId?: string;
};

export type Notification = {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  read: boolean;
};

export type CurrentUser = {
  id: string;
  name: string;
  color: number;
};

export type Flat = {
  name: string;
  code: string;
  createdAt: string;
  trashTypeAnchor?: { weekStart: string; type: string };
};

export const AVATAR_COLORS = ['#3B82F6', '#6366F1', '#8B5CF6', '#F59E0B', '#EC4899', '#14B8A6'];

export const CATEGORIES = [
  { key: 'all', label: 'All', icon: '📦' },
  { key: 'food', label: 'Food', icon: '🍎' },
  { key: 'cleaning', label: 'Cleaning', icon: '🧴' },
  { key: 'toiletries', label: 'Toiletries', icon: '🪥' },
  { key: 'kitchen', label: 'Kitchen', icon: '🍳' },
  { key: 'other', label: 'Other', icon: '📎' },
];

export const UNITS = ['pieces', 'rolls', 'bottles', 'packs', 'liters', 'kg', 'bags', 'boxes', 'cans', 'tubes'];
export const HOUSE_TASK_ICONS = ['🚿', '🍳', '🛋️', '🧹', '🪟', '🚪', '🛁', '🚽', '🪴', '🌊', '✨', '🧺'];

export const data = {
  keys: KEYS,

  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },

  set(key: string, value: any) {
    localStorage.setItem(key, JSON.stringify(value));
  },

  generateId() {
    return 'id_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  },

  getWeekStart(date: Date | string = new Date()): string {
    let d: Date;
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      d = new Date(date + 'T12:00:00');
    } else {
      d = new Date(date);
    }
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  },

  getWeekIndex(weekStartStr: string): number {
    const epoch = new Date('2026-01-06');
    const ws = new Date(weekStartStr);
    return Math.max(0, Math.floor((ws.getTime() - epoch.getTime()) / (7 * 24 * 60 * 60 * 1000)));
  },

  formatDate(isoStr: string | null): string {
    if (!isoStr) return '—';
    const d = new Date(isoStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  },

  formatDateShort(isoStr: string | null): string {
    if (!isoStr) return '—';
    const d = new Date(isoStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  },

  formatRelativeTime(isoStr: string | null): string {
    if (!isoStr) return '';
    const diff = Date.now() - new Date(isoStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  },

  formatCurrency(amount: number): string {
    return '€' + parseFloat(String(amount || 0)).toFixed(2);
  },

  isOnboarded(): boolean {
    return !!(data.get(KEYS.currentUser) && data.get(KEYS.flat));
  },

  seed() {
    if (data.get(KEYS.settings)) return;
    const now = new Date().toISOString();

    const flatmates: Flatmate[] = [
      { id: 'fm_1', name: 'Lena', iban: 'DE89370400440532013000', active: true, color: 0, joinedAt: now },
      { id: 'fm_2', name: 'Marco', iban: 'DE27200400600524012000', active: true, color: 1, joinedAt: now },
      { id: 'fm_3', name: 'Priya', iban: 'DE75512108001245126199', active: true, color: 2, joinedAt: now },
    ];
    data.set(KEYS.flatmates, flatmates);

    const inventory: InventoryItem[] = [
      { id: 'inv_1', name: 'Toilet Paper', category: 'toiletries', quantity: 8, minThreshold: 3, unit: 'rolls', status: 'available', lastPurchasedBy: 'fm_1', lastPurchaseDate: '2026-02-28', lastPurchaseCost: 4.99, purchaseHistory: [], notes: '', addedAt: now },
      { id: 'inv_2', name: 'Dish Soap', category: 'cleaning', quantity: 1, minThreshold: 1, unit: 'bottles', status: 'low', lastPurchasedBy: 'fm_2', lastPurchaseDate: '2026-02-20', lastPurchaseCost: 2.49, purchaseHistory: [], notes: '', addedAt: now },
      { id: 'inv_3', name: 'Coffee Beans', category: 'food', quantity: 0, minThreshold: 1, unit: 'packs', status: 'depleted', lastPurchasedBy: 'fm_3', lastPurchaseDate: '2026-02-15', lastPurchaseCost: 8.99, purchaseHistory: [], notes: '', addedAt: now },
      { id: 'inv_4', name: 'All-Purpose Cleaner', category: 'cleaning', quantity: 2, minThreshold: 1, unit: 'bottles', status: 'available', lastPurchasedBy: 'fm_1', lastPurchaseDate: '2026-02-10', lastPurchaseCost: 3.29, purchaseHistory: [], notes: '', addedAt: now },
      { id: 'inv_5', name: 'Salt', category: 'food', quantity: 5, minThreshold: 1, unit: 'packs', status: 'available', lastPurchasedBy: null, lastPurchaseDate: null, lastPurchaseCost: null, purchaseHistory: [], notes: '', addedAt: now },
      { id: 'inv_6', name: 'Sponges', category: 'kitchen', quantity: 0, minThreshold: 2, unit: 'pieces', status: 'depleted', lastPurchasedBy: 'fm_2', lastPurchaseDate: '2026-02-01', lastPurchaseCost: 1.99, purchaseHistory: [], notes: '', addedAt: now },
      { id: 'shop_1', name: 'Olive Oil', category: 'food', quantity: 0, minThreshold: 1, unit: 'bottles', status: 'needed', lastPurchasedBy: null, lastPurchaseDate: null, lastPurchaseCost: null, purchaseHistory: [], notes: 'Extra virgin please', addedAt: now, assignedTo: 'fm_1' },
    ];
    data.set(KEYS.inventory, inventory);

    const bills: Bill[] = [
      { id: 'bill_1', name: 'Internet', amount: 39.99, dueDate: '2026-03-15', billingPeriod: 'March 2026', splitAmount: 13.33, status: 'upcoming', paidBy: null, paymentDate: null, createdAt: now },
      { id: 'bill_2', name: 'Rundfunkbeitrag', amount: 18.36, dueDate: '2026-03-31', billingPeriod: 'Q1 2026', splitAmount: 6.12, status: 'upcoming', paidBy: null, paymentDate: null, createdAt: now },
      { id: 'bill_3', name: 'Electricity', amount: 87.00, dueDate: '2026-02-28', billingPeriod: 'Feb 2026', splitAmount: 29.00, status: 'overdue', paidBy: null, paymentDate: null, createdAt: now },
      { id: 'bill_4', name: 'Netflix', amount: 17.99, dueDate: '2026-02-10', billingPeriod: 'Feb 2026', splitAmount: 6.00, status: 'paid', paidBy: 'fm_1', paymentDate: '2026-02-09', createdAt: now },
    ];
    data.set(KEYS.bills, bills);

    const cleanTasks: CleanTask[] = [
      { id: 'ct_1', name: 'Bathroom', icon: '🚿' },
      { id: 'ct_2', name: 'Kitchen', icon: '🍳' },
      { id: 'ct_3', name: 'Common Areas', icon: '🛋️' },
    ];
    data.set(KEYS.cleanTasks, cleanTasks);
    data.set(KEYS.cleanSched, []);
    data.set(KEYS.trashSched, {});

    const transactions: Transaction[] = [
      { id: 'tx_1', type: 'bill_payment', from: 'fm_1', to: ['fm_2', 'fm_3'], amount: 17.99, perPersonAmount: 6.00, date: '2026-02-09', reference: 'Netflix - Feb 2026', billId: 'bill_4' },
    ];
    data.set(KEYS.transactions, transactions);

    const notifications: Notification[] = [
      { id: 'notif_1', type: 'inventory_depletion', message: 'Coffee Beans has run out!', timestamp: now, read: false },
      { id: 'notif_2', type: 'inventory_depletion', message: 'Sponges has run out!', timestamp: now, read: false },
      { id: 'notif_3', type: 'bill_overdue', message: 'Electricity bill is overdue (due Feb 28)', timestamp: now, read: false },
    ];
    data.set(KEYS.notifications, notifications);
    data.set(KEYS.settings, { seeded: true, currency: 'EUR', createdAt: now });
  },

  calculateBalances(): Record<string, number> {
    const flatmates = data.get<Flatmate[]>(KEYS.flatmates) || [];
    const transactions = data.get<Transaction[]>(KEYS.transactions) || [];
    const balances: Record<string, number> = {};
    flatmates.forEach(f => { balances[f.id] = 0; });

    for (const t of transactions) {
      if (!balances.hasOwnProperty(t.from)) continue;
      const perPerson = parseFloat(String(t.perPersonAmount)) || 0;
      const others = (t.to || []).filter(id => id !== t.from);
      others.forEach(id => {
        if (balances.hasOwnProperty(id)) {
          balances[t.from] += perPerson;
          balances[id] -= perPerson;
        }
      });
    }
    return balances;
  }
};
