function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
}
function cfg(env) {
  const url = String(env.SUPABASE_URL || '').replace(/\/+$/, '');
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error('SUPABASE_SERVICE_ROLE_KEY 또는 SUPABASE_SECRET_KEY가 필요합니다.');
  return { url, key };
}
function safeName(name) {
  return String(name || 'file').normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g, '_').slice(-120);
}
export async function onRequest(context) {
  const { request, env } = context;
  try {
    const { url, key } = cfg(env);
    const reqUrl = new URL(request.url);
    if (request.method === 'POST') {
      const form = await request.formData();
      const file = form.get('file');
      const applicationId = String(form.get('applicationId') || 'unknown');
      if (!(file instanceof File)) return json({ ok: false, error: '첨부파일이 없습니다.' }, 400);
      if (file.size > 5 * 1024 * 1024) return json({ ok: false, error: '파일은 5MB 이하만 가능합니다.' }, 400);
      if (!(file.type.startsWith('image/') || file.type === 'application/pdf')) return json({ ok: false, error: '이미지 또는 PDF만 가능합니다.' }, 400);
      const path = `${applicationId}/${crypto.randomUUID()}_${safeName(file.name)}`;
      const res = await fetch(`${url}/storage/v1/object/benefit-evidence/${encodeURIComponent(path).replace(/%2F/g, '/')}`, {
        method: 'POST',
        headers: { apikey: key, authorization: `Bearer ${key}`, 'content-type': file.type || 'application/octet-stream', 'x-upsert': 'false' },
        body: file.stream()
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text || `파일 업로드 실패 ${res.status}`);
      return json({ ok: true, file: { path, name: file.name, type: file.type, size: file.size, url: `/api/benefit-files?path=${encodeURIComponent(path)}` } });
    }
    if (request.method === 'GET') {
      const path = reqUrl.searchParams.get('path');
      if (!path) return json({ ok: false, error: 'path가 필요합니다.' }, 400);
      const res = await fetch(`${url}/storage/v1/object/authenticated/benefit-evidence/${encodeURIComponent(path).replace(/%2F/g, '/')}`, { headers: { apikey: key, authorization: `Bearer ${key}` } });
      if (!res.ok) return json({ ok: false, error: await res.text() }, res.status);
      return new Response(res.body, { status: 200, headers: { 'content-type': res.headers.get('content-type') || 'application/octet-stream', 'content-disposition': `inline; filename="${safeName(path.split('/').pop())}"`, 'cache-control': 'private, max-age=60' } });
    }
    if (request.method === 'DELETE') {
      const path = reqUrl.searchParams.get('path');
      if (!path) return json({ ok: false, error: 'path가 필요합니다.' }, 400);
      const res = await fetch(`${url}/storage/v1/object/benefit-evidence/${encodeURIComponent(path).replace(/%2F/g, '/')}`, { method: 'DELETE', headers: { apikey: key, authorization: `Bearer ${key}` } });
      if (!res.ok) throw new Error(await res.text());
      return json({ ok: true });
    }
    return json({ ok: false, error: '지원하지 않는 요청입니다.' }, 405);
  } catch (error) {
    return json({ ok: false, error: error?.message || String(error) }, 500);
  }
}
