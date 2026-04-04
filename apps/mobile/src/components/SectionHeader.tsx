import React from 'react';
import { Text, StyleSheet } from 'react-native';

export function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.text}>{title.toUpperCase()}</Text>;
}

const styles = StyleSheet.create({
  text: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9ca3af',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f9fafb',
    letterSpacing: 0.5,
  },
});
