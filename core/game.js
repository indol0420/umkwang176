// =========================================================
// game.js — 테마 하나를 실행하는 본체
// 테마 폴더의 index.html이 startGame(theme)을 부르면 시작한다.
//  상태(저장) · 화면 전환 · 3명 규칙 · 자물쇠 · 힌트 · 엔딩을 관리한다
// =========================================================
import { h, replace, isDev } from './util.js';
import { loadSave, writeSave, clearSave, getSetting, setSetting } from './storage.js';
import { toast, openModal, confirmBox } from './ui.js';
import { isMuted, setMuted } from './sound.js';
import { applyThreeRule, isFilled, pickEnding, endingRank } from './fate.js';
import { renderFloor, renderPlace } from './explore.js';
import { playScene, blackout } from './scene.js';
import { openLogbook, showConfirmation } from './logbook.js';
import { openKeypad } from './lock.js';
import { openGate } from './gate.js';
import { playEnding } from './ending.js';
import { checkTheme } from './check.js';
import { josa } from './korean.js';

const SAVE_VERSION = 1;
const sortKo = (a, b) => a.localeCompare(b, 'ko');

// 테마 시작
export async function startGame(theme) {
  await loadFonts();
  const game = new Game(theme);
  game.mount(document.getElementById('app'));
  if (isDev()) window.game = game; // 개발 모드: 콘솔에서 game.state 확인
  return game;
}

// 픽셀 글꼴을 먼저 불러온다(캔버스에 쓰는 글자가 깨지지 않게)
async function loadFonts() {
  if (!document.fonts) return;
  try {
    await Promise.all(['12px Galmuri11', '700 12px Galmuri11', '15px Galmuri14'].map((f) => document.fonts.load(f)));
  } catch {
    /* 글꼴이 없어도 게임은 진행된다 */
  }
}

// 게임 하나(테마 하나)의 상태와 화면을 관리하는 객체
class Game {
  // 테마 data를 찾기 쉽게 정리하고 저장된 진행 상황을 불러온다
  constructor(theme) {
    this.theme = theme;
    this.listeners = new Set();
    this.personByPhoto = new Map(theme.people.map((p) => [p.photo, p]));
    this.personByName = new Map(theme.people.map((p) => [p.name, p]));
    this.sceneById = new Map(theme.scenes.map((s) => [s.id, s]));
    this.placeById = new Map(theme.places.map((p) => [p.id, p]));
    this.lockById = new Map(theme.locks.map((l) => [l.id, l]));
    this.floorById = new Map(theme.floors.map((f) => [f.id, f]));
    this.namesSorted = theme.people.map((p) => p.name).sort(sortKo);
    this.looks = { ...(theme.extraLooks || {}) };
    for (const p of theme.people) this.looks[p.photo] = p.look;
    this.total = theme.people.length;
    this.sceneTotal = theme.scenes.filter((s) => !s.epilogue).length;
    this.state = this.loadState();
    this.view = null;
    this.hintKey = '';
    if (isDev()) checkTheme(theme);
  }

  // ---------------------------------------------------------
  // 저장
  // ---------------------------------------------------------

  // 처음 시작할 때의 상태
  freshState() {
    return {
      v: SAVE_VERSION,
      name: '', // 주인공(플레이어) 이름
      introDone: false,
      floor: this.theme.startFloor,
      place: null,
      locks: {}, // 열린 자물쇠
      scenes: {}, // 발견한 장면: id → 발견 시각
      visited: {}, // 살펴본 장소
      guesses: {}, // 사진 번호 → { name, fate, cause }
      confirmed: [], // 확정된 사진 번호(확정 순서)
      lastFind: Date.now(), // 마지막으로 새 장면을 발견한 시각(힌트용)
      tips: {},
      ending: null, // 마지막으로 본 엔딩
      best: null, // 가장 좋은 엔딩(첫 화면 도장)
    };
  }

  // 저장된 상태 불러오기(형식이 다르면 새로 시작)
  loadState() {
    const saved = loadSave(this.theme.id);
    if (!saved || saved.v !== SAVE_VERSION) return this.freshState();
    return { ...this.freshState(), ...saved };
  }

  // 저장하고 화면들에 알린다
  save(type = 'change') {
    writeSave(this.theme.id, this.state);
    this.emit(type);
  }

  // 상태가 바뀔 때 부를 함수 등록(반환값을 부르면 해제)
  on(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  // 등록된 화면들에 변경을 알린다(type: 'change' | 'confirm')
  emit(type) {
    for (const fn of [...this.listeners]) fn(type);
  }

  // ---------------------------------------------------------
  // 상태 읽기
  // ---------------------------------------------------------
  // 확정된 인원
  confirmedCount() {
    return this.state.confirmed.length;
  }
  // 아직 퇴실 처리되지 않은 인원(IC 게이트 카운터)
  remaining() {
    return this.total - this.confirmedCount();
  }
  // 전원 확정되었는지
  allConfirmed() {
    return this.remaining() === 0;
  }
  // 이 사진의 인물이 확정되었는지
  isConfirmed(photo) {
    return this.state.confirmed.includes(photo);
  }
  // 이 사진에 플레이어가 적은 기록 { name, fate, cause }
  guessOf(photo) {
    return this.state.guesses[photo] || {};
  }
  // 이름·경위·원인을 모두 적은 사진 수
  filledCount() {
    return this.theme.people.filter((p) => isFilled(this.guessOf(p.photo))).length;
  }
  // 이 이름을 적은 사진 번호들(명부 탭의 '내 기록')
  photosWithName(name) {
    return this.theme.people.filter((p) => this.guessOf(p.photo).name === name).map((p) => p.photo);
  }
  // 이 장면을 봤는지
  sceneSeen(id) {
    return Boolean(this.state.scenes[id]);
  }
  // 발견한 장면 수(에필로그 제외)
  seenCount() {
    return this.theme.scenes.filter((s) => !s.epilogue && this.sceneSeen(s.id)).length;
  }
  // 발견한 장면을 그날 밤 시간순으로
  seenScenesSorted() {
    return this.theme.scenes.filter((s) => this.sceneSeen(s.id)).sort((a, b) => a.sort - b.sort);
  }
  // 이 사진의 인물이 나온 장면(발견한 것만)
  scenesWith(photo) {
    return this.seenScenesSorted().filter((s) => s.people.includes(photo));
  }
  // 자물쇠가 열렸는지
  lockOpen(id) {
    return Boolean(this.state.locks[id]);
  }
  // 층에 들어갈 수 있는지(층 자물쇠가 없거나 열렸으면)
  floorOpen(id) {
    const floor = this.floorById.get(id);
    return Boolean(floor) && (!floor.lock || this.lockOpen(floor.lock));
  }
  // 막힘 방지 힌트 설정(도움말에서 끌 수 있다)
  hintsOn() {
    return getSetting('hints', true);
  }

  // 글자 속 {name}, {remain}, {confirmed}를 실제 값으로 바꾼다
  fill(text) {
    return String(text)
      .replaceAll('{name}', this.state.name || this.theme.cover.defaultName)
      .replaceAll('{remain}', String(this.remaining()))
      .replaceAll('{confirmed}', String(this.confirmedCount()));
  }

  // 막힘 방지: 오랫동안 새 장면이 없으면 아직 안 본 장면의 위치를 알려 준다
  hintTarget() {
    if (!this.hintsOn() || !this.state.introDone) return null;
    if (Date.now() - this.state.lastFind < this.theme.hintAfter) return null;
    const next = this.theme.scenes.filter((s) => !s.epilogue && !this.sceneSeen(s.id)).sort((a, b) => a.no - b.no)[0];
    if (!next) return null;
    for (const placeId of next.entry || []) {
      const place = this.placeById.get(placeId);
      if (place && this.floorOpen(place.floor)) return { place: placeId, floor: place.floor, scene: next.id };
    }
    const place = this.placeById.get((next.entry || [])[0]);
    return place ? { place: null, floor: place.floor, scene: next.id } : null;
  }

  // ---------------------------------------------------------
  // 상태 바꾸기
  // ---------------------------------------------------------

  // 운명 입력 → 3명 규칙 확인 → 확정되면 알림
  setGuess(photo, key, value) {
    if (this.isConfirmed(photo)) return [];
    this.state.guesses[photo] = { ...this.guessOf(photo), [key]: value };
    const batches = applyThreeRule(this.theme.people, this.state.guesses, this.state.confirmed);
    for (const batch of batches) this.state.confirmed.push(...batch);
    this.save(batches.length ? 'confirm' : 'change');
    if (batches.length) showConfirmation(this, batches);
    return batches;
  }

  // 장면을 처음 보면 기록한다(처음이면 true)
  markScene(id) {
    if (this.sceneSeen(id)) return false;
    this.state.scenes[id] = Date.now();
    if (!this.sceneById.get(id).epilogue) this.state.lastFind = Date.now();
    this.save();
    return true;
  }

  // 자물쇠 열기
  openLock(id) {
    this.state.locks[id] = true;
    this.state.lastFind = Math.max(this.state.lastFind, Date.now() - this.theme.hintAfter / 2); // 새 구역이 열리면 힌트 시계를 조금 늦춘다
    this.save();
  }

  // 엔딩 기록(첫 화면 카드의 도장)
  recordEnding(ending) {
    this.state.ending = { id: ending.id, name: ending.name };
    const endings = this.theme.endings;
    if (!this.state.best || endingRank(endings, ending.id) < endingRank(endings, this.state.best.id)) {
      this.state.best = { id: ending.id, name: ending.name };
    }
    this.save();
  }

  // ---------------------------------------------------------
  // 화면
  // ---------------------------------------------------------

  // 게임 화면 틀(상단 막대 + 무대)을 만들고 저장된 곳에서 시작한다
  mount(root) {
    this.topbar = h('header', { class: 'topbar' });
    this.stage = h('main', { class: 'stage', id: 'stage' });
    replace(root, h('div', { class: 'game' }, this.topbar, this.stage));
    this.renderTopbar();
    this.on(() => this.updateTopbar());
    setInterval(() => this.checkHint(), 15000);

    if (!this.state.name) this.showCover();
    else if (!this.state.introDone) this.playIntro();
    else if (this.state.place && this.placeById.has(this.state.place)) this.showPlace(this.state.place);
    else this.showFloor(this.state.floor || this.theme.startFloor);
  }

  // 무대의 화면을 바꾼다(이전 화면의 애니메이션 정리)
  setView(el) {
    if (this.view && this.view.__destroy) this.view.__destroy();
    this.view = el;
    replace(this.stage, el);
    window.scrollTo(0, 0);
  }

  // 지금 화면을 다시 그린다
  refresh() {
    if (!this.state.introDone) return;
    if (this.state.place) this.setView(renderPlace(this, this.state.place));
    else this.setView(renderFloor(this, this.state.floor));
  }

  // 층 화면
  showFloor(id) {
    if (!this.floorOpen(id)) {
      this.tryFloor(id);
      return;
    }
    this.state.floor = id;
    this.state.place = null;
    this.save();
    this.setView(renderFloor(this, id));
  }

  // 장소 화면
  showPlace(id) {
    const place = this.placeById.get(id);
    this.state.floor = place.floor;
    this.state.place = id;
    this.state.visited[id] = true;
    this.save();
    this.setView(renderPlace(this, id));
  }

  // 층 버튼: 잠겨 있으면 키패드를 연다
  tryFloor(id) {
    if (this.floorOpen(id)) {
      this.showFloor(id);
      return;
    }
    const floor = this.floorById.get(id);
    const from = floor.from && this.floorById.get(floor.from);
    if (from && !this.floorOpen(from.id)) {
      toast(`${josa(floor.name, '은/는')} ${from.name} 계단으로만 올라갈 수 있습니다. ${josa(from.name, '을/를')} 먼저 여세요.`);
      return;
    }
    const lock = this.lockById.get(floor.lock);
    openKeypad(lock, {
      onOpen: () => {
        this.openLock(lock.id);
        toast(`${josa(lock.title, '이/가')} 열렸습니다 — ${lock.opens}`);
        this.showFloor(id);
      },
    });
  }

  // 장면 재생(현재 시점에서)
  playScene(id) {
    return playScene(this, id, { onExit: () => this.afterScene() });
  }

  // 진엔딩 에필로그 → 엔딩
  playEpilogue() {
    return playScene(this, this.theme.epilogue, { onExit: () => this.ending(), exitLabel: '게이트가 열린다 →' });
  }

  // 장면을 닫은 뒤: 화면을 새로 그리고, 처음이면 기록부 안내
  afterScene() {
    this.refresh();
    if (!this.state.tips.logbook && this.seenCount() >= 1) {
      this.state.tips.logbook = true;
      this.save();
      toast('장면 속 인물을 누르면 기록부의 사진이 열립니다. 사진마다 이름·경위·원인을 기록하세요.', 5600);
    }
  }

  // 기록부 열기
  openLogbook(opts) {
    return openLogbook(this, opts);
  }

  // IC 게이트 화면 열기
  openGate() {
    return openGate(this);
  }

  // 게이트에서 퇴실 처리: 10명 모두 확정이면 에필로그, 아니면 바로 엔딩
  finish() {
    if (this.allConfirmed()) this.playEpilogue();
    else this.ending();
  }

  // 확정 인원에 맞는 엔딩
  ending() {
    const ending = pickEnding(this.theme.endings, this.confirmedCount());
    this.recordEnding(ending);
    playEnding(this, ending);
  }

  // 표지: 주인공 이름 입력
  showCover() {
    const c = this.theme.cover;
    const input = h('input', { id: 'player-name', class: 'name-input', maxlength: '12', placeholder: c.namePlaceholder, autocomplete: 'off', spellcheck: 'false' });
    const form = h(
      'form',
      {
        class: 'cover-form',
        onsubmit: (e) => {
          e.preventDefault();
          this.state.name = input.value.trim() || c.defaultName;
          this.save();
          this.playIntro();
        },
      },
      h('label', { for: 'player-name' }, c.nameLabel),
      h('div', { class: 'cover-row' }, input, h('button', { class: 'btn btn--solid', type: 'submit' }, c.start)),
    );
    this.setView(
      h(
        'section',
        { class: 'cover' },
        h('p', { class: 'cover-kicker' }, c.kicker),
        h('h1', { class: 'cover-title' }, `『${this.theme.title}』`),
        h('p', { class: 'cover-lead' }, c.lead),
        form,
        h('p', { class: 'cover-meta' }, c.meta),
      ),
    );
    input.focus();
  }

  // 오프닝 암전 대사
  async playIntro() {
    this.setView(h('div', { class: 'stage-blank' }));
    await blackout(this, this.theme.intro, { label: '오프닝' });
    this.state.introDone = true;
    this.state.lastFind = Date.now();
    this.save();
    this.showPlace(this.theme.startPlace);
    toast(this.theme.firstTip, 4600);
  }

  // 상단 막대: 첫 화면 / 제목 / 미퇴실 카운터 / 기록부 / 도움말 / 소리 / 처음부터
  renderTopbar() {
    const t = this.theme;
    this.counterNum = h('b', { class: 'counter-num' }, String(this.remaining()));
    this.soundBtn = h('button', { class: 'btn', type: 'button', onclick: () => this.toggleSound() });
    replace(
      this.topbar,
      h('a', { class: 'btn', href: t.homeHref }, '← 첫 화면'),
      h('p', { class: 'tb-title' }, h('span', { class: 'tb-series' }, t.series), h('b', null, `${t.building} 『${t.title}』`)),
      h('div', { class: 'counter', role: 'status', title: '운명이 확정될 때마다 줄어듭니다' }, h('span', { class: 'counter-label' }, t.counterLabel), this.counterNum),
      h('div', { class: 'tb-actions' },
        h('button', { class: 'btn', type: 'button', onclick: () => this.openLogbook() }, '기록부'),
        h('button', { class: 'btn btn--icon', type: 'button', 'aria-label': '도움말', onclick: () => this.openHelp() }, '?'),
        this.soundBtn,
        h('button', { class: 'btn', type: 'button', onclick: () => this.reset() }, '처음부터 다시 하기'),
      ),
    );
    this.updateTopbar();
  }

  // 카운터·소리 버튼 글자 갱신(숫자가 줄면 깜빡인다)
  updateTopbar() {
    const value = String(this.remaining());
    if (this.counterNum.textContent !== value) {
      this.counterNum.textContent = value;
      this.counterNum.classList.remove('is-flash');
      void this.counterNum.offsetWidth;
      this.counterNum.classList.add('is-flash');
    }
    const muted = isMuted();
    this.soundBtn.textContent = muted ? '소리 꺼짐' : '소리 켜짐';
    this.soundBtn.setAttribute('aria-pressed', String(!muted));
  }

  // 소리 켜기/끄기
  toggleSound() {
    setMuted(!isMuted());
    this.updateTopbar();
  }

  // 15초마다: 힌트 대상이 바뀌었으면 화면을 다시 그린다
  checkHint() {
    const t = this.hintTarget();
    const key = t ? `${t.floor}:${t.place}` : '';
    if (key === this.hintKey) return;
    this.hintKey = key;
    if (!document.querySelector('.scene-layer, .modal-back')) this.refresh();
  }

  // 도움말(게임 방법 + 힌트·소리 설정)
  openHelp() {
    let modal = null;
    const hints = h('input', {
      type: 'checkbox',
      checked: this.hintsOn(),
      onchange: (e) => {
        setSetting('hints', e.target.checked);
        this.refresh();
      },
    });
    const sound = h('input', {
      type: 'checkbox',
      checked: !isMuted(),
      onchange: (e) => {
        setMuted(!e.target.checked);
        this.updateTopbar();
      },
    });
    const content = h(
      'div',
      { class: 'help' },
      h('header', { class: 'zoom-head' }, h('h2', { class: 'zoom-title' }, '게임 방법'), h('button', { class: 'btn btn--icon', type: 'button', 'aria-label': '닫기', onclick: () => modal.close() }, '✕')),
      h('dl', { class: 'help-list' }, this.theme.help.map(([k, v]) => [h('dt', null, k), h('dd', null, v)])),
      h(
        'div',
        { class: 'help-options' },
        h('label', { class: 'check' }, hints, h('span', null, '막힘 방지 힌트 — 5분 동안 새 장면이 없으면 안내도에서 아직 안 본 장면의 위치가 깜빡입니다')),
        h('label', { class: 'check' }, sound, h('span', null, '효과음')),
      ),
      h('p', { class: 'help-foot' }, '진행 상황은 이 브라우저에 자동으로 저장됩니다.'),
    );
    modal = openModal({ content, className: 'modal--help', label: '게임 방법' });
  }

  // 처음부터 다시 하기(이 테마 기록만 삭제)
  async reset() {
    const ok = await confirmBox(`${this.theme.building} 편의 기록을 모두 지우고 처음부터 다시 시작할까요?\n다른 건물의 기록은 그대로 남습니다.`, {
      ok: '기록 지우기',
      title: '처음부터 다시 하기',
    });
    if (!ok) return;
    clearSave(this.theme.id);
    location.reload();
  }
}
