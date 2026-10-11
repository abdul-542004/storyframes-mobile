import { StoryPanel } from '../../src/lib/types';

describe('U05 & U06: Panel Captions & Tegaki Handwriting Timings', () => {
  // Panel constraints
  const MAX_CAPTION_LENGTH = 300;

  function validatePanel(panel: Partial<StoryPanel>): { valid: boolean; error?: string } {
    if (!panel.id) return { valid: false, error: 'Panel ID is required' };
    if (!panel.sketchId && !panel.strokeData && !panel.userImageData && !panel.imageUrl) {
      return { valid: false, error: 'Panel must have a visual representation' };
    }
    if (panel.caption && panel.caption.length > MAX_CAPTION_LENGTH) {
      return { valid: false, error: `Caption exceeds max length of ${MAX_CAPTION_LENGTH}` };
    }
    return { valid: true };
  }

  // Tegaki animation timing calculator
  function computeTegakiAnimationTiming(text: string, baseSpeedMsPerChar: number = 28): {
    totalDurationMs: number;
    charDelayMs: number;
    glyphCount: number;
  } {
    const glyphCount = text.length;
    const clampedSpeed = Math.max(15, Math.min(baseSpeedMsPerChar, 60));
    const totalDurationMs = glyphCount * clampedSpeed;
    return {
      totalDurationMs,
      charDelayMs: clampedSpeed,
      glyphCount,
    };
  }

  describe('U05: Story Panel Content Validation', () => {
    it('accepts valid panels with captions within character limit', () => {
      const panel: StoryPanel = {
        id: 'panel_1',
        sketchId: 'coffee-cup',
        caption: 'A fresh cup of coffee to start the morning journey.',
      };
      expect(validatePanel(panel).valid).toBe(true);
    });

    it('accepts panels with custom Skia strokeData or userImageData', () => {
      const customPanel: StoryPanel = {
        id: 'panel_custom',
        sketchId: '__user__',
        caption: 'Hand drawn sketch',
        strokeData: JSON.stringify([{ points: [{ x: 1, y: 1 }], color: '#000', size: 2 }]),
      };
      expect(validatePanel(customPanel).valid).toBe(true);
    });

    it('rejects captions that exceed 300 characters', () => {
      const longText = 'A'.repeat(301);
      const invalidPanel: StoryPanel = {
        id: 'panel_overflow',
        sketchId: 'sample',
        caption: longText,
      };
      const result = validatePanel(invalidPanel);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Caption exceeds max length');
    });

    it('rejects panels lacking both sketchId and visual data', () => {
      const emptyPanel: Partial<StoryPanel> = {
        id: 'panel_empty',
        caption: 'No image or sketch attached',
      };
      expect(validatePanel(emptyPanel).valid).toBe(false);
    });
  });

  describe('U06: Tegaki Handwriting Animation Timing', () => {
    it('computes proportional duration according to caption length', () => {
      const shortText = 'Hello!';
      const shortTiming = computeTegakiAnimationTiming(shortText);
      expect(shortTiming.glyphCount).toBe(6);
      expect(shortTiming.totalDurationMs).toBe(6 * 28);

      const longerText = 'A brisk autumn morning in the coffee shop.';
      const longerTiming = computeTegakiAnimationTiming(longerText);
      expect(longerTiming.glyphCount).toBe(42);
      expect(longerTiming.totalDurationMs).toBe(42 * 28);
    });

    it('clamps speed boundaries to prevent stutter or flash', () => {
      const fastTiming = computeTegakiAnimationTiming('Sample', 5); // Below min
      expect(fastTiming.charDelayMs).toBe(15);

      const slowTiming = computeTegakiAnimationTiming('Sample', 100); // Above max
      expect(slowTiming.charDelayMs).toBe(60);
    });
  });
});
