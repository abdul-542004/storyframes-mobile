import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { Plus } from 'lucide-react-native';
import { colors, fonts, radius } from '../../theme/tokens';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from './Avatar';

export function AppHeader() {
  const { user } = useAuth();

  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.logoRow}
        onPress={() => router.push('/(tabs)')}
        activeOpacity={0.8}
      >
        <View style={styles.logoBadge}>
          <Svg width={20} height={20} viewBox="0 0 24 24">
            <Path
              d="M5 4 L5 20 L12 16 L19 20 L19 4 Z"
              stroke="#FAF8F3"
              strokeWidth={2}
              strokeLinejoin="round"
              fill="none"
            />
            <Path
              d="M9 9 Q 12 7 15 9"
              stroke="#E8C547"
              strokeWidth={1.8}
              strokeLinecap="round"
              fill="none"
            />
          </Svg>
        </View>
        <View>
          <Text style={styles.logoTitle}>Storyframes</Text>
          <Text style={styles.logoSubtitle}>draw your chapters</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.newButton}
          onPress={() => router.push('/(tabs)/create')}
          activeOpacity={0.85}
        >
          <Plus size={16} color="#FFFFFF" strokeWidth={2.4} />
          <Text style={styles.newButtonText}>New</Text>
        </TouchableOpacity>

        {user && (
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/profile')}
            activeOpacity={0.8}
          >
            <Avatar initials={user.initials} color={user.avatarColor} size={34} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSolid,
    backgroundColor: colors.background,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoTitle: {
    fontFamily: fonts.heading,
    fontSize: 26,
    color: colors.foreground,
    lineHeight: 28,
  },
  logoSubtitle: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.mutedForeground,
    marginTop: -2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.md,
  },
  newButtonText: {
    fontFamily: fonts.heading,
    fontSize: 18,
    color: '#FFFFFF',
    lineHeight: 20,
  },
});
