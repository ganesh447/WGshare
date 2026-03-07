// ===========================
// payments.js
// ===========================

const payments = {
    currentTab: 'balances',

    switchTab(tab) {
        this.currentTab = tab;
        document.querySelectorAll('.pay-seg').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
        this.render();
    },

    render() {
        if (this.currentTab === 'balances') this.renderBalances();
        else this.renderHistory();
    },

    renderBalances() {
        const el = document.getElementById('payments-content');
        const fms = flatmates.getAll();
        const balances = data.calculateBalances();

        if (fms.length === 0) {
            el.innerHTML = `<div class="empty-state"><div class="empty-state-icon">💳</div><h3>No flatmates yet</h3><p>Add flatmates in Settings first</p></div>`;
            return;
        }

        const totalOwed = Object.values(balances).filter(b => b > 0).reduce((s, b) => s + b, 0);
        const summaryHtml = `
      <div class="dashboard-hero" style="margin:0 16px 12px">
        <div class="hero-greeting">💰 Money Overview</div>
        <div class="hero-title" style="font-size:20px;margin-top:4px">
          ${totalOwed > 0 ? `€${totalOwed.toFixed(2)} outstanding` : 'All settled up! 🎉'}
        </div>
        <div class="hero-subtitle">${fms.length} flatmates · Tap IBAN to copy</div>
      </div>`;

        const balanceCards = fms.map(fm => {
            const bal = balances[fm.id] || 0;
            const balClass = bal > 0.01 ? 'positive' : bal < -0.01 ? 'negative' : 'zero';
            const balLabel = bal > 0.01 ? 'is owed' : bal < -0.01 ? 'owes' : 'settled';
            return `
        <div class="balance-card">
          ${flatmates.avatarHtml(fm, 44)}
          <div class="balance-info">
            <div class="balance-name">${fm.name}</div>
            <div class="balance-iban" onclick="payments.copyIban('${fm.id}')" style="cursor:pointer" title="Click to copy">
              ${fm.iban || 'No IBAN'} ${fm.iban ? '📋' : ''}
            </div>
            <div class="text-xs text-secondary mt-4">${balLabel}</div>
          </div>
          <div class="balance-amount ${balClass}">${bal === 0 ? '€0' : (bal > 0 ? '+' : '') + '€' + Math.abs(bal).toFixed(2)}</div>
        </div>`;
        }).join('');

        // Who owes whom summary
        const debts = this.calculateDebts(fms, balances);
        const debtSummary = debts.length > 0 ? `
      <div style="padding:0 16px 12px">
        <div class="settings-section-title" style="padding-left:0">Settle Up</div>
        ${debts.map(d => `
          <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)">
            <span style="flex:1;font-size:14px">${d.from} → ${d.to}</span>
            <span style="font-weight:700;color:var(--accent-amber)">${data.formatCurrency(d.amount)}</span>
            <button class="btn btn-xs btn-primary" onclick="payments.openSettlement('${d.fromId}','${d.toId}',${d.amount.toFixed(2)})">Settle</button>
          </div>`).join('')}
      </div>` : '';

        el.innerHTML = summaryHtml + `<div class="card-list" style="margin-bottom:16px">${balanceCards}</div>` + debtSummary;
    },

    calculateDebts(fms, balances) {
        // Simplified: for each negative balance, show who they owe proportionally
        const debts = [];
        const creditors = fms.filter(f => (balances[f.id] || 0) > 0.01);
        const debtors = fms.filter(f => (balances[f.id] || 0) < -0.01);
        debtors.forEach(debtor => {
            const amt = Math.abs(balances[debtor.id]);
            // Find best creditor
            const creditor = creditors.sort((a, b) => balances[b.id] - balances[a.id])[0];
            if (creditor) debts.push({ fromId: debtor.id, from: debtor.name, toId: creditor.id, to: creditor.name, amount: amt });
        });
        return debts;
    },

    renderHistory() {
        const el = document.getElementById('payments-content');
        const txs = (data.get(data.keys.transactions) || []).slice().reverse();

        if (txs.length === 0) {
            el.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📜</div><h3>No transactions yet</h3><p>Transactions appear here when bills are paid or items are purchased</p></div>`;
            return;
        }

        const icons = { purchase: '🛒', bill_payment: '📋', settlement: '💸' };
        el.innerHTML = `<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;margin:0 16px">` +
            txs.map(tx => {
                const payer = flatmates.getById(tx.from);
                return `<div class="transaction-item">
          <div class="tx-icon">${icons[tx.type] || '💰'}</div>
          <div class="tx-info">
            <div class="tx-desc">${tx.reference}</div>
            <div class="tx-date">${payer?.name || '?'} · ${data.formatDate(tx.date)}</div>
          </div>
          <div class="tx-amount">${data.formatCurrency(tx.amount)}</div>
        </div>`;
            }).join('') + `</div>`;
    },

    copyIban(flatmateId) {
        const fm = flatmates.getById(flatmateId);
        if (!fm?.iban) { toast('No IBAN on file', 'warning'); return; }
        navigator.clipboard?.writeText(fm.iban).then(() => {
            toast(`📋 Copied ${fm.name}'s IBAN!`, 'success');
        }).catch(() => {
            // Fallback
            const el = document.createElement('textarea');
            el.value = fm.iban;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
            toast(`📋 Copied ${fm.name}'s IBAN!`, 'success');
        });
    },

    openSettlement(fromId, toId, amount) {
        document.getElementById('settle-from').value = fromId;
        document.getElementById('settle-to').value = toId;
        document.getElementById('settle-amount').value = amount;
        flatmates.renderSelect('settle-from-select', false);
        flatmates.renderSelect('settle-to-select', false);
        document.getElementById('settle-from-select').value = fromId;
        document.getElementById('settle-to-select').value = toId;
        document.getElementById('settle-amount-input').value = amount;
        document.getElementById('settle-note').value = 'Settlement payment';
        openModal('settlement-modal');
    },

    openManualSettlement() {
        flatmates.renderSelect('settle-from-select', false);
        flatmates.renderSelect('settle-to-select', false);
        document.getElementById('settle-amount-input').value = '';
        document.getElementById('settle-note').value = '';
        openModal('settlement-modal');
    },

    confirmSettlement() {
        const fromId = document.getElementById('settle-from-select').value;
        const toId = document.getElementById('settle-to-select').value;
        const amount = parseFloat(document.getElementById('settle-amount-input').value);
        const note = document.getElementById('settle-note').value.trim() || 'Settlement';
        if (!fromId || !toId) { toast('Select both flatmates', 'error'); return; }
        if (fromId === toId) { toast('Cannot settle with yourself', 'error'); return; }
        if (!amount || amount <= 0) { toast('Enter a valid amount', 'error'); return; }

        const from = flatmates.getById(fromId);
        const to = flatmates.getById(toId);
        const now = new Date().toISOString();
        const txs = data.get(data.keys.transactions) || [];
        txs.push({ id: data.generateId(), type: 'settlement', from: fromId, to: [toId], amount, perPersonAmount: amount, date: now, reference: note });
        data.set(data.keys.transactions, txs);

        closeModal('settlement-modal');
        this.render();
        app.refreshDashboard();
        toast(`${from?.name} settled ${data.formatCurrency(amount)} with ${to?.name}!`, 'success');
    }
};

window.payments = payments;
