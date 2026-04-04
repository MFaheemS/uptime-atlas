import React from 'react';
import { View, Text, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useMonitors } from '../../src/hooks/useMonitors';
import { MonitorListItem } from '../../src/components/MonitorListItem';
import { LoadingSpinner } from '../../src/components/LoadingSpinner';
import { EmptyState } from '../../src/components/EmptyState';

export default function DashboardScreen() {
  const { data: monitors, isLoading, refetch } = useMonitors();

  if (isLoading) return <LoadingSpinner />;

  const list = monitors ?? [];
  const downCount = list.filter((m: any) => m.status === 'DOWN').length;

  return (
    <View style={styles.container}>
      {downCount > 0 && (
        <View style={styles.downBanner}>
          <Text style={styles.downBannerText}>
            {downCount} monitor{downCount > 1 ? 's are' : ' is'} currently down
          </Text>
        </View>
      )}

      {list.length > 0 && (
        <View style={styles.summary}>
          <SummaryPill label="Total" value={list.length} color="#6b7280" />
          <SummaryPill
            label="Up"
            value={list.filter((m: any) => m.status === 'UP').length}
            color="#22c55e"
          />
          <SummaryPill label="Down" value={downCount} color="#ef4444" />
        </View>
      )}

      <FlatList
        data={list}
        keyExtractor={(item: any) => item.id}
        renderItem={({ item }) => (
          <MonitorListItem monitor={item} onPress={() => router.push(`/monitors/${item.id}`)} />
        )}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
        ListEmptyComponent={
          <EmptyState
            title="No monitors yet"
            subtitle="Add one from the web dashboard"
            icon="pulse-outline"
          />
        }
      />
    </View>
  );
}

function SummaryPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.pill}>
      <Text style={[styles.pillValue, { color }]}>{value}</Text>
      <Text style={styles.pillLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  downBanner: {
    backgroundColor: '#ef4444',
    padding: 10,
    alignItems: 'center',
  },
  downBannerText: { color: '#fff', fontWeight: '600' },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  pill: { alignItems: 'center' },
  pillValue: { fontSize: 22, fontWeight: '700' },
  pillLabel: { fontSize: 12, color: '#9ca3af' },
});
