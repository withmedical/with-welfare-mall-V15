export async function onRequestGet(context) {
  const url = String(context.env.SUPABASE_URL || "").trim();
  const key = String(context.env.SUPABASE_ANON_KEY || "").trim();
  return new Response(JSON.stringify({
    SUPABASE_URL: url,
    SUPABASE_ANON_KEY: key,
    ok: !!(url && key)
  }), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
