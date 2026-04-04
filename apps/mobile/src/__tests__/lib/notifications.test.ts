import { registerForPushNotifications } from '../../lib/notifications';

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
}));

jest.mock('expo-device', () => ({
  isDevice: true,
  osName: 'Android',
}));

jest.mock('../../lib/api', () => ({
  api: {
    post: jest.fn(),
  },
}));

import * as Notifications from 'expo-notifications';
import { api } from '../../lib/api';

const mockGetPermissions = Notifications.getPermissionsAsync as jest.Mock;
const mockRequestPermissions = Notifications.requestPermissionsAsync as jest.Mock;
const mockGetToken = Notifications.getExpoPushTokenAsync as jest.Mock;
const mockApiPost = api.post as jest.Mock;

describe('registerForPushNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not crash if push permission is denied', async () => {
    mockGetPermissions.mockResolvedValue({ status: 'undetermined' });
    mockRequestPermissions.mockResolvedValue({ status: 'denied' });
    await expect(registerForPushNotifications()).resolves.not.toThrow();
    expect(mockApiPost).not.toHaveBeenCalled();
  });

  it('calls POST /device-tokens after successful token registration', async () => {
    mockGetPermissions.mockResolvedValue({ status: 'granted' });
    mockGetToken.mockResolvedValue({ data: 'ExponentPushToken[test123]' });
    mockApiPost.mockResolvedValue({});
    await registerForPushNotifications();
    expect(mockApiPost).toHaveBeenCalledWith('/device-tokens', {
      token: 'ExponentPushToken[test123]',
      platform: 'android',
    });
  });
});
