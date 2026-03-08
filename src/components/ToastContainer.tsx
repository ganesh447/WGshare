import { useApp } from '@/context/AppContext';

const TOAST_ICONS: Record<string, string> = {
  success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️',
};

const TOAST_BORDER: Record<string, string> = {
  success: 'border-l-accent-green',
  error: 'border-l-destructive',
  warning: 'border-l-accent-amber',
  info: 'border-l-primary',
};

export default function ToastContainer() {
  const { toasts } = useApp();

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[500] flex flex-col gap-2 w-[calc(100%-32px)] max-w-[398px] pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`glass-card rounded-lg px-4 py-3 flex items-center gap-2.5 text-sm font-medium text-foreground pointer-events-auto animate-fade-in-up border-l-[3px] ${TOAST_BORDER[t.type] || 'border-l-primary'}`}
        >
          <span className="text-lg flex-shrink-0">{TOAST_ICONS[t.type] || 'ℹ️'}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
