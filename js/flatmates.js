// ===========================
// flatmates.js
// ===========================

const AVATAR_COLORS = ['#4CAF50', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', '#14B8A6'];

const flatmates = {
    getAll() { return data.get(data.keys.flatmates) || []; },
    getActive() { return this.getAll().filter(f => f.active); },
    getById(id) { return this.getAll().find(f => f.id === id); },

    getInitials(name) {
        return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    },

    avatarHtml(flatmate, size = 44) {
        if (!flatmate) return `<div class="flatmate-avatar" style="width:${size}px;height:${size}px;background:#333">?</div>`;
        const color = AVATAR_COLORS[flatmate.color % AVATAR_COLORS.length];
        return `<div class="flatmate-avatar" style="width:${size}px;height:${size}px;font-size:${Math.round(size * 0.38)}px;background:${color}">${this.getInitials(flatmate.name)}</div>`;
    },

    save(fm) {
        const all = this.getAll();
        const idx = all.findIndex(f => f.id === fm.id);
        if (idx >= 0) all[idx] = fm; else all.push(fm);
        data.set(data.keys.flatmates, all);
    },

    remove(id) {
        data.set(data.keys.flatmates, this.getAll().filter(f => f.id !== id));
    },

    toggleActive(id) {
        const fm = this.getAll().map(f => f.id === id ? { ...f, active: !f.active } : f);
        data.set(data.keys.flatmates, fm);
    },

    renderSelect(selectId, includeNone = false) {
        const sel = document.getElementById(selectId);
        if (!sel) return;
        const all = this.getAll();
        sel.innerHTML = (includeNone ? `<option value="">— Select flatmate —</option>` : '') +
            all.map(f => `<option value="${f.id}">${f.name}${f.active ? '' : ' (inactive)'}</option>`).join('');
    },

    renderList() {
        const list = document.getElementById('flatmate-list');
        if (!list) return;
        const all = this.getAll();
        if (all.length === 0) {
            list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">👥</div><h3>No flatmates yet</h3><p>Add your first flatmate to get started</p></div>`;
            return;
        }
        list.innerHTML = all.map(f => `
      <div class="flatmate-row">
        ${this.avatarHtml(f, 40)}
        <div class="flatmate-row-info">
          <div class="flatmate-row-name">${f.name} ${f.active ? '' : '<span class="badge badge-gray">Inactive</span>'}</div>
          <div class="flatmate-row-iban">${f.iban || 'No IBAN set'}</div>
        </div>
        <div class="flatmate-row-actions">
          <button class="btn btn-sm btn-secondary" onclick="flatmates.openEdit('${f.id}')">Edit</button>
          <button class="btn btn-sm btn-ghost" onclick="flatmates.toggleActive('${f.id}');flatmates.renderList()" title="${f.active ? 'Deactivate' : 'Activate'}">${f.active ? '⏸' : '▶'}</button>
          <button class="btn btn-sm btn-danger" onclick="flatmates.confirmDelete('${f.id}')">✕</button>
        </div>
      </div>`).join('');
    },

    openAdd() {
        document.getElementById('fm-modal-title').textContent = 'Add Flatmate';
        document.getElementById('fm-id').value = '';
        document.getElementById('fm-name').value = '';
        document.getElementById('fm-iban').value = '';
        openModal('flatmate-modal');
    },

    openEdit(id) {
        const fm = this.getById(id);
        if (!fm) return;
        document.getElementById('fm-modal-title').textContent = 'Edit Flatmate';
        document.getElementById('fm-id').value = fm.id;
        document.getElementById('fm-name').value = fm.name;
        document.getElementById('fm-iban').value = fm.iban || '';
        openModal('flatmate-modal');
    },

    saveFromForm() {
        const id = document.getElementById('fm-id').value;
        const name = document.getElementById('fm-name').value.trim();
        const iban = document.getElementById('fm-iban').value.trim().replace(/\s/g, '');
        if (!name) { toast('Name is required', 'error'); return; }
        const existing = id ? this.getById(id) : null;
        const fm = {
            id: id || data.generateId(),
            name,
            iban,
            active: existing ? existing.active : true,
            color: existing ? existing.color : this.getAll().length % AVATAR_COLORS.length,
            joinedAt: existing ? existing.joinedAt : new Date().toISOString(),
        };
        this.save(fm);
        closeModal('flatmate-modal');
        this.renderList();
        toast(`${name} ${id ? 'updated' : 'added'}!`, 'success');
        app.refreshDashboard();
    },

    confirmDelete(id) {
        const fm = this.getById(id);
        if (!fm) return;
        if (confirm(`Remove ${fm.name} from the flat? Their transaction history will be kept.`)) {
            this.remove(id);
            this.renderList();
            toast(`${fm.name} removed`, 'info');
        }
    }
};

window.flatmates = flatmates;
