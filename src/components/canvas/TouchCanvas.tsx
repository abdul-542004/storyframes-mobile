import React, { useState, useRef, useImperativeHandle, forwardRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
} from 'react-native';
import {
  Canvas,
  Path,
  Skia,
  SkPath,
  useCanvasRef,
} from '@shopify/react-native-skia';
import { Undo2, Redo2, RotateCcw, Paintbrush, Eraser } from 'lucide-react-native';
import { colors, fonts, radius, shadows } from '../../theme/tokens';
import { Stroke, StrokePoint } from '../../lib/types';

export interface TouchCanvasRef {
  exportImage: () => Promise<string>;
  getStrokeData: () => string;
  setStrokeData: (data: string) => void;
  clear: () => void;
}

interface TouchCanvasProps {
  initialStrokeData?: string;
  onStrokesChange?: (strokeData: string) => void;
  height?: number;
}

const PALETTE = [
  '#2C2416', // Charcoal
  '#7A9E87', // Sage
  '#E8A2A2', // Blush
  '#E8C547', // Mustard
  '#6C8EA4', // Denim
  '#A084CA', // Lavender
  '#8B5E3C', // Warm Brown
];

const BRUSH_SIZES = [
  { label: 'Fine', size: 2.5 },
  { label: 'Medium', size: 5 },
  { label: 'Thick', size: 10 },
  { label: 'Bold', size: 18 },
];

export const TouchCanvas = forwardRef<TouchCanvasRef, TouchCanvasProps>(
  ({ initialStrokeData, onStrokesChange, height = 340 }, ref) => {
    const canvasRef = useCanvasRef();

    const [strokes, setStrokes] = useState<Stroke[]>(() => {
      if (initialStrokeData) {
        try {
          return JSON.parse(initialStrokeData);
        } catch {
          return [];
        }
      }
      return [];
    });

    const [redoStack, setRedoStack] = useState<Stroke[]>([]);
    const [currentColor, setCurrentColor] = useState(PALETTE[0]);
    const [currentSize, setCurrentSize] = useState(5);
    const [isEraser, setIsEraser] = useState(false);
    const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);

    // Convert Stroke array to Skia Path objects
    const renderedPaths = useMemo(() => {
      return strokes.map((s) => {
        const path = Skia.Path.Make();
        if (s.points.length > 0) {
          path.moveTo(s.points[0].x, s.points[0].y);
          for (let i = 1; i < s.points.length; i++) {
            path.lineTo(s.points[i].x, s.points[i].y);
          }
        }
        return {
          path,
          color: s.isEraser ? '#FFFFFF' : s.color,
          size: s.size,
        };
      });
    }, [strokes]);

    // Active in-progress stroke path
    const activePath = useMemo(() => {
      if (!currentStroke || currentStroke.points.length === 0) return null;
      const path = Skia.Path.Make();
      path.moveTo(currentStroke.points[0].x, currentStroke.points[0].y);
      for (let i = 1; i < currentStroke.points.length; i++) {
        path.lineTo(currentStroke.points[i].x, currentStroke.points[i].y);
      }
      return {
        path,
        color: currentStroke.isEraser ? '#FFFFFF' : currentStroke.color,
        size: currentStroke.size,
      };
    }, [currentStroke]);

    const activeStrokeRef = useRef<Stroke | null>(null);

    const panResponder = useMemo(
      () =>
        PanResponder.create({
          onStartShouldSetPanResponder: () => true,
          onMoveShouldSetPanResponder: () => true,
          onPanResponderGrant: (evt: GestureResponderEvent) => {
            const { locationX, locationY } = evt.nativeEvent;
            const newStroke: Stroke = {
              points: [{ x: locationX, y: locationY }],
              color: currentColor,
              size: isEraser ? currentSize * 2.5 : currentSize,
              isEraser,
            };
            activeStrokeRef.current = newStroke;
            setCurrentStroke(newStroke);
          },
          onPanResponderMove: (evt: GestureResponderEvent) => {
            const { locationX, locationY } = evt.nativeEvent;
            if (activeStrokeRef.current) {
              const updated = {
                ...activeStrokeRef.current,
                points: [...activeStrokeRef.current.points, { x: locationX, y: locationY }],
              };
              activeStrokeRef.current = updated;
              setCurrentStroke(updated);
            }
          },
          onPanResponderRelease: () => {
            if (activeStrokeRef.current && activeStrokeRef.current.points.length > 0) {
              const finished = activeStrokeRef.current;
              setStrokes((prev) => {
                const next = [...prev, finished];
                if (onStrokesChange) {
                  onStrokesChange(JSON.stringify(next));
                }
                return next;
              });
              setRedoStack([]);
            }
            activeStrokeRef.current = null;
            setCurrentStroke(null);
          },
        }),
      [currentColor, currentSize, isEraser, onStrokesChange]
    );

    const handleUndo = () => {
      if (strokes.length === 0) return;
      const last = strokes[strokes.length - 1];
      const nextStrokes = strokes.slice(0, -1);
      setStrokes(nextStrokes);
      setRedoStack((prev) => [...prev, last]);
      if (onStrokesChange) {
        onStrokesChange(JSON.stringify(nextStrokes));
      }
    };

    const handleRedo = () => {
      if (redoStack.length === 0) return;
      const last = redoStack[redoStack.length - 1];
      const nextRedo = redoStack.slice(0, -1);
      const nextStrokes = [...strokes, last];
      setRedoStack(nextRedo);
      setStrokes(nextStrokes);
      if (onStrokesChange) {
        onStrokesChange(JSON.stringify(nextStrokes));
      }
    };

    const handleClear = () => {
      if (strokes.length === 0) return;
      setRedoStack([]);
      setStrokes([]);
      if (onStrokesChange) {
        onStrokesChange(JSON.stringify([]));
      }
    };

    useImperativeHandle(ref, () => ({
      exportImage: async () => {
        try {
          if (canvasRef.current) {
            const image = canvasRef.current.makeImageSnapshot();
            if (image) {
              const base64 = image.encodeToBase64();
              return `data:image/png;base64,${base64}`;
            }
          }
        } catch (e) {
          console.warn('Skia snapshot failed, using stroke json fallback:', e);
        }
        return `data:image/svg+xml;utf8,<svg viewBox="0 0 340 340"></svg>`;
      },
      getStrokeData: () => JSON.stringify(strokes),
      setStrokeData: (data: string) => {
        try {
          const parsed = JSON.parse(data);
          setStrokes(parsed);
        } catch {
          setStrokes([]);
        }
      },
      clear: handleClear,
    }));

    return (
      <View style={styles.container}>
        {/* Canvas Drawing Area */}
        <View style={[styles.canvasFrame, { height }]}>
          <View style={styles.dotGridOverlay} pointerEvents="none">
            {/* Subtle dot pattern */}
            <View style={styles.dotRow}>
              {[...Array(8)].map((_, i) => (
                <View key={i} style={styles.dot} />
              ))}
            </View>
          </View>

          <View style={StyleSheet.absoluteFill} {...panResponder.panHandlers}>
            <Canvas ref={canvasRef} style={StyleSheet.absoluteFill}>
              {renderedPaths.map((item, index) => (
                <Path
                  key={index}
                  path={item.path}
                  color={item.color}
                  style="stroke"
                  strokeWidth={item.size}
                  strokeCap="round"
                  strokeJoin="round"
                />
              ))}

              {activePath && (
                <Path
                  path={activePath.path}
                  color={activePath.color}
                  style="stroke"
                  strokeWidth={activePath.size}
                  strokeCap="round"
                  strokeJoin="round"
                />
              )}
            </Canvas>
          </View>
        </View>

        {/* Toolbar */}
        <View style={styles.toolbar}>
          {/* Tool Modes & Actions */}
          <View style={styles.actionRow}>
            <View style={styles.toolGroup}>
              <TouchableOpacity
                style={[styles.toolBtn, !isEraser && styles.toolBtnActive]}
                onPress={() => setIsEraser(false)}
                activeOpacity={0.8}
              >
                <Paintbrush size={18} color={!isEraser ? '#FAF8F3' : colors.foreground} />
                <Text style={[styles.toolBtnText, !isEraser && styles.toolBtnTextActive]}>Pen</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.toolBtn, isEraser && styles.toolBtnActive]}
                onPress={() => setIsEraser(true)}
                activeOpacity={0.8}
              >
                <Eraser size={18} color={isEraser ? '#FAF8F3' : colors.foreground} />
                <Text style={[styles.toolBtnText, isEraser && styles.toolBtnTextActive]}>Eraser</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.historyGroup}>
              <TouchableOpacity
                style={[styles.iconBtn, strokes.length === 0 && styles.disabledBtn]}
                onPress={handleUndo}
                disabled={strokes.length === 0}
              >
                <Undo2 size={18} color={strokes.length > 0 ? colors.foreground : '#B5AFA6'} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.iconBtn, redoStack.length === 0 && styles.disabledBtn]}
                onPress={handleRedo}
                disabled={redoStack.length === 0}
              >
                <Redo2 size={18} color={redoStack.length > 0 ? colors.foreground : '#B5AFA6'} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.iconBtn, strokes.length === 0 && styles.disabledBtn]}
                onPress={handleClear}
                disabled={strokes.length === 0}
              >
                <RotateCcw size={18} color={strokes.length > 0 ? colors.destructive : '#B5AFA6'} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Color Palette */}
          {!isEraser && (
            <View style={styles.paletteRow}>
              {PALETTE.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: c },
                    currentColor === c && styles.colorCircleActive,
                  ]}
                  onPress={() => setCurrentColor(c)}
                  activeOpacity={0.8}
                />
              ))}
            </View>
          )}

          {/* Brush Sizes */}
          <View style={styles.sizeRow}>
            {BRUSH_SIZES.map((b) => (
              <TouchableOpacity
                key={b.size}
                style={[
                  styles.sizePill,
                  currentSize === b.size && styles.sizePillActive,
                ]}
                onPress={() => setCurrentSize(b.size)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.sizeDot,
                    { width: b.size * 1.5, height: b.size * 1.5 },
                    currentSize === b.size && { backgroundColor: '#FAF8F3' },
                  ]}
                />
                <Text
                  style={[
                    styles.sizeLabel,
                    currentSize === b.size && styles.sizeLabelActive,
                  ]}
                >
                  {b.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  canvasFrame: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.borderSolid,
    overflow: 'hidden',
    position: 'relative',
    ...shadows.card,
  },
  dotGridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    justifyContent: 'space-between',
    opacity: 0.15,
  },
  dotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.foreground,
  },
  toolbar: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSolid,
    padding: 12,
    marginTop: 12,
    gap: 12,
    ...shadows.soft,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toolGroup: {
    flexDirection: 'row',
    backgroundColor: colors.inputBackground,
    borderRadius: radius.sm,
    padding: 3,
    gap: 4,
  },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.sm - 2,
  },
  toolBtnActive: {
    backgroundColor: colors.primary,
  },
  toolBtnText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.foreground,
  },
  toolBtnTextActive: {
    color: colors.primaryForeground,
  },
  historyGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledBtn: {
    opacity: 0.4,
  },
  paletteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorCircleActive: {
    borderColor: colors.foreground,
    transform: [{ scale: 1.15 }],
  },
  sizeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  sizePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.inputBackground,
  },
  sizePillActive: {
    backgroundColor: colors.primary,
  },
  sizeDot: {
    borderRadius: radius.full,
    backgroundColor: colors.foreground,
  },
  sizeLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.foreground,
  },
  sizeLabelActive: {
    color: colors.primaryForeground,
    fontFamily: fonts.bodyBold,
  },
});
