import { useApp } from '@/context/AppContext';
import { data, AVATAR_COLORS } from '@/lib/data';
import Avatar from '@/components/Avatar';

export default function DashboardView() {
  const { flatmates, inventory, bills, cleanSchedule, currentUser, setCurrentView } = useApp();

  const allItems = inventory.map(i => ({
    ...i,
    status: i.status === 'needed' ? 'needed' : i.quantity <= 0 ? 'depleted' : 'available',
  }));
  const depleted = allItems.filter(i => i.status === 'depleted' || i.status === 'needed').length;
  const overdueBills = bills.filter(b => b.status === 'overdue').length;
  const upcomingBills = bills.filter(b => b.status === 'upcoming').length;
  const pendingTasks = cleanSchedule.filter(a => a.status === 'pending').length;
  const balances = data.calculateBalances();
  const myBalance = Object.values(balances).reduce((s, v) => s + Math.abs(v), 0);
  const activeFlatmates = flatmates.filter(f => f.active);
  const userName = currentUser?.name || 'Flatmates';

  const todayName = new Date().toLocaleDateString('en-GB', { weekday: 'long' });
  const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="animate-fade-in-up">
      {/* Hero */}
      <div className="mx-4 mt-4 p-7 rounded-2xl relative overflow-hidden"
        style={{
          background: 'var(--gradient-hero)',
          boxShadow: '0 8px 40px hsla(217, 91%, 60%, 0.15), 0 2px 12px hsla(222, 47%, 4%, 0.3)',
          animation: 'shimmer 4s ease-in-out infinite',
        }}>
        <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, hsla(217, 91%, 60%, 0.1), transparent 70%)' }} />
        <div className="absolute -bottom-10 -left-8 w-40 h-40 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, hsla(217, 91%, 60%, 0.12), transparent 70%)' }} />
        <p className="text-[13px] text-foreground/60 font-semibold uppercase tracking-wider relative z-10">🏠 {todayName}</p>
        <h1 className="text-[34px] font-extrabold mt-1 tracking-tight relative z-10">Hello, {userName}!</h1>
        <p className="text-sm text-foreground/55 mt-1.5 relative z-10">{dateStr}</p>
        <div className="flex gap-3 mt-4 flex-wrap relative z-10">
          {overdueBills > 0 && <Badge color="red" icon="⚠️" text={`${overdueBills} overdue bill${overdueBills > 1 ? 's' : ''}`} />}
          {depleted > 0 && <Badge color="amber" icon="📦" text={`${depleted} item${depleted > 1 ? 's' : ''} needed`} />}
          {pendingTasks > 0 && <Badge color="purple" icon="🧹" text={`${pendingTasks} task${pendingTasks > 1 ? 's' : ''} pending`} />}
          {depleted === 0 && overdueBills === 0 && pendingTasks === 0 && <Badge color="green" icon="✓" text="Everything's good!" />}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2.5 px-4 mt-4">
        <StatCard icon="📦" value={depleted} label="Items Needed" color={depleted > 0 ? 'amber' : 'green'} onClick={() => setCurrentView('inventory')} />
        <StatCard icon="📋" value={upcomingBills + overdueBills} label="Upcoming Bills" color={overdueBills > 0 ? 'red' : 'blue'} onClick={() => setCurrentView('bills')} />
        <StatCard icon="🧹" value={pendingTasks} label="Chores Pending" color={pendingTasks > 0 ? 'purple' : 'green'} onClick={() => setCurrentView('cleaning')} />
        <StatCard icon="💰" value={`€${myBalance.toFixed(0)}`} label="Outstanding" color={myBalance > 0 ? 'amber' : 'green'} onClick={() => setCurrentView('payments')} />
      </div>

      {/* Flatmates */}
      <div className="px-4 mt-4 pb-4">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Flatmates ({activeFlatmates.length})</p>
        <div className="flex gap-2.5 flex-wrap">
          {activeFlatmates.map(fm => (
            <div key={fm.id} className="flex flex-col items-center gap-1.5">
              <Avatar name={fm.name} color={fm.color} size={44} />
              <span className="text-[11px] font-semibold text-muted-foreground">{fm.name}</span>
            </div>
          ))}
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={() => setCurrentView('settings')}
              className="w-11 h-11 rounded-full border-2 border-dashed border-border flex items-center justify-center text-xl text-muted-foreground hover:border-primary hover:text-primary transition-colors bg-transparent"
            >+</button>
            <span className="text-[11px] font-semibold text-muted-foreground">Add</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Badge({ color, icon, text }: { color: string; icon: string; text: string }) {
  const colorMap: Record<string, string> = {
    red: 'bg-accent-red/10 text-accent-red',
    amber: 'bg-accent-amber/10 text-accent-amber',
    purple: 'bg-accent-purple/10 text-accent-purple',
    green: 'bg-accent/10 text-accent',
    blue: 'bg-primary/10 text-primary',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${colorMap[color] || colorMap.blue}`}>
      {icon} {text}
    </span>
  );
}

function StatCard({ icon, value, label, color, onClick }: { icon: string; value: string | number; label: string; color: string; onClick: () => void }) {
  const bgMap: Record<string, string> = {
    amber: 'bg-accent-amber/10',
    green: 'bg-accent/10',
    red: 'bg-accent-red/10',
    blue: 'bg-primary/10',
    purple: 'bg-accent-purple/10',
  };
  const textMap: Record<string, string> = {
    amber: 'text-accent-amber',
    green: 'text-accent',
    red: 'text-accent-red',
    blue: 'text-primary',
    purple: 'text-accent-purple',
  };
  return (
    <button
      onClick={onClick}
      className="glass-card rounded-xl p-4 flex flex-col gap-1.5 text-left hover:translate-y-[-3px] transition-all duration-300 cursor-pointer"
    >
      <div className={`w-10 h-10 rounded-lg ${bgMap[color]} flex items-center justify-center text-xl mb-0.5`}>{icon}</div>
      <div className={`text-[34px] font-extrabold tracking-tighter ${textMap[color]}`}>{value}</div>
      <div className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">{label}</div>
    </button>
  );
}
