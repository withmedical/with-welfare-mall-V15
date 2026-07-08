export async function onRequestGet(context) {
  const requestUrl = new URL(context.request.url);
  const target = requestUrl.searchParams.get("url") || "";
  if (!/^https?:\/\//i.test(target)) {
    return new Response("Invalid ICS URL", { status: 400 });
  }
  try {
    const res = await fetch(target, {
      headers: { "User-Agent": "WITH-Welfare-Mall-ICS/1.0" },
      cf: { cacheTtl: 0, cacheEverything: false }
    });
    const body = await res.text();
    return new Response(body, {
      status: res.ok ? 200 : res.status,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Cache-Control": "no-store, max-age=0",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (err) {
    return new Response("ICS fetch failed", { status: 502, headers: { "Access-Control-Allow-Origin": "*" } });
  }
}
