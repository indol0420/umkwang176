// =========================================================
// render.js — 장면·장소·얼굴·건물 그림을 화면에 붙이는 공통 기능
// 사진 파일이 있으면 사진을, 없으면 임시 그림(art.js)을 그린 뒤
// Atkinson 디더링으로 1비트 흑백 점묘를 만든다.
// =========================================================
import { h, isDev, hashText } from './util.js';
import { drawArt, drawBust, drawBuilding } from './art.js';
import { atkinson, autoLevel, readGray, paintBits, threshold, loadImage, drawCover, makeCanvas, ctx2d, palette } from './dither.js';
import { erode, makeSheets, SheetLayer } from './scatter.js';
import { toast } from './ui.js';

const bitsCache = new Map(); // 같은 그림을 다시 열 때 디더링을 반복하지 않는다

// 그림 하나를 1비트 배열로 만든다(사진 우선, 없으면 임시 그림)
export async function makeBits({ key, src, art, w, h: height, looks, mode = 'scene' }) {
  if (key && bitsCache.has(key)) return bitsCache.get(key);
  const canvas = makeCanvas(w, height);
  const ctx = ctx2d(canvas);
  const img = await loadImage(src);
  let gray;
  if (img) {
    drawCover(ctx, img, w, height);
    gray = autoLevel(readGray(ctx, w, height));
  } else {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, height);
    if (mode === 'face') drawBust(ctx, art, { seed: hashText(key || 'face') });
    else if (mode === 'building') drawBuilding(ctx, art, { open: art.open, seed: hashText(key || 'b') });
    else drawArt(ctx, art, { looks });
    gray = readGray(ctx, w, height);
    if (mode === 'face') addGrain(gray, w, height, hashText(key || 'grain'));
  }
  const result = { bits: atkinson(gray, w, height), w, h: height, photo: Boolean(img) };
  if (key) bitsCache.set(key, result);
  return result;
}

// CCTV 화질 느낌: 잔노이즈와 가로줄
function addGrain(gray, w, height, seed) {
  let s = seed || 1;
  for (let i = 0; i < gray.length; i++) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const row = Math.floor(i / w);
    gray[i] += ((s / 4294967296) - 0.5) * 0.08 - (row % 4 === 0 ? 0.03 : 0);
  }
}

// 퍼센트 사각형 → 픽셀 사각형
function toPixels(r, w, height) {
  return { x: (r.x / 100) * w, y: (r.y / 100) * height, w: (r.w / 100) * w, h: (r.h / 100) * height };
}

// =========================================================
// 그림 + 클릭 영역(장면·장소 공통)
// opts: { key, src, art, looks, spots, onSpot, vanish, reveal, w, h }
// =========================================================
export function createPicture(opts) {
  const w = opts.w || 640;
  const height = opts.h || 360;
  const base = h('canvas', { class: 'pic-base', width: w, height });
  const fx = h('canvas', { class: 'pic-fx', width: w, height, 'aria-hidden': 'true' });
  const layer = h('div', { class: 'pic-spots' });
  const el = h('div', { class: `picture ${opts.className || ''}` }, base, fx, layer);
  let sheets = null;
  let closed = false;

  for (const spot of opts.spots || []) layer.append(makeSpot(spot, opts.onSpot));
  if (isDev()) enableDev(el);

  const ready = (async () => {
    const res = await makeBits({ key: opts.key, src: opts.src, art: opts.art, looks: opts.looks, w, h: height });
    const bits = res.bits.slice(); // 원본(캐시)은 그대로 두고 복사본을 갉아낸다
    const flying = [];
    for (const v of opts.vanish || []) {
      const rect = toPixels(v, w, height);
      erode(bits, w, height, rect, v.dir, v.seed || 1, v.amount ?? 0.45);
      flying.push(...makeSheets(rect, v.dir, v.seed || 1, v.count ?? 30));
    }
    const pal = palette();
    const ctx = ctx2d(base);
    if (opts.reveal) await revealBits(ctx, bits, w, height, pal, () => closed);
    else paintBits(ctx, bits, w, height, pal);
    el.classList.toggle('is-photo', res.photo);
    el.classList.add('is-ready');
    if (flying.length && !closed) {
      sheets = new SheetLayer(fx, flying, pal);
      sheets.play();
    }
    return res;
  })();

  return {
    el,
    ready,
    // 장면을 닫을 때 애니메이션을 멈춘다
    destroy() {
      closed = true;
      if (sheets) sheets.stop();
    },
  };
}

// 점이 하나씩 켜지며 그림이 나타난다(약 0.7초)
function revealBits(ctx, bits, w, height, pal, isClosed) {
  const order = new Float32Array(bits.length);
  for (let i = 0; i < order.length; i++) order[i] = Math.random();
  const img = ctx.createImageData(w, height);
  const d = img.data;
  const start = performance.now();
  return new Promise((resolve) => {
    const step = (now) => {
      if (isClosed()) return resolve();
      const p = Math.min(1, (now - start) / 700);
      for (let i = 0, q = 0; i < bits.length; i++, q += 4) {
        const c = bits[i] && order[i] < p ? pal.paper : pal.ink;
        d[q] = c[0];
        d[q + 1] = c[1];
        d[q + 2] = c[2];
        d[q + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
      if (p < 1) requestAnimationFrame(step);
      else resolve();
    };
    requestAnimationFrame(step);
  });
}

// 클릭 영역 버튼 하나
function makeSpot(spot, onSpot) {
  const tag = spot.tag ?? spot.label;
  return h(
    'button',
    {
      class: `spot spot--${spot.kind}${spot.cls ? ` ${spot.cls}` : ''}`,
      type: 'button',
      style: { left: `${spot.x}%`, top: `${spot.y}%`, width: `${spot.w}%`, height: `${spot.h}%` },
      'aria-label': spot.aria || spot.label || tag,
      'data-spot': spot.id || '',
      onclick: (e) => {
        e.stopPropagation();
        if (onSpot) onSpot(spot, e);
      },
    },
    tag ? h('span', { class: 'spot-tag' }, tag) : null,
  );
}

// 개발 모드: 그림을 누르면 퍼센트 좌표를 알려 준다(사진 교체 후 영역 맞추기용)
function enableDev(el) {
  el.classList.add('is-dev');
  el.addEventListener('click', (e) => {
    const box = el.getBoundingClientRect();
    const x = (((e.clientX - box.left) / box.width) * 100).toFixed(1);
    const y = (((e.clientY - box.top) / box.height) * 100).toFixed(1);
    const text = `x: ${x}, y: ${y}`;
    console.log('[좌표]', text);
    toast(`좌표 ${text}`);
    navigator.clipboard?.writeText(text).catch(() => {});
  });
}

// =========================================================
// CCTV 얼굴 사진(정사각형) — 기록부 사진 탭
// =========================================================
export async function faceCanvas(theme, person, size = 144) {
  const res = await makeBits({
    key: `${theme.id}:face:${person.photo}`,
    src: theme.faceSrc ? theme.faceSrc(person) : null,
    art: person.look,
    w: size,
    h: size,
    mode: 'face',
  });
  const canvas = h('canvas', { class: 'face-canvas', width: size, height: size, 'aria-hidden': 'true' });
  const ctx = ctx2d(canvas);
  const pal = palette();
  paintBits(ctx, res.bits, size, size, pal);
  stampCCTV(ctx, size, person, pal);
  return canvas;
}

// 얼굴 사진 위에 CCTV 글자(카메라 번호, 시각)를 찍는다
function stampCCTV(ctx, size, person, pal) {
  const ink = `rgb(${pal.ink.join(',')})`;
  const paper = `rgb(${pal.paper.join(',')})`;
  ctx.font = '12px Galmuri11, monospace';
  ctx.textBaseline = 'top';
  const label = (text, x, y, align = 'left') => {
    const tw = Math.ceil(ctx.measureText(text).width);
    const bx = align === 'right' ? x - tw - 4 : x;
    ctx.fillStyle = ink;
    ctx.fillRect(bx, y, tw + 4, 14);
    ctx.fillStyle = paper;
    ctx.fillText(text, bx + 2, y + 1);
  };
  label('IC CAM', 2, 2);
  label(`#${person.photo}`, size - 2, 2, 'right');
  label(`${person.day || '목'} ${person.time}:${String(person.sec ?? 12).padStart(2, '0')}`, 2, size - 16);
  threshold(ctx, size, size, pal); // 글자 가장자리의 회색을 없애 1비트로
}

// =========================================================
// 첫 화면 건물 카드 그림
// =========================================================
export async function buildingCanvas(building, w = 240) {
  const height = Math.round(200 * ((building.shape && building.shape.tall) || 1)); // 건물마다 높이가 달라 스카이라인이 된다
  const res = await makeBits({
    key: `building:${building.id}:${building.open ? 1 : 0}`,
    src: building.open ? building.image : null,
    art: { ...building.shape, open: building.open },
    w,
    h: height,
    mode: 'building',
  });
  const canvas = h('canvas', { class: 'building-canvas', width: w, height, 'aria-hidden': 'true' });
  paintBits(ctx2d(canvas), res.bits, w, height, palette());
  return canvas;
}
