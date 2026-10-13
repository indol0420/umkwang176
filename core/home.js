// =========================================================
// home.js — 사이트 첫 화면(건물 다섯 곳의 스카이라인)
// 열린 건물: 창문에 불 + 테마 정보 + 진행 표시(새 기록 / 확정 n명 / 클리어 도장)
// 잠긴 건물: 검은 실루엣 + 자물쇠 + 준비 중
// =========================================================
import { h, replace } from './util.js';
import { buildingCanvas } from './render.js';
import { saveSummary } from './storage.js';
import { toast } from './ui.js';

// 첫 화면을 그린다
export async function startHome(site, buildings) {
  if (document.fonts) {
    try {
      await document.fonts.load('700 12px Galmuri11');
    } catch {
      /* 무시 */
    }
  }
  const root = document.getElementById('app');
  const cards = buildings.map((b) => (b.open ? openCard(b) : lockedCard(b)));
  replace(
    root,
    h(
      'main',
      { class: 'home' },
      h(
        'header',
        { class: 'home-head' },
        h('p', { class: 'home-kicker' }, site.subtitle),
        h('h1', { class: 'home-title' }, `『${site.title}』`),
        h('p', { class: 'home-tagline' }, site.tagline),
      ),
      h('section', { class: 'skyline', 'aria-label': '건물 목록' }, cards),
      h('p', { class: 'home-guide' }, '불이 켜진 건물을 눌러 들어가세요. 진행 상황은 이 브라우저에 건물별로 저장됩니다.'),
      h('footer', { class: 'credit' }, h('span', null, site.team), h('span', null, site.course), h('span', null, site.year)),
    ),
  );
  // 건물 그림은 나중에 채운다(디더링)
  buildings.forEach((b, i) => buildingCanvas(b).then((canvas) => cards[i].querySelector('.bcard-pic').append(canvas)));
}

// 열린 건물 카드(테마로 이동하는 링크)
function openCard(b) {
  const summary = saveSummary(b.id);
  let progress;
  if (!summary) progress = h('span', { class: 'bcard-progress' }, '새 기록');
  else progress = h('span', { class: 'bcard-progress' }, `확정 ${summary.confirmed}/${b.people}`);
  return h(
    'a',
    { class: 'bcard is-open', href: b.path, 'aria-label': `${b.name} — 『${b.title}』 시작` },
    h('div', { class: 'bcard-pic' }),
    h(
      'div',
      { class: 'bcard-body' },
      h('p', { class: 'bcard-name' }, b.name),
      h('h2', { class: 'bcard-title' }, `『${b.title}』`),
      h('p', { class: 'bcard-intro' }, b.intro),
      h('p', { class: 'bcard-meta' }, h('span', null, `약 ${b.minutes}분`), progress),
    ),
    summary && summary.best ? h('p', { class: 'stamp bcard-stamp' }, h('b', null, '클리어'), h('span', null, summary.best.name)) : null,
  );
}

// 잠긴 건물 카드(누르면 짧은 알림만)
function lockedCard(b) {
  return h(
    'button',
    { class: 'bcard is-locked', type: 'button', 'aria-disabled': 'true', 'aria-label': `${b.name} — 준비 중`, onclick: () => toast('아직 열리지 않은 건물입니다') },
    h('div', { class: 'bcard-pic' }, h('span', { class: 'bcard-lock', 'aria-hidden': 'true' })),
    h(
      'div',
      { class: 'bcard-body' },
      h('p', { class: 'bcard-name' }, b.name),
      h('h2', { class: 'bcard-title' }, '???'),
      h('p', { class: 'bcard-meta' }, h('span', null, '준비 중')),
    ),
  );
}
