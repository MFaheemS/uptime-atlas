import React from 'react';
import { View, StyleSheet } from 'react-native';

type Status = 'UP' | 'DOWN' | 'DEGRADED';

const COLOR_MAP: Record<Status, string> = {
  UP: '#22c55e',
  DOWN: '#ef4444',
  DEGRADED: '#eab308',
};

export function StatusDot({ status }: { status: Status }) {
  return <View style={[styles.dot, { backgroundColor: COLOR_MAP[status] ?? '#9ca3af' }]} />;
}

const styles = StyleSheet.create({
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
