import React, { useState } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity, StyleSheet } from 'react-native';
import { useIncidents } from '../../src/hooks/useIncidents';
import { LoadingSpinner } from '../../src/components/LoadingSpinner';
import { EmptyState } from '../../src/components/EmptyState';

function formatDuration(startedAt: string, resolvedAt?: string): string {
  const start = new Date(startedAt).getTime();
  const end = resolvedAt ? new Date(resolvedAt).getTime() : Date.now();
  const mins = Math.round((end - start) / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function IncidentRow({ item }: { item: any }) {
  const [expanded, setExpanded] = useState(false);
  const isOpen = !item.resolvedAt;

  return (
    <TouchableOpacity
      style={[styles.row, isOpen ? styles.rowOpen : styles.rowResolved]}
      onPress={() => setExpanded((e) => !e)}
      activeOpacity={0.8}
    >
      <View style={styles.rowContent}>
        <Text style={styles.monitorName}>{item.monitor?.name ?? 'Unknown Monitor'}</Text>
        <View style={styles.rowMeta}>
          <Text style={styles.metaText}>{new Date(item.startedAt).toLocaleString()}</Text>
          <Text style={[styles.statusBadge, isOpen ? styles.statusOpen : styles.statusResolved]}>
            {isOpen ? 'OPEN' : 'RESOLVED'}
          </Text>
        </View>
        <Text style={styles.metaText}>
          Duration: {formatDuration(item.startedAt, item.resolvedAt)}
        </Text>
      </View>
      {expanded && item.aiSummary ? <Text style={styles.aiSummary}>{item.aiSummary}</Text> : null}
    </TouchableOpacity>
  );
}

export default function IncidentsScreen() {
  const { data: incidents, isLoading, refetch } = useIncidents();

  if (isLoading) return <LoadingSpinner />;

  const list = incidents ?? [];
  const open = list.filter((i: any) => !i.resolvedAt);
  const resolved = list.filter((i: any) => i.resolvedAt);
  const sorted = [...open, ...resolved];

  return (
    <FlatList
      data={sorted}
      keyExtractor={(item: any) => item.id}
      renderItem={({ item }) => <IncidentRow item={item} />}
      refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
      ListEmptyComponent={
        <EmptyState
          title="No incidents"
          subtitle="All monitors are running smoothly"
          icon="checkmark-circle-outline"
        />
      }
      style={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: { backgroundColor: '#f9fafb' },
  row: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 10,
    borderRadius: 10,
    padding: 14,
    borderLeftWidth: 4,
  },
  rowOpen: { borderLeftColor: '#ef4444' },
  rowResolved: { borderLeftColor: '#d1d5db' },
  rowContent: { gap: 4 },
  monitorName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  rowMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaText: { fontSize: 12, color: '#6b7280' },
  statusBadge: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusOpen: { backgroundColor: '#fee2e2', color: '#dc2626' },
  statusResolved: { backgroundColor: '#f3f4f6', color: '#6b7280' },
  aiSummary: {
    marginTop: 10,
    fontSize: 13,
    color: '#4b5563',
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    padding: 10,
  },
});
