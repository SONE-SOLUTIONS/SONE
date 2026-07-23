// وسيط (proxy) بين موقعك وخدمة PlantNet API.
// المفتاح يبقى محفوظ كسرّ بـ Cloudflare (PLANTNET_API_KEY) وما يظهر أبداً بالكود أو للزوار.

const ALLOWED_ORIGIN = "https://sone-solutions.github.io";

export default {
  async fetch(request, env) {
    // رد فوري على طلبات preflight (OPTIONS) اللي يرسلها المتصفح قبل POST
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders(), "Content-Type": "application/json" }
      });
    }

    try {
      const url = new URL(request.url);
      const project = url.searchParams.get("project") || "all";

      // نمرر نفس ملفات الصور والحقول اللي أرسلها المتصفح، بدون تعديل
      const incomingForm = await request.formData();

      const plantNetUrl = `https://my-api.plantnet.org/v2/identify/${project}?api-key=${env.PLANTNET_API_KEY}`;

      const upstreamResponse = await fetch(plantNetUrl, {
        method: "POST",
        body: incomingForm
      });

      const data = await upstreamResponse.text();

      return new Response(data, {
        status: upstreamResponse.status,
        headers: { ...corsHeaders(), "Content-Type": "application/json" }
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: "Proxy error", message: err.message }), {
        status: 500,
        headers: { ...corsHeaders(), "Content-Type": "application/json" }
      });
    }
  }
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}
