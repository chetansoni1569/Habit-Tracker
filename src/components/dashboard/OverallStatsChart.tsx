import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useHabits } from '../../contexts/HabitContext';
import { calculateMonthStats } from '../../utils/analytics';

export default function OverallStatsChart() {
  const { habits, completions, selectedYear, selectedMonth } = useHabits();

  const stats = useMemo(() => {
    return calculateMonthStats(habits, completions, selectedYear, selectedMonth);
  }, [habits, completions, selectedYear, selectedMonth]);

  const remaining = Math.round((100 - stats.percentage) * 10) / 10;

  const data = [
    { name: 'Completed', value: stats.completed || 0.001 },
    { name: 'Remaining', value: stats.left || 0.001 },
  ];

  const COLORS = ['#6366F1', '#282D37'];

  return (
    <div className="overall-stats-card">
      <div className="overall-stats-title">Overall Stats</div>
      <div className="donut-container">
        <ResponsiveContainer width={136} height={136}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={58}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              stroke="none"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div style={{
          position: 'absolute',
          textAlign: 'center',
          pointerEvents: 'none',
        }}>
          <div style={{
            fontSize: '1.05rem',
            color: '#F3F4F6',
            fontWeight: 800,
            letterSpacing: '-0.5px',
          }}>
            {stats.percentage}%
          </div>
          <div style={{
            fontSize: '0.62rem',
            color: '#9CA3AF',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}>
            Done
          </div>
        </div>
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '14px',
        marginTop: '6px',
        fontSize: '0.72rem',
        color: '#9CA3AF',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366F1', display: 'inline-block' }}></span>
          Done: {stats.percentage}%
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#282D37', display: 'inline-block', border: '1px solid #4B5563' }}></span>
          Left: {remaining}%
        </span>
      </div>
    </div>
  );
}
