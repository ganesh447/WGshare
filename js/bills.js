// ===========================
// bills.js
// ===========================

const BILL_NAMES = ['Internet', 'Electricity', 'Gas', 'Water', 'Rundfunkbeitrag', 'Rent Supplement', 'Netflix', 'Spotify', 'Parking', 'Insurance', 'Other'];

const bills = {
    currentTab: 'upcoming',   // 'upcoming' | 'paid'

    getAll() { return data.get(data.keys.bills) || []; },

    refreshOverdue() {
        const today = new Date().toISOString().split('T')[0];
        const all = this.getAll().map(b => {
            if (b.status === 'upcoming' && b.dueDate < today) {
                return { ...b, status: 'overdue' };
            }
            return b;
        });
        data.set(data.keys.bills, all);
        return all;
    },

    calculateSplit(amount) {
        const count = flatmates.getActive().length || 1;
        return parseFloat((amount / count).toFixed(2));
    },

    switchTab(tab) {
        this.currentTab = tab;
        document.querySelectorAll('.bill-seg').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
        this.render();
    },

    render() {
        const allBills = this.refreshOverdue();
        const el = document.getElementById('bills-content');

        let items;
        if (this.currentTab === 'upcoming') {
            items = allBills.filter(b => b.status === 'upcoming' || b.status === 'overdue')
                .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
        } else {
            items = allBills.filter(b => b.status === 'paid')
                .sort((a, b) => b.paymentDate?.localeCompare(a.paymentDate));
        }

        if (items.length === 0) {
            el.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📋</div><h3>No ${this.currentTab} bills</h3><p>${this.currentTab === 'upcoming' ? 'Add your first bill with the + button' : 'Paid bills will appear here'}</p></div>`;
            return;
        }

        el.innerHTML = `<div class="card-list">${items.map(b => this.billCardHtml(b)).join('')}</div>`;
    },

    billCardHtml(bill) {
        const isPaid = bill.status === 'paid';
        const isOverdue = bill.status === 'overdue';
        const payer = bill.paidBy ? flatmates.getById(bill.paidBy) : null;
        const active = flatmates.getActive();
        const splitAmount = this.calculateSplit(bill.amount);

        return `
      <div class="bill-card animate-item ${isOverdue ? 'overdue' : ''} ${isPaid ? 'paid' : ''}">
        <div class="bill-card-header">
          <div>
            <div class="bill-name">${bill.name}</div>
            <div class="text-sm text-secondary mt-4">${bill.billingPeriod || ''}</div>
          </div>
          <div style="text-align:right">
            <div class="bill-amount">${data.formatCurrency(bill.amount)}</div>
            ${isOverdue ? '<div class="badge badge-red mt-4">Overdue</div>' :
                isPaid ? '<div class="badge badge-green mt-4">Paid</div>' :
                    '<div class="badge badge-blue mt-4">Upcoming</div>'}
          </div>
        </div>

        <div class="bill-split-info">
          <div class="bill-split-col">
            <div class="bill-split-val">${data.formatCurrency(splitAmount)}</div>
            <div class="bill-split-lbl">Per person</div>
          </div>
          <div style="width:1px;background:var(--border)"></div>
          <div class="bill-split-col">
            <div class="bill-split-val">${active.length}</div>
            <div class="bill-split-lbl">Flatmates</div>
          </div>
          <div style="width:1px;background:var(--border)"></div>
          <div class="bill-split-col">
            <div class="bill-split-val">${bill.dueDate ? data.formatDateShort(bill.dueDate) : '—'}</div>
            <div class="bill-split-lbl">Due date</div>
          </div>
        </div>

        ${isPaid && payer ? `<div class="text-sm text-secondary">Paid by <b>${payer.name}</b> on ${data.formatDate(bill.paymentDate)}</div>` : ''}

        <div class="bill-card-footer">
          ${!isPaid
                ? `<button class="btn btn-sm btn-primary" onclick="bills.openPayModal('${bill.id}')">Mark as Paid</button>`
                : `<span class="text-sm text-secondary">History</span>`
            }
          <div style="display:flex;gap:8px">
            ${!isPaid ? `<button class="btn btn-sm btn-secondary" onclick="bills.openEdit('${bill.id}')">Edit</button>` : ''}
            <button class="btn btn-sm btn-danger" onclick="bills.delete('${bill.id}')">✕</button>
          </div>
        </div>
      </div>`;
    },

    openAdd() {
        document.getElementById('bill-modal-title').textContent = 'Add Bill';
        document.getElementById('bill-id').value = '';
        document.getElementById('bill-name').value = '';
        document.getElementById('bill-amount').value = '';
        document.getElementById('bill-duedate').value = '';
        document.getElementById('bill-period').value = '';
        document.getElementById('bill-split-display').textContent = '—';
        openModal('bill-modal');
    },

    openEdit(id) {
        const bill = this.getAll().find(b => b.id === id);
        if (!bill) return;
        document.getElementById('bill-modal-title').textContent = 'Edit Bill';
        document.getElementById('bill-id').value = bill.id;
        document.getElementById('bill-name').value = bill.name;
        document.getElementById('bill-amount').value = bill.amount;
        document.getElementById('bill-duedate').value = bill.dueDate;
        document.getElementById('bill-period').value = bill.billingPeriod || '';
        this.updateSplitPreview(bill.amount);
        openModal('bill-modal');
    },

    updateSplitPreview(amt) {
        const amount = parseFloat(amt) || 0;
        const split = this.calculateSplit(amount);
        const el = document.getElementById('bill-split-display');
        if (el) el.textContent = amount > 0 ? `${data.formatCurrency(split)} per person` : '—';
    },

    saveFromForm() {
        const id = document.getElementById('bill-id').value;
        const name = document.getElementById('bill-name').value.trim();
        const amount = parseFloat(document.getElementById('bill-amount').value);
        const dueDate = document.getElementById('bill-duedate').value;
        if (!name) { toast('Bill name is required', 'error'); return; }
        if (!amount || amount <= 0) { toast('Enter a valid amount', 'error'); return; }
        if (!dueDate) { toast('Due date is required', 'error'); return; }

        const existing = id ? this.getAll().find(b => b.id === id) : null;
        const splitAmount = this.calculateSplit(amount);
        const bill = {
            id: id || data.generateId(),
            name,
            amount,
            dueDate,
            billingPeriod: document.getElementById('bill-period').value.trim(),
            splitAmount,
            status: existing?.status || 'upcoming',
            paidBy: existing?.paidBy || null,
            paymentDate: existing?.paymentDate || null,
            createdAt: existing?.createdAt || new Date().toISOString(),
        };

        const all = this.getAll();
        const idx = all.findIndex(b => b.id === bill.id);
        if (idx >= 0) all[idx] = bill; else all.push(bill);
        data.set(data.keys.bills, all);
        closeModal('bill-modal');
        this.render();
        app.refreshDashboard();
        toast(`${name} ${id ? 'updated' : 'added'}!`, 'success');
    },

    openPayModal(id) {
        document.getElementById('pay-bill-id').value = id;
        flatmates.renderSelect('pay-bill-payer', false);
        openModal('pay-bill-modal');
    },

    confirmPayment() {
        const id = document.getElementById('pay-bill-id').value;
        const payerId = document.getElementById('pay-bill-payer').value;
        if (!payerId) { toast('Select who paid', 'error'); return; }

        const all = this.getAll();
        const idx = all.findIndex(b => b.id === id);
        if (idx < 0) return;
        const bill = all[idx];
        const now = new Date().toISOString();
        const payer = flatmates.getById(payerId);
        const activeOthers = flatmates.getActive().filter(f => f.id !== payerId).map(f => f.id);

        all[idx] = { ...bill, status: 'paid', paidBy: payerId, paymentDate: now };
        data.set(data.keys.bills, all);

        // Record transaction
        const txs = data.get(data.keys.transactions) || [];
        txs.push({ id: data.generateId(), type: 'bill_payment', from: payerId, to: activeOthers, amount: bill.amount, perPersonAmount: bill.splitAmount, date: now, reference: `${bill.name} - ${bill.billingPeriod || bill.dueDate}`, billId: id });
        data.set(data.keys.transactions, txs);

        closeModal('pay-bill-modal');
        this.render();
        app.refreshDashboard();
        toast(`${bill.name} marked as paid by ${payer?.name}!`, 'success');
    },

    delete(id) {
        const bill = this.getAll().find(b => b.id === id);
        if (!bill) return;
        if (!confirm(`Delete "${bill.name}"?`)) return;
        data.set(data.keys.bills, this.getAll().filter(b => b.id !== id));
        this.render();
        toast('Bill deleted', 'info');
    }
};

window.bills = bills;
