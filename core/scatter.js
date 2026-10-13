// =========================================================
// scatter.js — 사람이 '종잇장처럼 흩어지는' 효과
// 1) erode : 1비트 그림에서 사람 영역의 한쪽을 찢긴 모양으로 갉아낸다
// 2) SheetLayer : 종잇장 조각이 날아가다 멈춘 채 공중에 떠 있다
// 사진으로 바꿔도 같은 효과가 그대로 적용된다
// =========================================================
import { seeded, clamp } from './util.js';

// 좌표 → 0~1 난수(같은 좌표면 같은 값)
function hash2(x, y, seed) {
  let n = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(seed, 982451653);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

// 부드러운 노이즈(찢긴 가장자리 모양)
function noise(x, y, seed) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const a = hash2(xi, yi, seed);
  const b = hash2(xi + 1, yi, seed);
  const c = hash2(xi, yi + 1, seed);
  const d = hash2(xi + 1, yi + 1, seed);
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

// 날아가는 방향 쪽일수록 1에 가까운 값
function leading(dir, nx, ny) {
  if (dir === 'left') return 1 - nx;
  if (dir === 'right') return nx;
  if (dir === 'down') return ny;
  return 1 - ny; // up
}

// 사람 영역(타원)의 앞쪽을 갉아낸다. amount: 사라진 정도(0~1)
export function erode(bits, w, h, rect, dir = 'up', seed = 1, amount = 0.45) {
  const x0 = Math.max(0, Math.floor(rect.x));
  const y0 = Math.max(0, Math.floor(rect.y));
  const x1 = Math.min(w, Math.ceil(rect.x + rect.w));
  const y1 = Math.min(h, Math.ceil(rect.y + rect.h));
  const cut = 1 - amount;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const nx = (x - rect.x) / rect.w;
      const ny = (y - rect.y) / rect.h;
      const ex = (nx - 0.5) / 0.5;
      const ey = (ny - 0.5) / 0.5;
      const inside = ex * ex + ey * ey;
      if (inside > 1) continue; // 타원 밖은 건드리지 않는다
      const fade = 1 - inside * 0.35;
      const n = noise(x / 6, y / 6, seed) * 0.6 + noise(x / 2.2, y / 2.2, seed + 7) * 0.4;
      const v = leading(dir, nx, ny) * fade + (n - 0.5) * 0.6;
      const i = y * w + x;
      if (v > cut + 0.06) bits[i] = 0;
      else if (v > cut - 0.06 && bits[i] && hash2(x, y, seed + 3) < 0.5) bits[i] = 0;
    }
  }
}

// 종잇장 조각 목록을 만든다(시작·끝 위치, 크기, 회전)
export function makeSheets(rect, dir = 'up', seed = 1, count = 30) {
  const rnd = seeded(seed * 7 + 1);
  const vec = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[dir] || [0, -1];
  const [dx, dy] = vec;
  const sheets = [];
  for (let i = 0; i < count; i++) {
    const along = rnd();
    const across = rnd();
    let sx;
    let sy;
    if (dx) {
      sx = rect.x + rect.w * (dx > 0 ? 0.45 + along * 0.55 : 0.55 - along * 0.55);
      sy = rect.y + rect.h * (0.08 + across * 0.8);
    } else {
      sx = rect.x + rect.w * (0.15 + across * 0.7);
      sy = rect.y + rect.h * (dy < 0 ? 0.55 - along * 0.55 : 0.45 + along * 0.55);
    }
    const dist = rect.h * (0.12 + rnd() * 0.85) * (0.6 + along * 0.6);
    const size = rect.h * (0.03 + rnd() * 0.045);
    sheets.push({
      sx,
      sy,
      ex: sx + dx * dist + (rnd() - 0.5) * rect.w * (dy ? 1.1 : 0.4),
      ey: sy + dy * dist + (rnd() - 0.5) * rect.h * 0.3 - (dx ? rect.h * 0.18 * rnd() : 0),
      w: size,
      h: size * (1.2 + rnd() * 0.35),
      r0: rnd() * Math.PI * 2,
      r1: rnd() * Math.PI * 2,
      flip: rnd() * Math.PI * 2,
      delay: rnd() * 0.4,
      phase: rnd() * Math.PI * 2,
      lines: rnd() < 0.7,
    });
  }
  return sheets;
}

// 부드럽게 멈추는 움직임
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

// 종잇장 레이어: 캔버스 위에 조각들을 그리고 천천히 흔든다
export class SheetLayer {
  // canvas: 그림 위에 겹친 효과용 캔버스, sheets: makeSheets()로 만든 조각들
  constructor(canvas, sheets, pal) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.sheets = sheets;
    this.pal = pal;
    this.img = this.ctx.createImageData(canvas.width, canvas.height);
    this.raf = 0;
    this.frame = 0;
  }

  // 애니메이션 시작
  play() {
    const start = performance.now();
    const tick = (now) => {
      const t = (now - start) / 1000;
      this.frame++;
      // 다 날아간 뒤에는 3프레임에 한 번만 그려 부담을 줄인다
      if (t < 2.4 || this.frame % 3 === 0) this.draw(t);
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  // 애니메이션 멈춤(장면을 닫을 때)
  stop() {
    cancelAnimationFrame(this.raf);
  }

  // 한 장면 그리기
  draw(t) {
    const W = this.canvas.width;
    const H = this.canvas.height;
    const d = this.img.data;
    d.fill(0);
    for (const s of this.sheets) {
      const p = easeOut(clamp((t - s.delay) / 1.7, 0, 1));
      if (p <= 0) continue;
      const bob = Math.sin(t * 0.9 + s.phase) * 0.9 * p;
      const x = s.sx + (s.ex - s.sx) * p;
      const y = s.sy + (s.ey - s.sy) * p + bob;
      const rot = s.r0 + (s.r1 - s.r0) * p + Math.sin(t * 0.5 + s.phase) * 0.05;
      const squeeze = 0.35 + 0.65 * Math.abs(Math.cos(s.flip + p * 2.2 + Math.sin(t * 0.7 + s.phase) * 0.12));
      paintSheet(d, W, H, x, y, s.w * squeeze, s.h, rot, s.lines, this.pal);
    }
    this.ctx.putImageData(this.img, 0, 0);
  }
}

// 회전된 종잇장 하나를 1비트로 칠한다(테두리는 잉크, 안은 종이, 글줄 무늬)
function paintSheet(d, W, H, cx, cy, sw, sh, rot, lines, pal) {
  const cos = Math.cos(-rot);
  const sin = Math.sin(-rot);
  const R = Math.ceil(Math.hypot(sw, sh) / 2) + 1;
  const hw = sw / 2;
  const hh = sh / 2;
  for (let py = Math.max(0, Math.floor(cy - R)); py <= Math.min(H - 1, Math.ceil(cy + R)); py++) {
    for (let px = Math.max(0, Math.floor(cx - R)); px <= Math.min(W - 1, Math.ceil(cx + R)); px++) {
      const lx = (px - cx) * cos - (py - cy) * sin;
      const ly = (px - cx) * sin + (py - cy) * cos;
      if (Math.abs(lx) > hw || Math.abs(ly) > hh) continue;
      const edge = Math.abs(lx) > hw - 1 || Math.abs(ly) > hh - 1;
      const row = Math.floor(ly + hh);
      const ink = edge || (lines && sw > 4 && row % 3 === 2 && Math.abs(lx) < hw - 1.5);
      const c = ink ? pal.ink : pal.paper;
      const i = (py * W + px) * 4;
      d[i] = c[0];
      d[i + 1] = c[1];
      d[i + 2] = c[2];
      d[i + 3] = 255;
    }
  }
}
