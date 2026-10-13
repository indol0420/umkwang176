// =========================================================
// sound.js — 효과음(파일 없이 Web Audio로 직접 합성)
// 타자 소리, 스위치 '딸깍', 장면 진입음, 확정음 등
// =========================================================
import { getSetting, setSetting } from './storage.js';

let ctx = null;
let master = null;
let muted = getSetting('muted', false);

// 오디오 장치 준비(브라우저 정책상 첫 클릭 이후에만 소리가 난다)
function audio() {
  if (!ctx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    ctx = new Ctx();
    master = ctx.createGain();
    master.gain.value = 0.7;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// 소리 끄기·켜기
export function setMuted(value) {
  muted = value;
  setSetting('muted', value);
}
export const isMuted = () => muted;

// 음 하나(진동수, 길이, 파형, 크기)
function tone(freq, dur, { type = 'sine', gain = 0.08, delay = 0, attack = 0.005, filter = 0 } = {}) {
  const ac = audio();
  if (!ac || muted) return;
  const t = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  let node = osc;
  if (filter) {
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = filter;
    osc.connect(lp);
    node = lp;
  }
  node.connect(g).connect(master);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

// 잡음(종이 소리, 딸깍 소리의 재료)
function noise(dur, { gain = 0.05, type = 'highpass', freq = 2000, q = 0.7, delay = 0 } = {}) {
  const ac = audio();
  if (!ac || muted) return;
  const t = ac.currentTime + delay;
  const len = Math.max(1, Math.floor(ac.sampleRate * dur));
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const f = ac.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = ac.createGain();
  g.gain.value = gain;
  src.connect(f).connect(g).connect(master);
  src.start(t);
}

// 효과음 모음
export const sfx = {
  // 타자 소리(대사 한 글자)
  type() {
    noise(0.025, { gain: 0.035, freq: 3200 });
  },
  // 다음 줄로 넘길 때
  next() {
    noise(0.04, { gain: 0.04, freq: 1800 });
  },
  // 스위치 '딸깍'
  click() {
    noise(0.03, { gain: 0.18, freq: 1200 });
    tone(140, 0.06, { type: 'square', gain: 0.05, filter: 900 });
  },
  // 열쇠 '철컥'
  clunk() {
    noise(0.08, { gain: 0.2, type: 'lowpass', freq: 700 });
    tone(90, 0.18, { type: 'square', gain: 0.06, filter: 500 });
  },
  // 센서 '틱'
  tick() {
    tone(2200, 0.03, { type: 'square', gain: 0.03 });
  },
  // 장면에 들어갈 때 낮은 화음
  stinger() {
    [55, 110, 130.8, 155.6].forEach((f, i) => tone(f, 2.6, { type: 'sawtooth', gain: 0.03, delay: i * 0.03, attack: 0.04, filter: 700 }));
    noise(1.2, { gain: 0.05, type: 'bandpass', freq: 2400, q: 0.6, delay: 0.1 });
  },
  // 종이가 흩어지는 소리
  paper() {
    noise(0.5, { gain: 0.06, type: 'bandpass', freq: 2600, q: 0.8 });
  },
  // 3명 확정 알림
  confirm() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 1.4, { type: 'triangle', gain: 0.06, delay: i * 0.12 }));
  },
  // 자물쇠 번호가 틀렸을 때
  error() {
    tone(150, 0.14, { type: 'square', gain: 0.05, filter: 1200 });
    tone(110, 0.2, { type: 'square', gain: 0.05, delay: 0.12, filter: 1200 });
  },
  // 자물쇠가 열릴 때
  unlock() {
    tone(660, 0.09, { type: 'square', gain: 0.04, filter: 2000 });
    tone(990, 0.16, { type: 'square', gain: 0.04, delay: 0.08, filter: 2000 });
    noise(0.09, { gain: 0.15, type: 'lowpass', freq: 800, delay: 0.2 });
  },
  // 키패드 숫자 누를 때
  key() {
    tone(1200, 0.04, { type: 'square', gain: 0.025, filter: 3000 });
  },
  // 엔딩
  ending() {
    [261.6, 329.6, 392, 523.3].forEach((f, i) => tone(f, 3.2, { type: 'triangle', gain: 0.05, delay: i * 0.25 }));
  },
};

// 대사에 붙은 소리 이름으로 재생
export function playCue(name) {
  if (name && sfx[name]) sfx[name]();
}
