import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { fonts } from '../../theme/tokens';

interface AvatarProps {
  initials: string;
  color?: string;
  size?: number;
}

export function Avatar({ initials, color = '#7A9E87', size = 36 }: AvatarProps) {
  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            fontSize: Math.floor(size * 0.42),
          },
        ]}
      >
        {initials || 'SF'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
  },
});
