import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { data, type Transaction, type Notification } from '@/lib/data';
import Avatar from '@/components/Avatar';
import ModalSheet from '@/components/ModalSheet';

export default function PaymentsView() {
  const { flatmates, transactions, currentUser, updateData, toast } = useApp();
  const [activeTab, setActiveTab] = useState<'balances' | 'history'>('balances');
  const [breakdownFm, setBreakdownFm] = useState<string | null>(null);
  const [settleConfirmId, setSettleConfirmId] = useState<string | null>(null);

  if (!currentUser) {
    return <div className="text-center py-16"><div className="text-5xl opacity-30 mb-3">👤</div><h3 className="text-muted-foreground font-semibold">Not logged in</h3></div>;
  }
  if (flatmates.length === 0) {
    return <div className="text-center py-16"><div className="text-5xl opacity-30 mb-3">💳</div><h3 className="text-muted-foreground font-semibold">No flatmates yet</h3><p className="text-sm text-muted-foreground mt-1">Add flatmates in Settings first</p></div>;
  }

  const meId = currentUser.id;

  const calculatePairBalances = () => {
    const pairBalances: Record<string, number> = {};
    for (const t of transactions) {
      const perPerson = parseFloat(String(t.perPersonAmount)) || 0;
      const others = (t.to || []).filter(id => id !== t.from);
      if (t.from === meId) {
        others.forEach(id => { pairBalances[id] = (pairBalances[id] || 0) + perPerson; });
      } else if (others.includes(meId)) {
        pairBalances[t.from] = (pairBalances[t.from] || 0) - perPerson;
      }
    }
    return pairBalances;
  };

  const pairBalances = calculatePairBalances();
  const myNet = Object.values(pairBalances).reduce((s, v) => s + v, 0);
  const owedToMe = Object.entries(pairBalances).filter(([, v]) => v > 0.01);
  const iOwe = Object.entries(pairBalances).filter(([, v]) => v < -0.01);

  const heroColor = myNet > 0.01 ? 'text-accent' : myNet < -0.01 ? 'text-destructive' : 'text-foreground';
  const heroLabel = myNet > 0.01 ? 'you are owed' : myNet < -0.01 ? 'you owe' : "you're all settled";

  const copyIban = (fmId: string) => {
    const fm = flatmates.find(f => f.id === fmId);
    if (!fm?.iban) { toast('No IBAN on file', 'warning'); return; }
    navigator.clipboard?.writeText(fm.iban).then(() => toast(`Copied ${fm.name}'s IBAN!`, 'success'));
  };

  const handleSettle = (flatmateId: string, amount: number) => {
    const fm = flatmates.find(f => f.id === flatmateId);
    const now = new Date().toISOString();
    const txs = data.get<Transaction[]>(data.keys.transactions) || [];
    txs.push({
      id: data.generateId(),
      type: 'settlement',
      from: meId,
      to: [flatmateId],
      amount: Math.abs(amount),
      perPersonAmount: Math.abs(amount),
      date: now,
      reference: `Settlement to ${fm?.name || 'flatmate'}`,
    });
    updateData(data.keys.transactions, txs);

    const notifs = data.get<Notification[]>(data.keys.notifications) || [];
    notifs.unshift({
      id: data.generateId(),
      type: 'settlement',
      message: `You settled ${data.formatCurrency(Math.abs(amount))} with ${fm?.name}`,
      timestamp: now,
      read: false,
    });
    updateData(data.keys.notifications, notifs);
    setSettleConfirmId(null);
    toast(`Settled up with ${fm?.name}!`, 'success');
  };

  const breakdownFmObj = breakdownFm ? flatmates.find(f => f.id === breakdownFm) : null;
  const breakdownBalance = breakdownFm ? (pairBalances[breakdownFm] || 0) : 0;
  const relevantTxs = breakdownFm ? transactions.filter(t => {
    const others = t.to || [];
    return (t.from === meId && others.includes(breakdownFm)) || (t.from === breakdownFm && others.includes(meId));
  }).reverse() : [];

  const txIcons: Record<string, string> = { purchase: '🛒', bill_payment: '📋', settlement: '💸' };

  return (
    <div className="animate-fade-in-up">
      <div className="px-5 pt-5 pb-2">
        <h2 className="text-2xl font-bold tracking-tight">Payments</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Balances & settlements</p>
      </div>

      {/* Hero */}
      <div className="mx-4 mb-4 p-6 rounded-2xl relative overflow-hidden" style={{ background: 'var(--gradient-hero)' }}>
        <p className="text-[13px] text-foreground/60 font-semibold">Your Balance</p>
        <p className={`text-3xl font-extrabold mt-1 ${heroColor}`}>
          {myNet === 0 ? '€0.00' : (myNet > 0 ? '+' : '') + '€' + Math.abs(myNet).toFixed(2)}
        </p>
        <p className="text-sm text-foreground/55 mt-1">{heroLabel}</p>
      </div>

      {/* Tab pills */}
      <div className="flex gap-2 px-4 mb-4">
        {(['balances', 'history'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition-all ${
              activeTab === tab ? 'bg-primary text-primary-foreground' : 'glass-card text-muted-foreground'
            }`}>
            {tab === 'balances' ? '⚖️ Balances' : '📜 History'}
          </button>
        ))}
      </div>

      {/* Balances tab */}
      {activeTab === 'balances' && (
        <>
          {/* Owed to you */}
          {owedToMe.length > 0 && (
            <div className="px-4 pb-2">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Owed to you</p>
              <div className="flex flex-col gap-2.5">
                {owedToMe.map(([otherId, amount]) => {
                  const fm = flatmates.find(f => f.id === otherId);
                  if (!fm) return null;
                  return (
                    <button key={otherId} onClick={() => setBreakdownFm(otherId)}
                      className="glass-card rounded-xl p-4 flex items-center gap-3 text-left hover:translate-y-[-2px] transition-all"
                      style={{ boxShadow: '0 0 20px hsla(142, 71%, 45%, 0.08)' }}>
                      <Avatar name={fm.name} color={fm.color} size={44} />
                      <div className="flex-1">
                        <p className="font-semibold">{fm.name}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Tap to see breakdown</p>
                      </div>
                      <span className="font-bold text-accent">+€{amount.toFixed(2)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* You owe */}
          {iOwe.length > 0 && (
            <div className="px-4 pb-2">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">You owe</p>
              <div className="flex flex-col gap-2.5">
                {iOwe.map(([otherId, amount]) => {
                  const fm = flatmates.find(f => f.id === otherId);
                  if (!fm) return null;
                  const isConfirming = settleConfirmId === otherId;
                  return (
                    <div key={otherId}
                      className="glass-card rounded-xl p-4 flex items-center gap-3"
                      style={{ boxShadow: '0 0 20px hsla(0, 84%, 60%, 0.08)' }}>
                      <button onClick={() => !isConfirming && setBreakdownFm(otherId)} className="flex items-center gap-3 flex-1 text-left min-w-0">
                        <Avatar name={fm.name} color={fm.color} size={44} />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold">{fm.name}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {isConfirming ? 'Confirm settlement?' : 'Tap to see breakdown'}
                          </p>
                        </div>
                      </button>
                      {!isConfirming ? (
                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          <span className="font-bold text-destructive">-€{Math.abs(amount).toFixed(2)}</span>
                          <button onClick={() => setSettleConfirmId(otherId)}
                            className="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20 whitespace-nowrap">
                            Settle Up
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          <span className="text-xs text-muted-foreground font-semibold">€{Math.abs(amount).toFixed(2)}</span>
                          <div className="flex gap-1.5">
                            <button onClick={() => handleSettle(otherId, amount)}
                              className="px-3 py-1.5 rounded-full text-xs font-bold bg-primary text-primary-foreground">
                              ✓ Confirm
                            </button>
                            <button onClick={() => setSettleConfirmId(null)}
                              className="px-3 py-1.5 rounded-full text-xs font-bold glass-card text-muted-foreground">
                              ✕
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {owedToMe.length === 0 && iOwe.length === 0 && (
            <div className="text-center py-8">
              <div className="text-5xl opacity-30 mb-3">🎉</div>
              <h3 className="text-muted-foreground font-semibold">All settled up!</h3>
              <p className="text-sm text-muted-foreground mt-1">No outstanding balances</p>
            </div>
          )}
        </>
      )}

      {/* History tab */}
      {activeTab === 'history' && (
        <div className="px-4 pb-4">
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-5xl opacity-30 mb-3">📜</div>
              <h3 className="text-muted-foreground font-semibold">No transactions yet</h3>
            </div>
          ) : (
            <div className="glass-card rounded-xl overflow-hidden">
              {[...transactions].reverse().map(tx => {
                const payer = flatmates.find(f => f.id === tx.from);
                return (
                  <div key={tx.id} className="flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-b-0">
                    <span className="text-xl">{txIcons[tx.type] || '💰'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold truncate">{tx.reference}</p>
                      <p className="text-[11px] text-muted-foreground">{payer?.name || '?'} · {data.formatDate(tx.date)}</p>
                    </div>
                    <span className="text-sm font-bold flex-shrink-0">{data.formatCurrency(tx.amount)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Breakdown modal */}
      <ModalSheet open={!!breakdownFm} onClose={() => setBreakdownFm(null)} title={breakdownFmObj ? `You & ${breakdownFmObj.name}` : 'Breakdown'}>
        {breakdownFmObj && (
          <>
            <div className="text-center pb-4 mb-3 border-b border-border">
              <Avatar name={breakdownFmObj.name} color={breakdownFmObj.color} size={56} />
              <p className={`mt-2.5 font-bold ${breakdownBalance > 0.01 ? 'text-accent' : breakdownBalance < -0.01 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {breakdownBalance > 0.01 ? `${breakdownFmObj.name} owes you €${breakdownBalance.toFixed(2)}`
                  : breakdownBalance < -0.01 ? `You owe ${breakdownFmObj.name} €${Math.abs(breakdownBalance).toFixed(2)}`
                  : 'All settled up'}
              </p>
            </div>

            {breakdownFmObj.iban && (
              <button onClick={() => copyIban(breakdownFmObj.id)} className="w-full py-3 rounded-full text-sm font-bold bg-secondary text-foreground border border-border mb-3 truncate">
                Copy IBAN · {breakdownFmObj.iban}
              </button>
            )}

            {relevantTxs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No transactions yet</p>
            ) : (
              relevantTxs.map(t => {
                const payer = flatmates.find(f => f.id === t.from);
                const perPerson = parseFloat(String(t.perPersonAmount)) || 0;
                const iMePaying = t.from === meId;
                return (
                  <div key={t.id} className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-b-0">
                    <span className="text-xl flex-shrink-0">{txIcons[t.type] || '💰'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold truncate">{t.reference}</p>
                      <p className="text-[11px] text-muted-foreground">{payer?.name || '?'} paid · {data.formatDateShort(t.date)}</p>
                    </div>
                    <span className={`text-sm font-bold flex-shrink-0 ${iMePaying ? 'text-accent' : 'text-destructive'}`}>
                      {iMePaying ? '+' : '-'}€{perPerson.toFixed(2)}
                    </span>
                  </div>
                );
              })
            )}

            <button onClick={() => setBreakdownFm(null)} className="w-full py-3 rounded-full text-sm font-bold bg-secondary text-foreground border border-border mt-3">Close</button>
          </>
        )}
      </ModalSheet>
    </div>
  );
}
