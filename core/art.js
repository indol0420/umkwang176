// =========================================================
// art.js — 사진이 아직 없을 때 쓰는 '임시 그림'
// data 파일의 그림 목록(art: [...])을 읽어 회색조로 그린 뒤,
// render.js가 1비트로 디더링한다.
// 좌표는 그림 크기에 대한 퍼센트(x: 가로, y: 세로), 밝기는 0(검정)~1(흰색)
// =========================================================
import { seeded, clamp, hashText } from './util.js';

// 밝기(0~1) → 회색 CSS 색
export const gray = (v) => {
  const c = Math.round(clamp(v, 0, 1) * 255);
  return `rgb(${c},${c},${c})`;
};

// 퍼센트 좌표 → 픽셀 좌표 변환기
function frame(ctx) {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  return { W, H, x: (v) => (v / 100) * W, y: (v) => (v / 100) * H, s: (v) => (v / 100) * H };
}

// 그림 목록을 순서대로 그린다. env.looks: 사진 번호 → 외형
export function drawArt(ctx, items, env = {}) {
  const F = frame(ctx);
  for (const item of items || []) {
    const draw = PRIMS[item.t];
    if (!draw) {
      console.warn('[임시 그림] 모르는 종류:', item.t);
      continue;
    }
    ctx.save();
    // clip: [x, y, w, h] 안쪽만 그린다(유리창 너머 등), clipY: 이 높이 위쪽만 그린다(책상 뒤 등)
    if (item.clip) {
      const [cx, cy, cw, ch] = item.clip;
      ctx.beginPath();
      ctx.rect(F.x(cx), F.y(cy), F.x(cw), F.y(ch));
      ctx.clip();
    }
    if (item.clipY !== undefined) {
      ctx.beginPath();
      ctx.rect(0, 0, F.W, F.y(item.clipY));
      ctx.clip();
    }
    draw(ctx, item, F, env);
    ctx.restore();
  }
}

// ---------- 작은 도우미 ----------

// 사각형 채우기
function box(ctx, x, y, w, h, v) {
  ctx.fillStyle = gray(v);
  ctx.fillRect(x, y, w, h);
}

// 다각형 채우기
function shape(ctx, pts, v) {
  ctx.fillStyle = gray(v);
  ctx.beginPath();
  pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
  ctx.closePath();
  ctx.fill();
}

// 선 긋기
function stroke(ctx, pts, width, v) {
  ctx.strokeStyle = gray(v);
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
  ctx.stroke();
}

// 원 채우기
function disc(ctx, x, y, r, v) {
  ctx.fillStyle = gray(v);
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0.5, r), 0, Math.PI * 2);
  ctx.fill();
}

// 빛 번짐(더하기 합성)
function light(ctx, x, y, r, alpha, squash = 1) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.translate(x, y);
  ctx.scale(1, squash);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  g.addColorStop(0, `rgba(255,255,255,${alpha})`);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(-r, -r, r * 2, r * 2);
  ctx.restore();
}

// ---------- 그림 종류(primitive) ----------
const PRIMS = {
  // 배경: 위아래 그라데이션
  bg(ctx, o, F) {
    const g = ctx.createLinearGradient(0, 0, 0, F.H);
    g.addColorStop(0, gray(o.top ?? 0.04));
    g.addColorStop(1, gray(o.bottom ?? 0.14));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, F.W, F.H);
  },

  // 빛 번짐: { x, y, r, a, sy(세로 납작) }
  glow(ctx, o, F) {
    light(ctx, F.x(o.x), F.y(o.y), F.s(o.r ?? 20), o.a ?? 0.3, o.sy ?? 1);
  },

  // 어둠(가장자리 또는 특정 위치): { x, y, r, a }
  dark(ctx, o, F) {
    const x = F.x(o.x ?? 50);
    const y = F.y(o.y ?? 50);
    const r = F.s(o.r ?? 90);
    const g = ctx.createRadialGradient(x, y, r * (o.inner ?? 0.35), x, y, r);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, `rgba(0,0,0,${o.a ?? 0.7})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, F.W, F.H);
  },

  // 바닥: 수평선 아래를 칠하고 원근선을 긋는다
  floor(ctx, o, F) {
    const y0 = F.y(o.y ?? 66);
    const g = ctx.createLinearGradient(0, y0, 0, F.H);
    g.addColorStop(0, gray(o.far ?? 0.08));
    g.addColorStop(1, gray(o.near ?? 0.2));
    ctx.fillStyle = g;
    ctx.fillRect(0, y0, F.W, F.H - y0);
    if (o.lines === false) return;
    const vx = F.x(o.vx ?? 50);
    ctx.strokeStyle = gray((o.near ?? 0.2) + 0.07);
    ctx.lineWidth = 1;
    for (let i = -8; i <= 8; i++) {
      ctx.beginPath();
      ctx.moveTo(vx + i * F.W * 0.025, y0);
      ctx.lineTo(vx + i * F.W * 0.3, F.H);
      ctx.stroke();
    }
  },

  // 단순 사각형: { x, y, w, h, tone }
  rect(ctx, o, F) {
    box(ctx, F.x(o.x), F.y(o.y), F.x(o.w), F.y(o.h), o.tone ?? 0.2);
  },

  // 다각형: { pts: [[x,y], ...], tone }
  poly(ctx, o, F) {
    shape(ctx, o.pts.map(([px, py]) => [F.x(px), F.y(py)]), o.tone ?? 0.2);
  },

  // 선: { pts, lw(세로% 굵기), tone }
  line(ctx, o, F) {
    stroke(ctx, o.pts.map(([px, py]) => [F.x(px), F.y(py)]), F.s(o.lw ?? 0.6), o.tone ?? 0.5);
  },

  // 책장(정면): { x, y, w, h, rows, tone, seed }
  shelf(ctx, o, F) {
    const x = F.x(o.x);
    const y = F.y(o.y);
    const w = F.x(o.w);
    const h = F.y(o.h);
    const base = o.tone ?? 0.22;
    const rows = o.rows ?? 5;
    const rnd = seeded(o.seed ?? hashText(`${o.x}:${o.y}:${o.w}`));
    box(ctx, x, y, w, h, base * 0.45);
    const rowH = h / rows;
    const board = Math.max(2, rowH * 0.09);
    for (let r = 0; r < rows; r++) {
      const bottom = y + (r + 1) * rowH - board;
      let cx = x + board;
      while (cx < x + w - board - 1) {
        const bw = 2 + rnd() * 4;
        if (rnd() < 0.05) {
          cx += bw * 1.6;
          continue;
        }
        const bh = (rowH - board) * (0.6 + rnd() * 0.35);
        const v = base + (rnd() - 0.5) * 0.2 + (rnd() < 0.07 ? 0.3 : 0);
        box(ctx, cx, bottom - bh, Math.min(bw, x + w - board - cx), bh, v);
        cx += bw + (rnd() < 0.3 ? 1 : 0);
      }
      box(ctx, x, bottom, w, board, base + 0.14);
    }
    box(ctx, x, y, board, h, base + 0.1);
    box(ctx, x + w - board, y, board, h, base + 0.1);
    box(ctx, x, y, w, board, base + 0.12);
  },

  // 서가 통로(원근): { vx, vy, half, top, bottom, depth, rows, tone, lit, lights }
  aisle(ctx, o, F) {
    const vx = F.x(o.vx ?? 50);
    const vy = F.y(o.vy ?? 44);
    const half = F.x(o.half ?? 60);
    const yTop = F.y(o.top ?? -10);
    const yBot = F.y(o.bottom ?? 96);
    const zFar = o.depth ?? 7;
    const rows = o.rows ?? 6;
    const base = o.tone ?? 0.2;
    const lit = o.lit ?? 0;
    const rnd = seeded(o.seed ?? 11);
    const px = (side, z) => vx + (side * half) / z;
    const py = (yw, z) => vy + (yw - vy) / z;
    const fog = (z) => 1 / (1 + (z - 1) * 0.22);

    // 바닥과 천장
    shape(ctx, [[px(-1, 1), py(yBot, 1)], [px(1, 1), py(yBot, 1)], [px(1, zFar), py(yBot, zFar)], [px(-1, zFar), py(yBot, zFar)]], base * 0.55 + lit * 0.25);
    shape(ctx, [[px(-1, 1), py(yTop, 1)], [px(1, 1), py(yTop, 1)], [px(1, zFar), py(yTop, zFar)], [px(-1, zFar), py(yTop, zFar)]], base * 0.25);
    // 막다른 벽
    box(ctx, px(-1, zFar), py(yTop, zFar), px(1, zFar) - px(-1, zFar), py(yBot, zFar) - py(yTop, zFar), base * 0.35 + lit * 0.1);

    // 양쪽 책장
    for (const side of [-1, 1]) {
      shape(ctx, [[px(side, 1), py(yTop, 1)], [px(side, zFar), py(yTop, zFar)], [px(side, zFar), py(yBot, zFar)], [px(side, 1), py(yBot, 1)]], base * 0.35);
      for (let r = 0; r < rows; r++) {
        const y0w = yTop + ((yBot - yTop) * r) / rows;
        const y1w = yTop + ((yBot - yTop) * (r + 1)) / rows;
        const boardW = (y1w - y0w) * 0.1;
        let z = zFar;
        while (z > 1.02) {
          const dz = 0.03 + rnd() * 0.05;
          const z2 = Math.max(1, z - dz);
          if (rnd() > 0.05) {
            const fill = 0.6 + rnd() * 0.35;
            const topW = y1w - boardW - (y1w - y0w - boardW) * fill;
            const v = (base + (rnd() - 0.5) * 0.22 + (rnd() < 0.06 ? 0.3 : 0)) * fog(z) + lit * 0.35 * fog(z);
            shape(ctx, [[px(side, z), py(topW, z)], [px(side, z2), py(topW, z2)], [px(side, z2), py(y1w - boardW, z2)], [px(side, z), py(y1w - boardW, z)]], v);
          }
          z = z2;
        }
        // 선반 판
        const bv = (base + 0.16) * 0.9 + lit * 0.2;
        shape(ctx, [[px(side, 1), py(y1w - boardW, 1)], [px(side, zFar), py(y1w - boardW, zFar)], [px(side, zFar), py(y1w, zFar)], [px(side, 1), py(y1w, 1)]], bv);
      }
    }

    // 천장 형광등
    if (o.lights) {
      for (let z = 1.6; z < zFar; z += 1.4) {
        const yw = yTop + (yBot - yTop) * 0.02;
        const lw = (half * 0.18) / z;
        const y = py(yw, z);
        box(ctx, vx - lw, y, lw * 2, Math.max(1, 6 / z), o.lights === 'off' ? 0.3 : 0.95);
        if (o.lights !== 'off') light(ctx, vx, y, (half * 0.5) / z, 0.18);
      }
    }
  },

  // 책상: { x, y(상판), w, h(다리까지), tone, panel }
  desk(ctx, o, F) {
    const x = F.x(o.x);
    const y = F.y(o.y);
    const w = F.x(o.w);
    const h = F.y(o.h ?? 18);
    const v = o.tone ?? 0.36;
    const th = Math.max(3, h * 0.12);
    box(ctx, x + w * 0.04, y + th, w * 0.035, h - th, v * 0.55);
    box(ctx, x + w * 0.925, y + th, w * 0.035, h - th, v * 0.55);
    if (o.panel) box(ctx, x + w * 0.04, y + th, w * 0.92, h * 0.45, v * 0.5);
    box(ctx, x, y, w, th, v);
    box(ctx, x, y, w, Math.max(1, th * 0.3), v + 0.16);
  },

  // 칸막이: { x, y, w, h, tone }
  partition(ctx, o, F) {
    box(ctx, F.x(o.x), F.y(o.y), F.x(o.w), F.y(o.h), o.tone ?? 0.26);
    box(ctx, F.x(o.x), F.y(o.y), F.x(o.w), Math.max(1, F.s(0.8)), (o.tone ?? 0.26) + 0.18);
  },

  // 책상 스탠드: { x, y(받침), s(크기), dir(1/-1), on }
  lamp(ctx, o, F) {
    const x = F.x(o.x);
    const y = F.y(o.y);
    const s = F.s(o.s ?? 12);
    const d = o.dir ?? 1;
    box(ctx, x - s * 0.22, y - s * 0.06, s * 0.44, s * 0.06, 0.4);
    stroke(ctx, [[x, y - s * 0.06], [x - d * s * 0.08, y - s * 0.62], [x + d * s * 0.3, y - s * 0.78]], Math.max(1.5, s * 0.045), 0.42);
    const hx = x + d * s * 0.36;
    const hy = y - s * 0.74;
    shape(ctx, [[hx - s * 0.12, hy - s * 0.08], [hx + s * 0.12, hy - s * 0.08], [hx + s * 0.22, hy + s * 0.1], [hx - s * 0.22, hy + s * 0.1]], o.on ? 0.95 : 0.44);
    if (o.on) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createLinearGradient(0, hy, 0, y + s * 0.1);
      g.addColorStop(0, 'rgba(255,255,255,0.45)');
      g.addColorStop(1, 'rgba(255,255,255,0.05)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(hx - s * 0.2, hy + s * 0.1);
      ctx.lineTo(hx + s * 0.2, hy + s * 0.1);
      ctx.lineTo(hx + s * 0.75, y + s * 0.05);
      ctx.lineTo(hx - s * 0.75, y + s * 0.05);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  },

  // 문: { x, y, w, h, tone, win(유리창), winLit, open('out'), outside, bar }
  door(ctx, o, F) {
    const x = F.x(o.x);
    const y = F.y(o.y);
    const w = F.x(o.w);
    const h = F.y(o.h);
    const ft = Math.max(3, w * 0.07);
    box(ctx, x - ft, y - ft, w + ft * 2, h + ft, o.frame ?? 0.3);
    if (o.open) {
      // 열린 문: 바깥이 보이고 문짝은 비스듬히
      box(ctx, x, y, w, h, o.outside ?? 0.3);
      light(ctx, x + w / 2, y + h * 0.4, w * 0.9, 0.12);
      shape(ctx, [[x + w, y], [x + w * 1.45, y - h * 0.06], [x + w * 1.45, y + h * 1.04], [x + w, y + h]], o.tone ?? 0.2);
      box(ctx, x + w * 1.2, y + h * 0.48, w * 0.2, Math.max(2, h * 0.03), 0.6);
      return;
    }
    box(ctx, x, y, w, h, o.tone ?? 0.16);
    if (o.win) {
      box(ctx, x + w * 0.6, y + h * 0.1, w * 0.22, h * 0.38, o.winLit ? 0.78 : 0.06);
      if (o.winLit) light(ctx, x + w * 0.71, y + h * 0.29, w * 0.55, 0.22, 1.4);
    }
    if (o.bar !== false) box(ctx, x + w * 0.12, y + h * 0.5, w * 0.76, Math.max(2, h * 0.025), 0.46);
  },

  // 비상구 표시등: { x, y, s }
  exit(ctx, o, F) {
    const x = F.x(o.x);
    const y = F.y(o.y);
    const s = F.s(o.s ?? 5);
    light(ctx, x, y, s * 3.4, 0.28);
    box(ctx, x - s, y - s * 0.45, s * 2, s * 0.9, 0.93);
    // 달리는 사람과 문(픽토그램)
    box(ctx, x + s * 0.35, y - s * 0.32, s * 0.4, s * 0.64, 0.1);
    disc(ctx, x - s * 0.35, y - s * 0.22, s * 0.11, 0.1);
    stroke(ctx, [[x - s * 0.4, y - s * 0.08], [x - s * 0.2, y + s * 0.12], [x - s * 0.5, y + s * 0.3]], Math.max(1, s * 0.1), 0.1);
    stroke(ctx, [[x - s * 0.2, y + s * 0.12], [x, y + s * 0.3]], Math.max(1, s * 0.1), 0.1);
  },

  // IC 출입 게이트: { x, y(기둥 위), w, h, n(기둥 수) }
  gate(ctx, o, F) {
    const x = F.x(o.x);
    const y = F.y(o.y);
    const w = F.x(o.w ?? 26);
    const h = F.y(o.h ?? 22);
    const n = o.n ?? 3;
    const pw = w * 0.13;
    const gap = (w - pw * n) / (n - 1);
    for (let i = 0; i < n; i++) {
      const px = x + i * (pw + gap);
      if (i < n - 1) box(ctx, px + pw, y + h * 0.3, gap * 0.42, h * 0.3, 0.55);
      if (i > 0) box(ctx, px - gap * 0.42, y + h * 0.3, gap * 0.42, h * 0.3, 0.5);
      box(ctx, px, y, pw, h, 0.34);
      box(ctx, px, y, pw, Math.max(2, h * 0.08), 0.6);
      box(ctx, px + pw * 0.2, y + h * 0.12, pw * 0.6, h * 0.08, 0.86);
    }
  },

  // 안내데스크 카운터: { x, y, w, h }
  counter(ctx, o, F) {
    const x = F.x(o.x);
    const y = F.y(o.y);
    const w = F.x(o.w);
    const h = F.y(o.h);
    box(ctx, x, y, w, h, o.tone ?? 0.22);
    box(ctx, x - F.s(1), y - F.s(2), w + F.s(2), F.s(2.4), (o.tone ?? 0.22) + 0.2);
    for (let i = 1; i < 4; i++) box(ctx, x + (w * i) / 4, y + h * 0.15, 1, h * 0.75, (o.tone ?? 0.22) + 0.06);
  },

  // 모니터·단말기 화면: { x, y, w, h, on, stand }
  screen(ctx, o, F) {
    const x = F.x(o.x);
    const y = F.y(o.y);
    const w = F.x(o.w);
    const h = F.y(o.h);
    if (o.stand !== false) box(ctx, x + w * 0.42, y + h, w * 0.16, F.s(o.standH ?? 4), 0.3);
    box(ctx, x, y, w, h, 0.14);
    const m = Math.max(2, w * 0.06);
    box(ctx, x + m, y + m, w - m * 2, h - m * 2, o.on ? 0.8 : 0.07);
    if (o.on) {
      const rnd = seeded(hashText(`${o.x}${o.y}`));
      for (let ly = y + m * 2; ly < y + h - m * 2; ly += Math.max(3, h * 0.13)) {
        box(ctx, x + m * 2, ly, (w - m * 4) * (0.4 + rnd() * 0.55), Math.max(1, h * 0.05), 0.35);
      }
      light(ctx, x + w / 2, y + h / 2, Math.max(w, h) * 1.1, o.glow ?? 0.28);
    }
  },

  // 무인 대출기: { x, y, w, h, on }
  kiosk(ctx, o, F) {
    const x = F.x(o.x);
    const y = F.y(o.y);
    const w = F.x(o.w);
    const h = F.y(o.h);
    box(ctx, x, y, w, h, 0.3);
    box(ctx, x, y, w, Math.max(2, h * 0.03), 0.5);
    PRIMS.screen(ctx, { x: o.x + o.w * 0.12, y: o.y + o.h * 0.08, w: o.w * 0.76, h: o.h * 0.32, on: o.on, stand: false }, F);
    box(ctx, x + w * 0.2, y + h * 0.5, w * 0.6, h * 0.05, 0.08);
    box(ctx, x + w * 0.3, y + h * 0.62, w * 0.4, h * 0.04, 0.55);
  },

  // 청소 카트: { x, y(바닥), s }
  cart(ctx, o, F) {
    const x = F.x(o.x);
    const y = F.y(o.y);
    const s = F.s(o.s ?? 22);
    box(ctx, x - s * 0.35, y - s * 0.62, s * 0.7, s * 0.52, 0.34);
    box(ctx, x - s * 0.33, y - s * 0.6, s * 0.66, s * 0.08, 0.52);
    disc(ctx, x - s * 0.15, y - s * 0.72, s * 0.14, 0.58);
    stroke(ctx, [[x + s * 0.2, y - s * 0.1], [x + s * 0.28, y - s * 1.15]], Math.max(1.5, s * 0.03), 0.6);
    box(ctx, x + s * 0.12, y - s * 0.12, s * 0.22, s * 0.06, 0.66);
    disc(ctx, x - s * 0.28, y - s * 0.05, s * 0.06, 0.12);
    disc(ctx, x + s * 0.28, y - s * 0.05, s * 0.06, 0.12);
  },

  // 북트럭: { x, y(바닥), s, books(권 수), glow(책 강조) }
  truck(ctx, o, F) {
    const x = F.x(o.x);
    const y = F.y(o.y);
    const s = F.s(o.s ?? 26);
    const w = s * 0.9;
    stroke(ctx, [[x - w / 2, y - s * 0.08], [x - w / 2, y - s * 0.95]], Math.max(2, s * 0.03), 0.45);
    stroke(ctx, [[x + w / 2, y - s * 0.08], [x + w / 2, y - s * 0.95]], Math.max(2, s * 0.03), 0.45);
    for (const k of [0.3, 0.6, 0.9]) box(ctx, x - w / 2, y - s * k, w, Math.max(2, s * 0.035), 0.48);
    disc(ctx, x - w * 0.42, y - s * 0.03, s * 0.04, 0.15);
    disc(ctx, x + w * 0.42, y - s * 0.03, s * 0.04, 0.15);
    const n = o.books ?? 0;
    for (let i = 0; i < n; i++) {
      const bx = x - w * 0.3 + i * w * 0.22;
      box(ctx, bx, y - s * 0.9 - s * 0.16, w * 0.16, s * 0.16, 0.72);
      box(ctx, bx, y - s * 0.9 - s * 0.16, w * 0.03, s * 0.16, 0.92);
    }
    if (o.glow && n) light(ctx, x - w * 0.2, y - s, s * 0.45, 0.25);
  },

  // 벽 스위치: { x, y, s, down }
  switch(ctx, o, F) {
    const x = F.x(o.x);
    const y = F.y(o.y);
    const s = F.s(o.s ?? 5);
    box(ctx, x - s * 0.35, y - s * 0.5, s * 0.7, s, 0.66);
    box(ctx, x - s * 0.12, y - (o.down ? 0 : s * 0.3), s * 0.24, s * 0.3, 0.2);
  },

  // 책(바닥·책상 위): { x, y(중심), w(가로%), rot(도), open, tone, glow }
  book(ctx, o, F) {
    const x = F.x(o.x);
    const y = F.y(o.y);
    const w = F.x(o.w ?? 6);
    const h = w * (o.open ? 0.62 : 0.72);
    if (o.glow) light(ctx, x, y, w * 1.5, o.glow, 0.6);
    ctx.translate(x, y);
    ctx.rotate(((o.rot ?? 0) * Math.PI) / 180);
    ctx.scale(1, o.flat ?? 0.55);
    if (o.open) {
      box(ctx, -w / 2, -h / 2, w, h, 0.18);
      box(ctx, -w / 2 + 1, -h / 2 + 1, w / 2 - 2, h - 2, 0.94);
      box(ctx, 1, -h / 2 + 1, w / 2 - 2, h - 2, 0.9);
      for (let ly = -h / 2 + h * 0.18; ly < h / 2 - h * 0.12; ly += h * 0.14) {
        box(ctx, -w / 2 + w * 0.06, ly, w * 0.36, 1, 0.55);
        box(ctx, w * 0.06, ly, w * 0.36, 1, 0.55);
      }
      return;
    }
    box(ctx, -w / 2, -h / 2, w, h, o.tone ?? 0.58);
    box(ctx, w / 2 - w * 0.08, -h / 2, w * 0.08, h, 0.9);
    box(ctx, -w / 2, -h / 2, w * 0.1, h, (o.tone ?? 0.58) - 0.18);
  },

  // 휴대폰: { x, y, s, rot, on }
  phone(ctx, o, F) {
    const s = F.s(o.s ?? 5);
    ctx.translate(F.x(o.x), F.y(o.y));
    ctx.rotate(((o.rot ?? 0) * Math.PI) / 180);
    box(ctx, -s * 0.28, -s * 0.5, s * 0.56, s, 0.1);
    box(ctx, -s * 0.22, -s * 0.42, s * 0.44, s * 0.84, o.on ? 0.88 : 0.2);
    if (o.on) light(ctx, 0, 0, s * 1.6, 0.2);
  },

  // 무전기: { x, y, s }
  radio(ctx, o, F) {
    const x = F.x(o.x);
    const y = F.y(o.y);
    const s = F.s(o.s ?? 7);
    box(ctx, x - s * 0.18, y - s * 0.5, s * 0.36, s * 0.8, 0.16);
    stroke(ctx, [[x + s * 0.1, y - s * 0.5], [x + s * 0.12, y - s * 0.95]], Math.max(1.5, s * 0.06), 0.3);
    for (let i = 0; i < 3; i++) box(ctx, x - s * 0.12, y - s * 0.35 + i * s * 0.1, s * 0.24, 1, 0.42);
    box(ctx, x - s * 0.12, y + s * 0.02, s * 0.24, s * 0.12, 0.82);
  },

  // 텀블러(스티커 붙음): { x, y(바닥), s }
  tumbler(ctx, o, F) {
    const x = F.x(o.x);
    const y = F.y(o.y);
    const s = F.s(o.s ?? 8);
    box(ctx, x - s * 0.2, y - s * 0.85, s * 0.4, s * 0.85, 0.72);
    box(ctx, x - s * 0.22, y - s * 1.0, s * 0.44, s * 0.16, 0.3);
    box(ctx, x - s * 0.12, y - s * 0.6, s * 0.24, s * 0.24, 0.96);
    box(ctx, x - s * 0.06, y - s * 0.54, s * 0.12, s * 0.12, 0.2);
  },

  // 가방(키링 달 수 있음): { x, y(바닥), s, charm }
  bag(ctx, o, F) {
    const x = F.x(o.x);
    const y = F.y(o.y);
    const s = F.s(o.s ?? 12);
    shape(ctx, [[x - s * 0.36, y], [x - s * 0.4, y - s * 0.7], [x - s * 0.25, y - s * 0.9], [x + s * 0.25, y - s * 0.9], [x + s * 0.4, y - s * 0.7], [x + s * 0.36, y]], o.tone ?? 0.5);
    box(ctx, x - s * 0.24, y - s * 0.42, s * 0.48, s * 0.32, (o.tone ?? 0.5) - 0.14);
    stroke(ctx, [[x - s * 0.18, y - s * 0.9], [x - s * 0.1, y - s * 1.05], [x + s * 0.1, y - s * 1.05], [x + s * 0.18, y - s * 0.9]], Math.max(1.5, s * 0.05), 0.25);
    if (o.charm) {
      stroke(ctx, [[x + s * 0.36, y - s * 0.6], [x + s * 0.46, y - s * 0.42]], 1, 0.7);
      disc(ctx, x + s * 0.48, y - s * 0.33, s * 0.11, 0.88);
      disc(ctx, x + s * 0.52, y - s * 0.43, s * 0.04, 0.5);
    }
  },

  // 종이 뭉치: { x, y, w, rot }
  papers(ctx, o, F) {
    const w = F.x(o.w ?? 8);
    const h = w * 1.3;
    ctx.translate(F.x(o.x), F.y(o.y));
    ctx.rotate(((o.rot ?? 0) * Math.PI) / 180);
    ctx.scale(1, o.flat ?? 0.5);
    for (let i = 3; i >= 0; i--) box(ctx, -w / 2 + i * 2, -h / 2 - i * 2, w, h, 0.84 + i * 0.02);
    for (let ly = -h / 2 + h * 0.15; ly < h / 2 - h * 0.1; ly += h * 0.1) box(ctx, -w / 2 + w * 0.1, ly, w * 0.7, 1, 0.5);
  },

  // 좌석 번호판: { x, y, s, text }
  plate(ctx, o, F) {
    const x = F.x(o.x);
    const y = F.y(o.y);
    const s = F.s(o.s ?? 6);
    box(ctx, x - s, y - s * 0.5, s * 2, s, 0.3);
    box(ctx, x - s + 2, y - s * 0.5 + 2, s * 2 - 4, s - 4, 0.9);
    ctx.fillStyle = gray(0.08);
    ctx.font = `700 ${Math.round(s * 0.7)}px Galmuri11, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(o.text ?? '', x, y + 1);
  },

  // 의자: { x, y(바닥), s, face }
  chair(ctx, o, F) {
    const x = F.x(o.x);
    const y = F.y(o.y);
    const s = F.s(o.s ?? 14);
    const d = o.face ?? 1;
    box(ctx, x - s * 0.25, y - s * 0.48, s * 0.5, s * 0.07, o.tone ?? 0.24);
    box(ctx, x - d * s * 0.25 - (d > 0 ? 0 : s * 0.07), y - s * 1.0, s * 0.07, s * 0.55, o.tone ?? 0.24);
    box(ctx, x - s * 0.22, y - s * 0.42, s * 0.04, s * 0.42, (o.tone ?? 0.24) - 0.08);
    box(ctx, x + s * 0.18, y - s * 0.42, s * 0.04, s * 0.42, (o.tone ?? 0.24) - 0.08);
  },

  // 원형 카페 테이블: { x, y(상판), s }
  table(ctx, o, F) {
    const x = F.x(o.x);
    const y = F.y(o.y);
    const s = F.s(o.s ?? 18);
    box(ctx, x - s * 0.04, y, s * 0.08, s * 0.5, 0.25);
    box(ctx, x - s * 0.25, y + s * 0.48, s * 0.5, s * 0.04, 0.25);
    ctx.fillStyle = gray(o.tone ?? 0.4);
    ctx.beginPath();
    ctx.ellipse(x, y, s * 0.5, s * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
  },

  // 소파: { x, y(바닥), w, h }
  sofa(ctx, o, F) {
    const x = F.x(o.x);
    const y = F.y(o.y);
    const w = F.x(o.w ?? 24);
    const h = F.y(o.h ?? 14);
    box(ctx, x, y - h, w, h * 0.55, (o.tone ?? 0.24) - 0.04);
    box(ctx, x, y - h * 0.5, w, h * 0.42, o.tone ?? 0.24);
    box(ctx, x - w * 0.05, y - h * 0.75, w * 0.08, h * 0.7, (o.tone ?? 0.24) + 0.05);
    box(ctx, x + w * 0.97, y - h * 0.75, w * 0.08, h * 0.7, (o.tone ?? 0.24) + 0.05);
    box(ctx, x + w / 2, y - h * 0.5, 1, h * 0.4, (o.tone ?? 0.24) + 0.1);
  },

  // 창문(바깥은 어두운 밤): { x, y, w, h, moon }
  window(ctx, o, F) {
    const x = F.x(o.x);
    const y = F.y(o.y);
    const w = F.x(o.w);
    const h = F.y(o.h);
    box(ctx, x, y, w, h, 0.24);
    box(ctx, x + 3, y + 3, w - 6, h - 6, o.sky ?? 0.12);
    if (o.moon) light(ctx, x + w * 0.7, y + h * 0.3, Math.min(w, h) * 0.8, 0.2);
    box(ctx, x + w / 2 - 1, y, 2, h, 0.26);
    box(ctx, x, y + h / 2 - 1, w, 2, 0.26);
  },

  // 표지판·글자판: { x, y, w, h, text, tone }
  sign(ctx, o, F) {
    const x = F.x(o.x);
    const y = F.y(o.y);
    const w = F.x(o.w);
    const h = F.y(o.h);
    box(ctx, x, y, w, h, Math.max(0.86, o.tone ?? 0.92));
    ctx.fillStyle = gray(o.ink ?? 0.02);
    ctx.font = `700 ${Math.round(h * 0.62)}px Galmuri11, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(o.text ?? '', x + w / 2, y + h / 2 + 1);
  },

  // 벽시계(11:59에 멈춤): { x, y, s }
  clock(ctx, o, F) {
    const x = F.x(o.x);
    const y = F.y(o.y);
    const r = F.s(o.s ?? 8);
    disc(ctx, x, y, r, 0.36);
    disc(ctx, x, y, r * 0.86, 0.86);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      box(ctx, x + Math.sin(a) * r * 0.72 - 1, y - Math.cos(a) * r * 0.72 - 1, 2, 2, 0.2);
    }
    const hand = (turn, len, width) => stroke(ctx, [[x, y], [x + Math.sin(turn * Math.PI * 2) * r * len, y - Math.cos(turn * Math.PI * 2) * r * len]], width, 0.1);
    hand((11 + 59 / 60) / 12, 0.45, Math.max(2, r * 0.12));
    hand(59 / 60, 0.7, Math.max(1.5, r * 0.07));
  },

  // 천장 형광등: { x, y, w, on }
  tube(ctx, o, F) {
    const x = F.x(o.x);
    const y = F.y(o.y);
    const w = F.x(o.w ?? 12);
    box(ctx, x - w / 2, y, w, Math.max(2, F.s(1)), o.on ? 0.96 : 0.26);
    if (o.on) light(ctx, x, y, w * 1.2, 0.2, 0.6);
  },

  // 손전등 빛줄기: { x1, y1, x2, y2, w(끝 너비%), a }
  beam(ctx, o, F) {
    const x1 = F.x(o.x1);
    const y1 = F.y(o.y1);
    const x2 = F.x(o.x2);
    const y2 = F.y(o.y2);
    const w2 = F.s(o.w ?? 18) / 2;
    const ang = Math.atan2(y2 - y1, x2 - x1) + Math.PI / 2;
    const dx = Math.cos(ang);
    const dy = Math.sin(ang);
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(x1, y1, x2, y2);
    g.addColorStop(0, `rgba(255,255,255,${o.a ?? 0.4})`);
    g.addColorStop(1, 'rgba(255,255,255,0.02)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x1 - dx * 2, y1 - dy * 2);
    ctx.lineTo(x1 + dx * 2, y1 + dy * 2);
    ctx.lineTo(x2 + dx * w2, y2 + dy * w2);
    ctx.lineTo(x2 - dx * w2, y2 - dy * w2);
    ctx.closePath();
    ctx.fill();
  },

  // 놋쇠 책갈피: { x, y, s, rot }
  bookmark(ctx, o, F) {
    const s = F.s(o.s ?? 5);
    light(ctx, F.x(o.x), F.y(o.y), s * 1.6, 0.25);
    ctx.translate(F.x(o.x), F.y(o.y));
    ctx.rotate(((o.rot ?? 20) * Math.PI) / 180);
    shape(ctx, [[-s * 0.16, -s * 0.5], [s * 0.16, -s * 0.5], [s * 0.16, s * 0.5], [0, s * 0.36], [-s * 0.16, s * 0.5]], 0.86);
    disc(ctx, 0, -s * 0.36, s * 0.06, 0.2);
    stroke(ctx, [[0, -s * 0.5], [s * 0.1, -s * 0.8], [s * 0.02, -s * 0.95]], 1, 0.7);
  },

  // 글자(디더링 전에 그려지므로 크게): { x, y, text, size, tone, align }
  text(ctx, o, F) {
    ctx.fillStyle = gray(o.tone ?? 0.8);
    ctx.font = `700 ${Math.round(F.s(o.size ?? 5))}px Galmuri11, sans-serif`;
    ctx.textAlign = o.align ?? 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(o.text ?? '', F.x(o.x), F.y(o.y));
  },

  // 사람: { who(사진 번호 또는 외형 키), x(가운데), y(발), h(키), pose, face(1/-1), props, light }
  person(ctx, o, F, env) {
    const look = (env.looks && env.looks[o.who]) || {};
    drawFigure(ctx, o, look, F);
  },
};

// =========================================================
// 사람 실루엣 그리기 — 관절 좌표로 자세를 만든다
// 좌표 단위 u = 키. 발밑이 (0,0), 위쪽이 음수. 오른쪽을 보는 자세 기준
// =========================================================
const BASE_POSE = {
  head: [0.01, -0.915], sh: -0.79, shX: 0, hip: -0.48, lean: 0,
  aF: [0.14, -0.62, 0.15, -0.46], aB: [-0.14, -0.62, -0.15, -0.46],
  lF: [0.06, -0.25, 0.065, 0], lB: [-0.06, -0.25, -0.065, 0],
};

// 자세 목록(바뀌는 관절만 적는다). aF/aB: 앞·뒤 팔 [팔꿈치x,y, 손x,y], lF/lB: 다리 [무릎, 발]
const POSES = {
  stand: {},
  reach: { aF: [0.24, -0.74, 0.36, -0.72] },
  high: { aF: [0.2, -0.88, 0.3, -0.96] },
  phone: { aF: [0.17, -0.64, 0.08, -0.875] },
  push: { lean: 0.12, aF: [0.2, -0.9, 0.25, -1.0], aB: [0.06, -0.64, 0.22, -0.6], lF: [0.08, -0.25, 0.12, 0], lB: [-0.08, -0.24, -0.16, 0] },
  pull: { lean: 0.08, aF: [0.17, -0.64, 0.21, -0.5], aB: [-0.22, -0.68, -0.34, -0.62], lF: [0.12, -0.26, 0.17, 0], lB: [-0.1, -0.24, -0.18, -0.01] },
  lookback: { aF: [0.15, -0.64, 0.13, -0.56], aB: [-0.21, -0.66, -0.32, -0.6] },
  crouch: { head: [0.03, -0.665], sh: -0.56, hip: -0.27, aF: [0.15, -0.47, 0.08, -0.64], aB: [-0.05, -0.42, 0.1, -0.37], lF: [0.15, -0.33, 0.09, 0], lB: [0.04, -0.29, -0.03, 0] },
  slump: { head: [0.28, -0.53], sh: -0.5, shX: 0.17, hip: -0.3, aF: [0.27, -0.45, 0.37, -0.47], aB: [0.22, -0.45, 0.33, -0.465], lF: [0.17, -0.31, 0.17, 0], lB: [0.15, -0.29, 0.14, 0] },
  lamp: { aF: [0.22, -0.7, 0.33, -0.64], aB: [0.08, -0.64, 0.2, -0.66] },
  key: { aF: [0.18, -0.66, 0.27, -0.62] },
  truck: { lean: 0.08, aF: [0.2, -0.64, 0.3, -0.56], aB: [0.06, -0.62, 0.24, -0.56] },
  read: { aF: [0.15, -0.63, 0.11, -0.6], aB: [-0.06, -0.63, 0.01, -0.6] },
  sitFloor: { head: [-0.05, -0.6], sh: -0.5, shX: -0.04, hip: -0.17, aF: [0.06, -0.35, 0.16, -0.22], aB: [-0.1, -0.35, 0.04, -0.22], lF: [0.25, -0.12, 0.44, -0.03], lB: [0.22, -0.1, 0.42, 0] },
  card: { aF: [0.22, -0.7, 0.33, -0.66], aB: [-0.12, -0.62, -0.08, -0.5] },
  stop: { lean: 0.06, aF: [0.25, -0.78, 0.38, -0.8] },
};

// 외형 기본값
const DEFAULT_LOOK = {
  hair: 'short', hairTone: 0.12, hat: null, glasses: false,
  top: 'shirt', topTone: 0.6, bottom: 0.3, skin: 0.84, extras: [],
};

// 사람 한 명을 그린다
function drawFigure(ctx, o, look, F) {
  const L = { ...DEFAULT_LOOK, ...look };
  const P = { ...BASE_POSE, ...(POSES[o.pose] || {}) };
  const u = F.s(o.h ?? 50);
  const k = o.light ?? 1; // 전체 밝기 배율
  const T = (v) => clamp(v * k, 0, 1);
  const props = new Set([...(L.extras || []), ...(o.props || [])]);
  const big = L.top === 'jacket';

  ctx.translate(F.x(o.x), F.y(o.y));
  if (o.face === -1) ctx.scale(-1, 1);

  // 상체 기울이기(엉덩이를 축으로 회전)
  const piv = [0, P.hip * u];
  const rot = (x, y) => {
    const s = Math.sin(P.lean);
    const c = Math.cos(P.lean);
    const dx = x - piv[0];
    const dy = y - piv[1];
    return [piv[0] + dx * c - dy * s, piv[1] + dx * s + dy * c];
  };

  const sw = (big ? 0.155 : 0.12) * u; // 어깨 반폭
  const hw = 0.085 * u; // 엉덩이 반폭
  const r = 0.068 * u; // 머리 반지름
  const shC = rot(P.shX * u, P.sh * u);
  const head = rot(P.head[0] * u, P.head[1] * u);
  const armOf = (a, sx) => [rot(P.shX * u + sx, P.sh * u + 0.03 * u), rot(a[0] * u, a[1] * u), rot(a[2] * u, a[3] * u)];
  const armF = armOf(P.aF, sw * 0.75);
  const armB = armOf(P.aB, -sw * 0.75);
  const legOf = (l, sx) => [[sx, P.hip * u], [l[0] * u, l[1] * u], [l[2] * u, l[3] * u]];
  const legF = legOf(P.lF, hw * 0.55);
  const legB = legOf(P.lB, -hw * 0.55);

  const aw = (big ? 0.088 : 0.066) * u;
  const lw = 0.082 * u;
  const skin = T(L.skin);
  const topV = T(L.topTone);
  const shirtV = T(L.shirt ?? 0.86);
  const sleeveV = ['vest', 'knit'].includes(L.top) ? shirtV : topV;
  const handV = props.has('gloves') ? T(0.55) : skin;

  // 팔 하나 그리기(반팔이면 아래팔은 피부색)
  const drawArm = (arm, back) => {
    const sv = back ? sleeveV * 0.86 : sleeveV;
    if (L.top === 'tee') {
      stroke(ctx, [arm[0], arm[1]], aw, sv);
      stroke(ctx, [arm[1], arm[2]], aw * 0.85, back ? skin * 0.9 : skin);
    } else {
      stroke(ctx, arm, aw, sv);
      if (big) stroke(ctx, [lerp(arm[1], arm[2], 0.75), arm[2]], aw * 1.05, T(0.5));
    }
    if (props.has('gloves')) stroke(ctx, [lerp(arm[1], arm[2], 0.4), arm[2]], aw * 0.9, handV);
    disc(ctx, arm[2][0], arm[2][1], 0.03 * u, back ? handV * 0.9 : handV);
  };

  // 다리 하나 그리기
  const drawLeg = (leg, back) => {
    stroke(ctx, leg, lw, T(L.bottom) * (back ? 0.85 : 1));
    disc(ctx, leg[2][0] + 0.02 * u, leg[2][1] - 0.01 * u, 0.035 * u, 0.08);
  };

  // 1. 등 뒤로 늘어진 긴 머리
  if (L.hair === 'long' && !L.hat) {
    shape(ctx, [[head[0] - r * 1.1, head[1]], [head[0] + r * 0.2, head[1]], [shC[0] - sw * 0.1, shC[1] + 0.24 * u], [shC[0] - sw * 1.05, shC[1] + 0.24 * u]], T(L.hairTone));
  }
  if (L.top === 'hoodie') disc(ctx, shC[0] - 0.05 * u, shC[1] + 0.01 * u, 0.065 * u, T(L.topTone - 0.1));

  // 2. 뒤쪽 팔·다리
  drawArm(armB, true);
  drawLeg(legB, true);
  drawLeg(legF, false);

  // 3. 몸통
  const shL = rot(P.shX * u - sw, P.sh * u);
  const shR = rot(P.shX * u + sw, P.sh * u);
  let hipL = [-hw, P.hip * u];
  let hipR = [hw, P.hip * u];
  if (big) {
    hipL = [-hw * 1.35, P.hip * u + 0.06 * u];
    hipR = [hw * 1.35, P.hip * u + 0.06 * u];
  }
  if (L.top === 'coat') {
    hipL = [-hw * 1.4, -0.2 * u];
    hipR = [hw * 1.4, -0.2 * u];
  }
  shape(ctx, [shL, shR, hipR, hipL], topV);
  drawTopDetails(ctx, L, { shL, shR, hipL, hipR, shC, u }, T);

  // 4. 목과 머리
  const neckEnd = lerp(shC, head, 0.55);
  stroke(ctx, [shC, neckEnd], 0.05 * u, skin * 0.92);
  const slumped = o.pose === 'slump';
  if (!slumped) drawHead(ctx, L, head, r, T, o.back);

  // 5. 앞쪽 팔과 소품
  drawArm(armF, false);
  if (slumped) drawHead(ctx, L, head, r, T, o.back);
  drawProps(ctx, props, { armF, armB, shC, sw, hw, u, P, o }, T);
}

// 두 점 사이의 점
function lerp(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

// 옷의 세부(조끼 반사띠, 카디건 앞섶 등)
function drawTopDetails(ctx, L, g, T) {
  const { shL, shR, hipL, hipR, shC, u } = g;
  const band = (t, thick, v) => {
    const a = lerp(shL, hipL, t);
    const b = lerp(shR, hipR, t);
    const a2 = lerp(shL, hipL, t + thick);
    const b2 = lerp(shR, hipR, t + thick);
    shape(ctx, [a, b, b2, a2], v);
  };
  switch (L.top) {
    case 'vest': // 미화 조끼: 반사띠 두 줄
      band(0.3, 0.07, T(0.98));
      band(0.62, 0.07, T(0.98));
      break;
    case 'knit': // 니트 조끼: V넥 안에 셔츠
      shape(ctx, [[shC[0] - 0.04 * u, shC[1]], [shC[0] + 0.05 * u, shC[1]], [shC[0] + 0.005 * u, shC[1] + 0.12 * u]], T(L.shirt ?? 0.86));
      break;
    case 'cardigan': // 카디건: 가운데 셔츠
      shape(ctx, [[shC[0] - 0.02 * u, shC[1]], [shC[0] + 0.035 * u, shC[1]], [lerp(hipL, hipR, 0.6)[0], hipL[1]], [lerp(hipL, hipR, 0.45)[0], hipL[1]]], T(L.shirt ?? 0.86));
      break;
    case 'uniform': // 경비 제복: 옷깃과 허리띠
      shape(ctx, [[shC[0] - 0.05 * u, shC[1]], [shC[0] + 0.06 * u, shC[1]], [shC[0] + 0.005 * u, shC[1] + 0.08 * u]], T(0.66));
      band(0.88, 0.07, T(0.14));
      break;
    case 'jacket': // 과잠: 밑단 고무줄
      band(0.9, 0.1, T(0.5));
      break;
    case 'coat': // 트렌치코트: 허리띠
      band(0.47, 0.05, T(L.topTone - 0.2));
      break;
    case 'hoodie': // 후드티: 끈
      stroke(ctx, [[shC[0] + 0.015 * u, shC[1] + 0.01 * u], [shC[0] + 0.02 * u, shC[1] + 0.1 * u]], Math.max(1, 0.01 * u), T(0.92));
      stroke(ctx, [[shC[0] + 0.05 * u, shC[1] + 0.01 * u], [shC[0] + 0.055 * u, shC[1] + 0.09 * u]], Math.max(1, 0.01 * u), T(0.92));
      break;
    default:
      break;
  }
}

// 머리(얼굴·머리카락·모자·안경)
function drawHead(ctx, L, head, r, T, back) {
  const [hx, hy] = head;
  const hairV = T(L.hairTone);
  const skin = T(L.skin);
  disc(ctx, hx, hy, r, skin);

  // 머리카락 뭉치 → 얼굴(앞쪽) 다시 그리기
  const face = (ox, oy, rr) => {
    if (!back) disc(ctx, hx + r * ox, hy + r * oy, r * rr, skin);
  };
  if (!L.hat || L.hat === 'cap') {
    switch (L.hair) {
      case 'buzz':
        disc(ctx, hx - r * 0.08, hy - r * 0.12, r * 0.98, T(0.34));
        face(0.12, 0.18, 0.86);
        break;
      case 'crop':
        disc(ctx, hx - r * 0.1, hy - r * 0.06, r * 1.08, hairV);
        box(ctx, hx - r * 1.15, hy, r * 1.1, r * 0.75, hairV);
        face(0.22, 0.14, 0.8);
        break;
      case 'bob':
      case 'long':
        disc(ctx, hx - r * 0.08, hy - r * 0.05, r * 1.15, hairV);
        box(ctx, hx - r * 1.2, hy, r * 1.55, r * 0.95, hairV);
        face(0.26, 0.12, 0.78);
        break;
      case 'pony':
        ctx.save();
        ctx.translate(hx - r * 1.2, hy + r * 0.2);
        ctx.rotate(0.45);
        ctx.fillStyle = gray(hairV);
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 0.32, r * 0.72, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        disc(ctx, hx - r * 0.12, hy - r * 0.1, r * 1.04, hairV);
        face(0.2, 0.14, 0.82);
        break;
      case 'tied':
        disc(ctx, hx - r * 1.05, hy + r * 0.5, r * 0.42, hairV);
        disc(ctx, hx - r * 0.12, hy - r * 0.1, r * 1.04, hairV);
        face(0.2, 0.14, 0.82);
        break;
      default: // short
        disc(ctx, hx - r * 0.12, hy - r * 0.1, r * 1.04, hairV);
        face(0.2, 0.14, 0.82);
        break;
    }
  } else if (!back) {
    face(0.15, 0.1, 0.9);
  }
  if (back) disc(ctx, hx, hy, r * 1.02, hairV);

  // 모자
  if (L.hat === 'cap') {
    shape(ctx, [[hx - r * 1.0, hy - r * 0.5], [hx - r * 1.1, hy - r * 1.18], [hx + r * 0.95, hy - r * 1.18], [hx + r * 0.9, hy - r * 0.5]], T(0.26));
    box(ctx, hx - r * 1.0, hy - r * 0.66, r * 1.95, r * 0.2, T(0.16));
    shape(ctx, [[hx + r * 0.55, hy - r * 0.52], [hx + r * 1.55, hy - r * 0.34], [hx + r * 0.55, hy - r * 0.34]], T(0.12));
    disc(ctx, hx + r * 0.2, hy - r * 0.88, r * 0.17, T(0.92));
  } else if (L.hat === 'beanie') {
    ctx.fillStyle = gray(T(0.38));
    ctx.beginPath();
    ctx.arc(hx - r * 0.05, hy - r * 0.2, r * 1.1, Math.PI, Math.PI * 2);
    ctx.fill();
    box(ctx, hx - r * 1.15, hy - r * 0.38, r * 2.25, r * 0.34, T(0.48));
  } else if (L.hat === 'scarf') {
    ctx.fillStyle = gray(T(0.8));
    ctx.beginPath();
    ctx.arc(hx - r * 0.05, hy - r * 0.12, r * 1.13, Math.PI * 0.95, Math.PI * 2.02);
    ctx.fill();
    shape(ctx, [[hx - r * 1.0, hy - r * 0.2], [hx - r * 1.65, hy + r * 0.5], [hx - r * 1.2, hy + r * 0.62]], T(0.72));
  }

  // 안경·이어폰
  if (L.glasses && !back) {
    ctx.strokeStyle = gray(0.08);
    ctx.lineWidth = Math.max(1.2, r * 0.14);
    ctx.strokeRect(hx + r * 0.42, hy - r * 0.16, r * 0.46, r * 0.3);
    stroke(ctx, [[hx + r * 0.42, hy - r * 0.04], [hx - r * 0.2, hy - r * 0.1]], Math.max(1, r * 0.1), 0.08);
  }
  if ((L.extras || []).includes('earbuds')) disc(ctx, hx - r * 0.02, hy + r * 0.08, r * 0.2, T(0.99));
}

// 손에 든 물건과 몸에 단 것
function drawProps(ctx, props, g, T) {
  const { armF, armB, shC, sw, hw, u, P, o } = g;
  const hF = armF[2];
  const hB = armB[2];
  if (props.has('badge')) {
    stroke(ctx, [[shC[0] - 0.03 * u, shC[1]], [shC[0] + 0.02 * u, shC[1] + 0.13 * u], [shC[0] + 0.06 * u, shC[1]]], Math.max(1, 0.008 * u), T(0.8));
    box(ctx, shC[0] - 0.005 * u, shC[1] + 0.12 * u, 0.05 * u, 0.065 * u, T(0.96));
  }
  if (props.has('nametag')) box(ctx, shC[0] + 0.03 * u, shC[1] + 0.07 * u, 0.07 * u, 0.03 * u, T(0.97));
  if (props.has('radio')) {
    box(ctx, hw * 0.4, P.hip * u - 0.13 * u, 0.035 * u, 0.08 * u, T(0.14));
    stroke(ctx, [[hw * 0.4 + 0.03 * u, P.hip * u - 0.13 * u], [hw * 0.4 + 0.035 * u, P.hip * u - 0.19 * u]], Math.max(1, 0.008 * u), T(0.3));
  }
  if (props.has('draft')) {
    ctx.save();
    ctx.translate(shC[0] - sw * 0.85, shC[1] + 0.16 * u);
    ctx.rotate(-0.15);
    box(ctx, -0.035 * u, -0.06 * u, 0.07 * u, 0.12 * u, T(0.95));
    box(ctx, -0.025 * u, -0.04 * u, 0.05 * u, 1, T(0.5));
    ctx.restore();
  }
  if (props.has('phone')) {
    box(ctx, hF[0] - 0.016 * u, hF[1] - 0.035 * u, 0.032 * u, 0.06 * u, T(0.1));
    box(ctx, hF[0] - 0.011 * u, hF[1] - 0.03 * u, 0.022 * u, 0.05 * u, o.phoneLit ? 0.92 : T(0.3));
    if (o.phoneLit) light(ctx, hF[0], hF[1], 0.08 * u, 0.3);
  }
  if (props.has('card')) box(ctx, hF[0] - 0.02 * u, hF[1] - 0.015 * u, 0.04 * u, 0.025 * u, T(0.96));
  if (props.has('keys')) {
    ctx.strokeStyle = gray(T(0.85));
    ctx.lineWidth = Math.max(1, 0.008 * u);
    ctx.beginPath();
    ctx.arc(hF[0] + 0.01 * u, hF[1] + 0.025 * u, 0.02 * u, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (props.has('bag')) {
    stroke(ctx, [hB, [hB[0], hB[1] + 0.03 * u]], Math.max(1, 0.01 * u), T(0.3));
    box(ctx, hB[0] - 0.065 * u, hB[1] + 0.03 * u, 0.13 * u, 0.15 * u, T(0.42));
    box(ctx, hB[0] - 0.04 * u, hB[1] + 0.09 * u, 0.08 * u, 0.05 * u, T(0.32));
  }
  if (props.has('book')) box(ctx, hB[0] - 0.03 * u, hB[1] - 0.05 * u, 0.06 * u, 0.08 * u, T(0.78));
  if (props.has('books')) {
    box(ctx, hB[0] - 0.05 * u, hB[1] - 0.06 * u, 0.1 * u, 0.03 * u, T(0.6));
    box(ctx, hB[0] - 0.045 * u, hB[1] - 0.03 * u, 0.09 * u, 0.03 * u, T(0.78));
  }
  if (props.has('openbook')) {
    const m = lerp(hF, hB, 0.5);
    box(ctx, m[0] - 0.075 * u, m[1] - 0.04 * u, 0.15 * u, 0.065 * u, T(0.96));
    box(ctx, m[0] - 1, m[1] - 0.04 * u, 2, 0.065 * u, T(0.4));
  }
  if (props.has('flashlight')) {
    const hand = o.lightHand === 'F' ? hF : hB;
    const dir = o.beam || [0.9, 0.3];
    box(ctx, hand[0] - 0.01 * u, hand[1] - 0.012 * u, 0.05 * u, 0.024 * u, T(0.2));
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const ex = hand[0] + dir[0] * u;
    const ey = hand[1] + dir[1] * u;
    const gr = ctx.createLinearGradient(hand[0], hand[1], ex, ey);
    gr.addColorStop(0, 'rgba(255,255,255,0.5)');
    gr.addColorStop(1, 'rgba(255,255,255,0.03)');
    ctx.fillStyle = gr;
    const ang = Math.atan2(ey - hand[1], ex - hand[0]) + Math.PI / 2;
    const spread = 0.22 * u;
    ctx.beginPath();
    ctx.moveTo(hand[0] + 0.04 * u, hand[1]);
    ctx.lineTo(ex + Math.cos(ang) * spread, ey + Math.sin(ang) * spread);
    ctx.lineTo(ex - Math.cos(ang) * spread, ey - Math.sin(ang) * spread);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

// =========================================================
// CCTV 얼굴 사진(정면 상반신) — 기록부 사진 탭에 쓰인다
// =========================================================
export function drawBust(ctx, look, opts = {}) {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  const L = { ...DEFAULT_LOOK, ...(look || {}) };
  const rnd = seeded(opts.seed ?? 1);

  // 배경: 게이트 천장 조명 아래, 위가 밝다
  const bgr = ctx.createLinearGradient(0, 0, 0, H);
  bgr.addColorStop(0, gray(0.36));
  bgr.addColorStop(1, gray(0.12));
  ctx.fillStyle = bgr;
  ctx.fillRect(0, 0, W, H);
  box(ctx, W * 0.02, H * 0.38, W * 0.1, H * 0.62, 0.22);
  box(ctx, W * 0.88, H * 0.38, W * 0.1, H * 0.62, 0.22);

  const cx = W * 0.5 + (rnd() - 0.5) * W * 0.04;
  const cy = H * 0.42 + (rnd() - 0.5) * H * 0.02;
  const rx = W * (0.145 + rnd() * 0.015);
  const ry = W * (0.185 + rnd() * 0.015);
  const big = L.top === 'jacket';
  const hairV = L.hairTone;

  // 뒤로 넘긴 머리(포니테일·긴 머리)
  if (L.hair === 'pony' && !L.hat) {
    ctx.fillStyle = gray(hairV);
    ctx.beginPath();
    ctx.ellipse(cx + rx * 1.1, cy + ry * 0.55, rx * 0.22, ry * 0.5, -0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  if ((L.hair === 'long' || L.hair === 'bob') && !L.hat) {
    ctx.fillStyle = gray(hairV);
    ctx.beginPath();
    ctx.ellipse(cx, cy - ry * 0.08, rx * 1.28, ry * 1.08, 0, 0, Math.PI * 2);
    ctx.fill();
    box(ctx, cx - rx * 1.28, cy, rx * 2.56, ry * (L.hair === 'long' ? 1.5 : 0.78), hairV);
  }

  // 어깨(상의)
  const sx = big ? 0.5 : 0.46;
  ctx.fillStyle = gray(['vest', 'knit'].includes(L.top) ? L.shirt ?? 0.86 : L.topTone);
  ctx.beginPath();
  ctx.moveTo(cx - W * sx, H);
  ctx.bezierCurveTo(cx - W * (sx - 0.02), H * 0.8, cx - W * 0.32, H * (big ? 0.7 : 0.73), cx - W * 0.12, H * 0.69);
  ctx.lineTo(cx + W * 0.12, H * 0.69);
  ctx.bezierCurveTo(cx + W * 0.32, H * (big ? 0.7 : 0.73), cx + W * (sx - 0.02), H * 0.8, cx + W * sx, H);
  ctx.closePath();
  ctx.fill();

  // 목
  box(ctx, cx - W * 0.05, cy + ry * 0.62, W * 0.1, H * 0.16, L.skin - 0.1);

  // 옷깃·조끼 등
  drawCollar(ctx, L, { cx, W, H, rnd });

  // 긴 머리는 어깨 위로 흘러내린다
  if (L.hair === 'long' && !L.hat) {
    box(ctx, cx - rx * 1.32, cy - ry * 0.1, rx * 0.5, H * 0.5, hairV);
    box(ctx, cx + rx * 0.82, cy - ry * 0.1, rx * 0.5, H * 0.5, hairV);
  }

  // 얼굴과 귀
  ctx.fillStyle = gray(L.skin - 0.06);
  ctx.beginPath();
  ctx.ellipse(cx - rx * 0.98, cy + ry * 0.06, rx * 0.15, ry * 0.2, 0, 0, Math.PI * 2);
  ctx.ellipse(cx + rx * 0.98, cy + ry * 0.06, rx * 0.15, ry * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = gray(L.skin);
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  light(ctx, cx - rx * 0.3, cy - ry * 0.4, rx * 1.2, 0.1);

  // 머리카락(앞)
  drawFrontHair(ctx, L, { cx, cy, rx, ry, W });

  // 이목구비
  const eyeY = cy - ry * 0.02;
  for (const s of [-1, 1]) {
    ctx.fillStyle = gray(0.1);
    ctx.beginPath();
    ctx.ellipse(cx + s * rx * 0.4, eyeY, rx * 0.12, ry * 0.055, 0, 0, Math.PI * 2);
    ctx.fill();
    if (!L.hat || L.hat === 'scarf') box(ctx, cx + s * rx * 0.4 - rx * 0.17, eyeY - ry * 0.2, rx * 0.34, Math.max(1.5, ry * 0.05), 0.2);
  }
  stroke(ctx, [[cx + rx * 0.02, cy + ry * 0.04], [cx + rx * 0.08, cy + ry * 0.3], [cx - rx * 0.06, cy + ry * 0.33]], Math.max(1, rx * 0.05), 0.5);
  stroke(ctx, [[cx - rx * 0.24, cy + ry * 0.55], [cx + rx * 0.24, cy + ry * 0.55]], Math.max(1.2, ry * 0.04), 0.38);

  // 모자
  drawHat(ctx, L, { cx, cy, rx, ry });

  // 안경·이어폰
  if (L.glasses) {
    ctx.strokeStyle = gray(0.06);
    ctx.lineWidth = Math.max(1.5, rx * 0.07);
    for (const s of [-1, 1]) ctx.strokeRect(cx + s * rx * 0.4 - rx * 0.28, eyeY - ry * 0.13, rx * 0.56, ry * 0.26);
    stroke(ctx, [[cx - rx * 0.12, eyeY - ry * 0.02], [cx + rx * 0.12, eyeY - ry * 0.02]], Math.max(1, rx * 0.05), 0.06);
  }
  if ((L.extras || []).includes('earbuds')) {
    for (const s of [-1, 1]) {
      disc(ctx, cx + s * rx * 1.02, cy + ry * 0.16, rx * 0.17, 0.06);
      disc(ctx, cx + s * rx * 1.02, cy + ry * 0.16, rx * 0.1, 0.99);
    }
  }
}

// 상의 옷깃(정면)
function drawCollar(ctx, L, g) {
  const { cx, W, H, rnd } = g;
  const neckV = (pts, v) => shape(ctx, pts, v);
  switch (L.top) {
    case 'uniform':
      neckV([[cx - W * 0.08, H * 0.69], [cx + W * 0.08, H * 0.69], [cx, H * 0.84]], 0.86);
      neckV([[cx - W * 0.02, H * 0.75], [cx + W * 0.02, H * 0.75], [cx + W * 0.025, H], [cx - W * 0.025, H]], 0.18);
      box(ctx, cx - W * 0.4, H * 0.76, W * 0.14, H * 0.04, L.topTone + 0.14);
      box(ctx, cx + W * 0.26, H * 0.76, W * 0.14, H * 0.04, L.topTone + 0.14);
      box(ctx, cx + W * 0.13, H * 0.86, W * 0.14, H * 0.045, 0.97);
      break;
    case 'vest':
      for (const s of [-1, 1]) {
        shape(ctx, [[cx + s * W * 0.07, H * 0.72], [cx + s * W * 0.34, H * 0.76], [cx + s * W * 0.4, H], [cx + s * W * 0.08, H]], L.topTone);
        box(ctx, cx + (s > 0 ? W * 0.085 : -W * 0.39), H * 0.86, W * 0.305, H * 0.035, 0.98);
        box(ctx, cx + (s > 0 ? W * 0.085 : -W * 0.39), H * 0.94, W * 0.305, H * 0.035, 0.98);
      }
      break;
    case 'cardigan':
      neckV([[cx - W * 0.09, H * 0.69], [cx + W * 0.09, H * 0.69], [cx + W * 0.03, H], [cx - W * 0.03, H]], L.shirt ?? 0.88);
      stroke(ctx, [[cx - W * 0.07, H * 0.69], [cx + W * 0.02, H * 0.88], [cx + W * 0.08, H * 0.69]], 1.2, 0.8);
      box(ctx, cx - W * 0.01, H * 0.87, W * 0.075, H * 0.1, 0.97);
      break;
    case 'knit':
      neckV([[cx - W * 0.42, H], [cx - W * 0.3, H * 0.76], [cx - W * 0.07, H * 0.72], [cx, H * 0.86], [cx + W * 0.07, H * 0.72], [cx + W * 0.3, H * 0.76], [cx + W * 0.42, H]], L.topTone);
      for (let i = 0; i < 14; i++) box(ctx, cx - W * 0.3 + rnd() * W * 0.6, H * 0.8 + rnd() * H * 0.18, 2, 2, L.topTone + 0.2);
      break;
    case 'tee':
      ctx.strokeStyle = gray(0.62);
      ctx.lineWidth = Math.max(1.5, W * 0.015);
      ctx.beginPath();
      ctx.arc(cx, H * 0.66, W * 0.1, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
      break;
    case 'hoodie':
      ctx.strokeStyle = gray(L.topTone - 0.12);
      ctx.lineWidth = W * 0.05;
      ctx.beginPath();
      ctx.arc(cx, H * 0.66, W * 0.12, Math.PI * 0.05, Math.PI * 0.95);
      ctx.stroke();
      stroke(ctx, [[cx - W * 0.04, H * 0.76], [cx - W * 0.045, H * 0.9]], 1.5, 0.92);
      stroke(ctx, [[cx + W * 0.04, H * 0.76], [cx + W * 0.045, H * 0.9]], 1.5, 0.92);
      box(ctx, cx + W * 0.16, H * 0.86, W * 0.15, H * 0.045, 0.97);
      break;
    case 'jacket':
      ctx.strokeStyle = gray(0.56);
      ctx.lineWidth = W * 0.035;
      ctx.beginPath();
      ctx.arc(cx, H * 0.67, W * 0.12, Math.PI * 0.02, Math.PI * 0.98);
      ctx.stroke();
      for (let i = 0; i < 3; i++) disc(ctx, cx + W * 0.005, H * (0.84 + i * 0.07), W * 0.012, 0.82);
      break;
    case 'coat':
      for (const s of [-1, 1]) neckV([[cx + s * W * 0.04, H * 0.7], [cx + s * W * 0.2, H * 0.7], [cx + s * W * 0.06, H * 0.95]], L.topTone - 0.14);
      break;
    default:
      neckV([[cx - W * 0.08, H * 0.69], [cx + W * 0.08, H * 0.69], [cx, H * 0.79]], 0.86);
      break;
  }
}

// 머리카락(정면)
function drawFrontHair(ctx, L, g) {
  if (L.hat && L.hat !== 'cap') return;
  const { cx, cy, rx, ry } = g;
  const v = L.hairTone;
  // 이마선 위만 칠한다
  const cap = (lineY, scale, tone = v) => {
    ctx.save();
    ctx.beginPath();
    ctx.rect(cx - rx * 2, cy - ry * 2, rx * 4, ry * 2 + lineY);
    ctx.clip();
    ctx.fillStyle = gray(tone);
    ctx.beginPath();
    ctx.ellipse(cx, cy - ry * 0.12, rx * scale, ry * 0.98, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };
  switch (L.hair) {
    case 'buzz':
      cap(-ry * 0.5, 1.03, 0.34);
      break;
    case 'crop':
      cap(-ry * 0.32, 1.1);
      box(ctx, cx - rx * 1.1, cy - ry * 0.4, rx * 0.2, ry * 0.7, v);
      box(ctx, cx + rx * 0.9, cy - ry * 0.4, rx * 0.2, ry * 0.7, v);
      break;
    case 'bob':
    case 'long':
      cap(-ry * 0.34, 1.08);
      break;
    case 'pony':
    case 'tied':
      if (L.hair === 'tied') disc(ctx, cx + rx * 0.5, cy - ry * 0.92, rx * 0.32, v);
      cap(-ry * 0.46, 1.05);
      stroke(ctx, [[cx - rx * 0.05, cy - ry * 1.05], [cx - rx * 0.12, cy - ry * 0.5]], Math.max(1, rx * 0.05), L.skin - 0.1);
      break;
    default:
      cap(-ry * 0.44, 1.07);
      box(ctx, cx - rx * 1.04, cy - ry * 0.5, rx * 0.16, ry * 0.42, v);
      box(ctx, cx + rx * 0.88, cy - ry * 0.5, rx * 0.16, ry * 0.42, v);
      break;
  }
}

// 모자(정면)
function drawHat(ctx, L, g) {
  const { cx, cy, rx, ry } = g;
  if (L.hat === 'cap') {
    shape(ctx, [[cx - rx * 1.12, cy - ry * 0.56], [cx - rx * 1.3, cy - ry * 1.22], [cx + rx * 1.3, cy - ry * 1.22], [cx + rx * 1.12, cy - ry * 0.56]], 0.24);
    box(ctx, cx - rx * 1.14, cy - ry * 0.7, rx * 2.28, ry * 0.16, 0.14);
    ctx.fillStyle = gray(0.07);
    ctx.beginPath();
    ctx.ellipse(cx, cy - ry * 0.52, rx * 1.05, ry * 0.12, 0, 0, Math.PI);
    ctx.fill();
    shape(ctx, [[cx, cy - ry * 1.08], [cx + rx * 0.14, cy - ry * 0.92], [cx, cy - ry * 0.78], [cx - rx * 0.14, cy - ry * 0.92]], 0.92);
  } else if (L.hat === 'beanie') {
    ctx.fillStyle = gray(0.14);
    ctx.beginPath();
    ctx.ellipse(cx, cy - ry * 0.36, rx * 1.14, ry * 0.92, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    box(ctx, cx - rx * 1.16, cy - ry * 0.52, rx * 2.32, ry * 0.28, 0.6);
    for (let i = 1; i < 9; i++) box(ctx, cx - rx * 1.16 + (rx * 2.32 * i) / 9, cy - ry * 0.52, 1, ry * 0.28, 0.3);
  } else if (L.hat === 'scarf') {
    ctx.fillStyle = gray(0.8);
    ctx.beginPath();
    ctx.ellipse(cx, cy - ry * 0.3, rx * 1.14, ry * 0.92, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    box(ctx, cx - rx * 1.14, cy - ry * 0.42, rx * 2.28, ry * 0.14, 0.66);
    shape(ctx, [[cx + rx * 0.7, cy - ry * 1.0], [cx + rx * 1.3, cy - ry * 1.3], [cx + rx * 1.1, cy - ry * 0.8]], 0.72);
  }
}

// =========================================================
// 첫 화면 건물 실루엣: spec.form 으로 모양을 고른다
// open: 열린 건물(창문에 불), 아니면 검은 실루엣
// =========================================================
const FORMS = {
  // 대학 본관: 가운데 탑 + 양 날개
  tower: [[0.38, 0.14, 0.24, 0.76], [0.12, 0.44, 0.76, 0.46], [0.48, 0.06, 0.04, 0.08]],
  // 수덕전: 낮고 넓은 건물 + 지붕
  hall: [[0.1, 0.5, 0.8, 0.4], [0.22, 0.4, 0.56, 0.1]],
  // 중앙도서관: 높은 동 + 낮은 날개(층별 안내도의 L자 배치)
  library: [[0.46, 0.16, 0.38, 0.74], [0.12, 0.42, 0.72, 0.48]],
  // 행복기숙사: 쌍둥이 동
  twin: [[0.16, 0.18, 0.26, 0.72], [0.56, 0.24, 0.26, 0.66], [0.42, 0.56, 0.14, 0.34]],
  // 국제관: 계단식
  stack: [[0.18, 0.52, 0.64, 0.38], [0.27, 0.36, 0.46, 0.16], [0.36, 0.22, 0.28, 0.14]],
};

// 건물 카드 그림을 그린다
export function drawBuilding(ctx, spec, { open, seed = 1 }) {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  const rnd = seeded(seed);
  const ground = H * 0.9;

  // 밤하늘: 위는 어둡고 지평선 쪽은 도시 불빛으로 밝다
  const sky = ctx.createLinearGradient(0, 0, 0, ground);
  sky.addColorStop(0, gray(0.04));
  sky.addColorStop(0.55, gray(0.2));
  sky.addColorStop(1, gray(0.46));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, ground);
  for (let i = 0; i < 6; i++) box(ctx, rnd() * W, rnd() * H * 0.35, 1, 1, 0.9);
  box(ctx, 0, ground, W, H - ground, 0.05);

  const masses = FORMS[spec.form] || FORMS.library;
  if (spec.form === 'hall') {
    shape(ctx, [[W * 0.06, H * 0.5], [W * 0.5, H * 0.3], [W * 0.94, H * 0.5]], open ? 0.24 : 0);
  }
  if (open) light(ctx, W * 0.5, ground, W * 0.6, 0.2, 0.5);
  for (const [mx, my, mw, mh] of masses) {
    const x = mx * W;
    const y = my * H;
    const w = mw * W;
    const h = Math.min(mh * H, ground - y);
    box(ctx, x, y, w, h, open ? 0.2 : 0);
    if (!open) continue;
    box(ctx, x, y, w, 2, 0.45);
    // 창문: 대부분 켜져 있다
    const cols = Math.max(2, Math.round(w / 12));
    const rows = Math.max(1, Math.round(h / 13));
    const cw = w / cols;
    const rh = h / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const lit = rnd() < 0.72;
        box(ctx, x + c * cw + cw * 0.25, y + r * rh + rh * 0.3, cw * 0.5, rh * 0.42, lit ? 0.97 : 0.1);
      }
    }
  }
}
