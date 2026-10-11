import { StoryAlbum, AlbumComment, StoryUser } from './types';
import { 
  db, 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  query, 
  orderBy,
  where
} from './firebase';

const SEED_STORIES: StoryAlbum[] = [
  {
    id: 'story_coffee_chapter',
    title: 'The Coffee Shop on 4th Street ☕',
    teaser: 'Leaving my 9-to-5 desk to learn the art of grinding, steaming, and listening.',
    accentColor: '#7A9E87',
    likes: 18,
    comments: 4,
    saves: 9,
    date: 'Oct 10, 2026',
    author: {
      id: 'author_maya',
      name: 'Maya Lin',
      username: '@mayalin',
      avatarColor: '#7A9E87',
      initials: 'ML',
      followers: 128,
      following: 54,
    },
    panels: [
      {
        id: 'p1_coffee',
        sketchId: 'office-worker',
        caption: 'Three years in cubicle 4B. The spreadsheets blended together, but the espresso machine across the street smelled like possibility.',
      },
      {
        id: 'p2_coffee',
        sketchId: 'walking-to-cafe',
        caption: 'On a brisk October morning, I finally handed in my two weeks. My hands shook, but my boots moved with purpose.',
      },
      {
        id: 'p3_coffee',
        sketchId: 'at-counter',
        caption: '"Do you need anyone behind the bar?" I asked. The manager smiled and handed me an apron.',
      },
      {
        id: 'p4_coffee',
        sketchId: 'espresso-joy',
        caption: 'Now every morning begins with steam, warmth, and strangers who slowly become part of my everyday world.',
      },
    ],
  },
  {
    id: 'story_midnight_sketches',
    title: 'Midnight in the Attic 🌙',
    teaser: 'Finding quiet peace in simple drawings after the city falls asleep.',
    accentColor: '#E8A2A2',
    likes: 31,
    comments: 6,
    saves: 14,
    date: 'Oct 8, 2026',
    author: {
      id: 'author_leo',
      name: 'Leo Santos',
      username: '@leodraws',
      avatarColor: '#E8A2A2',
      initials: 'LS',
      followers: 92,
      following: 38,
    },
    panels: [
      {
        id: 'p1_attic',
        sketchId: 'default',
        caption: 'When the world is loud, a blank square and a quiet pen bring everything back into focus.',
      },
      {
        id: 'p2_attic',
        sketchId: 'walking-to-cafe',
        caption: 'Walking through empty rain-soaked streets, collecting moments that words alone cannot capture.',
      },
      {
        id: 'p3_attic',
        sketchId: 'espresso-joy',
        caption: 'Each chapter is a small reminder: you are living a story worth remembering.',
      },
    ],
  },
];

let localAlbumsStore: StoryAlbum[] = [...SEED_STORIES];
let userLikesSet = new Set<string>();
let userSavesSet = new Set<string>();

export async function fetchFeedAlbums(): Promise<StoryAlbum[]> {
  try {
    if (db && typeof getDocs === 'function') {
      const q = query(collection(db, 'albums'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const cloudAlbums: StoryAlbum[] = [];
        snapshot.forEach((d) => {
          cloudAlbums.push(d.data() as StoryAlbum);
        });
        localAlbumsStore = cloudAlbums;
        return cloudAlbums;
      }
    }
  } catch (err) {
    console.warn('Firestore fetch error, using local/cached albums:', err);
  }
  return [...localAlbumsStore];
}

export async function publishStoryAlbum(album: StoryAlbum): Promise<void> {
  localAlbumsStore = [album, ...localAlbumsStore.filter((a) => a.id !== album.id)];
  try {
    if (db && typeof setDoc === 'function') {
      await setDoc(doc(db, 'albums', album.id), {
        ...album,
        createdAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.warn('Firestore publish error (saved locally):', err);
  }
}

export async function deleteStoryAlbum(albumId: string): Promise<void> {
  localAlbumsStore = localAlbumsStore.filter((a) => a.id !== albumId);
  try {
    if (db && typeof deleteDoc === 'function') {
      await deleteDoc(doc(db, 'albums', albumId));
    }
  } catch (err) {
    console.warn('Firestore delete error:', err);
  }
}

export async function fetchAlbumById(id: string): Promise<StoryAlbum | null> {
  try {
    if (db && typeof getDoc === 'function') {
      const docSnap = await getDoc(doc(db, 'albums', id));
      if (docSnap.exists()) {
        return docSnap.data() as StoryAlbum;
      }
    }
  } catch (err) {
    console.warn('Firestore getAlbum error:', err);
  }

  const local = localAlbumsStore.find((a) => a.id === id);
  return local || null;
}

export async function toggleAlbumLike(albumId: string, userId: string = 'current_user'): Promise<boolean> {
  const isLiked = userLikesSet.has(albumId);
  if (isLiked) {
    userLikesSet.delete(albumId);
  } else {
    userLikesSet.add(albumId);
  }

  // Update in Firestore
  try {
    if (db && typeof setDoc === 'function' && typeof deleteDoc === 'function') {
      const likeRef = doc(db, 'likes', `${albumId}__${userId}`);
      if (isLiked) {
        await deleteDoc(likeRef);
      } else {
        await setDoc(likeRef, { albumId, userId, createdAt: new Date().toISOString() });
      }
    }
  } catch (e) {
    console.warn('Firestore like toggle error:', e);
  }

  // Update in memory
  localAlbumsStore = localAlbumsStore.map((a) => {
    if (a.id === albumId) {
      return {
        ...a,
        likes: Math.max(0, a.likes + (isLiked ? -1 : 1)),
      };
    }
    return a;
  });

  return !isLiked;
}

export async function toggleAlbumSave(albumId: string, userId: string = 'current_user'): Promise<boolean> {
  const isSaved = userSavesSet.has(albumId);
  if (isSaved) {
    userSavesSet.delete(albumId);
  } else {
    userSavesSet.add(albumId);
  }

  // Update in Firestore
  try {
    if (db && typeof setDoc === 'function' && typeof deleteDoc === 'function') {
      const saveRef = doc(db, 'saves', `${albumId}__${userId}`);
      if (isSaved) {
        await deleteDoc(saveRef);
      } else {
        await setDoc(saveRef, { albumId, userId, createdAt: new Date().toISOString() });
      }
    }
  } catch (e) {
    console.warn('Firestore save toggle error:', e);
  }

  localAlbumsStore = localAlbumsStore.map((a) => {
    if (a.id === albumId) {
      return {
        ...a,
        saves: Math.max(0, a.saves + (isSaved ? -1 : 1)),
      };
    }
    return a;
  });

  return !isSaved;
}

export function isAlbumLiked(albumId: string): boolean {
  return userLikesSet.has(albumId);
}

export function isAlbumSaved(albumId: string): boolean {
  return userSavesSet.has(albumId);
}

export async function fetchComments(albumId: string): Promise<AlbumComment[]> {
  try {
    if (db && typeof getDocs === 'function') {
      const q = query(collection(db, 'comments'), where('albumId', '==', albumId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const comments: AlbumComment[] = [];
        snap.forEach((d) => {
          comments.push(d.data() as AlbumComment);
        });
        return comments;
      }
    }
  } catch (err) {
    console.warn('Firestore fetchComments error:', err);
  }
  return [];
}

export async function addComment(
  albumId: string,
  user: StoryUser,
  content: string,
  parentId?: string | null
): Promise<AlbumComment> {
  const newComment: AlbumComment = {
    id: `comment_${Date.now()}`,
    albumId,
    userId: user.id,
    userName: user.name,
    userAvatarColor: user.avatarColor,
    content,
    createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    parentId: parentId || null,
    replies: [],
  };

  try {
    if (db && typeof setDoc === 'function') {
      await setDoc(doc(db, 'comments', newComment.id), newComment);
    }
  } catch (e) {
    console.warn('Firestore addComment error:', e);
  }

  // Increment comment count on local store
  localAlbumsStore = localAlbumsStore.map((a) =>
    a.id === albumId ? { ...a, comments: a.comments + 1 } : a
  );

  return newComment;
}
