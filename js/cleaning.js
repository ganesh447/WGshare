// ===========================
// cleaning.js
// Two sections: House Cleaning + Weekly Trash
// ===========================

const HOUSE_TASK_ICONS = ['🚿', '🍳', '🛋️', '🧹', '🪟', '🚪', '🛁', '🚽', '🪴', '🌊', '✨', '🧺'];
const AVATAR_COLORS_CLN = ['#4CAF50', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', '#14B8A6'];

const cleaning = {
  currentWeekStart: null,

  init() {
    this.currentWeekStart = data.getWeekStart();
    this.ensureHouseScheduleForWeek(this.currentWeekStart);
  },

  // ─── WEEK NAVIGATION ────────────────────────────────────────────────────────
  navigateWeek(direction) {
    const d = new Date(this.currentWeekStart + 'T12:00:00');
    d.setDate(d.getDate() + direction * 7);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    this.currentWeekStart = `${y}-${m}-${dd}`;
    this.ensureHouseScheduleForWeek(this.currentWeekStart);
    this.render();
  },

  formatWeekLabel(weekStart) {
    const start = new Date(weekStart + 'T12:00:00');
    const end = new Date(weekStart + 'T12:00:00');
    end.setDate(end.getDate() + 6);
    const opts = { month: 'short', day: 'numeric' };
    const isCurrentWeek = weekStart === data.getWeekStart();
    const label = `${start.toLocaleDateString('en-GB', opts)} – ${end.toLocaleDateString('en-GB', opts)}`;
    return isCurrentWeek ? `This Week  ·  ${label}` : label;
  },

  // ─── MAIN RENDER ────────────────────────────────────────────────────────────
  render() {
    const weekLabel = document.getElementById('cleaning-week-label');
    if (weekLabel) weekLabel.textContent = this.formatWeekLabel(this.currentWeekStart);
    this.renderHouseCleaning();
    this.renderWeeklyTrash();
  },

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 1 — HOUSE CLEANING
  // ════════════════════════════════════════════════════════════════════════════
  getHouseTasks() { return data.get(data.keys.cleanTasks) || []; },
  getHouseSchedule() { return data.get(data.keys.cleanSched) || []; },

  getHouseAssignmentsForWeek(weekStart) {
    return this.getHouseSchedule().filter(a => a.weekStart === weekStart);
  },

  ensureHouseScheduleForWeek(weekStart) {
    const existing = this.getHouseAssignmentsForWeek(weekStart);
    if (existing.length > 0) return;
    const tasks = this.getHouseTasks();
    const activeFm = flatmates.getActive();
    if (!activeFm.length || !tasks.length) return;
    const weekIndex = data.getWeekIndex(weekStart);
    const newAssignments = tasks.map((task, i) => ({
      id: data.generateId(),
      taskId: task.id,
      taskName: task.name,
      taskIcon: task.icon,
      assignedTo: activeFm[(i + weekIndex) % activeFm.length].id,
      weekStart,
      status: 'pending',
      completedAt: null,
    }));
    const all = [...this.getHouseSchedule(), ...newAssignments];
    data.set(data.keys.cleanSched, all);
  },

  renderHouseCleaning() {
    const el = document.getElementById('house-cleaning-content');
    if (!el) return;

    const assignments = this.getHouseAssignmentsForWeek(this.currentWeekStart);
    const tasks = this.getHouseTasks();
    const activeFm = flatmates.getActive();

    if (activeFm.length === 0) {
      el.innerHTML = `<div class="empty-state"><div class="empty-state-icon">👥</div><h3>No flatmates yet</h3><p>Add flatmates in Settings first</p></div>`;
      return;
    }

    const doneCount = assignments.filter(a => a.status === 'completed').length;
    const total = assignments.length;

    let html = '';

    // Progress row
    if (total > 0) {
      const pct = Math.round((doneCount / total) * 100);
      const progressClass = doneCount === total ? '' : doneCount > 0 ? 'low' : 'empty';
      html += `
        <div style="padding:0 16px 4px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <span class="text-sm text-secondary">${doneCount}/${total} tasks done</span>
            <span class="badge ${doneCount === total ? 'badge-green' : doneCount > 0 ? 'badge-amber' : 'badge-gray'}">${doneCount === total ? '✓ All done!' : pct + '%'}</span>
          </div>
          <div class="progress-bar"><div class="progress-fill ${progressClass}" style="--target-w:${pct}%"></div></div>
        </div>`;
    }

    // Task cards
    if (assignments.length === 0 && tasks.length > 0) {
      this.ensureHouseScheduleForWeek(this.currentWeekStart);
      return this.renderHouseCleaning();
    }

    if (tasks.length === 0) {
      html += `<div class="empty-state" style="padding:32px 16px"><div class="empty-state-icon" style="font-size:40px">🧹</div><p class="text-secondary">No tasks yet — tap + to add labels</p></div>`;
    } else {
      html += `<div class="card-list" style="margin-top:8px">`;
      assignments.forEach(a => {
        const fm = flatmates.getById(a.assignedTo);
        const isDone = a.status === 'completed';
        const avatarColor = fm ? AVATAR_COLORS_CLN[fm.color % AVATAR_COLORS_CLN.length] : '#555';
        html += `
          <div class="cleaning-card animate-item ${isDone ? 'done' : ''}">
            <div class="cleaning-task-icon" style="font-size:26px">${a.taskIcon || '🧹'}</div>
            <div class="cleaning-task-info">
              <div class="cleaning-task-name">${a.taskName}</div>
              <div class="cleaning-task-person" style="display:flex;align-items:center;gap:6px;margin-top:4px">
                ${fm ? `<div style="width:20px;height:20px;border-radius:50%;background:${avatarColor};display:inline-flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#fff;flex-shrink:0">${fm.name[0].toUpperCase()}</div><span>${fm.name}</span>` : '<span class="text-secondary">Unassigned</span>'}
              </div>
              ${isDone ? `<div class="text-xs text-secondary mt-4">✓ Done ${data.formatRelativeTime(a.completedAt)}</div>` : ''}
            </div>
            <button class="cleaning-check-btn ${isDone ? 'done' : ''}" onclick="cleaning.toggleTask('${a.id}')" title="${isDone ? 'Undo' : 'Mark done'}">${isDone ? '✓' : ''}</button>
          </div>`;
      });
      html += `</div>`;
    }

    el.innerHTML = html;
  },

  openTaskLabels() {
    this._renderTaskLabelsList();
    this._iconIndex = 0;
    const picker = document.getElementById('task-icon-picker');
    if (picker) picker.textContent = HOUSE_TASK_ICONS[0];
    const input = document.getElementById('new-task-label');
    if (input) input.value = '';
    openModal('task-labels-modal');
  },

  _renderTaskLabelsList() {
    const tasks = this.getHouseTasks();
    const listEl = document.getElementById('task-labels-list');
    if (!listEl) return;
    if (tasks.length === 0) {
      listEl.innerHTML = '<p class="text-sm text-secondary" style="padding:8px 0">No tasks yet — add one below</p>';
    } else {
      listEl.innerHTML = `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:4px">` +
        tasks.map(t => `
          <div style="display:inline-flex;align-items:center;gap:6px;background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius-full);padding:6px 12px">
            <span>${t.icon || '🧹'}</span>
            <span style="font-size:13px;font-weight:600;color:var(--text-primary)">${t.name}</span>
            <button onclick="cleaning.removeHouseTask('${t.id}')" style="background:none;border:none;cursor:pointer;color:var(--text-tertiary);font-size:16px;padding:0 0 0 4px;line-height:1;font-weight:700">×</button>
          </div>`).join('') +
        `</div>`;
    }
  },

  _iconIndex: 0,
  cycleIcon() {
    this._iconIndex = (this._iconIndex + 1) % HOUSE_TASK_ICONS.length;
    const el = document.getElementById('task-icon-picker');
    if (el) el.textContent = HOUSE_TASK_ICONS[this._iconIndex];
  },

  addHouseTask() {
    const input = document.getElementById('new-task-label');
    const iconEl = document.getElementById('task-icon-picker');
    const name = input?.value.trim();
    if (!name) { toast('Enter a task label', 'error'); return; }
    const icon = iconEl?.textContent || '🧹';
    const tasks = this.getHouseTasks();
    tasks.push({ id: data.generateId(), name, icon });
    data.set(data.keys.cleanTasks, tasks);
    if (input) input.value = '';
    this._iconIndex = 0;
    if (iconEl) iconEl.textContent = HOUSE_TASK_ICONS[0];
    // Regenerate this week's schedule
    data.set(data.keys.cleanSched, this.getHouseSchedule().filter(a => a.weekStart !== this.currentWeekStart));
    this.ensureHouseScheduleForWeek(this.currentWeekStart);
    // Update modal list in place (don't close)
    this._renderTaskLabelsList();
    this.renderHouseCleaning();
    toast(`"${name}" added to this week's schedule!`, 'success');
  },

  removeHouseTask(id) {
    if (!confirm('Remove this task label?')) return;
    const task = this.getHouseTasks().find(t => t.id === id);
    data.set(data.keys.cleanTasks, this.getHouseTasks().filter(t => t.id !== id));
    data.set(data.keys.cleanSched, this.getHouseSchedule().filter(a => a.taskId !== id));
    this._renderTaskLabelsList();
    this.renderHouseCleaning();
    if (task) toast(`"${task.name}" removed`, 'info');
  },

  toggleTask(assignmentId) {
    const all = this.getHouseSchedule();
    const idx = all.findIndex(a => a.id === assignmentId);
    if (idx < 0) return;
    const isDone = all[idx].status === 'completed';
    all[idx] = { ...all[idx], status: isDone ? 'pending' : 'completed', completedAt: isDone ? null : new Date().toISOString() };
    data.set(data.keys.cleanSched, all);
    this.renderHouseCleaning();
    if (!isDone) toast(`${all[idx].taskName} ✓ done!`, 'success');
  },

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 2 — WEEKLY TRASH ROTATION
  // ════════════════════════════════════════════════════════════════════════════
  getTrashOverrides() { return data.get(data.keys.trashSched) || {}; },

  getAutoTrashAssignee(weekStart) {
    const activeFm = flatmates.getActive();
    if (!activeFm.length) return null;
    const weekIndex = data.getWeekIndex(weekStart);
    return activeFm[weekIndex % activeFm.length];
  },

  getTrashAssigneeForWeek(weekStart) {
    const overrides = this.getTrashOverrides();
    if (overrides[weekStart]) return flatmates.getById(overrides[weekStart]);
    return this.getAutoTrashAssignee(weekStart);
  },

  getTrashTypeForWeek(weekStart) {
    const flat = data.get(data.keys.flat);
    if (!flat?.trashTypeAnchor) return null;
    const anchorIndex = data.getWeekIndex(flat.trashTypeAnchor.weekStart);
    const thisIndex = data.getWeekIndex(weekStart);
    const isA = (thisIndex - anchorIndex) % 2 === 0;
    return isA ? flat.trashTypeAnchor.type : (flat.trashTypeAnchor.type === 'Restmüll / Bio' ? 'Papier / Gelber Sack' : 'Restmüll / Bio');
  },

  setTrashTypeAnchor(weekStart, type) {
    const flat = data.get(data.keys.flat);
    flat.trashTypeAnchor = { weekStart, type };
    data.set(data.keys.flat, flat);
    this.renderWeeklyTrash();
  },

  toggleTrashDone(weekStart) {
    const done = data.get(data.keys.trashDone) || {};
    const wasDone = done[weekStart]?.done;
    done[weekStart] = { done: !wasDone, doneAt: !wasDone ? new Date().toISOString() : null };
    data.set(data.keys.trashDone, done);
    this.renderWeeklyTrash();
  },

  renderWeeklyTrash() {
    const el = document.getElementById('weekly-trash-content');
    if (!el) return;
    const activeFm = flatmates.getActive();

    if (activeFm.length === 0) {
      el.innerHTML = `<div class="empty-state" style="padding:32px 16px"><div class="empty-state-icon" style="font-size:36px">👥</div><p class="text-secondary">Add flatmates in Settings</p></div>`;
      return;
    }

    const weekStart = this.currentWeekStart;
    const assignee = this.getTrashAssigneeForWeek(weekStart);
    const trashType = this.getTrashTypeForWeek(weekStart);
    const doneData = data.get(data.keys.trashDone) || {};
    const isDone = doneData[weekStart]?.done || false;
    const avatarColor = (fm) => fm ? AVATAR_COLORS_CLN[fm.color % AVATAR_COLORS_CLN.length] : '#555';

    let typeSection = '';
    if (!trashType) {
      typeSection = `
        <div style="margin-top:14px">
          <label class="form-label" style="margin-bottom:8px;display:block">What type is this week?</label>
          <div style="display:flex;gap:8px">
            <button class="btn btn-sm btn-secondary" style="flex:1" onclick="cleaning.setTrashTypeAnchor('${weekStart}', 'Restmüll / Bio')">Restmüll / Bio</button>
            <button class="btn btn-sm btn-secondary" style="flex:1" onclick="cleaning.setTrashTypeAnchor('${weekStart}', 'Papier / Gelber Sack')">Papier / Gelber Sack</button>
          </div>
        </div>`;
    } else {
      const isAmber = trashType === 'Restmüll / Bio';
      typeSection = `<div style="margin-top:10px"><span class="trash-type-badge ${isAmber ? 'amber' : 'blue'}">${trashType}</span></div>`;
    }

    el.innerHTML = `
      <div class="card" style="margin:0 16px;border:2px solid ${isDone ? 'var(--accent-green)' : 'var(--border)'};background:${isDone ? 'linear-gradient(135deg,rgba(34,197,94,0.06),rgba(34,197,94,0.02))' : 'var(--bg-card)'}">
        <div style="display:flex;align-items:center;gap:14px">
          <div style="width:60px;height:60px;border-radius:50%;background:${avatarColor(assignee)};display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:800;color:#fff;flex-shrink:0;box-shadow:0 3px 10px rgba(0,0,0,0.15)">
            ${assignee ? assignee.name[0].toUpperCase() : '?'}
          </div>
          <div style="flex:1">
            <div style="font-size:22px;font-weight:800;color:var(--text-primary)">${assignee?.name || '—'}</div>
            <div class="text-sm text-secondary">Takes out the trash this week</div>
          </div>
          <button class="cleaning-check-btn ${isDone ? 'done' : ''}" onclick="cleaning.toggleTrashDone('${weekStart}')" title="${isDone ? 'Undo' : 'Mark done'}">${isDone ? '✓' : ''}</button>
        </div>
        ${typeSection}
        ${isDone ? `<div class="text-xs text-secondary" style="margin-top:8px">✓ Done ${data.formatRelativeTime(doneData[weekStart]?.doneAt)}</div>` : ''}
      </div>

      <div style="margin:12px 16px 0;padding:12px 14px;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-md);box-shadow:0 1px 4px rgba(0,0,0,0.05)">
        <div class="text-xs fw-600" style="text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;color:var(--text-secondary)">Rotation Order</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${activeFm.map((f, i) => `
            <div style="display:flex;align-items:center;gap:6px;background:var(--bg-elevated);padding:5px 10px;border-radius:var(--radius-full);border:1px solid var(--border)">
              <div style="width:22px;height:22px;border-radius:50%;background:${AVATAR_COLORS_CLN[f.color % 6]};display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff">${f.name[0].toUpperCase()}</div>
              <span style="font-size:12px;font-weight:600;color:var(--text-primary)">${f.name}</span>
              <span style="font-size:10px;color:var(--text-tertiary)">#${i + 1}</span>
            </div>`).join('')}
        </div>
      </div>`;
  },

  // ─── LEGACY ─────────────────────────────────────────────────────────────────
  renderTaskSettings() {
    const el = document.getElementById('cleaning-tasks-settings');
    if (!el) return;
    el.innerHTML = `<p class="text-sm text-secondary" style="padding:12px 0">Manage cleaning task labels in the Cleaning tab.</p>`;
  }
};

window.cleaning = cleaning;
