// =========================================================
// gate.js — 정문 IC 게이트 화면
// 10명 모두의 운명을 기록하고 마지막 장면(B1)을 보면 '퇴실 처리' 버튼이 켜진다.
// =========================================================
import { h } from './util.js';
import { openModal, confirmBox } from './ui.js';
import { sfx } from './sound.js';

// 게이트 창을 연다
export function openGate(game) {
  const t = game.theme.gate;
  const total = game.total;
  const filled = game.filledCount();
  const seenFinal = game.sceneSeen(game.theme.finalScene);
  const ready = filled === total && seenFinal;
  let modal = null;
  sfx.key();

  // 사진 번호별 퇴실 상태
  const slots = game.theme.people.map((p) => {
    const out = game.isConfirmed(p.photo);
    return h('li', { class: `gate-slot${out ? ' is-out' : ''}` }, h('span', null, `#${p.photo}`), h('b', null, out ? '퇴실' : '미퇴실'));
  });

  // 퇴실 처리 → 확인창 → 엔딩
  const go = async () => {
    const ok = await confirmBox(game.fill(t.confirm), { ok: t.button, title: t.title });
    if (!ok) return;
    modal.close();
    game.finish();
  };

  const content = h(
    'div',
    { class: 'gate' },
    h(
      'header',
      { class: 'zoom-head' },
      h('h2', { class: 'zoom-title' }, t.title),
      h('button', { class: 'btn btn--icon', type: 'button', 'aria-label': '닫기', onclick: () => modal.close() }, '✕'),
    ),
    h('div', { class: 'z-screen gate-screen' }, t.lines.map((line) => h('p', null, game.fill(line))), h('p', { class: 'gate-status' }, game.fill(game.remaining() || !t.statusDone ? t.status : t.statusDone))),
    h('ol', { class: 'gate-slots', 'aria-label': '이용자별 퇴실 상태' }, slots),
    h(
      'ul',
      { class: 'gate-checks' },
      h('li', { class: filled === total ? 'is-ok' : '' }, `운명 기록 ${filled}/${total}`),
      h('li', { class: seenFinal ? 'is-ok' : '' }, `B1 서고 장면 ${seenFinal ? '확인' : '미확인'}`),
    ),
    h(
      'div',
      { class: 'gate-actions' },
      ready ? null : h('p', { class: 'gate-why' }, filled < total ? t.needAll : t.needScene),
      h('button', { class: 'btn btn--solid gate-go', type: 'button', disabled: !ready, onclick: go }, t.button),
    ),
  );
  modal = openModal({ content, className: 'modal--gate', label: t.title });
  return modal;
}
