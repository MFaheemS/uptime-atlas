import { useState } from 'react';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  url: z.string().url('Must be a valid URL'),
  intervalMinutes: z.number().int().min(1),
  alertThreshold: z.number().int().min(1),
  slug: z
    .string()
    .regex(/^[a-z0-9-]*$/, 'Slug: lowercase letters, numbers, hyphens only')
    .optional(),
});

type Fields = z.infer<typeof schema>;
type FormErrors = Partial<Record<keyof Fields, string>>;

const INTERVALS = [
  { label: '1 min', value: 1 },
  { label: '5 min', value: 5 },
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '60 min', value: 60 },
];

const THRESHOLDS = [1, 2, 3];

const channelSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('EMAIL'), target: z.string().email('Invalid email') }),
  z.object({ type: z.literal('SLACK'), target: z.string().url('Must be a Slack webhook URL') }),
  z.object({ type: z.literal('WEBHOOK'), target: z.string().url('Must be a valid URL') }),
]);

type ChannelType = 'EMAIL' | 'SLACK' | 'WEBHOOK';

interface Channel {
  id?: string;
  type: ChannelType;
  target: string;
}

interface MonitorFormProps {
  monitorId?: string;
  initialData?: Partial<Fields & { notificationChannels?: Channel[] }>;
  onSuccess: () => void;
  onCancel: () => void;
}

export function MonitorForm({ monitorId, initialData, onSuccess, onCancel }: MonitorFormProps) {
  const qc = useQueryClient();
  const isEdit = !!monitorId;

  const [fields, setFields] = useState<Fields>({
    name: initialData?.name ?? '',
    url: initialData?.url ?? '',
    intervalMinutes: initialData?.intervalMinutes ?? 5,
    alertThreshold: initialData?.alertThreshold ?? 1,
    slug: initialData?.slug ?? '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [channels, setChannels] = useState<Channel[]>(initialData?.notificationChannels ?? []);
  const [newChannel, setNewChannel] = useState<{ type: ChannelType; target: string }>({
    type: 'EMAIL',
    target: '',
  });
  const [channelError, setChannelError] = useState('');
  const [submitError, setSubmitError] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = { ...fields, slug: fields.slug || undefined };
      if (isEdit) {
        const { data } = await api.patch(`/monitors/${monitorId}`, payload);
        return data;
      } else {
        const { data } = await api.post('/monitors', payload);
        return data;
      }
    },
    onSuccess: async (monitor) => {
      // Sync notification channels for new monitors
      if (!isEdit) {
        await Promise.all(
          channels.map((ch) =>
            api.post(`/monitors/${monitor.id}/channels`, { type: ch.type, target: ch.target }),
          ),
        );
      }
      qc.invalidateQueries({ queryKey: ['monitors'] });
      if (monitorId) qc.invalidateQueries({ queryKey: ['monitor', monitorId] });
      onSuccess();
    },
    onError: (err: any) => {
      setSubmitError(err.response?.data?.error ?? 'Something went wrong');
    },
  });

  function validate(): boolean {
    const result = schema.safeParse(fields);
    if (!result.success) {
      const errs: FormErrors = {};
      for (const e of result.error.errors) {
        const key = e.path[0] as keyof Fields;
        errs[key] = e.message;
      }
      setErrors(errs);
      return false;
    }
    setErrors({});
    return true;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    mutation.mutate();
  }

  function addChannel() {
    const result = channelSchema.safeParse(newChannel);
    if (!result.success) {
      setChannelError(result.error.errors[0].message);
      return;
    }
    setChannels([...channels, newChannel]);
    setNewChannel({ type: 'EMAIL', target: '' });
    setChannelError('');
  }

  function removeChannel(idx: number) {
    setChannels(channels.filter((_, i) => i !== idx));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Name
        </label>
        <input
          type="text"
          value={fields.name}
          onChange={(e) => setFields({ ...fields, name: e.target.value })}
          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        />
        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
      </div>

      {/* URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          URL
        </label>
        <input
          type="url"
          value={fields.url}
          onChange={(e) => setFields({ ...fields, url: e.target.value })}
          placeholder="https://example.com"
          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        />
        {errors.url && <p className="text-xs text-red-500 mt-1">{errors.url}</p>}
      </div>

      {/* Interval */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Check interval
        </label>
        <select
          value={fields.intervalMinutes}
          onChange={(e) => setFields({ ...fields, intervalMinutes: Number(e.target.value) })}
          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        >
          {INTERVALS.map((i) => (
            <option key={i.value} value={i.value}>
              {i.label}
            </option>
          ))}
        </select>
      </div>

      {/* Alert threshold */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Alert threshold (consecutive failures)
        </label>
        <select
          value={fields.alertThreshold}
          onChange={(e) => setFields({ ...fields, alertThreshold: Number(e.target.value) })}
          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        >
          {THRESHOLDS.map((t) => (
            <option key={t} value={t}>
              {t} failure{t > 1 ? 's' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Slug */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Status page slug <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={fields.slug}
          onChange={(e) => setFields({ ...fields, slug: e.target.value })}
          placeholder="my-site"
          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        />
        {errors.slug && <p className="text-xs text-red-500 mt-1">{errors.slug}</p>}
        {fields.slug && (
          <p className="text-xs text-gray-400 mt-1">Status page: /status/{fields.slug}</p>
        )}
      </div>

      {/* Notification channels */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Notification channels
        </label>

        {channels.length > 0 && (
          <div className="space-y-1 mb-3">
            {channels.map((ch, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm"
              >
                <span>
                  <span className="font-medium text-gray-600 dark:text-gray-400 mr-2">
                    {ch.type}
                  </span>
                  <span className="text-gray-700 dark:text-gray-300">{ch.target}</span>
                </span>
                <button
                  type="button"
                  onClick={() => removeChannel(idx)}
                  className="text-red-400 hover:text-red-600 text-xs"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <select
            value={newChannel.type}
            onChange={(e) => setNewChannel({ ...newChannel, type: e.target.value as ChannelType })}
            className="px-2 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          >
            <option value="EMAIL">Email</option>
            <option value="SLACK">Slack</option>
            <option value="WEBHOOK">Webhook</option>
          </select>
          <input
            type="text"
            value={newChannel.target}
            onChange={(e) => setNewChannel({ ...newChannel, target: e.target.value })}
            placeholder={newChannel.type === 'EMAIL' ? 'you@example.com' : 'https://...'}
            className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          />
          <button
            type="button"
            onClick={addChannel}
            className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600"
          >
            Add
          </button>
        </div>
        {channelError && <p className="text-xs text-red-500 mt-1">{channelError}</p>}
      </div>

      {submitError && <p className="text-sm text-red-500">{submitError}</p>}

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 font-medium"
        >
          {mutation.isPending ? 'Saving…' : isEdit ? 'Update monitor' : 'Add monitor'}
        </button>
      </div>
    </form>
  );
}
