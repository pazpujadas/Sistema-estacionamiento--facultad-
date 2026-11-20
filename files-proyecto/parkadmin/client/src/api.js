export const getToken = () => localStorage.getItem('token');
export async function api(path, body) {
  const r = await fetch('/api' + path, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json', ...(getToken() && { Authorization: 'Bearer ' + getToken() }) },
    body: body && JSON.stringify(body),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || 'Ocurrió un error');
  return d;
}
