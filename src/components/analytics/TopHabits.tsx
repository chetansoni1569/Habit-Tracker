import { useMemo } from 'react';
import { useHabits } from '../../contexts/HabitContext';
import { getTopHabits } from '../../utils/analytics';

export default function TopHabits() {
  const { activeHabits, completions, selectedYear, selectedMonth } = useHabits();

  const topHabits = useMemo(() => {
    return getTopHabits(activeHabits, completions, selectedYear, selectedMonth, 10);
  }, [activeHabits, completions, selectedYear, selectedMonth]);

  if (topHabits.length === 0) {
    return (
      <div className="top-habits-card">
        <div className="top-habits-title">Top 10 Daily Habit</div>
        <div className="empty-state" style={{ padding: '10px' }}>
          <div className="empty-state-text" style={{ fontSize: '0.72rem' }}>
            No habits to rank yet
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="top-habits-card">
      <div className="top-habits-title">Top 10 Daily Habit</div>
      {topHabits.map(habit => (
        <div key={habit.rank} className="top-habit-item">
          <span className="top-habit-rank">{habit.rank}</span>
          <span className="top-habit-name">{habit.name}</span>
          <span className="top-habit-emoji">{habit.emoji}</span>
        </div>
      ))}
    </div>
  );
}
