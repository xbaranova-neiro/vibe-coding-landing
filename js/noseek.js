/**
 * Запрет перемотки в плеере Rutube: при попытке перемотать возвращаем на максимально просмотренную позицию.
 * Подключать на страницах с iframe Rutube (return.html, day1.html).
 */
(function () {
  var maxAllowedTime = 0;
  var lastCurrentTime = 0;
  var MIN_SAFE_SECONDS = 20;     // не трогать плеер первые N секунд
  var SEEK_FWD_TOLERANCE = 12;   // сек — только блокируем перемотку вперёд (не трогаем откаты — Rutube шлёт ложные значения)

  window.addEventListener('message', function (event) {
    if (!event.source || !event.source.postMessage) return;
    if (String(event.origin).toLowerCase().indexOf('rutube') === -1) return;
    var msg;
    try {
      msg = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
    } catch (e) {
      return;
    }
    if (!msg || !msg.type) return;

    if (msg.type === 'player:currentTime' && msg.data && typeof msg.data.time === 'number') {
      var t = msg.data.time;
      if (t > lastCurrentTime && t - lastCurrentTime < 20) {
        maxAllowedTime = Math.max(maxAllowedTime, t);
      }
      lastCurrentTime = t;
      if (maxAllowedTime < MIN_SAFE_SECONDS) return;
      if (t > maxAllowedTime + SEEK_FWD_TOLERANCE && event.source && event.source.postMessage) {
        event.source.postMessage(JSON.stringify({
          type: 'player:setCurrentTime',
          data: { time: Math.floor(maxAllowedTime) }
        }), '*');
      }
    }

    if (msg.type === 'player:ready' || msg.type === 'player:init') {
      maxAllowedTime = 0;
      lastCurrentTime = 0;
    }
  });
})();
