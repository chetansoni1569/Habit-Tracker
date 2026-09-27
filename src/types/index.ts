// Auth User (compatible with Firebase User and Demo/Local User)
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous?: boolean;
}

// User Profile
export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  username: string;
  photoURL: string;
  createdAt: string;
  updatedAt: string;
}

// Habit
export interface Habit {
  id: string;
  name: string;
  emoji: string;
  frequency: 'daily' | 'weekdays' | 'weekends' | 'custom';
  active: boolean;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
  order: number;
}

// Habit Completion - keyed by date string YYYY-MM-DD
export interface HabitCompletion {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

// Mental State record for a day
export interface MentalState {
  date: string; // YYYY-MM-DD
  mood: number; // 1-10
  motivation: number; // 1-10
  updatedAt: string;
}

// Lifetime Analytics Types
export interface MonthlyConsistency {
  year: number;
  month: number;
  monthName: string;
  monthKey: string; // YYYY-MM
  totalCompletions: number;
  totalGoal: number;
  percentage: number;
}

export interface HabitHistoryStats {
  habitId: string;
  habitName: string;
  emoji: string;
  active: boolean;
  archivedAt: string | null;
  totalCompletions: number;
  currentStreak: number;
  longestStreak: number;
  monthlyBreakdown: {
    year: number;
    month: number;
    monthName: string;
    monthKey: string;
    completions: number;
    goal: number;
    percentage: number;
  }[];
}

export interface LifetimeStats {
  totalDaysTracked: number;
  totalHabitCompletions: number;
  averageConsistency: number;
  totalActiveHabits: number;
  totalArchivedHabits: number;
  trackingDurationDays: number;
  bestMonth: { monthName: string; year: number; percentage: number } | null;
  bestHabit: { habitName: string; emoji: string; completions: number; percentage: number } | null;
}

// Calendar related
export interface WeekData {
  weekNumber: number;
  days: DayData[];
}

export interface DayData {
  date: number;
  dayName: string;
  fullDate: string; // YYYY-MM-DD
  isToday: boolean;
  isFuture: boolean;
}

// Analysis row
export interface HabitAnalysis {
  habitId: string;
  habitName: string;
  emoji: string;
  goal: number;
  actual: number;
  left: number;
  percentage: number;
}

// Stats
export interface MonthStats {
  goal: number;
  completed: number;
  left: number;
  percentage: number;
}

// Auth form data
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}
