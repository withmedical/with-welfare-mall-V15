const TABLES = {
  reservations: 'reservations_v2',
  benefits: 'benefit_applications_v2',
  events: 'event_applications_v2',
  notifications: 'notifications_v2',
  kakao: 'kakao_outbox_v2'
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
}

function envConfig(env) {
  const url = String(env.SUPABASE_URL || '').replace(/\/+$/, '');
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY || env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase 환경변수가 없습니다.');
  return { url, key };
}

async function rest(env, table, options = {}) {
  const { url, key } = envConfig(env);
  const headers = {
    apikey: key,
    authorization: `Bearer ${key}`,
    'content-type': 'application/json',
    prefer: options.prefer || 'return=representation'
  };
  const res = await fetch(`${url}/rest/v1/${table}${options.query || ''}`, {
    method: options.method || 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });
  const text = await res.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!res.ok) {
    const message = body?.message || body?.error || text || `HTTP ${res.status}`;
    throw new Error(message);
  }
  return body;
}

async function cleanupExpiredBenefitFiles(env) {
  try {
    const allRows = await rest(env, TABLES.benefits, { query: '?select=id,payload', prefer: 'return=minimal' });
    const now = Date.now();
    const expired = (Array.isArray(allRows) ? allRows : []).filter(row => {
      const value = row.payload?.attachment_delete_after;
      return value && !Number.isNaN(Date.parse(value)) && Date.parse(value) <= now;
    });
    if (!expired.length) return;
    const { url, key } = envConfig(env);
    for (const row of expired) {
      const files = Array.isArray(row.payload?.attachments) ? row.payload.attachments : [];
      for (const file of files) {
        if (!file?.path) continue;
        await fetch(`${url}/storage/v1/object/benefit-evidence/${encodeURIComponent(file.path).replace(/%2F/g, '/')}`, {
          method: 'DELETE',
          headers: { apikey: key, authorization: `Bearer ${key}` }
        });
      }
      const payload = { ...row.payload, attachments: [], attachment: '', fileName: '', attachment_deleted_at: new Date().toISOString(), attachment_delete_after: null };
      await rest(env, TABLES.benefits, { method: 'PATCH', query: `?id=eq.${encodeURIComponent(row.id)}`, body: { payload, updated_at: new Date().toISOString() } });
    }
  } catch (error) {
    console.warn('benefit cleanup skipped', error?.message || error);
  }
}

export async function onRequest(context) {
  const { request, env } = context;
  try {
    await cleanupExpiredBenefitFiles(env);
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const table = TABLES[type];
    if (!table) return json({ ok: false, error: '지원하지 않는 데이터 유형입니다.' }, 400);

    if (request.method === 'GET') {
      const userId = url.searchParams.get('userId');
      const query = `?select=id,user_id,status,payload,created_at,updated_at&order=created_at.desc${userId ? `&user_id=eq.${encodeURIComponent(userId)}` : ''}`;
      const rows = await rest(env, table, { query, prefer: 'return=minimal' });
      return json({ ok: true, records: (rows || []).map(r => ({ ...r.payload, id: r.id, userId: r.user_id || r.payload?.userId, status: r.status || r.payload?.status, _createdAt: r.created_at, _updatedAt: r.updated_at })) });
    }

    if (request.method === 'POST') {
      const body = await request.json();
      const record = body.record || body;
      if (!record?.id) return json({ ok: false, error: 'id가 필요합니다.' }, 400);
      const now = new Date().toISOString();
      const row = {
        id: String(record.id),
        user_id: String(record.userId || ''),
        status: String(record.status || ''),
        payload: record,
        created_at: record.createdAtIso || now,
        updated_at: now
      };
      const saved = await rest(env, table, { method: 'POST', query: '?on_conflict=id', prefer: 'resolution=merge-duplicates,return=representation', body: row });
      return json({ ok: true, record: saved?.[0] ? { ...saved[0].payload, id: saved[0].id } : record });
    }

    if (request.method === 'PATCH') {
      const body = await request.json();
      const id = body.id || url.searchParams.get('id');
      if (!id) return json({ ok: false, error: 'id가 필요합니다.' }, 400);
      const currentRows = await rest(env, table, { query: `?id=eq.${encodeURIComponent(id)}&select=id,user_id,status,payload&limit=1`, prefer: 'return=minimal' });
      const current = currentRows?.[0];
      if (!current) return json({ ok: false, error: '데이터를 찾을 수 없습니다.' }, 404);
      const payload = { ...(current.payload || {}), ...(body.patch || {}) };
      const patch = { payload, status: String(payload.status || current.status || ''), user_id: String(payload.userId || current.user_id || ''), updated_at: new Date().toISOString() };
      const saved = await rest(env, table, { method: 'PATCH', query: `?id=eq.${encodeURIComponent(id)}`, body: patch });
      return json({ ok: true, record: saved?.[0] ? { ...saved[0].payload, id: saved[0].id } : payload });
    }

    if (request.method === 'DELETE') {
      const id = url.searchParams.get('id');
      if (!id) return json({ ok: false, error: 'id가 필요합니다.' }, 400);
      await rest(env, table, { method: 'DELETE', query: `?id=eq.${encodeURIComponent(id)}`, prefer: 'return=minimal' });
      return json({ ok: true });
    }

    return json({ ok: false, error: '지원하지 않는 요청입니다.' }, 405);
  } catch (error) {
    return json({ ok: false, error: error?.message || String(error) }, 500);
  }
}
