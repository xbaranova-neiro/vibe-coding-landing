/**
 * Настройки воронки — подставьте свои ссылки на видео и подарок
 * Подключите этот файл перед основными скриптами на страницах day1.html, day2.html, gift.html, return.html
 */

// Мастер-класс Дня 1 — свой плеер только если есть прямая ссылка на MP4 (не Google Drive — не воспроизводится).
// Оставь пустым — будет Rutube с обрезкой таймлайна.
window.WIPECODING_DAY1_VIDEO_MP4 = '';

// Вариант B: Rutube embed (полосу перемотки скрываем обрезкой, перемотка вперёд блокируется скриптом)
window.WIPECODING_DAY1_VIDEO_EMBED = 'https://rutube.ru/play/embed/df7d69deb2ddeadd41aaa8c9e3291710/?p=Yf_UqFg14w_GxYHNXXzUwg';

// День 2: MP4 URL или embed
window.WIPECODING_DAY2_VIDEO_MP4 = '';
window.WIPECODING_DAY2_VIDEO_URL = '';

// Подарок: гайд по вайб-кодингу
window.WIPECODING_GIFT_URL = 'https://xbaranova-neiro.github.io/vibe-cod/';
