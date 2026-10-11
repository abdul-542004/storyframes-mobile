import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  BookOpen,
  Plus,
  Trash2,
  Edit3,
  LogOut,
  Sparkles,
  Layers,
} from 'lucide-react-native';
import { colors, fonts, radius, shadows } from '../../theme/tokens';
import { StoryAlbum, LocalDraft } from '../../lib/types';
import { useAuth } from '../../context/AuthContext';
import { useDrafts } from '../../context/DraftsContext';
import { fetchFeedAlbums, deleteStoryAlbum } from '../../lib/albumsService';
import { Avatar } from '../../components/ui/Avatar';
import { PanelSketch } from '../../components/storyframes/PanelSketch';
import { AppHeader } from '../../components/ui/AppHeader';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 44) / 2;

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { drafts, refreshDrafts, deleteDraft } = useDrafts();
  const [tab, setTab] = useState<'published' | 'drafts'>('published');
  const [userAlbums, setUserAlbums] = useState<StoryAlbum[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadUserAlbums = async () => {
    try {
      const all = await fetchFeedAlbums();
      if (user) {
        setUserAlbums(all.filter((a) => a.author.id === user.id || a.author.name === user.name));
      } else {
        setUserAlbums(all);
      }
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUserAlbums();
    refreshDrafts();
  }, [user]);

  const handleDeleteAlbum = (albumId: string) => {
    Alert.alert('Delete Story', 'Are you sure you want to delete this chapter?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteStoryAlbum(albumId);
          await loadUserAlbums();
        },
      },
    ]);
  };

  const handleDeleteDraft = (draftId: string) => {
    Alert.alert('Delete Draft', 'Remove this draft permanently from your device?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteDraft(draftId);
        },
      },
    ]);
  };

  const handleEditDraft = (draftId: string) => {
    router.push({
      pathname: '/(tabs)/create',
      params: { draftId },
    });
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Do you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/sign-in');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Avatar
              initials={user?.initials || 'SF'}
              color={user?.avatarColor || colors.accent}
              size={64}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{user?.name || 'Storyteller'}</Text>
              <Text style={styles.userHandle}>{user?.username || '@storyteller'}</Text>
              <Text style={styles.userBio}>
                {user?.bio || 'Documenting real chapters with simple sketches.'}
              </Text>
            </View>
          </View>

          {/* Stats & Actions */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userAlbums.length}</Text>
              <Text style={styles.statLabel}>Stories</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{drafts.length}</Text>
              <Text style={styles.statLabel}>Drafts</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user?.followers || 42}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user?.following || 19}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.newStoryBtn}
              onPress={() => router.push('/(tabs)/create')}
              activeOpacity={0.8}
            >
              <Plus size={16} color="#FFFFFF" />
              <Text style={styles.newStoryBtnText}>Draw New Chapter</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.signOutBtn}
              onPress={handleSignOut}
              activeOpacity={0.8}
            >
              <LogOut size={16} color={colors.destructive} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs: Published Stories vs Local SQLite Drafts */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'published' && styles.tabBtnActive]}
            onPress={() => setTab('published')}
            activeOpacity={0.8}
          >
            <BookOpen
              size={16}
              color={tab === 'published' ? colors.primaryForeground : colors.mutedForeground}
            />
            <Text
              style={[
                styles.tabText,
                tab === 'published' && styles.tabTextActive,
              ]}
            >
              Published ({userAlbums.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, tab === 'drafts' && styles.tabBtnActive]}
            onPress={() => setTab('drafts')}
            activeOpacity={0.8}
          >
            <Layers
              size={16}
              color={tab === 'drafts' ? colors.primaryForeground : colors.mutedForeground}
            />
            <Text
              style={[
                styles.tabText,
                tab === 'drafts' && styles.tabTextActive,
              ]}
            >
              Local Drafts ({drafts.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {tab === 'published' ? (
          userAlbums.length === 0 ? (
            <View style={styles.emptyState}>
              <Sparkles size={32} color={colors.mutedForeground} />
              <Text style={styles.emptyTitle}>No stories published yet</Text>
              <Text style={styles.emptySubtitle}>
                Draw your first chapter and share it with the world!
              </Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {userAlbums.map((album) => {
                const firstPanel = album.panels[0];
                return (
                  <TouchableOpacity
                    key={album.id}
                    style={styles.gridCard}
                    onPress={() =>
                      router.push({
                        pathname: '/album/[id]',
                        params: { id: album.id },
                      })
                    }
                    activeOpacity={0.85}
                  >
                    <View style={styles.gridCardPreview}>
                      <PanelSketch
                        id={firstPanel?.sketchId || 'default'}
                        userImageData={firstPanel?.userImageData || firstPanel?.imageUrl}
                      />
                      <TouchableOpacity
                        style={styles.cardDeleteBtn}
                        onPress={() => handleDeleteAlbum(album.id)}
                      >
                        <Trash2 size={14} color={colors.destructive} />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.gridCardTitle} numberOfLines={1}>
                      {album.title}
                    </Text>
                    <Text style={styles.gridCardMeta}>
                      {album.panels.length} panels · {album.date}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )
        ) : drafts.length === 0 ? (
          <View style={styles.emptyState}>
            <Layers size={32} color={colors.mutedForeground} />
            <Text style={styles.emptyTitle}>No offline drafts</Text>
            <Text style={styles.emptySubtitle}>
              Drafts saved to your device's SQLite store appear here.
            </Text>
          </View>
        ) : (
          <View style={styles.draftsList}>
            {drafts.map((d) => (
              <View key={d.id} style={styles.draftCard}>
                <View style={styles.draftInfo}>
                  <Text style={styles.draftTitle}>{d.title}</Text>
                  <Text style={styles.draftMeta}>
                    {d.panels.length} panels · Last modified{' '}
                    {new Date(d.updatedAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.draftActions}>
                  <TouchableOpacity
                    style={styles.draftEditBtn}
                    onPress={() => handleEditDraft(d.id)}
                  >
                    <Edit3 size={16} color={colors.primary} />
                    <Text style={styles.draftEditText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.draftDeleteBtn}
                    onPress={() => handleDeleteDraft(d.id)}
                  >
                    <Trash2 size={16} color={colors.destructive} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSolid,
    padding: 18,
    marginBottom: 20,
    ...shadows.card,
  },
  profileHeader: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontFamily: fonts.bodyBold,
    fontSize: 20,
    color: colors.foreground,
  },
  userHandle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.mutedForeground,
    marginBottom: 4,
  },
  userBio: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.foreground,
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.borderSolid,
    paddingVertical: 14,
    marginVertical: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontFamily: fonts.bodyBold,
    fontSize: 17,
    color: colors.foreground,
  },
  statLabel: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  newStoryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    paddingVertical: 12,
    borderRadius: radius.md,
  },
  newStoryBtnText: {
    fontFamily: fonts.heading,
    fontSize: 18,
    color: '#FFFFFF',
  },
  signOutBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.muted,
  },
  tabBtnActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.mutedForeground,
  },
  tabTextActive: {
    color: colors.primaryForeground,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: fonts.heading,
    fontSize: 22,
    color: colors.foreground,
  },
  emptySubtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridCard: {
    width: CARD_WIDTH,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSolid,
    padding: 8,
    ...shadows.soft,
  },
  gridCardPreview: {
    width: '100%',
    height: 120,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: '#FCFAF6',
    position: 'relative',
  },
  cardDeleteBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridCardTitle: {
    fontFamily: fonts.heading,
    fontSize: 18,
    color: colors.foreground,
    marginTop: 8,
  },
  gridCardMeta: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  draftsList: {
    gap: 10,
  },
  draftCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSolid,
    padding: 14,
    ...shadows.soft,
  },
  draftInfo: {
    flex: 1,
  },
  draftTitle: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: colors.foreground,
  },
  draftMeta: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  draftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  draftEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.inputBackground,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  draftEditText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.primary,
  },
  draftDeleteBtn: {
    padding: 8,
  },
});
