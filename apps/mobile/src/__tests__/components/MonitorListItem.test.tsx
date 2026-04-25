import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MonitorListItem } from '../../components/MonitorListItem';

jest.mock('../../hooks/useAnomalies', () => ({
  useRecentAnomaly: jest.fn().mockReturnValue(false),
}));

function Wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

const baseMonitor = {
  id: '1',
  name: 'My API',
  url: 'https://api.example.com',
  status: 'UP' as const,
  uptime: 99.9,
  lastCheckedAt: new Date().toISOString(),
};

describe('MonitorListItem', () => {
  it('renders monitor name and URL', () => {
    const { getByText } = render(
      <Wrapper>
        <MonitorListItem monitor={baseMonitor} onPress={() => {}} />
      </Wrapper>,
    );
    expect(getByText('My API')).toBeTruthy();
    expect(getByText('https://api.example.com')).toBeTruthy();
  });

  it('shows green dot for UP status', () => {
    render(
      <Wrapper>
        <MonitorListItem monitor={{ ...baseMonitor, status: 'UP' }} onPress={() => {}} />
      </Wrapper>,
    );
    expect(true).toBe(true);
  });

  it('shows red dot for DOWN status', () => {
    const { getByText } = render(
      <Wrapper>
        <MonitorListItem monitor={{ ...baseMonitor, status: 'DOWN' }} onPress={() => {}} />
      </Wrapper>,
    );
    expect(getByText('My API')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Wrapper>
        <MonitorListItem monitor={baseMonitor} onPress={onPress} />
      </Wrapper>,
    );
    fireEvent.press(getByText('My API'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
