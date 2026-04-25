import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Switch,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Constants from 'expo-constants';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../src/store/auth.store';
import { useMonitors } from '../../src/hooks/useMonitors';
import { api } from '../../src/lib/api';
import { Card } from '../../src/components/Card';

function usePushPreferences() {
  return useQuery({
    queryKey: ['push-preferences'],
    queryFn: async () => {
      const res = await api.get('/users/me/push-preferences');
      return res.data as Array<{ monitorId: string; enabled: boolean }>;
    },
  });
}

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();
  const setUser = useAuthStore((s) => s.setUser);
  const qc = useQueryClient();

  const { data: monitors } = useMonitors();
  const { data: pushPrefs } = usePushPreferences();

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(user?.name ?? '');
  const [nameSaving, setNameSaving] = useState(false);
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    setNameValue(user?.name ?? '');
  }, [user?.name]);

  async function saveName() {
    if (!nameValue.trim()) return;
    setNameSaving(true);
    setNameError('');
    try {
      const res = await api.patch('/users/me', { name: nameValue.trim() });
      setUser(res.data);
      qc.invalidateQueries({ queryKey: ['me'] });
      setEditingName(false);
    } catch {
      setNameError('Failed to update name');
    } finally {
      setNameSaving(false);
    }
  }

  const prefMap = new Map<string, boolean>((pushPrefs ?? []).map((p) => [p.monitorId, p.enabled]));

  async function togglePref(monitorId: string, enabled: boolean) {
    await api.patch('/users/me/push-preferences', [{ monitorId, enabled }]);
    qc.invalidateQueries({ queryKey: ['push-preferences'] });
  }

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Profile</Text>

        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{user?.email ?? '—'}</Text>

        <Text style={styles.label}>Name</Text>
        {editingName ? (
          <View style={styles.editRow}>
            <TextInput
              style={styles.input}
              value={nameValue}
              onChangeText={setNameValue}
              autoFocus
            />
            <TouchableOpacity style={styles.saveBtn} onPress={saveName} disabled={nameSaving}>
              {nameSaving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Save</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => {
                setEditingName(false);
                setNameValue(user?.name ?? '');
                setNameError('');
              }}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.nameRow} onPress={() => setEditingName(true)}>
            <Text style={styles.value}>{user?.name ?? '—'}</Text>
            <Text style={styles.editLink}>Edit</Text>
          </TouchableOpacity>
        )}
        {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
      </Card>

      {/* Notification preferences */}
      {(monitors ?? []).length > 0 && (
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Push Notifications</Text>
          <Text style={styles.sectionSubtitle}>
            Choose which monitors send push alerts to this device
          </Text>
          {(monitors ?? []).map((m: any) => {
            const enabled = prefMap.has(m.id) ? prefMap.get(m.id)! : true;
            return (
              <View key={m.id} style={styles.prefRow}>
                <Text style={styles.prefName} numberOfLines={1}>
                  {m.name}
                </Text>
                <Switch
                  value={enabled}
                  onValueChange={(val) => togglePref(m.id, val)}
                  trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
                  thumbColor={enabled ? '#3b82f6' : '#9ca3af'}
                />
              </View>
            );
          })}
        </Card>
      )}

      {/* App version */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>App Info</Text>
        <Text style={styles.label}>Version</Text>
        <Text style={styles.value}>{appVersion}</Text>
      </Card>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, gap: 16 },
  card: { gap: 6 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  sectionSubtitle: { fontSize: 12, color: '#6b7280', marginBottom: 8 },
  label: { fontSize: 12, color: '#9ca3af', marginTop: 6 },
  value: { fontSize: 15, color: '#111827' },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  editLink: { fontSize: 13, color: '#3b82f6', fontWeight: '600' },
  editRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 8,
    fontSize: 15,
    backgroundColor: '#fff',
  },
  saveBtn: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 52,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  cancelBtn: { paddingHorizontal: 6 },
  cancelBtnText: { color: '#6b7280', fontSize: 13 },
  errorText: { fontSize: 12, color: '#ef4444', marginTop: 4 },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  prefName: { flex: 1, fontSize: 14, color: '#374151', marginRight: 12 },
  logoutButton: {
    backgroundColor: '#fee2e2',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  logoutText: { color: '#dc2626', fontWeight: '600', fontSize: 15 },
});
