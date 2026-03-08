import { useState } from 'react';
import { data } from '@/lib/data';
import { useApp } from '@/context/AppContext';

type Step = 'choose' | 'create' | 'join' | 'code';

export default function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const { updateData, toast } = useApp();
  const [step, setStep] = useState<Step>('choose');
  const [name, setName] = useState('');
  const [flatName, setFlatName] = useState('');
  const [joinName, setJoinName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');

  const handleCreate = () => {
    if (!name.trim()) { toast('Please enter your name', 'error'); return; }
    if (!flatName.trim()) { toast('Please enter a flat name', 'error'); return; }

    const code = Math.random().toString(36).substr(2, 6).toUpperCase();
    data.set(data.keys.flat, { name: flatName.trim(), code, createdAt: new Date().toISOString() });

    const fmId = data.generateId();
    const flatmates = data.get<any[]>(data.keys.flatmates) || [];
    flatmates.push({ id: fmId, name: name.trim(), iban: '', active: true, color: 0, joinedAt: new Date().toISOString() });
    data.set(data.keys.flatmates, flatmates);
    data.set(data.keys.currentUser, { id: fmId, name: name.trim(), color: 0 });

    setGeneratedCode(code);
    setStep('code');
  };

  const handleJoin = () => {
    if (!joinName.trim()) { toast('Please enter your name', 'error'); return; }
    if (!joinCode.trim()) { toast('Please enter an invite code', 'error'); return; }

    const flat = data.get<any>(data.keys.flat);
    if (!flat || flat.code !== joinCode.trim().toUpperCase()) {
      toast('Code not found — ask your flatmate', 'error');
      return;
    }

    const fmId = data.generateId();
    const existing = data.get<any[]>(data.keys.flatmates) || [];
    const colorIdx = existing.length % 6;
    existing.push({ id: fmId, name: joinName.trim(), iban: '', active: true, color: colorIdx, joinedAt: new Date().toISOString() });
    data.set(data.keys.flatmates, existing);
    data.set(data.keys.currentUser, { id: fmId, name: joinName.trim(), color: colorIdx });
    onComplete();
  };

  const copyCode = () => {
    navigator.clipboard?.writeText(generatedCode);
    toast(`Code ${generatedCode} copied!`, 'success');
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-background">
      <div className="w-full max-w-[430px] min-h-screen flex flex-col relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, hsl(var(--primary)), transparent 70%)' }} />

        <div className="flex-1 flex items-center justify-center px-6">
          {step === 'choose' && (
            <div className="w-full animate-fade-in-up">
              <div className="text-center mb-10">
                <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
                  style={{ background: 'var(--gradient-primary)', boxShadow: '0 4px 24px hsla(217, 91%, 60%, 0.4)' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight">WG<span className="text-primary">share</span></h1>
                <p className="text-sm text-muted-foreground mt-2">Let's get your flat set up</p>
              </div>

              <div className="flex flex-col gap-3">
                <button onClick={() => setStep('create')}
                  className="glass-card rounded-2xl p-5 flex items-center gap-4 text-left hover:translate-y-[-2px] transition-all group">
                  <span className="text-3xl">🏠</span>
                  <div className="flex-1">
                    <p className="font-bold text-base">Create a Flat</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Start fresh and invite your flatmates</p>
                  </div>
                  <span className="text-muted-foreground group-hover:text-foreground transition-colors">›</span>
                </button>
                <button onClick={() => setStep('join')}
                  className="glass-card rounded-2xl p-5 flex items-center gap-4 text-left hover:translate-y-[-2px] transition-all group">
                  <span className="text-3xl">🔑</span>
                  <div className="flex-1">
                    <p className="font-bold text-base">Join a Flat</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Enter your invite code to join</p>
                  </div>
                  <span className="text-muted-foreground group-hover:text-foreground transition-colors">›</span>
                </button>
              </div>
            </div>
          )}

          {step === 'create' && (
            <div className="w-full animate-fade-in-up">
              <button onClick={() => setStep('choose')} className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 bg-transparent border-none">← Back</button>
              <h2 className="text-2xl font-extrabold tracking-tight mb-1">Create your flat</h2>
              <p className="text-sm text-muted-foreground mb-7">You'll get an invite code to share with flatmates</p>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Your Name</label>
                  <input value={name} onChange={e => setName(e.target.value)} className="glass-input w-full rounded-lg px-3.5 py-3 text-foreground" placeholder="e.g. Lena" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Flat Name</label>
                  <input value={flatName} onChange={e => setFlatName(e.target.value)} className="glass-input w-full rounded-lg px-3.5 py-3 text-foreground" placeholder="e.g. Schillerstraße WG" />
                </div>
                <button onClick={handleCreate} className="w-full py-3.5 rounded-full text-sm font-bold mt-2"
                  style={{ background: 'var(--gradient-primary)', color: 'hsl(var(--primary-foreground))' }}>Create Flat →</button>
              </div>
            </div>
          )}

          {step === 'join' && (
            <div className="w-full animate-fade-in-up">
              <button onClick={() => setStep('choose')} className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 bg-transparent border-none">← Back</button>
              <h2 className="text-2xl font-extrabold tracking-tight mb-1">Join a flat</h2>
              <p className="text-sm text-muted-foreground mb-7">Ask your flatmate for the 6-character invite code</p>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Your Name</label>
                  <input value={joinName} onChange={e => setJoinName(e.target.value)} className="glass-input w-full rounded-lg px-3.5 py-3 text-foreground" placeholder="e.g. Marco" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Invite Code</label>
                  <input value={joinCode} onChange={e => setJoinCode(e.target.value)} className="glass-input w-full rounded-lg px-3.5 py-3 text-foreground text-center text-2xl tracking-[0.5em] uppercase font-bold" placeholder="K4X9MR" maxLength={6} />
                </div>
                <button onClick={handleJoin} className="w-full py-3.5 rounded-full text-sm font-bold mt-2"
                  style={{ background: 'var(--gradient-primary)', color: 'hsl(var(--primary-foreground))' }}>Join Flat →</button>
              </div>
            </div>
          )}

          {step === 'code' && (
            <div className="w-full animate-fade-in-up text-center">
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-[22px] font-extrabold tracking-tight mb-1.5">Flat created!</h2>
              <p className="text-sm text-muted-foreground mb-7">Share this code with your flatmates so they can join</p>
              <div className="glass-card rounded-2xl p-6 mb-5">
                <p className="text-[11px] text-muted-foreground uppercase tracking-widest mb-2">Invite Code</p>
                <p className="text-4xl font-extrabold tracking-[0.3em] text-primary">{generatedCode}</p>
              </div>
              <div className="flex flex-col gap-2.5">
                <button onClick={copyCode} className="w-full py-3.5 rounded-full text-sm font-bold bg-secondary text-foreground border border-border">📋 Copy Code</button>
                <button onClick={onComplete} className="w-full py-3.5 rounded-full text-sm font-bold"
                  style={{ background: 'var(--gradient-primary)', color: 'hsl(var(--primary-foreground))' }}>Enter App →</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
