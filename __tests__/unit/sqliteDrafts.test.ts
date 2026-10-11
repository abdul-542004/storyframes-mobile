import * as SQLite from 'expo-sqlite';
import { saveDraft, getAllDrafts, getDraftById, deleteDraft } from '../../src/lib/sqlite';
import { LocalDraft } from '../../src/lib/types';

describe('U07 & U08: SQLite Draft Persistence & Restoration', () => {
  let mockDb: any;

  const sampleDraft: LocalDraft = {
    id: 'draft_test_101',
    title: 'Autumn Rain Walk',
    teaser: 'A walk under yellow leaves',
    accentColor: '#C86D51',
    createdAt: '2026-10-12T00:00:00.000Z',
    updatedAt: '2026-10-12T00:05:00.000Z',
    panels: [
      {
        id: 'panel_1',
        sketchId: '__user__',
        caption: 'Stepping into the rain.',
        strokeData: JSON.stringify([{ points: [{ x: 10, y: 10 }], color: '#000', size: 2 }]),
        userImageData: 'file:///mock/cache/panel_1.png',
        imageUrl: 'file:///mock/cache/panel_1.png',
      },
      {
        id: 'panel_2',
        sketchId: '__user__',
        caption: 'The smell of wet asphalt.',
        strokeData: '',
        userImageData: 'file:///mock/cache/panel_2.png',
        imageUrl: 'file:///mock/cache/panel_2.png',
      },
    ],
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockDb = await SQLite.openDatabaseAsync('test.db');
  });

  describe('U07: Draft Serialization & Persistence', () => {
    it('executes database insert queries for draft header and all panels', async () => {
      await saveDraft(sampleDraft);

      // Verify draft insertion
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR REPLACE INTO drafts'),
        [
          sampleDraft.id,
          sampleDraft.title,
          sampleDraft.teaser,
          sampleDraft.accentColor,
          sampleDraft.createdAt,
          sampleDraft.updatedAt,
        ]
      );

      // Verify existing panels removal to prevent orphaned rows
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM draft_panels WHERE draftId = ?;'),
        [sampleDraft.id]
      );

      // Verify insertion of each panel with orderIndex
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO draft_panels'),
        [
          sampleDraft.panels[0].id,
          sampleDraft.id,
          0,
          sampleDraft.panels[0].caption,
          sampleDraft.panels[0].strokeData,
          sampleDraft.panels[0].userImageData,
        ]
      );

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO draft_panels'),
        [
          sampleDraft.panels[1].id,
          sampleDraft.id,
          1,
          sampleDraft.panels[1].caption,
          '',
          sampleDraft.panels[1].userImageData,
        ]
      );
    });
  });

  describe('U08: Draft Restoration & Retrieval', () => {
    it('accurately reconstructs LocalDraft from database rows', async () => {
      mockDb.getFirstAsync.mockResolvedValueOnce({
        id: sampleDraft.id,
        title: sampleDraft.title,
        teaser: sampleDraft.teaser,
        accentColor: sampleDraft.accentColor,
        createdAt: sampleDraft.createdAt,
        updatedAt: sampleDraft.updatedAt,
      });

      mockDb.getAllAsync.mockResolvedValueOnce([
        {
          id: 'panel_1',
          draftId: sampleDraft.id,
          orderIndex: 0,
          caption: 'Stepping into the rain.',
          strokeData: sampleDraft.panels[0].strokeData,
          imageUri: 'file:///mock/cache/panel_1.png',
        },
        {
          id: 'panel_2',
          draftId: sampleDraft.id,
          orderIndex: 1,
          caption: 'The smell of wet asphalt.',
          strokeData: '',
          imageUri: 'file:///mock/cache/panel_2.png',
        },
      ]);

      const restored = await getDraftById(sampleDraft.id);
      expect(restored).not.toBeNull();
      expect(restored?.id).toBe(sampleDraft.id);
      expect(restored?.title).toBe(sampleDraft.title);
      expect(restored?.panels.length).toBe(2);
      expect(restored?.panels[0].caption).toBe('Stepping into the rain.');
      expect((restored?.panels[1] as any)?.orderIndex).toBeUndefined(); // Structured inside array order
    });

    it('returns null if draft ID does not exist in local database', async () => {
      mockDb.getFirstAsync.mockResolvedValueOnce(null);
      const result = await getDraftById('non_existent_id');
      expect(result).toBeNull();
    });

    it('removes draft and panels atomically on deleteDraft', async () => {
      await deleteDraft(sampleDraft.id);
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM draft_panels WHERE draftId = ?;'),
        [sampleDraft.id]
      );
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM drafts WHERE id = ?;'),
        [sampleDraft.id]
      );
    });
  });
});
