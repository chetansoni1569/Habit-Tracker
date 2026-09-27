import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { format } from 'date-fns';
import { useAuth } from './AuthContext';
import {
  getAllHabits,
  createHabit as createHabitService,
  updateHabit as updateHabitService,
  archiveHabit as archiveHabitService,
  unarchiveHabit as unarchiveHabitService,
  deleteHabit as deleteHabitService,
  toggleHabitCompletion,
  getCompletionsForMonth,
  getMentalStatesForMonth,
  setMentalState as setMentalStateService,
  deleteMentalState as deleteMentalStateService,
  clearPastMentalStates as clearPastMentalStatesService,
} from '../services/firestore';
import type { Habit, MentalState } from '../types';

interface HabitContextType {
  habits: Habit[]; // applicable for selected month (active + archived with history in this month)
  allHabits: Habit[]; // all habits
  activeHabits: Habit[];
  archivedHabits: Habit[];
  completions: Record<string, Record<string, boolean>>;
  mentalStates: Record<string, MentalState>;
  selectedYear: number;
  selectedMonth: number;
  loading: boolean;
  setSelectedYear: (year: number) => void;
  setSelectedMonth: (month: number) => void;
  loadMonthData: (year: number, month: number) => Promise<void>;
  toggleCompletion: (habitId: string, date: string) => Promise<void>;
  addHabit: (data: { name: string; emoji: string; frequency: string }) => Promise<Habit | undefined>;
  editHabit: (habitId: string, data: Partial<Pick<Habit, 'name' | 'emoji' | 'frequency' | 'active' | 'order' | 'archivedAt'>>) => Promise<void>;
  archiveHabit: (habitId: string) => Promise<void>;
  unarchiveHabit: (habitId: string) => Promise<void>;
  removeHabit: (habitId: string) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
  updateMentalState: (date: string, mood: number, motivation: number) => Promise<void>;
  deleteMentalState: (date: string) => Promise<void>;
  clearPastMentalStates: () => Promise<void>;
  refreshHabits: () => Promise<void>;
}

export const HabitContext = createContext<HabitContextType | undefined>(undefined);

export function HabitProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const now = new Date();
  const [allHabits, setAllHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<Record<string, Record<string, boolean>>>({});
  const [mentalStates, setMentalStates] = useState<Record<string, MentalState>>({});
  const [selectedYear, setSelectedYear] = useState(() => {
    const saved = localStorage.getItem('habit_tracker_last_year');
    return saved ? Number(saved) : now.getFullYear();
  });
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const saved = localStorage.getItem('habit_tracker_last_month');
    return saved !== null ? Number(saved) : now.getMonth();
  });
  const [loading, setLoading] = useState(true);

  // Load specific month's data from Firestore / database
  const loadMonthData = useCallback(async (year: number, month: number) => {
    if (!user) return;
    setLoading(true);
    try {
      const [allHabitsData, completionsData, mentalData] = await Promise.all([
        getAllHabits(user.uid),
        getCompletionsForMonth(user.uid, year, month),
        getMentalStatesForMonth(user.uid, year, month),
      ]);
      setAllHabits(allHabitsData);
      setCompletions(completionsData);
      setMentalStates(mentalData);
    } catch (error) {
      console.error('Error loading month data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load when user, year, or month changes
  useEffect(() => {
    if (user) {
      loadMonthData(selectedYear, selectedMonth);
      localStorage.setItem('habit_tracker_last_year', String(selectedYear));
      localStorage.setItem('habit_tracker_last_month', String(selectedMonth));
    } else {
      setAllHabits([]);
      setCompletions({});
      setMentalStates({});
      setLoading(false);
    }
  }, [user, selectedYear, selectedMonth, loadMonthData]);

  // Refresh all habits without full month reload
  const refreshHabits = async () => {
    if (!user) return;
    const habitsData = await getAllHabits(user.uid);
    setAllHabits(habitsData);
  };

  // Toggle habit completion on an exact date
  const toggleCompletion = async (habitId: string, date: string) => {
    if (!user) return;
    const current = !!completions[date]?.[habitId];

    // Optimistic UI update
    setCompletions((prev) => {
      const next = { ...prev };
      const dayCompletions = { ...(prev[date] || {}) };
      if (!current) {
        dayCompletions[habitId] = true;
        next[date] = dayCompletions;
      } else {
        delete dayCompletions[habitId];
        if (Object.keys(dayCompletions).length === 0) {
          delete next[date];
        } else {
          next[date] = dayCompletions;
        }
      }
      return next;
    });

    try {
      await toggleHabitCompletion(user.uid, habitId, date, current);
    } catch (error) {
      console.error('Error toggling completion in Firestore:', error);
      // Revert optimistic update on failure
      setCompletions((prev) => {
        const next = { ...prev };
        const dayCompletions = { ...(prev[date] || {}) };
        if (current) {
          dayCompletions[habitId] = true;
          next[date] = dayCompletions;
        } else {
          delete dayCompletions[habitId];
          if (Object.keys(dayCompletions).length === 0) {
            delete next[date];
          } else {
            next[date] = dayCompletions;
          }
        }
        return next;
      });
    }
  };

  // Add a new habit
  const addHabit = async (data: { name: string; emoji: string; frequency: string }): Promise<Habit | undefined> => {
    if (!user) return undefined;
    try {
      const created = await createHabitService(user.uid, data);
      await refreshHabits();
      return created;
    } catch (error) {
      console.error('Error adding habit:', error);
      throw error;
    }
  };

  // Edit existing habit
  const editHabit = async (
    habitId: string,
    data: Partial<Pick<Habit, 'name' | 'emoji' | 'frequency' | 'active' | 'order' | 'archivedAt'>>
  ) => {
    if (!user) return;
    try {
      await updateHabitService(user.uid, habitId, data);
      await refreshHabits();
    } catch (error) {
      console.error('Error updating habit:', error);
    }
  };

  // Archive habit (does NOT delete historical data)
  const archiveHabit = async (habitId: string) => {
    if (!user) return;
    try {
      await archiveHabitService(user.uid, habitId);
      await refreshHabits();
    } catch (error) {
      console.error('Error archiving habit:', error);
    }
  };

  // Unarchive habit
  const unarchiveHabit = async (habitId: string) => {
    if (!user) return;
    try {
      await unarchiveHabitService(user.uid, habitId);
      await refreshHabits();
    } catch (error) {
      console.error('Error unarchiving habit:', error);
    }
  };

  // Remove habit (archives by default to protect history)
  const removeHabit = async (habitId: string) => {
    await archiveHabit(habitId);
  };

  // Permanently delete habit from Firestore and all its completions
  const deleteHabit = async (habitId: string) => {
    if (!user) return;
    // Optimistically remove from allHabits
    setAllHabits((prev) => prev.filter((h) => h.id !== habitId));

    // Optimistically remove all completions for this habit
    setCompletions((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const date of Object.keys(next)) {
        if (next[date]?.[habitId] !== undefined) {
          const dayCompletions = { ...next[date] };
          delete dayCompletions[habitId];
          changed = true;
          if (Object.keys(dayCompletions).length === 0) {
            delete next[date];
          } else {
            next[date] = dayCompletions;
          }
        }
      }
      return changed ? next : prev;
    });

    try {
      await deleteHabitService(user.uid, habitId);
    } catch (error) {
      console.error('Error permanently deleting habit:', error);
      await refreshHabits();
    }
  };

  // Update mental state for an exact date
  const updateMentalState = async (date: string, mood: number, motivation: number) => {
    if (!user) return;
    const newState: MentalState = {
      date,
      mood,
      motivation,
      updatedAt: new Date().toISOString(),
    };

    setMentalStates((prev) => ({
      ...prev,
      [date]: newState,
    }));

    try {
      await setMentalStateService(user.uid, date, mood, motivation);
    } catch (error) {
      console.error('Error updating mental state:', error);
    }
  };

  // Delete mental state for an exact date
  const deleteMentalState = async (date: string) => {
    if (!user) return;
    setMentalStates((prev) => {
      const next = { ...prev };
      delete next[date];
      return next;
    });

    try {
      await deleteMentalStateService(user.uid, date);
    } catch (error) {
      console.error('Error deleting mental state:', error);
    }
  };

  // Clear all past mental state entries before today
  const clearPastMentalStates = async () => {
    if (!user) return;
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    setMentalStates((prev) => {
      const next: Record<string, MentalState> = {};
      for (const [d, val] of Object.entries(prev)) {
        if (d >= todayStr) {
          next[d] = val;
        }
      }
      return next;
    });

    try {
      await clearPastMentalStatesService(user.uid, todayStr);
    } catch (error) {
      console.error('Error clearing past mental states:', error);
    }
  };

  // Compute applicable habits for the selected month:
  // Active habits appear + Archived habits appear IF they have completions in this month OR were archived after the start of this month
  const monthStart = new Date(selectedYear, selectedMonth, 1).toISOString();
  const applicableHabits = allHabits.filter((h) => {
    if (h.active !== false) return true;
    if (h.archivedAt && h.archivedAt >= monthStart) return true;
    for (const habitMap of Object.values(completions)) {
      if (habitMap[h.id]) return true;
    }
    return false;
  });

  const activeHabits = allHabits.filter((h) => h.active !== false).sort((a, b) => a.order - b.order);
  const archivedHabits = allHabits.filter((h) => h.active === false);

  return (
    <HabitContext.Provider
      value={{
        habits: applicableHabits,
        allHabits,
        activeHabits,
        archivedHabits,
        completions,
        mentalStates,
        selectedYear,
        selectedMonth,
        loading,
        setSelectedYear,
        setSelectedMonth,
        loadMonthData,
        toggleCompletion,
        addHabit,
        editHabit,
        archiveHabit,
        unarchiveHabit,
        removeHabit,
        deleteHabit,
        updateMentalState,
        deleteMentalState,
        clearPastMentalStates,
        refreshHabits,
      }}
    >
      {children}
    </HabitContext.Provider>
  );
}

export function useHabits() {
  const context = useContext(HabitContext);
  if (!context) {
    throw new Error('useHabits must be used within a HabitProvider');
  }
  return context;
}
