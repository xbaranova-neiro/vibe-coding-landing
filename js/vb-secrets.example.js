/**
 * Локально: скопируйте в vb-secrets.local.js (файл в .gitignore).
 *
 * На проде Timeweb: переменные VB_ROISTAT_PROXY_URL и/или VB_ROISTAT_WEBHOOK_URL
 * → npm run build → inject в vb-secrets.local.js.
 *
 * Рекомендация: только прокси (ключ вебхука хранится в секрете Worker, не в браузере).
 */
window.VB_ROISTAT_PROXY_URL = 'https://ВАШ_ВОРКЕР.workers.dev';
// window.VB_ROISTAT_WEBHOOK_URL = 'https://cloud.roistat.com/integration/webhook?key=...'; // опционально для локальных тестов
