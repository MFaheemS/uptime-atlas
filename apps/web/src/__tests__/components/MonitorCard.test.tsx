import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { MonitorCard } from '../../components/MonitorCard';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const monitor = {
  id: 'mon-1',
  name: 'My Site',
  url: 'https://example.com',
  status: 'up',
  uptime: 99.9,
};

function renderCard(overrides = {}) {
  return render(
    <MemoryRouter>
      <MonitorCard monitor={{ ...monitor, ...overrides }} />
    </MemoryRouter>,
  );
}

describe('MonitorCard', () => {
  it('renders monitor name and URL', () => {
    renderCard();
    expect(screen.getByText('My Site')).toBeInTheDocument();
    expect(screen.getByText('https://example.com')).toBeInTheDocument();
  });

  it('shows green UP badge when status is up', () => {
    renderCard({ status: 'up' });
    expect(screen.getByText('UP')).toBeInTheDocument();
  });

  it('shows red DOWN badge when status is down', () => {
    renderCard({ status: 'down' });
    expect(screen.getByText('DOWN')).toBeInTheDocument();
  });

  it('navigates to correct route on click', async () => {
    renderCard();
    await userEvent.click(screen.getByText('My Site'));
    expect(mockNavigate).toHaveBeenCalledWith('/monitors/mon-1');
  });
});
