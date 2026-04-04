import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { StatusDot } from './StatusDot';
import { UptimeBadge } from './UptimeBadge';

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

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <StatusDot status={monitor.status} />
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
