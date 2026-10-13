// =========================================================
// map.js — 층별 안내도를 SVG로 그린다(1비트 무늬)
// 탐색 화면(어두운 바탕)과 기록부 안내도 탭(종이 바탕)에서 함께 쓴다.
// 색은 currentColor 하나만 쓰므로 바탕에 따라 자동으로 뒤집힌다.
// =========================================================
import { svg } from './util.js';

let uid = 0; // SVG 무늬 id가 겹치지 않게

// 좌표 목록 → "x,y x,y" 문자열
const pts = (list) => list.map(([x, y]) => `${x},${y}`).join(' ');

// 방 종류별 1비트 무늬
function patterns(id) {
  const p = (name, w, h, ...kids) => svg('pattern', { id: `${id}-${name}`, width: w, height: h, patternUnits: 'userSpaceOnUse' }, ...kids);
  const dot = (x, y, s) => svg('rect', { x, y, width: s, height: s, fill: 'currentColor' });
  return svg(
    'defs',
    null,
    p('books', 6, 5, svg('rect', { width: 6, height: 1.2, fill: 'currentColor' })),
    p('stack', 5, 5, svg('rect', { width: 5, height: 1.2, fill: 'currentColor' }), svg('rect', { width: 1.2, height: 5, fill: 'currentColor' })),
    p('read', 6, 6, dot(2, 2, 1.6)),
    p('room', 8, 8, dot(3, 3, 1.3)),
    p('lounge', 7, 7, svg('path', { d: 'M-1 8 L8 -1', stroke: 'currentColor', 'stroke-width': 1.1 })),
    p('hall', 5, 5, svg('rect', { width: 1.2, height: 5, fill: 'currentColor' })),
    p('outdoor', 10, 8, svg('path', { d: 'M0 4 Q2.5 1 5 4 T10 4', stroke: 'currentColor', fill: 'none', 'stroke-width': 1 })),
  );
}

// 층 안내도 SVG를 만든다
// opts.pins : 탐색 지점 [{ id, x, y, label, no, visited, hint, locked }]
// opts.marks: 장면 표시 [{ x, y, label, hint }]
// opts.onPin: 지점을 눌렀을 때
export function floorMap(floor, opts = {}) {
  const id = `fm${++uid}`;
  const [vx, vy, vw, vh] = floor.view;
  const root = svg('svg', { class: 'floormap', viewBox: `${vx} ${vy} ${vw} ${vh}`, role: 'group', 'aria-label': `${floor.name} 안내도` }, patterns(id));

  root.append(svg('polygon', { class: 'fm-outline', points: pts(floor.outline) }));
  for (const room of floor.rooms) root.append(roomShape(room, id));
  for (const icon of floor.icons || []) root.append(iconShape(icon));
  for (const room of floor.rooms) if (room.n) root.append(roomLabel(room));
  for (const mark of opts.marks || []) root.append(markShape(mark, vw));
  for (const pin of opts.pins || []) root.append(pinShape(pin, opts.onPin, vw));
  return root;
}

// 방 하나(사각형 또는 다각형)
function roomShape(room, id) {
  const kind = room.k || 'room';
  const cls = `fm-room fm-room--${kind}`;
  const fill = ['zone', 'desk'].includes(kind) ? null : `url(#${id}-${kind})`;
  if (room.p) return svg('polygon', { class: cls, points: pts(room.p), fill });
  const [x, y, w, h] = room.r;
  return svg('rect', { class: cls, x, y, width: w, height: h, fill });
}

// 방 이름
function roomLabel(room) {
  let [lx, ly] = room.l || [];
  if (lx === undefined) {
    if (room.r) {
      lx = room.r[0] + room.r[2] / 2;
      ly = room.r[1] + room.r[3] / 2;
    } else {
      const xs = room.p.map((p) => p[0]);
      const ys = room.p.map((p) => p[1]);
      lx = (Math.min(...xs) + Math.max(...xs)) / 2;
      ly = (Math.min(...ys) + Math.max(...ys)) / 2;
    }
  }
  const cls = `fm-label${room.small ? ' fm-label--small' : ''}${room.k === 'desk' ? ' fm-label--desk' : ''}`;
  return svg('text', { class: cls, x: lx, y: ly, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, room.n);
}

// 계단·화장실·비상구·게이트 아이콘
function iconShape(icon) {
  const g = svg('g', { class: `fm-icon fm-icon--${icon.t}`, transform: `translate(${icon.x} ${icon.y})`, 'aria-hidden': 'true' });
  if (icon.t === 'stairs') {
    g.append(svg('rect', { x: -12, y: -10, width: 24, height: 20, class: 'fm-icon-box' }));
    g.append(svg('path', { d: 'M-8 6 H-3 V1 H2 V-4 H8', class: 'fm-icon-line' }));
  } else if (icon.t === 'wc') {
    g.append(svg('rect', { x: -13, y: -9, width: 26, height: 18, class: 'fm-icon-box' }));
    g.append(svg('text', { class: 'fm-icon-text', x: 0, y: 0.5, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, 'WC'));
  } else if (icon.t === 'exit') {
    g.append(svg('rect', { x: -15, y: -9, width: 30, height: 18, class: 'fm-icon-box' }));
    g.append(svg('text', { class: 'fm-icon-text', x: 0, y: 0.5, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, 'EXIT'));
  } else if (icon.t === 'gate') {
    g.append(svg('path', { d: 'M-22 0 H22 M-22 0 L-15 -6 M-22 0 L-15 6 M22 0 L15 -6 M22 0 L15 6', class: 'fm-icon-line' }));
    g.append(svg('text', { class: 'fm-icon-text', x: 0, y: -9, 'text-anchor': 'middle' }, 'IC'));
  }
  if (icon.label) g.append(svg('text', { class: 'fm-icon-text', x: 0, y: 22, 'text-anchor': 'middle' }, icon.label));
  return g;
}

// 글자 폭 어림값(한글 13, 영문·숫자 7)
function textWidth(text) {
  let w = 0;
  for (const ch of text) w += /[\x00-\x7f]/.test(ch) ? 7 : 13;
  return w;
}

// 탐색 지점(번호가 적힌 핀)
function pinShape(pin, onPin, viewW) {
  const right = pin.x > viewW * 0.72; // 오른쪽 끝이면 이름을 왼쪽에
  const cls = `fm-pin${pin.visited ? ' is-visited' : ''}${pin.hint ? ' is-hint' : ''}${pin.current ? ' is-current' : ''}`;
  const g = svg('g', {
    class: cls,
    transform: `translate(${pin.x} ${pin.y})`,
    tabindex: onPin ? '0' : null,
    role: onPin ? 'button' : null,
    'aria-label': `${pin.no}. ${pin.label}${pin.visited ? ' (살펴봄)' : ''}`,
  });
  g.append(svg('circle', { r: 16, class: 'fm-pin-halo' }));
  g.append(svg('circle', { r: 11, class: 'fm-pin-dot' }));
  g.append(svg('text', { class: 'fm-pin-no', x: 0, y: 0.5, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, String(pin.no)));
  // 이름표: 글자 뒤에 바탕 상자를 깔아 다른 방 이름과 겹쳐도 읽히게 한다
  const width = textWidth(pin.label);
  const chip = svg('rect', { class: 'fm-pin-chip', x: right ? -22 - width : 14, y: -11, width: width + 8, height: 22 });
  const label = svg('text', { class: 'fm-pin-label', x: right ? -18 : 18, y: 0.5, 'text-anchor': right ? 'end' : 'start', 'dominant-baseline': 'central' }, pin.label);
  g.append(chip, label);
  requestAnimationFrame(() => {
    if (!label.isConnected) return;
    const box = label.getBBox(); // 실제 글자 폭으로 다시 맞춘다
    chip.setAttribute('x', box.x - 4);
    chip.setAttribute('width', box.width + 8);
  });
  if (onPin) {
    g.addEventListener('click', () => onPin(pin.id));
    g.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onPin(pin.id);
      }
    });
  }
  return g;
}

// 장면을 발견한 위치(마름모 + 시각)
function markShape(mark, viewW) {
  const right = mark.x > viewW * 0.72;
  const g = svg('g', { class: `fm-mark${mark.hint ? ' is-hint' : ''}${mark.unknown ? ' is-unknown' : ''}`, transform: `translate(${mark.x} ${mark.y})` });
  g.append(svg('rect', { x: -9, y: -9, width: 18, height: 18, transform: 'rotate(45)', class: 'fm-mark-shape' }));
  g.append(svg('text', { class: 'fm-mark-label', x: right ? -16 : 16, y: 0.5, 'text-anchor': right ? 'end' : 'start', 'dominant-baseline': 'central' }, mark.label));
  return g;
}
