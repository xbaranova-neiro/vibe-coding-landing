/**
 * Локально: скопируйте в vb-secrets.local.js (файл в .gitignore).
 *
 * Прод: VB_ROISTAT_PROXY_URL через inject (Timeweb переменные + npm run build).
 * Лучше относительный путь (Worker на маршруте этого домена в Cloudflare):
 */
window.VB_ROISTAT_PROXY_URL = '/api/roistat';
// Либо полный URL воркера (на Timeweb часто даёт Failed to fetch из‑за CSP):
// window.VB_ROISTAT_PROXY_URL = 'https://vb-roistat.XXX.workers.dev';
// window.VB_ROISTAT_WEBHOOK_URL = 'https://...'; // только локальные тесты без прокси
