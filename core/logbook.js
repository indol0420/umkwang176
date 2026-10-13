// =========================================================
// logbook.js — 이용자 기록부(오브라 딘의 항해일지에 해당)
//  명부 탭 : 이름 / 신분 / 학과·소속 / 출신 / 배정 좌석(일부 훼손)
//  사진 탭 : IC 게이트 CCTV 얼굴. 사진마다 이름·경위·원인 입력
//  장면 탭 : 발견한 장면을 시간순으로, 다시 보기
//  안내도 탭: 장면을 발견한 위치를 층별 지도에 표시
// =========================================================
import { h, replace } from './util.js';
import { openModal } from './ui.js';
import { faceCanvas } from './render.js';
import { floorMap } from './map.js';
import { josa } from './korean.js';
import { sfx } from './sound.js';

const TABS = [
  { id: 'roster', label: '명부' },
  { id: 'photos', label: '사진' },
  { id: 'scenes', label: '장면' },
  { id: 'map', label: '안내도' },
];

let current = null; // 열려 있는 기록부(두 번 열지 않는다)

// 기록부를 연다. photo를 주면 그 사진 페이지가 바로 열린다
export function openLogbook(game, { tab = 'photos', photo = null } = {}) {
  if (current) {
    current.go({ tab, photo });
    return current;
  }
  let view = { tab, photo, floor: null };
  let modal = null;
  const body = h('div', { class: 'ledger-body' });
  const summary = h('p', { class: 'ledger-summary', 'aria-live': 'polite' });
  const tabButtons = TABS.map((t) =>
    h('button', { class: 'ledger-tab', type: 'button', role: 'tab', 'data-tab': t.id, onclick: () => go({ tab: t.id, photo: null }) }, t.label),
  );
  const panel = h(
    'div',
    { class: 'ledger on-paper' },
    h(
      'header',
      { class: 'ledger-head' },
      h('div', null, h('p', { class: 'ledger-kicker' }, `${game.theme.building} · 그날 밤의 기록`), h('h2', { class: 'ledger-title' }, '이용자 기록부')),
      summary,
      h('button', { class: 'btn btn--icon', type: 'button', 'aria-label': '기록부 닫기', onclick: () => modal.close() }, '✕'),
    ),
    h('div', { class: 'ledger-tabs', role: 'tablist' }, tabButtons),
    body,
  );

  // 확정이 일어나면 현재 페이지를 다시 그린다(도장 표시)
  const off = game.on((type) => {
    renderSummary();
    if (type === 'confirm') render();
  });
  modal = openModal({
    content: panel,
    className: 'modal--ledger',
    label: '이용자 기록부',
    onClose: () => {
      off();
      current = null;
    },
  });
  sfx.next();

  // 머리글의 '확정·기록·장면' 요약
  function renderSummary() {
    summary.textContent = `확정 ${game.confirmedCount()}/${game.total} · 기록 ${game.filledCount()}/${game.total} · 장면 ${game.seenCount()}/${game.sceneTotal}`;
  }

  // 탭에 맞는 페이지를 그린다
  function render() {
    tabButtons.forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === view.tab)));
    renderSummary();
    let page;
    if (view.tab === 'roster') page = rosterPage(game, go);
    else if (view.tab === 'scenes') page = scenesPage(game, go, () => modal.close());
    else if (view.tab === 'map') page = mapPage(game, view, go);
    else if (view.photo) page = personPage(game, view.photo, go, () => modal.close());
    else page = photosPage(game, go);
    replace(body, page);
  }

  // 다른 탭·페이지로 이동
  function go(next) {
    view = { ...view, ...next };
    render();
    body.scrollTop = 0;
  }

  render();
  current = { go, close: () => modal.close() };
  return current;
}

// ---------------------------------------------------------
// 명부 탭
// ---------------------------------------------------------
function rosterPage(game, go) {
  const rows = game.namesSorted.map((name) => {
    const person = game.personByName.get(name);
    const photos = game.photosWithName(name);
    const done = photos.some((ph) => game.isConfirmed(ph));
    return h(
      'tr',
      { class: done ? 'is-confirmed' : null },
      h('th', { scope: 'row' }, h('span', { class: 'roster-name' }, name), person.original ? h('small', { class: 'roster-original' }, person.original) : null),
      h('td', null, person.role),
      h('td', null, person.dept),
      h('td', null, person.from),
      person.seat === null ? h('td', { class: 'damaged' }, h('span', { class: 'sr-only' }, '훼손됨')) : h('td', null, person.seat),
      h(
        'td',
        { class: 'roster-link' },
        photos.length ? photos.map((ph) => h('button', { class: 'chip', type: 'button', onclick: () => go({ tab: 'photos', photo: ph }) }, `사진 #${ph}`)) : h('span', { class: 'muted' }, '—'),
        done ? h('span', { class: 'stamp stamp--tiny' }, '퇴실') : null,
      ),
    );
  });
  return h(
    'div',
    null,
    h('p', { class: 'ledger-note' }, '그날 밤 IC 게이트에 남은 미퇴실 이용자 명단(가나다순). 일부 좌석 기록은 훼손되어 읽을 수 없다.'),
    h(
      'div',
      { class: 'table-scroll' },
      h(
        'table',
        { class: 'roster' },
        h('thead', null, h('tr', null, ['이름', '신분', '학과·소속', '출신', '배정 좌석', '내 기록'].map((t) => h('th', { scope: 'col' }, t)))),
        h('tbody', null, rows),
      ),
    ),
  );
}

// ---------------------------------------------------------
// 사진 탭(목록)
// ---------------------------------------------------------
function photosPage(game, go) {
  const grid = h('div', { class: 'faces' });
  for (const person of game.theme.people) {
    const guess = game.guessOf(person.photo);
    const done = game.isConfirmed(person.photo);
    const seen = game.scenesWith(person.photo).length;
    const pic = h('div', { class: 'face-pic' });
    faceCanvas(game.theme, person).then((c) => pic.append(c));
    grid.append(
      h(
        'button',
        { class: `face-card${done ? ' is-confirmed' : ''}`, type: 'button', onclick: () => go({ photo: person.photo }) },
        pic,
        h('p', { class: 'face-no' }, `사진 #${person.photo} · 입실 ${person.time}`),
        h('p', { class: 'face-name' }, guess.name || '이름 미기록'),
        h('p', { class: 'face-fate' }, guess.fate || (seen ? `장면 ${seen}곳에 등장` : '아직 장면에서 보지 못함')),
        done ? h('span', { class: 'stamp face-stamp' }, '퇴실') : null,
      ),
    );
  }
  return h('div', null, h('p', { class: 'ledger-note' }, 'IC 게이트 CCTV 캡처(입실 순서). 사진을 눌러 이름과 운명을 기록하세요.'), grid);
}

// ---------------------------------------------------------
// 사진 한 장(운명 입력)
// ---------------------------------------------------------
function personPage(game, photo, go, closeBook) {
  const person = game.personByPhoto.get(photo);
  const guess = { ...game.guessOf(photo) };
  const locked = game.isConfirmed(photo);
  const order = game.theme.people.map((p) => p.photo);
  const at = order.indexOf(photo);
  const sentence = h('p', { class: 'fate-sentence', 'aria-live': 'polite' });

  // "[이름]은(는) [경위]. (원인: [원인])" 문장을 다시 쓴다
  const writeSentence = () => {
    const blank = (t) => h('span', { class: 'blank' }, t);
    replace(
      sentence,
      guess.name ? josa(guess.name, '은/는') : blank('＿＿＿은(는)'),
      ' ',
      guess.fate || blank('＿＿＿'),
      '. (원인: ',
      guess.cause || blank('＿＿＿'),
      ')',
    );
  };

  // 선택 상자 하나
  const field = (key, label, options) => {
    const id = `f-${key}-${photo}`;
    const select = h('select', { id, disabled: locked, class: 'fate-select' }, h('option', { value: '' }, '— 선택 —'));
    for (const opt of options) {
      if (opt.group) {
        const group = h('optgroup', { label: opt.group });
        for (const it of opt.items) group.append(h('option', { value: it.value }, it.text));
        select.append(group);
      } else {
        select.append(h('option', { value: opt.value }, opt.text));
      }
    }
    select.value = guess[key] || '';
    select.addEventListener('change', () => {
      guess[key] = select.value;
      writeSentence();
      game.setGuess(photo, key, select.value);
    });
    return h('div', { class: 'field' }, h('label', { for: id }, label), select);
  };

  // 다른 사진에 이미 적은 이름은 표시해 준다
  const nameOptions = game.namesSorted.map((name) => {
    const used = game.photosWithName(name).filter((ph) => ph !== photo);
    return { value: name, text: used.length ? `${name} — 사진 #${used.join(', #')}에 기록함` : name };
  });
  const causeOptions = [
    { group: '인물', items: game.namesSorted.map((n) => ({ value: n, text: n })) },
    { group: '현상', items: game.theme.phenomena.map((n) => ({ value: n, text: n })) },
  ];

  const face = h('div', { class: 'person-face' });
  faceCanvas(game.theme, person, 144).then((c) => face.append(c));

  const scenes = game.scenesWith(photo);
  const sceneList = scenes.length
    ? h(
        'ul',
        { class: 'person-scenes' },
        scenes.map((s) =>
          h(
            'li',
            null,
            h('span', null, h('b', null, s.time), ` · ${s.where}`),
            h('button', { class: 'btn', type: 'button', onclick: () => { closeBook(); game.playScene(s.id); } }, '다시 보기'),
          ),
        ),
      )
    : h('p', { class: 'muted' }, '아직 이 사람이 나온 장면을 찾지 못했다.');

  writeSentence();
  return h(
    'div',
    { class: 'person' },
    h(
      'div',
      { class: 'person-nav' },
      h('button', { class: 'btn', type: 'button', onclick: () => go({ photo: null }) }, '← 사진 목록'),
      h(
        'div',
        { class: 'person-step' },
        h('button', { class: 'btn', type: 'button', disabled: at <= 0, onclick: () => go({ photo: order[at - 1] }) }, '◀ 이전'),
        h('button', { class: 'btn', type: 'button', disabled: at >= order.length - 1, onclick: () => go({ photo: order[at + 1] }) }, '다음 ▶'),
      ),
    ),
    h(
      'div',
      { class: 'person-grid' },
      h(
        'figure',
        { class: 'person-figure' },
        face,
        h('figcaption', null, h('b', null, `사진 #${photo}`), ` · 입실 ${person.time}`, h('br'), h('small', null, person.desc)),
        locked ? h('span', { class: 'stamp person-stamp' }, '퇴실 처리됨') : null,
      ),
      h(
        'div',
        { class: 'person-form' },
        field('name', '이름', nameOptions),
        field('fate', '경위', game.theme.fates.map((f) => ({ value: f, text: f }))),
        field('cause', '원인', causeOptions),
        h('p', { class: 'cause-guide' }, game.theme.causeGuide),
        sentence,
        h(
          'p',
          { class: 'person-status' },
          locked ? '확정된 기록이다. 게이트가 이 사람을 퇴실 처리했다.' : '확정 전에는 맞았는지 알려 주지 않는다. 맞는 기록이 3명 모이면 함께 확정된다.',
        ),
        h('h3', { class: 'person-sub' }, '등장한 장면'),
        sceneList,
      ),
    ),
  );
}

// ---------------------------------------------------------
// 장면 탭
// ---------------------------------------------------------
function scenesPage(game, go, closeBook) {
  const seen = game.seenScenesSorted();
  const missing = game.sceneTotal - game.seenCount();
  const nameOf = (ph) => game.guessOf(ph).name;
  const items = seen.map((s) =>
    h(
      'li',
      { class: 'scene-item' },
      h('p', { class: 'scene-when' }, h('b', null, s.time), h('span', null, s.where)),
      h(
        'p',
        { class: 'scene-who' },
        s.people.length
          ? s.people.map((ph) => h('button', { class: 'chip', type: 'button', onclick: () => go({ tab: 'photos', photo: ph }) }, `#${ph}${nameOf(ph) ? ` ${nameOf(ph)}` : ''}`))
          : h('span', { class: 'muted' }, '85-0001'),
      ),
      h('button', { class: 'btn', type: 'button', onclick: () => { closeBook(); game.playScene(s.id); } }, '다시 보기'),
    ),
  );
  return h(
    'div',
    null,
    h('p', { class: 'ledger-note' }, '발견한 장면을 시간순으로 정리했다. 언제든 다시 볼 수 있다.'),
    seen.length ? h('ol', { class: 'scene-list' }, items) : h('p', { class: 'muted' }, '아직 발견한 장면이 없다. 남겨진 물건에 책갈피를 꽂아 보자.'),
    missing > 0 ? h('p', { class: 'scene-missing' }, `아직 찾지 못한 장면 ${missing}개`) : h('p', { class: 'scene-missing' }, '모든 장면을 찾았다.'),
  );
}

// ---------------------------------------------------------
// 안내도 탭
// ---------------------------------------------------------
function mapPage(game, view, go) {
  const floorId = view.floor || game.state.floor || game.theme.startFloor;
  const floor = game.floorById.get(floorId);
  const hint = game.hintTarget();
  const marks = game.theme.scenes
    .filter((s) => !s.epilogue && s.floor === floorId && game.sceneSeen(s.id))
    .map((s) => ({ x: s.map.x, y: s.map.y, label: s.time }));
  if (hint && hint.place) {
    const p = game.placeById.get(hint.place);
    if (p.floor === floorId) marks.push({ x: p.map.x, y: p.map.y, label: '?', hint: true, unknown: true });
  }
  const count = (fid) => game.theme.scenes.filter((s) => !s.epilogue && s.floor === fid && game.sceneSeen(s.id)).length;
  const tabs = h(
    'div',
    { class: 'map-floors' },
    game.theme.floors.map((f) =>
      h(
        'button',
        { class: `chip${hint && hint.floor === f.id ? ' is-hint' : ''}`, type: 'button', 'aria-pressed': String(f.id === floorId), onclick: () => go({ floor: f.id }) },
        f.label,
        count(f.id) ? ` ◆${count(f.id)}` : '',
      ),
    ),
  );
  return h(
    'div',
    { class: 'ledger-map' },
    h('p', { class: 'ledger-note' }, '◆ 장면을 발견한 위치. 숫자는 그 순간의 시각이다.'),
    tabs,
    h('div', { class: 'mapbox mapbox--paper' }, floorMap(floor, { marks })),
  );
}

// ---------------------------------------------------------
// 3명 규칙 확정 알림
// ---------------------------------------------------------
export function showConfirmation(game, batches) {
  sfx.confirm();
  const photos = batches.flat();
  const before = game.remaining() + photos.length;
  let modal = null;
  const list = h(
    'ul',
    { class: 'confirm-list' },
    photos.map((ph) => {
      const g = game.guessOf(ph);
      return h('li', null, h('b', null, `사진 #${ph}`), ` ${josa(g.name, '은/는')} ${g.fate}.`);
    }),
  );
  const content = h(
    'div',
    { class: 'confirmed' },
    h('p', { class: 'confirmed-kicker' }, 'IC 게이트 · 기록 확인'),
    h('p', { class: 'stamp confirmed-stamp' }, `퇴실 처리 ${photos.length}명`),
    list,
    h('p', { class: 'confirmed-count' }, `미퇴실 ${before}명 → ${game.remaining()}명`),
    h('button', { class: 'btn btn--solid', type: 'button', autofocus: true, onclick: () => modal.close() }, '확인'),
  );
  modal = openModal({ content, className: 'modal--confirmed', label: '기록 확정' });
}
