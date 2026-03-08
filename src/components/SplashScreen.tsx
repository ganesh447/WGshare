import { useState, useEffect } from 'react';

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setExiting(true), 1400);
    const exit = setTimeout(() => onDone(), 1800);
    return () => { clearTimeout(timer); clearTimeout(exit); };
  }, [onDone]);

  return (
    <div className={`fixed inset-0 z-[400] flex items-center justify-center bg-background transition-opacity duration-400 ${exiting ? 'opacity-0' : 'opacity-100'}`}>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsla(217, 91%, 60%, 0.15), transparent 70%)' }} />
      <div className="text-center animate-fade-in-up">
        <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
          style={{ background: 'var(--gradient-primary)', boxShadow: '0 4px 24px hsla(217, 91%, 60%, 0.4)' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">WG<span className="text-primary">share</span></h1>
        <p className="text-sm text-muted-foreground mt-2">Your flatshare, organised</p>
      </div>
    </div>
  );
}
