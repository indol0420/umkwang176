// =========================================================
// lock.js — 숫자 자물쇠 키패드(1985년 시스템의 '기록 확인 질문')
// =========================================================
import { h } from './util.js';
import { openModal } from './ui.js';
import { sfx } from './sound.js';

// 키패드 창을 연다. 비밀번호가 맞으면 onOpen()을 부른다
export function openKeypad(lock, { onOpen } = {}) {
  const size = lock.code.length;
  let value = '';
  let busy = false;
  let modal = null;

  const cells = Array.from({ length: size }, () => h('span', { class: 'kp-cell' }, '_'));
  const msg = h('p', { class: 'kp-msg', role: 'status', 'aria-live': 'polite' }, '숫자 4자리를 입력하십시오.');

  // 입력한 숫자를 칸에 보여 준다
  const render = () =>
    cells.forEach((cell, i) => {
      cell.textContent = value[i] ?? '_';
      cell.classList.toggle('is-on', i < value.length);
    });

  // 숫자 하나 입력
  const press = (digit) => {
    if (busy || value.length >= size) return;
    value += digit;
    sfx.key();
    render();
    if (value.length === size) setTimeout(check, 200);
  };

  // 한 글자 지우기
  const erase = () => {
    if (busy) return;
    value = value.slice(0, -1);
    render();
  };

  // 비밀번호 확인
  const check = () => {
    if (busy || value.length !== size) return;
    if (value === lock.code) {
      busy = true;
      sfx.unlock();
      msg.textContent = '기록 확인. 출입문이 열립니다.';
      panel.classList.add('is-open');
      setTimeout(() => {
        modal.close();
        if (onOpen) onOpen();
      }, 700);
    } else {
      sfx.error();
      msg.textContent = '기록 불일치. 다시 입력하십시오.';
      panel.classList.remove('is-wrong');
      void panel.offsetWidth; // 흔들림 애니메이션 다시 시작
      panel.classList.add('is-wrong');
      value = '';
      setTimeout(render, 250);
    }
  };

  const keyButton = (label) => {
    const action = label === '←' ? erase : label === '확인' ? check : () => press(label);
    const aria = label === '←' ? '지우기' : label;
    return h('button', { class: `kp-key${label === '확인' ? ' kp-key--ok' : ''}`, type: 'button', 'aria-label': aria, onclick: action }, label);
  };

  const panel = h(
    'div',
    { class: 'keypad' },
    h('p', { class: 'kp-sys' }, 'LIB-85 · 폐관 모드'),
    h('h2', { class: 'kp-title' }, `${lock.no} ${lock.title}`),
    h('p', { class: 'kp-prompt' }, lock.prompt),
    h('div', { class: 'kp-display', 'aria-label': '입력한 숫자' }, cells),
    msg,
    h('div', { class: 'kp-keys' }, ['1', '2', '3', '4', '5', '6', '7', '8', '9', '←', '0', '확인'].map(keyButton)),
    h('button', { class: 'btn kp-close', type: 'button', onclick: () => modal.close() }, '닫기'),
  );

  // 실제 키보드로도 입력할 수 있다
  const onKey = (e) => {
    if (/^[0-9]$/.test(e.key)) press(e.key);
    else if (e.key === 'Backspace') erase();
    else if (e.key === 'Enter') check();
    else return;
    e.preventDefault();
  };
  document.addEventListener('keydown', onKey);
  modal = openModal({ content: panel, className: 'modal--keypad', label: `${lock.title} 키패드`, onClose: () => document.removeEventListener('keydown', onKey) });
  render();
  return modal;
}
