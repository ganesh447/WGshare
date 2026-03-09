import { useApp } from '@/context/AppContext';
import { data } from '@/lib/data';
import { useEffect } from 'react';

const NOTIF_ICONS: Record<string, string> = {
  inventory_depletion: '📦',
  bill_overdue: '📅',
  purchase_recorded: '🛒',
  bill_paid: '✅',
  task_reminder: '🧹',
  settlement: '💸',
};

export default function NotificationDrawer({ onClose }: { onClose: () => void }) {
  const { notifications, updateData } = useApp();

  useEffect(() => {
    // Mark all as read on open
    const updated = notifications.map(n => ({ ...n, read: true }));
    updateData(data.keys.notifications, updated);
    
    const handleClick = () => onClose();
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const clearAll = () => {
    updateData(data.keys.notifications, []);
  };

  const dismiss = (id: string) => {
    updateData(data.keys.notifications, notifications.filter(n => n.id !== id));
  };

  return (
    <div
      className="fixed top-16 right-[calc(50%-195px)] w-80 max-h-[400px] glass-card rounded-xl z-[150] animate-fade-in-up overflow-hidden"
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-sm font-bold">🔔 Notifications</span>
        <button onClick={clearAll} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          Clear all
        </button>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="py-8 px-4 text-center">
            <div className="text-4xl opacity-30 mb-2">🔔</div>
            <p className="text-sm text-muted-foreground">No notifications</p>
          </div>
        ) : (
          notifications.map(n => (
            <div
              key={n.id}
              className={`flex gap-2.5 items-start px-4 py-3 border-b border-border/50 hover:bg-secondary/50 transition-colors ${
                !n.read ? 'bg-primary/5' : ''
              }`}
            >
              <span className="text-xl flex-shrink-0 mt-0.5">{NOTIF_ICONS[n.type] || '🔔'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] leading-snug">{n.message}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{data.formatRelativeTime(n.timestamp)}</p>
              </div>
              <button onClick={() => dismiss(n.id)} className="text-muted-foreground hover:text-foreground text-sm font-bold">×</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
