import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { X, Send, CornerDownRight } from 'lucide-react-native';
import { colors, fonts, radius } from '../../theme/tokens';
import { AlbumComment, StoryAlbum } from '../../lib/types';
import { fetchComments, addComment } from '../../lib/albumsService';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/Avatar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface CommentsModalProps {
  visible: boolean;
  album: StoryAlbum | null;
  onClose: () => void;
}

export function CommentsModal({ visible, album, onClose }: CommentsModalProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [comments, setComments] = useState<AlbumComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<AlbumComment | null>(null);

  useEffect(() => {
    if (visible && album) {
      loadComments();
    } else {
      setComments([]);
      setText('');
      setReplyTo(null);
    }
  }, [visible, album]);

  const loadComments = async () => {
    if (!album) return;
    setLoading(true);
    try {
      const data = await fetchComments(album.id);
      setComments(data);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!text.trim() || !album || !user) return;
    const content = text.trim();
    setText('');
    const parentId = replyTo ? replyTo.id : null;
    setReplyTo(null);

    await addComment(album.id, user, content, parentId);
    await loadComments();
  };

  const renderCommentItem = ({ item }: { item: AlbumComment }) => (
    <View style={styles.commentRow}>
      <Avatar initials={item.userName.slice(0, 2).toUpperCase()} color={item.userAvatarColor} size={32} />
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentAuthor}>{item.userName}</Text>
          <Text style={styles.commentDate}>{item.createdAt}</Text>
        </View>
        <Text style={styles.commentBody}>{item.content}</Text>

        <TouchableOpacity
          onPress={() => setReplyTo(item)}
          style={styles.replyBtn}
          activeOpacity={0.7}
        >
          <CornerDownRight size={12} color={colors.mutedForeground} />
          <Text style={styles.replyBtnText}>Reply</Text>
        </TouchableOpacity>

        {/* Nested replies */}
        {item.replies && item.replies.length > 0 && (
          <View style={styles.repliesList}>
            {item.replies.map((reply) => (
              <View key={reply.id} style={styles.replyRow}>
                <Avatar
                  initials={reply.userName.slice(0, 2).toUpperCase()}
                  color={reply.userAvatarColor}
                  size={24}
                />
                <View style={styles.commentContent}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.commentAuthor}>{reply.userName}</Text>
                    <Text style={styles.commentDate}>{reply.createdAt}</Text>
                  </View>
                  <Text style={styles.commentBody}>{reply.content}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheet}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Comments</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          {/* List */}
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : comments.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No comments yet</Text>
              <Text style={styles.emptySubtitle}>Be the first to leave a thought on this chapter!</Text>
            </View>
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(item) => item.id}
              renderItem={renderCommentItem}
              contentContainerStyle={styles.listContent}
            />
          )}

          {/* Replying indicator */}
          {replyTo && (
            <View style={styles.replyIndicator}>
              <Text style={styles.replyIndicatorText}>
                Replying to <Text style={{ fontFamily: fonts.bodyBold }}>{replyTo.userName}</Text>
              </Text>
              <TouchableOpacity onPress={() => setReplyTo(null)}>
                <X size={14} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          )}

          {/* Input Box */}
          <View style={[styles.inputBar, { paddingBottom: Math.max(12, insets.bottom) }]}>
            <TextInput
              style={styles.textInput}
              placeholder={replyTo ? `Reply to ${replyTo.userName}...` : "Write a comment..."}
              placeholderTextColor="#9A9489"
              value={text}
              onChangeText={setText}
            />
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!text.trim()}
              style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
              activeOpacity={0.8}
            >
              <Send size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(44, 36, 22, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '45%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSolid,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 24,
    color: colors.foreground,
  },
  closeBtn: {
    padding: 4,
  },
  loadingBox: {
    padding: 30,
    alignItems: 'center',
  },
  emptyBox: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: colors.foreground,
  },
  emptySubtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.mutedForeground,
    marginTop: 4,
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  commentRow: {
    flexDirection: 'row',
    gap: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  commentAuthor: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.foreground,
  },
  commentDate: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.mutedForeground,
  },
  commentBody: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.foreground,
    marginTop: 2,
    lineHeight: 18,
  },
  replyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  replyBtnText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: colors.mutedForeground,
  },
  repliesList: {
    marginTop: 10,
    paddingLeft: 12,
    borderLeftWidth: 1.5,
    borderLeftColor: colors.borderSolid,
    gap: 10,
  },
  replyRow: {
    flexDirection: 'row',
    gap: 8,
  },
  replyIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: colors.inputBackground,
  },
  replyIndicatorText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.mutedForeground,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderSolid,
    backgroundColor: colors.card,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.inputBackground,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.foreground,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});
