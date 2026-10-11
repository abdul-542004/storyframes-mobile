import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookOpen, Plus, Sparkles } from 'lucide-react-native';
import { router } from 'expo-router';
import { colors, fonts, radius } from '../../theme/tokens';
import { StoryAlbum } from '../../lib/types';
import {
  fetchFeedAlbums,
  isAlbumLiked,
  isAlbumSaved,
} from '../../lib/albumsService';
import { AlbumCard } from '../../components/storyframes/AlbumCard';
import { AppHeader } from '../../components/ui/AppHeader';

type FilterType = 'all' | 'liked' | 'saved';

export default function ExploreFeedScreen() {
  const [albums, setAlbums] = useState<StoryAlbum[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  const loadFeed = useCallback(async () => {
    try {
      const data = await fetchFeedAlbums();
      setAlbums(data);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const onRefresh = () => {
    setRefreshing(true);
    loadFeed();
  };

  const filteredAlbums = albums.filter((a) => {
    if (filter === 'liked') return isAlbumLiked(a.id);
    if (filter === 'saved') return isAlbumSaved(a.id);
    return true;
  });

  const renderHeader = () => (
    <View style={styles.feedHeader}>
      <View style={styles.titleRow}>
        <Text style={styles.feedTitle}>Stories ✨</Text>
        <Text style={styles.feedSubtitle}>Real moments, drawn simply.</Text>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        {(
          [
            { id: 'all', label: 'All stories' },
            { id: 'liked', label: '❤ Liked' },
            { id: 'saved', label: '🔖 Saved' },
          ] as const
        ).map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.filterChip,
              filter === item.id && styles.filterChipActive,
            ]}
            onPress={() => setFilter(item.id)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterText,
                filter === item.id && styles.filterTextActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconBox}>
        {filter === 'all' ? (
          <BookOpen size={28} color={colors.mutedForeground} />
        ) : (
          <Sparkles size={28} color={colors.mutedForeground} />
        )}
      </View>
      <Text style={styles.emptyTitle}>
        {filter === 'all'
          ? 'No stories published yet'
          : filter === 'liked'
          ? 'No liked stories yet'
          : 'No saved stories yet'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {filter === 'all'
          ? 'Be the first to draw a chapter and publish it.'
          : filter === 'liked'
          ? 'Tap the heart icon on any story to see it here.'
          : 'Bookmark stories you love to find them later.'}
      </Text>
      {filter === 'all' && (
        <TouchableOpacity
          style={styles.emptyCreateBtn}
          onPress={() => router.push('/(tabs)/create')}
          activeOpacity={0.85}
        >
          <Plus size={18} color="#FFFFFF" />
          <Text style={styles.emptyCreateBtnText}>Draw a story</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderFooter = () => (
    <View style={styles.footerContainer}>
      <Text style={styles.footerNote}>∿ you've seen all stories for now ∿</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <AppHeader />
      <FlatList
        data={filteredAlbums}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AlbumCard album={item} onRefresh={loadFeed} />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={filteredAlbums.length > 0 ? renderFooter : null}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  feedHeader: {
    paddingTop: 16,
    paddingBottom: 14,
  },
  titleRow: {
    marginBottom: 14,
  },
  feedTitle: {
    fontFamily: fonts.heading,
    fontSize: 34,
    color: colors.foreground,
    lineHeight: 38,
  },
  feedSubtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.mutedForeground,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: colors.muted,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.mutedForeground,
  },
  filterTextActive: {
    color: colors.primaryForeground,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIconBox: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: fonts.heading,
    fontSize: 24,
    color: colors.foreground,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  emptyCreateBtnText: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: '#FFFFFF',
  },
  footerContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  footerNote: {
    fontFamily: fonts.heading,
    fontSize: 16,
    color: colors.mutedForeground,
    opacity: 0.7,
  },
});
