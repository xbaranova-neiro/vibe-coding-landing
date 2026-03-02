/**
 * Панель «Сценарий чата» справа: загрузка JSON (Bizon365 room_recs) и синхронизация с видео по timeshift.
 * Включается при заданном WIPECODING_CHAT_SCRIPT_URL в config.js.
 */
(function () {
  var scriptUrl = typeof window.WIPECODING_CHAT_SCRIPT_URL !== 'undefined' && (window.WIPECODING_CHAT_SCRIPT_URL || '').trim();
  if (!scriptUrl) return;

  var panel = document.createElement('div');
  panel.className = 'chat-widget-panel';
  panel.innerHTML = '<div class="chat-script-header">Сценарий чата</div><div class="chat-script-messages"><div class="chat-script-loading">Загрузка…</div></div><div class="chat-script-your"><p class="chat-script-your-label">Написать в чат (видно только вам)</p><div class="chat-script-your-form"><textarea class="chat-script-input" rows="2" placeholder="Сообщение…" maxlength="2000"></textarea><button type="button" class="chat-script-send">Отправить</button></div></div>';
  var messagesEl = panel.querySelector('.chat-script-messages');
  var notesForm = panel.querySelector('.chat-script-your');
  var notesInput = panel.querySelector('.chat-script-input');
  var notesBtn = panel.querySelector('.chat-script-send');

  var STORAGE_KEY = 'wipecoding_chat_notes';
  function loadUserNotes() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }
  function saveUserNotes(notes) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(notes)); } catch (e) {}
  }
  var userNotes = loadUserNotes();
  var toggle = document.createElement('button');
  toggle.className = 'chat-widget-toggle';
  toggle.setAttribute('type', 'button');
  toggle.setAttribute('aria-label', 'Открыть чат');
  toggle.innerHTML = '💬';
  toggle.addEventListener('click', function () {
    panel.classList.toggle('hidden');
    var open = !panel.classList.contains('hidden');
    toggle.setAttribute('aria-label', open ? 'Закрыть чат' : 'Открыть чат');
    if (window.matchMedia('(max-width: 768px)').matches) document.body.classList.toggle('chat-panel-open', open);
  });
  document.body.appendChild(toggle);
  document.body.appendChild(panel);

  var allPosts = [];
  // Время эфира = текущее время видео (плеер уже стартует с 1-й минуты, currentTime отражает позицию в эфире).
  var lastRenderedCount = 0;
  var staggerTimeout = null;

  function createMessageEl(p) {
    var div = document.createElement('div');
    div.className = 'chat-script-msg chat-msg-appear' + (p.isNote ? ' chat-script-note' : (p.role ? ' role-' + p.role : ''));
    var user = document.createElement('div');
    user.className = 'chat-script-user';
    user.textContent = p.isNote ? 'Вы' : (p.username || 'Гость') + (p.role === 'admin' || p.role === 'moder' ? ' • ' + (p.role === 'admin' ? 'Админ' : 'Модератор') : '');
    var text = document.createElement('div');
    text.className = 'chat-script-text';
    text.textContent = p.message || '';
    div.appendChild(user);
    div.appendChild(text);
    return div;
  }

  function renderMessages(visiblePosts, streamTimeForNotes) {
    var streamTime = streamTimeForNotes != null ? streamTimeForNotes : (getStreamTime() ?? 1e9);
    var notesToShow = userNotes.filter(function (n) { return n.timeshift <= streamTime; });
    var merged = visiblePosts.concat(notesToShow.map(function (n) { return { timeshift: n.timeshift, username: 'Вы', message: n.message, role: '', isNote: true }; }));
    merged.sort(function (a, b) { return (a.timeshift || 0) - (b.timeshift || 0); });

    if (!merged.length) {
      if (staggerTimeout) clearTimeout(staggerTimeout);
      staggerTimeout = null;
      lastRenderedCount = 0;
      messagesEl.innerHTML = '<div class="chat-script-loading">Нет сообщений за этот момент эфира.</div>';
      messagesEl.scrollTop = 0;
      return;
    }

    if (merged.length <= lastRenderedCount) {
      if (staggerTimeout) clearTimeout(staggerTimeout);
      staggerTimeout = null;
      lastRenderedCount = 0;
      messagesEl.innerHTML = '';
      merged.forEach(function (p) { messagesEl.appendChild(createMessageEl(p)); });
      lastRenderedCount = merged.length;
      messagesEl.scrollTop = messagesEl.scrollHeight;
      return;
    }

    var newMessages = merged.slice(lastRenderedCount);
    if (lastRenderedCount === 0) {
      messagesEl.innerHTML = '';
      newMessages.forEach(function (p) { messagesEl.appendChild(createMessageEl(p)); });
      lastRenderedCount = merged.length;
      messagesEl.scrollTop = messagesEl.scrollHeight;
      return;
    }

    var prevTimeshift = merged[lastRenderedCount - 1].timeshift || 0;
    function appendNext(i) {
      if (i >= newMessages.length) {
        lastRenderedCount = merged.length;
        messagesEl.scrollTop = messagesEl.scrollHeight;
        staggerTimeout = null;
        return;
      }
      var p = newMessages[i];
      messagesEl.appendChild(createMessageEl(p));
      messagesEl.scrollTop = messagesEl.scrollHeight;
      var delay = 120;
      if (i > 0) {
        var gap = (p.timeshift || 0) - (newMessages[i - 1].timeshift || 0);
        if (gap > 0 && gap < 30) delay = Math.max(80, Math.min(350, gap * 80));
      }
      staggerTimeout = setTimeout(function () { appendNext(i + 1); }, delay);
    }
    if (staggerTimeout) clearTimeout(staggerTimeout);
    appendNext(0);
  }

  function addUserNote() {
    var text = (notesInput.value || '').trim();
    if (!text) return;
    var streamTime = getStreamTime();
    if (streamTime == null) streamTime = 0;
    userNotes.push({ timeshift: Math.round(streamTime), message: text });
    saveUserNotes(userNotes);
    notesInput.value = '';
    var visible = allPosts.filter(function (p) { return p.timeshift <= streamTime; });
    renderMessages(visible, streamTime);
  }
  notesBtn.addEventListener('click', addUserNote);
  notesInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addUserNote(); }
  });

  function getStreamTime() {
    var video = document.querySelector('#return-video-wrap video, .video-wrap-native video, [id*="day1"] .video-wrap-native video, .video-wrap video') || document.querySelector('video');
    if (!video) return null;
    var t = video.currentTime;
    if (typeof t !== 'number' || isNaN(t)) return null;
    return t;
  }

  function updateByVideo() {
    var streamTime = getStreamTime();
    if (streamTime == null) streamTime = 0;
    var visible = allPosts.filter(function (p) { return p.timeshift <= streamTime; });
    var notesCount = userNotes.filter(function (n) { return n.timeshift <= streamTime; }).length;
    var total = visible.length + notesCount;
    var cur = messagesEl.querySelectorAll('.chat-script-msg').length;
    if (total !== cur || (total && !messagesEl.querySelector('.chat-script-msg'))) renderMessages(visible, streamTime);
  }

  fetch(scriptUrl)
    .then(function (r) { return r.ok ? r.json() : Promise.reject(new Error(r.status)); })
    .then(function (json) {
      var data = (json && json.data) || [];
      allPosts = data
        .filter(function (item) { return item.action === 'post'; })
        .map(function (item) {
          var raw = typeof item.timeshift === 'number' ? item.timeshift : 0;
          var timeshiftSec = raw >= 1e5 ? raw / 1000 : raw;
          return {
            timeshift: timeshiftSec,
            username: item.username || (item.data && item.data.username) || 'Гость',
            message: item.message || (item.data && item.data.message) || '',
            role: item.role || (item.data && item.data.role) || ''
          };
        });
      messagesEl.innerHTML = '';
      var streamTime = getStreamTime();
      if (streamTime == null) streamTime = 0;
      var visible = allPosts.filter(function (p) { return p.timeshift <= streamTime; });
      renderMessages(visible, streamTime);
      setInterval(updateByVideo, 500);
    })
    .catch(function () {
      messagesEl.innerHTML = '<div class="chat-script-error">Не удалось загрузить сценарий чата.</div>';
    });
})();
