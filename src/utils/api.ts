export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://backend-production-c4e3.up.railway.app';
// Build full URL for assets returned as relative paths (e.g. "/uploads/abc.jpg")
export function assetUrl(path?: string | null): string {
  if (!path) return '';
  const p = String(path).trim();
  if (p.startsWith('http://') || p.startsWith('https://')) return p;
  const clean = p.startsWith('/') ? p.slice(1) : p;
  return `${API_BASE}/${clean}`;
}

function getToken() {
  return localStorage.getItem('mv_token');
}

function setToken(token: string | null) {
  if (token) localStorage.setItem('mv_token', token);
  else localStorage.removeItem('mv_token');
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as any),
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const baseMsg = (data && (data.error || data.message)) || 'API error';
    const detail = (data && (data.detail || data.details)) ? ` (${data.detail || data.details})` : '';
    const msg = `${baseMsg}${detail}`;
    throw new Error(msg);
  }

  return data as T;
}

export async function apiFetchForm<T>(path: string, formData: FormData, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as any),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    method: options.method || 'POST',
    headers,
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const baseMsg = (data && (data.error || data.message)) || 'API error';
    const detail = (data && (data.detail || data.details)) ? ` (${data.detail || data.details})` : '';
    const msg = `${baseMsg}${detail}`;
    throw new Error(msg);
  }
  return data as T;
}

export type ApiUser = {
  id: number | string;
  full_name: string;
  email: string;
  role: 'user' | 'admin' | string;
};

export type ApiContent = {
  id: number | string;
  title: string;
  description?: string | null;
  type: 'movie' | 'series' | 'live' | string;
  category?: string | null;
  poster_url?: string | null;
  backdrop_url?: string | null;
  video_url?: string | null;
  year?: number | null;
  age_rating?: string | null;
  duration_minutes?: number | null;
  production_house?: string | null;
  distribution?: string | null;
  seasons_count?: number | null;
  episodes_count?: number | null;
};

export const AuthAPI = {
  async login(email: string, password: string) {
    const data = await apiFetch<{ token: string; user: ApiUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    return data.user;
  },

  async register(full_name: string, email: string, password: string) {
    const data = await apiFetch<{ token: string; user: ApiUser }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ full_name, email, password }),
    });
    setToken(data.token);
    return data.user;
  },

  async me() {
    const data = await apiFetch<{ user: ApiUser }>('/api/auth/me');
    return data.user;
  },

  async logout() {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setToken(null);
    }
  },

  token() {
    return getToken();
  },
};

export const ContentAPI = {
  async list(type?: string) {
    const q = type ? `?type=${encodeURIComponent(type)}` : '';
    return apiFetch<{ items: ApiContent[] }>(`/api/content${q}`);
  },

  async get(id: string | number) {
    return apiFetch<{ item: ApiContent }>(`/api/content/${id}`);
  },
};

export const AdminAPI = {
  async createUser(payload: { full_name: string; email: string; password: string; role?: 'user' | 'admin' }) {
    return apiFetch<{ user: ApiUser }>(`/api/admin/users`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async analytics() {
    return apiFetch<{ totals: any; content_by_type: Array<{ type: string; count: string | number }> }>(
      `/api/admin/analytics`
    );
  },

  async createContent(formData: FormData) {
    return apiFetchForm<{ item: ApiContent }>(`/api/content`, formData, { method: 'POST' });
  },

  async deleteContent(id: string | number) {
    try {
      return await apiFetch<{ ok: true }>(`/api/content/${id}`, { method: 'DELETE' });
    } catch (e) {
      // Fallback for servers that block DELETE
      return await apiFetch<{ ok: true }>(`/api/content/${id}/delete`, { method: 'POST' });
    }
  },

  async updateContent(id: string | number, formData: FormData) {
    try {
      return await apiFetchForm<{ item: ApiContent }>(`/api/content/${id}`, formData, { method: 'PATCH' });
    } catch (e) {
      // Fallback for servers that block PATCH
      return await apiFetchForm<{ item: ApiContent }>(`/api/content/${id}/update`, formData, { method: 'POST' });
    }
  },

  async importPlaylist(formData: FormData) {
    return apiFetchForm<{ created: number; skipped: number; items?: ApiContent[] }>(`/api/content/import`, formData, { method: 'POST' });
  },

  async importJson(formData: FormData) {
    return apiFetchForm<{ created: number; skipped?: number }>(`/api/content/import-json`, formData, { method: 'POST' });
  },
};
