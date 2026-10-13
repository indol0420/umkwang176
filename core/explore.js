// =========================================================
// explore.js — 현재 시점 탐색 화면
//  - 층 화면: 층 버튼 + 층별 안내도 + 탐색 지점 목록
//  - 장소 화면: 디더링 그림 + 살펴볼 물건(책갈피·확대·키패드·게이트)
// =========================================================
import { h } from './util.js';
import { floorMap } from './map.js';
import { createPicture } from './render.js';
import { openZoom } from './zoom.js';
import { openKeypad } from './lock.js';
import { objButton, bookmarkPrompt } from './scene.js';
import { toast } from './ui.js';
import { josa } from './korean.js';

// 자물쇠 아이콘(층 버튼에 붙는다)
function lockIcon() {
  return h('span', { class: 'lock-icon', 'aria-hidden': 'true' });
}

// 층 버튼 줄: 잠긴 층은 자물쇠가 붙고, 누르면 키패드가 열린다
export function floorTabs(game, current) {
  const hint = game.hintTarget();
  return h(
    'nav',
    { class: 'floors', 'aria-label': '층 이동' },
    game.theme.floors.map((f) => {
      const open = game.floorOpen(f.id);
      const hinted = hint && hint.floor === f.id && f.id !== current;
      return h(
        'button',
        {
          class: `floor-tab${open ? '' : ' is-locked'}${hinted ? ' is-hint' : ''}`,
          type: 'button',
          'aria-current': f.id === current ? 'true' : null,
          'aria-label': `${f.name}${open ? '' : ' (잠김)'}`,
          onclick: () => game.tryFloor(f.id),
        },
        f.label,
        open ? null : lockIcon(),
      );
    }),
  );
}

// 오른쪽 '기록 현황' 상자
function progressBox(game) {
  const locks = game.theme.locks;
  const row = (k, v) => [h('dt', null, k), h('dd', null, v)];
  return h(
    'section',
    { class: 'side-box progress' },
    h('h3', null, '기록 현황'),
    h(
      'dl',
      null,
      row('발견한 장면', `${game.seenCount()} / ${game.sceneTotal}`),
      row('기록한 사진', `${game.filledCount()} / ${game.total}`),
      row('확정(퇴실 처리)', `${game.confirmedCount()} / ${game.total}`),
      row('열린 문', `${locks.filter((l) => game.lockOpen(l.id)).length} / ${locks.length}`),
    ),
    h('button', { class: 'btn', type: 'button', onclick: () => game.openLogbook() }, '기록부 열기'),
  );
}

// ---------------------------------------------------------
// 층 화면
// ---------------------------------------------------------
export function renderFloor(game, floorId) {
  const floor = game.floorById.get(floorId);
  const places = game.theme.places.filter((p) => p.floor === floorId);
  const hint = game.hintTarget();
  const pins = places.map((p, i) => ({
    id: p.id,
    x: p.map.x,
    y: p.map.y,
    label: p.name,
    no: i + 1,
    visited: Boolean(game.state.visited[p.id]),
    hint: Boolean(hint && hint.place === p.id),
  }));

  const list = places.length
    ? h(
        'ol',
        { class: 'place-list' },
        places.map((p, i) =>
          h(
            'li',
            null,
            h(
              'button',
              { class: `place-btn${pins[i].hint ? ' is-hint' : ''}`, type: 'button', onclick: () => game.showPlace(p.id) },
              h('span', { class: 'place-no' }, String(i + 1)),
              h('span', { class: 'place-name' }, p.name),
              pins[i].visited ? h('small', null, '살펴봄') : null,
            ),
          ),
        ),
      )
    : h('p', { class: 'muted' }, '이 층에는 살펴볼 곳이 없다.');

  return h(
    'section',
    { class: 'explore', 'data-view': 'floor' },
    floorTabs(game, floorId),
    h(
      'div',
      { class: 'explore-grid' },
      h(
        'div',
        { class: 'explore-main' },
        h('header', { class: 'floor-head' }, h('h2', null, floor.name), h('p', null, floor.summary)),
        h('div', { class: 'mapbox' }, floorMap(floor, { pins, onPin: (id) => game.showPlace(id) })),
        hint && hint.floor === floorId ? h('p', { class: 'hint-note' }, '깜빡이는 곳에서 아직 보지 못한 순간을 찾을 수 있을 것 같다.') : null,
      ),
      h('aside', { class: 'side' }, h('section', { class: 'side-box' }, h('h3', null, '탐색 지점'), list), progressBox(game)),
    ),
  );
}

// ---------------------------------------------------------
// 장소 화면
// ---------------------------------------------------------
export function renderPlace(game, placeId) {
  const place = game.placeById.get(placeId);
  const floor = game.floorById.get(place.floor);
  const open = place.lock ? game.lockOpen(place.lock) : true;
  const objects = place.objects.filter((o) => !o.when || (o.when === 'open') === open);
  const spots = objects.map((o) => decorate(game, o));
  const use = (o) => useObject(game, place, o);

  const pic = createPicture({
    key: `${game.theme.id}:place:${place.id}:${open ? 'open' : 'shut'}`,
    src: open && place.imageOpen ? place.imageOpen : place.image,
    art: open && place.artOpen ? place.artOpen : place.art,
    looks: game.looks,
    spots,
    onSpot: use,
  });

  const others = game.theme.places.filter((p) => p.floor === place.floor && p.id !== place.id);
  const view = h(
    'section',
    { class: 'place', 'data-view': 'place' },
    floorTabs(game, place.floor),
    h(
      'div',
      { class: 'explore-grid' },
      h(
        'div',
        { class: 'explore-main' },
        h(
          'header',
          { class: 'place-head' },
          h('button', { class: 'btn', type: 'button', onclick: () => game.showFloor(place.floor) }, '← 안내도'),
          h('h2', null, h('small', null, floor.name), place.name),
        ),
        pic.el,
        h('p', { class: 'place-desc' }, open && place.descOpen ? place.descOpen : place.desc),
      ),
      h(
        'aside',
        { class: 'side' },
        h('section', { class: 'side-box' }, h('h3', null, '살펴볼 것'), h('ul', { class: 'obj-list' }, spots.map((s) => objButton(s, () => use(s))))),
        others.length
          ? h(
              'section',
              { class: 'side-box' },
              h('h3', null, `${floor.name}의 다른 곳`),
              h('ul', { class: 'obj-list' }, others.map((p) => h('li', null, h('button', { class: 'obj', type: 'button', onclick: () => game.showPlace(p.id) }, h('span', { class: 'obj-name' }, p.name))))),
            )
          : null,
        progressBox(game),
      ),
    ),
  );
  view.__destroy = () => pic.destroy();
  return view;
}

// 물건에 표시 글자·부가 설명을 붙인다
function decorate(game, o) {
  const base = { ...o, tag: o.label };
  switch (o.kind) {
    case 'portal': {
      const seen = game.sceneSeen(o.to);
      return { ...base, sub: seen ? '책갈피 · 본 장면' : '책갈피', cls: seen ? '' : 'is-new', aria: `${o.label} — 책갈피 꽂기` };
    }
    case 'lock':
      return { ...base, sub: '키패드', aria: `${o.label} — 비밀번호 입력` };
    case 'gate':
      return { ...base, sub: game.remaining() ? `미퇴실 ${game.remaining()}명` : '퇴실 처리', cls: 'is-gate', aria: `${o.label} — 열기` };
    case 'final':
      return { ...base, kind: game.allConfirmed() ? 'portal' : 'zoom', sub: game.allConfirmed() ? '책갈피' : '살펴보기', cls: game.allConfirmed() ? 'is-new' : '', realKind: 'final', aria: `${o.label} — 살펴보기` };
    default:
      return { ...base, sub: '살펴보기', aria: `${o.label} — 살펴보기` };
  }
}

// 물건을 눌렀을 때
function useObject(game, place, o) {
  const kind = o.realKind || o.kind;
  if (kind === 'portal') {
    bookmarkPrompt(game, o, () => game.playScene(o.to));
  } else if (kind === 'zoom') {
    openZoom(game, o.zoom);
  } else if (kind === 'lock') {
    const lock = game.lockById.get(o.lock);
    openKeypad(lock, {
      onOpen: () => {
        game.openLock(lock.id);
        toast(`${josa(lock.title, '이/가')} 열렸습니다.`);
        game.showPlace(place.id);
      },
    });
  } else if (kind === 'gate') {
    game.openGate();
  } else if (kind === 'final') {
    const book = game.theme.finalBook;
    if (game.allConfirmed()) bookmarkPrompt(game, { ...o, to: game.theme.epilogue, note: book.ready }, () => game.playEpilogue());
    else openZoom(game, { style: 'note', title: book.title, lines: book.locked });
  }
}
