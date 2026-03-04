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
// Показать кнопку «Я посмотрел 1 день» когда до конца видео осталось столько секунд (например 300 = за 5 мин до конца). 0 = показывать сразу.
window.WIPECODING_DAY1_BUTTON_SHOW_WHEN_SECONDS_LEFT = 300;

// День 2
window.WIPECODING_DAY2_VIDEO_MP4 = 'https://storage.yandexcloud.net/vibe-coding/%D0%92%D0%B0%D0%B8%CC%86%D0%B1%D0%BA%D0%BE%D0%B4%D0%B8%D0%BD%D0%B3_2%D0%B4%D0%B5%D0%BD%D1%8C_NEW.mp4';
window.WIPECODING_DAY2_VIDEO_URL = '';
// Старт с указанной секунды (0 = с начала)
window.WIPECODING_DAY2_VIDEO_START_SECONDS = 0;
// Показать кнопку «Я посмотрел День 2» когда до конца видео осталось столько секунд
window.WIPECODING_DAY2_BUTTON_SHOW_WHEN_SECONDS_LEFT = 300;
// Чат Дня 2 (Bizon365 room_recs JSON)
window.WIPECODING_DAY2_CHAT_SCRIPT_URL = 'data/room_recs_day2.json';
window.WIPECODING_DAY2_CHAT_STREAM_OFFSET_SEC = 0;
window.WIPECODING_DAY2_CHAT_SCRIPT_EXTRA_FIRST_SEC = 3;
// Кнопки оплаты Дня 2: 1 ч 28 мин 13 сек = 5293 сек
window.WIPECODING_DAY2_PAYMENT_SHOW_AT_SECONDS = 5294;
window.WIPECODING_DAY2_PAYMENT_BUTTONS = [
  { text: 'Оплатить', url: 'https://xbaranova-neiro.ru/vibe-coding_day2?utm=' },
  { text: 'Оставить заявку', url: 'https://xbaranova-neiro.ru/vibe-code_rassr_day2?utm=' }
];
window.WIPECODING_DAY2_PAYMENT_LABEL = '';

// Подарок за День 1: чек-лист вайб-кодера
window.WIPECODING_DAY1_GIFT_URL = 'https://xbaranova-neiro.github.io/vibe-coder-checklist/vibe-coder-checklist.html';
// Подарок за День 2: гайд по вайб-кодингу
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

// Сценарий чата / виджет справа: URL iframe (пусто = не показывать). Показывается на return.html, day1.html, gift.html.
window.WIPECODING_CHAT_WIDGET_URL = '';

// Сценарий чата из JSON (Bizon365 room_recs): сообщения справа, синхрон с видео по timeshift.
// Если задан — показывается панель «Сценарий чата» (приоритет над CHAT_WIDGET_URL). При CORS с другого домена положите JSON в репо, например data/room_recs.json, и укажите относительный URL.
window.WIPECODING_CHAT_SCRIPT_URL = 'data/room_recs.json';
// Доп. смещение времени эфира для чата (сек). 0 = время чата = videoStartSec + currentTime (синхрон при обрезке видео с 1-й минуты).
window.WIPECODING_CHAT_STREAM_OFFSET_SEC = 0;
// Вернуть в начале сценария N секунд (сообщения с timeshift от videoStartSec−N показываются). Например 10 = показывать с 50‑й сек при старте видео с 60‑й.
window.WIPECODING_CHAT_SCRIPT_EXTRA_FIRST_SEC = 10;
