// =========================================================
// ending.js — 엔딩 연출(진엔딩·노멀·배드)
// 엔딩을 보면 첫 화면 카드에 '클리어' 도장과 엔딩 이름이 남는다.
// =========================================================
import { h, sleep } from './util.js';
import { typeText } from './ui.js';
import { sfx } from './sound.js';
import { takeFocus } from './scene.js';

// 엔딩 화면을 띄운다
export async function playEnding(game, ending) {
  const layer = h('div', { class: 'ending-layer', role: 'dialog', 'aria-modal': 'true', 'aria-label': `엔딩 ${ending.name}` });
  const lines = h('div', { class: 'end-lines', 'aria-live': 'polite' });
  const skipNote = h('p', { class: 'bo-hint' }, '클릭하면 빠르게 넘어갑니다');
  layer.append(lines, skipNote);
  document.body.append(layer);
  document.body.classList.add('in-scene');
  takeFocus(layer);

  let fast = false;
  let typing = null;
  layer.addEventListener('click', () => {
    fast = true;
    if (typing) typing.skip();
  });

  for (const text of ending.lines) {
    const p = h('p', { class: 'end-line' });
    lines.append(p);
    typing = typeText(p, game.fill(text), { speed: fast ? 0 : 38 });
    await typing.done;
    if (!fast) await sleep(450);
  }
  skipNote.remove();
  sfx.ending();

  const card = h(
    'div',
    { class: 'end-card' },
    h('p', { class: 'end-kicker' }, `${game.theme.series} · ${game.theme.building} 『${game.theme.title}』`),
    h('h2', { class: 'end-title' }, `「${ending.name}」`),
    h('p', { class: 'stamp end-stamp' }, ending.stamp),
    h('p', { class: 'end-stats' }, `확정 ${game.confirmedCount()}/${game.total} · 발견한 장면 ${game.seenCount()}/${game.sceneTotal}`),
    ending.id !== 'true' ? h('p', { class: 'end-tip' }, '기록부를 다시 맞춰 보면 다른 결말을 볼 수 있다. 진행 상황은 남아 있다.') : null,
    h(
      'div',
      { class: 'end-actions' },
      h('a', { class: 'btn btn--solid', href: game.theme.homeHref }, '첫 화면으로'),
      h(
        'button',
        {
          class: 'btn',
          type: 'button',
          onclick: () => {
            layer.remove();
            document.body.classList.remove('in-scene');
            game.refresh();
          },
        },
        '계속 둘러보기',
      ),
    ),
  );
  layer.append(card);
  card.querySelector('a').focus({ preventScroll: true });
}
