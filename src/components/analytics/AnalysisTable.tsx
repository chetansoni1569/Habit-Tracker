import { useMemo } from 'react';
import { useHabits } from '../../contexts/HabitContext';
import { calculateHabitAnalysis } from '../../utils/analytics';

export default function AnalysisTable() {
  const { habits, completions, selectedYear, selectedMonth } = useHabits();

  const analysis = useMemo(() => {
    return calculateHabitAnalysis(habits, completions, selectedYear, selectedMonth);
  }, [habits, completions, selectedYear, selectedMonth]);

  if (analysis.length === 0) {
    return (
      <div className="analysis-panel">
        <div className="analysis-title">Analysis</div>
        <div className="empty-state" style={{ padding: '20px' }}>
          <div className="empty-state-text" style={{ fontSize: '0.68rem' }}>
            Add habits to see analysis
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="analysis-panel">
      <div className="analysis-title">Analysis</div>
      <table className="analysis-table" aria-label="Habit analysis">
        <thead>
          <tr>
            <th>Goal</th>
            <th>Actual</th>
            <th>Left</th>
            <th>Progress</th>
            <th>%</th>
          </tr>
        </thead>
        <tbody>
          {analysis.map(item => (
            <tr key={item.habitId} title={`${item.habitName} ${item.emoji}`}>
              <td>{item.goal}</td>
              <td>{item.actual}</td>
              <td>{item.left}</td>
              <td className="analysis-progress-cell">
                <div className="analysis-progress-bar" aria-label={`${item.habitName}: ${item.percentage}% complete`}>
                  <div
                    className="analysis-progress-fill"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </td>
              <td>{item.percentage}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
