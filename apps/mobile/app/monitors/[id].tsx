import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useMonitor } from '../../src/hooks/useMonitor';
import { useMonitorStats } from '../../src/hooks/useMonitorStats';
import { StatusDot } from '../../src/components/StatusDot';
import { SparklineChart } from '../../src/components/SparklineChart';
import { LoadingSpinner } from '../../src/components/LoadingSpinner';
import { ErrorView } from '../../src/components/ErrorView';
import { Card } from '../../src/components/Card';

type TimeRange = '1h' | '24h' | '7d';

export default function MonitorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [range, setRange] = useState<TimeRange>('24h');

  const {
    data: monitor,
    isLoading: monitorLoading,
    isError: monitorError,
    refetch,
  } = useMonitor(id);
  const { data: stats } = useMonitorStats(id, range);

  if (monitorLoading) return <LoadingSpinner />;
  if (monitorError || !monitor) return <ErrorView onRetry={refetch} />;

  const chartData = (stats?.responseTimeSeries ?? []).map((p: any, i: number) => ({
    x: i,
    y: p.value ?? p,
  }));
  const hasAnomalies = (stats?.anomalies ?? []).length > 0;
  const incidents = stats?.recentIncidents ?? monitor.incidents ?? [];
  const last5 = incidents.slice(0, 5);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {hasAnomalies && (
        <View style={styles.anomalyCard}>
          <Text style={styles.anomalyText}>Anomalies detected in the last hour</Text>
        </View>
      )}

      <View style={styles.header}>
        <StatusDot status={monitor.status} />
        <View style={styles.headerText}>
          <Text style={styles.monitorName}>{monitor.name}</Text>
          <Text style={styles.monitorUrl}>{monitor.url}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <StatCard label="Uptime (30d)" value={`${(monitor.uptime ?? 0).toFixed(2)}%`} />
        <StatCard
          label="Avg Response"
          value={stats?.avgResponseTime ? `${stats.avgResponseTime}ms` : '—'}
        />
        <StatCard
          label="SSL Expiry"
          value={stats?.sslDaysRemaining != null ? `${stats.sslDaysRemaining}d` : '—'}
        />
      </View>

      <Card style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Response Time</Text>
          <View style={styles.rangeSelector}>
            {(['1h', '24h', '7d'] as TimeRange[]).map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.rangeBtn, range === r ? styles.rangeBtnActive : null]}
                onPress={() => setRange(r)}
              >
                <Text style={[styles.rangeBtnText, range === r ? styles.rangeBtnTextActive : null]}>
                  {r}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <SparklineChart data={chartData} height={100} width={320} />
      </Card>

      {last5.length > 0 && (
        <Card>
          <Text style={styles.sectionTitle}>Recent Incidents</Text>
          {last5.map((incident: any) => (
            <View key={incident.id} style={styles.incidentRow}>
              <Text style={styles.incidentTime}>
                {new Date(incident.startedAt).toLocaleString()}
              </Text>
              <Text style={styles.incidentDuration}>
                {incident.resolvedAt
                  ? `${Math.round((new Date(incident.resolvedAt).getTime() - new Date(incident.startedAt).getTime()) / 60000)}m`
                  : 'Ongoing'}
              </Text>
              {incident.aiSummary ? (
                <Text style={styles.aiSummary}>{incident.aiSummary}</Text>
              ) : null}
            </View>
          ))}
        </Card>
      )}
    </ScrollView>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, gap: 14 },
  anomalyCard: {
    backgroundColor: '#fff7ed',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f97316',
  },
  anomalyText: { color: '#c2410c', fontWeight: '600' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerText: { flex: 1 },
  monitorName: { fontSize: 20, fontWeight: '700', color: '#111827' },
  monitorUrl: { fontSize: 13, color: '#6b7280' },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, alignItems: 'center', padding: 12 },
  statValue: { fontSize: 18, fontWeight: '700', color: '#111827' },
  statLabel: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  chartCard: { gap: 10 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chartTitle: { fontSize: 15, fontWeight: '600', color: '#374151' },
  rangeSelector: { flexDirection: 'row', gap: 4 },
  rangeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
  },
  rangeBtnActive: { backgroundColor: '#3b82f6' },
  rangeBtnText: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
  rangeBtnTextActive: { color: '#fff' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 10 },
  incidentRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 8,
    gap: 2,
  },
  incidentTime: { fontSize: 13, color: '#374151' },
  incidentDuration: { fontSize: 12, color: '#6b7280' },
  aiSummary: {
    fontSize: 12,
    color: '#4b5563',
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    padding: 8,
    marginTop: 4,
  },
});
