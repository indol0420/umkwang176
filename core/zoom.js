// =========================================================
// zoom.js — 물건 확대 보기(사원증, 휴대폰 화면, 책 청구기호, 종이 문서 등)
// data의 zoom: { style, title, head, lines, call, case, plain }
// =========================================================
import { h, richText } from './util.js';
import { openModal } from './ui.js';
import { sfx } from './sound.js';

// 확대 창을 연다. extra: 아래에 붙일 버튼 등
export function openZoom(game, zoom, extra = null) {
  sfx.next();
  let modal = null;
  const content = h(
    'div',
    { class: `zoom zoom--${zoom.style || 'note'}` },
    h(
      'header',
      { class: 'zoom-head' },
      h('h2', { class: 'zoom-title' }, game.fill(zoom.title || '')),
      h('button', { class: 'btn btn--icon', type: 'button', 'aria-label': '닫기', onclick: () => modal.close() }, '✕'),
    ),
    zoomBody(game, zoom),
    extra ? h('div', { class: 'zoom-extra' }, extra) : null,
  );
  modal = openModal({ content, className: 'modal--zoom', label: zoom.title || '확대' });
  return modal;
}

// 한 줄을 HTML 문단으로(빈 줄은 간격)
function para(game, text) {
  return text ? h('p', { html: richText(game.fill(text)) }) : h('p', { class: 'z-gap', 'aria-hidden': 'true' });
}

// 종류별 모양
function zoomBody(game, z) {
  const lines = (z.lines || []).map((t) => para(game, t));
  switch (z.style) {
    case 'card': // 사원증·명찰·학생증
      return h(
        'div',
        { class: `z-card${z.plain ? ' z-card--plain' : ''}` },
        h('p', { class: 'z-card-head' }, z.head || ''),
        h('div', { class: 'z-card-row' }, z.plain ? null : h('div', { class: 'z-card-photo', 'aria-hidden': 'true' }), h('div', { class: 'z-card-lines' }, lines)),
      );
    case 'phone': // 휴대폰 화면
      return h(
        'div',
        { class: 'z-phone-wrap' },
        h('div', { class: 'z-phone' }, h('p', { class: 'z-phone-head' }, z.head || ''), h('div', { class: 'z-phone-msg' }, lines)),
        z.case ? h('p', { class: 'z-caption' }, z.case) : null,
      );
    case 'spine': // 책 등의 청구기호 라벨
      return h(
        'div',
        { class: 'z-spine-wrap' },
        h('div', { class: 'z-spine' }, h('div', { class: 'z-call' }, (z.call || []).map((c) => h('span', null, c)))),
        h('div', { class: 'z-spine-text' }, lines),
      );
    case 'paper': // 종이 문서
      return h('div', { class: 'z-paper' }, lines);
    case 'screen': // 1985년 시스템 화면
      return h('div', { class: 'z-screen' }, lines);
    default:
      return h('div', { class: 'z-note' }, lines);
  }
}
