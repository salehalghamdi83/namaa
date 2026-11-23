// نماء — دالة الإشعارات
// ترسل إشعارًا إلى جوال الأب/الأم (أو فرد محدد) من نفس العائلة فقط.
// الأسرار المطلوبة: VAPID_PUBLIC و VAPID_PRIVATE (من أداة tools/vapid.html)
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    const { data: u } = await admin.auth.getUser(token);
    if (!u?.user) return json({ error: "unauth" }, 401);
    const { data: dev } = await admin.from("devices").select("family_id,member_id").eq("user_id", u.user.id).maybeSingle();
    if (!dev) return json({ error: "not_linked" }, 403);

    const { to = "parents", member, title, body, tag } = await req.json();
    let q = admin.from("push_subs").select("endpoint,sub,user_id").eq("family_id", dev.family_id);
    if (to === "parents") q = q.in("role", ["father", "mother"]);
    else if (to === "member" && member) q = q.eq("member_id", String(member));
    else return json({ error: "bad_target" }, 400);
    const { data: subs } = await q;

    webpush.setVapidDetails("mailto:namaa@example.com", Deno.env.get("VAPID_PUBLIC")!, Deno.env.get("VAPID_PRIVATE")!);
    const payload = JSON.stringify({
      title: String(title || "نماء").slice(0, 120),
      body: String(body || "").slice(0, 300),
      tag: tag ? String(tag).slice(0, 60) : undefined,
    });
    let sent = 0;
    for (const s of subs || []) {
      if (s.user_id === u.user.id) continue; // لا ترسل لنفس الجهاز
      try {
        await webpush.sendNotification(s.sub, payload, { TTL: 86400 });
        sent++;
      } catch (e: any) {
        if (e?.statusCode === 404 || e?.statusCode === 410) await admin.from("push_subs").delete().eq("endpoint", s.endpoint);
      }
    }
    return json({ sent });
  } catch (e) {
    return json({ error: "server", detail: String(e) }, 500);
  }
});
