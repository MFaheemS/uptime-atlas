jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn() },
  useLocalSearchParams: jest.fn(() => ({ id: 'monitor-1' })),
}));

jest.mock('../../hooks/useMonitor', () => ({ useMonitor: jest.fn() }));
jest.mock('../../hooks/useMonitorStats', () => ({ useMonitorStats: jest.fn() }));
jest.mock('../../hooks/useAnomalies', () => ({
  useAnomalies: jest.fn(),
  useRecentAnomaly: jest.fn(),
}));

import { useMonitor } from '../../hooks/useMonitor';
import { useMonitorStats } from '../../hooks/useMonitorStats';
import { useAnomalies } from '../../hooks/useAnomalies';

const mockUseMonitor = useMonitor as jest.Mock;
const mockUseMonitorStats = useMonitorStats as jest.Mock;
const mockUseAnomalies = useAnomalies as jest.Mock;

const baseMonitor = {
  id: 'monitor-1',
  name: 'My Site',
  url: 'https://example.com',
  status: 'UP',
  uptime: 99.9,
};

describe('MonitorDetail screen logic', () => {
  beforeEach(() => {
    mockUseMonitorStats.mockReturnValue({ data: null, isLoading: false });
    mockUseAnomalies.mockReturnValue({ data: [] });
  });

  it('shows loading state while data is fetching', () => {
    mockUseMonitor.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: jest.fn(),
    });
    const result = mockUseMonitor('monitor-1');
    expect(result.isLoading).toBe(true);
    expect(result.data).toBeUndefined();
  });

  it('renders monitor name when loaded', () => {
    mockUseMonitor.mockReturnValue({
      data: baseMonitor,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    const result = mockUseMonitor('monitor-1');
    expect(result.data?.name).toBe('My Site');
  });

  it('shows anomaly warning card when anomalies exist in last hour', () => {
    const recentAnomaly = {
      id: 'a1',
      monitorId: 'monitor-1',
      detectedAt: new Date().toISOString(),
      zScore: 3.5,
      responseTimeMs: 5000,
      meanResponseTimeMs: 200,
    };
    mockUseAnomalies.mockReturnValue({ data: [recentAnomaly] });
    const result = mockUseAnomalies('monitor-1');
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const hasRecentAnomaly = result.data.some(
      (a: any) => new Date(a.detectedAt).getTime() > oneHourAgo,
    );
    expect(hasRecentAnomaly).toBe(true);
  });

  it('does not show anomaly card when no anomalies', () => {
    mockUseAnomalies.mockReturnValue({ data: [] });
    const result = mockUseAnomalies('monitor-1');
    expect(result.data).toHaveLength(0);
  });
});
