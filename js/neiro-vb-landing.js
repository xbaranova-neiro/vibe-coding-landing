/**
 * Лендинг VB: слоты 11 / 19, подписи дат, сборка URL формы регистрации.
 * В query добавляются UTM, gclid/fbclid… и time_web_VB (11 / 19).
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
      setInterval(refreshScheduleLabels, 60000);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEmailTypoFix);
  } else {
    initEmailTypoFix();
  }
})();
