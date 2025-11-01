import { API_BASE } from './config';

export async function listReportsByBounds({ neLat, neLng, swLat, swLng }) {
  const url = `${API_BASE}/api/trash/reports?neLat=${neLat}&neLng=${neLng}&swLat=${swLat}&swLng=${swLng}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('reports fetch failed');
  const data = await res.json();
  return (data.reports || []).map(r => ({ ...r, status: String(r.status || '').toLowerCase() }));
}

export async function startProcessing(reportId) {
  const res = await fetch(`${API_BASE}/api/trash/reports/${reportId}/start`, { method:'POST' });
  if (!res.ok) throw new Error(await res.text().catch(()=> 'start failed'));
  return res.json();
}

export async function completeProcessing(reportId, payload) {
  const res = await fetch(`${API_BASE}/api/trash/reports/${reportId}/complete`, {
    method:'POST',
    headers:{ 'Content-Type':'application/json' },
    body: JSON.stringify(payload), // { completePhotoUri, comment }
  });
  if (!res.ok) throw new Error(await res.text().catch(()=> 'complete failed'));
  return res.json();
}

export async function uploadIfNeeded(localUri) {
  if (!localUri || /^https?:\/\//.test(localUri)) return localUri;
  const form = new FormData();
  form.append('file', { uri: localUri, name:'photo.jpg', type:'image/jpeg' });
  const res = await fetch(`${API_BASE}/api/upload`, { method:'POST', body: form });
  if (!res.ok) throw new Error('upload failed');
  const json = await res.json();
  return json.url;
}
