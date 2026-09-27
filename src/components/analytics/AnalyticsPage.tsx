import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useHabits } from '../../contexts/HabitContext';
import { getAllHabits, getAllCompletions, getAllMentalStates } from '../../services/firestore';
import {
  calculateLifetimeStats,
  calculateMonthlyConsistencyForYear,
  calculateHabitHistory,
  getAvailableYears,
  exportFullHistoryCsv,
} from '../../utils/analytics';
import type { Habit } from '../../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Calendar,
  CheckCircle2,
  TrendingUp,
  Award,
  Flame,
  Archive,
  Download,
  Clock,
  Layers,
} from 'lucide-react';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const { allHabits: contextHabits } = useHabits();

  const [loading, setLoading] = useState(true);
  const [lifetimeHabits, setLifetimeHabits] = useState<Habit[]>([]);
  const [allCompletions, setAllCompletions] = useState<Record<string, Record<string, boolean>>>({});
  const [allMentalStates, setAllMentalStates] = useState<Record<string, any>>({});
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedHabitId, setSelectedHabitId] = useState<string>('');

  // Fetch full lifetime data across all months and years
  useEffect(() => {
    async function loadData() {
      if (!user) return;
      setLoading(true);
      try {
        const [habitsData, completionsData, mentalData] = await Promise.all([
          getAllHabits(user.uid),
          getAllCompletions(user.uid),
          getAllMentalStates(user.uid),
        ]);
        setLifetimeHabits(habitsData.length > 0 ? habitsData : contextHabits);
        setAllCompletions(completionsData);
        setAllMentalStates(mentalData);

        if (habitsData.length > 0 && !selectedHabitId) {
          setSelectedHabitId(habitsData[0].id);
        }
      } catch (err) {
        console.error('Error fetching lifetime data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user, contextHabits]);

  // Available years from real completion records
  const availableYears = useMemo(() => {
    return getAvailableYears(allCompletions);
  }, [allCompletions]);

  // Lifetime summary stats
  const lifetimeStats = useMemo(() => {
    return calculateLifetimeStats(lifetimeHabits, allCompletions);
  }, [lifetimeHabits, allCompletions]);

  // Monthly consistency for selected year
  const monthlyConsistency = useMemo(() => {
    return calculateMonthlyConsistencyForYear(lifetimeHabits, allCompletions, selectedYear);
  }, [lifetimeHabits, allCompletions, selectedYear]);

  // Individual habit history
  const habitHistory = useMemo(() => {
    if (!selectedHabitId) return null;
    return calculateHabitHistory(selectedHabitId, lifetimeHabits, allCompletions);
  }, [selectedHabitId, lifetimeHabits, allCompletions]);

  // Export full history CSV
  const handleExportFullCsv = () => {
    const csv = exportFullHistoryCsv(lifetimeHabits, allCompletions, allMentalStates);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `habit-tracker-full-history-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export full history JSON backup
  const handleExportJson = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      user: { uid: user?.uid, email: user?.email },
      habits: lifetimeHabits,
      completions: allCompletions,
      mentalStates: allMentalStates,
      lifetimeStats,
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `habit-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '60vh' }}>
        <div className="spinner"></div>
        Calculating lifetime analytics...
      </div>
    );
  }

  return (
    <div className="dashboard-content" style={{ maxWidth: '1440px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-primary)' }}>
            Lifetime Analytics & History
          </h1>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
            Long-term consistency, multi-year progress, and permanent habit archives.
          </p>
        </div>

        {/* Backup / Export Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleExportFullCsv}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '8px 14px' }}
            title="Download full history CSV"
          >
            <Download size={14} />
            Export CSV
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleExportJson}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '8px 14px' }}
            title="Download complete JSON database backup"
          >
            <Download size={14} />
            Export JSON Backup
          </button>
        </div>
      </div>

      {/* 8 Lifetime Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px',
        marginBottom: '24px'
      }}>
        {/* Total Days Tracked */}
        <div className="stat-item" style={{ padding: '14px 12px', textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: 'var(--accent-light)' }}>
            <Calendar size={15} />
            <span className="stat-label" style={{ marginBottom: 0 }}>Days Tracked</span>
          </div>
          <div className="stat-value">{lifetimeStats.totalDaysTracked}</div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>active tracking days</div>
        </div>

        {/* Total Completions */}
        <div className="stat-item" style={{ padding: '14px 12px', textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: '#10B981' }}>
            <CheckCircle2 size={15} />
            <span className="stat-label" style={{ marginBottom: 0 }}>Total Completions</span>
          </div>
          <div className="stat-value">{lifetimeStats.totalHabitCompletions}</div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>lifetime checkmarks</div>
        </div>

        {/* Average Consistency */}
        <div className="stat-item" style={{ padding: '14px 12px', textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: '#6366F1' }}>
            <TrendingUp size={15} />
            <span className="stat-label" style={{ marginBottom: 0 }}>Average Consistency</span>
          </div>
          <div className="stat-value">{lifetimeStats.averageConsistency}%</div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>across all habits</div>
        </div>

        {/* Active Habits */}
        <div className="stat-item" style={{ padding: '14px 12px', textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: '#38BDF8' }}>
            <Layers size={15} />
            <span className="stat-label" style={{ marginBottom: 0 }}>Active Habits</span>
          </div>
          <div className="stat-value">{lifetimeStats.totalActiveHabits}</div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>in active tracking</div>
        </div>

        {/* Archived Habits */}
        <div className="stat-item" style={{ padding: '14px 12px', textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: '#A855F7' }}>
            <Archive size={15} />
            <span className="stat-label" style={{ marginBottom: 0 }}>Archived Habits</span>
          </div>
          <div className="stat-value">{lifetimeStats.totalArchivedHabits}</div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>history preserved</div>
        </div>

        {/* Tracking Duration */}
        <div className="stat-item" style={{ padding: '14px 12px', textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: '#F59E0B' }}>
            <Clock size={15} />
            <span className="stat-label" style={{ marginBottom: 0 }}>Duration</span>
          </div>
          <div className="stat-value">{lifetimeStats.trackingDurationDays} <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>days</span></div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>total lifespan</div>
        </div>

        {/* Best Month */}
        <div className="stat-item" style={{ padding: '14px 12px', textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: '#EC4899' }}>
            <Award size={15} />
            <span className="stat-label" style={{ marginBottom: 0 }}>Best Month</span>
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {lifetimeStats.bestMonth ? `${lifetimeStats.bestMonth.monthName} '${String(lifetimeStats.bestMonth.year).slice(-2)}` : '—'}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#86efac', fontWeight: 600, marginTop: '2px' }}>
            {lifetimeStats.bestMonth ? `${lifetimeStats.bestMonth.percentage}% consistency` : 'No data yet'}
          </div>
        </div>

        {/* Best Performing Habit */}
        <div className="stat-item" style={{ padding: '14px 12px', textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: '#F97316' }}>
            <Flame size={15} />
            <span className="stat-label" style={{ marginBottom: 0 }}>Top Habit</span>
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {lifetimeStats.bestHabit ? `${lifetimeStats.bestHabit.emoji} ${lifetimeStats.bestHabit.habitName}` : '—'}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            {lifetimeStats.bestHabit ? `${lifetimeStats.bestHabit.completions} completions` : 'No data yet'}
          </div>
        </div>
      </div>

      {/* Main Analytics Content: Monthly History + Individual Habit Inspector */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {/* Section 1: Monthly Consistency Chart & Breakdown */}
        <div className="habit-table-container" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-primary)' }}>
                Monthly Consistency
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                12-month consistency across all habits for {selectedYear}
              </div>
            </div>

            {/* Year selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="cal-setting-label">Year</span>
              <select
                className="cal-setting-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Bar Chart for the year */}
          <div style={{ height: '220px', marginBottom: '18px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyConsistency} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2D323F" vertical={false} />
                <XAxis
                  dataKey="monthName"
                  tick={{ fontSize: 9, fill: '#9CA3AF' }}
                  tickFormatter={(val) => val.slice(0, 3)}
                  axisLine={{ stroke: '#383D48' }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  tick={{ fontSize: 9, fill: '#9CA3AF' }}
                  tickFormatter={(val) => `${val}%`}
                  axisLine={{ stroke: '#383D48' }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: '#1E2025',
                    border: '1px solid #383D48',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    color: '#F3F4F6',
                  }}
                  formatter={(val: any) => [`${val}%`, 'Consistency']}
                  labelFormatter={(name) => `${name} ${selectedYear}`}
                />
                <Bar
                  dataKey="percentage"
                  fill="#6366F1"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Breakdown Table */}
          <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
            <table className="analysis-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Month</th>
                  <th>Completions</th>
                  <th>Goal</th>
                  <th>Consistency</th>
                </tr>
              </thead>
              <tbody>
                {monthlyConsistency.map((m) => (
                  <tr key={m.month}>
                    <td style={{ textAlign: 'left', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {m.monthName}
                    </td>
                    <td>{m.totalCompletions}</td>
                    <td>{m.totalGoal}</td>
                    <td>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: m.percentage >= 80 ? 'rgba(34, 197, 94, 0.15)' : m.percentage >= 50 ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                        color: m.percentage >= 80 ? '#86efac' : m.percentage >= 50 ? '#a5b4fc' : 'var(--text-muted)'
                      }}>
                        {m.percentage}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: Habit History Inspector */}
        <div className="habit-table-container" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-primary)' }}>
                Habit History
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Inspect lifetime progress for any active or archived habit
              </div>
            </div>

            {/* Habit Selector Dropdown */}
            <select
              className="cal-setting-select"
              value={selectedHabitId}
              onChange={(e) => setSelectedHabitId(e.target.value)}
              style={{ maxWidth: '180px' }}
            >
              {lifetimeHabits.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.emoji} {h.name} {h.active === false ? '(Archived)' : ''}
                </option>
              ))}
            </select>
          </div>

          {habitHistory ? (
            <div>
              {/* Habit Header with Streaks */}
              <div style={{
                background: 'var(--bg-card-light)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '14px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.4rem' }}>{habitHistory.emoji}</span>
                    <div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {habitHistory.habitName}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {habitHistory.active ? (
                          <span style={{ color: '#86efac', fontWeight: 600 }}>Active</span>
                        ) : (
                          <span style={{ color: '#fca5a5', fontWeight: 600 }}>
                            Archived {habitHistory.archivedAt ? `on ${new Date(habitHistory.archivedAt).toLocaleDateString()}` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-light)' }}>
                      {habitHistory.totalCompletions}
                    </div>
                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Total Checks
                    </div>
                  </div>
                </div>

                {/* Streak counters */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#F97316' }}>
                      <Flame size={15} />
                      <span style={{ fontSize: '1.15rem', fontWeight: 800 }}>{habitHistory.currentStreak}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>days</span>
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Current Streak</div>
                  </div>
                  <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#EAB308' }}>
                      <Award size={15} />
                      <span style={{ fontSize: '1.15rem', fontWeight: 800 }}>{habitHistory.longestStreak}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>days</span>
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Best Streak</div>
                  </div>
                </div>
              </div>

              {/* Monthly Breakdown list for this habit */}
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Recorded Months Breakdown
                </div>
                {habitHistory.monthlyBreakdown.length === 0 ? (
                  <div className="empty-state" style={{ padding: '24px' }}>
                    <div className="empty-state-text">No completions recorded for this habit yet.</div>
                  </div>
                ) : (
                  <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                    <table className="analysis-table" style={{ width: '100%' }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left' }}>Period</th>
                          <th>Completed</th>
                          <th>Progress</th>
                          <th>Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {habitHistory.monthlyBreakdown.map((mb) => (
                          <tr key={mb.monthKey}>
                            <td style={{ textAlign: 'left', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {mb.monthName} {mb.year}
                            </td>
                            <td>{mb.completions} / {mb.goal}</td>
                            <td className="analysis-progress-cell">
                              <div className="analysis-progress-bar">
                                <div className="analysis-progress-fill" style={{ width: `${mb.percentage}%` }} />
                              </div>
                            </td>
                            <td style={{ fontWeight: 700, color: mb.percentage >= 80 ? '#86efac' : 'var(--text-primary)' }}>
                              {mb.percentage}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '30px' }}>
              <div className="empty-state-text">Select a habit above to view its lifetime breakdown.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
