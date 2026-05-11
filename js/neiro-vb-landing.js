/**
 * Лендинг VB — расписание на кнопках регистрации
 *
 * Время на кнопках всегда 11:00 и 19:00 по Москве (Europe/Moscow), не подстраивается под часовой пояс браузера.
 * Меняется только календарная дата под кнопкой и вспомогательные подписи «сегодня/завтра» — строго по текущим
 * суткам и времени в Москве.
 *
 * Сверка с макетом (стикеры), всё по Europe/Moscow:
 *
 * 1) «До 9 утра рега»     → оба слота сегодня: «сегодня в 11», «сегодня в 19»  → ветка mins < 9*60
 * 2) «После 9:00 рега»   → «завтра в 11» (утро), «сегодня в 19» (вечер)        → 9*60 ≤ mins < 17*60
 *    (на стикере сначала написан вечер, потом утро; на ленде 1-я кнопка — утро 11:00, 2-я — вечер 19:00)
 * 3) «После 17:00 рега»  → оба завтра: «завтра в 11», «завтра в 19»            → mins ≥ 17*60
 *
 * | Интервал МСК  | Утро (кнопка 11:00) | Вечер (кнопка 19:00) |
 * |---------------|---------------------|----------------------|
 * | 00:00 … 08:59 | сегодня в 11        | сегодня в 19         |
 * | 09:00 … 16:59 | завтра в 11         | сегодня в 19         |
 * | 17:00 … 23:59 | завтра в 11         | завтра в 19          |
 *
 * Границы: с 9:00:00 и с 17:00:00 МСК уже следующий режим. После полуночи — снова режим «до 9».
 * Обновление подписей: при загрузке и далее каждую новую минуту по московскому времени (чтобы не «залипать»
 * на старой дате до часа после смены режима).
 *
 * URL формы: time_web_VB = 11 (утро) или 19 (вечер).
 */
(function () {
  'use strict';

  var MONTHS_GEN = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
  ];

  var DOMAIN_FIX = {
    'gnail.com': 'gmail.com',
    'gmil.com': 'gmail.com',
    'gnil.com': 'gmail.com',
    'gmail.ru': 'gmail.com',
    'gmai.com': 'gmail.com',
    'gmaol.com': 'gmail.com',
    'gmeil.com': 'gmail.com'
  };

  function buildRegFormUrl(base, slot) {
    var url;
    try {
      url = new URL(base, window.location.href);
    } catch (e) {
      return base;
    }
    var loc = new URLSearchParams(window.location.search);
    loc.forEach(function (val, key) {
      var k = key.toLowerCase();
      if (k.indexOf('utm_') === 0 || k === 'gclid' || k === 'fbclid' || k === 'yclid' || k === 'msclkid') {
        url.searchParams.set(key, val);
      }
    });
    url.searchParams.set('time_web_VB', slot === 'evening' ? '19' : '11');
    return url.toString();
  }

  /** Минуты от полуночи 0…1439 в Europe/Moscow (границы режимов: 9:00 и 17:00). */
  function getMoscowMinutesSinceMidnight() {
    var parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Moscow',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false
    }).formatToParts(new Date());
    var h = 0;
    var m = 0;
    parts.forEach(function (p) {
      if (p.type === 'hour') h = parseInt(p.value, 10);
      if (p.type === 'minute') m = parseInt(p.value, 10);
    });
    return h * 60 + m;
  }

  /** Пауза до начала следующей минуты по Москве (мс), чтобы обновить даты ровно после смены 8:59→9:00, 16:59→17:00 и т.д. */
  function msUntilNextMoscowMinute() {
    var parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Moscow',
      second: 'numeric'
    }).formatToParts(new Date());
    var sp = parts.find(function (p) {
      return p.type === 'second';
    });
    var sec = sp ? parseInt(sp.value, 10) : 0;
    var ms = (60 - sec) * 1000 + 400;
    return ms < 800 ? 800 : ms;
  }

  /** Календарная дата в Москве: { y, mo, d } (mo — 0..11). */
  function getMoscowYmd() {
    var parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Moscow',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
      .formatToParts(new Date())
      .reduce(function (acc, p) {
        if (p.type === 'year') acc.y = parseInt(p.value, 10);
        if (p.type === 'month') acc.mo = parseInt(p.value, 10) - 1;
        if (p.type === 'day') acc.d = parseInt(p.value, 10);
        return acc;
      }, {});
    return { y: parts.y, mo: parts.mo, d: parts.d };
  }

  function addCalendarDays(ymd, deltaDays) {
    var t = Date.UTC(ymd.y, ymd.mo, ymd.d + deltaDays);
    var x = new Date(t);
    return { y: x.getUTCFullYear(), mo: x.getUTCMonth(), d: x.getUTCDate() };
  }

  function getScheduleCopy() {
    var mins = getMoscowMinutesSinceMidnight();
    var morning;
    var evening;
    if (mins < 9 * 60) {
      morning = 'сегодня в 11';
      evening = 'сегодня в 19';
    } else if (mins < 17 * 60) {
      morning = 'завтра в 11';
      evening = 'сегодня в 19';
    } else {
      morning = 'завтра в 11';
      evening = 'завтра в 19';
    }
    return { morning: morning, evening: evening };
  }

  /** Дата для числа под кнопкой: «сегодня»/«завтра» относительно календаря Москвы. */
  function slotDateForLabel(labelText) {
    var msk = getMoscowYmd();
    if (labelText.indexOf('завтра') !== -1) msk = addCalendarDays(msk, 1);
    return msk;
  }

  function formatRuDate(ymd) {
    return ymd.d + ' ' + MONTHS_GEN[ymd.mo];
  }

  function fixEmailValue(el) {
    var v = (el.value || '').trim().toLowerCase();
    if (!v || v.indexOf('@') === -1) return;
    var parts = v.split('@');
    if (parts.length !== 2) return;
    var dom = parts[1];
    if (DOMAIN_FIX[dom]) el.value = parts[0] + '@' + DOMAIN_FIX[dom];
  }

  function initEmailTypoFix() {
    document.addEventListener(
      'blur',
      function (e) {
        var t = e.target;
        if (!t || !t.tagName) return;
        var tag = t.tagName.toLowerCase();
        if (tag !== 'input') return;
        var type = (t.getAttribute('type') || '').toLowerCase();
        var name = (t.getAttribute('name') || '').toLowerCase();
        var ph = (t.getAttribute('placeholder') || '').toLowerCase();
        if (type === 'email' || name.indexOf('email') !== -1 || ph.indexOf('mail') !== -1) {
          fixEmailValue(t);
        }
      },
      true
    );
  }

  function refreshScheduleLabels() {
    var copy = getScheduleCopy();
    var dm = formatRuDate(slotDateForLabel(copy.morning));
    var de = formatRuDate(slotDateForLabel(copy.evening));
    document.querySelectorAll('[data-vb-hero-date="morning"]').forEach(function (el) {
      el.textContent = dm;
    });
    document.querySelectorAll('[data-vb-hero-date="evening"]').forEach(function (el) {
      el.textContent = de;
    });
    document.querySelectorAll('[data-vb-slot-label="morning"]').forEach(function (el) {
      el.textContent = copy.morning;
    });
    document.querySelectorAll('[data-vb-slot-label="evening"]').forEach(function (el) {
      el.textContent = copy.evening;
    });
    document.querySelectorAll('[data-vb-slot-date="morning"]').forEach(function (el) {
      el.textContent = dm;
    });
    document.querySelectorAll('[data-vb-slot-date="evening"]').forEach(function (el) {
      el.textContent = de;
    });
  }

  var _openRegModal = null;
  var _vbInited = false;
  var _mskMinuteTimer = null;

  function scheduleRefreshOnNextMoscowMinute() {
    if (_mskMinuteTimer) clearTimeout(_mskMinuteTimer);
    _mskMinuteTimer = setTimeout(function () {
      _mskMinuteTimer = null;
      refreshScheduleLabels();
      scheduleRefreshOnNextMoscowMinute();
    }, msUntilNextMoscowMinute());
  }

  window.VIBE_VB = {
    buildRegFormUrl: buildRegFormUrl,
    refreshScheduleLabels: refreshScheduleLabels,

    init: function (opts) {
      if (_vbInited) return;
      _vbInited = true;
      opts = opts || {};
      _openRegModal = typeof opts.openRegModal === 'function' ? opts.openRegModal : null;
      document.addEventListener('click', function (e) {
        var a = e.target.closest('[data-vb-open]');
        if (!a) return;
        var slot = a.getAttribute('data-vb-open');
        if (slot !== 'morning' && slot !== 'evening') return;
        e.preventDefault();
        if (!_openRegModal) return;
        _openRegModal(slot);
      });
      refreshScheduleLabels();
      scheduleRefreshOnNextMoscowMinute();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEmailTypoFix);
  } else {
    initEmailTypoFix();
  }
})();
