import { useHabits } from '../../contexts/HabitContext';
import DashboardHeader from './DashboardHeader';
import DailyProgressChart from './DailyProgressChart';
import WeeklyProgressChart from './WeeklyProgressChart';
import StatsCard from './StatsCard';
import OverallStatsChart from './OverallStatsChart';
import HabitTable from '../habits/HabitTable';
import AnalysisTable from '../analytics/AnalysisTable';
import MentalStateSection from '../analytics/MentalStateSection';
import TopHabits from '../analytics/TopHabits';

export default function DashboardPage() {
  const { loading } = useHabits();

  if (loading) {
    return (
      <div className="dashboard-content">
        <div className="loading-container">
          <div className="spinner"></div>
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-content">
      {/* Top Row: Title + Charts + Stats + Overall */}
      <div className="dashboard-top-row">
        <DashboardHeader />
        <div className="charts-row">
          <DailyProgressChart />
          <WeeklyProgressChart />
        </div>
        <StatsCard />
        <OverallStatsChart />
      </div>

      {/* Main Content: Left Column (Habits + Mental State) & Right Column (Analysis + Top Habits) */}
      <div className="main-grid">
        <div className="dashboard-left-col">
          <HabitTable />
          <MentalStateSection />
        </div>
        <div className="dashboard-right-col">
          <AnalysisTable />
          <TopHabits />
        </div>
      </div>
    </div>
  );
}
