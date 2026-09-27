import type { UserProfile, Habit, MentalState } from '../types';
import { DEFAULT_HABITS } from '../utils/defaults';

const STORAGE_KEY_PREFIX = 'habit_tracker_';

export function getLocalUserProfile(uid: string): UserProfile | null {
  const data = localStorage.getItem(`${STORAGE_KEY_PREFIX}profile_${uid}`);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function setLocalUserProfile(uid: string, profile: UserProfile): void {
  localStorage.setItem(`${STORAGE_KEY_PREFIX}profile_${uid}`, JSON.stringify(profile));
}

export function getLocalHabits(uid: string): Habit[] {
  const key = `${STORAGE_KEY_PREFIX}habits_${uid}`;
  const data = localStorage.getItem(key);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      // fallback
    }
  }

  // Seed default habits for demo user or initial user
  const now = new Date().toISOString();
  const initialHabits: Habit[] = DEFAULT_HABITS.map((h, i) => ({
    id: `habit_${i + 1}`,
    name: h.name,
    emoji: h.emoji,
    frequency: 'daily',
    active: true,
    order: h.order,
    createdAt: now,
    updatedAt: now,
    archivedAt: null,
  }));

  localStorage.setItem(key, JSON.stringify(initialHabits));
  return initialHabits;
}

export function saveLocalHabits(uid: string, habits: Habit[]): void {
  localStorage.setItem(`${STORAGE_KEY_PREFIX}habits_${uid}`, JSON.stringify(habits));
}

export function addLocalHabit(
  uid: string,
  data: { name: string; emoji: string; frequency: string }
): Habit {
  const habits = getLocalHabits(uid);
  const now = new Date().toISOString();
  const newHabit: Habit = {
    id: `habit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: data.name,
    emoji: data.emoji || '🎯',
    frequency: (data.frequency as Habit['frequency']) || 'daily',
    active: true,
    order: habits.length,
    createdAt: now,
    updatedAt: now,
    archivedAt: null,
  };
  habits.push(newHabit);
  saveLocalHabits(uid, habits);
  return newHabit;
}

export function updateLocalHabit(
  uid: string,
  habitId: string,
  data: Partial<Pick<Habit, 'name' | 'emoji' | 'frequency' | 'active' | 'order' | 'archivedAt'>>
): void {
  const habits = getLocalHabits(uid);
  const index = habits.findIndex((h) => h.id === habitId);
  if (index !== -1) {
    habits[index] = {
      ...habits[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    saveLocalHabits(uid, habits);
  }
}

export function archiveLocalHabit(uid: string, habitId: string): void {
  const habits = getLocalHabits(uid);
  const index = habits.findIndex((h) => h.id === habitId);
  if (index !== -1) {
    habits[index] = {
      ...habits[index],
      active: false,
      archivedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveLocalHabits(uid, habits);
  }
}

export function unarchiveLocalHabit(uid: string, habitId: string): void {
  const habits = getLocalHabits(uid);
  const index = habits.findIndex((h) => h.id === habitId);
  if (index !== -1) {
    habits[index] = {
      ...habits[index],
      active: true,
      archivedAt: null,
      updatedAt: new Date().toISOString(),
    };
    saveLocalHabits(uid, habits);
  }
}

export function deleteLocalHabit(uid: string, habitId: string): void {
  const habits = getLocalHabits(uid).filter((h) => h.id !== habitId);
  saveLocalHabits(uid, habits);

  // Also delete all completion records belonging to that habit
  const key = `${STORAGE_KEY_PREFIX}completions_${uid}`;
  const raw = localStorage.getItem(key);
  if (raw) {
    try {
      const store: Record<string, Record<string, boolean>> = JSON.parse(raw);
      let changed = false;
      for (const date of Object.keys(store)) {
        if (store[date]?.[habitId] !== undefined) {
          delete store[date][habitId];
          changed = true;
          if (Object.keys(store[date]).length === 0) {
            delete store[date];
          }
        }
      }
      if (changed) {
        localStorage.setItem(key, JSON.stringify(store));
      }
    } catch {
      // Ignored
    }
  }
}

// Completions: stored as Record<date, Record<habitId, boolean>>
export function getAllLocalCompletions(uid: string): Record<string, Record<string, boolean>> {
  // One-time purge of legacy pseudo-random seeded completions for demo user
  const legacySeedClearedKey = `${STORAGE_KEY_PREFIX}legacy_seed_cleared_v1`;
  if (!localStorage.getItem(legacySeedClearedKey)) {
    if (uid === 'demo-user' || uid.startsWith('demo_')) {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}completions_${uid}`);
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}mental_${uid}`);
    }
    localStorage.setItem(legacySeedClearedKey, 'true');
  }

  const key = `${STORAGE_KEY_PREFIX}completions_${uid}`;
  const raw = localStorage.getItem(key);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  return {};
}

export function getLocalCompletions(
  uid: string,
  year: number,
  month: number
): Record<string, Record<string, boolean>> {
  const store = getAllLocalCompletions(uid);
  const result: Record<string, Record<string, boolean>> = {};
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;

  for (const [date, habitMap] of Object.entries(store)) {
    if (date.startsWith(monthPrefix)) {
      result[date] = habitMap;
    }
  }
  return result;
}

export function toggleLocalCompletion(
  uid: string,
  habitId: string,
  date: string
): boolean {
  const key = `${STORAGE_KEY_PREFIX}completions_${uid}`;
  let store: Record<string, Record<string, boolean>> = {};
  const raw = localStorage.getItem(key);
  if (raw) {
    try {
      store = JSON.parse(raw);
    } catch {
      store = {};
    }
  }

  if (!store[date]) {
    store[date] = {};
  }
  const current = !!store[date][habitId];
  const next = !current;

  if (next) {
    store[date][habitId] = true;
  } else {
    delete store[date][habitId];
    if (Object.keys(store[date]).length === 0) {
      delete store[date];
    }
  }

  localStorage.setItem(key, JSON.stringify(store));
  return next;
}

// Mental States: Record<date, MentalState>
export function getAllLocalMentalStates(uid: string): Record<string, MentalState> {
  const key = `${STORAGE_KEY_PREFIX}mental_${uid}`;
  const raw = localStorage.getItem(key);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  return {};
}

export function getLocalMentalStates(
  uid: string,
  year: number,
  month: number
): Record<string, MentalState> {
  const store = getAllLocalMentalStates(uid);
  const result: Record<string, MentalState> = {};
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;

  for (const [date, state] of Object.entries(store)) {
    if (date.startsWith(monthPrefix)) {
      result[date] = state;
    }
  }
  return result;
}

export function setLocalMentalState(
  uid: string,
  date: string,
  mood: number,
  motivation: number
): void {
  const key = `${STORAGE_KEY_PREFIX}mental_${uid}`;
  let store: Record<string, MentalState> = {};
  const raw = localStorage.getItem(key);
  if (raw) {
    try {
      store = JSON.parse(raw);
    } catch {
      store = {};
    }
  }

  store[date] = {
    date,
    mood,
    motivation,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(key, JSON.stringify(store));
}

export function deleteLocalMentalState(uid: string, date: string): void {
  const key = `${STORAGE_KEY_PREFIX}mental_${uid}`;
  const raw = localStorage.getItem(key);
  if (!raw) return;
  try {
    const store: Record<string, MentalState> = JSON.parse(raw);
    if (store[date]) {
      delete store[date];
      localStorage.setItem(key, JSON.stringify(store));
    }
  } catch {
    // ignore
  }
}

export function clearLocalPastMentalStates(uid: string, beforeDate: string): void {
  const key = `${STORAGE_KEY_PREFIX}mental_${uid}`;
  const raw = localStorage.getItem(key);
  if (!raw) return;
  try {
    const store: Record<string, MentalState> = JSON.parse(raw);
    const updated: Record<string, MentalState> = {};
    for (const [date, val] of Object.entries(store)) {
      if (date >= beforeDate) {
        updated[date] = val;
      }
    }
    localStorage.setItem(key, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

export function clearLocalUserData(uid: string): void {
  localStorage.removeItem(`${STORAGE_KEY_PREFIX}profile_${uid}`);
  localStorage.removeItem(`${STORAGE_KEY_PREFIX}habits_${uid}`);
  localStorage.removeItem(`${STORAGE_KEY_PREFIX}completions_${uid}`);
  localStorage.removeItem(`${STORAGE_KEY_PREFIX}mental_${uid}`);
}

