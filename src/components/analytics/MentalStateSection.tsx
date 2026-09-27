import { useMemo, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useHabits } from '../../contexts/HabitContext';
import { getMentalStateForMonth } from '../../utils/analytics';
import { isFutureDate } from '../../utils/calendar';

export default function MentalStateSection() {
  const { mentalStates, selectedYear, selectedMonth, updateMentalState } = useHabits();
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [editMood, setEditMood] = useState(5);
  const [editMotivation, setEditMotivation] = useState(5);

  const monthData = useMemo(() => {
    return getMentalStateForMonth(mentalStates, selectedYear, selectedMonth);
  }, [mentalStates, selectedYear, selectedMonth]);

  const chartData = useMemo(() => {
    return monthData
      .filter(d => d.mood !== null || d.motivation !== null)
      .map(d => ({
        day: d.day,
        Mood: d.mood,
        Motivation: d.motivation,
      }));
  }, [monthData]);

  const handleDayClick = (day: number) => {
    const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (isFutureDate(dateStr)) return;
    const existing = monthData.find(d => d.day === day);
    setEditMood(existing?.mood ?? 5);
    setEditMotivation(existing?.motivation ?? 5);
    setEditingDay(day);
  };

  const handleSaveMentalState = async () => {
    if (editingDay === null) return;
    const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(editingDay).padStart(2, '0')}`;
    await updateMentalState(dateStr, editMood, editMotivation);
    setEditingDay(null);
  };

  return (
    <div className="mental-state-container">
      <div className="mental-state-title">Mental state</div>

      {/* Mood row */}
      <div className="mental-state-table">
        <div className="mental-state-grid">
          <div className="mental-label">Mood</div>
          <div className="mental-values">
            {monthData.map(d => {
              const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
              const isFuture = isFutureDate(dateStr);
              return (
                <div
                  key={`mood-${d.day}`}
                  className={`mental-value-cell ${d.mood !== null ? 'has-value' : ''}`}
                  onClick={() => !isFuture && handleDayClick(d.day)}
                  title={`Day ${d.day}: ${d.mood !== null ? `Mood: ${d.mood}` : 'Click to set'}`}
                  style={isFuture ? { opacity: 0.25, cursor: 'default', pointerEvents: 'none' } : {}}
                  role="button"
                  aria-label={`Set mood for day ${d.day}`}
                  tabIndex={isFuture ? -1 : 0}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !isFuture) handleDayClick(d.day); }}
                >
                  {d.mood ?? ''}
                </div>
              );
            })}
          </div>
        </div>

        {/* Motivation row */}
        <div className="mental-state-grid">
          <div className="mental-label">Motivation</div>
          <div className="mental-values">
            {monthData.map(d => {
              const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
              const isFuture = isFutureDate(dateStr);
              return (
                <div
                  key={`mot-${d.day}`}
                  className={`mental-value-cell ${d.motivation !== null ? 'has-value' : ''}`}
                  onClick={() => !isFuture && handleDayClick(d.day)}
                  title={`Day ${d.day}: ${d.motivation !== null ? `Motivation: ${d.motivation}` : 'Click to set'}`}
                  style={isFuture ? { opacity: 0.25, cursor: 'default', pointerEvents: 'none' } : {}}
                  role="button"
                  aria-label={`Set motivation for day ${d.day}`}
                  tabIndex={isFuture ? -1 : 0}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !isFuture) handleDayClick(d.day); }}
                >
                  {d.motivation ?? ''}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Chart — area chart matching the screenshot's filled line chart */}
      {chartData.length > 1 && (
        <div className="mental-chart-container">
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={chartData} margin={{ top: 8, right: 12, left: -20, bottom: 2 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2D323F" vertical={false} />
              <XAxis
                dataKey="day"
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
                labelFormatter={(label) => `Day ${label}`}
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
      )}

      {chartData.length <= 1 && (
        <div className="empty-state" style={{ padding: '16px' }}>
          <div className="empty-state-text" style={{ fontSize: '0.68rem' }}>
            Track your mood and motivation to understand your habits in context.
            <br />Click on a day above to get started.
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingDay !== null && (
        <div className="modal-overlay" onClick={() => setEditingDay(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '360px' }}>
            <div className="modal-title" style={{ fontSize: '0.9rem' }}>
              Day {editingDay} — Mental State
            </div>

            <div className="mental-input-group">
              <div className="mental-input-label">Mood (1-10)</div>
              <div className="mental-scale">
                {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                  <button
                    key={`mood-${n}`}
                    className={`mental-scale-btn ${editMood === n ? 'selected' : ''}`}
                    onClick={() => setEditMood(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="mental-input-group">
              <div className="mental-input-label">Motivation (1-10)</div>
              <div className="mental-scale">
                {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                  <button
                    key={`mot-${n}`}
                    className={`mental-scale-btn ${editMotivation === n ? 'selected' : ''}`}
                    onClick={() => setEditMotivation(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setEditingDay(null)}>Cancel</button>
              <button className="btn-primary" onClick={handleSaveMentalState}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
