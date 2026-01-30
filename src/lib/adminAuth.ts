type AdminResponse = {
  ok: boolean;
  error?: string;
  user?: string;
};

const endpoints = {
  login: '/api/admin/login',
  session: '/api/admin/session',
  logout: '/api/admin/logout'
};

const parseResponse = async (response: Response): Promise<AdminResponse> => {
  const data = (await response.json().catch(() => ({}))) as AdminResponse;
  if (!response.ok) {
    return { ok: false, error: data.error || 'Request failed' };
  }
  return data;
};

export const checkAdminSession = async (): Promise<AdminResponse> => {
  const response = await fetch(endpoints.session, {
    method: 'GET',
    credentials: 'include'
  });
  return parseResponse(response);
};

export const loginAdmin = async (username: string, password: string): Promise<AdminResponse> => {
  const response = await fetch(endpoints.login, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  return parseResponse(response);
};

export const logoutAdmin = async (): Promise<AdminResponse> => {
  const response = await fetch(endpoints.logout, {
    method: 'POST',
    credentials: 'include'
  });
  return parseResponse(response);
};
