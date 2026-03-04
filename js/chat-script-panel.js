/**
 * Чат: загрузка JSON (Bizon365 room_recs) и синхронизация с видео по timeshift.
 * Включается при заданном WIPECODING_CHAT_SCRIPT_URL в config.js.
 */
(function () {
  var scriptUrl = typeof window.WIPECODING_CHAT_SCRIPT_URL !== 'undefined' && (window.WIPECODING_CHAT_SCRIPT_URL || '').trim();
  if (!scriptUrl) return;

  // ── Панель ───────────────────────────────────────────────
  var panel = document.createElement('div');
  panel.className = 'chat-widget-panel';
  panel.innerHTML =
    '<div class="chat-script-header">Чат<button type="button" class="chat-close-btn" aria-label="Закрыть чат">✕</button></div>' +
    '<div class="chat-script-messages"><div class="chat-script-loading">Загрузка…</div></div>' +
    '<div class="chat-script-your">' +
      '<p class="chat-script-your-label">Написать в чат</p>' +
      '<div class="chat-script-your-form">' +
        '<textarea class="chat-script-input" rows="2" placeholder="Сообщение…" maxlength="2000"></textarea>' +
        '<button type="button" class="chat-script-send">Отправить</button>' +
      '</div>' +
    '</div>';

  var messagesEl  = panel.querySelector('.chat-script-messages');
  var notesInput  = panel.querySelector('.chat-script-input');
  var notesBtn    = panel.querySelector('.chat-script-send');
  var closeBtn    = panel.querySelector('.chat-close-btn');

  // ── Заметки пользователя ─────────────────────────────────
  var STORAGE_KEY = 'wipecoding_chat_notes';
  function loadNotes() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch (e) { return []; }
  }
  function saveNotes(notes) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(notes)); } catch (e) {}
  }
  var userNotes = loadNotes();

  // ── Кнопка-тоггл ─────────────────────────────────────────
  var toggle = document.createElement('button');
  toggle.className = 'chat-widget-toggle';
  toggle.setAttribute('type', 'button');
  toggle.setAttribute('aria-label', 'Открыть чат');
  toggle.innerHTML = '💬';
  function openChat()  { panel.classList.remove('hidden'); toggle.setAttribute('aria-label', 'Закрыть чат');  if (window.matchMedia('(max-width: 768px)').matches) document.body.classList.add('chat-panel-open'); }
  function closeChat() { panel.classList.add('hidden');    toggle.setAttribute('aria-label', 'Открыть чат'); document.body.classList.remove('chat-panel-open'); }
  function toggleChat() { panel.classList.contains('hidden') ? openChat() : closeChat(); }

  toggle.addEventListener('click', toggleChat);
  if (closeBtn) closeBtn.addEventListener('click', closeChat);
  document.body.appendChild(toggle);
  document.body.appendChild(panel);
  if (window.matchMedia('(max-width: 768px)').matches) {
    panel.classList.add('hidden');
  }

  // ── Конфиг ───────────────────────────────────────────────
  var videoStartSec      = Math.max(0, parseInt(window.WIPECODING_DAY1_VIDEO_START_SECONDS,      10) || 0);
  var chatStreamOffset   = Math.max(0, parseInt(window.WIPECODING_CHAT_STREAM_OFFSET_SEC,        10) || 0);
  var scriptExtraFirstSec = Math.max(0, parseInt(window.WIPECODING_CHAT_SCRIPT_EXTRA_FIRST_SEC, 10) || 0);
  var minStreamTime = Math.max(0, videoStartSec - scriptExtraFirstSec);

  // ── Текущее время эфира ───────────────────────────────────
  function getStreamTime() {
    var video = document.querySelector('.video-wrap-native video') ||
                document.querySelector('.video-wrap video') ||
                document.querySelector('video');
    if (!video) return null;
    var t = video.currentTime;
    if (typeof t !== 'number' || isNaN(t)) return null;
    // видео обрезано с videoStartSec → streamTime = videoStartSec + currentTime
    return videoStartSec + t + chatStreamOffset;
  }

  // ── Элемент сообщения ─────────────────────────────────────
  function createMessageEl(p) {
    var div = document.createElement('div');
    div.className = 'chat-script-msg chat-msg-appear' +
      (p.isNote ? ' chat-script-note' : (p.role ? ' role-' + p.role : ''));
    var user = document.createElement('div');
    user.className = 'chat-script-user';
    user.textContent = p.isNote
      ? 'Вы'
      : (p.username || 'Гость') +
        (p.role === 'admin' ? ' • Админ' : p.role === 'moder' ? ' • Модератор' : '');
    var text = document.createElement('div');
    text.className = 'chat-script-text';
    var msg = (p.message || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    msg = msg.replace(/(https?:\/\/[^\s<>"]+)/g, '<a href="$1" target="_blank" rel="noopener" style="color:#818cf8;word-break:break-all;">$1</a>');
    text.innerHTML = msg;
    div.appendChild(user);
    div.appendChild(text);
    return div;
  }

  // ── Данные и состояние ────────────────────────────────────
  var allPosts     = [];   // все сообщения из JSON
  var renderedCount = 0;   // сколько уже отрисовано

  function getVisible(streamTime) {
    var posts = allPosts.filter(function (p) {
      return p.timeshift >= minStreamTime && p.timeshift <= streamTime;
    });
    var notes = userNotes
      .filter(function (n) { return n.timeshift >= minStreamTime && n.timeshift <= streamTime; })
      .map(function (n) { return { timeshift: n.timeshift, username: 'Вы', message: n.message, isNote: true }; });
    return posts.concat(notes).sort(function (a, b) { return a.timeshift - b.timeshift; });
  }

  // ── Синхронизация с видео ─────────────────────────────────
  function syncChat() {
    var streamTime = getStreamTime();
    if (streamTime == null) return;

    var visible = getVisible(streamTime);

    // Ничего не изменилось
    if (visible.length === renderedCount) return;

    // Перемотка назад — полный ре-рендер
    if (visible.length < renderedCount) {
      messagesEl.innerHTML = '';
      visible.forEach(function (p) { messagesEl.appendChild(createMessageEl(p)); });
      renderedCount = visible.length;
      if (visible.length) messagesEl.scrollTop = messagesEl.scrollHeight;
      return;
    }

    // Новые сообщения — добавляем только их
    var toAdd = visible.slice(renderedCount);
    toAdd.forEach(function (p) { messagesEl.appendChild(createMessageEl(p)); });
    renderedCount = visible.length;
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  // ── Заметки ───────────────────────────────────────────────
  function addNote() {
    var text = (notesInput.value || '').trim();
    if (!text) return;
    var t = getStreamTime() || 0;
    userNotes.push({ timeshift: Math.round(t), message: text });
    saveNotes(userNotes);
    notesInput.value = '';
    renderedCount = 0; // принудительный ре-рендер
    messagesEl.innerHTML = '';
    syncChat();
  }
  notesBtn.addEventListener('click', addNote);
  notesInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addNote(); }
  });

  // ── Загрузка JSON ─────────────────────────────────────────
  fetch(scriptUrl, { mode: 'cors' })
    .then(function (r) {
      if (!r.ok) throw new Error(r.status + ' ' + r.statusText);
      return r.json();
    })
    .then(function (json) {
      var data = (json && json.data) || [];
      allPosts = data
        .filter(function (item) { return item.action === 'post'; })
        .map(function (item) {
          var raw = typeof item.timeshift === 'number' ? item.timeshift : 0;
          return {
            timeshift: raw / 1000, // Bizon365 всегда отдаёт ms
            username: item.username || (item.data && item.data.username) || 'Гость',
            message:  item.message  || (item.data && item.data.message)  || '',
            role:     item.role     || (item.data && item.data.role)     || ''
          };
        });

      messagesEl.innerHTML = '';
      syncChat();

      // Синхронизация каждые 500 мс
      setInterval(syncChat, 500);
    })
    .catch(function () {
      messagesEl.innerHTML =
        '<div class="chat-script-error">Не удалось загрузить чат. ' +
        'Положите JSON в репо (data/room_recs.json) и укажите путь в config.js.</div>';
    });
})();
