import { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { z } from 'zod';
import { useCreateMonitor } from '../hooks/useCreateMonitor';
import { ErrorMessage } from './ErrorMessage';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  url: z.string().url('Must be a valid URL'),
  intervalMinutes: z.number(),
  alertThreshold: z.number(),
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

export function AddMonitorModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const mutation = useCreateMonitor();
  const [fields, setFields] = useState<Fields>({
    name: '',
    url: '',
    intervalMinutes: 5,
    alertThreshold: 1,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [urlValid, setUrlValid] = useState<boolean | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Real-time URL validation
  useEffect(() => {
    if (!fields.url) {
      setUrlValid(null);
      return;
    }
    setUrlValid(z.string().url().safeParse(fields.url).success);
  }, [fields.url]);

  function update<K extends keyof Fields>(key: K, value: Fields[K]) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = schema.safeParse(fields);
    if (!result.success) {
      const fe: FormErrors = {};
      result.error.errors.forEach((err) => {
        fe[err.path[0] as keyof FormErrors] = err.message;
      });
      setErrors(fe);
      return;
    }
    setErrors({});
    try {
      await mutation.mutateAsync(fields);
      onSuccess();
    } catch {
      // error shown via mutation.error
    }
  }

  const inputClass =
    'w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm';

  const modal = (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-none sm:rounded-xl shadow-2xl p-6 w-full sm:max-w-md sm:mx-4 min-h-screen sm:min-h-0 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Add Monitor</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none"
          >
            &times;
          </button>
        </div>

        {mutation.error && (
          <div className="mb-4">
            <ErrorMessage
              message={(mutation.error as any)?.response?.data?.error ?? 'Failed to create monitor'}
            />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={fields.name}
              onChange={(e) => update('name', e.target.value)}
              className={inputClass}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">URL</label>
            <div className="relative">
              <input
                type="text"
                value={fields.url}
                onChange={(e) => update('url', e.target.value)}
                placeholder="https://example.com"
                className={`${inputClass} pr-8`}
              />
              {urlValid !== null && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm">
                  {urlValid ? '✅' : '❌'}
                </span>
              )}
            </div>
            {errors.url && <p className="text-red-500 text-xs mt-1">{errors.url}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Check Interval</label>
            <select
              value={fields.intervalMinutes}
              onChange={(e) => update('intervalMinutes', Number(e.target.value))}
              className={inputClass}
            >
              {INTERVALS.map((i) => (
                <option key={i.value} value={i.value}>
                  {i.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Alert Threshold (consecutive failures)
            </label>
            <select
              value={fields.alertThreshold}
              onChange={(e) => update('alertThreshold', Number(e.target.value))}
              className={inputClass}
            >
              {THRESHOLDS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium flex items-center gap-2"
            >
              {mutation.isPending && (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              Add Monitor
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
}
