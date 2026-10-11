import { Stroke, StrokePoint } from '../../src/lib/types';

describe('U03 & U04: Touch Canvas Stroke Math & History Management', () => {
  // Stroke processing helpers mirroring TouchCanvas
  function normalizePoint(pt: StrokePoint, bounds: { width: number; height: number }): StrokePoint {
    const clampedX = Math.max(0, Math.min(pt.x, bounds.width));
    const clampedY = Math.max(0, Math.min(pt.y, bounds.height));
    return {
      x: Math.round(clampedX * 100) / 100,
      y: Math.round(clampedY * 100) / 100,
    };
  }

  function calculateDistance(p1: StrokePoint, p2: StrokePoint): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  class CanvasHistoryManager {
    private strokes: Stroke[] = [];
    private redoStack: Stroke[] = [];

    push(stroke: Stroke) {
      this.strokes.push(stroke);
      this.redoStack = []; // Clear redo stack on new action
    }

    undo(): Stroke | undefined {
      const popped = this.strokes.pop();
      if (popped) {
        this.redoStack.push(popped);
      }
      return popped;
    }

    redo(): Stroke | undefined {
      const redone = this.redoStack.pop();
      if (redone) {
        this.strokes.push(redone);
      }
      return redone;
    }

    clear() {
      this.strokes = [];
      this.redoStack = [];
    }

    getStrokes(): Stroke[] {
      return [...this.strokes];
    }

    canUndo(): boolean {
      return this.strokes.length > 0;
    }

    canRedo(): boolean {
      return this.redoStack.length > 0;
    }
  }

  describe('U03: Stroke Point Normalization & Bounds Clamping', () => {
    const bounds = { width: 300, height: 300 };

    it('clamps negative coordinates within canvas boundary', () => {
      const pt: StrokePoint = { x: -15, y: -5 };
      const normalized = normalizePoint(pt, bounds);
      expect(normalized.x).toBe(0);
      expect(normalized.y).toBe(0);
    });

    it('clamps overflow coordinates exceeding canvas dimensions', () => {
      const pt: StrokePoint = { x: 350, y: 400 };
      const normalized = normalizePoint(pt, bounds);
      expect(normalized.x).toBe(300);
      expect(normalized.y).toBe(300);
    });

    it('computes accurate Euclidean distance between consecutive points', () => {
      const p1: StrokePoint = { x: 0, y: 0 };
      const p2: StrokePoint = { x: 3, y: 4 };
      expect(calculateDistance(p1, p2)).toBe(5);
    });
  });

  describe('U04: Undo / Redo History Stack Management', () => {
    let history: CanvasHistoryManager;

    beforeEach(() => {
      history = new CanvasHistoryManager();
    });

    it('correctly tracks stroke additions and undo eligibility', () => {
      expect(history.canUndo()).toBe(false);
      expect(history.canRedo()).toBe(false);

      const stroke1: Stroke = {
        points: [{ x: 10, y: 10 }, { x: 20, y: 20 }],
        color: '#2D3142',
        size: 3,
      };
      history.push(stroke1);

      expect(history.canUndo()).toBe(true);
      expect(history.getStrokes().length).toBe(1);
    });

    it('reverts the last stroke on undo and enables redo', () => {
      const stroke1: Stroke = { points: [{ x: 5, y: 5 }], color: '#2D3142', size: 3 };
      const stroke2: Stroke = { points: [{ x: 15, y: 15 }], color: '#C86D51', size: 6 };

      history.push(stroke1);
      history.push(stroke2);
      expect(history.getStrokes().length).toBe(2);

      const undone = history.undo();
      expect(undone).toEqual(stroke2);
      expect(history.getStrokes().length).toBe(1);
      expect(history.canRedo()).toBe(true);

      const redone = history.redo();
      expect(redone).toEqual(stroke2);
      expect(history.getStrokes().length).toBe(2);
      expect(history.canRedo()).toBe(false);
    });

    it('invalidates redo stack when a new stroke is drawn after undo', () => {
      const stroke1: Stroke = { points: [{ x: 5, y: 5 }], color: '#2D3142', size: 3 };
      const stroke2: Stroke = { points: [{ x: 15, y: 15 }], color: '#C86D51', size: 6 };
      const stroke3: Stroke = { points: [{ x: 25, y: 25 }], color: '#7A9E87', size: 4 };

      history.push(stroke1);
      history.push(stroke2);
      history.undo(); // stroke2 in redo stack
      expect(history.canRedo()).toBe(true);

      history.push(stroke3); // should clear redo stack
      expect(history.canRedo()).toBe(false);
      expect(history.getStrokes().length).toBe(2);
      expect(history.getStrokes()).toEqual([stroke1, stroke3]);
    });

    it('clears all history on canvas reset', () => {
      history.push({ points: [{ x: 0, y: 0 }], color: '#000', size: 2 });
      history.clear();
      expect(history.getStrokes().length).toBe(0);
      expect(history.canUndo()).toBe(false);
      expect(history.canRedo()).toBe(false);
    });
  });
});
