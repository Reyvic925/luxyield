jest.mock('axios', () => {
  const mockAxios = {
    defaults: {},
    interceptors: {
      request: { use: jest.fn((handler) => handler) },
      response: { use: jest.fn() },
    },
  };

  return { __esModule: true, default: mockAxios };
});

import axios from './axios';

describe('axios auth interceptor', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('prefers the user token for portfolio requests even when an admin is logged in', () => {
    localStorage.setItem('adminToken', 'admin-token');
    localStorage.setItem('token', 'user-token');

    const requestHandler = axios.interceptors.request.use.mock.calls[0][0];
    const config = requestHandler({ url: '/api/portfolio', headers: {} });

    expect(config.headers.Authorization).toBe('Bearer user-token');
  });

  it('keeps admin tokens on admin routes', () => {
    localStorage.setItem('adminToken', 'admin-token');
    localStorage.setItem('token', 'user-token');

    const requestHandler = axios.interceptors.request.use.mock.calls[0][0];
    const config = requestHandler({ url: '/api/admin/users/123/portfolio', headers: {} });

    expect(config.headers.Authorization).toBe('Bearer admin-token');
  });
});
