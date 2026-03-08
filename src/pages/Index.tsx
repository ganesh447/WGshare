import { useState, useEffect } from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import { data } from '@/lib/data';
import SplashScreen from '@/components/SplashScreen';
import OnboardingScreen from '@/components/OnboardingScreen';
import AppHeader from '@/components/AppHeader';
import BottomNav from '@/components/BottomNav';
import ToastContainer from '@/components/ToastContainer';
import DashboardView from '@/views/DashboardView';
import InventoryView from '@/views/InventoryView';
import BillsView from '@/views/BillsView';
import CleaningView from '@/views/CleaningView';
import PaymentsView from '@/views/PaymentsView';
import SettingsView from '@/views/SettingsView';

function AppContent() {
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { currentView, refresh } = useApp();

  useEffect(() => {
    if (!showSplash) {
      if (!data.isOnboarded()) {
        setShowOnboarding(true);
      } else {
        data.seed();
        // Refresh overdue bills
        const bills = data.get<any[]>(data.keys.bills) || [];
        const today = new Date().toISOString().split('T')[0];
        const updated = bills.map(b => b.status === 'upcoming' && b.dueDate < today ? { ...b, status: 'overdue' } : b);
        data.set(data.keys.bills, updated);
        refresh();
      }
    }
  }, [showSplash]);

  const handleOnboardComplete = () => {
    setShowOnboarding(false);
    data.seed();
    refresh();
  };

  if (showSplash) return <SplashScreen onDone={() => setShowSplash(false)} />;
  if (showOnboarding) return <OnboardingScreen onComplete={handleOnboardComplete} />;

  const views: Record<string, React.ReactNode> = {
    dashboard: <DashboardView />,
    inventory: <InventoryView />,
    bills: <BillsView />,
    cleaning: <CleaningView />,
    payments: <PaymentsView />,
    settings: <SettingsView />,
  };

  return (
    <div className="flex justify-center min-h-screen">
      <div className="w-full max-w-[430px] min-h-screen relative flex flex-col overflow-hidden"
        style={{ background: 'hsl(var(--background))' }}>
        <AppHeader />
        <ToastContainer />
        <main className="flex-1 overflow-y-auto pb-[88px] scroll-smooth">
          {views[currentView] || <DashboardView />}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}

export default function Index() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
