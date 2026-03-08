import { useApp } from '@/context/AppContext';
import { Bell } from 'lucide-react';
import { useState } from 'react';
import NotificationDrawer from './NotificationDrawer';

export default function AppHeader() {
  const { notifications } = useApp();
  const [showNotifs, setShowNotifs] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      <header className="sticky top-0 z-50 flex items-center justify-between px-5 h-16 glass-surface"
        style={{ borderBottom: '1px solid hsla(217, 91%, 60%, 0.08)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-[10px] flex items-center justify-center text-lg"
            style={{ background: 'var(--gradient-primary)', boxShadow: '0 2px 12px hsla(217, 91%, 60%, 0.35)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <span className="text-xl font-extrabold tracking-tight text-foreground">
            WG<span className="text-primary">share</span>
          </span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); setShowNotifs(!showNotifs); }}
          className="w-10 h-10 rounded-full border-none bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground transition-all flex items-center justify-center relative"
        >
          <Bell className="w-[18px] h-[18px]" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full border-2 border-background animate-pulse" />
          )}
        </button>
      </header>
      {showNotifs && <NotificationDrawer onClose={() => setShowNotifs(false)} />}
    </>
  );
}
