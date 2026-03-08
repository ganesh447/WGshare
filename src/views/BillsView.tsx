import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { data, type Bill } from '@/lib/data';
import ModalSheet from '@/components/ModalSheet';

export default function BillsView() {
  const { bills, flatmates, updateData, toast } = useApp();
  const [tab, setTab] = useState<'upcoming' | 'paid'>('upcoming');
  const [showModal, setShowModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [editBill, setEditBill] = useState<Bill | null>(null);
  const [payBillId, setPayBillId] = useState('');

  const [formName, setFormName] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formPeriod, setFormPeriod] = useState('');
  const [payerId, setPayerId] = useState('');

  const activeFm = flatmates.filter(f => f.active);
  const calcSplit = (amt: number) => parseFloat((amt / (activeFm.length || 1)).toFixed(2));

  // Refresh overdue
  const today = new Date().toISOString().split('T')[0];
  const allBills = bills.map(b => b.status === 'upcoming' && b.dueDate < today ? { ...b, status: 'overdue' } : b);

  const items = tab === 'upcoming'
    ? allBills.filter(b => b.status === 'upcoming' || b.status === 'overdue').sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    : allBills.filter(b => b.status === 'paid').sort((a, b) => (b.paymentDate || '').localeCompare(a.paymentDate || ''));

  const openAdd = () => {
    setEditBill(null);
    setFormName(''); setFormAmount(''); setFormDueDate(''); setFormPeriod('');
    setShowModal(true);
  };

  const openEdit = (bill: Bill) => {
    setEditBill(bill);
    setFormName(bill.name); setFormAmount(String(bill.amount)); setFormDueDate(bill.dueDate); setFormPeriod(bill.billingPeriod);
    setShowModal(true);
  };

  const saveBill = () => {
    if (!formName.trim()) { toast('Bill name is required', 'error'); return; }
    const amount = parseFloat(formAmount);
    if (!amount || amount <= 0) { toast('Enter a valid amount', 'error'); return; }
    if (!formDueDate) { toast('Due date is required', 'error'); return; }

    const bill: Bill = {
      id: editBill?.id || data.generateId(),
      name: formName.trim(),
      amount,
      dueDate: formDueDate,
      billingPeriod: formPeriod.trim(),
      splitAmount: calcSplit(amount),
      status: editBill?.status || 'upcoming',
      paidBy: editBill?.paidBy || null,
      paymentDate: editBill?.paymentDate || null,
      createdAt: editBill?.createdAt || new Date().toISOString(),
    };

    const all = [...bills];
    const idx = all.findIndex(b => b.id === bill.id);
    if (idx >= 0) all[idx] = bill; else all.push(bill);
    updateData(data.keys.bills, all);
    setShowModal(false);
    toast(`${formName} ${editBill ? 'updated' : 'added'}!`, 'success');
  };

  const deleteBill = (id: string) => {
    const bill = bills.find(b => b.id === id);
    if (!bill || !confirm(`Delete "${bill.name}"?`)) return;
    updateData(data.keys.bills, bills.filter(b => b.id !== id));
    toast('Bill deleted', 'info');
  };

  const openPayModal = (id: string) => {
    setPayBillId(id);
    setPayerId(activeFm[0]?.id || '');
    setShowPayModal(true);
  };

  const confirmPayment = () => {
    if (!payerId) { toast('Select who paid', 'error'); return; }
    const all = [...bills];
    const idx = all.findIndex(b => b.id === payBillId);
    if (idx < 0) return;
    const bill = all[idx];
    const now = new Date().toISOString();
    const activeOthers = activeFm.filter(f => f.id !== payerId).map(f => f.id);

    all[idx] = { ...bill, status: 'paid', paidBy: payerId, paymentDate: now };
    updateData(data.keys.bills, all);

    const txs = data.get<any[]>(data.keys.transactions) || [];
    txs.push({ id: data.generateId(), type: 'bill_payment', from: payerId, to: activeOthers, amount: bill.amount, perPersonAmount: bill.splitAmount, date: now, reference: `${bill.name} - ${bill.billingPeriod || bill.dueDate}`, billId: bill.id });
    updateData(data.keys.transactions, txs);

    setShowPayModal(false);
    const payer = flatmates.find(f => f.id === payerId);
    toast(`${bill.name} marked as paid by ${payer?.name}!`, 'success');
  };

  return (
    <div className="animate-fade-in-up">
      <div className="px-5 pt-5 pb-2">
        <h2 className="text-2xl font-bold tracking-tight">Bills</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Split & track shared expenses</p>
      </div>

      <div className="mx-4 mb-4 flex rounded-full border border-border bg-secondary/30 p-1">
        <button onClick={() => setTab('upcoming')} className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition-all ${tab === 'upcoming' ? 'glass-card text-foreground' : 'text-muted-foreground'}`}>📅 Upcoming</button>
        <button onClick={() => setTab('paid')} className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition-all ${tab === 'paid' ? 'glass-card text-foreground' : 'text-muted-foreground'}`}>✅ Paid</button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl opacity-30 mb-3">📋</div>
          <h3 className="text-muted-foreground font-semibold">No {tab} bills</h3>
          <p className="text-sm text-muted-foreground mt-1">{tab === 'upcoming' ? 'Add your first bill with +' : 'Paid bills appear here'}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 px-4">
          {items.map(bill => {
            const isPaid = bill.status === 'paid';
            const isOverdue = bill.status === 'overdue';
            const payer = bill.paidBy ? flatmates.find(f => f.id === bill.paidBy) : null;
            return (
              <div key={bill.id} className={`glass-card rounded-xl p-4 animate-fade-in-up ${isOverdue ? 'border-destructive/30' : ''}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-lg">{bill.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{bill.billingPeriod}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-lg">{data.formatCurrency(bill.amount)}</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold uppercase mt-1 ${
                      isOverdue ? 'bg-destructive/10 text-destructive' : isPaid ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-primary'
                    }`}>{isOverdue ? 'Overdue' : isPaid ? 'Paid' : 'Upcoming'}</span>
                  </div>
                </div>

                <div className="flex mt-3 rounded-lg bg-secondary/30 divide-x divide-border">
                  <div className="flex-1 py-2 text-center">
                    <p className="text-sm font-bold">{data.formatCurrency(calcSplit(bill.amount))}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">Per person</p>
                  </div>
                  <div className="flex-1 py-2 text-center">
                    <p className="text-sm font-bold">{activeFm.length}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">Flatmates</p>
                  </div>
                  <div className="flex-1 py-2 text-center">
                    <p className="text-sm font-bold">{data.formatDateShort(bill.dueDate)}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">Due date</p>
                  </div>
                </div>

                {isPaid && payer && (
                  <p className="text-xs text-muted-foreground mt-2">Paid by <b>{payer.name}</b> on {data.formatDate(bill.paymentDate)}</p>
                )}

                <div className="flex justify-between items-center mt-3">
                  {!isPaid ? (
                    <button onClick={() => openPayModal(bill.id)} className="px-3 py-2 rounded-full text-xs font-bold" style={{ background: 'var(--gradient-primary)', color: 'hsl(var(--primary-foreground))' }}>Mark as Paid</button>
                  ) : <span className="text-xs text-muted-foreground">History</span>}
                  <div className="flex gap-2">
                    {!isPaid && <button onClick={() => openEdit(bill)} className="px-3 py-2 rounded-full text-xs font-bold bg-secondary text-foreground border border-border">Edit</button>}
                    <button onClick={() => deleteBill(bill.id)} className="px-3 py-2 rounded-full text-xs font-bold bg-destructive/10 text-destructive border border-destructive/25">✕</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button onClick={openAdd} className="fixed bottom-[88px] right-[calc(50%-195px)] w-14 h-14 rounded-full text-3xl font-light border-none flex items-center justify-center z-50"
        style={{ background: 'var(--gradient-primary)', color: 'hsl(var(--primary-foreground))', animation: 'fabPulse 3s ease-in-out infinite' }}>+</button>

      {/* Add/Edit Modal */}
      <ModalSheet open={showModal} onClose={() => setShowModal(false)} title={editBill ? 'Edit Bill' : 'Add Bill'}>
        <FormField label="Bill Name *">
          <input value={formName} onChange={e => setFormName(e.target.value)} className="glass-input w-full rounded-lg px-3.5 py-3 text-foreground" placeholder="e.g. Internet" />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Total Amount (€) *">
            <input type="number" value={formAmount} onChange={e => setFormAmount(e.target.value)} className="glass-input w-full rounded-lg px-3.5 py-3 text-foreground" step="0.01" min="0" placeholder="0.00" />
          </FormField>
          <FormField label="Due Date *">
            <input type="date" value={formDueDate} onChange={e => setFormDueDate(e.target.value)} className="glass-input w-full rounded-lg px-3.5 py-3 text-foreground" />
          </FormField>
        </div>
        <FormField label="Billing Period">
          <input value={formPeriod} onChange={e => setFormPeriod(e.target.value)} className="glass-input w-full rounded-lg px-3.5 py-3 text-foreground" placeholder="e.g. March 2026" />
        </FormField>
        <div className="glass-surface rounded-lg px-4 py-3 flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Split per person</span>
          <span className="font-bold text-primary">{formAmount && parseFloat(formAmount) > 0 ? `${data.formatCurrency(calcSplit(parseFloat(formAmount)))} per person` : '—'}</span>
        </div>
        <div className="flex gap-2.5 mt-2">
          <button onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-full text-sm font-bold bg-secondary text-foreground border border-border">Cancel</button>
          <button onClick={saveBill} className="flex-1 py-3 rounded-full text-sm font-bold" style={{ background: 'var(--gradient-primary)', color: 'hsl(var(--primary-foreground))' }}>Save Bill</button>
        </div>
      </ModalSheet>

      {/* Pay Modal */}
      <ModalSheet open={showPayModal} onClose={() => setShowPayModal(false)} title="Mark Bill as Paid">
        <FormField label="Paid by">
          <select value={payerId} onChange={e => setPayerId(e.target.value)} className="glass-input w-full rounded-lg px-3.5 py-3 text-foreground">
            {activeFm.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </FormField>
        <p className="text-xs text-muted-foreground">The payer's share will be deducted and others will owe their split amount.</p>
        <div className="flex gap-2.5 mt-2">
          <button onClick={() => setShowPayModal(false)} className="flex-1 py-3 rounded-full text-sm font-bold bg-secondary text-foreground border border-border">Cancel</button>
          <button onClick={confirmPayment} className="flex-1 py-3 rounded-full text-sm font-bold" style={{ background: 'var(--gradient-primary)', color: 'hsl(var(--primary-foreground))' }}>✓ Confirm</button>
        </div>
      </ModalSheet>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}
