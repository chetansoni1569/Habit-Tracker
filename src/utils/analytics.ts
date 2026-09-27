import type {
  Habit,
  MentalState,
  HabitAnalysis,
  MonthStats,
  LifetimeStats,
  MonthlyConsistency,
  HabitHistoryStats,
} from '../types';
import { getDaysInMonth } from 'date-fns';
import { MONTHS } from './calendar';

// ======================== DASHBOARD ANALYTICS ========================

export function calculateDailyProgress(
  habits: Habit[],
  completions: Record<string, Record<string, boolean>>,
  year: number,
  month: number
): { day: number; percentage: number }[] {
  const activeHabits = habits.filter((h) => h.active !== false);
  const daysInMonth = getDaysInMonth(new Date(year, month));
  const applicable = activeHabits.length;

  if (applicable === 0) return [];

  const result: { day: number; percentage: number }[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    let completed = 0;
    activeHabits.forEach((habit) => {
      if (completions[dateKey]?.[habit.id]) {
        completed++;
      }
    });
    result.push({
      day: d,
      percentage: applicable > 0 ? Math.round((completed / applicable) * 100) : 0,
    });
  }

  return result;
}

export function calculateWeeklyProgress(
  habits: Habit[],
  completions: Record<string, Record<string, boolean>>,
  year: number,
  month: number
): { week: number; percentage: number }[] {
  const daysInMonth = getDaysInMonth(new Date(year, month));
  const totalHabits = habits.length;

  if (totalHabits === 0) return [];

  // Group days into weeks (Saturday-based)
  const weeks: number[][] = [];
  let currentWeek: number[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const dayOfWeek = date.getDay(); // 0=Sun, 6=Sat
    const adjustedDay = (dayOfWeek + 1) % 7; // Sat=0

    if (adjustedDay === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(d);
  }
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  return weeks.map((weekDays, index) => {
    let completed = 0;
    const possible = weekDays.length * totalHabits;

    weekDays.forEach((d) => {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      habits.forEach((habit) => {
        if (completions[dateKey]?.[habit.id]) {
          completed++;
        }
      });
    });

    return {
      week: index + 1,
      percentage: possible > 0 ? Math.round((completed / possible) * 100) : 0,
    };
  });
}

export function calculateMonthStats(
  habits: Habit[],
  completions: Record<string, Record<string, boolean>>,
  year: number,
  month: number
): MonthStats {
  const daysInMonth = getDaysInMonth(new Date(year, month));
  const totalHabits = habits.length;
  const goal = totalHabits * daysInMonth;

  let completed = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    habits.forEach((habit) => {
      if (completions[dateKey]?.[habit.id]) {
        completed++;
      }
    });
  }

  const left = Math.max(0, goal - completed);
  const percentage = goal > 0 ? Math.round((completed / goal) * 1000) / 10 : 0;

  return { goal, completed, left, percentage };
}

export function calculateHabitAnalysis(
  habits: Habit[],
  completions: Record<string, Record<string, boolean>>,
  year: number,
  month: number
): HabitAnalysis[] {
  const daysInMonth = getDaysInMonth(new Date(year, month));

  return habits.map((habit) => {
    let actual = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      if (completions[dateKey]?.[habit.id]) {
        actual++;
      }
    }

    const goal = daysInMonth;
    const left = Math.max(0, goal - actual);
    const percentage = goal > 0 ? Math.round((actual / goal) * 100) : 0;

    return {
      habitId: habit.id,
      habitName: habit.name,
      emoji: habit.emoji,
      goal,
      actual,
      left,
      percentage,
    };
  });
}

export function getTopHabits(
  habits: Habit[],
  completions: Record<string, Record<string, boolean>>,
  year: number,
  month: number,
  limit = 10
): { rank: number; name: string; emoji: string; percentage: number }[] {
  const analysis = calculateHabitAnalysis(habits, completions, year, month);

  return analysis
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, limit)
    .map((item, index) => ({
      rank: index + 1,
      name: item.habitName,
      emoji: item.emoji,
      percentage: item.percentage,
    }));
}

export function getMentalStateForMonth(
  mentalStates: Record<string, MentalState>,
  year: number,
  month: number
): { day: number; mood: number | null; motivation: number | null }[] {
  const daysInMonth = getDaysInMonth(new Date(year, month));
  const result: { day: number; mood: number | null; motivation: number | null }[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const state = mentalStates[dateKey];
    result.push({
      day: d,
      mood: state?.mood ?? null,
      motivation: state?.motivation ?? null,
    });
  }

  return result;
}

// ======================== LIFETIME ANALYTICS ========================

// Extract all unique years present in completions
export function getAvailableYears(completions: Record<string, Record<string, boolean>>): number[] {
  const yearsSet = new Set<number>();
  yearsSet.add(new Date().getFullYear());

  Object.keys(completions).forEach((dateStr) => {
    const [yearStr] = dateStr.split('-');
    const y = parseInt(yearStr, 10);
    if (!isNaN(y)) {
      yearsSet.add(y);
    }
  });

  return Array.from(yearsSet).sort((a, b) => b - a);
}

// Calculate lifetime statistics across all recorded dates and habits
export function calculateLifetimeStats(
  allHabits: Habit[],
  allCompletions: Record<string, Record<string, boolean>>
): LifetimeStats {
  const dates = Object.keys(allCompletions).sort();
  let totalHabitCompletions = 0;
  const daysWithCompletions = new Set<string>();

  const habitCompletionCounts: Record<string, number> = {};
  const monthCompletions: Record<string, { completed: number; goal: number }> = {};

  dates.forEach((dateStr) => {
    const habitMap = allCompletions[dateStr] || {};
    let hasAny = false;

    Object.entries(habitMap).forEach(([hId, isDone]) => {
      if (isDone) {
        hasAny = true;
        totalHabitCompletions++;
        habitCompletionCounts[hId] = (habitCompletionCounts[hId] || 0) + 1;

        const monthKey = dateStr.substring(0, 7); // YYYY-MM
        if (!monthCompletions[monthKey]) {
          monthCompletions[monthKey] = { completed: 0, goal: 0 };
        }
        monthCompletions[monthKey].completed++;
      }
    });

    if (hasAny) {
      daysWithCompletions.add(dateStr);
    }
  });

  // Calculate tracking duration
  let trackingDurationDays = 0;
  if (dates.length > 0) {
    const earliest = new Date(dates[0]);
    const latest = new Date();
    const diffTime = Math.abs(latest.getTime() - earliest.getTime());
    trackingDurationDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  // Calculate best month
  let bestMonth: LifetimeStats['bestMonth'] = null;
  let highestMonthRate = -1;

  Object.entries(monthCompletions).forEach(([mKey, data]) => {
    const [yStr, mStr] = mKey.split('-');
    const y = parseInt(yStr, 10);
    const m = parseInt(mStr, 10) - 1;
    const days = getDaysInMonth(new Date(y, m));
    const goal = Math.max(1, allHabits.length * days);
    const rate = Math.round((data.completed / goal) * 100);

    if (rate > highestMonthRate) {
      highestMonthRate = rate;
      bestMonth = {
        year: y,
        monthName: MONTHS[m] || mKey,
        percentage: rate,
      };
    }
  });

  // Calculate best habit
  let bestHabit: LifetimeStats['bestHabit'] = null;
  let maxCompletions = -1;

  allHabits.forEach((habit) => {
    const count = habitCompletionCounts[habit.id] || 0;
    if (count > maxCompletions) {
      maxCompletions = count;
      const totalPossibleDays = Math.max(1, daysWithCompletions.size);
      const consistency = Math.round((count / totalPossibleDays) * 100);
      bestHabit = {
        habitName: habit.name,
        emoji: habit.emoji,
        completions: count,
        percentage: Math.min(100, consistency),
      };
    }
  });

  // Total possible across all tracked days
  const totalPossible = daysWithCompletions.size * Math.max(1, allHabits.length);
  const averageConsistency = totalPossible > 0 ? Math.round((totalHabitCompletions / totalPossible) * 100) : 0;

  return {
    totalDaysTracked: daysWithCompletions.size,
    totalHabitCompletions,
    averageConsistency: Math.min(100, averageConsistency),
    totalActiveHabits: allHabits.filter((h) => h.active !== false).length,
    totalArchivedHabits: allHabits.filter((h) => h.active === false).length,
    trackingDurationDays,
    bestMonth,
    bestHabit,
  };
}

// Calculate consistency for every month in a selected year
export function calculateMonthlyConsistencyForYear(
  allHabits: Habit[],
  allCompletions: Record<string, Record<string, boolean>>,
  year: number
): MonthlyConsistency[] {
  const result: MonthlyConsistency[] = [];

  for (let m = 0; m < 12; m++) {
    const days = getDaysInMonth(new Date(year, m));
    const monthPrefix = `${year}-${String(m + 1).padStart(2, '0')}`;
    const totalHabits = Math.max(1, allHabits.length);
    const totalGoal = totalHabits * days;

    let completionsCount = 0;
    for (let d = 1; d <= days; d++) {
      const dateStr = `${monthPrefix}-${String(d).padStart(2, '0')}`;
      const dayMap = allCompletions[dateStr];
      if (dayMap) {
        allHabits.forEach((h) => {
          if (dayMap[h.id]) completionsCount++;
        });
      }
    }

    const percentage = totalGoal > 0 ? Math.round((completionsCount / totalGoal) * 100) : 0;

    result.push({
      year,
      month: m,
      monthName: MONTHS[m],
      monthKey: monthPrefix,
      totalCompletions: completionsCount,
      totalGoal,
      percentage,
    });
  }

  return result;
}

// Calculate individual habit history across all months and streaks
export function calculateHabitHistory(
  habitId: string,
  allHabits: Habit[],
  allCompletions: Record<string, Record<string, boolean>>
): HabitHistoryStats | null {
  const habit = allHabits.find((h) => h.id === habitId);
  if (!habit) return null;

  let totalCompletions = 0;
  const dates = Object.keys(allCompletions).sort();
  const completedDates: string[] = [];

  // Monthly breakdown map
  const monthMap: Record<string, { year: number; month: number; completions: number }> = {};

  dates.forEach((dateStr) => {
    if (allCompletions[dateStr]?.[habitId]) {
      totalCompletions++;
      completedDates.push(dateStr);

      const mKey = dateStr.substring(0, 7);
      if (!monthMap[mKey]) {
        const [yStr, mStr] = mKey.split('-');
        monthMap[mKey] = {
          year: parseInt(yStr, 10),
          month: parseInt(mStr, 10) - 1,
          completions: 0,
        };
      }
      monthMap[mKey].completions++;
    }
  });

  // Calculate streaks
  let currentStreak = 0;
  let longestStreak = 0;
  let runningStreak = 0;

  if (completedDates.length > 0) {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    // Compute longest streak
    for (let i = 0; i < completedDates.length; i++) {
      if (i === 0) {
        runningStreak = 1;
      } else {
        const prev = new Date(completedDates[i - 1]);
        const curr = new Date(completedDates[i]);
        const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          runningStreak++;
        } else if (diffDays > 1) {
          runningStreak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, runningStreak);
    }

    // Check current streak
    const lastDate = completedDates[completedDates.length - 1];
    if (lastDate === todayStr || lastDate === yesterdayStr) {
      let streakCount = 1;
      for (let i = completedDates.length - 1; i > 0; i--) {
        const curr = new Date(completedDates[i]);
        const prev = new Date(completedDates[i - 1]);
        const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          streakCount++;
        } else {
          break;
        }
      }
      currentStreak = streakCount;
    }
  }

  const monthlyBreakdown = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mKey, data]) => {
      const days = getDaysInMonth(new Date(data.year, data.month));
      const percentage = days > 0 ? Math.round((data.completions / days) * 100) : 0;
      return {
        year: data.year,
        month: data.month,
        monthName: MONTHS[data.month] || mKey,
        monthKey: mKey,
        completions: data.completions,
        goal: days,
        percentage,
      };
    });

  return {
    habitId: habit.id,
    habitName: habit.name,
    emoji: habit.emoji,
    active: habit.active !== false,
    archivedAt: habit.archivedAt || null,
    totalCompletions,
    currentStreak,
    longestStreak,
    monthlyBreakdown,
  };
}

// ======================== EXPORT ========================

export function exportToCsv(
  habits: Habit[],
  completions: Record<string, Record<string, boolean>>,
  mentalStates: Record<string, MentalState>,
  year: number,
  month: number
): string {
  const daysInMonth = getDaysInMonth(new Date(year, month));
  const rows: string[] = ['Date,HabitId,HabitName,Emoji,Completed,Mood,Motivation'];

  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const ms = mentalStates[dateKey];

    habits.forEach((habit) => {
      const isCompleted = completions[dateKey]?.[habit.id] ? 'Yes' : 'No';
      rows.push(
        `${dateKey},"${habit.id}","${habit.name}","${habit.emoji}",${isCompleted},${ms?.mood ?? ''},${ms?.motivation ?? ''}`
      );
    });
  }

  return rows.join('\n');
}

export function exportFullHistoryCsv(
  habits: Habit[],
  completions: Record<string, Record<string, boolean>>,
  mentalStates: Record<string, MentalState>
): string {
  const dates = Array.from(
    new Set([...Object.keys(completions), ...Object.keys(mentalStates)])
  ).sort();

  const rows: string[] = ['Date,HabitId,HabitName,Emoji,Frequency,Active,Completed,Mood,Motivation'];

  dates.forEach((dateStr) => {
    const dayCompletions = completions[dateStr] || {};
    const ms = mentalStates[dateStr];

    habits.forEach((habit) => {
      const isCompleted = dayCompletions[habit.id] ? 'Yes' : 'No';
      rows.push(
        `${dateStr},"${habit.id}","${habit.name}","${habit.emoji}",${habit.frequency},${habit.active},${isCompleted},${ms?.mood ?? ''},${ms?.motivation ?? ''}`
      );
    });
  });

  return rows.join('\n');
}
