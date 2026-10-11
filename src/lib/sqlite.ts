import * as SQLite from 'expo-sqlite';
import { LocalDraft, StoryPanel } from './types';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync('storyframes_drafts.db');
    await initTables(dbInstance);
  }
  return dbInstance;
}

async function initTables(db: SQLite.SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS drafts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      teaser TEXT DEFAULT '',
      accentColor TEXT DEFAULT '#7A9E87',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS draft_panels (
      id TEXT PRIMARY KEY,
      draftId TEXT NOT NULL,
      orderIndex INTEGER NOT NULL,
      caption TEXT NOT NULL DEFAULT '',
      strokeData TEXT,
      imageUri TEXT,
      FOREIGN KEY (draftId) REFERENCES drafts(id) ON DELETE CASCADE
    );
  `);
}

export async function saveDraft(draft: LocalDraft): Promise<void> {
  const db = await getDb();
  
  await db.runAsync(
    `INSERT OR REPLACE INTO drafts (id, title, teaser, accentColor, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?);`,
    [draft.id, draft.title, draft.teaser || '', draft.accentColor || '#7A9E87', draft.createdAt, draft.updatedAt]
  );

  // Remove existing panels for this draft and re-insert
  await db.runAsync('DELETE FROM draft_panels WHERE draftId = ?;', [draft.id]);

  for (let i = 0; i < draft.panels.length; i++) {
    const p = draft.panels[i];
    await db.runAsync(
      `INSERT INTO draft_panels (id, draftId, orderIndex, caption, strokeData, imageUri)
       VALUES (?, ?, ?, ?, ?, ?);`,
      [p.id, draft.id, i, p.caption || '', p.strokeData || '', p.userImageData || p.imageUrl || '']
    );
  }
}

export async function getAllDrafts(): Promise<LocalDraft[]> {
  const db = await getDb();
  const draftRows = await db.getAllAsync<any>(
    'SELECT * FROM drafts ORDER BY updatedAt DESC;'
  );

  const drafts: LocalDraft[] = [];

  for (const d of draftRows) {
    const panelRows = await db.getAllAsync<any>(
      'SELECT * FROM draft_panels WHERE draftId = ? ORDER BY orderIndex ASC;',
      [d.id]
    );

    const panels: StoryPanel[] = panelRows.map((p) => ({
      id: p.id,
      sketchId: '__user__',
      caption: p.caption,
      strokeData: p.strokeData,
      userImageData: p.imageUri,
      imageUrl: p.imageUri,
    }));

    drafts.push({
      id: d.id,
      title: d.title,
      teaser: d.teaser,
      accentColor: d.accentColor,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
      panels,
    });
  }

  return drafts;
}

export async function getDraftById(id: string): Promise<LocalDraft | null> {
  const db = await getDb();
  const draftRow = await db.getFirstAsync<any>(
    'SELECT * FROM drafts WHERE id = ?;',
    [id]
  );

  if (!draftRow) return null;

  const panelRows = await db.getAllAsync<any>(
    'SELECT * FROM draft_panels WHERE draftId = ? ORDER BY orderIndex ASC;',
    [id]
  );

  const panels: StoryPanel[] = panelRows.map((p) => ({
    id: p.id,
    sketchId: '__user__',
    caption: p.caption,
    strokeData: p.strokeData,
    userImageData: p.imageUri,
    imageUrl: p.imageUri,
  }));

  return {
    id: draftRow.id,
    title: draftRow.title,
    teaser: draftRow.teaser,
    accentColor: draftRow.accentColor,
    createdAt: draftRow.createdAt,
    updatedAt: draftRow.updatedAt,
    panels,
  };
}

export async function deleteDraft(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM draft_panels WHERE draftId = ?;', [id]);
  await db.runAsync('DELETE FROM drafts WHERE id = ?;', [id]);
}
