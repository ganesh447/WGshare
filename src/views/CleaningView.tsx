import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { data, AVATAR_COLORS, HOUSE_TASK_ICONS, type CleanAssignment } from '@/lib/data';
import ModalSheet from '@/components/ModalSheet';

export default function CleaningView() {
  const { flatmates, cleanTasks, cleanSchedule, flat, trashDone, updateData, toast } = useApp();
  const [currentWeek, setCurrentWeek] = useState(data.getWeekStart());
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [iconIndex, setIconIndex] = useState(0);

  const activeFm = flatmates.filter(f => f.active);

  const ensureSchedule = (weekStart: string) => {
    const existing = cleanSchedule.filter(a => a.weekStart === weekStart);
    if (existing.length > 0) return;
    if (!activeFm.length || !cleanTasks.length) return;
    const weekIndex = data.getWeekIndex(weekStart);
    const newAssignments: CleanAssignment[] = cleanTasks.map((task, i) => ({
      id: data.generateId(),
      taskId: task.id,
      taskName: task.name,
      taskIcon: task.icon,
      assignedTo: activeFm[(i + weekIndex) % activeFm.length].id,
      weekStart,
      status: 'pending',
      completedAt: null,
    }));
    updateData(data.keys.cleanSched, [...cleanSchedule, ...newAssignments]);
  };

  useEffect(() => { ensureSchedule(currentWeek); }, [currentWeek, cleanTasks.length]);

  const navigateWeek = (dir: number) => {
    const d = new Date(currentWeek + 'T12:00:00');
    d.setDate(d.getDate() + dir * 7);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setCurrentWeek(`${y}-${m}-${dd}`);
  };

  const formatWeekLabel = () => {
    const start = new Date(currentWeek + 'T12:00:00');
    const end = new Date(currentWeek + 'T12:00:00');
    end.setDate(end.getDate() + 6);
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const isCurrentWeek = currentWeek === data.getWeekStart();
    const label = `${start.toLocaleDateString('en-GB', opts)} – ${end.toLocaleDateString('en-GB', opts)}`;
    return isCurrentWeek ? `This Week · ${label}` : label;
  };

  const assignments = cleanSchedule.filter(a => a.weekStart === currentWeek);
  const doneCount = assignments.filter(a => a.status === 'completed').length;
  const pct = assignments.length > 0 ? Math.round((doneCount / assignments.length) * 100) : 0;

  const toggleTask = (id: string) => {
    const all = [...cleanSchedule];
    const idx = all.findIndex(a => a.id === id);
    if (idx < 0) return;
    const isDone = all[idx].status === 'completed';
    all[idx] = { ...all[idx], status: isDone ? 'pending' : 'completed', completedAt: isDone ? null : new Date().toISOString() };
    updateData(data.keys.cleanSched, all);
    if (!isDone) toast(`${all[idx].taskName} ✓ done!`, 'success');
  };

  const addHouseTask = () => {
    if (!newTaskName.trim()) { toast('Enter a task label', 'error'); return; }
    const icon = HOUSE_TASK_ICONS[iconIndex];
    const tasks = [...cleanTasks, { id: data.generateId(), name: newTaskName.trim(), icon }];
    updateData(data.keys.cleanTasks, tasks);
    // Remove current week's schedule to regenerate
    updateData(data.keys.cleanSched, cleanSchedule.filter(a => a.weekStart !== currentWeek));
    setNewTaskName('');
    setIconIndex(0);
    toast(`"${newTaskName}" added!`, 'success');
  };

  const removeTask = (id: string) => {
    updateData(data.keys.cleanTasks, cleanTasks.filter(t => t.id !== id));
    updateData(data.keys.cleanSched, cleanSchedule.filter(a => a.taskId !== id));
    toast('Task removed', 'info');
  };

  // Trash
  const getTrashAssignee = () => {
    if (!activeFm.length) return null;
    const weekIndex = data.getWeekIndex(currentWeek);
    return activeFm[weekIndex % activeFm.length];
  };

  const getTrashType = () => {
    if (!flat?.trashTypeAnchor) return null;
    const anchorIndex = data.getWeekIndex(flat.trashTypeAnchor.weekStart);
    const thisIndex = data.getWeekIndex(currentWeek);
    const isA = (thisIndex - anchorIndex) % 2 === 0;
    return isA ? flat.trashTypeAnchor.type : (flat.trashTypeAnchor.type === 'Restmüll / Bio' ? 'Papier / Gelber Sack' : 'Restmüll / Bio');
  };

  const setTrashTypeAnchor = (type: string) => {
    const updatedFlat = { ...flat!, trashTypeAnchor: { weekStart: currentWeek, type } };
    updateData(data.keys.flat, updatedFlat);
  };

  const toggleTrashDone = () => {
    const done = { ...trashDone };
    const wasDone = done[currentWeek]?.done;
    done[currentWeek] = { done: !wasDone, doneAt: !wasDone ? new Date().toISOString() : null };
    updateData(data.keys.trashDone, done);
  };

  const trashAssignee = getTrashAssignee();
  const trashType = getTrashType();
  const isTrashDone = trashDone[currentWeek]?.done || false;

  return (
    <div className="animate-fade-in-up">
      <div className="px-5 pt-5 pb-2">
        <h2 className="text-2xl font-bold tracking-tight">Cleaning</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Weekly schedule & trash rotation</p>
      </div>

      {/* Week nav */}
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={() => navigateWeek(-1)} className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none">← Prev</button>
        <span className="text-sm font-bold">{formatWeekLabel()}</span>
        <button onClick={() => navigateWeek(1)} className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none">Next →</button>
      </div>

      {/* House Cleaning */}
      <div className="flex items-center justify-between px-4 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🏠</span>
            <span className="text-base font-extrabold">House Cleaning</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 pl-7">Rotating tasks among all flatmates</p>
        </div>
        <button onClick={() => setShowTaskModal(true)} className="w-9 h-9 rounded-full border border-border bg-secondary flex items-center justify-center text-xl text-muted-foreground hover:text-foreground transition-colors">+</button>
      </div>

      {/* Progress */}
      {assignments.length > 0 && (
        <div className="px-4 pb-2">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-muted-foreground">{doneCount}/{assignments.length} tasks done</span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold uppercase ${
              doneCount === assignments.length ? 'bg-accent/10 text-accent' : doneCount > 0 ? 'bg-accent-amber/10 text-accent-amber' : 'bg-secondary text-muted-foreground'
            }`}>{doneCount === assignments.length ? '✓ All done!' : `${pct}%`}</span>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${doneCount === assignments.length ? 'bg-accent' : doneCount > 0 ? 'bg-accent-amber' : 'bg-destructive'}`}
              style={{ width: `${pct}%`, animation: 'growBar 0.7s ease both' }} />
          </div>
        </div>
      )}

      {/* Task cards */}
      {assignments.length === 0 && cleanTasks.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl opacity-30 mb-2">🧹</div>
          <p className="text-sm text-muted-foreground">No tasks yet — tap + to add labels</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 px-4 mt-2">
          {assignments.map(a => {
            const fm = flatmates.find(f => f.id === a.assignedTo);
            const isDone = a.status === 'completed';
            const avatarColor = fm ? AVATAR_COLORS[fm.color % AVATAR_COLORS.length] : '#555';
            return (
              <div key={a.id} className={`glass-card rounded-xl p-4 flex items-center gap-3 animate-fade-in-up ${isDone ? 'opacity-60' : ''}`}>
                <span className="text-2xl">{a.taskIcon || '🧹'}</span>
                <div className="flex-1">
                  <p className="font-semibold">{a.taskName}</p>
                  {fm && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-foreground flex-shrink-0"
                        style={{ background: avatarColor }}>{fm.name[0].toUpperCase()}</div>
                      <span className="text-sm text-muted-foreground">{fm.name}</span>
                    </div>
                  )}
                  {isDone && <p className="text-[11px] text-muted-foreground mt-1">✓ Done {data.formatRelativeTime(a.completedAt)}</p>}
                </div>
                <button onClick={() => toggleTask(a.id)}
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all ${
                    isDone ? 'border-accent bg-accent/20 text-accent' : 'border-border bg-transparent text-transparent hover:border-primary'
                  }`}>{isDone ? '✓' : ''}</button>
              </div>
            );
          })}
        </div>
      )}

      {/* Trash section */}
      <div className="px-4 pt-4 mt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <span className="text-lg">🗑️</span>
          <span className="text-base font-extrabold">Weekly Trash</span>
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5 pl-7">One person per week, auto-rotates</p>
      </div>

      {activeFm.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl opacity-30 mb-2">👥</div>
          <p className="text-sm text-muted-foreground">Add flatmates in Settings</p>
        </div>
      ) : (
        <div className="px-4 mt-3 pb-4">
          <div className={`glass-card rounded-xl p-4 ${isTrashDone ? 'border-accent/30' : ''}`}
            style={isTrashDone ? { background: 'linear-gradient(135deg, hsla(142,71%,45%,0.06), hsla(142,71%,45%,0.02))' } : {}}>
            <div className="flex items-center gap-3.5">
              <div className="w-[60px] h-[60px] rounded-full flex items-center justify-center text-2xl font-extrabold text-foreground flex-shrink-0"
                style={{ background: trashAssignee ? AVATAR_COLORS[trashAssignee.color % AVATAR_COLORS.length] : '#555', boxShadow: '0 3px 10px rgba(0,0,0,0.15)' }}>
                {trashAssignee?.name[0].toUpperCase() || '?'}
              </div>
              <div className="flex-1">
                <p className="text-[22px] font-extrabold">{trashAssignee?.name || '—'}</p>
                <p className="text-sm text-muted-foreground">Takes out the trash this week</p>
              </div>
              <button onClick={toggleTrashDone}
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all ${
                  isTrashDone ? 'border-accent bg-accent/20 text-accent' : 'border-border bg-transparent text-transparent hover:border-primary'
                }`}>{isTrashDone ? '✓' : ''}</button>
            </div>

            {!trashType ? (
              <div className="mt-3.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">What type is this week?</p>
                <div className="flex gap-2">
                  <button onClick={() => setTrashTypeAnchor('Restmüll / Bio')} className="flex-1 py-2 px-3 rounded-full text-xs font-bold bg-secondary text-foreground border border-border">Restmüll / Bio</button>
                  <button onClick={() => setTrashTypeAnchor('Papier / Gelber Sack')} className="flex-1 py-2 px-3 rounded-full text-xs font-bold bg-secondary text-foreground border border-border">Papier / Gelber Sack</button>
                </div>
              </div>
            ) : (
              <div className="mt-2.5">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase ${
                  trashType === 'Restmüll / Bio' ? 'bg-accent-amber/10 text-accent-amber' : 'bg-primary/10 text-primary'
                }`}>{trashType}</span>
              </div>
            )}

            {isTrashDone && <p className="text-[11px] text-muted-foreground mt-2">✓ Done {data.formatRelativeTime(trashDone[currentWeek]?.doneAt)}</p>}
          </div>

          {/* Rotation order */}
          <div className="glass-surface rounded-lg p-3 mt-3">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Rotation Order</p>
            <div className="flex gap-2 flex-wrap">
              {activeFm.map((f, i) => (
                <div key={f.id} className="inline-flex items-center gap-1.5 bg-secondary px-2.5 py-1 rounded-full border border-border">
                  <div className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[10px] font-bold text-foreground"
                    style={{ background: AVATAR_COLORS[f.color % 6] }}>{f.name[0].toUpperCase()}</div>
                  <span className="text-xs font-semibold">{f.name}</span>
                  <span className="text-[10px] text-muted-foreground">#{i + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Task labels modal */}
      <ModalSheet open={showTaskModal} onClose={() => setShowTaskModal(false)} title="Manage Tasks">
        {cleanTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">No tasks yet — add one below</p>
        ) : (
          <div className="flex gap-2 flex-wrap mb-1">
            {cleanTasks.map(t => (
              <div key={t.id} className="inline-flex items-center gap-1.5 bg-secondary border border-border rounded-full px-3 py-1.5">
                <span>{t.icon}</span>
                <span className="text-[13px] font-semibold">{t.name}</span>
                <button onClick={() => removeTask(t.id)} className="text-muted-foreground hover:text-foreground text-base font-bold ml-1 bg-transparent border-none">×</button>
              </div>
            ))}
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Add New Task</label>
          <div className="flex gap-2 items-center">
            <button onClick={() => setIconIndex((iconIndex + 1) % HOUSE_TASK_ICONS.length)}
              className="w-11 h-11 flex items-center justify-center text-[22px] border border-border rounded-lg bg-secondary flex-shrink-0">{HOUSE_TASK_ICONS[iconIndex]}</button>
            <input value={newTaskName} onChange={e => setNewTaskName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addHouseTask()}
              className="glass-input flex-1 rounded-lg px-3.5 py-3 text-foreground" placeholder="Task label…" />
            <button onClick={addHouseTask} className="px-3 py-2.5 rounded-full text-xs font-bold"
              style={{ background: 'var(--gradient-primary)', color: 'hsl(var(--primary-foreground))' }}>Add</button>
          </div>
        </div>
        <button onClick={() => setShowTaskModal(false)} className="w-full py-3 rounded-full text-sm font-bold bg-secondary text-foreground border border-border mt-2">Done</button>
      </ModalSheet>
    </div>
  );
}
