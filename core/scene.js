// =========================================================
// scene.js — 책갈피 장면 재생
//  1) 암전: 대사만 한 줄씩 타자 효과로 나온다(클릭하면 바로 다음 줄)
//  2) 정지 장면: 디더링 그림 + "23:59 · 장소" + 클릭 영역
//     인물 → 기록부 사진 페이지 / 물건 → 확대 / 책갈피 → 더 이전 순간
// =========================================================
import { h, sleep } from './util.js';
import { typeText, hasModal } from './ui.js';
import { createPicture } from './render.js';
import { openZoom } from './zoom.js';
import { sfx, playCue } from './sound.js';

let activeScene = null; // 지금 열려 있는 장면(한 번에 하나)

// ---------------------------------------------------------
// 암전 대사: 검은 화면에 대사를 한 줄씩 보여 준다.
// canSkip이면 '건너뛰기' 버튼이 생긴다(한 번 본 장면).
// ---------------------------------------------------------
export async function blackout(game, lines, { canSkip = false, layer = null, label = '' } = {}) {
  const own = !layer;
  const host = layer || h('div', { class: 'scene-layer', role: 'dialog', 'aria-modal': 'true', 'aria-label': label || '암전' });
  if (own) document.body.append(host);
  takeFocus(host);
  const box = h('div', { class: 'blackout' });
  const list = h('div', { class: 'bo-lines', 'aria-live': 'polite' });
  const hint = h('p', { class: 'bo-hint' }, '클릭하거나 Space 키를 눌러 계속');
  box.append(list, hint);
  host.append(box);

  let skipAll = false;
  let wake = null; // 지금 기다리는 중인 줄을 바로 넘기는 함수
  if (canSkip) {
    const skip = h('button', { class: 'btn bo-skip', type: 'button' }, '건너뛰기');
    skip.addEventListener('click', (e) => {
      e.stopPropagation();
      skipAll = true;
      if (wake) wake();
    });
    box.append(skip);
  }

  let lastTick = 0;
  const tick = () => {
    const now = performance.now();
    if (now - lastTick > 55) {
      sfx.type();
      lastTick = now;
    }
  };

  for (const line of lines) {
    if (skipAll) break;
    const text = h('span', { class: 'bo-text' });
    const row = h('p', { class: `bo-line${line.who ? '' : ' bo-line--sfx'}` }, line.who ? h('span', { class: 'bo-who' }, line.who) : null, text);
    list.append(row);
    playCue(line.cue);
    const typing = typeText(text, game.fill(line.text), { speed: 34, onChar: tick });
    await waitAdvance(box, typing, (fn) => (wake = fn));
    wake = null;
  }
  if (!skipAll) await sleep(500); // 마지막 줄을 읽을 틈
  box.remove();
  if (own) host.remove();
}

// 덮개 화면으로 키보드 초점을 옮긴다(뒤 화면의 버튼이 Space로 눌리지 않게)
export function takeFocus(el) {
  el.setAttribute('tabindex', '-1');
  el.focus({ preventScroll: true });
}

// 클릭/키 입력을 기다린다. 글자가 다 나오기 전에 눌러도 그 줄을 끝까지 보여 주고 바로 다음 줄로 넘어간다
// (지나간 줄은 화면에 그대로 남고, 정지 장면의 '대사 다시 보기'에서도 볼 수 있다)
function waitAdvance(box, typing, setWake) {
  return new Promise((resolve) => {
    const finish = () => {
      box.removeEventListener('click', onInput);
      document.removeEventListener('keydown', onInput);
      typing.skip();
      resolve();
    };
    const onInput = (e) => {
      if (e.type === 'keydown') {
        if (hasModal() || ![' ', 'Enter'].includes(e.key)) return;
        e.preventDefault();
      }
      sfx.next();
      finish();
    };
    setWake(finish);
    box.addEventListener('click', onInput);
    document.addEventListener('keydown', onInput);
  });
}

// ---------------------------------------------------------
// 장면 재생 전체
// opts.onExit : '현재로 돌아가기'로 장면을 닫은 뒤 부를 함수
// ---------------------------------------------------------
export async function playScene(game, sceneId, opts = {}) {
  const scene = game.sceneById.get(sceneId);
  if (!scene) return;
  if (activeScene) activeScene.close({ silent: true }); // 장면 안에서 다른 장면으로 이동

  const seenBefore = game.sceneSeen(sceneId);
  const layer = h('div', { class: 'scene-layer', role: 'dialog', 'aria-modal': 'true', 'aria-label': `${scene.time} ${scene.where}` });
  document.body.append(layer);
  document.body.classList.add('in-scene');
  takeFocus(layer);

  // onExit: 장면을 닫은 뒤 할 일(이어지는 장면에도 그대로 넘긴다), exitLabel: 닫기 버튼 글자
  const handle = { layer, close: null, onExit: opts.onExit, exitLabel: opts.exitLabel };
  activeScene = handle;
  let pic = null;
  let closed = false;

  // 장면 닫기(현재로 돌아가기)
  handle.close = ({ silent = false } = {}) => {
    if (closed) return;
    closed = true;
    if (pic) pic.destroy();
    document.removeEventListener('keydown', onEsc);
    layer.remove();
    if (activeScene === handle) activeScene = null;
    if (!document.querySelector('.scene-layer')) document.body.classList.remove('in-scene');
    if (!silent && opts.onExit) opts.onExit();
  };
  const onEsc = (e) => {
    if (e.key === 'Escape' && !hasModal() && layer.querySelector('.frozen')) {
      e.preventDefault();
      handle.close();
    }
  };
  document.addEventListener('keydown', onEsc);

  sfx.stinger();
  await blackout(game, scene.lines, { canSkip: seenBefore, layer });
  if (closed) return;

  const isNew = game.markScene(sceneId);
  pic = showFrozen(game, layer, scene, handle, { isNew });
}

// 정지 장면 화면을 만든다
function showFrozen(game, layer, scene, handle, { isNew }) {
  const spots = scene.spots.map((s) => decorateSpot(game, s));
  const pic = createPicture({
    key: `${game.theme.id}:scene:${scene.id}`,
    src: scene.image,
    art: scene.art,
    looks: game.looks,
    spots,
    vanish: scene.vanish,
    reveal: true,
    onSpot: (spot) => useSpot(game, scene, spot, handle),
  });
  if ((scene.vanish || []).length) setTimeout(() => sfx.paper(), 500);

  const people = spots.filter((s) => s.kind === 'person');
  const things = spots.filter((s) => s.kind !== 'person');
  const side = h(
    'aside',
    { class: 'frozen-side' },
    people.length
      ? h('section', null, h('h3', null, '인물'), h('ul', { class: 'obj-list' }, people.map((s) => objButton(s, () => useSpot(game, scene, s, handle)))))
      : null,
    things.length
      ? h('section', null, h('h3', null, '물건'), h('ul', { class: 'obj-list' }, things.map((s) => objButton(s, () => useSpot(game, scene, s, handle)))))
      : null,
    h(
      'details',
      { class: 'transcript' },
      h('summary', null, '대사 다시 보기'),
      h('ol', null, scene.lines.map((l) => h('li', null, l.who ? h('span', { class: 'bo-who' }, l.who) : null, game.fill(l.text)))),
    ),
  );

  const frozen = h(
    'div',
    { class: 'frozen' },
    h(
      'header',
      { class: 'frozen-head' },
      h('p', { class: 'frozen-when' }, h('span', { class: 'frozen-time' }, scene.time), h('span', { class: 'frozen-dot', 'aria-hidden': 'true' }, '·'), h('span', { class: 'frozen-where' }, scene.where)),
      isNew ? h('span', { class: 'stamp frozen-new' }, '새 장면') : null,
      h(
        'div',
        { class: 'frozen-actions' },
        h('button', { class: 'btn', type: 'button', onclick: () => game.openLogbook() }, '기록부'),
        h('button', { class: 'btn btn--solid', type: 'button', onclick: () => handle.close() }, handle.exitLabel || '현재로 돌아가기'),
      ),
    ),
    h('div', { class: 'frozen-pic' }, pic.el),
    side,
  );
  layer.append(frozen);
  frozen.querySelector('.btn--solid').focus({ preventScroll: true });
  return pic;
}

// 클릭 영역에 표시할 글자·설명을 붙인다
function decorateSpot(game, spot) {
  if (spot.kind === 'person') {
    const person = game.personByPhoto.get(spot.photo);
    const guess = game.guessOf(spot.photo);
    return { ...spot, tag: `#${spot.photo}`, label: `사진 #${spot.photo}`, sub: guess.name || '이름 미기록', aria: `사진 #${spot.photo} 인물 — 기록부 열기${person ? `, ${person.desc}` : ''}` };
  }
  if (spot.kind === 'portal') {
    const seen = game.sceneSeen(spot.to);
    return { ...spot, tag: spot.label, sub: seen ? '책갈피 · 본 장면' : '책갈피', cls: seen ? '' : 'is-new', aria: `${spot.label} — 책갈피 꽂기` };
  }
  return { ...spot, tag: spot.tag ?? spot.label, sub: '살펴보기', aria: `${spot.label} — 살펴보기` };
}

// 옆 목록의 버튼 하나
export function objButton(spot, onClick) {
  return h(
    'li',
    null,
    h('button', { class: `obj obj--${spot.kind}${spot.cls ? ` ${spot.cls}` : ''}`, type: 'button', onclick: onClick }, h('span', { class: 'obj-name' }, spot.label), h('small', { class: 'obj-sub' }, spot.sub || '')),
  );
}

// 장면 속 클릭 영역을 눌렀을 때
function useSpot(game, scene, spot, handle) {
  if (spot.kind === 'person') {
    game.openLogbook({ tab: 'photos', photo: spot.photo });
  } else if (spot.kind === 'portal') {
    bookmarkPrompt(game, spot, () => {
      handle.close({ silent: true });
      playScene(game, spot.to, { onExit: handle.onExit });
    });
  } else if (spot.zoom) {
    openZoom(game, spot.zoom);
  }
}

// 책갈피 꽂기 확인: 물건 설명 + [책갈피 꽂기] 버튼
export function bookmarkPrompt(game, spot, go) {
  const seen = game.sceneSeen(spot.to);
  let modal = null;
  const button = h(
    'button',
    {
      class: 'btn btn--solid',
      type: 'button',
      autofocus: true,
      onclick: () => {
        modal.close();
        sfx.paper();
        go();
      },
    },
    seen ? '책갈피 꽂기(다시 보기)' : '책갈피 꽂기',
  );
  modal = openZoom(game, { style: 'note', title: spot.label, lines: [spot.note || '책갈피를 꽂을 수 있을 것 같다.'] }, button);
  return modal;
}
