import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { data, AVATAR_COLORS, type Flatmate } from '@/lib/data';
import Avatar from '@/components/Avatar';
import ModalSheet from '@/components/ModalSheet';

export default function SettingsView() {
  const { flatmates, flat, currentUser, updateData, toast, setCurrentView } = useApp();
  const [showFmModal, setShowFmModal] = useState(false);
  const [editFm, setEditFm] = useState<Flatmate | null>(null);
  const [fmName, setFmName] = useState('');
  const [fmIban, setFmIban] = useState('');

  const openAdd = () => {
    setEditFm(null); setFmName(''); setFmIban('');
    setShowFmModal(true);
  };

  const openEdit = (fm: Flatmate) => {
    setEditFm(fm); setFmName(fm.name); setFmIban(fm.iban || '');
    setShowFmModal(true);
  };

  const saveFm = () => {
    if (!fmName.trim()) { toast('Name is required', 'error'); return; }
    const fm: Flatmate = {
      id: editFm?.id || data.generateId(),
      name: fmName.trim(),
      iban: fmIban.trim().replace(/\s/g, ''),
      active: editFm ? editFm.active : true,
      color: editFm ? editFm.color : flatmates.length % AVATAR_COLORS.length,
      joinedAt: editFm ? editFm.joinedAt : new Date().toISOString(),
    };
    const all = [...flatmates];
    const idx = all.findIndex(f => f.id === fm.id);
    if (idx >= 0) all[idx] = fm; else all.push(fm);
    updateData(data.keys.flatmates, all);
    setShowFmModal(false);
    toast(`${fmName} ${editFm ? 'updated' : 'added'}!`, 'success');
  };

  const toggleActive = (id: string) => {
    const all = flatmates.map(f => f.id === id ? { ...f, active: !f.active } : f);
    updateData(data.keys.flatmates, all);
  };

  const deleteFm = (id: string) => {
    const fm = flatmates.find(f => f.id === id);
    if (!fm || !confirm(`Remove ${fm.name}?`)) return;
    updateData(data.keys.flatmates, flatmates.filter(f => f.id !== id));
    toast(`${fm.name} removed`, 'info');
  };

  const logOut = () => {
    if (confirm('Log out? Your flat data stays on this device.')) {
      localStorage.removeItem(data.keys.currentUser);
      location.reload();
    }
  };

  return (
    <div className="animate-fade-in-up">
      <div className="px-5 pt-5 pb-4">
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
      </div>

      {/* Flat info */}
      <div className="px-4 mb-4">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Your Flat</p>
        <div className="glass-card rounded-xl p-4">
          <p className="font-bold text-base">{flat?.name || '—'}</p>
          {flat?.code && <p className="text-sm text-muted-foreground mt-1 font-mono">Invite code: {flat.code}</p>}
        </div>
      </div>

      {/* Flatmates */}
      <div className="px-4 mb-4">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Flatmates</p>
        <div className="glass-card rounded-xl overflow-hidden">
          {flatmates.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl opacity-30 mb-2">👥</div>
              <p className="text-sm text-muted-foreground">No flatmates yet</p>
            </div>
          ) : (
            flatmates.map(fm => (
              <div key={fm.id} className="flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-b-0">
                <Avatar name={fm.name} color={fm.color} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{fm.name}</p>
                    {!fm.active && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-secondary text-muted-foreground">Inactive</span>}
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">{fm.iban || 'No IBAN set'}</p>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => openEdit(fm)} className="px-2.5 py-1.5 rounded-full text-[11px] font-bold bg-secondary text-foreground border border-border">Edit</button>
                  <button onClick={() => toggleActive(fm.id)} className="px-2 py-1.5 rounded-full text-[11px] bg-transparent border-none text-muted-foreground">{fm.active ? '⏸' : '▶'}</button>
                  <button onClick={() => deleteFm(fm.id)} className="px-2 py-1.5 rounded-full text-[11px] font-bold bg-destructive/10 text-destructive border border-destructive/25">✕</button>
                </div>
              </div>
            ))
          )}
          <div className="p-3">
            <button onClick={openAdd} className="w-full py-3 rounded-full text-sm font-bold"
              style={{ background: 'var(--gradient-primary)', color: 'hsl(var(--primary-foreground))' }}>+ Add Flatmate</button>
          </div>
        </div>
      </div>

      {/* Log out */}
      <div className="px-4 pb-6">
        <button onClick={logOut} className="w-full py-3 rounded-full text-sm font-bold bg-destructive/10 text-destructive border border-destructive/25 hover:bg-destructive hover:text-foreground transition-all">Log Out</button>
        <p className="text-[11px] text-muted-foreground text-center mt-2">Clears your session. Flat data stays.</p>
      </div>

      {/* Flatmate modal */}
      <ModalSheet open={showFmModal} onClose={() => setShowFmModal(false)} title={editFm ? 'Edit Flatmate' : 'Add Flatmate'}>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name *</label>
          <input value={fmName} onChange={e => setFmName(e.target.value)} className="glass-input w-full rounded-lg px-3.5 py-3 text-foreground" placeholder="e.g. Lena" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">IBAN (optional)</label>
          <input value={fmIban} onChange={e => setFmIban(e.target.value)} className="glass-input w-full rounded-lg px-3.5 py-3 text-foreground" placeholder="e.g. DE89370400440532013000" />
          <span className="text-[11px] text-muted-foreground">Used for easy bank transfer reference</span>
        </div>
        <div className="flex gap-2.5 mt-2">
          <button onClick={() => setShowFmModal(false)} className="flex-1 py-3 rounded-full text-sm font-bold bg-secondary text-foreground border border-border">Cancel</button>
          <button onClick={saveFm} className="flex-1 py-3 rounded-full text-sm font-bold" style={{ background: 'var(--gradient-primary)', color: 'hsl(var(--primary-foreground))' }}>Save</button>
        </div>
      </ModalSheet>
    </div>
  );
}
