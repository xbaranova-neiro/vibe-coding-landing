/**
 * Прокси Roistat: браузер шлёт JSON сюда (CORS *), воркер — на cloud.roistat.com/webhook.
 *
 * Установка (Cloudflare Workers):
 * 1. Workers & Pages → Create → Worker, вставить этот код.
 * 2. Settings → Variables → Secrets → ROISTAT_WEBHOOK_URL = полный URL вебхука с ?key=...
 * 3. Save and Deploy, скопировать URL вида https://vb-roistat.ИМЯ.workers.dev
 * 4. В Timeweb переменная VB_ROISTAT_PROXY_URL = этот URL (не секрет).
 * 5. VB_ROISTAT_WEBHOOK_URL в клиенте можно убрать — ключ только в секрете воркера.
 *
 * Безопасность: ниже стоит Access-Control-Allow-Origin: * (удобно для превью-доменов).
 * Потом можно заменить на свой домен, чтобы чужие сайты не слали лиды в ваш вебхук.
 */
export default {
  async fetch(request, env) {
    var cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405, headers: cors });
    }

    var webhook = env.ROISTAT_WEBHOOK_URL;
    if (!webhook) {
      return new Response(
        JSON.stringify({ error: 'ROISTAT_WEBHOOK_URL not set in Worker secrets' }),
        { status: 500, headers: Object.assign({ 'Content-Type': 'application/json' }, cors) }
      );
    }

    var body = await request.text();
    var r = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body
    });
    var text = await r.text();
    return new Response(text, {
      status: r.status,
      headers: Object.assign({ 'Content-Type': 'application/json' }, cors)
    });
  }
};
