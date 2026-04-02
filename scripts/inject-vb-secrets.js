/**
 * Timeweb Cloud / CI: подставляет вебхук из VB_ROISTAT_WEBHOOK_URL в js/vb-secrets.local.js.
 * Локально: если переменной нет, но файл уже есть — не перезаписываем.
 */
const fs = require('fs');
const path = require('path');

const out = path.join(__dirname, '..', 'js', 'vb-secrets.local.js');
const env = (process.env.VB_ROISTAT_WEBHOOK_URL || '').trim();

const header = '/** Собрано при деплое из переменной VB_ROISTAT_WEBHOOK_URL (не коммитить ключ в git). */\n';

if (env) {
  fs.writeFileSync(out, header + 'window.VB_ROISTAT_WEBHOOK_URL = ' + JSON.stringify(env) + ';\n');
  console.log('inject-vb-secrets: записан js/vb-secrets.local.js из окружения');
} else if (fs.existsSync(out)) {
  console.log('inject-vb-secrets: VB_ROISTAT_WEBHOOK_URL не задан, оставляем существующий js/vb-secrets.local.js');
} else {
  fs.writeFileSync(out, header + "window.VB_ROISTAT_WEBHOOK_URL = '';\n");
  console.warn('inject-vb-secrets: VB_ROISTAT_WEBHOOK_URL пуст — вебхук на сайте нужно задать в панели Timeweb');
}
