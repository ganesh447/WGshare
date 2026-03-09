import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { data, CATEGORIES, UNITS, type InventoryItem } from '@/lib/data';
import ModalSheet from '@/components/ModalSheet';

export default function InventoryView() {
  const { inventory, flatmates, currentUser, updateData, toast, refresh } = useApp();
  const [tab, setTab] = useState<'inventory' | 'shopping'>('inventory');
  const [category, setCategory] = useState('all');

  const [showModal, setShowModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [purchaseItem, setPurchaseItem] = useState<InventoryItem | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('food');
  const [formQty, setFormQty] = useState('1');
  const [formThreshold, setFormThreshold] = useState('1');
  const [formUnit, setFormUnit] = useState('pieces');
  const [formNotes, setFormNotes] = useState('');
  const [formStatus, setFormStatus] = useState('available');

  // Purchase form
  const [purchBuyer, setPurchBuyer] = useState('');
  const [purchQty, setPurchQty] = useState('1');
  const [purchCost, setPurchCost] = useState('');

  const computeStatus = (item: InventoryItem) => {
    if (item.status === 'needed') return 'needed';
    if (item.quantity <= 0) return 'depleted';
    return 'available';
  };

  const allItems = inventory.map(i => ({ ...i, status: computeStatus(i) }));
  const inventoryItems = allItems.filter(i => i.status !== 'needed');
  const shoppingItems = allItems.filter(i => i.status === 'depleted' || i.status === 'needed');

  let displayItems = tab === 'inventory' ? inventoryItems : shoppingItems;
  if (tab === 'inventory' && category !== 'all') {
    displayItems = displayItems.filter(i => i.category === category);
  }

  const openAdd = () => {
    setEditItem(null);
    setFormName(''); setFormCategory('food'); setFormQty('1'); setFormThreshold('1'); setFormUnit('pieces'); setFormNotes('');
    setFormStatus(tab === 'shopping' ? 'needed' : 'available');
    setShowModal(true);
  };

  const openEdit = (item: InventoryItem) => {
    setEditItem(item);
    setFormName(item.name); setFormCategory(item.category); setFormQty(String(item.quantity));
    setFormThreshold(String(item.minThreshold)); setFormUnit(item.unit); setFormNotes(item.notes || '');
    setFormStatus(item.status);
    setShowModal(true);
  };

  const saveItem = () => {
    if (!formName.trim()) { toast('Item name is required', 'error'); return; }
    const qty = parseFloat(formQty) || 0;
    const item: InventoryItem = {
      id: editItem?.id || data.generateId(),
      name: formName.trim(),
      category: formCategory,
      quantity: qty,
      minThreshold: parseFloat(formThreshold) || 1,
      unit: formUnit,
      status: formStatus,
      lastPurchasedBy: editItem?.lastPurchasedBy || null,
      lastPurchaseDate: editItem?.lastPurchaseDate || null,
      lastPurchaseCost: editItem?.lastPurchaseCost || null,
      purchaseHistory: editItem?.purchaseHistory || [],
      notes: formNotes.trim(),
      addedAt: editItem?.addedAt || new Date().toISOString(),
      assignedTo: editItem?.assignedTo || null,
    };

    const all = [...inventory];
    const idx = all.findIndex(i => i.id === item.id);
    if (idx >= 0) all[idx] = item; else all.push(item);
    updateData(data.keys.inventory, all);
    setShowModal(false);
    toast(`${formName} ${editItem ? 'updated' : 'added'}!`, 'success');
  };

  const deleteItem = () => {
    if (!editItem) return;
    updateData(data.keys.inventory, inventory.filter(i => i.id !== editItem.id));
    setShowModal(false);
    toast('Item deleted', 'info');
  };

  const openPurchase = (item: InventoryItem) => {
    setPurchaseItem(item);
    setPurchBuyer(currentUser?.id || '');
    setPurchQty('1');
    setPurchCost(String(item.lastPurchaseCost || ''));
    setShowPurchaseModal(true);
  };

  const confirmPurchase = () => {
    if (!purchaseItem || !purchBuyer) { toast('Could not identify buyer', 'error'); return; }
    const cost = parseFloat(purchCost) || 0;
    const newQty = parseFloat(purchQty) || 1;
    const now = new Date().toISOString();
    const all = [...inventory];
    const idx = all.findIndex(i => i.id === purchaseItem.id);
    if (idx < 0) return;

    all[idx] = {
      ...all[idx],
      quantity: all[idx].quantity + newQty,
      status: 'available',
      lastPurchasedBy: purchBuyer,
      lastPurchaseDate: now,
      lastPurchaseCost: cost,
      purchaseHistory: [...(all[idx].purchaseHistory || []), { purchasedBy: purchBuyer, date: now, cost, quantity: newQty }],
    };
    updateData(data.keys.inventory, all);

    // Notifications
    const buyerName = flatmates.find(f => f.id === purchBuyer)?.name || 'Someone';
    const notifs = data.get<any[]>(data.keys.notifications) || [];
    notifs.unshift({ id: data.generateId(), type: 'purchase_recorded', message: `${purchaseItem.name} purchased by ${buyerName}`, timestamp: now, read: false });
    if (all[idx].quantity < all[idx].minThreshold) {
      notifs.unshift({ id: data.generateId(), type: 'inventory_depletion', message: `${purchaseItem.name} is running low (${all[idx].quantity} ${all[idx].unit} left)`, timestamp: now, read: false });
    }
    updateData(data.keys.notifications, notifs);

    if (cost > 0) {
      const activeFm = flatmates.filter(f => f.active);
      const activeOthers = activeFm.filter(f => f.id !== purchBuyer).map(f => f.id);
      const perPerson = cost / activeFm.length;
      const txs = data.get<any[]>(data.keys.transactions) || [];
      txs.push({ id: data.generateId(), type: 'purchase', from: purchBuyer, to: activeOthers, amount: cost, perPersonAmount: perPerson, date: now, reference: `${purchaseItem.name} (shopping)`, itemId: purchaseItem.id });
      updateData(data.keys.transactions, txs);
    }

    setShowPurchaseModal(false);
    const buyer = flatmates.find(f => f.id === purchBuyer);
    toast(`✓ ${purchaseItem.name} purchased by ${buyer?.name}!`, 'success');
  };

  const activeFm = flatmates.filter(f => f.active);

  return (
    <div className="animate-fade-in-up">
      <div className="px-5 pt-5 pb-2">
        <h2 className="text-2xl font-bold tracking-tight">Inventory</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Track what you have & need</p>
      </div>

      {/* Tabs */}
      <div className="mx-4 mb-4 flex rounded-full border border-border bg-secondary/30 p-1">
        <button onClick={() => setTab('inventory')} className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition-all ${tab === 'inventory' ? 'glass-card text-foreground' : 'text-muted-foreground'}`}>📦 In Stock</button>
        <button onClick={() => setTab('shopping')} className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition-all ${tab === 'shopping' ? 'glass-card text-foreground' : 'text-muted-foreground'}`}>🛒 Shopping List</button>
      </div>

      {/* Category pills (inventory tab only) */}
      {tab === 'inventory' && (
        <>
          <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
            {CATEGORIES.map(c => (
              <button key={c.key} onClick={() => setCategory(c.key)}
                className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-[12px] font-bold transition-all border ${
                  category === c.key ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground'
                }`}>
                <span className="text-lg">{c.icon}</span>
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Items */}
      {displayItems.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl opacity-30 mb-3">{tab === 'shopping' ? '🛒' : '📦'}</div>
          <h3 className="text-muted-foreground font-semibold">No items here</h3>
          <p className="text-sm text-muted-foreground mt-1">Add items with the + button</p>
        </div>
      ) : tab === 'shopping' ? (
        <div className="flex flex-col gap-2.5 px-4">
          {displayItems.map(item => {
            const catIcon = CATEGORIES.find(c => c.key === item.category)?.icon || '📦';
            const assignee = item.assignedTo ? flatmates.find(f => f.id === item.assignedTo) : null;
            return (
              <div key={item.id} className="glass-card rounded-xl p-4 flex items-center gap-3 animate-fade-in-up">
                <span className="text-2xl">{catIcon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{item.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold uppercase ${item.status === 'depleted' ? 'bg-destructive/10 text-destructive' : 'bg-accent-amber/10 text-accent-amber'}`}>
                      {item.status === 'depleted' ? 'Depleted' : 'Needed'}
                    </span>
                    {assignee && <span className="text-xs text-muted-foreground">→ {assignee.name}</span>}
                  </div>
                  {item.notes && <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>}
                </div>
                <button onClick={() => openPurchase(item)} className="px-3 py-2 rounded-full text-xs font-bold transition-all"
                  style={{ background: 'var(--gradient-primary)', color: 'hsl(var(--primary-foreground))' }}>Buy ✓</button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5 px-4">
          {displayItems.map(item => {
            const pct = item.minThreshold > 0 ? Math.min(100, (item.quantity / (item.minThreshold * 3)) * 100) : 50;
            const catIcon = CATEGORIES.find(c => c.key === item.category)?.icon || '📦';
            return (
              <button key={item.id} onClick={() => openEdit(item)} className="glass-card rounded-xl p-4 text-left animate-fade-in-up hover:translate-y-[-2px] transition-all">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{catIcon} {item.category}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-extrabold tracking-tight ${item.status === 'depleted' ? 'text-destructive' : 'text-foreground'}`}>{item.quantity}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">{item.unit}</p>
                  </div>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${item.status === 'depleted' ? 'bg-destructive' : 'bg-primary'}`}
                    style={{ width: `${pct}%`, animation: 'growBar 0.7s ease both' }} />
                </div>
                <span className={`mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                  item.status === 'depleted' ? 'bg-destructive/10 text-destructive' : 'bg-accent/10 text-accent'
                }`}>{item.status === 'depleted' ? 'Depleted' : 'In Stock'}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* FAB */}
      {tab === 'shopping' && (
        <button onClick={openAdd} className="fixed bottom-[100px] right-6 w-12 h-12 rounded-full text-2xl font-light border-none flex items-center justify-center z-40 transition-all shadow-lg hover:scale-110"
          style={{ background: 'var(--gradient-primary)', color: 'hsl(var(--primary-foreground))' }}>+</button>
      )}

      {/* Add/Edit Modal */}
      <ModalSheet open={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Item' : 'Add Item'}>
        <div className="flex flex-col gap-4">
          <FormField label="Item Name *">
            <input value={formName} onChange={e => setFormName(e.target.value)} className="glass-input w-full rounded-lg px-3.5 py-3 text-foreground" placeholder="e.g. Toilet Paper" />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Category">
              <select value={formCategory} onChange={e => setFormCategory(e.target.value)} className="glass-input w-full rounded-lg px-3.5 py-3 text-foreground">
                {CATEGORIES.filter(c => c.key !== 'all').map(c => <option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}
              </select>
            </FormField>
            <FormField label="Unit">
              <select value={formUnit} onChange={e => setFormUnit(e.target.value)} className="glass-input w-full rounded-lg px-3.5 py-3 text-foreground">
                {UNITS.map(u => <option key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</option>)}
              </select>
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Current Qty">
              <input type="number" value={formQty} onChange={e => setFormQty(e.target.value)} className="glass-input w-full rounded-lg px-3.5 py-3 text-foreground" min="0" />
            </FormField>
            <FormField label="Alert Below">
              <input type="number" value={formThreshold} onChange={e => setFormThreshold(e.target.value)} className="glass-input w-full rounded-lg px-3.5 py-3 text-foreground" min="0" />
            </FormField>
          </div>
          <FormField label="Notes">
            <textarea value={formNotes} onChange={e => setFormNotes(e.target.value)} className="glass-input w-full rounded-lg px-3.5 py-3 text-foreground min-h-[60px] resize-y" placeholder="Any notes..." />
          </FormField>
          <div className="flex gap-2.5 mt-2">
            {editItem && <button onClick={deleteItem} className="px-4 py-3 rounded-full text-sm font-bold bg-destructive/10 text-destructive border border-destructive/25 hover:bg-destructive hover:text-foreground transition-all">Delete</button>}
            <div className="flex-1 flex gap-2.5">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-full text-sm font-bold bg-secondary text-foreground border border-border">Cancel</button>
              <button onClick={saveItem} className="flex-1 py-3 rounded-full text-sm font-bold" style={{ background: 'var(--gradient-primary)', color: 'hsl(var(--primary-foreground))' }}>Save</button>
            </div>
          </div>
        </div>
      </ModalSheet>

      {/* Purchase Modal */}
      <ModalSheet open={showPurchaseModal} onClose={() => setShowPurchaseModal(false)} title="Mark as Purchased">
        <div className="glass-surface rounded-lg px-4 py-3 mb-1">
          <p className="text-xs text-muted-foreground">Item</p>
          <p className="text-lg font-bold mt-0.5">{purchaseItem?.name}</p>
        </div>
        <div className="glass-surface rounded-lg px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Bought by</span>
          <span className="font-semibold text-sm">{currentUser?.name}</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Qty Added">
            <input type="number" value={purchQty} onChange={e => setPurchQty(e.target.value)} className="glass-input w-full rounded-lg px-3.5 py-3 text-foreground" min="1" />
          </FormField>
          <FormField label="Cost (€)">
            <input type="number" value={purchCost} onChange={e => setPurchCost(e.target.value)} className="glass-input w-full rounded-lg px-3.5 py-3 text-foreground" step="0.01" min="0" placeholder="0.00" />
          </FormField>
        </div>
        <p className="text-xs text-muted-foreground">Cost is split equally among active flatmates.</p>
        <div className="flex gap-2.5 mt-2">
          <button onClick={() => setShowPurchaseModal(false)} className="flex-1 py-3 rounded-full text-sm font-bold bg-secondary text-foreground border border-border">Cancel</button>
          <button onClick={confirmPurchase} className="flex-1 py-3 rounded-full text-sm font-bold" style={{ background: 'var(--gradient-primary)', color: 'hsl(var(--primary-foreground))' }}>✓ Confirm</button>
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
