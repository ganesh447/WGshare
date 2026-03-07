// ===========================
// notifications.js
// ===========================

const notifications = {
    add(type, message) {
        const notifs = data.get(data.keys.notifications) || [];
        notifs.unshift({ id: data.generateId(), type, message, timestamp: new Date().toISOString(), read: false });
        data.set(data.keys.notifications, notifs);
        this.updateBadge();
        toast(message, type === 'bill_overdue' ? 'warning' : type === 'inventory_depletion' ? 'error' : 'info');
    },

    markAllRead() {
        const notifs = (data.get(data.keys.notifications) || []).map(n => ({ ...n, read: true }));
        data.set(data.keys.notifications, notifs);
        this.updateBadge();
    },

    dismiss(id) {
        const notifs = (data.get(data.keys.notifications) || []).filter(n => n.id !== id);
        data.set(data.keys.notifications, notifs);
        this.updateBadge();
    },

    getUnreadCount() {
        return (data.get(data.keys.notifications) || []).filter(n => !n.read).length;
    },

    updateBadge() {
        const count = this.getUnreadCount();
        const badge = document.querySelector('.notif-badge');
        const navBadge = document.querySelector('[data-notif-count]');
        if (badge) badge.style.display = count > 0 ? 'block' : 'none';
        if (navBadge) { navBadge.textContent = count > 0 ? count : ''; navBadge.style.display = count > 0 ? 'flex' : 'none'; }
    },

    render() {
        const notifs = data.get(data.keys.notifications) || [];
        const list = document.getElementById('notif-list');
        if (!list) return;
        if (notifs.length === 0) {
            list.innerHTML = `<div class="empty-state" style="padding:32px 16px"><div class="empty-state-icon">🔔</div><p>No notifications</p></div>`;
            return;
        }
        const icons = { inventory_depletion: '📦', bill_overdue: '📅', purchase_recorded: '🛒', bill_paid: '✅', task_reminder: '🧹' };
        list.innerHTML = notifs.map(n => `
      <div class="notif-item ${n.read ? '' : 'unread'}">
        <div class="notif-item-icon">${icons[n.type] || '🔔'}</div>
        <div class="notif-item-body">
          <div class="notif-item-msg">${n.message}</div>
          <div class="notif-item-time">${data.formatRelativeTime(n.timestamp)}</div>
        </div>
        <button class="btn-icon" style="width:28px;height:28px;font-size:14px;" onclick="notifications.dismiss('${n.id}');notifications.render()">×</button>
      </div>`).join('');
    },

    typeLabel(type) {
        const map = { inventory_depletion: '📦', bill_overdue: '⏰', purchase_recorded: '🛒', bill_paid: '✅', task_reminder: '🧹' };
        return map[type] || '🔔';
    }
};

// Toast utility
function toast(message, type = 'info', duration = 3000) {
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerHTML = `<span class="toast-icon">${icons[type]}</span><span>${message}</span>`;
    container.appendChild(el);
    setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, duration + 100);
}

window.notifications = notifications;
window.toast = toast;
