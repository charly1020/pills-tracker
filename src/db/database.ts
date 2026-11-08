import * as SQLite from 'expo-sqlite';

// Each entry migrates the schema from version i to i + 1 (tracked with PRAGMA user_version).
const MIGRATIONS: string[] = [
  `CREATE TABLE pills (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     name TEXT NOT NULL,
     reason TEXT NOT NULL DEFAULT '',
     dose TEXT,
     notes TEXT,
     photo_uri TEXT,
     anchor_minutes INTEGER NOT NULL,
     interval_hours REAL NOT NULL,
     stock_qty INTEGER,
     units_per_dose INTEGER NOT NULL DEFAULT 1,
     created_at INTEGER NOT NULL
   );
   CREATE TABLE doses (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     pill_id INTEGER NOT NULL REFERENCES pills(id) ON DELETE CASCADE,
     scheduled_at INTEGER NOT NULL,
     state TEXT NOT NULL,
     taken_at INTEGER,
     UNIQUE (pill_id, scheduled_at)
   );`,
  // Small key-value store for on-device preferences (for example the text size).
  `CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);`,
];

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb() {
  dbPromise ??= open();
  return dbPromise;
}

async function open() {
  const db = await SQLite.openDatabaseAsync('pills.db');
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;
  for (let v = current; v < MIGRATIONS.length; v++) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(MIGRATIONS[v]);
      await db.execAsync(`PRAGMA user_version = ${v + 1}`);
    });
  }
  return db;
}
