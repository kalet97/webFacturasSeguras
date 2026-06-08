const BASE_URL = import.meta.env.VITE_API_BASE_URL

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE_URL}/api${path}`, { ...options, headers })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message || `Error ${res.status}`)
  }

  return res.json()
}

async function uploadFile<T>(path: string, formData: FormData, token?: string | null): Promise<T> {
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${BASE_URL}/api${path}`, { method: 'POST', headers, body: formData })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message || `Error ${res.status}`)
  }
  return res.json()
}

export const api = {
  get: <T>(path: string, token?: string | null) =>
    request<T>(path, { method: 'GET' }, token),

  post: <T>(path: string, body: unknown, token?: string | null) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }, token),

  put: <T>(path: string, body: unknown, token?: string | null) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }, token),

  delete: <T>(path: string, body: unknown, token?: string | null) =>
    request<T>(path, { method: 'DELETE', body: JSON.stringify(body) }, token),

  upload: <T>(path: string, formData: FormData, token?: string | null) =>
    uploadFile<T>(path, formData, token),
}
