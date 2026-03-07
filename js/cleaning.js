// ===========================
// cleaning.js — Redesigned
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

  // ─── WEEK NAVIGATION (timezone-safe) ────────────────────────────────────────
  navigateWeek(direction) {
    // Parse with noon time so getDay() is always correct in local timezone
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
          <div class="progress-bar"><div class="progress-fill ${progressClass}" style="width:${pct}%"></div></div>
        </div>`;
    }

    // Task cards
    if (assignments.length === 0 && tasks.length > 0) {
      // No schedule generated yet — generate now and re-render
      this.ensureHouseScheduleForWeek(this.currentWeekStart);
      return this.renderHouseCleaning();
    }

    if (tasks.length === 0) {
      html += `<div class="empty-state" style="padding:32px 16px"><div class="empty-state-icon" style="font-size:40px">🧹</div><p class="text-secondary">No tasks yet — add labels below</p></div>`;
    } else {
      html += `<div class="card-list" style="margin-top:8px">`;
      assignments.forEach(a => {
        const fm = flatmates.getById(a.assignedTo);
        const isDone = a.status === 'completed';
        const avatarColor = fm ? AVATAR_COLORS_CLN[fm.color % AVATAR_COLORS_CLN.length] : '#555';
        html += `
          <div class="cleaning-card ${isDone ? 'done' : ''}">
            <div class="cleaning-task-icon" style="background:rgba(76,175,80,0.12);font-size:26px">${a.taskIcon || '🧹'}</div>
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

    // ── Add custom task label inline UI ──────────────────────────────────────
    html += `
      <div style="margin:16px 16px 4px;padding:14px;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);box-shadow:0 1px 4px rgba(0,0,0,0.05)">
        <div class="settings-section-title" style="padding-left:0;margin-bottom:10px">Task Labels</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;min-height:32px">
          ${tasks.length === 0 ? '<span class="text-xs text-secondary" style="line-height:32px">No labels yet — add one below</span>' : ''}
          ${tasks.map(t => `
            <div style="display:inline-flex;align-items:center;gap:6px;background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius-full);padding:6px 12px">
              <span>${t.icon || '🧹'}</span>
              <span style="font-size:13px;font-weight:600;color:var(--text-primary)">${t.name}</span>
              <button onclick="cleaning.removeHouseTask('${t.id}')" style="background:none;border:none;cursor:pointer;color:var(--text-tertiary);font-size:16px;padding:0 0 0 4px;line-height:1;font-weight:700">×</button>
            </div>`).join('')}
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <div style="width:44px;height:44px;display:flex;align-items:center;justify-content:center;font-size:22px;cursor:pointer;border:1px solid var(--border);border-radius:var(--radius-md);background:var(--bg-elevated);flex-shrink:0" id="task-icon-picker" onclick="cleaning.cycleIcon()" title="Click to change icon">🧹</div>
          <input id="new-task-label" class="form-input" placeholder="New task label…" style="flex:1" onkeydown="if(event.key==='Enter')cleaning.addHouseTask()">
          <button class="btn btn-sm btn-primary" onclick="cleaning.addHouseTask()" style="flex-shrink:0">Add</button>
        </div>
      </div>`;

    el.innerHTML = html;
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
    // Regenerate this week's schedule from scratch
    data.set(data.keys.cleanSched, this.getHouseSchedule().filter(a => a.weekStart !== this.currentWeekStart));
    this.ensureHouseScheduleForWeek(this.currentWeekStart);
    this.renderHouseCleaning();
    toast(`"${name}" added to this week's schedule!`, 'success');
  },

  removeHouseTask(id) {
    if (!confirm('Remove this task label?')) return;
    const task = this.getHouseTasks().find(t => t.id === id);
    data.set(data.keys.cleanTasks, this.getHouseTasks().filter(t => t.id !== id));
    // Remove from all schedules
    data.set(data.keys.cleanSched, this.getHouseSchedule().filter(a => a.taskId !== id));
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
    if (overrides[weekStart]) {
      return flatmates.getById(overrides[weekStart]);
    }
    return this.getAutoTrashAssignee(weekStart);
  },

  setTrashAssignee(weekStart, flatmateId) {
    const overrides = this.getTrashOverrides();
    if (flatmateId === '__auto__') {
      delete overrides[weekStart];
    } else {
      overrides[weekStart] = flatmateId;
    }
    data.set(data.keys.trashSched, overrides);
    this.renderWeeklyTrash();
  },

  getNextWeekStart(weekStart) {
    const d = new Date(weekStart + 'T12:00:00');
    d.setDate(d.getDate() + 7);
    const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  },

  renderWeeklyTrash() {
    const el = document.getElementById('weekly-trash-content');
    if (!el) return;
    const activeFm = flatmates.getActive();

    if (activeFm.length === 0) {
      el.innerHTML = `<div class="empty-state" style="padding:32px 16px"><div class="empty-state-icon" style="font-size:36px">👥</div><p class="text-secondary">Add flatmates in Settings</p></div>`;
      return;
    }

    const currentWeek = this.currentWeekStart;
    const nextWeek = this.getNextWeekStart(currentWeek);
    const currentFm = this.getTrashAssigneeForWeek(currentWeek);
    const nextFm = this.getTrashAssigneeForWeek(nextWeek);
    const overrides = this.getTrashOverrides();
    const isCurrentOverridden = !!overrides[currentWeek];
    const isNextOverridden = !!overrides[nextWeek];
    const autoNextFm = this.getAutoTrashAssignee(nextWeek);

    const avatarColor = (fm) => fm ? AVATAR_COLORS_CLN[fm.color % AVATAR_COLORS_CLN.length] : '#555';

    el.innerHTML = `
      <!-- Current week -->
      <div class="card" style="margin:0 16px;border:2px solid var(--accent-green);background:linear-gradient(135deg,rgba(61,158,65,0.06),rgba(61,158,65,0.02))">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:12px">
          <span style="font-size:11px;font-weight:700;color:var(--accent-green);letter-spacing:0.8px;text-transform:uppercase">📅 This Week</span>
          ${isCurrentOverridden ? '<span class="badge badge-amber" style="font-size:9px">custom</span>' : '<span class="badge badge-green" style="font-size:9px">auto</span>'}
        </div>
        <div style="display:flex;align-items:center;gap:14px">
          <div style="width:60px;height:60px;border-radius:50%;background:${avatarColor(currentFm)};display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:800;color:#fff;flex-shrink:0;box-shadow:0 3px 10px rgba(0,0,0,0.15)">
            ${currentFm ? currentFm.name[0].toUpperCase() : '?'}
          </div>
          <div style="flex:1">
            <div style="font-size:22px;font-weight:800;color:var(--text-primary)">${currentFm?.name || '—'}</div>
            <div class="text-sm text-secondary">Takes out the trash this week</div>
          </div>
          <div style="font-size:36px">🗑️</div>
        </div>
        <div style="margin-top:14px">
          <label class="form-label">Change assignment</label>
          <div style="display:flex;gap:8px;margin-top:6px">
            <select class="form-select" style="flex:1" onchange="cleaning.setTrashAssignee('${currentWeek}', this.value)">
              <option value="__auto__" ${!isCurrentOverridden ? 'selected' : ''}>Auto (${this.getAutoTrashAssignee(currentWeek)?.name || '?'})</option>
              ${activeFm.map(f => `<option value="${f.id}" ${isCurrentOverridden && overrides[currentWeek] === f.id ? 'selected' : ''}>${f.name}</option>`).join('')}
            </select>
          </div>
        </div>
      </div>

      <!-- Next week preview -->
      <div class="card" style="margin:10px 16px 0;border:1px solid var(--border)">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:12px">
          <span style="font-size:11px;font-weight:700;color:var(--text-secondary);letter-spacing:0.8px;text-transform:uppercase">🗓️ Next Week</span>
          ${isNextOverridden ? '<span class="badge badge-amber" style="font-size:9px">custom</span>' : '<span class="badge badge-gray" style="font-size:9px">auto</span>'}
        </div>
        <div style="display:flex;align-items:center;gap:14px">
          <div style="width:48px;height:48px;border-radius:50%;background:${avatarColor(nextFm)};display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;color:#fff;opacity:${isNextOverridden ? 1 : 0.8};flex-shrink:0;box-shadow:0 2px 8px rgba(0,0,0,0.12)">
            ${nextFm ? nextFm.name[0].toUpperCase() : '?'}
          </div>
          <div style="flex:1">
            <div style="font-size:18px;font-weight:700;color:var(--text-primary)">${nextFm?.name || '—'}</div>
            <div class="text-sm text-secondary">${isNextOverridden ? 'Manually assigned' : 'Auto-rotation'}</div>
          </div>
        </div>
        <div style="margin-top:12px">
          <label class="form-label">Set next week's person</label>
          <div style="display:flex;gap:8px;margin-top:6px">
            <select class="form-select" style="flex:1" onchange="cleaning.setTrashAssignee('${nextWeek}', this.value)">
              <option value="__auto__" ${!isNextOverridden ? 'selected' : ''}>Auto (${autoNextFm?.name || '?'})</option>
              ${activeFm.map(f => `<option value="${f.id}" ${isNextOverridden && overrides[nextWeek] === f.id ? 'selected' : ''}>${f.name}</option>`).join('')}
            </select>
          </div>
        </div>
      </div>

      <!-- Rotation order preview -->
      <div style="margin:12px 16px 0;padding:12px 14px;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-md);box-shadow:0 1px 4px rgba(0,0,0,0.05)">
        <div class="text-xs fw-600" style="text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;color:var(--text-secondary)">🔄 Auto Rotation Order</div>
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

  // ─── LEGACY — used by settings page (now deprecated, but kept for safety) ─
  renderTaskSettings() {
    const el = document.getElementById('cleaning-tasks-settings');
    if (!el) return;
    el.innerHTML = `<p class="text-sm text-secondary" style="padding:12px 0">Manage cleaning task labels directly in the Cleaning tab.</p>`;
  }
};

window.cleaning = cleaning;
