import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  writeBatch,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';
import type { UserProfile, Habit, MentalState } from '../types';
import { DEFAULT_HABITS } from '../utils/defaults';
import * as mockStorage from './mockStorage';

function isLocal(uid: string): boolean {
  return !db || uid.startsWith('demo_') || uid === 'demo-user' || uid.startsWith('local_');
}

// ======================== USER PROFILE ========================

export async function createUserProfile(
  uid: string,
  data: { name: string; email: string; photoURL?: string }
): Promise<void> {
  const now = new Date().toISOString();
  const profile: UserProfile = {
    uid,
    name: data.name || '',
    email: data.email || '',
    username: data.email?.split('@')[0] || '',
    photoURL: data.photoURL || '',
    createdAt: now,
    updatedAt: now,
  };

  if (isLocal(uid)) {
    mockStorage.setLocalUserProfile(uid, profile);
    return;
  }

  await setDoc(doc(db!, 'users', uid), profile);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (isLocal(uid)) {
    return mockStorage.getLocalUserProfile(uid);
  }

  try {
    const docRef = doc(db!, 'users', uid);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { uid, ...snap.data() } as UserProfile;
  } catch (error) {
    console.warn('Could not read user profile from Firestore:', error);
    return null;
  }
}

export async function updateUserProfile(
  uid: string,
  data: Partial<Pick<UserProfile, 'name' | 'username' | 'photoURL'>>
): Promise<void> {
  if (isLocal(uid)) {
    const p = mockStorage.getLocalUserProfile(uid);
    if (p) {
      mockStorage.setLocalUserProfile(uid, {
        ...p,
        ...data,
        updatedAt: new Date().toISOString(),
      });
    }
    return;
  }

  await updateDoc(doc(db!, 'users', uid), {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

// ======================== HABITS ========================

export async function createDefaultHabits(uid: string): Promise<void> {
  if (isLocal(uid)) {
    mockStorage.getLocalHabits(uid);
    return;
  }

  const batch = writeBatch(db!);
  const now = new Date().toISOString();

  DEFAULT_HABITS.forEach((habit) => {
    const habitRef = doc(collection(db!, 'users', uid, 'habits'));
    batch.set(habitRef, {
      name: habit.name,
      emoji: habit.emoji,
      frequency: 'daily',
      active: true,
      order: habit.order,
      createdAt: now,
      updatedAt: now,
      archivedAt: null,
    });
  });

  await batch.commit();
}

// Get all habits (active and archived)
export async function getAllHabits(uid: string): Promise<Habit[]> {
  if (isLocal(uid)) {
    return mockStorage.getLocalHabits(uid);
  }

  try {
    const q = query(
      collection(db!, 'users', uid, 'habits'),
      orderBy('order', 'asc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Habit));
  } catch (err) {
    console.warn('Could not read habits from Firestore:', err);
    return [];
  }
}

export const getHabits = getAllHabits;

// Get active habits
export async function getActiveHabits(uid: string): Promise<Habit[]> {
  const all = await getAllHabits(uid);
  return all.filter((h) => h.active !== false);
}

// Get habits applicable for a specific month
export async function getHabitsForMonth(
  uid: string,
  year: number,
  month: number,
  completions: Record<string, Record<string, boolean>>
): Promise<Habit[]> {
  const all = await getAllHabits(uid);
  const monthStart = new Date(year, month, 1).toISOString();

  return all.filter((h) => {
    // If active, it appears
    if (h.active !== false) return true;

    // If archived, check if it was archived AFTER the start of this month
    if (h.archivedAt && h.archivedAt > monthStart) {
      return true;
    }

    // Or if it has any completion record in this month
    for (const habitMap of Object.values(completions)) {
      if (habitMap[h.id]) return true;
    }

    return false;
  });
}

export async function createHabit(
  uid: string,
  data: { name: string; emoji: string; frequency: string; order?: number }
): Promise<Habit> {
  const now = new Date().toISOString();

  if (isLocal(uid)) {
    return mockStorage.addLocalHabit(uid, {
      name: data.name,
      emoji: data.emoji,
      frequency: data.frequency,
    });
  }

  let order = data.order ?? 0;
  try {
    const allHabits = await getAllHabits(uid);
    order = data.order !== undefined ? data.order : allHabits.length;
  } catch (err) {
    console.warn('Could not read existing habits for ordering:', err);
  }

  const habitRef = doc(collection(db!, 'users', uid, 'habits'));
  const newHabit: Habit = {
    id: habitRef.id,
    name: data.name,
    emoji: data.emoji || '🎯',
    frequency: (data.frequency as Habit['frequency']) || 'daily',
    active: true,
    order,
    createdAt: now,
    updatedAt: now,
    archivedAt: null,
  };

  await setDoc(habitRef, newHabit);
  return newHabit;
}

export async function updateHabit(
  uid: string,
  habitId: string,
  data: Partial<Pick<Habit, 'name' | 'emoji' | 'frequency' | 'active' | 'order' | 'archivedAt'>>
): Promise<void> {
  if (isLocal(uid)) {
    mockStorage.updateLocalHabit(uid, habitId, data);
    return;
  }

  const habitRef = doc(db!, 'users', uid, 'habits', habitId);
  await updateDoc(habitRef, {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function archiveHabit(uid: string, habitId: string): Promise<void> {
  const now = new Date().toISOString();
  if (isLocal(uid)) {
    mockStorage.archiveLocalHabit(uid, habitId);
    return;
  }

  const habitRef = doc(db!, 'users', uid, 'habits', habitId);
  await updateDoc(habitRef, {
    active: false,
    archivedAt: now,
    updatedAt: now,
  });
}

export async function unarchiveHabit(uid: string, habitId: string): Promise<void> {
  const now = new Date().toISOString();
  if (isLocal(uid)) {
    mockStorage.unarchiveLocalHabit(uid, habitId);
    return;
  }

  const habitRef = doc(db!, 'users', uid, 'habits', habitId);
  await updateDoc(habitRef, {
    active: true,
    archivedAt: null,
    updatedAt: now,
  });
}

export async function deleteHabit(uid: string, habitId: string): Promise<void> {
  if (isLocal(uid)) {
    mockStorage.deleteLocalHabit(uid, habitId);
    return;
  }

  const habitRef = doc(db!, 'users', uid, 'habits', habitId);
  await deleteDoc(habitRef);
}

// ======================== COMPLETIONS ========================

export async function toggleHabitCompletion(
  uid: string,
  habitId: string,
  date: string,
  currentlyCompleted: boolean
): Promise<boolean> {
  if (isLocal(uid)) {
    return mockStorage.toggleLocalCompletion(uid, habitId, date);
  }

  const completionId = `${habitId}_${date}`;
  const docRef = doc(db!, 'users', uid, 'habitCompletions', completionId);
  const now = new Date().toISOString();
  const next = !currentlyCompleted;

  if (next) {
    await setDoc(docRef, {
      habitId,
      date,
      completed: true,
      createdAt: now,
      updatedAt: now,
    });
  } else {
    await deleteDoc(docRef);
  }

  return next;
}

export async function getCompletionsForMonth(
  uid: string,
  year: number,
  month: number
): Promise<Record<string, Record<string, boolean>>> {
  if (isLocal(uid)) {
    return mockStorage.getLocalCompletions(uid, year, month);
  }

  try {
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    const endDate = `${nextMonth === 0 ? nextYear : year}-${String(nextMonth + 1).padStart(2, '0')}-01`;

    const q = query(
      collection(db!, 'users', uid, 'habitCompletions'),
      where('date', '>=', startDate),
      where('date', '<', endDate)
    );

    const snap = await getDocs(q);
    const completions: Record<string, Record<string, boolean>> = {};

    snap.docs.forEach((d) => {
      const data = d.data();
      if (data.completed) {
        if (!completions[data.date]) {
          completions[data.date] = {};
        }
        completions[data.date][data.habitId] = true;
      }
    });

    return completions;
  } catch (err) {
    console.warn('Could not read month completions from Firestore:', err);
    return {};
  }
}

// Get all lifetime completions for analytics & exports
export async function getAllCompletions(
  uid: string
): Promise<Record<string, Record<string, boolean>>> {
  if (isLocal(uid)) {
    return mockStorage.getAllLocalCompletions(uid);
  }

  try {
    const q = query(collection(db!, 'users', uid, 'habitCompletions'));
    const snap = await getDocs(q);
    const completions: Record<string, Record<string, boolean>> = {};

    snap.docs.forEach((d) => {
      const data = d.data();
      if (data.completed) {
        if (!completions[data.date]) {
          completions[data.date] = {};
        }
        completions[data.date][data.habitId] = true;
      }
    });

    return completions;
  } catch (err) {
    console.warn('Could not read all completions from Firestore:', err);
    return {};
  }
}

// ======================== MENTAL STATE ========================

export async function getMentalStatesForMonth(
  uid: string,
  year: number,
  month: number
): Promise<Record<string, MentalState>> {
  if (isLocal(uid)) {
    return mockStorage.getLocalMentalStates(uid, year, month);
  }

  try {
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    const endDate = `${nextMonth === 0 ? nextYear : year}-${String(nextMonth + 1).padStart(2, '0')}-01`;

    const q = query(
      collection(db!, 'users', uid, 'mentalState'),
      where('date', '>=', startDate),
      where('date', '<', endDate)
    );

    const snap = await getDocs(q);
    const states: Record<string, MentalState> = {};

    snap.docs.forEach((d) => {
      const data = d.data();
      states[data.date] = {
        date: data.date,
        mood: data.mood,
        motivation: data.motivation,
        updatedAt: data.updatedAt,
      };
    });

    return states;
  } catch (err) {
    console.warn('Could not read month mental states from Firestore:', err);
    return {};
  }
}

// Get all lifetime mental states for analytics & exports
export async function getAllMentalStates(
  uid: string
): Promise<Record<string, MentalState>> {
  if (isLocal(uid)) {
    return mockStorage.getAllLocalMentalStates(uid);
  }

  try {
    const q = query(collection(db!, 'users', uid, 'mentalState'));
    const snap = await getDocs(q);
    const states: Record<string, MentalState> = {};

    snap.docs.forEach((d) => {
      const data = d.data();
      states[data.date] = {
        date: data.date,
        mood: data.mood,
        motivation: data.motivation,
        updatedAt: data.updatedAt,
      };
    });

    return states;
  } catch (err) {
    console.warn('Could not read all mental states from Firestore:', err);
    return {};
  }
}

export async function setMentalState(
  uid: string,
  date: string,
  mood: number,
  motivation: number
): Promise<void> {
  if (isLocal(uid)) {
    mockStorage.setLocalMentalState(uid, date, mood, motivation);
    return;
  }

  const docRef = doc(db!, 'users', uid, 'mentalState', date);
  await setDoc(
    docRef,
    {
      date,
      mood,
      motivation,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

export async function deleteMentalState(uid: string, date: string): Promise<void> {
  if (isLocal(uid)) {
    mockStorage.deleteLocalMentalState(uid, date);
    return;
  }

  const docRef = doc(db!, 'users', uid, 'mentalState', date);
  await deleteDoc(docRef);
}

export async function clearPastMentalStates(uid: string, beforeDate: string): Promise<void> {
  if (isLocal(uid)) {
    mockStorage.clearLocalPastMentalStates(uid, beforeDate);
    return;
  }

  const colRef = collection(db!, 'users', uid, 'mentalState');
  const snap = await getDocs(colRef);
  const toDelete = snap.docs.filter((d) => d.id < beforeDate);

  for (let i = 0; i < toDelete.length; i += 400) {
    const batch = writeBatch(db!);
    const chunk = toDelete.slice(i, i + 400);
    chunk.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
}

// ======================== BACKUP / FULL EXPORT ========================

export async function exportAllUserData(uid: string) {
  const profile = await getUserProfile(uid);
  const habits = await getAllHabits(uid);
  const completions = await getAllCompletions(uid);
  const mentalStates = await getAllMentalStates(uid);

  return {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    profile,
    habits,
    completions,
    mentalStates,
  };
}

// ======================== ACCOUNT DELETION ========================

export async function deleteUserAccount(uid: string): Promise<void> {
  if (isLocal(uid)) {
    mockStorage.clearLocalUserData(uid);
    return;
  }

  const habitsSnap = await getDocs(collection(db!, 'users', uid, 'habits'));
  const batch = writeBatch(db!);
  habitsSnap.docs.forEach((d) => batch.delete(d.ref));

  const completionsSnap = await getDocs(collection(db!, 'users', uid, 'habitCompletions'));
  completionsSnap.docs.forEach((d) => batch.delete(d.ref));

  const mentalSnap = await getDocs(collection(db!, 'users', uid, 'mentalState'));
  mentalSnap.docs.forEach((d) => batch.delete(d.ref));

  batch.delete(doc(db!, 'users', uid));

  await batch.commit();
}
