// نماء — دالة الذكاء الاصطناعي
// تستقبل طلبات المرشد والشرح والتحليل من التطبيق، وتستدعي Claude API بمفتاح سري لا يصل للأجهزة.
// الأسرار المطلوبة (Edge Functions → Secrets): ANTHROPIC_API_KEY
// اختياري: AI_MODEL (الافتراضي claude-haiku-5-5)، AI_MODEL_COMPLEX، AI_DAILY_LIMIT (الافتراضي 300)
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

const SYSTEM = `أنت جزء من تطبيق عائلي اسمه «نماء» يستخدمه أطفال وأبناء دون 18 سنة تحت إشراف والديهم في أسرة سعودية مسلمة، ويطّلع الوالدان على المحادثات.
قواعد ثابتة:
- اكتب بالعربية الفصحى البسيطة (إلا في دروس اللغات)، بلطف وتشجيع، وبقيم إسلامية وأسرية.
- لا تطلب من الطفل معلومات شخصية (عنوان، مدرسة، أرقام، صور)، ولا تقترح أي تواصل مع غرباء أو مواقع.
- لا محتوى عنيف أو جنسي أو مخيف، ولا نصائح طبية أو دوائية.
- إن ذكر الطفل إيذاءً أو تنمرًا أو خوفًا من شخص أو حزنًا شديدًا أو أفكارًا عن إيذاء نفسه: طمئنه وانصحه بإخبار والديه فورًا، ولا تحاول حل الأمر وحدك.
- لا تشخّص اضطرابات نفسية أو طبية.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method" }, 405);
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    const { data: u } = await admin.auth.getUser(token);
    if (!u?.user) return json({ error: "unauth" }, 401);
    const { data: dev } = await admin.from("devices").select("family_id").eq("user_id", u.user.id).maybeSingle();
    if (!dev) return json({ error: "not_linked" }, 403);

    // حد يومي لكل عائلة (حماية للتكلفة)
    const limit = Number(Deno.env.get("AI_DAILY_LIMIT") || 300);
    const day = new Date().toISOString().slice(0, 10);
    const { data: use } = await admin.from("ai_usage").select("n").eq("family_id", dev.family_id).eq("day", day).maybeSingle();
    if ((use?.n || 0) >= limit) return json({ error: "limit" }, 429);
    await admin.from("ai_usage").upsert({ family_id: dev.family_id, day, n: (use?.n || 0) + 1 });

    const body = await req.json();
    const input = body.input;
    let messages: { role: string; content: string }[] =
      typeof input === "string"
        ? [{ role: "user", content: input }]
        : (Array.isArray(input) ? input : [])
            .filter((m: any) => m && typeof m.content === "string" && (m.role === "user" || m.role === "assistant"))
            .slice(-20);
    while (messages.length && messages[0].role !== "user") messages.shift();
    if (!messages.length) return json({ error: "empty" }, 400);
    messages = messages.map((m) => ({ role: m.role, content: m.content.slice(0, 12000) }));

    const model = body.tier === "complex"
      ? (Deno.env.get("AI_MODEL_COMPLEX") || Deno.env.get("AI_MODEL") || "claude-haiku-5-5")
      : (Deno.env.get("AI_MODEL") || "claude-haiku-5-5");
    const system = SYSTEM + (body.json ? "\nأعد JSON صالحًا فقط، بلا أي نص قبله أو بعده وبلا علامات ```." : "");

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": Deno.env.get("ANTHROPIC_API_KEY")!,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({ model, max_tokens: 2000, system, messages }),
    });
    const j = await r.json();
    if (!r.ok) return json({ error: "ai_error", detail: j?.error?.message || r.status }, 502);
    const text = (j.content || []).filter((c: any) => c.type === "text").map((c: any) => c.text).join("");
    return json({ text });
  } catch (e) {
    return json({ error: "server", detail: String(e) }, 500);
  }
});
