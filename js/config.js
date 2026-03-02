/**
 * Настройки воронки — подставьте свои ссылки на видео и подарок
 * Подключите этот файл перед основными скриптами на страницах day1.html, day2.html, gift.html, return.html
 */

// Мастер-класс Дня 1 — прямая ссылка на MP4 (свой плеер: без перемотки, только пауза).
// Как получить ссылку — см. КУДА_ЗАГРУЗИТЬ_ВИДЕО.md
// Публичная ссылка без подписи (подписанные URL с X-Amz-* истекают через 60 сек).
// Домен .net — если с .ru была ошибка SSL, используй этот.
window.WIPECODING_DAY1_VIDEO_MP4 = 'https://storage.yandexcloud.net/vibe-coding/93864-vibecode_day1_2026-02-18-18-59.mp4';
// Старт с указанной секунды (например 60 = с 1-й минуты, заставка не показывается). 0 или не задано — с начала.
window.WIPECODING_DAY1_VIDEO_START_SECONDS = 60;

// День 2
window.WIPECODING_DAY2_VIDEO_MP4 = '';
window.WIPECODING_DAY2_VIDEO_URL = '';

// Подарок: гайд по вайб-кодингу
window.WIPECODING_GIFT_URL = 'https://xbaranova-neiro.github.io/vibe-cod/';

// Кнопки оплаты: показываются после N секунд видео (2 ч 14 мин 51 сек = 8091).
window.WIPECODING_PAYMENT_SHOW_AT_SECONDS = 8091;
// Массив кнопок: { text: 'Текст', url: 'https://...' }. Для одной кнопки можно задать PAYMENT_BUTTON_TEXT и PAYMENT_BUTTON_URL.
window.WIPECODING_PAYMENT_BUTTONS = [
  { text: 'Оплатить', url: 'https://xbaranova-neiro.ru/vibe-coding?utm=' },
  { text: 'Оставить заявку', url: 'https://xbaranova-neiro.ru/vibe-code_rassr_day1?utm=' }
];
// Устаревшие (если PAYMENT_BUTTONS не задан): одна кнопка
window.WIPECODING_PAYMENT_BUTTON_TEXT = 'Перейти к оплате';
window.WIPECODING_PAYMENT_BUTTON_URL = '';
window.WIPECODING_PAYMENT_LABEL = '';
