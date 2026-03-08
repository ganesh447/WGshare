import { useApp } from '@/context/AppContext';
import { Home, Package, FileText, Droplets, CreditCard, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Home', icon: Home },
  { key: 'inventory', label: 'Inventory', icon: Package },
  { key: 'bills', label: 'Bills', icon: FileText },
  { key: 'cleaning', label: 'Cleaning', icon: Droplets },
  { key: 'payments', label: 'Payments', icon: CreditCard },
  { key: 'settings', label: 'Settings', icon: Settings },
];

export default function BottomNav() {
  const { currentView, setCurrentView, cleanSchedule } = useApp();

  const pendingTasks = cleanSchedule.filter(a => a.status === 'pending').length;

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] h-[68px] glass-surface flex items-center justify-around z-50 px-2"
      style={{ borderTop: '1px solid hsla(217, 91%, 60%, 0.1)' }}>
      {NAV_ITEMS.map(item => {
        const isActive = currentView === item.key;
        const Icon = item.icon;
        return (
          <button
            key={item.key}
            onClick={() => setCurrentView(item.key)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-lg transition-all duration-200 border-none bg-transparent relative ${
              isActive ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            {isActive && (
              <span className="absolute top-1 left-1/2 -translate-x-1/2 w-6 h-[3px] rounded-full bg-primary glow-blue" />
            )}
            <Icon className={`w-[22px] h-[22px] transition-all duration-200 ${isActive ? 'drop-shadow-[0_0_6px_hsla(217,91%,60%,0.5)]' : ''}`} />
            <span className="text-[10px] font-semibold tracking-wide">{item.label}</span>
            {item.key === 'cleaning' && pendingTasks > 0 && (
              <span className="absolute top-1 right-[calc(50%-16px)] min-w-[16px] h-4 bg-destructive rounded-full text-[9px] font-bold text-destructive-foreground flex items-center justify-center px-1">
                {pendingTasks}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
