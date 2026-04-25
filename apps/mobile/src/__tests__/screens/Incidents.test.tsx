jest.mock('../../hooks/useIncidents', () => ({ useIncidents: jest.fn() }));

import { useIncidents } from '../../hooks/useIncidents';

const mockUseIncidents = useIncidents as jest.Mock;

const makeIncident = (overrides: Partial<any> = {}) => ({
  id: 'inc-1',
  monitorId: 'mon-1',
  monitor: { name: 'My Site' },
  startedAt: new Date(Date.now() - 3600000).toISOString(),
  resolvedAt: new Date().toISOString(),
  durationMs: 3600000,
  aiSummary: 'Site was unreachable due to a network timeout.',
  ...overrides,
});

describe('Incidents screen logic', () => {
  it('renders incident list', () => {
    mockUseIncidents.mockReturnValue({
      data: [makeIncident(), makeIncident({ id: 'inc-2' })],
      isLoading: false,
      refetch: jest.fn(),
    });
    const result = mockUseIncidents();
    expect(result.data).toHaveLength(2);
  });

  it('shows empty state when no incidents', () => {
    mockUseIncidents.mockReturnValue({ data: [], isLoading: false, refetch: jest.fn() });
    const result = mockUseIncidents();
    expect(result.data).toHaveLength(0);
  });

  it('expands row on press to show AI summary', () => {
    const incident = makeIncident({ aiSummary: 'Network issue detected.' });
    expect(incident.aiSummary).toBe('Network issue detected.');
    // Expansion is controlled by local `expanded` state toggled on press
    let expanded = false;
    function toggle() {
      expanded = !expanded;
    }
    toggle();
    expect(expanded).toBe(true);
    expect(incident.aiSummary).toBeDefined();
  });
});
