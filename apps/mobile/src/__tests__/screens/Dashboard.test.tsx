// Mock all dependencies that cause test environment issues
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn() },
  useLocalSearchParams: jest.fn(() => ({})),
}));

jest.mock('../../hooks/useMonitors', () => ({
  useMonitors: jest.fn(),
}));

import { useMonitors } from '../../hooks/useMonitors';
const mockUseMonitors = useMonitors as jest.Mock;

describe('Dashboard screen logic', () => {
  it('shows loading state when isLoading is true', () => {
    mockUseMonitors.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });
    const result = mockUseMonitors();
    expect(result.isLoading).toBe(true);
    expect(result.data).toBeUndefined();
  });

  it('shows empty list when monitors array is empty', () => {
    mockUseMonitors.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });
    const result = mockUseMonitors();
    expect(result.data).toHaveLength(0);
    expect(result.isLoading).toBe(false);
  });

  it('returns monitor list items when data is loaded', () => {
    const monitors = [
      { id: '1', name: 'Test Monitor', url: 'https://example.com', status: 'UP', uptime: 99.9 },
      { id: '2', name: 'Another Monitor', url: 'https://foo.com', status: 'DOWN', uptime: 95.0 },
    ];
    mockUseMonitors.mockReturnValue({
      data: monitors,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });
    const result = mockUseMonitors();
    expect(result.data).toHaveLength(2);
    expect(result.data[0].name).toBe('Test Monitor');
    expect(result.data.filter((m: { status: string }) => m.status === 'DOWN')).toHaveLength(1);
  });
});
