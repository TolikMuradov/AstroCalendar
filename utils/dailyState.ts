import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'astro_lucky_unlocks';

function getTodayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

interface DailyUnlocks {
  date: string;
  unlockedIndices: number[];
}

async function getUnlocksData(uid: string): Promise<DailyUnlocks> {
  try {
    const raw = await AsyncStorage.getItem(`${STORAGE_KEY}_${uid}`);
    if (!raw) return { date: getTodayKey(), unlockedIndices: [] };
    const data: DailyUnlocks = JSON.parse(raw);
    if (data.date !== getTodayKey()) {
      return { date: getTodayKey(), unlockedIndices: [] };
    }
    return data;
  } catch {
    return { date: getTodayKey(), unlockedIndices: [] };
  }
}

export async function getLuckyUnlocksForToday(uid: string): Promise<number[]> {
  const data = await getUnlocksData(uid);
  return data.unlockedIndices;
}

export async function addLuckyUnlockForToday(uid: string, index: number): Promise<void> {
  const data = await getUnlocksData(uid);
  if (!data.unlockedIndices.includes(index)) {
    data.unlockedIndices.push(index);
  }
  data.date = getTodayKey();
  await AsyncStorage.setItem(`${STORAGE_KEY}_${uid}`, JSON.stringify(data));
}
