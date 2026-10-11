import { 
  toggleAlbumLike, 
  isAlbumLiked, 
  toggleAlbumSave, 
  isAlbumSaved,
  fetchAlbumById,
  publishStoryAlbum 
} from '../../src/lib/albumsService';
import { StoryAlbum, AlbumComment } from '../../src/lib/types';

describe('U11 & U12: Social Interactions & Threaded Comment Trees', () => {
  const testAlbum: StoryAlbum = {
    id: 'album_social_test',
    title: 'Morning Sketch',
    teaser: 'A quick doodle',
    accentColor: '#7A9E87',
    likes: 5,
    comments: 2,
    saves: 3,
    date: 'Oct 12, 2026',
    author: {
      id: 'author_1',
      name: 'Test Author',
      username: '@testauthor',
      avatarColor: '#7A9E87',
      initials: 'TA',
    },
    panels: [],
  };

  beforeAll(async () => {
    await publishStoryAlbum(testAlbum);
  });

  describe('U11: Optimistic Likes & Bookmarks State', () => {
    it('toggles album like state and increments/decrements count idempotently', async () => {
      // Initial state
      const initiallyLiked = isAlbumLiked(testAlbum.id);
      expect(initiallyLiked).toBe(false);

      // 1st Toggle: Like
      const result1 = await toggleAlbumLike(testAlbum.id, 'user_test');
      expect(result1).toBe(true);
      expect(isAlbumLiked(testAlbum.id)).toBe(true);

      const albumAfterLike = await fetchAlbumById(testAlbum.id);
      expect(albumAfterLike?.likes).toBe(6);

      // 2nd Toggle: Unlike
      const result2 = await toggleAlbumLike(testAlbum.id, 'user_test');
      expect(result2).toBe(false);
      expect(isAlbumLiked(testAlbum.id)).toBe(false);

      const albumAfterUnlike = await fetchAlbumById(testAlbum.id);
      expect(albumAfterUnlike?.likes).toBe(5);
    });

    it('toggles album bookmark/save state correctly', async () => {
      expect(isAlbumSaved(testAlbum.id)).toBe(false);

      // Save
      await toggleAlbumSave(testAlbum.id, 'user_test');
      expect(isAlbumSaved(testAlbum.id)).toBe(true);

      const albumAfterSave = await fetchAlbumById(testAlbum.id);
      expect(albumAfterSave?.saves).toBe(4);

      // Unsave
      await toggleAlbumSave(testAlbum.id, 'user_test');
      expect(isAlbumSaved(testAlbum.id)).toBe(false);

      const albumAfterUnsave = await fetchAlbumById(testAlbum.id);
      expect(albumAfterUnsave?.saves).toBe(3);
    });
  });

  describe('U12: Threaded Comment Hierarchy & Reply Trees', () => {
    // Pure function for assembling threaded comment tree from flat list
    function buildCommentTree(flatComments: AlbumComment[]): AlbumComment[] {
      const map = new Map<string, AlbumComment>();
      const roots: AlbumComment[] = [];

      flatComments.forEach((c) => {
        map.set(c.id, { ...c, replies: [] });
      });

      flatComments.forEach((c) => {
        const comment = map.get(c.id)!;
        if (c.parentId && map.has(c.parentId)) {
          map.get(c.parentId)!.replies!.push(comment);
        } else {
          roots.push(comment);
        }
      });

      return roots;
    }

    it('organizes nested replies into parent comments accurately', () => {
      const flatComments: AlbumComment[] = [
        {
          id: 'c1',
          albumId: 'album_1',
          userId: 'u1',
          userName: 'Alice',
          userAvatarColor: '#7A9E87',
          content: 'I love this storyline!',
          createdAt: '10:00 AM',
          parentId: null,
        },
        {
          id: 'c2',
          albumId: 'album_1',
          userId: 'u2',
          userName: 'Bob',
          userAvatarColor: '#C86D51',
          content: 'Thanks Alice, glad you enjoyed it!',
          createdAt: '10:05 AM',
          parentId: 'c1',
        },
        {
          id: 'c3',
          albumId: 'album_1',
          userId: 'u3',
          userName: 'Charlie',
          userAvatarColor: '#4A6B82',
          content: 'The 3rd panel is my favorite.',
          createdAt: '10:10 AM',
          parentId: null,
        },
        {
          id: 'c4',
          albumId: 'album_1',
          userId: 'u1',
          userName: 'Alice',
          userAvatarColor: '#7A9E87',
          content: 'Agreed Charlie, the colors are amazing.',
          createdAt: '10:12 AM',
          parentId: 'c3',
        },
      ];

      const tree = buildCommentTree(flatComments);

      expect(tree.length).toBe(2); // Two root comments: c1, c3
      expect(tree[0].id).toBe('c1');
      expect(tree[0].replies?.length).toBe(1);
      expect(tree[0].replies?.[0].id).toBe('c2');

      expect(tree[1].id).toBe('c3');
      expect(tree[1].replies?.length).toBe(1);
      expect(tree[1].replies?.[0].id).toBe('c4');
    });
  });
});
