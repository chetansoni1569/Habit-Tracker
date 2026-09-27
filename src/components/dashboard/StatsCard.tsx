import { useMemo } from 'react';
import { useHabits } from '../../contexts/HabitContext';
import { calculateMonthStats } from '../../utils/analytics';

export default function StatsCard() {
  const { habits, completions, selectedYear, selectedMonth } = useHabits();

  const stats = useMemo(() => {
    return calculateMonthStats(habits, completions, selectedYear, selectedMonth);
  }, [habits, completions, selectedYear, selectedMonth]);

  return (
    <div className="stats-card">
      <div className="stat-item">
        <div className="stat-label">Goal</div>
        <div className="stat-value">{stats.goal}</div>
      </div>
      <div className="stat-item">
        <div className="stat-label">Completed</div>
        <div className="stat-value">{stats.completed}</div>
      </div>
      <div className="stat-item">
        <div className="stat-label">Left</div>
        <div className="stat-value">{stats.left}</div>
      </div>
    </div>
  );
}
