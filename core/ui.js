// =========================================================
// ui.js — 알림(토스트), 창(모달), 확인창, 타자 효과
// =========================================================
import { h, sleep } from './util.js';

// ---------- 알림 ----------
let toastBox = null;

// 화면 아래에 짧은 알림을 띄운다
export function toast(message, ms = 2600) {
  if (!toastBox) {
    toastBox = h('div', { class: 'toasts', role: 'status', 'aria-live': 'polite' });
    document.body.append(toastBox);
  }
  const item = h('div', { class: 'toast' }, message);
  toastBox.append(item);
  setTimeout(() => item.classList.add('is-out'), ms);
  setTimeout(() => item.remove(), ms + 400);
}

// ---------- 창(모달) ----------
const stack = []; // 열린 창 목록(위에 열린 것이 마지막)

// 창을 연다. 반환값의 close()로 닫는다
export function openModal({ content, className = '', label = '', onClose, dismiss = true }) {
  const panel = h('div', { class: `modal ${className}`, role: 'dialog', 'aria-modal': 'true', 'aria-label': label, tabindex: '-1' }, content);
  const back = h('div', { class: 'modal-back' }, panel);
  back.style.zIndex = String(200 + stack.length * 10);
  const lastFocus = document.activeElement;

  const entry = {
    el: panel,
    // 창을 닫고 원래 누르던 버튼으로 초점을 돌려준다
    close() {
      const at = stack.indexOf(entry);
      if (at === -1) return;
      stack.splice(at, 1);
      back.remove();
      if (onClose) onClose();
      if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
    },
    dismiss,
  };
  if (dismiss) {
    back.addEventListener('mousedown', (e) => {
      if (e.target === back) entry.close();
    });
  }
  stack.push(entry);
  document.body.append(back);
  requestAnimationFrame(() => {
    const first = panel.querySelector('[autofocus]') || panel;
    first.focus({ preventScroll: true });
  });
  return entry;
}

// 가장 위에 있는 창이 열려 있는지
export function hasModal() {
  return stack.length > 0;
}

// Esc 키로 가장 위의 창을 닫는다
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape' || !stack.length) return;
  const top = stack[stack.length - 1];
  if (top.dismiss) {
    e.preventDefault();
    e.stopImmediatePropagation();
    top.close();
  }
});

// 예/아니오 확인창. 결과를 Promise<boolean>으로 돌려준다
export function confirmBox(message, { ok = '확인', cancel = '취소', title = '' } = {}) {
  return new Promise((resolve) => {
    let answered = false;
    const finish = (value) => {
      if (answered) return;
      answered = true;
      modal.close();
      resolve(value);
    };
    const body = h(
      'div',
      { class: 'confirm' },
      title ? h('h2', { class: 'confirm-title' }, title) : null,
      h('p', { class: 'confirm-text' }, message),
      h(
        'div',
        { class: 'confirm-actions' },
        h('button', { class: 'btn', type: 'button', onclick: () => finish(false) }, cancel),
        h('button', { class: 'btn btn--solid', type: 'button', autofocus: true, onclick: () => finish(true) }, ok),
      ),
    );
    const modal = openModal({ content: body, className: 'modal--small', label: title || message, onClose: () => finish(false) });
  });
}

// ---------- 타자 효과 ----------
// 글자를 한 글자씩 보여 준다. skip()을 부르면 바로 끝까지 보인다
export function typeText(el, text, { speed = 32, onChar } = {}) {
  let skipped = false;
  const done = (async () => {
    el.textContent = '';
    for (let i = 0; i < text.length; i++) {
      if (skipped) break;
      el.textContent = text.slice(0, i + 1);
      if (onChar && text[i] !== ' ') onChar(text[i]);
      await sleep(speed);
    }
    el.textContent = text;
  })();
  return {
    done,
    // 남은 글자를 한 번에 보여 준다
    skip() {
      skipped = true;
    },
  };
}
