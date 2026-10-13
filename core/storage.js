// =========================================================
// storage.js — 진행 상황 저장(localStorage, 테마별로 따로)
// =========================================================

const PREFIX = 'umkwang176:';          // 저장 키 앞부분
const SETTINGS = `${PREFIX}settings`;  // 소리·힌트 같은 공통 설정

// 테마 기록을 읽는다(없으면 null)
export function loadSave(themeId) {
  try {
    const raw = localStorage.getItem(PREFIX + themeId);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// 테마 기록을 저장한다
export function writeSave(themeId, data) {
  try {
    localStorage.setItem(PREFIX + themeId, JSON.stringify(data));
    return true;
  } catch {
    return false; // 사생활 보호 모드 등에서는 저장이 막힐 수 있다
  }
}

// 테마 기록만 지운다(다른 건물 기록은 그대로)
export function clearSave(themeId) {
  try {
    localStorage.removeItem(PREFIX + themeId);
  } catch {
    /* 무시 */
  }
}

// 공통 설정 하나를 읽는다
export function getSetting(key, fallback) {
  try {
    const all = JSON.parse(localStorage.getItem(SETTINGS) || '{}');
    return key in all ? all[key] : fallback;
  } catch {
    return fallback;
  }
}

// 공통 설정 하나를 바꾼다
export function setSetting(key, value) {
  try {
    const all = JSON.parse(localStorage.getItem(SETTINGS) || '{}');
    all[key] = value;
    localStorage.setItem(SETTINGS, JSON.stringify(all));
  } catch {
    /* 무시 */
  }
}

// 첫 화면 카드에 보여 줄 요약(확정 인원, 엔딩)
export function saveSummary(themeId) {
  const save = loadSave(themeId);
  if (!save || !save.name) return null;
  return {
    confirmed: (save.confirmed || []).length,
    scenes: Object.keys(save.scenes || {}).length,
    best: save.best || null,
  };
}
