// ===========================
// app.js — Router & Init
// ===========================

const VIEWS = ['dashboard', 'inventory', 'bills', 'cleaning', 'payments', 'settings'];

const app = {
  currentView: 'dashboard',

  init() {
    data.seed();
    cleaning.init();

    // Check for overdue bills & fire notifications
    bills.refreshOverdue();
    const overdue = (data.get(data.keys.bills) || []).filter(b => b.status === 'overdue');
    overdue.forEach(b => {
      const exists = (data.get(data.keys.notifications) || []).some(n => n.reference === b.id);
      if (!exists) notifications.add('bill_overdue', `"${b.name}" bill is overdue (due ${data.formatDate(b.dueDate)})`);
    });

    notifications.updateBadge();
    this.navigate('dashboard');
    this.bindNav();
    this.bindGlobalEvents();
  },

  navigate(view) {
    if (!VIEWS.includes(view)) return;
    this.currentView = view;
    VIEWS.forEach(v => {
      document.getElementById(`view-${v}`)?.classList.toggle('active', v === view);
    });
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.view === view);
    });

    // Update FAB visibility
    const fab = document.getElementById('fab-inv');
    const fabBills = document.getElementById('fab-bills');
    const fabPay = document.getElementById('fab-pay');
    if (fab) fab.style.display = view === 'inventory' ? 'flex' : 'none';
    if (fabBills) fabBills.style.display = view === 'bills' ? 'flex' : 'none';
    if (fabPay) fabPay.style.display = view === 'payments' ? 'flex' : 'none';

    // Render each view
    switch (view) {
      case 'dashboard': this.renderDashboard(); break;
      case 'inventory': inventory.renderCategoryTabs(); inventory.render(); break;
      case 'bills': bills.render(); break;
      case 'cleaning': cleaning.render(); break;
      case 'payments': payments.render(); break;
      case 'settings': flatmates.renderList(); cleaning.renderTaskSettings(); break;
    }

    // Update cleaning badge
    const pendingTasks = (cleaning.getHouseAssignmentsForWeek(cleaning.currentWeekStart)).filter(a => a.status === 'pending').length;
    const cleanBadge = document.querySelector('[data-clean-badge]');
    if (cleanBadge) { cleanBadge.textContent = pendingTasks > 0 ? pendingTasks : ''; cleanBadge.style.display = pendingTasks > 0 ? 'flex' : 'none'; }
  },

  renderDashboard() {
    const allItems = inventory.refreshStatuses();
    const depleted = allItems.filter(i => i.status === 'depleted' || i.status === 'needed').length;
    const billesList = data.get(data.keys.bills) || [];
    const overdueBills = billesList.filter(b => b.status === 'overdue').length;
    const upcomingBills = billesList.filter(b => b.status === 'upcoming').length;
    const allFlatmates = flatmates.getAll();
    const balances = data.calculateBalances();
    const myBalance = Object.values(balances).reduce((s, v) => s + Math.abs(v), 0);
    const pendingTasks = (cleaning.getHouseAssignmentsForWeek(cleaning.currentWeekStart)).filter(a => a.status === 'pending').length;

    const todayName = new Date().toLocaleDateString('en-GB', { weekday: 'long' });
    const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    document.getElementById('dashboard-content').innerHTML = `
      <div class="dashboard-hero">
        <div class="hero-greeting">🏠 ${todayName}</div>
        <div class="hero-title">Hello, Flatmates!</div>
        <div class="hero-subtitle">${dateStr}</div>
        <div style="display:flex;gap:12px;margin-top:16px;flex-wrap:wrap">
          ${overdueBills > 0 ? `<div class="badge badge-red">⚠️ ${overdueBills} overdue bill${overdueBills > 1 ? 's' : ''}</div>` : ''}
          ${depleted > 0 ? `<div class="badge badge-amber">📦 ${depleted} item${depleted > 1 ? 's' : ''} needed</div>` : ''}
          ${pendingTasks > 0 ? `<div class="badge badge-purple">🧹 ${pendingTasks} task${pendingTasks > 1 ? 's' : ''} pending</div>` : ''}
          ${depleted === 0 && overdueBills === 0 && pendingTasks === 0 ? `<div class="badge badge-green">✓ Everything's good!</div>` : ''}
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card" onclick="app.navigate('inventory')" style="cursor:pointer">
          <div class="stat-icon">📦</div>
          <div class="stat-value" style="color:${depleted > 0 ? 'var(--accent-amber)' : 'var(--accent-green)'}">${depleted}</div>
          <div class="stat-label">Items Needed</div>
        </div>
        <div class="stat-card" onclick="app.navigate('bills')" style="cursor:pointer">
          <div class="stat-icon">📋</div>
          <div class="stat-value" style="color:${overdueBills > 0 ? 'var(--accent-red)' : 'var(--text-primary)'}">${upcomingBills + overdueBills}</div>
          <div class="stat-label">Upcoming Bills</div>
        </div>
        <div class="stat-card" onclick="app.navigate('cleaning')" style="cursor:pointer">
          <div class="stat-icon">🧹</div>
          <div class="stat-value" style="color:${pendingTasks > 0 ? 'var(--accent-purple)' : 'var(--accent-green)'}">${pendingTasks}</div>
          <div class="stat-label">Chores Pending</div>
        </div>
        <div class="stat-card" onclick="app.navigate('payments')" style="cursor:pointer">
          <div class="stat-icon">💰</div>
          <div class="stat-value" style="color:${myBalance > 0 ? 'var(--accent-amber)' : 'var(--accent-green)'}">€${myBalance.toFixed(0)}</div>
          <div class="stat-label">Outstanding</div>
        </div>
      </div>

      <div class="quick-actions">
        <h3>Quick Actions</h3>
        <div class="qa-grid">
          <div class="qa-btn" onclick="inventory.switchTab('shopping');app.navigate('inventory')">
            <div class="qa-icon">🛒</div><div class="qa-label">Shopping</div>
          </div>
          <div class="qa-btn" onclick="bills.openAdd();app.navigate('bills')">
            <div class="qa-icon">🧾</div><div class="qa-label">Add Bill</div>
          </div>
          <div class="qa-btn" onclick="app.navigate('cleaning')">
            <div class="qa-icon">🧹</div><div class="qa-label">Chores</div>
          </div>
          <div class="qa-btn" onclick="payments.openManualSettlement();app.navigate('payments')">
            <div class="qa-icon">💸</div><div class="qa-label">Settle Up</div>
          </div>
        </div>
      </div>

      <div style="padding:0 16px 8px">
        <div class="settings-section-title">Flatmates (${allFlatmates.length})</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;padding-bottom:8px">
          ${allFlatmates.map(fm => `
            <div style="display:flex;flex-direction:column;align-items:center;gap:6px">
              ${flatmates.avatarHtml(fm, 44)}
              <span style="font-size:11px;font-weight:600;color:var(--text-secondary)">${fm.name}</span>
            </div>`).join('')}
          <div style="display:flex;flex-direction:column;align-items:center;gap:6px">
            <div onclick="app.navigate('settings')" style="width:44px;height:44px;border-radius:50%;border:2px dashed var(--border-light);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:20px;color:var(--text-tertiary)">+</div>
            <span style="font-size:11px;font-weight:600;color:var(--text-tertiary)">Add</span>
          </div>
        </div>
      </div>`;
  },

  refreshDashboard() {
    if (this.currentView === 'dashboard') this.renderDashboard();
  },

  bindNav() {
    document.querySelectorAll('.nav-item').forEach(el => {
      el.addEventListener('click', () => this.navigate(el.dataset.view));
    });
  },

  bindGlobalEvents() {
    // Notification bell
    document.getElementById('notif-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const drawer = document.getElementById('notif-drawer');
      const isOpen = drawer.classList.contains('open');
      if (!isOpen) { notifications.render(); notifications.markAllRead(); }
      drawer.classList.toggle('open', !isOpen);
    });
    document.addEventListener('click', () => {
      document.getElementById('notif-drawer')?.classList.remove('open');
    });
    document.getElementById('notif-drawer')?.addEventListener('click', e => e.stopPropagation());
    document.getElementById('clear-notifs')?.addEventListener('click', () => {
      data.set(data.keys.notifications, []);
      notifications.render();
      notifications.updateBadge();
    });

    // Bill amount → split preview
    document.getElementById('bill-amount')?.addEventListener('input', e => {
      bills.updateSplitPreview(e.target.value);
    });

    // Close modals on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal(overlay.id);
      });
    });
  }
};

// Modal helpers
function openModal(id) {
  document.getElementById(id)?.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  document.getElementById(id)?.classList.remove('open');
  document.body.style.overflow = '';
}

window.app = app;
window.openModal = openModal;
window.closeModal = closeModal;

document.addEventListener('DOMContentLoaded', () => app.init());
