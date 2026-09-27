import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useHabits } from '../../contexts/HabitContext';
import { calculateWeeklyProgress } from '../../utils/analytics';

export default function WeeklyProgressChart() {
  const { habits, completions, selectedYear, selectedMonth } = useHabits();

  const data = useMemo(() => {
    return calculateWeeklyProgress(habits, completions, selectedYear, selectedMonth)
      .map(w => ({ name: `week ${w.week}`, percentage: w.percentage }));
  }, [habits, completions, selectedYear, selectedMonth]);

  return (
    <div className="chart-section">
      <div className="chart-title">
        Weekly Progress
      </div>
      <ResponsiveContainer width="100%" height={150}>
        <BarChart data={data} margin={{ top: 6, right: 6, left: -20, bottom: 2 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2D323F" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 9, fill: '#9CA3AF' }}
            tickLine={false}
            axisLine={{ stroke: '#383D48' }}
          />
          <YAxis
            tick={{ fontSize: 9, fill: '#9CA3AF' }}
            tickLine={false}
            axisLine={{ stroke: '#383D48' }}
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            formatter={(value: any) => [`${value}%`, 'Progress']}
            contentStyle={{
              background: '#1E2025',
              border: '1px solid #383D48',
              borderRadius: '6px',
              fontSize: '0.8rem',
              color: '#F3F4F6',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
          />
          <Bar
            dataKey="percentage"
            fill="#6366F1"
            radius={[3, 3, 0, 0]}
            maxBarSize={32}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
