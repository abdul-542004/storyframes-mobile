export interface StoryUser {
  id: string;
  name: string;
  username: string;
  avatarColor: string;
  initials: string;
  bio?: string;
  followers?: number;
  following?: number;
  createdAt?: string;
}

export interface StoryPanel {
  id: string;
  sketchId: string;
  caption: string;
  imageUrl?: string;
  userImageData?: string; // Base64 or local URI
  strokeData?: string;    // JSON stringified Skia stroke history
}

export interface StoryAlbum {
  id: string;
  title: string;
  teaser: string;
  author: StoryUser;
  panels: StoryPanel[];
  likes: number;
  comments: number;
  saves: number;
  date: string;
  accentColor: string;
  isPublished?: boolean;
}

export interface AlbumComment {
  id: string;
  albumId: string;
  userId: string;
  userName: string;
  userAvatarColor: string;
  content: string;
  createdAt: string;
  parentId?: string | null;
  replies?: AlbumComment[];
}

export interface LocalDraft {
  id: string;
  title: string;
  teaser: string;
  accentColor: string;
  createdAt: string;
  updatedAt: string;
  panels: StoryPanel[];
}

export interface StrokePoint {
  x: number;
  y: number;
}

export interface Stroke {
  points: StrokePoint[];
  color: string;
  size: number;
  isEraser?: boolean;
}
