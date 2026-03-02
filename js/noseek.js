/**
 * Запрет перемотки в плеере Rutube: при попытке перемотать возвращаем на максимально просмотренную позицию.
 * Подключать на страницах с iframe Rutube (return.html, day1.html).
 */
(function () {
  var maxAllowedTime = 0;
  var isPlaying = false;
  var lastCurrentTime = 0;
  var SEEK_BACK_TOLERANCE = 2;   // сек — если время откатилось больше чем на 2 сек, считаем перемоткой назад
  var SEEK_FWD_TOLERANCE = 5;    // сек — если время прыгнуло вперёд больше чем на 5 сек, считаем перемоткой вперёд

  window.addEventListener('message', function (event) {
    if (!event.source || !event.source.postMessage) return;
    if (event.origin.indexOf('rutube') === -1) return;
    var msg;
    try {
      msg = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
    } catch (e) {
      return;
    }
    if (!msg || !msg.type) return;

    if (msg.type === 'player:changeState') {
      isPlaying = (msg.data && msg.data.state === 'playing');
      return;
    }

    if (msg.type === 'player:currentTime' && msg.data && typeof msg.data.time === 'number') {
      var t = msg.data.time;
      if (isPlaying) {
        if (t > lastCurrentTime && t - lastCurrentTime < 15) {
          maxAllowedTime = Math.max(maxAllowedTime, t);
        }
        lastCurrentTime = t;
      }
      var needReset = false;
      var targetTime = maxAllowedTime;
      if (t < maxAllowedTime - SEEK_BACK_TOLERANCE) {
        needReset = true;
      } else if (t > maxAllowedTime + SEEK_FWD_TOLERANCE) {
        needReset = true;
      }
      if (needReset && event.source && event.source.postMessage) {
        event.source.postMessage(JSON.stringify({
          type: 'player:setCurrentTime',
          data: { time: Math.floor(targetTime) }
        }), '*');
      }
    }

    if (msg.type === 'player:ready' || msg.type === 'player:init') {
      maxAllowedTime = 0;
      lastCurrentTime = 0;
    }
  });
})();
