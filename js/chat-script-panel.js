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
    toggle.setAttribute('aria-label', panel.classList.contains('hidden') ? 'Открыть чат' : 'Закрыть чат');
  });
  document.body.appendChild(toggle);
  document.body.appendChild(panel);

  var allPosts = [];
  var videoStartOffset = Math.max(0, parseInt(window.WIPECODING_DAY1_VIDEO_START_SECONDS, 10) || 0);

  function renderMessages(visiblePosts, streamTimeForNotes) {
    var streamTime = streamTimeForNotes != null ? streamTimeForNotes : (getStreamTime() ?? 1e9);
    var notesToShow = userNotes.filter(function (n) { return n.timeshift <= streamTime; });
    var merged = visiblePosts.concat(notesToShow.map(function (n) { return { timeshift: n.timeshift, username: 'Вы', message: n.message, role: '', isNote: true }; }));
    merged.sort(function (a, b) { return (a.timeshift || 0) - (b.timeshift || 0); });

    messagesEl.innerHTML = '';
    if (!merged.length) {
      messagesEl.innerHTML = '<div class="chat-script-loading">Нет сообщений за этот момент эфира.</div>';
      messagesEl.scrollTop = 0;
      return;
    }
    merged.forEach(function (p) {
      var div = document.createElement('div');
      div.className = 'chat-script-msg' + (p.isNote ? ' chat-script-note' : (p.role ? ' role-' + p.role : ''));
      var user = document.createElement('div');
      user.className = 'chat-script-user';
      user.textContent = p.isNote ? 'Вы' : (p.username || 'Гость') + (p.role === 'admin' || p.role === 'moder' ? ' • ' + (p.role === 'admin' ? 'Админ' : 'Модератор') : '');
      var text = document.createElement('div');
      text.className = 'chat-script-text';
      text.textContent = p.message || '';
      div.appendChild(user);
      div.appendChild(text);
      messagesEl.appendChild(div);
    });
    messagesEl.scrollTop = messagesEl.scrollHeight;
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
    var video = document.querySelector('#return-video-wrap video, .video-wrap-native video, [id*="day1"] .video-wrap-native video, .video-wrap video');
    if (!video || !video.duration) return null;
    return videoStartOffset + (video.currentTime || 0);
  }

  function updateByVideo() {
    var streamTime = getStreamTime();
    if (streamTime == null) {
      if (allPosts.length && messagesEl.querySelector('.chat-script-loading')) renderMessages(allPosts);
      return;
    }
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
          return {
            timeshift: typeof item.timeshift === 'number' ? item.timeshift : 0,
            username: item.username || (item.data && item.data.username) || 'Гость',
            message: item.message || (item.data && item.data.message) || '',
            role: item.role || (item.data && item.data.role) || ''
          };
        });
      messagesEl.innerHTML = '';
      var streamTime = getStreamTime();
      if (streamTime != null) {
        var visible = allPosts.filter(function (p) { return p.timeshift <= streamTime; });
        renderMessages(visible, streamTime);
      } else {
        renderMessages(allPosts);
      }
      setInterval(updateByVideo, 500);
    })
    .catch(function () {
      messagesEl.innerHTML = '<div class="chat-script-error">Не удалось загрузить сценарий чата.</div>';
    });
})();
