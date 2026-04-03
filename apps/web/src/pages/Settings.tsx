import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import { useAuthStore } from '../store/auth.store';
import { useThemeStore } from '../store/theme.store';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

type Tab = 'profile' | 'notifications' | 'api-keys' | 'danger';

// --- Profile Tab ---
function ProfileTab() {
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  const { data: me, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await api.get('/users/me');
      return data;
    },
  });

  const [name, setName] = useState('');
  const [nameSuccess, setNameSuccess] = useState(false);
  const [nameError, setNameError] = useState('');
  const [namePending, setNamePending] = useState(false);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwPending, setPwPending] = useState(false);

  async function handleUpdateName(e: React.FormEvent) {
    e.preventDefault();
    setNameSuccess(false);
    setNameError('');
    setNamePending(true);
    try {
      const { data } = await api.patch('/users/me', { name });
      setUser(data);
      qc.invalidateQueries({ queryKey: ['me'] });
      setNameSuccess(true);
    } catch (err: any) {
      setNameError(err.response?.data?.error ?? 'Failed to update name');
    } finally {
      setNamePending(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwSuccess(false);
    setPwError('');
    if (newPw !== confirmPw) {
      setPwError('New passwords do not match');
      return;
    }
    setPwPending(true);
    try {
      await api.patch('/users/me/password', { currentPassword: currentPw, newPassword: newPw });
      setPwSuccess(true);
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
    } catch (err: any) {
      setPwError(err.response?.data?.error ?? 'Failed to change password');
    } finally {
      setPwPending(false);
    }
  }

  if (isLoading) return <LoadingSkeleton rows={3} />;

  return (
    <div className="space-y-6 max-w-md">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Email</p>
        <p className="font-medium text-gray-900 dark:text-gray-100">{me?.email}</p>
      </div>

      <form
        onSubmit={handleUpdateName}
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3"
      >
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Update name</h3>
        <input
          type="text"
          defaultValue={me?.name ?? ''}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        />
        {nameError && <p className="text-xs text-red-500">{nameError}</p>}
        {nameSuccess && <p className="text-xs text-green-500">Name updated!</p>}
        <button
          type="submit"
          disabled={namePending}
          className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {namePending ? 'Saving…' : 'Save'}
        </button>
      </form>

      <form
        onSubmit={handleChangePassword}
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3"
      >
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Change password</h3>
        <input
          type="password"
          value={currentPw}
          onChange={(e) => setCurrentPw(e.target.value)}
          placeholder="Current password"
          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        />
        <input
          type="password"
          value={newPw}
          onChange={(e) => setNewPw(e.target.value)}
          placeholder="New password (min 8 chars)"
          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        />
        <input
          type="password"
          value={confirmPw}
          onChange={(e) => setConfirmPw(e.target.value)}
          placeholder="Confirm new password"
          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        />
        {pwError && <p className="text-xs text-red-500">{pwError}</p>}
        {pwSuccess && <p className="text-xs text-green-500">Password changed!</p>}
        <button
          type="submit"
          disabled={pwPending || !currentPw || !newPw || !confirmPw}
          className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {pwPending ? 'Saving…' : 'Change password'}
        </button>
      </form>
    </div>
  );
}

// --- Notifications Tab ---
function NotificationsTab() {
  const qc = useQueryClient();

  const { data: me, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await api.get('/users/me');
      return data;
    },
  });

  const [prefs, setPrefs] = useState<{
    alertOnDown: boolean;
    alertOnRecovered: boolean;
    alertOnSslExpiry: boolean;
    weeklyDigestEnabled: boolean;
  } | null>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  const effective = prefs ??
    me?.notificationPreferences ?? {
      alertOnDown: true,
      alertOnRecovered: true,
      alertOnSslExpiry: true,
      weeklyDigestEnabled: true,
    };

  async function handleSave() {
    setSuccess(false);
    setError('');
    setPending(true);
    try {
      await api.patch('/users/me/notifications', effective);
      qc.invalidateQueries({ queryKey: ['me'] });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Failed to save preferences');
    } finally {
      setPending(false);
    }
  }

  if (isLoading) return <LoadingSkeleton rows={2} />;

  function toggle(key: keyof typeof effective) {
    setPrefs({ ...effective, [key]: !effective[key] });
  }

  return (
    <div className="max-w-md space-y-4">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Alert preferences
        </h3>
        {(
          [
            { key: 'alertOnDown', label: 'Notify when monitor goes DOWN' },
            { key: 'alertOnRecovered', label: 'Notify when monitor RECOVERS' },
            { key: 'alertOnSslExpiry', label: 'Notify on SSL certificate expiry' },
            { key: 'weeklyDigestEnabled', label: 'Receive weekly AI monitoring digest email' },
          ] as const
        ).map(({ key, label }) => (
          <label key={key} className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={effective[key]}
              onChange={() => toggle(key)}
              className="w-4 h-4 rounded text-blue-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
          </label>
        ))}
        {error && <p className="text-xs text-red-500">{error}</p>}
        {success && <p className="text-xs text-green-500">Preferences saved!</p>}
        <button
          onClick={handleSave}
          disabled={pending}
          className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}

// --- API Keys Tab ---
function ApiKeysTab() {
  const qc = useQueryClient();
  const [newKeyName, setNewKeyName] = useState('');
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [createError, setCreateError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: keys, isLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const { data } = await api.get('/api-keys');
      return data as any[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data } = await api.post('/api-keys', { name });
      return data;
    },
    onSuccess: (data) => {
      setRevealedKey(data.key);
      setNewKeyName('');
      qc.invalidateQueries({ queryKey: ['api-keys'] });
    },
    onError: (err: any) => {
      setCreateError(err.response?.data?.error ?? 'Failed to create key');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api-keys/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['api-keys'] });
      setDeletingId(null);
    },
  });

  if (isLoading) return <LoadingSkeleton rows={2} />;

  return (
    <div className="max-w-md space-y-4">
      {revealedKey && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
          <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
            Save your API key — it won't be shown again
          </p>
          <code className="text-xs bg-yellow-100 dark:bg-yellow-900/40 px-2 py-1 rounded font-mono break-all">
            {revealedKey}
          </code>
          <button
            onClick={() => setRevealedKey(null)}
            className="mt-2 block text-xs text-yellow-700 dark:text-yellow-400 underline"
          >
            I've saved it, dismiss
          </button>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (newKeyName) createMutation.mutate(newKeyName);
        }}
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3"
      >
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Generate new API key
        </h3>
        <input
          type="text"
          value={newKeyName}
          onChange={(e) => setNewKeyName(e.target.value)}
          placeholder="Key name (e.g. CI/CD)"
          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        />
        {createError && <p className="text-xs text-red-500">{createError}</p>}
        <button
          type="submit"
          disabled={!newKeyName || createMutation.isPending}
          className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {createMutation.isPending ? 'Generating…' : 'Generate key'}
        </button>
      </form>

      {keys && keys.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl divide-y divide-gray-100 dark:divide-gray-700">
          {keys.map((k: any) => (
            <div key={k.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{k.name}</p>
                <p className="text-xs text-gray-400">
                  Created {new Date(k.createdAt).toLocaleDateString()}
                  {k.lastUsedAt && ` · Last used ${new Date(k.lastUsedAt).toLocaleDateString()}`}
                </p>
              </div>
              {deletingId === k.id ? (
                <div className="flex gap-2 text-xs">
                  <button
                    onClick={() => deleteMutation.mutate(k.id)}
                    className="text-red-600 hover:text-red-700 font-medium"
                  >
                    Confirm delete
                  </button>
                  <button onClick={() => setDeletingId(null)} className="text-gray-500">
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setDeletingId(k.id)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {keys?.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400">No API keys yet.</p>
      )}
    </div>
  );
}

// --- Danger Zone Tab ---
function DangerZoneTab() {
  const [showConfirm, setShowConfirm] = useState(false);
  const clearToken = useAuthStore((s) => s.clearToken);
  const navigate = useNavigate();
  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await api.get('/users/me');
      return data;
    },
  });

  async function handleDeleteAccount() {
    await api.delete('/users/me');
    clearToken();
    navigate('/login');
  }

  return (
    <div className="max-w-md">
      <div className="bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2">
          Delete account
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          This will permanently delete your account and all associated monitors, incidents, and
          data. This action cannot be undone.
        </p>
        <button
          onClick={() => setShowConfirm(true)}
          className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700"
        >
          Delete my account
        </button>
      </div>

      {showConfirm && (
        <ConfirmDialog
          title="Delete account"
          message={`This will permanently delete your account (${me?.email}) and all associated data. This cannot be undone.`}
          onConfirm={handleDeleteAccount}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}

// --- Main Settings ---
const TABS: { id: Tab; label: string }[] = [
  { id: 'profile', label: 'Profile' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'api-keys', label: 'API Keys' },
  { id: 'danger', label: 'Danger Zone' },
];

export function Settings() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const { theme, setTheme } = useThemeStore();

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Settings</h2>

      {/* Theme toggle */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-6 max-w-md">
        <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">Theme</h3>
        <div className="flex gap-2">
          {(['light', 'dark', 'system'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`px-3 py-1.5 text-sm rounded-lg capitalize font-medium ${
                theme === t
                  ? 'bg-blue-600 text-white'
                  : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 dark:border-gray-700">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            } ${tab.id === 'danger' ? 'text-red-500 dark:text-red-400' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && <ProfileTab />}
      {activeTab === 'notifications' && <NotificationsTab />}
      {activeTab === 'api-keys' && <ApiKeysTab />}
      {activeTab === 'danger' && <DangerZoneTab />}
    </div>
  );
}
