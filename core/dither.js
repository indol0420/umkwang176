// =========================================================
// dither.js — 사진·그림을 1비트 흑백 점묘로 바꾸는 기능
// Atkinson 디더링: 오차의 6/8만 주변 6칸에 나눠 주어 대비가 선명하다
// =========================================================

// CSS 변수(--ink, --paper)에서 두 가지 색을 읽는다
export function palette() {
  const css = getComputedStyle(document.documentElement);
  return {
    ink: hexToRgb(css.getPropertyValue('--ink').trim() || '#0e0d0b'),
    paper: hexToRgb(css.getPropertyValue('--paper').trim() || '#e9e4d5'),
  };
}

// '#rrggbb' → [r, g, b]
function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// 캔버스 내용을 밝기 배열(0=검정, 1=흰색)로 읽는다
export function readGray(ctx, w, h) {
  const data = ctx.getImageData(0, 0, w, h).data;
  const gray = new Float32Array(w * h);
  for (let i = 0, p = 0; i < gray.length; i++, p += 4) {
    gray[i] = (0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2]) / 255;
  }
  return gray;
}

// 사진용 자동 대비: 밝기 분포의 양 끝(2%)을 잘라 0~1로 늘린다
export function autoLevel(gray, gamma = 0.9) {
  const hist = new Uint32Array(256);
  for (const v of gray) hist[Math.min(255, (v * 255) | 0)]++;
  const cut = gray.length * 0.02;
  let lo = 0;
  let hi = 255;
  for (let acc = 0; lo < 255 && acc + hist[lo] < cut; lo++) acc += hist[lo];
  for (let acc = 0; hi > 0 && acc + hist[hi] < cut; hi--) acc += hist[hi];
  const range = Math.max(1, hi - lo) / 255;
  const low = lo / 255;
  for (let i = 0; i < gray.length; i++) {
    const v = Math.min(1, Math.max(0, (gray[i] - low) / range));
    gray[i] = Math.pow(v, gamma);
  }
  return gray;
}

// Atkinson 디더링: 밝기 배열 → 0/1 배열
export function atkinson(gray, w, h) {
  const g = Float32Array.from(gray);
  const bits = new Uint8Array(w * h);
  const spread = (x, y, err) => {
    if (x >= 0 && x < w && y < h) g[y * w + x] += err;
  };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const bit = g[i] >= 0.5 ? 1 : 0;
      bits[i] = bit;
      const err = (g[i] - bit) / 8;
      spread(x + 1, y, err);
      spread(x + 2, y, err);
      spread(x - 1, y + 1, err);
      spread(x, y + 1, err);
      spread(x + 1, y + 1, err);
      spread(x, y + 2, err);
    }
  }
  return bits;
}

// 0/1 배열을 잉크·종이 두 색으로 캔버스에 칠한다
export function paintBits(ctx, bits, w, h, pal = palette(), mask = null) {
  const img = ctx.createImageData(w, h);
  const d = img.data;
  for (let i = 0, p = 0; i < bits.length; i++, p += 4) {
    const on = bits[i] && (!mask || mask[i]);
    const c = on ? pal.paper : pal.ink;
    d[p] = c[0];
    d[p + 1] = c[1];
    d[p + 2] = c[2];
    d[p + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}

// 글자처럼 디더링하면 안 되는 부분: 밝기 0.5 기준으로 딱 잘라 1비트로
export function threshold(ctx, w, h, pal = palette()) {
  const gray = readGray(ctx, w, h);
  const bits = new Uint8Array(w * h);
  for (let i = 0; i < gray.length; i++) bits[i] = gray[i] >= 0.5 ? 1 : 0;
  paintBits(ctx, bits, w, h, pal);
  return bits;
}

// 이미지 불러오기(파일이 없으면 null) — 같은 주소는 한 번만 시도
const imageCache = new Map();

// 주소의 그림을 불러온다(없으면 null을 돌려준다)
export function loadImage(src) {
  if (!src) return Promise.resolve(null);
  if (!imageCache.has(src)) {
    imageCache.set(
      src,
      new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
      }),
    );
  }
  return imageCache.get(src);
}

// 이미지를 캔버스에 꽉 차게(넘치는 부분은 잘라서) 그린다
export function drawCover(ctx, img, w, h) {
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
}

// 작업용 캔버스를 만든다
export function makeCanvas(w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  return canvas;
}

// 2D 그리기 도구(픽셀을 자주 읽으므로 willReadFrequently)
export function ctx2d(canvas) {
  return canvas.getContext('2d', { willReadFrequently: true });
}
