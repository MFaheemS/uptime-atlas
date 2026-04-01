import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { useMonitors } from '../../hooks/useMonitors';

vi.mock('../../lib/axios', () => ({
  default: {
    get: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

import api from '../../lib/axios';

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return React.createElement(QueryClientProvider, { client: qc }, children);
}

describe('useMonitors', () => {
  it('returns monitors list on success', async () => {
    const monitors = [{ id: '1', name: 'Site', url: 'https://site.com' }];
    (api.get as any).mockResolvedValue({ data: monitors });
    const { result } = renderHook(() => useMonitors(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(monitors);
  });

  it('returns error state on API failure', async () => {
    (api.get as any).mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useMonitors(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeTruthy();
  });
});
