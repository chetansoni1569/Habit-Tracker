import { useMemo, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { format } from 'date-fns';
import { RotateCcw } from 'lucide-react';
import { useHabits } from '../../contexts/HabitContext';
import { getMonthCalendarData, isFutureDate } from '../../utils/calendar';

export default function MentalStateSection() {
  const {
    mentalStates,
    selectedYear,
    selectedMonth,
    updateMentalState,
    deleteMentalState,
    clearPastMentalStates,
  } = useHabits();
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [editMood, setEditMood] = useState(5);
  const [editMotivation, setEditMotivation] = useState(5);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [isDeletingEntry, setIsDeletingEntry] = useState(false);
  const [showClearPastModal, setShowClearPastModal] = useState(false);
  const [isClearingPast, setIsClearingPast] = useState(false);

  const weeks = useMemo(() => {
    return getMonthCalendarData(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth]);

  const allDays = useMemo(() => {
    return weeks.flatMap(w => w.days);
  }, [weeks]);

  const chartData = useMemo(() => {
    return allDays
      .map(day => {
        const state = mentalStates[day.fullDate];
        const dateObj = new Date(selectedYear, selectedMonth, day.date);
        return {
          day: day.date,
          dateStr: day.fullDate,
          dateLabel: format(dateObj, 'MMM d'),
          fullDate: format(dateObj, 'EEEE, MMMM d, yyyy'),
          Mood: state?.mood ?? null,
          Motivation: state?.motivation ?? null,
          hasData: (state?.mood !== null && state?.mood !== undefined) ||
                   (state?.motivation !== null && state?.motivation !== undefined),
        };
      })
      .filter(d => d.hasData);
  }, [allDays, mentalStates, selectedYear, selectedMonth]);

  const handleDayClick = (day: number) => {
    const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (isFutureDate(dateStr)) return;
    const existing = mentalStates[dateStr];
    setEditMood(existing?.mood ?? 5);
    setEditMotivation(existing?.motivation ?? 5);
    setShowDeleteConfirmModal(false);
    setEditingDay(day);
  };

  const handleSaveMentalState = async () => {
    if (editingDay === null) return;
    const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(editingDay).padStart(2, '0')}`;
    await updateMentalState(dateStr, editMood, editMotivation);
    setEditingDay(null);
  };

  const handleDeleteEntry = async () => {
    if (editingDay === null) return;
    const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(editingDay).padStart(2, '0')}`;
    setIsDeletingEntry(true);
    try {
      await deleteMentalState(dateStr);
    } catch (err) {
      console.error('Error deleting mental state:', err);
    } finally {
      setIsDeletingEntry(false);
      setShowDeleteConfirmModal(false);
      setEditingDay(null);
    }
  };

  const handleClearPastMentalStates = async () => {
    setIsClearingPast(true);
    try {
      await clearPastMentalStates();
    } catch (err) {
      console.error('Error clearing past mental states:', err);
    } finally {
      setIsClearingPast(false);
      setShowClearPastModal(false);
    }
  };

  const selectedDateObj = editingDay !== null ? new Date(selectedYear, selectedMonth, editingDay) : null;
  const formattedSelectedDate = selectedDateObj ? format(selectedDateObj, 'EEEE, MMMM d, yyyy') : '';

  return (
    <div className="mental-state-container">
      <div className="mental-state-title">
        <span>Mental state</span>
        <button
          type="button"
          className="clear-past-mental-btn"
          onClick={() => setShowClearPastModal(true)}
          title="Clear all mental state entries recorded before today"
        >
          <RotateCcw size={12} />
          Clear Past
        </button>
      </div>

      <div className="mental-state-table" tabIndex={0} role="region" aria-label="Mental state tracking calendar">
        {/* Date / Day Header row */}
        <div className="mental-state-grid mental-header-grid">
          <div className="mental-label mental-header-label">
            <span>Date</span>
          </div>
          <div className="mental-values">
            {allDays.map(day => {
              const isSelected = editingDay === day.date;
              return (
                <div
                  key={`hdr-${day.date}`}
                  className={`mental-header-cell ${day.isToday ? 'today-col' : ''} ${isSelected ? 'is-selected' : ''} ${day.isFuture ? 'future-day' : ''}`}
                  onClick={() => !day.isFuture && handleDayClick(day.date)}
                  title={`${day.dayName} ${day.date} (${day.fullDate})${!day.isFuture ? ' — Click to set mood/motivation' : ' (Future date)'}`}
                  role="button"
                  tabIndex={day.isFuture ? -1 : 0}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !day.isFuture) handleDayClick(day.date); }}
                >
                  <span className="mental-hdr-dayname">{day.dayName}</span>
                  <span className="mental-hdr-daynum">{day.date}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mood row */}
        <div className="mental-state-grid">
          <div className="mental-label">
            <span>Mood</span>
          </div>
          <div className="mental-values">
            {allDays.map(day => {
              const state = mentalStates[day.fullDate];
              const mood = state?.mood ?? null;
              const isSelected = editingDay === day.date;
              return (
                <div
                  key={`mood-${day.date}`}
                  className={`mental-value-cell ${mood !== null ? 'has-value' : ''} ${day.isToday ? 'today-col' : ''} ${isSelected ? 'is-selected' : ''} ${day.isFuture ? 'future-day' : ''}`}
                  onClick={() => !day.isFuture && handleDayClick(day.date)}
                  title={`${day.dayName} ${day.date} (${day.fullDate}): ${mood !== null ? `Mood ${mood}/10` : 'Click to set mood'}`}
                  role="button"
                  aria-label={`Mood for ${day.fullDate}: ${mood !== null ? mood : 'Not set'}`}
                  tabIndex={day.isFuture ? -1 : 0}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !day.isFuture) handleDayClick(day.date); }}
                >
                  {mood !== null ? mood : ''}
                </div>
              );
            })}
          </div>
        </div>

        {/* Motivation row */}
        <div className="mental-state-grid">
          <div className="mental-label">
            <span>Motivation</span>
          </div>
          <div className="mental-values">
            {allDays.map(day => {
              const state = mentalStates[day.fullDate];
              const mot = state?.motivation ?? null;
              const isSelected = editingDay === day.date;
              return (
                <div
                  key={`mot-${day.date}`}
                  className={`mental-value-cell ${mot !== null ? 'has-value' : ''} ${day.isToday ? 'today-col' : ''} ${isSelected ? 'is-selected' : ''} ${day.isFuture ? 'future-day' : ''}`}
                  onClick={() => !day.isFuture && handleDayClick(day.date)}
                  title={`${day.dayName} ${day.date} (${day.fullDate}): ${mot !== null ? `Motivation ${mot}/10` : 'Click to set motivation'}`}
                  role="button"
                  aria-label={`Motivation for ${day.fullDate}: ${mot !== null ? mot : 'Not set'}`}
                  tabIndex={day.isFuture ? -1 : 0}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !day.isFuture) handleDayClick(day.date); }}
                >
                  {mot !== null ? mot : ''}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Chart — area chart with clear calendar dates on XAxis */}
      {chartData.length > 0 ? (
        <div className="mental-chart-container">
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={chartData} margin={{ top: 8, right: 12, left: -20, bottom: 2 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2D323F" vertical={false} />
              <XAxis
                dataKey="dateLabel"
                tick={{ fontSize: 9, fill: '#9CA3AF' }}
                tickLine={false}
                axisLine={{ stroke: '#383D48' }}
              />
              <YAxis
                domain={[1, 10]}
                ticks={[2, 4, 6, 8, 10]}
                tick={{ fontSize: 9, fill: '#9CA3AF' }}
                tickLine={false}
                axisLine={{ stroke: '#383D48' }}
              />
              <Tooltip
                contentStyle={{
                  background: '#1E2025',
                  border: '1px solid #383D48',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  color: '#F3F4F6',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.fullDate || ''}
              />
              <Area
                type="monotone"
                dataKey="Mood"
                stroke="#6366F1"
                strokeWidth={2}
                fill="rgba(99, 102, 241, 0.2)"
                dot={{ r: 3, fill: '#6366F1', strokeWidth: 0 }}
                activeDot={{ r: 5 }}
                connectNulls
              />
              <Area
                type="monotone"
                dataKey="Motivation"
                stroke="#10B981"
                strokeWidth={2}
                fill="rgba(16, 185, 129, 0.15)"
                dot={{ r: 3, fill: '#10B981', strokeWidth: 0 }}
                activeDot={{ r: 5 }}
                strokeDasharray="4 2"
                connectNulls
              />
              <Legend
                wrapperStyle={{ fontSize: '0.75rem', paddingTop: '6px', color: '#9CA3AF' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="empty-state" style={{ padding: '16px' }}>
          <div className="empty-state-text" style={{ fontSize: '0.68rem' }}>
            Track your mood and motivation to understand your habits in context.
            <br />Click on any date above to get started.
          </div>
        </div>
      )}

      {/* Bottom bar below Mental State section */}
      <div className="mental-state-bottom-bar" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        borderTop: '1px solid var(--border-color)',
        background: 'var(--bg-card-light)',
      }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          Reset historical entries before today ({format(new Date(), 'MMM d, yyyy')})
        </span>
        <button
          type="button"
          className="btn-clear-all-past"
          onClick={() => setShowClearPastModal(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 16px',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: '#ffffff',
            background: '#dc2626',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          title="Clear all past mental state entries before today"
        >
          <RotateCcw size={13} />
          Clear All Past Mental State
        </button>
      </div>

      {/* Edit Modal */}
      {editingDay !== null && (
        <div className="modal-overlay" onClick={() => setEditingDay(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-title" style={{ fontSize: '0.95rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Log Mental State</span>
              <button
                type="button"
                onClick={() => setEditingDay(null)}
                style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: '1rem', padding: '2px 6px' }}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <div style={{ fontSize: '0.8rem', color: '#818CF8', fontWeight: 600, marginBottom: '14px' }}>
              📅 {formattedSelectedDate}
            </div>

            <div className="mental-input-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="mental-input-label" style={{ margin: 0 }}>Mood</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#818CF8' }}>{editMood} / 10</span>
              </div>
              <div className="mental-scale">
                {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                  <button
                    key={`mood-${n}`}
                    type="button"
                    className={`mental-scale-btn ${editMood === n ? 'selected' : ''}`}
                    onClick={() => setEditMood(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="mental-input-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="mental-input-label" style={{ margin: 0 }}>Motivation</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#34D399' }}>{editMotivation} / 10</span>
              </div>
              <div className="mental-scale">
                {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                  <button
                    key={`mot-${n}`}
                    type="button"
                    className={`mental-scale-btn ${editMotivation === n ? 'selected' : ''}`}
                    onClick={() => setEditMotivation(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="modal-actions" style={{
              marginTop: '22px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <button
                type="button"
                className="btn-danger"
                style={{
                  background: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
                onClick={() => setShowDeleteConfirmModal(true)}
              >
                Delete Entry
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setEditingDay(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleSaveMentalState}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Entry Confirmation Modal */}
      {showDeleteConfirmModal && (
        <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={() => !isDeletingEntry && setShowDeleteConfirmModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '380px' }}>
            <div className="modal-title" style={{ fontSize: '0.95rem', color: '#ef4444', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Delete Mental State</span>
              <button
                type="button"
                onClick={() => !isDeletingEntry && setShowDeleteConfirmModal(false)}
                style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: '1rem', padding: '2px 6px' }}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>
              Are you sure you want to delete the Mood and Motivation entry for <strong>{formattedSelectedDate}</strong>?
            </p>

            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '18px', lineHeight: 1.4 }}>
              This will permanently delete this day's document from Firestore and remove it from the table and chart. Habit completion data will not be affected.
            </p>

            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                className="btn-secondary"
                disabled={isDeletingEntry}
                onClick={() => setShowDeleteConfirmModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                disabled={isDeletingEntry}
                style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}
                onClick={handleDeleteEntry}
              >
                {isDeletingEntry ? 'Deleting...' : 'Yes, Delete Entry'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Past Mental State Confirmation Modal */}
      {showClearPastModal && (
        <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={() => !isClearingPast && setShowClearPastModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-title" style={{ fontSize: '0.95rem', color: '#ef4444', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Clear All Past Mental State</span>
              <button
                type="button"
                onClick={() => !isClearingPast && setShowClearPastModal(false)}
                style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: '1rem', padding: '2px 6px' }}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>
              Are you sure you want to remove all Mental State entries recorded <strong>before today</strong> ({format(new Date(), 'MMMM d, yyyy')})?
            </p>

            <div style={{ background: 'var(--bg-card-light)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', marginBottom: '18px', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              ℹ️ <strong>What happens:</strong>
              <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                <li>All Mood &amp; Motivation documents before today will be permanently deleted from Firestore.</li>
                <li>Today's entry and future dates will remain available for new entries.</li>
                <li>Habit tracking &amp; completion data will <strong>not</strong> be touched.</li>
              </ul>
            </div>

            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                className="btn-secondary"
                disabled={isClearingPast}
                onClick={() => setShowClearPastModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                disabled={isClearingPast}
                style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}
                onClick={handleClearPastMentalStates}
              >
                {isClearingPast ? 'Clearing...' : 'Clear All Past Entries'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
