/**
 * Timeweb / CI: пишет js/vb-secrets.local.js из переменных окружения.
 *
 * VB_ROISTAT_PROXY_URL — публичный URL Cloudflare Worker (рекомендуется на проде).
 * VB_ROISTAT_WEBHOOK_URL — прямой вебхук (локально; на проде часто режется CSP).
 */
const fs = require('fs');
const path = require('path');

const out = path.join(__dirname, '..', 'js', 'vb-secrets.local.js');
const proxy = (process.env.VB_ROISTAT_PROXY_URL || '').trim();
const hook = (process.env.VB_ROISTAT_WEBHOOK_URL || '').trim();

const header =
  '/** Сборка: VB_ROISTAT_PROXY_URL и/или VB_ROISTAT_WEBHOOK_URL (см. deploy/cloudflare-worker-roistat-proxy.js). */\n';

function write(lines) {
  fs.writeFileSync(out, header + lines.join('\n') + '\n');
}

if (proxy || hook) {
  var lines = [];
  if (proxy) {
    lines.push('window.VB_ROISTAT_PROXY_URL = ' + JSON.stringify(proxy) + ';');
    console.log('inject-vb-secrets: VB_ROISTAT_PROXY_URL → js/vb-secrets.local.js');
  }
  if (hook) {
    lines.push('window.VB_ROISTAT_WEBHOOK_URL = ' + JSON.stringify(hook) + ';');
    console.log('inject-vb-secrets: VB_ROISTAT_WEBHOOK_URL → js/vb-secrets.local.js');
  }
  write(lines);
} else if (fs.existsSync(out)) {
  console.log('inject-vb-secrets: переменные пусты, оставляем существующий js/vb-secrets.local.js');
} else {
  write([
    "window.VB_ROISTAT_PROXY_URL = '';",
    "window.VB_ROISTAT_WEBHOOK_URL = '';"
  ]);
  console.warn('inject-vb-secrets: задайте VB_ROISTAT_PROXY_URL (Worker) или VB_ROISTAT_WEBHOOK_URL');
}
