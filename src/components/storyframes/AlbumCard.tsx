import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Share,
} from 'react-native';
import { router } from 'expo-router';
import {
  Heart,
  MessageCircle,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Share2,
} from 'lucide-react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { colors, fonts, radius, shadows } from '../../theme/tokens';
import { StoryAlbum } from '../../lib/types';
import { PanelSketch } from './PanelSketch';
import { Avatar } from '../ui/Avatar';
import { CommentsModal } from './CommentsModal';
import {
  toggleAlbumLike,
  toggleAlbumSave,
  isAlbumLiked,
  isAlbumSaved,
} from '../../lib/albumsService';

interface AlbumCardProps {
  album: StoryAlbum;
  onRefresh?: () => void;
}

export function AlbumCard({ album, onRefresh }: AlbumCardProps) {
  const [panelIndex, setPanelIndex] = useState(0);
  const [liked, setLiked] = useState(() => isAlbumLiked(album.id));
  const [saved, setSaved] = useState(() => isAlbumSaved(album.id));
  const [likesCount, setLikesCount] = useState(album.likes);
  const [savesCount, setSavesCount] = useState(album.saves);
  const [commentsModalVisible, setCommentsModalVisible] = useState(false);

  const panels = album.panels || [];
  const currentPanel = panels[panelIndex] || panels[0];

  const handlePrev = () => {
    setPanelIndex((idx) => Math.max(0, idx - 1));
  };

  const handleNext = () => {
    setPanelIndex((idx) => Math.min(panels.length - 1, idx + 1));
  };

  const handleLike = async () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikesCount((c) => Math.max(0, newLiked ? c + 1 : c - 1));
    await toggleAlbumLike(album.id);
  };

  const handleSave = async () => {
    const newSaved = !saved;
    setSaved(newSaved);
    setSavesCount((c) => Math.max(0, newSaved ? c + 1 : c - 1));
    await toggleAlbumSave(album.id);
  };

  const handleShare = async () => {
    try {
      if (currentPanel?.imageUrl && currentPanel.imageUrl.startsWith('file://')) {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(currentPanel.imageUrl, {
            dialogTitle: `Share chapter: ${album.title}`,
          });
          return;
        }
      }
      await Share.share({
        title: album.title,
        message: `"${album.title}" by ${album.author.name}\n\n${currentPanel?.caption || album.teaser}\n\nRead on Storyframes`,
      });
    } catch (e) {
      console.warn('Share error:', e);
    }
  };

  const handleOpenReader = () => {
    router.push({
      pathname: '/album/[id]',
      params: { id: album.id },
    });
  };

  return (
    <View style={styles.card}>
      {/* Author and Accent Badge */}
      <View style={styles.header}>
        <View style={styles.authorRow}>
          <Avatar
            initials={album.author.initials}
            color={album.author.avatarColor}
            size={36}
          />
          <View>
            <Text style={styles.authorName}>{album.author.name}</Text>
            <Text style={styles.authorMeta}>
              {album.author.username} · {album.date}
            </Text>
          </View>
        </View>

        <View style={[styles.badge, { backgroundColor: album.accentColor + '25' }]}>
          <View style={[styles.badgeDot, { backgroundColor: album.accentColor }]} />
          <Text style={[styles.badgeText, { color: album.accentColor }]}>Chapter</Text>
        </View>
      </View>

      {/* Title & Teaser */}
      <TouchableOpacity onPress={handleOpenReader} activeOpacity={0.85}>
        <Text style={styles.title}>{album.title}</Text>
        {!!album.teaser && <Text style={styles.teaser}>{album.teaser}</Text>}
      </TouchableOpacity>

      {/* Panel Preview Area */}
      {currentPanel && (
        <View style={styles.panelContainer}>
          <View style={styles.panelCanvas}>
            <PanelSketch
              id={currentPanel.sketchId}
              userImageData={currentPanel.userImageData || currentPanel.imageUrl}
            />

            {/* Navigation Chevrons */}
            {panelIndex > 0 && (
              <TouchableOpacity
                style={[styles.chevronBtn, styles.chevronLeft]}
                onPress={handlePrev}
                activeOpacity={0.7}
              >
                <ChevronLeft size={20} color={colors.foreground} />
              </TouchableOpacity>
            )}

            {panelIndex < panels.length - 1 && (
              <TouchableOpacity
                style={[styles.chevronBtn, styles.chevronRight]}
                onPress={handleNext}
                activeOpacity={0.7}
              >
                <ChevronRight size={20} color={colors.foreground} />
              </TouchableOpacity>
            )}

            {/* Panel counter indicator */}
            <View style={styles.counterBadge}>
              <Text style={styles.counterText}>
                {panelIndex + 1} / {panels.length}
              </Text>
            </View>
          </View>

          {/* Caption */}
          <Text style={styles.caption}>{currentPanel.caption}</Text>

          {/* Dots Indicator */}
          {panels.length > 1 && (
            <View style={styles.dotsRow}>
              {panels.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    i === panelIndex ? styles.dotActive : styles.dotInactive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>
      )}

      {/* Interactions Bar */}
      <View style={styles.actionsBar}>
        <View style={styles.leftActions}>
          {/* Like */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleLike}
            activeOpacity={0.7}
          >
            <Heart
              size={20}
              color={liked ? colors.blush : colors.foreground}
              fill={liked ? colors.blush : 'none'}
              strokeWidth={liked ? 0 : 2}
            />
            <Text
              style={[
                styles.actionCount,
                liked && { color: colors.blush, fontFamily: fonts.bodyBold },
              ]}
            >
              {likesCount}
            </Text>
          </TouchableOpacity>

          {/* Comment */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => setCommentsModalVisible(true)}
            activeOpacity={0.7}
          >
            <MessageCircle size={20} color={colors.foreground} strokeWidth={2} />
            <Text style={styles.actionCount}>{album.comments}</Text>
          </TouchableOpacity>

          {/* Save */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleSave}
            activeOpacity={0.7}
          >
            <Bookmark
              size={20}
              color={saved ? colors.mustard : colors.foreground}
              fill={saved ? colors.mustard : 'none'}
              strokeWidth={saved ? 0 : 2}
            />
            <Text
              style={[
                styles.actionCount,
                saved && { color: colors.mustard, fontFamily: fonts.bodyBold },
              ]}
            >
              {savesCount}
            </Text>
          </TouchableOpacity>

          {/* Native Share */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleShare}
            activeOpacity={0.7}
          >
            <Share2 size={18} color={colors.mutedForeground} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Read Button */}
        <TouchableOpacity
          style={styles.readButton}
          onPress={handleOpenReader}
          activeOpacity={0.8}
        >
          <BookOpen size={16} color="#FFFFFF" />
          <Text style={styles.readButtonText}>Read</Text>
        </TouchableOpacity>
      </View>

      {/* Comments Modal */}
      <CommentsModal
        visible={commentsModalVisible}
        album={album}
        onClose={() => setCommentsModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSolid,
    padding: 16,
    marginBottom: 16,
    ...shadows.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  authorName: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.foreground,
  },
  authorMeta: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.mutedForeground,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontFamily: fonts.heading,
    fontSize: 14,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 26,
    color: colors.foreground,
    lineHeight: 30,
    marginBottom: 4,
  },
  teaser: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.mutedForeground,
    lineHeight: 19,
    marginBottom: 14,
  },
  panelContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSolid,
    overflow: 'hidden',
    paddingBottom: 12,
  },
  panelCanvas: {
    width: '100%',
    height: 220,
    backgroundColor: '#FCFAF6',
    position: 'relative',
  },
  chevronBtn: {
    position: 'absolute',
    top: '50%',
    marginTop: -16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  chevronLeft: {
    left: 8,
  },
  chevronRight: {
    right: 8,
  },
  counterBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(44, 36, 22, 0.65)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  counterText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10,
    color: '#FFFFFF',
  },
  caption: {
    fontFamily: fonts.caption,
    fontSize: 18,
    color: colors.foreground,
    paddingHorizontal: 14,
    paddingTop: 10,
    lineHeight: 22,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  dot: {
    height: 5,
    borderRadius: 2.5,
  },
  dotActive: {
    width: 14,
    backgroundColor: colors.primary,
  },
  dotInactive: {
    width: 5,
    backgroundColor: '#D6D0C5',
  },
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderSolid,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionCount: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.foreground,
  },
  readButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.md,
  },
  readButtonText: {
    fontFamily: fonts.heading,
    fontSize: 17,
    color: '#FFFFFF',
    lineHeight: 19,
  },
});
