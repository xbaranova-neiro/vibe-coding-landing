/**
 * Прокси Roistat: браузер шлёт JSON (CORS *), воркер — на cloud.roistat.com/webhook.
 *
 * === Рекомендуется: тот же домен, путь /api/roistat (обходит CSP Timeweb на *.workers.dev) ===
 * 1. Домен neiroguru.ru должен идти через Cloudflare (DNS с оранжевым облаком).
 * 2. Workers & Pages → ваш воркер → Triggers → Custom Domains / Routes:
 *    добавить Route: neiroguru.ru/api/roistat* (и при необходимости www.neiroguru.ru/api/roistat*).
 * 3. Secret ROISTAT_WEBHOOK_URL = полный URL вебхука с ?key=...
 * 4. В Timeweb переменная VB_ROISTAT_PROXY_URL = /api/roistat  (относительный путь, без https).
 *
 * === Запасной вариант: только workers.dev ===
 * URL вида https://vb-roistat.ИМЯ.workers.dev — на Timeweb часто блокируется connect-src;
 * тогда в поддержке хостинга попросите разрешить этот URL в CSP или используйте маршрут выше.
 *
 * Безопасность: CORS *. Позже можно сузить до своего домена.
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
