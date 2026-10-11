import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Check,
  Save,
  Sparkles,
} from 'lucide-react-native';
import { colors, fonts, radius, shadows } from '../../theme/tokens';
import { StoryAlbum, StoryPanel, LocalDraft } from '../../lib/types';
import { TouchCanvas, TouchCanvasRef } from '../../components/canvas/TouchCanvas';
import { PanelSketch } from '../../components/storyframes/PanelSketch';
import { useAuth } from '../../context/AuthContext';
import { useDrafts } from '../../context/DraftsContext';
import { publishStoryAlbum } from '../../lib/albumsService';
import { savePanelImageLocally, uploadPanelImage } from '../../lib/storage';

type Step = 'name' | 'panels' | 'reorder' | 'review';

const ACCENTS = ['#7A9E87', '#E8A2A2', '#E8C547', '#6C8EA4', '#A084CA'];

export default function CreateScreen() {
  const { user } = useAuth();
  const { createDraft, updateDraft, getDraft, deleteDraft } = useDrafts();
  const params = useLocalSearchParams<{ draftId?: string }>();

  const [step, setStep] = useState<Step>('name');
  const [draftId, setDraftId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [teaser, setTeaser] = useState('');
  const [accent, setAccent] = useState(ACCENTS[0]);

  const [panels, setPanels] = useState<StoryPanel[]>([
    {
      id: 'p-init-0',
      sketchId: '__user__',
      caption: '',
    },
  ]);
  const [activePanelIdx, setActivePanelIdx] = useState(0);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const canvasRef = useRef<TouchCanvasRef>(null);

  // Load existing draft if draftId param provided
  useEffect(() => {
    if (params.draftId) {
      loadExistingDraft(params.draftId);
    }
  }, [params.draftId]);

  const loadExistingDraft = async (id: string) => {
    const existing = await getDraft(id);
    if (existing) {
      setDraftId(existing.id);
      setTitle(existing.title);
      setTeaser(existing.teaser);
      setAccent(existing.accentColor);
      if (existing.panels.length > 0) {
        setPanels(existing.panels);
      }
    }
  };

  const activePanel = panels[activePanelIdx];

  const handleSaveCurrentCanvas = async () => {
    if (!canvasRef.current) return;
    try {
      const base64 = await canvasRef.current.exportImage();
      const strokeData = canvasRef.current.getStrokeData();
      const localUri = await savePanelImageLocally(base64, activePanel.id);

      setPanels((prev) =>
        prev.map((p, idx) =>
          idx === activePanelIdx
            ? { ...p, userImageData: localUri, imageUrl: localUri, strokeData }
            : p
        )
      );
    } catch (e) {
      console.warn('Save canvas failed:', e);
    }
  };

  const handleAddPanel = async () => {
    await handleSaveCurrentCanvas();
    const newPanel: StoryPanel = {
      id: `p-${Date.now()}-${panels.length}`,
      sketchId: '__user__',
      caption: '',
    };
    setPanels((prev) => [...prev, newPanel]);
    setActivePanelIdx(panels.length);
  };

  const handleRemovePanel = (idx: number) => {
    if (panels.length === 1) {
      Alert.alert('Notice', 'A chapter must have at least one panel.');
      return;
    }
    setPanels((prev) => prev.filter((_, i) => i !== idx));
    setActivePanelIdx((curr) => Math.max(0, Math.min(idx, panels.length - 2)));
  };

  const handleMovePanel = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= panels.length) return;
    const reordered = [...panels];
    const temp = reordered[idx];
    reordered[idx] = reordered[targetIdx];
    reordered[targetIdx] = temp;
    setPanels(reordered);
    if (activePanelIdx === idx) setActivePanelIdx(targetIdx);
    else if (activePanelIdx === targetIdx) setActivePanelIdx(idx);
  };

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    try {
      await handleSaveCurrentCanvas();
      const now = new Date().toISOString();
      const id = draftId || `draft_${Date.now()}`;
      setDraftId(id);

      const draftObj: LocalDraft = {
        id,
        title: title || 'Untitled Story',
        teaser,
        accentColor: accent,
        createdAt: now,
        updatedAt: now,
        panels,
      };

      await updateDraft(draftObj);
      Alert.alert('Draft Saved', 'Your work is saved locally in SQLite.');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please give your chapter a title.');
      return;
    }

    setIsPublishing(true);
    try {
      await handleSaveCurrentCanvas();

      // Process panels and upload images
      const finalPanels: StoryPanel[] = [];
      for (const p of panels) {
        let finalImageUrl = p.imageUrl || p.userImageData;
        if (finalImageUrl && user) {
          finalImageUrl = await uploadPanelImage(finalImageUrl, user.id, p.id);
        }
        finalPanels.push({
          ...p,
          imageUrl: finalImageUrl,
          userImageData: finalImageUrl,
        });
      }

      const albumId = `album_${Date.now()}`;
      const newAlbum: StoryAlbum = {
        id: albumId,
        title: title.trim(),
        teaser: teaser.trim() || 'A story drawn from life.',
        accentColor: accent,
        author: user || {
          id: 'user_anonymous',
          name: 'Storyteller',
          username: '@storyteller',
          avatarColor: accent,
          initials: 'ST',
        },
        panels: finalPanels,
        likes: 0,
        comments: 0,
        saves: 0,
        date: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
      };

      await publishStoryAlbum(newAlbum);

      if (draftId) {
        await deleteDraft(draftId);
      }

      Alert.alert('Published! ✨', 'Your chapter is now live on the Explore feed.', [
        {
          text: 'View Stories',
          onPress: () => router.replace('/(tabs)'),
        },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to publish album.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              if (step === 'review') setStep('reorder');
              else if (step === 'reorder') setStep('panels');
              else if (step === 'panels') setStep('name');
              else router.back();
            }}
          >
            <ArrowLeft size={20} color={colors.foreground} />
          </TouchableOpacity>

          {/* Stepper Dots */}
          <View style={styles.stepper}>
            {(['name', 'panels', 'reorder', 'review'] as Step[]).map((s, idx) => (
              <View
                key={s}
                style={[
                  styles.stepDot,
                  step === s && styles.stepDotActive,
                  ['name', 'panels', 'reorder', 'review'].indexOf(step) >= idx &&
                    styles.stepDotPassed,
                ]}
              />
            ))}
          </View>

          {/* Save Draft Button */}
          <TouchableOpacity
            style={styles.saveDraftBtn}
            onPress={handleSaveDraft}
            disabled={isSavingDraft}
          >
            {isSavingDraft ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <>
                <Save size={16} color={colors.accent} />
                <Text style={styles.saveDraftText}>Draft</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* STEP 1: Name & Mood */}
          {step === 'name' && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Chapter Details 📖</Text>
              <Text style={styles.stepSubtitle}>
                Give this memory a name and choose an accent color.
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Title</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. The Rainy Tuesday Coffee"
                  placeholderTextColor="#9A9489"
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Teaser / Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="What is this chapter about in a few words?"
                  placeholderTextColor="#9A9489"
                  value={teaser}
                  onChangeText={setTeaser}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Accent Mood Color</Text>
                <View style={styles.colorRow}>
                  {ACCENTS.map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[
                        styles.accentCircle,
                        { backgroundColor: c },
                        accent === c && styles.accentCircleActive,
                      ]}
                      onPress={() => setAccent(c)}
                    >
                      {accent === c && <Check size={18} color="#FFFFFF" />}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, !title.trim() && styles.disabledBtn]}
                disabled={!title.trim()}
                onPress={() => setStep('panels')}
              >
                <Text style={styles.primaryBtnText}>Continue to Draw</Text>
                <ArrowRight size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: Panels & Drawing */}
          {step === 'panels' && (
            <View style={styles.stepContainer}>
              <View style={styles.panelNavRow}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {panels.map((p, idx) => (
                    <TouchableOpacity
                      key={p.id}
                      style={[
                        styles.panelTab,
                        activePanelIdx === idx && styles.panelTabActive,
                      ]}
                      onPress={async () => {
                        await handleSaveCurrentCanvas();
                        setActivePanelIdx(idx);
                      }}
                    >
                      <Text
                        style={[
                          styles.panelTabText,
                          activePanelIdx === idx && styles.panelTabTextActive,
                        ]}
                      >
                        Panel {idx + 1}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <TouchableOpacity style={styles.addPanelBtn} onPress={handleAddPanel}>
                  <Plus size={16} color="#FFFFFF" />
                  <Text style={styles.addPanelBtnText}>Add</Text>
                </TouchableOpacity>
              </View>

              {/* Touch Canvas */}
              <TouchCanvas
                ref={canvasRef}
                key={activePanel?.id}
                initialStrokeData={activePanel?.strokeData}
                onStrokesChange={(data) => {
                  setPanels((prev) =>
                    prev.map((p, idx) =>
                      idx === activePanelIdx ? { ...p, strokeData: data } : p
                    )
                  );
                }}
                height={280}
              />

              {/* Caption Input */}
              <View style={[styles.inputGroup, { marginTop: 14 }]}>
                <Text style={styles.label}>Panel {activePanelIdx + 1} Caption</Text>
                <TextInput
                  style={[styles.input, styles.captionInput]}
                  placeholder="Write the handwritten line for this moment..."
                  placeholderTextColor="#9A9489"
                  value={activePanel?.caption || ''}
                  onChangeText={(cap) => {
                    setPanels((prev) =>
                      prev.map((p, idx) =>
                        idx === activePanelIdx ? { ...p, caption: cap } : p
                      )
                    );
                  }}
                  multiline
                />
              </View>

              {/* Navigation Next */}
              <View style={styles.navButtonsRow}>
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => setStep('name')}
                >
                  <ArrowLeft size={16} color={colors.foreground} />
                  <Text style={styles.secondaryBtnText}>Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={async () => {
                    await handleSaveCurrentCanvas();
                    setStep('reorder');
                  }}
                >
                  <Text style={styles.primaryBtnText}>Review & Order</Text>
                  <ArrowRight size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 3: Reorder Panels */}
          {step === 'reorder' && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Reorder Panels 🔄</Text>
              <Text style={styles.stepSubtitle}>
                Arrange your story chapters in reading sequence.
              </Text>

              {panels.map((p, idx) => (
                <View key={p.id} style={styles.reorderCard}>
                  <View style={styles.reorderPreview}>
                    <PanelSketch
                      id={p.sketchId}
                      userImageData={p.userImageData || p.imageUrl}
                    />
                  </View>

                  <View style={styles.reorderContent}>
                    <Text style={styles.reorderNumber}>Panel {idx + 1}</Text>
                    <Text style={styles.reorderCaption} numberOfLines={2}>
                      {p.caption || 'No caption entered'}
                    </Text>
                  </View>

                  <View style={styles.reorderActions}>
                    <TouchableOpacity
                      onPress={() => handleMovePanel(idx, 'up')}
                      disabled={idx === 0}
                      style={[styles.moveBtn, idx === 0 && styles.disabledMove]}
                    >
                      <ChevronUp size={18} color={colors.foreground} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleMovePanel(idx, 'down')}
                      disabled={idx === panels.length - 1}
                      style={[
                        styles.moveBtn,
                        idx === panels.length - 1 && styles.disabledMove,
                      ]}
                    >
                      <ChevronDown size={18} color={colors.foreground} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleRemovePanel(idx)}
                      style={styles.deleteBtn}
                    >
                      <Trash2 size={16} color={colors.destructive} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              <View style={styles.navButtonsRow}>
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => setStep('panels')}
                >
                  <ArrowLeft size={16} color={colors.foreground} />
                  <Text style={styles.secondaryBtnText}>Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={() => setStep('review')}
                >
                  <Text style={styles.primaryBtnText}>Final Review</Text>
                  <ArrowRight size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 4: Review & Publish */}
          {step === 'review' && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Ready to Publish ✨</Text>
              <Text style={styles.stepSubtitle}>
                Review your finished story before sharing it with the world.
              </Text>

              <View style={styles.reviewSummaryCard}>
                <Text style={styles.reviewTitle}>{title}</Text>
                {!!teaser && <Text style={styles.reviewTeaser}>{teaser}</Text>}
                <Text style={styles.reviewPanelsCount}>
                  {panels.length} {panels.length === 1 ? 'panel' : 'panels'} in this chapter
                </Text>
              </View>

              {/* Panel Thumbnails */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbScroll}>
                {panels.map((p, idx) => (
                  <View key={p.id} style={styles.thumbCard}>
                    <View style={styles.thumbImage}>
                      <PanelSketch
                        id={p.sketchId}
                        userImageData={p.userImageData || p.imageUrl}
                      />
                    </View>
                    <Text style={styles.thumbLabel}>Panel {idx + 1}</Text>
                    <Text style={styles.thumbCaption} numberOfLines={2}>
                      {p.caption}
                    </Text>
                  </View>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={[styles.publishBtn, isPublishing && styles.disabledBtn]}
                onPress={handlePublish}
                disabled={isPublishing}
                activeOpacity={0.85}
              >
                {isPublishing ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Sparkles size={20} color="#FFFFFF" />
                    <Text style={styles.publishBtnText}>Publish Chapter</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSolid,
  },
  backBtn: {
    padding: 6,
  },
  stepper: {
    flexDirection: 'row',
    gap: 6,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.muted,
  },
  stepDotActive: {
    width: 20,
    backgroundColor: colors.primary,
  },
  stepDotPassed: {
    backgroundColor: colors.accent,
  },
  saveDraftBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
    backgroundColor: colors.inputBackground,
  },
  saveDraftText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.accent,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  stepContainer: {
    gap: 12,
  },
  stepTitle: {
    fontFamily: fonts.heading,
    fontSize: 32,
    color: colors.foreground,
    lineHeight: 36,
  },
  stepSubtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.mutedForeground,
    marginBottom: 8,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.foreground,
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.borderSolid,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: fonts.body,
    color: colors.foreground,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  captionInput: {
    fontFamily: fonts.caption,
    fontSize: 18,
    lineHeight: 22,
    height: 64,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 4,
  },
  accentCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accentCircleActive: {
    borderWidth: 3,
    borderColor: colors.foreground,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    marginTop: 10,
    flex: 1,
  },
  primaryBtnText: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: '#FFFFFF',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.inputBackground,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginTop: 10,
  },
  secondaryBtnText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.foreground,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  panelNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  panelTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: colors.muted,
    marginRight: 6,
  },
  panelTabActive: {
    backgroundColor: colors.primary,
  },
  panelTabText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.mutedForeground,
  },
  panelTabTextActive: {
    color: colors.primaryForeground,
  },
  addPanelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  addPanelBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  navButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  reorderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSolid,
    padding: 10,
    gap: 12,
    marginBottom: 8,
    ...shadows.soft,
  },
  reorderPreview: {
    width: 64,
    height: 64,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: '#FCFAF6',
    borderWidth: 1,
    borderColor: colors.borderSolid,
  },
  reorderContent: {
    flex: 1,
  },
  reorderNumber: {
    fontFamily: fonts.heading,
    fontSize: 18,
    color: colors.foreground,
  },
  reorderCaption: {
    fontFamily: fonts.caption,
    fontSize: 14,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  reorderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  moveBtn: {
    padding: 6,
    borderRadius: radius.sm,
    backgroundColor: colors.inputBackground,
  },
  disabledMove: {
    opacity: 0.3,
  },
  deleteBtn: {
    padding: 6,
    marginLeft: 4,
  },
  reviewSummaryCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSolid,
    padding: 16,
    gap: 6,
    ...shadows.card,
  },
  reviewTitle: {
    fontFamily: fonts.heading,
    fontSize: 28,
    color: colors.foreground,
  },
  reviewTeaser: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.mutedForeground,
  },
  reviewPanelsCount: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.accent,
    marginTop: 4,
  },
  thumbScroll: {
    marginVertical: 12,
  },
  thumbCard: {
    width: 150,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSolid,
    padding: 8,
    marginRight: 10,
    gap: 4,
    ...shadows.sm,
  },
  thumbImage: {
    width: '100%',
    height: 110,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: '#FCFAF6',
  },
  thumbLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.foreground,
    marginTop: 4,
  },
  thumbCaption: {
    fontFamily: fonts.caption,
    fontSize: 13,
    color: colors.mutedForeground,
  },
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 16,
    marginTop: 16,
    ...shadows.raised,
  },
  publishBtnText: {
    fontFamily: fonts.heading,
    fontSize: 24,
    color: '#FFFFFF',
  },
});
