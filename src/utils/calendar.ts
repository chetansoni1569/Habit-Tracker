import {
  getDaysInMonth,
  startOfMonth,
  getDay,
  format,
  isToday as isTodayFn,
  isAfter,
  startOfDay,
} from 'date-fns';
import type { WeekData, DayData } from '../types';

const DAY_NAMES = ['Sa', 'Su', 'Mo', 'Tu', 'We', 'Th', 'Fr'];

export function getMonthCalendarData(year: number, month: number): WeekData[] {
  const daysInMonth = getDaysInMonth(new Date(year, month));
  const firstDay = startOfMonth(new Date(year, month));
  // getDay returns 0 for Sunday, 1 for Monday, etc.
  // We want weeks starting Saturday (6), so adjust
  const firstDayOfWeek = getDay(firstDay); // 0=Sun, 1=Mon, ..., 6=Sat
  // Convert to our week system where Saturday=0
  const adjustedFirstDay = (firstDayOfWeek + 1) % 7; // Sat=0, Sun=1, Mon=2, ...

  const weeks: WeekData[] = [];
  let currentWeek: DayData[] = [];
  let weekNumber = 1;

  // Add empty cells for days before the first of the month
  for (let i = 0; i < adjustedFirstDay; i++) {
    // These are padding days from the previous month - we don't add them
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dayOfWeek = getDay(date);
    const adjustedDayOfWeek = (dayOfWeek + 1) % 7; // Sat=0

    // Start a new week on Saturday (adjustedDayOfWeek === 0) unless it's the first day
    if (adjustedDayOfWeek === 0 && currentWeek.length > 0) {
      weeks.push({ weekNumber, days: currentWeek });
      weekNumber++;
      currentWeek = [];
    }

    const today = new Date();
    currentWeek.push({
      date: day,
      dayName: DAY_NAMES[adjustedDayOfWeek],
      fullDate: format(date, 'yyyy-MM-dd'),
      isToday: isTodayFn(date),
      isFuture: isAfter(startOfDay(date), startOfDay(today)),
    });
  }

  // Push the last week
  if (currentWeek.length > 0) {
    weeks.push({ weekNumber, days: currentWeek });
  }

  return weeks;
}

export function getMonthName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return months[month];
}

export function getDaysArray(year: number, month: number): string[] {
  const daysInMonth = getDaysInMonth(new Date(year, month));
  const days: string[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(format(new Date(year, month, d), 'yyyy-MM-dd'));
  }
  return days;
}

export function formatDateKey(year: number, month: number, day: number): string {
  return format(new Date(year, month, day), 'yyyy-MM-dd');
}

export function isFutureDate(dateStr: string): boolean {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  return isAfter(startOfDay(date), startOfDay(today));
}

export function generateYears(): number[] {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear - 5; y <= currentYear + 5; y++) {
    years.push(y);
  }
  return years;
}

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
