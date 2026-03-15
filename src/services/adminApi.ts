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

const buildHeaders = (requesterEmail: string, hasBody = false): Record<string, string> => {
  const headers: Record<string, string> = {
    'X-User-Email': requesterEmail,
  };

  if (hasBody) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
};

export async function fetchStates(requesterEmail: string): Promise<StateOption[]> {
  const response = await fetch(apiUrl('/api/admin/states'), {
    headers: buildHeaders(requesterEmail),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.detail || 'Failed to fetch states');
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

export async function fetchRegionalOfficers(requesterEmail: string): Promise<RegionalOfficer[]> {
  const response = await fetch(apiUrl('/api/admin/regional-officers'), {
    headers: buildHeaders(requesterEmail),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.detail || 'Failed to fetch regional officers');
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

export async function addRegionalOfficer(requesterEmail: string, payload: AddRegionalOfficerPayload): Promise<void> {
  const response = await fetch(apiUrl('/api/admin/add-regional-officer'), {
    method: 'POST',
    headers: buildHeaders(requesterEmail, true),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errPayload = await response.json().catch(() => ({}));
    throw new Error(errPayload?.detail || 'Failed to add regional officer');
  }
}

export async function deleteRegionalOfficer(requesterEmail: string, email: string): Promise<void> {
  const response = await fetch(apiUrl(`/api/admin/delete-regional-officer/${encodeURIComponent(email)}`), {
    method: 'DELETE',
    headers: buildHeaders(requesterEmail),
  });

  if (!response.ok) {
    const errPayload = await response.json().catch(() => ({}));
    throw new Error(errPayload?.detail || 'Failed to delete regional officer');
  }
}
