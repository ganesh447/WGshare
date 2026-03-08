// ===========================
// app.js — Router & Init
// ===========================

const VIEWS = ['dashboard', 'inventory', 'bills', 'cleaning', 'payments', 'settings'];

const app = {
  currentView: 'dashboard',

  init() {
    this.showSplash(() => {
      // Backward compat: if old seeded data exists but no currentUser/flat, auto-populate
      if (data.get(data.keys.settings) && !data.get(data.keys.currentUser)) {
        const first = (data.get(data.keys.flatmates) || []).find(f => f.active);
        if (first) data.set(data.keys.currentUser, { id: first.id, name: first.name, color: first.color });
      }
      if (data.get(data.keys.settings) && !data.get(data.keys.flat)) {
        data.set(data.keys.flat, { name: 'My Flat', code: 'LEGACY', createdAt: new Date().toISOString() });
      }

      if (!data.isOnboarded()) {
        this.showOnboarding();
      } else {
        this.startApp();
      }
    });
  },

  startApp() {
    data.seed();
    cleaning.init();

    // Check for overdue bills & fire notifications
    bills.refreshOverdue();
    const overdue = (data.get(data.keys.bills) || []).filter(b => b.status === 'overdue');
    overdue.forEach(b => {
      const exists = (data.get(data.keys.notifications) || []).some(n => n.reference === b.id);
      if (!exists) notifications.add('bill_overdue', `"${b.name}" bill is overdue (due ${data.formatDate(b.dueDate)})`);
    });

    document.getElementById('app').style.display = 'flex';
    notifications.updateBadge();
    this.navigate('dashboard');
    this.bindNav();
    this.bindGlobalEvents();
  },

  showSplash(onDone) {
    const el = document.getElementById('splash-screen');
    el.style.display = 'flex';
    setTimeout(() => {
      el.classList.add('splash-exit');
      el.addEventListener('animationend', () => {
        el.style.display = 'none';
        onDone();
      }, { once: true });
    }, 1400);
  },

  showOnboarding() {
    const screen = document.getElementById('onboarding-screen');
    screen.style.display = 'flex';

    const goToStep = (stepId) => {
      document.querySelectorAll('.onboard-step').forEach(s => s.classList.remove('active'));
      document.getElementById(stepId).classList.add('active');
    };

    document.getElementById('btn-create-flat').onclick = () => goToStep('onboard-step-create');
    document.getElementById('btn-join-flat').onclick   = () => goToStep('onboard-step-join');

    document.querySelectorAll('.onboard-back').forEach(btn => {
      btn.onclick = () => goToStep('onboard-step-choose');
    });

    document.getElementById('btn-confirm-create').onclick = () => {
      const name     = document.getElementById('onboard-name').value.trim();
      const flatName = document.getElementById('onboard-flat-name').value.trim();
      if (!name)     { toast('Please enter your name', 'error'); return; }
      if (!flatName) { toast('Please enter a flat name', 'error'); return; }

      const code = Math.random().toString(36).substr(2, 6).toUpperCase();
      data.set(data.keys.flat, { name: flatName, code, createdAt: new Date().toISOString() });

      const fmId = data.generateId();
      const flatmates = data.get(data.keys.flatmates) || [];
      flatmates.push({ id: fmId, name, iban: '', active: true, color: 0, joinedAt: new Date().toISOString() });
      data.set(data.keys.flatmates, flatmates);
      data.set(data.keys.currentUser, { id: fmId, name, color: 0 });

      document.getElementById('generated-code').textContent = code;
      goToStep('onboard-step-code');
    };

    document.getElementById('btn-confirm-join').onclick = () => {
      const name = document.getElementById('onboard-join-name').value.trim();
      const code = document.getElementById('onboard-code').value.trim().toUpperCase();
      if (!name) { toast('Please enter your name', 'error'); return; }
      if (!code) { toast('Please enter an invite code', 'error'); return; }

      const flat = data.get(data.keys.flat);
      if (!flat || flat.code !== code) {
        toast('Code not found — ask your flatmate to share their device first', 'error');
        return;
      }

      const fmId = data.generateId();
      const existing = (data.get(data.keys.flatmates) || []);
      const colorIdx = existing.length % 6;
      existing.push({ id: fmId, name, iban: '', active: true, color: colorIdx, joinedAt: new Date().toISOString() });
      data.set(data.keys.flatmates, existing);
      data.set(data.keys.currentUser, { id: fmId, name, color: colorIdx });

      screen.style.display = 'none';
      this.startApp();
    };

    document.getElementById('btn-copy-code').onclick = () => {
      const code = document.getElementById('generated-code').textContent;
      navigator.clipboard?.writeText(code).catch(() => {});
      toast(`Code ${code} copied!`, 'success');
    };

    document.getElementById('btn-enter-app').onclick = () => {
      screen.style.display = 'none';
      this.startApp();
    };
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
    if (fab) fab.style.display = view === 'inventory' ? 'flex' : 'none';
    if (fabBills) fabBills.style.display = view === 'bills' ? 'flex' : 'none';

    // Render each view
    switch (view) {
      case 'dashboard': this.renderDashboard(); break;
      case 'inventory': inventory.renderCategoryTabs(); inventory.render(); break;
      case 'bills': bills.render(); break;
      case 'cleaning': cleaning.render(); break;
      case 'payments': payments.render(); break;
      case 'settings': this.renderSettings(); break;
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
    const currentUser = data.get(data.keys.currentUser);
    const userName = currentUser?.name || 'Flatmates';

    document.getElementById('dashboard-content').innerHTML = `
      <div class="dashboard-hero">
        <div class="hero-greeting">🏠 ${todayName}</div>
        <div class="hero-title">Hello, ${userName}!</div>
        <div class="hero-subtitle">${dateStr}</div>
        <div style="display:flex;gap:12px;margin-top:16px;flex-wrap:wrap">
          ${overdueBills > 0 ? `<div class="badge badge-red">⚠️ ${overdueBills} overdue bill${overdueBills > 1 ? 's' : ''}</div>` : ''}
          ${depleted > 0 ? `<div class="badge badge-amber">📦 ${depleted} item${depleted > 1 ? 's' : ''} needed</div>` : ''}
          ${pendingTasks > 0 ? `<div class="badge badge-purple">🧹 ${pendingTasks} task${pendingTasks > 1 ? 's' : ''} pending</div>` : ''}
          ${depleted === 0 && overdueBills === 0 && pendingTasks === 0 ? `<div class="badge badge-green">✓ Everything's good!</div>` : ''}
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card animate-item" onclick="app.navigate('inventory')" style="cursor:pointer">
          <div class="stat-icon" style="background:${depleted > 0 ? 'var(--accent-amber-dim)' : 'var(--accent-green-dim)'}">📦</div>
          <div class="stat-value" style="color:${depleted > 0 ? 'var(--accent-amber)' : 'var(--accent-green)'}">${depleted}</div>
          <div class="stat-label">Items Needed</div>
        </div>
        <div class="stat-card animate-item" onclick="app.navigate('bills')" style="cursor:pointer">
          <div class="stat-icon" style="background:${overdueBills > 0 ? 'var(--accent-red-dim)' : 'rgba(59,130,246,0.12)'}">📋</div>
          <div class="stat-value" style="color:${overdueBills > 0 ? 'var(--accent-red)' : 'var(--text-primary)'}">${upcomingBills + overdueBills}</div>
          <div class="stat-label">Upcoming Bills</div>
        </div>
        <div class="stat-card animate-item" onclick="app.navigate('cleaning')" style="cursor:pointer">
          <div class="stat-icon" style="background:${pendingTasks > 0 ? 'rgba(167,139,250,0.12)' : 'var(--accent-green-dim)'}">🧹</div>
          <div class="stat-value" style="color:${pendingTasks > 0 ? 'var(--accent-purple)' : 'var(--accent-green)'}">${pendingTasks}</div>
          <div class="stat-label">Chores Pending</div>
        </div>
        <div class="stat-card animate-item" onclick="app.navigate('payments')" style="cursor:pointer">
          <div class="stat-icon" style="background:${myBalance > 0 ? 'var(--accent-amber-dim)' : 'var(--accent-green-dim)'}">💰</div>
          <div class="stat-value" style="color:${myBalance > 0 ? 'var(--accent-amber)' : 'var(--accent-green)'}">€${myBalance.toFixed(0)}</div>
          <div class="stat-label">Outstanding</div>
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

  renderSettings() {
    const flat = data.get(data.keys.flat);
    const nameEl = document.getElementById('settings-flat-name');
    const codeEl = document.getElementById('settings-flat-code');
    if (nameEl) nameEl.textContent = flat?.name || '—';
    if (codeEl) codeEl.textContent = flat?.code ? `Invite code: ${flat.code}` : '';
    flatmates.renderList();
  },

  logOut() {
    if (confirm('Log out? Your flat data stays on this device.')) {
      localStorage.removeItem(data.keys.currentUser);
      location.reload();
    }
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
