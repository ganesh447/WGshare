// ===========================
// inventory.js
// ===========================

const CATEGORIES = [
    { key: 'all', label: 'All', icon: '📦' },
    { key: 'flatstatic', label: 'Flatstatic', icon: '🏠' },
    { key: 'food', label: 'Food & Beverages', icon: '🍎' },
    { key: 'cleaning', label: 'Cleaning', icon: '🧴' },
    { key: 'toiletries', label: 'Toiletries', icon: '🪥' },
    { key: 'kitchen', label: 'Kitchen', icon: '🍳' },
    { key: 'other', label: 'Other', icon: '📎' },
];

const UNITS = ['pieces', 'rolls', 'bottles', 'packs', 'liters', 'kg', 'bags', 'boxes', 'cans', 'tubes'];

const inventory = {
    currentTab: 'inventory',  // 'inventory' | 'shopping'
    currentCategory: 'all',

    getAll() { return data.get(data.keys.inventory) || []; },

    computeStatus(item) {
        if (item.status === 'needed') return 'needed';
        if (item.quantity <= 0) return 'depleted';
        if (item.quantity <= item.minThreshold) return 'low';
        return 'available';
    },

    refreshStatuses() {
        const items = this.getAll().map(item => ({ ...item, status: this.computeStatus(item) }));
        data.set(data.keys.inventory, items);
        return items;
    },

    getInventory() {
        return this.refreshStatuses().filter(i => i.status !== 'needed');
    },

    getShoppingList() {
        return this.refreshStatuses().filter(i => i.status === 'depleted' || i.status === 'needed');
    },

    switchTab(tab) {
        this.currentTab = tab;
        document.querySelectorAll('.inv-seg').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
        document.getElementById('inv-content').innerHTML = '';
        document.getElementById('fab-inv').style.display = 'flex';
        this.render();
    },

    render() {
        if (this.currentTab === 'inventory') this.renderInventory();
        else this.renderShoppingList();
    },

    renderInventory() {
        const el = document.getElementById('inv-content');
        let items = this.getInventory();
        if (this.currentCategory !== 'all') items = items.filter(i => i.category === this.currentCategory);

        if (items.length === 0) {
            el.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📦</div><h3>No items here</h3><p>Add your first inventory item with the + button</p></div>`;
            return;
        }

        el.innerHTML = `<div class="inventory-grid">${items.map(i => this.inventoryCardHtml(i)).join('')}</div>`;
    },

    inventoryCardHtml(item) {
        const pct = item.minThreshold > 0 ? Math.min(100, (item.quantity / (item.minThreshold * 3)) * 100) : 50;
        const fillClass = item.status === 'depleted' ? 'empty' : item.status === 'low' ? 'low' : '';
        const qtyClass = item.status === 'depleted' ? 'zero-qty' : item.status === 'low' ? 'low-qty' : '';
        const cardClass = item.status === 'depleted' ? 'depleted' : item.status === 'low' ? 'low-stock' : '';
        const catIcon = CATEGORIES.find(c => c.key === item.category)?.icon || '📦';
        return `
      <div class="inventory-card ${cardClass}" onclick="inventory.openEdit('${item.id}')">
        <div class="inv-card-header">
          <div>
            <div class="inv-card-name">${item.name}</div>
            <div class="inv-card-category">${catIcon} ${item.category}</div>
          </div>
          <div>
            <div class="inv-card-qty ${qtyClass}">${item.quantity}</div>
            <div class="inv-card-unit">${item.unit}</div>
          </div>
        </div>
        <div class="progress-bar"><div class="progress-fill ${fillClass}" style="width:${pct}%"></div></div>
        ${item.status === 'depleted' ? '<div class="badge badge-red" style="margin-top:4px">Depleted</div>' :
                item.status === 'low' ? '<div class="badge badge-amber" style="margin-top:4px">Low</div>' :
                    '<div class="badge badge-green" style="margin-top:4px">In Stock</div>'}
      </div>`;
    },

    renderShoppingList() {
        const el = document.getElementById('inv-content');
        const items = this.getShoppingList();
        if (items.length === 0) {
            el.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🛒</div><h3>Shopping list is empty</h3><p>Everything is stocked up! Add manual items with +</p></div>`;
            return;
        }
        el.innerHTML = `<div class="card-list" style="margin-top:4px">${items.map(i => this.shoppingItemHtml(i)).join('')}</div>`;
    },

    shoppingItemHtml(item) {
        const catIcon = CATEGORIES.find(c => c.key === item.category)?.icon || '📦';
        const assignee = item.assignedTo ? flatmates.getById(item.assignedTo) : null;
        return `
      <div class="shopping-item">
        <div style="font-size:24px">${catIcon}</div>
        <div class="shopping-item-info">
          <div class="shopping-item-name">${item.name}</div>
          <div class="shopping-item-meta">
            ${item.status === 'depleted' ? '<span class="badge badge-red">Depleted</span>' : '<span class="badge badge-amber">Needed</span>'}
            ${assignee ? `<span style="color:var(--text-secondary);font-size:12px;margin-left:6px">→ ${assignee.name}</span>` : ''}
          </div>
          ${item.notes ? `<div class="text-sm text-secondary mt-4">${item.notes}</div>` : ''}
        </div>
        <div class="shopping-item-actions">
          <button class="btn btn-sm btn-primary" onclick="inventory.openPurchase('${item.id}')">Buy ✓</button>
        </div>
      </div>`;
    },

    renderCategoryTabs() {
        const container = document.getElementById('inv-category-tabs');
        if (!container) return;
        container.innerHTML = CATEGORIES.map(c => `
      <button class="filter-tab ${this.currentCategory === c.key ? 'active' : ''}"
        onclick="inventory.setCategory('${c.key}')">${c.icon} ${c.label}</button>`).join('');
    },

    setCategory(cat) {
        this.currentCategory = cat;
        this.renderCategoryTabs();
        this.render();
    },

    openAdd() {
        document.getElementById('inv-modal-title').textContent = 'Add Item';
        document.getElementById('inv-id').value = '';
        document.getElementById('inv-name').value = '';
        document.getElementById('inv-category').value = 'food';
        document.getElementById('inv-qty').value = '1';
        document.getElementById('inv-threshold').value = '1';
        document.getElementById('inv-unit').value = 'pieces';
        document.getElementById('inv-notes').value = '';
        document.getElementById('inv-status').value = this.currentTab === 'shopping' ? 'needed' : 'available';
        openModal('inventory-modal');
    },

    openEdit(id) {
        const item = this.getAll().find(i => i.id === id);
        if (!item) return;
        document.getElementById('inv-modal-title').textContent = 'Edit Item';
        document.getElementById('inv-id').value = item.id;
        document.getElementById('inv-name').value = item.name;
        document.getElementById('inv-category').value = item.category;
        document.getElementById('inv-qty').value = item.quantity;
        document.getElementById('inv-threshold').value = item.minThreshold;
        document.getElementById('inv-unit').value = item.unit;
        document.getElementById('inv-notes').value = item.notes || '';
        document.getElementById('inv-status').value = item.status;
        openModal('inventory-modal');
    },

    saveFromForm() {
        const id = document.getElementById('inv-id').value;
        const name = document.getElementById('inv-name').value.trim();
        if (!name) { toast('Item name is required', 'error'); return; }
        const qty = parseFloat(document.getElementById('inv-qty').value) || 0;
        const prevItem = id ? this.getAll().find(i => i.id === id) : null;
        const item = {
            id: id || data.generateId(),
            name,
            category: document.getElementById('inv-category').value,
            quantity: qty,
            minThreshold: parseFloat(document.getElementById('inv-threshold').value) || 1,
            unit: document.getElementById('inv-unit').value,
            status: document.getElementById('inv-status').value || 'available',
            lastPurchasedBy: prevItem?.lastPurchasedBy || null,
            lastPurchaseDate: prevItem?.lastPurchaseDate || null,
            lastPurchaseCost: prevItem?.lastPurchaseCost || null,
            purchaseHistory: prevItem?.purchaseHistory || [],
            notes: document.getElementById('inv-notes').value.trim(),
            addedAt: prevItem?.addedAt || new Date().toISOString(),
            assignedTo: prevItem?.assignedTo || null,
        };

        // Check depletion before saving
        if (prevItem && prevItem.quantity > 0 && qty === 0) {
            notifications.add('inventory_depletion', `${name} has run out!`);
        }

        const all = this.getAll();
        const idx = all.findIndex(i => i.id === item.id);
        if (idx >= 0) all[idx] = item; else all.push(item);
        data.set(data.keys.inventory, all);
        closeModal('inventory-modal');
        this.render();
        app.refreshDashboard();
        toast(`${name} ${id ? 'updated' : 'added'}!`, 'success');
    },

    openPurchase(id) {
        const item = this.getAll().find(i => i.id === id);
        if (!item) return;
        document.getElementById('purch-id').value = id;
        document.getElementById('purch-item-name').textContent = item.name;
        document.getElementById('purch-new-qty').value = '1';
        document.getElementById('purch-cost').value = item.lastPurchaseCost || '';
        flatmates.renderSelect('purch-buyer', false);
        openModal('purchase-modal');
    },

    confirmPurchase() {
        const id = document.getElementById('purch-id').value;
        const buyerId = document.getElementById('purch-buyer').value;
        const cost = parseFloat(document.getElementById('purch-cost').value) || 0;
        const newQty = parseFloat(document.getElementById('purch-new-qty').value) || 1;
        if (!buyerId) { toast('Please select who bought it', 'error'); return; }

        const all = this.getAll();
        const idx = all.findIndex(i => i.id === id);
        if (idx < 0) return;
        const item = all[idx];
        const buyer = flatmates.getById(buyerId);
        const now = new Date().toISOString();

        // Update item
        all[idx] = {
            ...item,
            quantity: item.quantity + newQty,
            status: 'available',
            lastPurchasedBy: buyerId,
            lastPurchaseDate: now,
            lastPurchaseCost: cost,
            purchaseHistory: [...(item.purchaseHistory || []), { purchasedBy: buyerId, date: now, cost, quantity: newQty }],
        };
        data.set(data.keys.inventory, all);

        // Record transaction (if cost > 0)
        if (cost > 0) {
            const activeOthers = flatmates.getActive().filter(f => f.id !== buyerId).map(f => f.id);
            const perPerson = cost / flatmates.getActive().length;
            const txs = data.get(data.keys.transactions) || [];
            txs.push({ id: data.generateId(), type: 'purchase', from: buyerId, to: activeOthers, amount: cost, perPersonAmount: perPerson, date: now, reference: `${item.name} (shopping)`, itemId: id });
            data.set(data.keys.transactions, txs);
        }

        closeModal('purchase-modal');
        this.render();
        app.refreshDashboard();
        toast(`✓ ${item.name} marked as purchased by ${buyer?.name || 'unknown'}!`, 'success');
    },

    deleteItem(id) {
        if (!confirm('Delete this item?')) return;
        data.set(data.keys.inventory, this.getAll().filter(i => i.id !== id));
        closeModal('inventory-modal');
        this.render();
    }
};

window.inventory = inventory;
window.CATEGORIES = CATEGORIES;
window.UNITS = UNITS;
