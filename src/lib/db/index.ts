import Dexie, { type Table } from 'dexie';
import type { FFTDataRow } from '@/lib/types/signal';

export class SignalDatabase extends Dexie {
  signals!: Table<FFTDataRow, number>;

  constructor() {
    super('SignalDB');
    this.version(1).stores({
      signals: 'Freq',
    });
  }
}

let db: SignalDatabase | null = null;

export function getDB(): SignalDatabase {
  if (!db) {
    db = new SignalDatabase();
  }
  return db;
}

export async function createDB(): Promise<SignalDatabase> {
  return getDB();
}

export async function loadJSONToIndexedDB(jsonData: FFTDataRow[]): Promise<void> {
  try {
    const database = getDB();
    console.log('Data loaded from JSON file into IndexedDB:', jsonData.length, 'rows');
    
    await database.signals.clear();
    await database.signals.bulkAdd(jsonData);
  } catch (error) {
    console.error('Error loading data into IndexedDB:', error);
    throw error;
  }
}

export async function checkDBHasData(): Promise<boolean> {
  try {
    const database = getDB();
    const count = await database.signals.count();
    return count > 0;
  } catch (error) {
    console.error('Error checking DB data:', error);
    return false;
  }
}

export async function getAllSignals(): Promise<FFTDataRow[]> {
  try {
    const database = getDB();
    return await database.signals.toArray();
  } catch (error) {
    console.error('Error fetching signals:', error);
    return [];
  }
}

