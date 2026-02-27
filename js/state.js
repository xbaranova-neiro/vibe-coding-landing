/**
 * Состояние воронки Wipecoding — этапы и таймеры
 * Сохраняется в localStorage, пользователь не теряет прогресс
 */

const STORAGE_KEY = 'wipecoding_funnel';
const REGISTRATION_DELAY_MINUTES = 3;

const STAGES = {
  NOT_REGISTERED: 'not_registered',
  WAITING_DAY1: 'waiting_day1',      // зарегистрирован, ждём 3 мин
  DAY1_AVAILABLE: 'day1_available',  // можно смотреть День 1
  DAY1_WATCHED: 'day1_watched',      // День 1 просмотрен
  DAY2_AVAILABLE: 'day2_available',  // можно смотреть День 2
  DAY2_WATCHED: 'day2_watched',
  QUIZ_PASSED: 'quiz_passed',
}

function getState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

function initState() {
  const s = getState();
  if (s) return s;
  const newState = {
    stage: STAGES.NOT_REGISTERED,
    registeredAt: null,
    email: '',
    name: '',
    day1WatchedAt: null,
    day2UnlockChoice: 'immediate', // 'immediate' | 'tomorrow'
    day2UnlockAt: null,
    quizPassed: false,
  };
  saveState(newState);
  return newState;
}

function register(email, name) {
  const state = initState();
  if (state.stage !== STAGES.NOT_REGISTERED) return state;
  const newState = {
    ...state,
    stage: STAGES.WAITING_DAY1,
    registeredAt: Date.now(),
    email: email || state.email,
    name: name || state.name,
  };
  saveState(newState);
  return newState;
}

/** Регистрация «с внешнего лендинга» — редирект после регистрации на vibe-coding-landing / neirovideo5 */
function registerFromExternal(email, name) {
  const state = initState();
  if (state.stage !== STAGES.NOT_REGISTERED) return state;
  return register(email || '', name || '');
}

function getSecondsUntilDay1() {
  const s = getState();
  if (!s || !s.registeredAt || s.stage === STAGES.NOT_REGISTERED) return null;
  if ([STAGES.DAY1_AVAILABLE, STAGES.DAY1_WATCHED, STAGES.DAY2_AVAILABLE, STAGES.DAY2_WATCHED, STAGES.QUIZ_PASSED].includes(s.stage)) {
    return 0; // уже доступно
  }
  const elapsed = (Date.now() - s.registeredAt) / 1000;
  const required = REGISTRATION_DELAY_MINUTES * 60;
  return Math.max(0, Math.ceil(required - elapsed));
}

function unlockDay1IfReady() {
  const s = getState();
  if (!s) return s;
  if (s.stage === STAGES.WAITING_DAY1 && getSecondsUntilDay1() === 0) {
    const newState = { ...s, stage: STAGES.DAY1_AVAILABLE };
    saveState(newState);
    return newState;
  }
  return s;
}

function markDay1Watched() {
  const s = getState();
  if (!s) return s;
  const newState = {
    ...s,
    stage: STAGES.DAY1_WATCHED,
    day1WatchedAt: Date.now(),
  };
  if (s.day2UnlockChoice === 'immediate') {
    newState.stage = STAGES.DAY2_AVAILABLE;
  } else {
    newState.day2UnlockAt = getTomorrowStart();
  }
  saveState(newState);
  return newState;
}

function getTomorrowStart() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function canAccessDay2() {
  const s = getState();
  if (!s) return false;
  if (s.stage === STAGES.DAY2_AVAILABLE || s.stage === STAGES.DAY2_WATCHED || s.stage === STAGES.QUIZ_PASSED) return true;
  if (s.stage !== STAGES.DAY1_WATCHED) return false;
  if (s.day2UnlockChoice === 'immediate') return true;
  if (s.day2UnlockAt && Date.now() >= s.day2UnlockAt) {
    const newState = { ...s, stage: STAGES.DAY2_AVAILABLE };
    saveState(newState);
    return true;
  }
  return false;
}

function getSecondsUntilDay2() {
  const s = getState();
  if (!s || !s.day2UnlockAt) return null;
  if (canAccessDay2()) return 0;
  return Math.max(0, Math.ceil((s.day2UnlockAt - Date.now()) / 1000));
}

function setDay2UnlockChoice(choice) {
  const s = getState();
  if (!s || s.stage !== STAGES.DAY1_WATCHED) return s;
  const newState = {
    ...s,
    day2UnlockChoice: choice,
    day2UnlockAt: choice === 'tomorrow' ? getTomorrowStart() : Date.now(),
    stage: choice === 'immediate' ? STAGES.DAY2_AVAILABLE : s.stage,
  };
  saveState(newState);
  return newState;
}

function markDay2Watched() {
  const s = getState();
  if (!s) return s;
  const newState = { ...s, stage: STAGES.DAY2_WATCHED };
  saveState(newState);
  return newState;
}

function setQuizPassed() {
  const s = getState();
  if (!s) return s;
  const newState = { ...s, quizPassed: true, stage: STAGES.QUIZ_PASSED };
  saveState(newState);
  return newState;
}

// Экспорт для использования в страницах
window.WipecodingState = {
  getState: getState,
  initState: initState,
  register: register,
  registerFromExternal: registerFromExternal,
  saveState: saveState,
  getSecondsUntilDay1: getSecondsUntilDay1,
  unlockDay1IfReady: unlockDay1IfReady,
  markDay1Watched: markDay1Watched,
  canAccessDay2: canAccessDay2,
  getSecondsUntilDay2: getSecondsUntilDay2,
  setDay2UnlockChoice: setDay2UnlockChoice,
  markDay2Watched: markDay2Watched,
  setQuizPassed: setQuizPassed,
  STAGES: STAGES,
  REGISTRATION_DELAY_MINUTES,
};
