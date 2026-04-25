import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { StatusDot } from './StatusDot';
import { UptimeBadge } from './UptimeBadge';
import { useRecentAnomaly } from '../hooks/useAnomalies';

interface Monitor {
  id: string;
  name: string;
  url: string;
  status: 'UP' | 'DOWN' | 'DEGRADED';
  uptime: number;
  lastCheckedAt?: string;
}

interface Props {
  monitor: Monitor;
  onPress: () => void;
}

export function MonitorListItem({ monitor, onPress }: Props) {
  const lastChecked = monitor.lastCheckedAt
    ? new Date(monitor.lastCheckedAt).toLocaleTimeString()
    : '—';
  const hasAnomaly = useRecentAnomaly(monitor.id);

  function handlePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.7}>
      <View style={styles.dotWrapper}>
        <StatusDot status={monitor.status} />
        {hasAnomaly && <View style={styles.anomalyDot} />}
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {monitor.name}
        </Text>
        <Text style={styles.url} numberOfLines={1}>
          {monitor.url}
        </Text>
      </View>
      <View style={styles.right}>
        <UptimeBadge uptime={monitor.uptime} />
        <Text style={styles.lastChecked}>{lastChecked}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
    gap: 10,
  },
  dotWrapper: {
    position: 'relative',
  },
  anomalyDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f97316',
    borderWidth: 1,
    borderColor: '#fff',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  url: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
    gap: 2,
  },
  lastChecked: {
    fontSize: 11,
    color: '#9ca3af',
  },
});
