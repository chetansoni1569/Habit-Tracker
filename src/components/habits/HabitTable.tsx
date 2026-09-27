import { useMemo, useState } from 'react';
import { Check, Settings2, Plus } from 'lucide-react';
import { useHabits } from '../../contexts/HabitContext';
import { getMonthCalendarData, isFutureDate } from '../../utils/calendar';
import HabitManager from '../habits/HabitManager';

export default function HabitTable() {
  const { activeHabits, completions, selectedYear, selectedMonth, toggleCompletion } = useHabits();
  const [showManager, setShowManager] = useState(false);
  const [managerMode, setManagerMode] = useState<'list' | 'create'>('list');

  const weeks = useMemo(() => {
    return getMonthCalendarData(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth]);

  const handleCheckboxClick = (habitId: string, dateStr: string) => {
    if (isFutureDate(dateStr)) return;
    toggleCompletion(habitId, dateStr);
  };

  if (activeHabits.length === 0 && !showManager) {
    return (
      <div className="habit-table-container">
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-title">No habits yet</div>
          <div className="empty-state-text">
            Create your first habit to start tracking your consistency.
          </div>
          <button
            className="btn-primary"
            onClick={() => {
              setManagerMode('create');
              setShowManager(true);
            }}
          >
            + Add Habit
          </button>
        </div>
      </div>
    );
  }

  // Build flat list of all days for the table header
  const allDays = weeks.flatMap(w => w.days);

  return (
    <>
      <div className="habit-table-container">
        <div className="habit-table-scroll">
          <table className="habit-table" role="grid" aria-label="Habit tracking calendar">
            <thead>
              {/* Week headers row */}
              <tr>
                <th className="my-habits-header" rowSpan={3}>
                  My Habits
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <button
                      className="manage-habits-btn"
                      onClick={() => {
                        setManagerMode('create');
                        setShowManager(true);
                      }}
                      aria-label="Add habit"
                      title="Add habit"
                    >
                      <Plus size={10} />
                      Add
                    </button>
                    <button
                      className="manage-habits-btn"
                      onClick={() => {
                        setManagerMode('list');
                        setShowManager(true);
                      }}
                      aria-label="Manage habits"
                      title="Manage habits"
                    >
                      <Settings2 size={10} />
                      Edit
                    </button>
                  </div>
                </th>
                {weeks.map(week => (
                  <th
                    key={`week-${week.weekNumber}`}
                    colSpan={week.days.length}
                    className="week-header"
                  >
                    {week.weekNumber <= 5 ? `Week ${week.weekNumber}` : `week ${week.weekNumber}`}
                  </th>
                ))}
              </tr>
              {/* Day names row */}
              <tr>
                {allDays.map((day, i) => (
                  <th key={`dn-${i}`} className={`day-name ${day.isToday ? 'today-col' : ''}`}>
                    {day.dayName}
                  </th>
                ))}
              </tr>
              {/* Day numbers row */}
              <tr>
                {allDays.map((day, i) => (
                  <th key={`dd-${i}`} className={`day-number ${day.isToday ? 'today-col' : ''}`}>
                    {day.date}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeHabits.map(habit => (
                <tr key={habit.id}>
                  <td className="habit-name-cell">
                    <span className="habit-name-text">
                      <span className="habit-label">{habit.name}</span>
                      <span className="habit-emoji">{habit.emoji}</span>
                    </span>
                  </td>
                  {allDays.map((day, i) => {
                    const isCompleted = Boolean(completions[day.fullDate]?.[habit.id]);
                    const isFuture = day.isFuture;

                    return (
                      <td
                        key={`${habit.id}-${i}`}
                        className={`day-cell ${day.isToday ? 'today-col' : ''} ${isFuture ? 'future-day' : ''}`}
                      >
                        <button
                          className={`day-checkbox ${isCompleted ? 'checked' : ''} ${isFuture ? 'future' : ''}`}
                          onClick={() => handleCheckboxClick(habit.id, day.fullDate)}
                          disabled={isFuture}
                          aria-label={`${habit.name} — ${day.fullDate}${isCompleted ? ' (completed)' : ''}`}
                          title={`${habit.name} — Day ${day.date}`}
                        >
                          {isCompleted && <Check size={14} strokeWidth={2.8} />}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showManager && (
        <HabitManager
          onClose={() => setShowManager(false)}
          initialMode={managerMode}
        />
      )}
    </>
  );
}
