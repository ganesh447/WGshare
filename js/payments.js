// ===========================
// payments.js
// ===========================

const payments = {
    render() {
        const el = document.getElementById('payments-content');
        const currentUser = data.get(data.keys.currentUser);
        const fms = flatmates.getAll();

        if (fms.length === 0) {
            el.innerHTML = `<div class="empty-state"><div class="empty-state-icon">💳</div><h3>No flatmates yet</h3><p>Add flatmates in Settings first</p></div>`;
            return;
        }

        if (!currentUser) {
            el.innerHTML = `<div class="empty-state"><div class="empty-state-icon">👤</div><h3>Not logged in</h3></div>`;
            return;
        }

        const meId = currentUser.id;
        const pairBalances = this.calculatePairBalances(meId);
        const myNet = Object.values(pairBalances).reduce((s, v) => s + v, 0);
        const owedToMe = Object.entries(pairBalances).filter(([, v]) => v > 0.01);
        const iOwe = Object.entries(pairBalances).filter(([, v]) => v < -0.01);

        const heroColor = myNet > 0.01 ? 'var(--accent-green)' : myNet < -0.01 ? 'var(--accent-red)' : 'var(--text-primary)';
        const heroLabel = myNet > 0.01 ? 'you are owed' : myNet < -0.01 ? 'you owe' : "you're all settled";

        let html = `
          <div class="dashboard-hero" style="margin:0 16px 16px">
            <div class="hero-greeting">Your Balance</div>
            <div class="hero-title" style="font-size:28px;margin-top:4px;color:${heroColor}">
              ${myNet === 0 ? '€0.00' : (myNet > 0 ? '+' : '') + '€' + Math.abs(myNet).toFixed(2)}
            </div>
            <div class="hero-subtitle">${heroLabel}</div>
          </div>`;

        if (owedToMe.length > 0) {
            html += `<div style="padding:0 16px 8px"><div class="settings-section-title" style="padding-left:0">Owed to you</div>`;
            html += `<div class="card-list">`;
            owedToMe.forEach(([otherId, amount]) => {
                const fm = flatmates.getById(otherId);
                if (!fm) return;
                html += `
                  <div class="balance-card animate-item positive-glow" onclick="payments.openPersonBreakdown('${fm.id}')" style="cursor:pointer">
                    ${flatmates.avatarHtml(fm, 44)}
                    <div class="balance-info">
                      <div class="balance-name">${fm.name}</div>
                      <div class="text-xs text-secondary" style="margin-top:2px">Tap to see breakdown</div>
                    </div>
                    <div class="balance-amount positive">+€${amount.toFixed(2)}</div>
                  </div>`;
            });
            html += `</div></div>`;
        }

        if (iOwe.length > 0) {
            html += `<div style="padding:0 16px 8px"><div class="settings-section-title" style="padding-left:0">You owe</div>`;
            html += `<div class="card-list">`;
            iOwe.forEach(([otherId, amount]) => {
                const fm = flatmates.getById(otherId);
                if (!fm) return;
                html += `
                  <div class="balance-card animate-item negative-glow" onclick="payments.openPersonBreakdown('${fm.id}')" style="cursor:pointer">
                    ${flatmates.avatarHtml(fm, 44)}
                    <div class="balance-info">
                      <div class="balance-name">${fm.name}</div>
                      <div class="text-xs text-secondary" style="margin-top:2px">Tap to see breakdown</div>
                    </div>
                    <div class="balance-amount negative">-€${Math.abs(amount).toFixed(2)}</div>
                  </div>`;
            });
            html += `</div></div>`;
        }

        if (owedToMe.length === 0 && iOwe.length === 0) {
            html += `<div class="empty-state" style="padding-top:24px"><div class="empty-state-icon">🎉</div><h3>All settled up!</h3><p>No outstanding balances</p></div>`;
        }

        // Transaction history
        const txs = (data.get(data.keys.transactions) || []).slice().reverse();
        if (txs.length > 0) {
            const icons = { purchase: '🛒', bill_payment: '📋', settlement: '💸' };
            html += `<div style="padding:0 16px 16px"><div class="settings-section-title" style="padding-left:0">History</div>`;
            html += `<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden">`;
            txs.forEach(tx => {
                const payer = flatmates.getById(tx.from);
                html += `
                  <div class="transaction-item">
                    <div class="tx-icon">${icons[tx.type] || '💰'}</div>
                    <div class="tx-info">
                      <div class="tx-desc">${tx.reference}</div>
                      <div class="tx-date">${payer?.name || '?'} · ${data.formatDate(tx.date)}</div>
                    </div>
                    <div class="tx-amount">${data.formatCurrency(tx.amount)}</div>
                  </div>`;
            });
            html += `</div></div>`;
        }

        el.innerHTML = html;
    },

    openPersonBreakdown(otherId) {
        const me = data.get(data.keys.currentUser);
        const fm = flatmates.getById(otherId);
        if (!fm || !me) return;

        const meId = me.id;
        const transactions = (data.get(data.keys.transactions) || []).slice().reverse();
        const relevant = transactions.filter(t => {
            const others = t.to || [];
            return (t.from === meId && others.includes(otherId)) ||
                   (t.from === otherId && others.includes(meId));
        });

        const pairBalance = this.calculatePairBalances(meId)[otherId] || 0;
        const balColor = pairBalance > 0.01 ? 'var(--accent-green)' : pairBalance < -0.01 ? 'var(--accent-red)' : 'var(--text-secondary)';
        const balLabel = pairBalance > 0.01
            ? `${fm.name} owes you €${pairBalance.toFixed(2)}`
            : pairBalance < -0.01
                ? `You owe ${fm.name} €${Math.abs(pairBalance).toFixed(2)}`
                : 'All settled up';

        const titleEl = document.getElementById('breakdown-modal-title');
        const contentEl = document.getElementById('breakdown-modal-content');
        if (titleEl) titleEl.textContent = `You & ${fm.name}`;

        const icons = { purchase: '🛒', bill_payment: '📋', settlement: '💸' };
        let html = `
          <div style="text-align:center;padding:8px 0 16px;margin-bottom:12px;border-bottom:1px solid var(--border)">
            ${flatmates.avatarHtml(fm, 56)}
            <div style="margin-top:10px;font-size:16px;font-weight:700;color:${balColor}">${balLabel}</div>
          </div>`;

        if (fm.iban) {
            html += `<button class="btn btn-secondary btn-full" style="margin-bottom:12px" onclick="payments.copyIban('${fm.id}')">Copy IBAN · ${fm.iban}</button>`;
        }

        if (relevant.length === 0) {
            html += `<p class="text-sm text-secondary" style="text-align:center;padding:16px 0">No transactions yet</p>`;
        } else {
            relevant.forEach(t => {
                const payer = flatmates.getById(t.from);
                const perPerson = parseFloat(t.perPersonAmount) || 0;
                const iMePaying = t.from === meId;
                const amtColor = iMePaying ? 'var(--accent-green)' : 'var(--accent-red)';
                const amtSign = iMePaying ? '+' : '-';
                html += `
                  <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)">
                    <div style="font-size:20px;flex-shrink:0">${icons[t.type] || '💰'}</div>
                    <div style="flex:1;min-width:0">
                      <div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.reference}</div>
                      <div class="text-xs text-secondary">${payer?.name || '?'} paid · ${data.formatDateShort(t.date)}</div>
                    </div>
                    <div style="font-size:14px;font-weight:700;color:${amtColor};flex-shrink:0">${amtSign}€${perPerson.toFixed(2)}</div>
                  </div>`;
            });
        }

        if (contentEl) contentEl.innerHTML = html;
        openModal('person-breakdown-modal');
    },

    calculatePairBalances(meId) {
        const transactions = data.get(data.keys.transactions) || [];
        const pairBalances = {}; // { otherId: amount } — positive = they owe me, negative = I owe them

        for (const t of transactions) {
            const perPerson = parseFloat(t.perPersonAmount) || 0;
            const others = (t.to || []).filter(id => id !== t.from);
            if (t.from === meId) {
                others.forEach(id => {
                    pairBalances[id] = (pairBalances[id] || 0) + perPerson;
                });
            } else if (others.includes(meId)) {
                pairBalances[t.from] = (pairBalances[t.from] || 0) - perPerson;
            }
        }

        return pairBalances;
    },

    copyIban(flatmateId) {
        const fm = flatmates.getById(flatmateId);
        if (!fm?.iban) { toast('No IBAN on file', 'warning'); return; }
        navigator.clipboard?.writeText(fm.iban).then(() => {
            toast(`Copied ${fm.name}'s IBAN!`, 'success');
        }).catch(() => {
            const el = document.createElement('textarea');
            el.value = fm.iban;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
            toast(`Copied ${fm.name}'s IBAN!`, 'success');
        });
    }
};

window.payments = payments;
