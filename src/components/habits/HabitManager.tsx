import { useState, useEffect } from 'react';
import { Pencil, Archive, ArchiveRestore, Plus, Check, X, Smile } from 'lucide-react';
import { useHabits } from '../../contexts/HabitContext';

export const HABIT_EMOJIS = [
  '💻', '📚', '🏃', '🏋️', '🧘', '💪', '🥗', '💧',
  '😴', '🎯', '🧠', '✍️', '🎨', '🎵', '🚶', '🧹',
  '🍎', '☀️', '🌙', '📝',
];

interface HabitManagerProps {
  onClose: () => void;
  initialMode?: 'list' | 'create';
}

export default function HabitManager({ onClose, initialMode = 'list' }: HabitManagerProps) {
  const { allHabits, addHabit, editHabit, archiveHabit, unarchiveHabit } = useHabits();
  const [tab, setTab] = useState<'active' | 'archived'>('active');
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>(initialMode);
  const [editId, setEditId] = useState('');
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekdays' | 'weekends' | 'custom'>('daily');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [archiveConfirmId, setArchiveConfirmId] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const activeHabits = allHabits.filter((h) => h.active !== false).sort((a, b) => a.order - b.order);
  const archivedHabits = allHabits.filter((h) => h.active === false).sort((a, b) => a.order - b.order);

  const openCreate = () => {
    setName('');
    setEmoji('');
    setFrequency('daily');
    setEditId('');
    setError('');
    setShowEmojiPicker(false);
    setMode('create');
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    try {
      const created = await addHabit({
        name: name.trim(),
        emoji: emoji || '🎯',
        frequency,
      });
      if (created) {
        resetForm();
        onClose();
      } else {
        setError('Failed to create habit in Firestore. Please check your Firestore security rules.');
      }
    } catch (err: any) {
      console.error('Error creating habit:', err);
      setError(err?.message || 'Failed to create habit in Firestore.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!name.trim() || !editId) return;
    setLoading(true);
    setError('');
    try {
      await editHabit(editId, {
        name: name.trim(),
        emoji: emoji || '🎯',
        frequency,
      });
      resetForm();
    } catch (err: any) {
      setError(err?.message || 'Failed to update habit');
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (habitId: string) => {
    setLoading(true);
    await archiveHabit(habitId);
    setArchiveConfirmId(null);
    setLoading(false);
  };

  const handleUnarchive = async (habitId: string) => {
    setLoading(true);
    await unarchiveHabit(habitId);
    setLoading(false);
  };

  const resetForm = () => {
    setName('');
    setEmoji('');
    setFrequency('daily');
    setEditId('');
    setError('');
    setShowEmojiPicker(false);
    setMode('list');
  };

  const startEdit = (habit: typeof allHabits[0]) => {
    setEditId(habit.id);
    setName(habit.name);
    setEmoji(habit.emoji);
    setFrequency(habit.frequency);
    setError('');
    setShowEmojiPicker(false);
    setMode('edit');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div className="modal-title" style={{ marginBottom: 0 }}>Manage Habits</div>
          <button
            onClick={onClose}
            style={{ color: 'var(--text-muted)', padding: '4px', borderRadius: '4px' }}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {mode === 'list' && (
          <>
            {/* Tabs: Active Habits vs Archived Habits */}
            <div style={{
              display: 'flex',
              gap: '8px',
              borderBottom: '1px solid var(--border-color)',
              marginBottom: '16px',
              paddingBottom: '8px'
            }}>
              <button
                type="button"
                onClick={() => setTab('active')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  background: tab === 'active' ? 'var(--accent)' : 'transparent',
                  color: tab === 'active' ? '#fff' : 'var(--text-muted)',
                  transition: 'all 0.15s',
                }}
              >
                Active Habits ({activeHabits.length})
              </button>
              <button
                type="button"
                onClick={() => setTab('archived')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  background: tab === 'archived' ? 'var(--accent)' : 'transparent',
                  color: tab === 'archived' ? '#fff' : 'var(--text-muted)',
                  transition: 'all 0.15s',
                }}
              >
                Archived Habits ({archivedHabits.length})
              </button>
            </div>

            {/* List for Active Habits */}
            {tab === 'active' && (
              <>
                <div style={{ maxHeight: '360px', overflowY: 'auto', marginBottom: '16px' }}>
                  {activeHabits.length === 0 ? (
                    <div className="empty-state" style={{ padding: '24px' }}>
                      <div className="empty-state-text">No active habits. Create one below!</div>
                    </div>
                  ) : (
                    activeHabits.map((habit) => (
                      <div key={habit.id} className="habit-list-item">
                        <span className="habit-list-emoji">{habit.emoji}</span>
                        <div style={{ flex: 1 }}>
                          <div className="habit-list-name">{habit.name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {habit.frequency}
                          </div>
                        </div>

                        {archiveConfirmId === habit.id ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Archive?</span>
                            <button
                              type="button"
                              onClick={() => handleArchive(habit.id)}
                              disabled={loading}
                              style={{ color: '#86efac', padding: '4px' }}
                              title="Confirm archive (keeps history)"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setArchiveConfirmId(null)}
                              style={{ color: '#fca5a5', padding: '4px' }}
                              title="Cancel"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <div className="habit-list-actions">
                            <button
                              type="button"
                              className="habit-action-btn"
                              onClick={() => startEdit(habit)}
                              title="Edit habit"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              className="habit-action-btn"
                              onClick={() => setArchiveConfirmId(habit.id)}
                              title="Archive habit (preserves historical data)"
                            >
                              <Archive size={15} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <button
                  type="button"
                  className="btn-primary"
                  onClick={openCreate}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <Plus size={16} />
                  Add New Habit
                </button>
              </>
            )}

            {/* List for Archived Habits */}
            {tab === 'archived' && (
              <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Archived habits stop appearing in active monthly tracking, but all past completions and historical records remain preserved.
                </p>
                {archivedHabits.length === 0 ? (
                  <div className="empty-state" style={{ padding: '24px' }}>
                    <div className="empty-state-text">No archived habits yet.</div>
                  </div>
                ) : (
                  archivedHabits.map((habit) => (
                    <div key={habit.id} className="habit-list-item" style={{ opacity: 0.85 }}>
                      <span className="habit-list-emoji">{habit.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div className="habit-list-name">{habit.name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          Archived {habit.archivedAt ? new Date(habit.archivedAt).toLocaleDateString() : ''}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => handleUnarchive(habit.id)}
                        disabled={loading}
                        style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                        title="Restore to active habits"
                      >
                        <ArchiveRestore size={14} />
                        Unarchive
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}

        {(mode === 'create' || mode === 'edit') && (
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
              {mode === 'create' ? 'Create New Habit' : 'Edit Habit'}
            </div>

            {error && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#fca5a5',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  marginBottom: '16px',
                  lineHeight: 1.4,
                }}
              >
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="habit-name">Habit Name</label>
              <input
                id="habit-name"
                className="form-input"
                type="text"
                placeholder="e.g. GYM, Meditation, Reading"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="form-group" style={{ position: 'relative' }}>
              <label className="form-label" htmlFor="habit-emoji">Emoji Icon</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  id="habit-emoji"
                  className="form-input"
                  type="text"
                  placeholder="e.g. 💻, 💪, 📚"
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  id="emoji-picker-toggle-btn"
                  className="btn-secondary"
                  onClick={() => setShowEmojiPicker((prev) => !prev)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    minWidth: '52px',
                    height: '42px',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                  title="Pick an emoji"
                >
                  <Smile size={18} />
                  {emoji ? <span style={{ fontSize: '1rem' }}>{emoji}</span> : null}
                </button>
              </div>

              {showEmojiPicker && (
                <div
                  id="emoji-picker-popover"
                  style={{
                    marginTop: '8px',
                    padding: '12px',
                    background: '#1a1f2e',
                    border: '1px solid #2d3748',
                    borderRadius: '8px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                    zIndex: 50,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Suggested Habit Emojis
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(false)}
                      style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '2px' }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(10, 1fr)',
                      gap: '6px',
                    }}
                  >
                    {HABIT_EMOJIS.map((em) => (
                      <button
                        key={em}
                        type="button"
                        className="emoji-picker-item"
                        onClick={() => {
                          setEmoji(em);
                          setShowEmojiPicker(false);
                        }}
                        style={{
                          fontSize: '1.25rem',
                          background: emoji === em ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                          border: emoji === em ? '1px solid #6366f1' : '1px solid transparent',
                          borderRadius: '6px',
                          padding: '6px 4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        title={em}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="habit-frequency">Frequency</label>
              <select
                id="habit-frequency"
                className="cal-setting-select"
                style={{ width: '100%', padding: '10px 14px' }}
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as any)}
              >
                <option value="daily">Daily</option>
                <option value="weekdays">Weekdays Only</option>
                <option value="weekends">Weekends Only</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={resetForm}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={mode === 'create' ? handleCreate : handleEdit}
                disabled={loading || !name.trim()}
              >
                {loading ? 'Saving...' : mode === 'create' ? 'Create Habit' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
