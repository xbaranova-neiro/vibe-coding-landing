/**
 * Плеер Дня 1: только свой плеер по прямой ссылке на MP4 (без перемотки, только пауза и громкость).
 * Если WIPECODING_DAY1_VIDEO_MP4 не задан — плеер не создаётся, на странице показывается подсказка.
 */
(function () {
  function createNativePlayer(wrap, autoplay) {
    var mp4 = (window.WIPECODING_DAY1_VIDEO_MP4 || '').trim();
    if (!mp4 || !wrap) return false;
    wrap.classList.add('video-wrap-native');
    wrap.classList.remove('video-wrap-no-seek');
    var video = document.createElement('video');
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    video.src = mp4;
    video.disablePictureInPicture = true;
    video.disableRemotePlayback = true;
    video.controls = false;
    var startSec = Math.max(0, parseInt(window.WIPECODING_DAY1_VIDEO_START_SECONDS, 10) || 0);

    // ── Сохранение и восстановление позиции ──────────────
    var POS_KEY = 'wipecoding_day1_pos';
    function savePos() {
      try {
        var pos = Math.floor(video.currentTime);
        if (pos > startSec) localStorage.setItem(POS_KEY, pos);
      } catch (e) {}
    }
    function getSavedPos() {
      try { var p = parseInt(localStorage.getItem(POS_KEY), 10); return isNaN(p) ? null : p; } catch (e) { return null; }
    }
    // Сохраняем каждые 5 сек и при паузе
    var saveTimer = setInterval(savePos, 5000);
    video.addEventListener('pause', savePos);
    // Очищаем когда видео дошло до конца
    video.addEventListener('ended', function () {
      try { localStorage.removeItem(POS_KEY); } catch (e) {}
      clearInterval(saveTimer);
    });

    // При загрузке — восстанавливаем позицию (но не раньше startSec)
    video.addEventListener('loadedmetadata', function setStart() {
      var saved = getSavedPos();
      var target = (saved && saved > startSec) ? saved : startSec;
      if (target > 0 && video.duration >= target) video.currentTime = target;
      video.removeEventListener('loadedmetadata', setStart);
      if (autoplay) video.play().catch(function () {});
    });
    video.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    video.addEventListener('click', function () { video.paused ? video.play() : video.pause(); });
    var controls = document.createElement('div');
    controls.className = 'custom-video-controls';
    controls.innerHTML = '<button type="button" id="btn-play" title="Play/Pause" aria-label="Play/Pause">▶</button><div class="vol-wrap"><input type="range" id="vol" min="0" max="100" value="100" title="Volume"></div><button type="button" id="btn-fullscreen" title="Полный экран" aria-label="Полный экран">⛶</button>';
    wrap.innerHTML = '';
    wrap.appendChild(video);
    wrap.appendChild(controls);
    var btnPlay = controls.querySelector('#btn-play');
    var vol = controls.querySelector('#vol');
    var btnFullscreen = controls.querySelector('#btn-fullscreen');
    function updateFullscreenBtn() {
      var isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
      btnFullscreen.textContent = isFs ? '✕' : '⛶';
      btnFullscreen.title = isFs ? 'Выйти из полного экрана' : 'Полный экран';
    }
    function toggleFullscreen() {
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      } else {
        var el = wrap;
        (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
      }
    }
    if (btnFullscreen && (wrap.requestFullscreen || wrap.webkitRequestFullscreen)) {
      btnFullscreen.addEventListener('click', toggleFullscreen);
      document.addEventListener('fullscreenchange', updateFullscreenBtn);
      document.addEventListener('webkitfullscreenchange', updateFullscreenBtn);
    } else if (btnFullscreen) {
      btnFullscreen.style.display = 'none';
    }
    btnPlay.addEventListener('click', function () {
      if (video.paused) { video.play(); btnPlay.textContent = '⏸'; } else { video.pause(); btnPlay.textContent = '▶'; }
    });
    video.addEventListener('play', function () { btnPlay.textContent = '⏸'; });
    video.addEventListener('pause', function () { btnPlay.textContent = '▶'; });
    function addErrorBlock(text, isLink) {
      var msg = wrap.querySelector('.video-load-error') || document.createElement('p');
      msg.className = 'video-load-error';
      msg.style.cssText = 'margin-top:8px;padding:12px;background:rgba(220,38,38,0.15);border-radius:8px;color:#fca5a5;font-size:14px;';
      msg.innerHTML = '';
      if (isLink) {
        var a = document.createElement('a');
        a.href = mp4;
        a.target = '_blank';
        a.rel = 'noopener';
        a.style.color = '#fcd34d';
        a.textContent = 'Откройте ссылку на видео в новой вкладке';
        msg.appendChild(document.createTextNode(text));
        msg.appendChild(document.createElement('br'));
        msg.appendChild(a);
        msg.appendChild(document.createTextNode(' — если там 403 или не открывается, проверьте доступ к бакету в Облаке.'));
      } else {
        msg.textContent = text;
      }
      if (!msg.parentNode) wrap.appendChild(msg);
    }
    video.addEventListener('error', function () {
      var code = video.error && video.error.code;
      var text = 'Не удалось загрузить видео. ';
      if (code === 2) text += 'Сеть или CORS (MEDIA_ERR_NETWORK). ';
      else if (code === 4) text += 'Формат/источник (MEDIA_ERR_SRC_NOT_SUPPORTED). ';
      else text += 'Проверьте ссылку и CORS в облаке. ';
      text += ' В бакете vibe-coding (Настройки → CORS) укажи Allowed Origins: https://xbaranova-neiro.github.io, Allowed Headers: Range, Expose Headers: Content-Range, Content-Length.';
      addErrorBlock(text, true);
    });
    vol.addEventListener('input', function () { video.volume = vol.value / 100; });

    var paymentAt = Math.max(0, parseInt(window.WIPECODING_PAYMENT_SHOW_AT_SECONDS, 10) || 0);
    var paymentButtons = window.WIPECODING_PAYMENT_BUTTONS;
    var hasPaymentButtons = Array.isArray(paymentButtons) && paymentButtons.length > 0;
    if (!hasPaymentButtons) {
      var singleUrl = (window.WIPECODING_PAYMENT_BUTTON_URL || '').trim();
      if (paymentAt > 0 && singleUrl) {
        paymentButtons = [{ text: (window.WIPECODING_PAYMENT_BUTTON_TEXT || 'Перейти к оплате').trim(), url: singleUrl }];
        hasPaymentButtons = true;
      }
    }
    // ── Модальное окно для кнопок оплаты ─────────────────────
    var payModal = document.createElement('div');
    payModal.id = 'pay-modal';
    payModal.style.cssText = 'display:none;position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.75);align-items:center;justify-content:center;padding:16px;';
    payModal.innerHTML =
      '<div style="position:relative;width:100%;max-width:520px;height:80vh;max-height:700px;background:#fff;border-radius:12px;overflow:hidden;display:flex;flex-direction:column;">' +
        '<button id="pay-modal-close" type="button" style="position:absolute;top:8px;right:10px;z-index:2;width:32px;height:32px;border:none;background:rgba(0,0,0,0.15);border-radius:50%;font-size:18px;cursor:pointer;color:#333;display:flex;align-items:center;justify-content:center;line-height:1;">✕</button>' +
        '<iframe id="pay-modal-iframe" src="" style="flex:1;width:100%;border:none;" allow="payment"></iframe>' +
      '</div>';
    document.body.appendChild(payModal);
    var payIframe = payModal.querySelector('#pay-modal-iframe');
    payModal.querySelector('#pay-modal-close').addEventListener('click', function () {
      payModal.style.display = 'none';
      payIframe.src = '';
    });
    payModal.addEventListener('click', function (e) {
      if (e.target === payModal) {
        payModal.style.display = 'none';
        payIframe.src = '';
      }
    });
    function openPayModal(url) {
      payIframe.src = url;
      payModal.style.display = 'flex';
    }

    if (paymentAt > 0 && hasPaymentButtons) {
      var paymentWrap = document.createElement('div');
      paymentWrap.className = 'video-payment-cta hidden';
      var paymentLabel = (window.WIPECODING_PAYMENT_LABEL || '').trim();
      if (paymentLabel) {
        var p = document.createElement('p');
        p.className = 'subtitle';
        p.style.cssText = 'margin:0 0 8px;font-size:14px;';
        p.textContent = paymentLabel;
        paymentWrap.appendChild(p);
      }
      var btnWrap = document.createElement('div');
      btnWrap.style.cssText = 'display:flex;flex-wrap:wrap;gap:10px;';
      for (var i = 0; i < paymentButtons.length; i++) {
        (function (b, idx) {
          var url = (b.url || '').trim();
          if (!url) return;
          var payBtn = document.createElement('button');
          payBtn.type = 'button';
          payBtn.className = 'btn ' + (idx === 0 ? 'btn-primary' : 'btn-secondary');
          payBtn.textContent = (b.text || 'Оплатить').trim();
          payBtn.addEventListener('click', function () { openPayModal(url); });
          btnWrap.appendChild(payBtn);
        })(paymentButtons[i], i);
      }
      paymentWrap.appendChild(btnWrap);
      if (wrap.parentNode) {
        wrap.parentNode.insertBefore(paymentWrap, wrap.nextSibling);
      } else {
        wrap.appendChild(paymentWrap);
      }

      var onTimeUpdate = function () {
        if (video.currentTime >= paymentAt) {
          paymentWrap.classList.remove('hidden');
          video.removeEventListener('timeupdate', onTimeUpdate);
        }
      };
      video.addEventListener('timeupdate', onTimeUpdate);
    }

    if (autoplay && startSec === 0) video.play().catch(function () {});
    return true;
  }

  window.WipecodingVideo = {
    initDay1InPlace: function (wrapElement, autoplay) {
      if (!wrapElement) return !!window.WIPECODING_DAY1_VIDEO_MP4;
      return createNativePlayer(wrapElement, autoplay);
    },
    hasVideo: function () { return !!((window.WIPECODING_DAY1_VIDEO_MP4 || '').trim()); }
  };
})();
