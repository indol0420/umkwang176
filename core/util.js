// =========================================================
// util.js — 여러 화면에서 함께 쓰는 작은 도구 함수 모음
// =========================================================

// HTML 요소를 만든다. 예: h('button', { class: 'btn', onclick: fn }, '확인')
export function h(tag, props, ...children) {
  const el = document.createElement(tag);
  setProps(el, props);
  appendAll(el, children);
  return el;
}

// SVG 요소를 만든다(안내도 그릴 때 사용)
export function svg(tag, attrs, ...children) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key, value] of Object.entries(attrs || {})) {
    if (value === null || value === undefined || value === false) continue;
    if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2), value);
    else el.setAttribute(key, String(value));
  }
  appendAll(el, children);
  return el;
}

// 속성·이벤트를 한꺼번에 넣는다
function setProps(el, props) {
  if (!props) return;
  for (const [key, value] of Object.entries(props)) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class') el.className = value;
    else if (key === 'style' && typeof value === 'object') Object.assign(el.style, value);
    else if (key === 'html') el.innerHTML = value;
    else if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2), value);
    else if (key === 'value' || key === 'checked') el[key] = value;
    else el.setAttribute(key, value === true ? '' : String(value));
  }
}

// 자식 요소(글자 포함)를 붙인다
function appendAll(el, children) {
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
}

// 요소 안을 비우고 새 내용으로 바꾼다
export function replace(el, ...children) {
  el.textContent = '';
  appendAll(el, children);
}

// 잠깐 기다린다(연출용)
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 값을 범위 안으로 자른다
export const clamp = (value, lo, hi) => Math.min(hi, Math.max(lo, value));

// 시드 고정 난수: 같은 시드면 임시 그림이 매번 똑같이 나온다
export function seeded(seed) {
  let a = (seed >>> 0) || 1;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 글자를 숫자 시드로 바꾼다
export function hashText(text) {
  let hash = 2166136261;
  for (const ch of String(text)) {
    hash ^= ch.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

// HTML 특수문자를 안전하게 바꾼다
export function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(text).replace(/[&<>"']/g, (c) => map[c]);
}

// data 파일의 간단한 강조 표기를 HTML로: **굵게**, __밑줄__
export function richText(text) {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/__(.+?)__/g, '<u>$1</u>');
}

// 주소에 ?dev 가 있으면 개발 모드(클릭 영역 표시, 좌표 확인)
export function isDev() {
  return new URLSearchParams(location.search).has('dev');
}
