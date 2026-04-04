import React from 'react';
import { Text, StyleSheet } from 'react-native';

function getColor(uptime: number): string {
  if (uptime >= 99) return '#22c55e';
  if (uptime >= 95) return '#eab308';
  return '#ef4444';
}

export function UptimeBadge({ uptime }: { uptime: number }) {
  return <Text style={[styles.text, { color: getColor(uptime) }]}>{uptime.toFixed(2)}%</Text>;
}

const styles = StyleSheet.create({
  text: {
    fontSize: 13,
    fontWeight: '600',
  },
});
