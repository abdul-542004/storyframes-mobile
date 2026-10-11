import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Share,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import {
  X,
  Heart,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Share2,
  Sparkles,
} from 'lucide-react-native';
import * as Sharing from 'expo-sharing';
import { colors, fonts, radius, shadows } from '../../theme/tokens';
import { StoryAlbum } from '../../lib/types';
import {
  fetchAlbumById,
  toggleAlbumLike,
  toggleAlbumSave,
  isAlbumLiked,
  isAlbumSaved,
} from '../../lib/albumsService';
import { PanelSketch } from '../../components/storyframes/PanelSketch';
import { TegakiText } from '../../components/storyframes/TegakiText';
import { Avatar } from '../../components/ui/Avatar';

const { width } = Dimensions.get('window');

export default function AlbumReaderScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [album, setAlbum] = useState<StoryAlbum | null>(null);
  const [loading, setLoading] = useState(true);
  const [panelIndex, setPanelIndex] = useState(0);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (id) {
      loadAlbum(id);
    }
  }, [id]);

  const loadAlbum = async (albumId: string) => {
    try {
      const data = await fetchAlbumById(albumId);
      if (data) {
        setAlbum(data);
        setLiked(isAlbumLiked(data.id));
        setSaved(isAlbumSaved(data.id));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!album) return;
    const next = !liked;
    setLiked(next);
    await toggleAlbumLike(album.id);
  };

  const handleSave = async () => {
    if (!album) return;
    const next = !saved;
    setSaved(next);
    await toggleAlbumSave(album.id);
  };

  const handleShare = async () => {
    if (!album) return;
    const currentPanel = album.panels[panelIndex];
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

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </SafeAreaView>
    );
  }

  if (!album) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.errorText}>Chapter not found</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Text style={styles.closeBtnText}>Return to Explore</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const panels = album.panels || [];
  const currentPanel = panels[panelIndex] || panels[0];
  const isLastPanel = panelIndex === panels.length - 1;

  const goToPrev = () => {
    setPanelIndex((idx) => Math.max(0, idx - 1));
  };

  const goToNext = () => {
    setPanelIndex((idx) => Math.min(panels.length - 1, idx + 1));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerIconBtn}
          activeOpacity={0.8}
        >
          <X size={20} color={colors.foreground} />
        </TouchableOpacity>

        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {album.title}
          </Text>
          <View style={styles.authorRow}>
            <Avatar
              initials={album.author.initials}
              color={album.author.avatarColor}
              size={18}
            />
            <Text style={styles.authorName}>{album.author.name}</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={handleLike}
            style={styles.headerIconBtn}
            activeOpacity={0.8}
          >
            <Heart
              size={18}
              color={liked ? colors.blush : colors.foreground}
              fill={liked ? colors.blush : 'none'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSave}
            style={styles.headerIconBtn}
            activeOpacity={0.8}
          >
            <Bookmark
              size={18}
              color={saved ? colors.mustard : colors.foreground}
              fill={saved ? colors.mustard : 'none'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleShare}
            style={styles.headerIconBtn}
            activeOpacity={0.8}
          >
            <Share2 size={18} color={colors.foreground} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress Bars */}
      <View style={styles.progressRow}>
        {panels.map((_, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => setPanelIndex(i)}
            style={[
              styles.progressBar,
              {
                backgroundColor:
                  i === panelIndex
                    ? album.accentColor
                    : i < panelIndex
                    ? `${album.accentColor}60`
                    : colors.muted,
              },
            ]}
          />
        ))}
      </View>

      {/* Main Reader View */}
      <View style={styles.readerBody}>
        {/* Panel Sketch Image Frame */}
        <View
          style={[
            styles.sketchFrame,
            { borderColor: `${album.accentColor}40` },
          ]}
        >
          <PanelSketch
            id={currentPanel.sketchId}
            userImageData={currentPanel.userImageData || currentPanel.imageUrl}
          />

          <View
            style={[
              styles.panelBadge,
              { backgroundColor: album.accentColor },
            ]}
          >
            <Text style={styles.panelBadgeText}>
              {panelIndex + 1} / {panels.length}
            </Text>
          </View>
        </View>

        {/* Panel Caption Section with Tegaki Text Animation */}
        <View style={styles.captionSection}>
          <View
            style={[
              styles.panelTag,
              { backgroundColor: `${album.accentColor}25` },
            ]}
          >
            <Text style={[styles.panelTagText, { color: album.accentColor }]}>
              Panel {panelIndex + 1}
            </Text>
          </View>

          {/* Tegaki Handwriting Text Animation */}
          <TegakiText
            key={`tegaki-${album.id}-${panelIndex}`}
            text={currentPanel.caption}
            fontSize={22}
            duration={Math.min(3000, 700 + currentPanel.caption.length * 25)}
            color={colors.foreground}
          />

          {/* End of chapter box if on last panel */}
          {isLastPanel && (
            <View
              style={[
                styles.endCard,
                {
                  backgroundColor: `${album.accentColor}18`,
                  borderColor: `${album.accentColor}35`,
                },
              ]}
            >
              <View style={styles.endCardHeader}>
                <Sparkles size={16} color={album.accentColor} />
                <Text style={styles.endTitle}>End of "{album.title}"</Text>
              </View>
              <Text style={styles.endMeta}>
                Drawn by {album.author.name} · {album.date}
              </Text>
            </View>
          )}
        </View>

        {/* Navigation Bar */}
        <View style={[styles.navBar, { paddingBottom: Math.max(16, insets.bottom) }]}>
          <TouchableOpacity
            style={[styles.navBtn, panelIndex === 0 && styles.navBtnDisabled]}
            onPress={goToPrev}
            disabled={panelIndex === 0}
            activeOpacity={0.8}
          >
            <ChevronLeft
              size={20}
              color={panelIndex === 0 ? '#B5AFA6' : colors.foreground}
            />
            <Text
              style={[
                styles.navBtnText,
                panelIndex === 0 && { color: '#B5AFA6' },
              ]}
            >
              Previous
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navBtn, isLastPanel ? styles.finishBtn : styles.nextBtn]}
            onPress={isLastPanel ? () => router.back() : goToNext}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.navBtnText,
                isLastPanel ? styles.finishBtnText : styles.nextBtnText,
              ]}
            >
              {isLastPanel ? 'Finished' : 'Next'}
            </Text>
            <ChevronRight
              size={20}
              color={isLastPanel ? '#FFFFFF' : '#FFFFFF'}
            />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontFamily: fonts.heading,
    fontSize: 24,
    color: colors.foreground,
    marginBottom: 12,
  },
  closeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  closeBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSolid,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleBox: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  headerTitle: {
    fontFamily: fonts.heading,
    fontSize: 22,
    color: colors.foreground,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  authorName: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.mutedForeground,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 6,
  },
  progressRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  readerBody: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  sketchFrame: {
    width: '100%',
    height: width * 0.72,
    maxHeight: 320,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    position: 'relative',
    marginTop: 10,
    ...shadows.card,
  },
  panelBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  panelBadgeText: {
    fontFamily: fonts.heading,
    fontSize: 14,
    color: '#FFFFFF',
  },
  captionSection: {
    flex: 1,
    paddingVertical: 14,
    justifyContent: 'flex-start',
  },
  panelTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    marginBottom: 6,
  },
  panelTagText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
  },
  endCard: {
    marginTop: 14,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  endCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  endTitle: {
    fontFamily: fonts.heading,
    fontSize: 18,
    color: colors.foreground,
  },
  endMeta: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderSolid,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.inputBackground,
  },
  navBtnDisabled: {
    opacity: 0.4,
  },
  navBtnText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.foreground,
  },
  nextBtn: {
    backgroundColor: colors.primary,
  },
  nextBtnText: {
    color: '#FFFFFF',
  },
  finishBtn: {
    backgroundColor: colors.accent,
  },
  finishBtnText: {
    color: '#FFFFFF',
    fontFamily: fonts.heading,
    fontSize: 18,
  },
});
