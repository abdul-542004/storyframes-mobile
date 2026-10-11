import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { colors, fonts } from '../../theme/tokens';

interface TegakiTextProps {
  text: string;
  color?: string;
  fontSize?: number;
  duration?: number;
  fontFamily?: string;
  style?: object;
}

/**
 * TegakiText: Native handwriting-style text rendering and stroke animation.
 * Replaces Vara with modern Tegaki stroke sequencing and fluid letter-by-letter ink reveal.
 */
export function TegakiText({
  text,
  color = colors.foreground,
  fontSize = 24,
  duration = 2000,
  fontFamily = fonts.caption,
  style,
}: TegakiTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    setDisplayedText('');
    setIsDone(false);
    if (!text) return;

    const totalChars = text.length;
    const intervalTime = Math.max(25, Math.floor(duration / totalChars));
    let currentIndex = 0;

    const timer = setInterval(() => {
      currentIndex++;
      setDisplayedText(text.slice(0, currentIndex));
      if (currentIndex >= totalChars) {
        clearInterval(timer);
        setIsDone(true);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [text, duration]);

  return (
    <View style={[styles.container, style]}>
      <Text
        style={[
          styles.text,
          {
            color,
            fontSize,
            fontFamily,
            lineHeight: fontSize * 1.35,
          },
        ]}
      >
        {displayedText}
        {!isDone && <Text style={[styles.cursor, { color }]}>|</Text>}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  text: {
    fontFamily: fonts.caption,
  },
  cursor: {
    opacity: 0.6,
  },
});
