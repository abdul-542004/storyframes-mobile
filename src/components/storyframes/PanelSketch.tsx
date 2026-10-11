import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import Svg, {
  G,
  Circle,
  Path,
  Line,
  Rect,
  Polygon,
  Text as SvgText,
  Defs,
  Pattern,
} from 'react-native-svg';
import { colors, fonts } from '../../theme/tokens';

const S = '#2C2416';
const SW = 2.2;
const sp = {
  stroke: S,
  strokeWidth: SW,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none',
};

function StickFigure({
  x,
  y,
  sc = 1,
  arms = 'down',
  smile = true,
}: {
  x: number;
  y: number;
  sc?: number;
  arms?: 'down' | 'up' | 'out' | 'wave';
  smile?: boolean;
}) {
  const h = sc;
  return (
    <G>
      <Circle cx={x} cy={y - 38 * h} r={12 * h} {...sp} />
      {smile && (
        <Path
          d={`M ${x - 5 * h} ${y - 33 * h} Q ${x} ${y - 29 * h} ${x + 5 * h} ${y - 33 * h}`}
          {...sp}
        />
      )}
      <Circle cx={x - 3 * h} cy={y - 40 * h} r={1.5 * h} fill={S} stroke="none" />
      <Circle cx={x + 3 * h} cy={y - 40 * h} r={1.5 * h} fill={S} stroke="none" />
      <Line x1={x} y1={y - 26 * h} x2={x} y2={y - 3 * h} {...sp} />
      {arms === 'down' && (
        <>
          <Line x1={x} y1={y - 20 * h} x2={x - 16 * h} y2={y - 8 * h} {...sp} />
          <Line x1={x} y1={y - 20 * h} x2={x + 16 * h} y2={y - 8 * h} {...sp} />
        </>
      )}
      {arms === 'up' && (
        <>
          <Line x1={x} y1={y - 20 * h} x2={x - 18 * h} y2={y - 34 * h} {...sp} />
          <Line x1={x} y1={y - 20 * h} x2={x + 18 * h} y2={y - 34 * h} {...sp} />
        </>
      )}
      {arms === 'out' && (
        <>
          <Line x1={x} y1={y - 20 * h} x2={x - 22 * h} y2={y - 20 * h} {...sp} />
          <Line x1={x} y1={y - 20 * h} x2={x + 22 * h} y2={y - 20 * h} {...sp} />
        </>
      )}
      {arms === 'wave' && (
        <>
          <Line x1={x} y1={y - 20 * h} x2={x - 16 * h} y2={y - 10 * h} {...sp} />
          <Line x1={x} y1={y - 20 * h} x2={x + 20 * h} y2={y - 36 * h} {...sp} />
        </>
      )}
      <Line x1={x} y1={y - 3 * h} x2={x - 14 * h} y2={y + 18 * h} {...sp} />
      <Line x1={x} y1={y - 3 * h} x2={x + 14 * h} y2={y + 18 * h} {...sp} />
    </G>
  );
}

function HeartShape({ x, y, sz = 18 }: { x: number; y: number; sz?: number }) {
  return (
    <Path
      d={`M ${x} ${y + sz * 0.3} C ${x} ${y} ${x - sz * 0.5} ${y - sz * 0.5} ${x - sz * 0.5} ${y - sz * 0.25} C ${x - sz * 0.5} ${y - sz * 0.6} ${x} ${y - sz * 0.6} ${x} ${y - sz * 0.25} C ${x + sz * 0.5} ${y - sz * 0.6} ${x + sz * 0.5} ${y - sz * 0.6} ${x + sz * 0.5} ${y - sz * 0.25} C ${x + sz * 0.5} ${y - sz * 0.5} ${x} ${y} ${x} ${y + sz * 0.3} Z`}
      {...sp}
      fill="#E8A2A2"
      fillOpacity={0.5}
    />
  );
}

function StarShape({ x, y, sz = 10 }: { x: number; y: number; sz?: number }) {
  const pts = Array.from({ length: 5 }, (_, i) => {
    const outer = ((i * 72 - 90) * Math.PI) / 180;
    const inner = ((i * 72 - 90 + 36) * Math.PI) / 180;
    return `${x + sz * Math.cos(outer)},${y + sz * Math.sin(outer)} ${x + sz * 0.4 * Math.cos(inner)},${y + sz * 0.4 * Math.sin(inner)}`;
  }).join(' ');
  return <Polygon points={pts} {...sp} fill="#E8C547" fillOpacity={0.6} />;
}

// Preset SVGs
function DefaultSketch() {
  return (
    <Svg viewBox="0 0 280 200" style={styles.svg}>
      <Rect width="280" height="200" fill="#FCFAF6" />
      <StickFigure x={140} y={150} arms="out" smile={true} />
      <HeartShape x={140} y={80} sz={24} />
      <StarShape x={60} y={60} sz={10} />
      <StarShape x={220} y={60} sz={8} />
      <SvgText x="140" y="40" fontSize="16" textAnchor="middle" fill={S} fontFamily={fonts.heading}>
        a new story begins...
      </SvgText>
    </Svg>
  );
}

function OfficeWorkerSketch() {
  return (
    <Svg viewBox="0 0 280 200" style={styles.svg}>
      <Rect width="280" height="200" fill="#FCFAF6" />
      <Rect x="50" y="130" width="180" height="12" rx="3" {...sp} fill="#EDE9E0" />
      <Line x1="70" y1="142" x2="70" y2="165" {...sp} />
      <Line x1="210" y1="142" x2="210" y2="165" {...sp} />
      <Rect x="120" y="78" width="80" height="55" rx="4" {...sp} fill="#F0EDE6" />
      <Rect x="152" y="133" width="16" height="12" rx="2" {...sp} />
      <Circle cx="88" cy="86" r="12" {...sp} />
      <Circle cx="84" cy="83" r="1.5" fill={S} stroke="none" />
      <Circle cx="92" cy="83" r="1.5" fill={S} stroke="none" />
      <Path d="M 83 90 Q 88 93 93 90" {...sp} />
      <Line x1="88" y1="98" x2="88" y2="118" {...sp} />
      <StarShape x={240} y={60} sz={8} />
    </Svg>
  );
}

function CafeSketch() {
  return (
    <Svg viewBox="0 0 280 200" style={styles.svg}>
      <Rect width="280" height="200" fill="#FCFAF6" />
      <Rect x="160" y="60" width="90" height="110" rx="4" {...sp} fill="#F0EDE6" />
      <Path d="M 158 65 Q 205 52 252 65" {...sp} fill="#7A9E87" fillOpacity={0.4} />
      <SvgText x="184" y="115" fontSize="13" fill={S} fontFamily={fonts.heading}>
        CAFÉ
      </SvgText>
      <Line x1="20" y1="170" x2="260" y2="170" {...sp} />
      <StickFigure x={85} y={155} arms="down" />
      <StarShape x={38} y={45} sz={7} />
    </Svg>
  );
}

function CounterSketch() {
  return (
    <Svg viewBox="0 0 280 200" style={styles.svg}>
      <Rect width="280" height="200" fill="#FCFAF6" />
      <Rect x="80" y="120" width="160" height="16" rx="4" {...sp} fill="#EDE9E0" />
      <StickFigure x={185} y={120} arms="down" />
      <StickFigure x={115} y={120} sc={1} arms="wave" />
      <StarShape x={248} y={52} sz={9} />
    </Svg>
  );
}

function EspressoJoySketch() {
  return (
    <Svg viewBox="0 0 280 200" style={styles.svg}>
      <Rect width="280" height="200" fill="#FCFAF6" />
      <Rect x="130" y="80" width="80" height="70" rx="6" {...sp} fill="#F0EDE6" />
      <Circle cx="158" cy="106" r="10" {...sp} />
      <Circle cx="182" cy="106" r="10" {...sp} />
      <StickFigure x={85} y={170} arms="out" smile={true} />
      <HeartShape x={115} y={120} sz={16} />
      <HeartShape x={220} y={55} sz={22} />
    </Svg>
  );
}

const SKETCH_MAP: Record<string, React.FC> = {
  'office-worker': OfficeWorkerSketch,
  'walking-to-cafe': CafeSketch,
  'at-counter': CounterSketch,
  'espresso-joy': EspressoJoySketch,
  'default': DefaultSketch,
};

interface PanelSketchProps {
  id: string;
  userImageData?: string;
  style?: object;
}

export function PanelSketch({ id, userImageData, style }: PanelSketchProps) {
  if (userImageData) {
    return (
      <View style={[styles.container, style]}>
        <Image
          source={{ uri: userImageData }}
          style={styles.image}
          resizeMode="contain"
        />
      </View>
    );
  }

  const SketchComponent = SKETCH_MAP[id] || SKETCH_MAP['default'];

  return (
    <View style={[styles.container, style]}>
      <SketchComponent />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  svg: {
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
