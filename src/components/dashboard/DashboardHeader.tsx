import { useHabits } from '../../contexts/HabitContext';
import { getMonthName, generateYears, MONTHS } from '../../utils/calendar';

export default function DashboardHeader() {
  const { selectedYear, selectedMonth, setSelectedYear, setSelectedMonth } = useHabits();
  const years = generateYears();

  return (
    <div className="title-card-wrapper">
      <div className="title-card">
        <h1>Habit Tracker</h1>
        <div className="title-month">- {getMonthName(selectedMonth)} -</div>
      </div>

      <div className="calendar-settings">
        <div className="calendar-settings-title">Calender Settings</div>
        <div className="cal-setting-row">
          <span className="cal-setting-label">Year</span>
          <select
            className="cal-setting-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            aria-label="Select year"
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="cal-setting-row">
          <span className="cal-setting-label">Month</span>
          <select
            className="cal-setting-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            aria-label="Select month"
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i}>{m}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
