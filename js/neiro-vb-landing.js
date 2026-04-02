/**
 * Регистрация на веб: два слота (11 / 19), как на Тильде — форма → вебхук Roistat → редирект на «Спасибо» GetCourse
 * с UTM, click id и roistat_visit в query (см. augmentThankYouUrl).
 *
 * URL вебхука: Roistat → Интеграции → Webhook → адрес из инструкции. Укажите в <meta name="vb-roistat-webhook" content="...">
 * или window.VB_ROISTAT_WEBHOOK_URL до подключения этого файла.
 */
(function () {
  'use strict';

  var THANK_MORNING = 'https://neyroseti.neiroguru.ru/sps/neyroseti/thank_vb_mrn';
  var THANK_EVENING = 'https://neyroseti.neiroguru.ru/sps/neyroseti/thank_vb_evn';

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

  function getCookie(name) {
    var m = document.cookie.match(
      new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)')
    );
    return m ? decodeURIComponent(m[1]) : '';
  }

  function getWebhookUrl() {
    if (window.VB_ROISTAT_WEBHOOK_URL) return String(window.VB_ROISTAT_WEBHOOK_URL).trim();
    var m = document.querySelector('meta[name="vb-roistat-webhook"]');
    return m ? (m.getAttribute('content') || '').trim() : '';
  }

  /** UTM и click id с текущей страницы → объект для fields / дублирования */
  function getMarketingParams() {
    var out = {};
    try {
      var loc = new URLSearchParams(window.location.search);
      loc.forEach(function (val, key) {
        var k = key.toLowerCase();
        if (
          k.indexOf('utm_') === 0 ||
          k === 'gclid' ||
          k === 'fbclid' ||
          k === 'yclid' ||
          k === 'msclkid'
        ) {
          out[key] = val;
        }
      });
    } catch (e) {}
    return out;
  }

  /** Как в tilda-neiro-vb/03: дописать метки к URL страницы «Спасибо». */
  function augmentThankYouUrl(base) {
    var url;
    try {
      url = new URL(base);
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
    var rs = getCookie('roistat_visit');
    if (rs) url.searchParams.set('roistat_visit', rs);
    return url.toString();
  }

  function getScheduleCopy() {
    var h = new Date().getHours();
    var morning;
    var evening;
    if (h < 9) {
      morning = 'сегодня в 11';
      evening = 'сегодня в 19';
    } else if (h < 17) {
      morning = 'завтра в 11';
      evening = 'сегодня в 19';
    } else {
      morning = 'завтра в 11';
      evening = 'завтра в 19';
    }
    return { morning: morning, evening: evening };
  }

  function slotDateForLabel(labelText) {
    var now = new Date();
    var base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (labelText.indexOf('завтра') !== -1) base.setDate(base.getDate() + 1);
    return base;
  }

  function formatRuDate(dt) {
    return dt.getDate() + ' ' + MONTHS_GEN[dt.getMonth()];
  }

  function thankYouBaseForSlot(slot) {
    if (slot === 'morning') return THANK_MORNING;
    if (slot === 'evening') return THANK_EVENING;
    return THANK_MORNING;
  }

  /**
   * Отправка заявки в Roistat (формат help.roistat.com Webhook).
   * @param {string} slot 'morning' | 'evening'
   * @param {{ name: string, email: string, phone: string }} data
   * @returns {Promise<void>}
   */
  function submitLeadToRoistat(slot, data) {
    var hook = getWebhookUrl();
    if (!hook) {
      return Promise.reject(new Error('Не задан вебхук Roistat (meta vb-roistat-webhook или VB_ROISTAT_WEBHOOK_URL).'));
    }
    var email = (data.email || '').trim();
    var phone = (data.phone || '').trim();
    if (!email && !phone) {
      return Promise.reject(new Error('Укажите email или телефон.'));
    }
    var timeVb = slot === 'evening' ? '19' : '11';
    var marketing = getMarketingParams();
    var fields = Object.assign({}, marketing, { time_web_VB: timeVb });
    var roistatVisit = getCookie('roistat_visit');
    var payload = {
      title: slot === 'evening' ? 'Вайб-кодинг веб — регистрация 19:00' : 'Вайб-кодинг веб — регистрация 11:00',
      fields: fields
    };
    var nm = (data.name || '').trim();
    if (nm) payload.name = nm;
    if (email) payload.email = email;
    if (phone) payload.phone = phone;
    if (roistatVisit) payload.roistat_visit = roistatVisit;
    // Roistat не отдаёт CORS на вебхук: application/json даёт preflight и «Failed to fetch».
    // JSON в теле с Content-Type: text/plain сервер принимает (200), для браузера это simple request + no-cors.
    return fetch(hook, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: JSON.stringify(payload),
      mode: 'no-cors',
      credentials: 'omit'
    }).then(function () {
      return;
    });
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

  window.VIBE_VB = {
    THANK_MORNING: THANK_MORNING,
    THANK_EVENING: THANK_EVENING,
    augmentThankYouUrl: augmentThankYouUrl,
    thankYouBaseForSlot: thankYouBaseForSlot,
    submitLeadToRoistat: submitLeadToRoistat,
    getWebhookUrl: getWebhookUrl,
    refreshScheduleLabels: refreshScheduleLabels,

    init: function (opts) {
      if (_vbInited) return;
      _vbInited = true;
      opts = opts || {};
      _openRegModal = typeof opts.openRegModal === 'function' ? opts.openRegModal : null;
      var self = this;
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
      setInterval(refreshScheduleLabels, 60000);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEmailTypoFix);
  } else {
    initEmailTypoFix();
  }
})();
