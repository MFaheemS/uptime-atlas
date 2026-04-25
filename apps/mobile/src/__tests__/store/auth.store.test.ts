jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../lib/api', () => ({
  api: {
    post: jest.fn(),
    get: jest.fn(),
    patch: jest.fn(),
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
  },
  setupApiInterceptors: jest.fn(),
}));

import { useAuthStore } from '../../store/auth.store';

describe('auth.store', () => {
  beforeEach(() => {
    useAuthStore.setState({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  });

  it('setToken updates accessToken in store', () => {
    useAuthStore.getState().setUser({ id: '1', email: 'a@b.com', name: 'Alice' });
    useAuthStore.setState({ accessToken: 'tok123' });
    expect(useAuthStore.getState().accessToken).toBe('tok123');
  });

  it('clearToken removes token and user', async () => {
    useAuthStore.setState({
      accessToken: 'tok',
      user: { id: '1', email: 'a@b.com', name: 'Alice' },
      isAuthenticated: true,
    });
    await useAuthStore.getState().logout();
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('isAuthenticated is true when token is set', () => {
    useAuthStore.setState({ accessToken: 'mytoken', isAuthenticated: true });
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().accessToken).toBe('mytoken');
  });
});
