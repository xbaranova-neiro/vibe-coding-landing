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
    video.src = mp4;
    video.playsInline = true;
    video.disablePictureInPicture = true;
    video.disableRemotePlayback = true;
    video.controls = false;
    video.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    video.addEventListener('click', function () { video.paused ? video.play() : video.pause(); });
    var controls = document.createElement('div');
    controls.className = 'custom-video-controls';
    controls.innerHTML = '<button type="button" id="btn-play" title="Play/Pause" aria-label="Play/Pause">▶</button><div class="vol-wrap"><input type="range" id="vol" min="0" max="100" value="100" title="Volume"></div>';
    wrap.innerHTML = '';
    wrap.appendChild(video);
    wrap.appendChild(controls);
    var btnPlay = controls.querySelector('#btn-play');
    var vol = controls.querySelector('#vol');
    btnPlay.addEventListener('click', function () {
      if (video.paused) { video.play(); btnPlay.textContent = '⏸'; } else { video.pause(); btnPlay.textContent = '▶'; }
    });
    video.addEventListener('play', function () { btnPlay.textContent = '⏸'; });
    video.addEventListener('pause', function () { btnPlay.textContent = '▶'; });
    vol.addEventListener('input', function () { video.volume = vol.value / 100; });
    if (autoplay) video.play().catch(function () {});
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
