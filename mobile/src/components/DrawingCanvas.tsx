import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  PanResponder,
  GestureResponderEvent,
  TouchableOpacity,
  Text,
  ScrollView,
  LayoutRectangle,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { Colors, Spacing, Radius, FontSize } from '../theme';
import { DRAW_COLORS } from '../theme';
import { Stroke } from '../context/GameContext';

const { width: SW } = Dimensions.get('window');
const CANVAS_W = SW - Spacing.xl * 2;
const CANVAS_H = CANVAS_W * 0.75;

interface Props {
  strokes: Stroke[];
  isDrawer: boolean;
  onStrokeStart: (c: string, w: number, x: number, y: number) => void;
  onStrokePoint: (x: number, y: number) => void;
  onUndo: () => void;
  onClear: () => void;
}

function strokeToPath(s: Stroke): string {
  if (!s.p.length) return '';
  if (s.p.length === 1) return `M ${s.p[0][0] * CANVAS_W} ${s.p[0][1] * CANVAS_H}`;
  const pts = s.p.map(([x, y]) => `${x * CANVAS_W},${y * CANVAS_H}`);
  return 'M ' + pts[0] + ' L ' + pts.slice(1).join(' L ');
}

export default function DrawingCanvas({
  strokes,
  isDrawer,
  onStrokeStart,
  onStrokePoint,
  onUndo,
  onClear,
}: Props) {
  const [color, setColor] = useState(DRAW_COLORS[0]);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [size, setSize] = useState(6);
  const drawing = useRef(false);
  const layoutRef = useRef<LayoutRectangle>({ x: 0, y: 0, width: CANVAS_W, height: CANVAS_H });

  const toNorm = useCallback((pageX: number, pageY: number) => {
    const { x, y, width, height } = layoutRef.current;
    const nx = Math.min(1, Math.max(0, (pageX - x) / width));
    const ny = Math.min(1, Math.max(0, (pageY - y) / height));
    return [nx, ny] as [number, number];
  }, []);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => isDrawer,
    onMoveShouldSetPanResponder: () => isDrawer,
    onPanResponderGrant: (e: GestureResponderEvent) => {
      const { pageX, pageY } = e.nativeEvent;
      const [nx, ny] = toNorm(pageX, pageY);
      const c = tool === 'eraser' ? '#ffffff' : color;
      const w = tool === 'eraser' ? size * 2.5 : size;
      drawing.current = true;
      onStrokeStart(c, w, nx, ny);
    },
    onPanResponderMove: (e: GestureResponderEvent) => {
      if (!drawing.current) return;
      const { pageX, pageY } = e.nativeEvent;
      const [nx, ny] = toNorm(pageX, pageY);
      onStrokePoint(nx, ny);
    },
    onPanResponderRelease: () => {
      drawing.current = false;
    },
    onPanResponderTerminate: () => {
      drawing.current = false;
    },
  });

  return (
    <View style={styles.wrapper}>
      {/* Canvas */}
      <View
        style={styles.canvas}
        onLayout={(e) => {
          layoutRef.current = e.nativeEvent.layout;
        }}
        {...(isDrawer ? panResponder.panHandlers : {})}
      >
        <Svg width={CANVAS_W} height={CANVAS_H} style={StyleSheet.absoluteFill}>
          {strokes.map((s, si) => {
            if (s.p.length === 1) {
              const r = s.w / 2;
              return (
                <Circle
                  key={si}
                  cx={s.p[0][0] * CANVAS_W}
                  cy={s.p[0][1] * CANVAS_H}
                  r={r}
                  fill={s.c}
                />
              );
            }
            return (
              <Path
                key={si}
                d={strokeToPath(s)}
                stroke={s.c}
                strokeWidth={s.w}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            );
          })}
        </Svg>
      </View>

      {/* Drawing tools (drawer only) */}
      {isDrawer && (
        <View style={styles.tools}>
          {/* Tool toggles */}
          <View style={styles.toolRow}>
            <TouchableOpacity
              style={[styles.toolBtn, tool === 'pen' && styles.toolBtnActive]}
              onPress={() => setTool('pen')}
            >
              <Text style={styles.toolBtnText}>✏️ Pen</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toolBtn, tool === 'eraser' && styles.toolBtnActive]}
              onPress={() => setTool('eraser')}
            >
              <Text style={styles.toolBtnText}>🧹 Eraser</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.toolBtn, styles.toolBtnUndo]} onPress={onUndo}>
              <Text style={styles.toolBtnText}>↩️ Undo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.toolBtn, styles.toolBtnClear]} onPress={onClear}>
              <Text style={styles.toolBtnText}>🗑️ Clear</Text>
            </TouchableOpacity>
          </View>

          {/* Size buttons */}
          <View style={styles.toolRow}>
            <Text style={styles.sizeLabel}>Size:</Text>
            {[3, 6, 12, 22, 36].map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.sizeBtn, size === s && styles.sizeBtnActive]}
                onPress={() => setSize(s)}
              >
                <View
                  style={[
                    styles.sizeDot,
                    { width: Math.min(s, 24), height: Math.min(s, 24), borderRadius: s },
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Color palette */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.palette}>
            {DRAW_COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.swatch,
                  { backgroundColor: c },
                  c === color && tool === 'pen' && styles.swatchActive,
                  c === '#ffffff' ? { borderWidth: 1.5, borderColor: Colors.cardBorder } : {},
                ]}
                onPress={() => {
                  setColor(c);
                  setTool('pen');
                }}
              />
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '100%' },
  canvas: {
    width: CANVAS_W,
    height: CANVAS_H,
    backgroundColor: '#ffffff',
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.cardBorder,
  },
  tools: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: Spacing.xs,
  },
  toolRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, alignItems: 'center' },
  toolBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.boardLight,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  toolBtnActive: { backgroundColor: Colors.teal, borderColor: Colors.teal },
  toolBtnUndo: { borderColor: Colors.purple },
  toolBtnClear: { borderColor: Colors.error },
  toolBtnText: { color: Colors.textPrimary, fontSize: FontSize.xs, fontWeight: '700' },
  sizeLabel: { color: Colors.textSecondary, fontSize: FontSize.xs, marginRight: Spacing.xs },
  sizeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
  },
  sizeBtnActive: { borderColor: Colors.teal, backgroundColor: Colors.boardLight },
  sizeDot: { backgroundColor: Colors.textPrimary },
  palette: { flexDirection: 'row' },
  swatch: { width: 32, height: 32, borderRadius: 16, marginRight: Spacing.xs },
  swatchActive: { borderWidth: 3, borderColor: Colors.pink },
});
