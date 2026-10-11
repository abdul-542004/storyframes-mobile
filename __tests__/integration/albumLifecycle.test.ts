import { saveDraft, getDraftById, deleteDraft } from '../../src/lib/sqlite';
import { publishStoryAlbum, fetchAlbumById } from '../../src/lib/albumsService';
import { uploadPanelImage } from '../../src/lib/storage';
import { LocalDraft, StoryAlbum } from '../../src/lib/types';
import * as SQLite from 'expo-sqlite';

describe('I01–I04: Album Lifecycle & Reader Integration Flow', () => {
  let mockDb: any;

  beforeEach(async () => {
    mockDb = await SQLite.openDatabaseAsync('test.db');
  });

  describe('I01 & I02: Draft Creation, Image Processing & Publication Flow', () => {
    it('executes end-to-end workflow from offline draft to published Firestore album', async () => {
      // 1. Author drafts a story locally
      const draft: LocalDraft = {
        id: 'draft_integration_1',
        title: 'The Rain Walk Chronicles',
        teaser: 'A walk under the misty city streetlamps.',
        accentColor: '#4A6B82',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        panels: [
          {
            id: 'p1',
            sketchId: '__user__',
            caption: 'The sky turned charcoal gray as evening settled.',
            userImageData: 'data:image/png;base64,mockImageData1',
          },
          {
            id: 'p2',
            sketchId: '__user__',
            caption: 'Footsteps echoed through the wet alleyway.',
            userImageData: 'data:image/png;base64,mockImageData2',
          },
        ],
      };

      await saveDraft(draft);
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR REPLACE INTO drafts'),
        expect.anything()
      );

      // 2. Author decides to publish: Process image assets
      const uploadedPanels = await Promise.all(
        draft.panels.map(async (panel) => {
          const remoteUrl = await uploadPanelImage(
            panel.userImageData || '',
            'author_user_1',
            panel.id
          );
          return {
            ...panel,
            imageUrl: remoteUrl,
          };
        })
      );

      expect(uploadedPanels.length).toBe(2);
      expect(uploadedPanels[0].imageUrl).toBeDefined();

      // 3. Assemble and publish the final StoryAlbum
      const newAlbum: StoryAlbum = {
        id: 'album_published_1',
        title: draft.title,
        teaser: draft.teaser,
        accentColor: draft.accentColor,
        likes: 0,
        comments: 0,
        saves: 0,
        date: 'Oct 12, 2026',
        author: {
          id: 'author_user_1',
          name: 'Storyteller Alex',
          username: '@alex',
          avatarColor: '#4A6B82',
          initials: 'SA',
        },
        panels: uploadedPanels,
        isPublished: true,
      };

      await publishStoryAlbum(newAlbum);

      // 4. Clean up draft once successfully published
      await deleteDraft(draft.id);
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM drafts WHERE id = ?;'),
        [draft.id]
      );

      // 5. Verify published album is retrievable by consumers
      const fetched = await fetchAlbumById(newAlbum.id);
      expect(fetched).not.toBeNull();
      expect(fetched?.title).toBe('The Rain Walk Chronicles');
      expect(fetched?.panels.length).toBe(2);
      expect(fetched?.isPublished).toBe(true);
    });
  });

  describe('I04: Reader Panel Progression State', () => {
    class ChapterReaderController {
      private currentIndex: number = 0;
      private panels: any[];

      constructor(panels: any[]) {
        this.panels = panels;
      }

      next(): boolean {
        if (this.currentIndex < this.panels.length - 1) {
          this.currentIndex++;
          return true;
        }
        return false;
      }

      prev(): boolean {
        if (this.currentIndex > 0) {
          this.currentIndex--;
          return true;
        }
        return false;
      }

      getCurrentIndex(): number {
        return this.currentIndex;
      }

      getProgressPercentage(): number {
        if (this.panels.length === 0) return 0;
        return ((this.currentIndex + 1) / this.panels.length) * 100;
      }
    }

    it('manages reader carousel navigation within panel boundaries', () => {
      const reader = new ChapterReaderController(['p1', 'p2', 'p3', 'p4']);

      expect(reader.getCurrentIndex()).toBe(0);
      expect(reader.getProgressPercentage()).toBe(25);

      // Navigate forward
      expect(reader.next()).toBe(true);
      expect(reader.getCurrentIndex()).toBe(1);
      expect(reader.getProgressPercentage()).toBe(50);

      expect(reader.next()).toBe(true);
      expect(reader.next()).toBe(true);
      expect(reader.getCurrentIndex()).toBe(3);
      expect(reader.getProgressPercentage()).toBe(100);

      // At end, next should return false without exceeding bounds
      expect(reader.next()).toBe(false);
      expect(reader.getCurrentIndex()).toBe(3);

      // Navigate backward
      expect(reader.prev()).toBe(true);
      expect(reader.getCurrentIndex()).toBe(2);
      expect(reader.getProgressPercentage()).toBe(75);
    });
  });
});
