import API_BASE from '../config/api';

const API_BASE_URL = API_BASE.replace(/\/$/, '');

const apiUrl = (path: string) => (API_BASE_URL ? `${API_BASE_URL}${path}` : path);

export interface StateOption {
  id: number;
  state_name: string;
}

export interface RegionalOfficer {
  id: number;
  email: string;
  state_id: number;
  state_name: string;
}

export interface AddRegionalOfficerPayload {
  email: string;
  password: string;
  state_id: number;
}

const buildHeaders = (authToken: string, requesterEmail = '', hasBody = false): Record<string, string> => {
  const headers: Record<string, string> = {};

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  if (requesterEmail) {
    headers['X-User-Email'] = requesterEmail;
  }

  if (hasBody) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
};

export async function fetchStates(authToken: string, requesterEmail = ''): Promise<StateOption[]> {
  const response = await fetch(apiUrl('/api/admin/states'), {
    headers: buildHeaders(authToken, requesterEmail),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.detail || 'Failed to fetch states');
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

export async function fetchRegionalOfficers(authToken: string, requesterEmail = ''): Promise<RegionalOfficer[]> {
  const response = await fetch(apiUrl('/api/admin/regional-officers'), {
    headers: buildHeaders(authToken, requesterEmail),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.detail || 'Failed to fetch regional officers');
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

export async function addRegionalOfficer(authToken: string, payload: AddRegionalOfficerPayload, requesterEmail = ''): Promise<void> {
  const response = await fetch(apiUrl('/api/admin/add-regional-officer'), {
    method: 'POST',
    headers: buildHeaders(authToken, requesterEmail, true),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errPayload = await response.json().catch(() => ({}));
    throw new Error(errPayload?.detail || 'Failed to add regional officer');
  }
}

export async function deleteRegionalOfficer(authToken: string, email: string, requesterEmail = ''): Promise<void> {
  const response = await fetch(apiUrl(`/api/admin/delete-regional-officer/${encodeURIComponent(email)}`), {
    method: 'DELETE',
    headers: buildHeaders(authToken, requesterEmail),
  });

  if (!response.ok) {
    const errPayload = await response.json().catch(() => ({}));
    throw new Error(errPayload?.detail || 'Failed to delete regional officer');
  }
}
