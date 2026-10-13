// =========================================================
// places.js — 현재 시점(새벽)의 탐색 지점 11곳
//  id, floor, name, map(층 지도 좌표), desc(장소 설명)
//  image : 실제 사진(없으면 art 임시 그림)
//  lock  : 이 장소 자체가 잠겨 있으면 자물쇠 id. 열리면 artOpen 그림과
//          when: 'open' 물건이 보이고, when: 'locked' 물건은 사라진다
//  objects(클릭 영역, 퍼센트 좌표)
//    portal — 책갈피를 꽂으면 장면(to)으로 들어간다
//    zoom   — 확대해서 살펴본다
//    lock   — 숫자 자물쇠 키패드
//    gate   — IC 게이트 화면(퇴실 처리)
//    final  — 85-0001의 책(10명 모두 확정되면 에필로그)
// =========================================================

export const places = [
  // ---------------------------------------------------------- 1층
  {
    id: 'desk', floor: '1F', name: '안내데스크·IC 게이트', map: { x: 398, y: 236 },
    desc: '불 꺼진 1층. IC 게이트 화면만 같은 문장을 되풀이한다. 게이트 앞 바닥에 제목 없는 책 한 권이 떨어져 있다.',
    image: 'assets/places/desk.jpg',
    art: [
      { t: 'bg', top: 0.03, bottom: 0.1 },
      { t: 'rect', x: 84, y: 10, w: 16, h: 56, tone: 0.13 },
      { t: 'line', pts: [[92, 10], [92, 66]], lw: 0.6, tone: 0.22 },
      { t: 'glow', x: 92, y: 36, r: 26, a: 0.07 },
      { t: 'clock', x: 30, y: 17, s: 6 },
      { t: 'tube', x: 22, y: 3, w: 14 },
      { t: 'tube', x: 52, y: 3, w: 14 },
      { t: 'tube', x: 78, y: 3, w: 14 },
      { t: 'floor', y: 64, far: 0.06, near: 0.15, vx: 60 },
      { t: 'gate', x: 74, y: 55, w: 22, h: 24, n: 3 },
      { t: 'rect', x: 66.5, y: 56, w: 3, h: 24, tone: 0.28 },
      { t: 'screen', x: 63.5, y: 44, w: 9, h: 11, on: true, stand: false, glow: 0.4 },
      { t: 'counter', x: 3, y: 53, w: 37, h: 25 },
      { t: 'screen', x: 6, y: 41, w: 9, h: 9, on: false, standH: 3 },
      { t: 'glow', x: 60, y: 86, r: 22, a: 0.22, sy: 0.45 },
      { t: 'book', x: 60, y: 86, w: 7, rot: -14, tone: 0.6 },
      { t: 'dark', a: 0.6 },
    ],
    objects: [
      { kind: 'gate', id: 'gate', label: 'IC 게이트 화면', x: 62.5, y: 42.5, w: 11, h: 14 },
      { kind: 'portal', id: 'startBook', label: '제목 없는 책', to: 's1', x: 53, y: 80, w: 14, h: 12, note: '게이트 앞 바닥에 떨어진 책. 표지에 아무것도 적혀 있지 않다. 펼치면 낯익은 카디건 냄새가 난다.' },
      {
        kind: 'zoom', id: 'clock', label: '벽시계', x: 25.5, y: 8.5, w: 9, h: 17,
        zoom: { style: 'note', title: '벽시계', lines: ['11시 59분에서 멈춰 있다.', '초침도 움직이지 않는다.'] },
      },
    ],
  },
  {
    id: 'exit', floor: '1F', name: '석당콜라보라운지 비상구', map: { x: 54, y: 392 },
    desc: '라운지 안쪽, 비상구 표시등만 깜빡인다. 문턱에 책 한 권이 엎어져 있고, 청소 카트가 그대로 서 있다.',
    image: 'assets/places/exit.jpg',
    art: [
      { t: 'bg', top: 0.03, bottom: 0.1 },
      { t: 'rect', x: 0, y: 0, w: 100, h: 72, tone: 0.07 },
      { t: 'floor', y: 72, far: 0.06, near: 0.14, vx: 57 },
      { t: 'sofa', x: 1, y: 84, w: 18, h: 15, tone: 0.18 },
      { t: 'table', x: 25, y: 74, s: 12, tone: 0.22 },
      { t: 'sofa', x: 74, y: 86, w: 20, h: 14, tone: 0.16 },
      { t: 'door', x: 50, y: 20, w: 14, h: 58, tone: 0.2 },
      { t: 'exit', x: 57, y: 12, s: 4 },
      { t: 'cart', x: 34, y: 90, s: 24 },
      { t: 'glow', x: 57, y: 85, r: 16, a: 0.2, sy: 0.45 },
      { t: 'book', x: 57, y: 85, w: 6, rot: 8, tone: 0.55 },
      { t: 'dark', a: 0.6 },
    ],
    objects: [
      { kind: 'portal', id: 'exitBook', label: '문턱의 책', to: 's2', x: 51, y: 79, w: 12, h: 12, note: '비상구 문턱에 엎어진 책. 책등에 열쇠 모양으로 눌린 자국이 있다.' },
      {
        kind: 'zoom', id: 'exitDoor', label: '비상구 문', x: 50, y: 20, w: 14, h: 54,
        zoom: { style: 'note', title: '비상구 문', lines: ['문은 다시 닫혀 잠겨 있다. 열쇠 구멍은 비어 있다.', "안내문: '야간에는 경비원 열쇠로만 개방합니다.'"] },
      },
    ],
  },
  {
    id: 'study3', floor: '1F', name: '그룹스터디룸 3', map: { x: 624, y: 106 }, lock: 'L1',
    desc: '그룹스터디룸 3. 유리문 너머는 어둡고, 문 옆 키패드에 1985년 시스템의 문장이 떠 있다.',
    descOpen: '그룹스터디룸 3. 책상 위에 오늘 밤 예약 명단이 놓여 있다.',
    image: 'assets/places/study3.jpg',
    imageOpen: 'assets/places/study3-open.jpg',
    art: [
      { t: 'bg', top: 0.04, bottom: 0.1 },
      { t: 'rect', x: 0, y: 0, w: 100, h: 82, tone: 0.09 },
      { t: 'sign', x: 37, y: 7, w: 26, h: 6, text: '그룹스터디룸 3', tone: 0.6 },
      { t: 'door', x: 38, y: 16, w: 24, h: 66, tone: 0.12, bar: false },
      { t: 'rect', x: 41, y: 20, w: 18, h: 40, tone: 0.05 },
      { t: 'line', pts: [[42, 22], [57, 56]], lw: 0.3, tone: 0.16 },
      { t: 'screen', x: 66, y: 42, w: 6, h: 9, on: true, stand: false, glow: 0.3 },
      { t: 'rect', x: 66, y: 51, w: 6, h: 6, tone: 0.3 },
      { t: 'floor', y: 82, far: 0.06, near: 0.13, vx: 50 },
      { t: 'dark', a: 0.55 },
    ],
    artOpen: [
      { t: 'bg', top: 0.04, bottom: 0.1 },
      { t: 'rect', x: 26, y: 8, w: 48, h: 30, tone: 0.4 },
      { t: 'line', pts: [[30, 16], [44, 14], [52, 18]], lw: 0.5, tone: 0.18 },
      { t: 'line', pts: [[32, 26], [62, 24]], lw: 0.5, tone: 0.18 },
      { t: 'floor', y: 66, far: 0.06, near: 0.14, vx: 50 },
      { t: 'chair', x: 22, y: 86, s: 20, face: 1 },
      { t: 'chair', x: 78, y: 86, s: 20, face: -1 },
      { t: 'desk', x: 18, y: 60, w: 64, h: 22, tone: 0.34, panel: true },
      { t: 'glow', x: 50, y: 60, r: 18, a: 0.22, sy: 0.5 },
      { t: 'papers', x: 50, y: 59, w: 9, rot: -6 },
      { t: 'dark', a: 0.55 },
    ],
    objects: [
      { kind: 'lock', id: 'keypad', label: '키패드', lock: 'L1', when: 'locked', x: 64.5, y: 40, w: 9, h: 18 },
      {
        kind: 'zoom', id: 'reservation', label: '예약 명단', when: 'open', x: 43, y: 53, w: 14, h: 11,
        zoom: {
          style: 'paper', title: '그룹스터디룸 3 · 예약 명단',
          lines: ['이용 시간  21:00 ~ 23:00', '', '예약자  하준호 (경찰행정)', '동반  양은서 (국문)', '　　  응우옌 티 마이 (경영)', '', '입실 확인  준호 ✓   마이 ✓   은서 —'],
        },
      },
    ],
  },

  // ---------------------------------------------------------- 2층
  {
    id: 'bookcafe', floor: '2F', name: '북카페 유학생코너', map: { x: 467, y: 352 },
    desc: '북카페 유학생코너. 천장 센서등은 꺼진 채 반응하지 않는다. 서가 앞 바닥에 책 한 권, 테이블마다 남겨진 물건.',
    image: 'assets/places/bookcafe.jpg',
    art: [
      { t: 'bg', top: 0.03, bottom: 0.1 },
      { t: 'shelf', x: 30, y: 16, w: 42, h: 58, rows: 5, tone: 0.22, seed: 33 },
      { t: 'sign', x: 41, y: 8, w: 20, h: 6, text: '유학생코너', tone: 0.5 },
      { t: 'shelf', x: 76, y: 22, w: 24, h: 52, rows: 4, tone: 0.15, seed: 34 },
      { t: 'tube', x: 50, y: 2, w: 16 },
      { t: 'floor', y: 74, far: 0.06, near: 0.15, vx: 50 },
      { t: 'table', x: 17, y: 66, s: 20, tone: 0.32 },
      { t: 'chair', x: 7, y: 90, s: 18, face: 1 },
      { t: 'book', x: 17, y: 64.5, w: 5, rot: -12, tone: 0.62 },
      { t: 'table', x: 86, y: 74, s: 16, tone: 0.28 },
      { t: 'papers', x: 86, y: 72.5, w: 6, rot: -10 },
      { t: 'exit', x: 90, y: 12, s: 3.5 },
      { t: 'glow', x: 52, y: 88, r: 18, a: 0.22, sy: 0.45 },
      { t: 'book', x: 52, y: 88, w: 7, rot: 10, tone: 0.55 },
      { t: 'dark', a: 0.6 },
    ],
    objects: [
      { kind: 'portal', id: 'cafeBook', label: '바닥의 책', to: 's3', x: 45, y: 82, w: 14, h: 12, note: '서가 앞 바닥에 떨어진 책. 책장 사이에 휴대폰 케이스 모양의 자국이 남아 있다.' },
      {
        kind: 'zoom', id: 'patrolLog', label: '순찰 기록지', x: 80, y: 66, w: 12, h: 10,
        zoom: { style: 'paper', title: '클립보드 · 순찰 기록지', lines: ['경비  박만수', '', '23:10  5층 서고 시건', '23:20  4층 스탠드 소등, 분실물(책) 수거', '23:30  3층 —'] },
      },
      {
        kind: 'zoom', id: 'tableBook', label: '테이블 위 책', x: 13, y: 60, w: 9, h: 8,
        zoom: { style: 'spine', title: '테이블 위 책', call: ['713.7', 'ㅎ16ㅎ'], lines: ['『한국어 문법 연습』', '책 사이에 외국인등록증 사본이 끼워져 있다(이름은 가려져 있다).'] },
      },
    ],
  },
  {
    id: 'kiosk', floor: '2F', name: '무인 대출기', map: { x: 262, y: 262 },
    desc: '대출실 옆 무인 대출기. 화면에 마지막 처리 기록이 그대로 남아 있다.',
    image: 'assets/places/kiosk.jpg',
    art: [
      { t: 'bg', top: 0.03, bottom: 0.1 },
      { t: 'shelf', x: 0, y: 12, w: 28, h: 64, rows: 5, tone: 0.16, seed: 21 },
      { t: 'shelf', x: 72, y: 12, w: 28, h: 64, rows: 5, tone: 0.16, seed: 22 },
      { t: 'sign', x: 40, y: 6, w: 20, h: 6, text: '무인 대출기', tone: 0.5 },
      { t: 'floor', y: 76, far: 0.06, near: 0.14, vx: 50 },
      { t: 'kiosk', x: 42, y: 20, w: 16, h: 64, on: true },
      { t: 'glow', x: 50, y: 34, r: 30, a: 0.18 },
      { t: 'dark', a: 0.55 },
    ],
    objects: [
      {
        kind: 'zoom', id: 'loanRecord', label: '대출기 화면', x: 43, y: 21, w: 14, h: 24,
        zoom: { style: 'screen', title: '무인 대출기 · 마지막 처리', lines: ['22:41  대출', '청구기호  713.7', '자료명  『한국어 문법 연습』', '대출자  응우옌 티 마이'] },
      },
    ],
  },

  // ---------------------------------------------------------- 3층
  {
    id: 'sci', floor: '3F', name: '자연기술과학실 500 서가', map: { x: 540, y: 118 },
    desc: '500 서가 사이 바닥에 책 한 권이 떨어져 있다. 통로 앞에는 책 한 권이 실린 북트럭이 그대로 서 있다.',
    image: 'assets/places/sci.jpg',
    art: [
      { t: 'bg', top: 0.03, bottom: 0.1 },
      { t: 'aisle', clip: [50, 0, 50, 100], vx: 76, vy: 44, half: 30, top: -8, bottom: 90, depth: 6, rows: 6, tone: 0.2, lit: 0, seed: 45 },
      { t: 'rect', x: 0, y: 0, w: 50, h: 70, tone: 0.08 },
      { t: 'rect', x: 49, y: 0, w: 1.5, h: 90, tone: 0.3 },
      { t: 'sign', x: 30, y: 12, w: 14, h: 6, text: '500', tone: 0.55 },
      { t: 'floor', clip: [0, 0, 50, 100], y: 70, far: 0.06, near: 0.15, vx: 30 },
      { t: 'switch', x: 6, y: 47, s: 5, down: true },
      { t: 'exit', x: 22, y: 8, s: 3 },
      { t: 'truck', x: 47, y: 92, s: 30, books: 1, glow: true },
      { t: 'glow', x: 79, y: 85, r: 16, a: 0.22, sy: 0.45 },
      { t: 'book', x: 79, y: 85, w: 7, rot: -20, tone: 0.55 },
      { t: 'dark', a: 0.55 },
    ],
    objects: [
      { kind: 'portal', id: 'sciBook', label: '서가 사이의 책', to: 's4', x: 71, y: 79, w: 15, h: 12, note: '500 서가 사이 바닥의 책. 표지가 비니처럼 둥글게 말려 있다.' },
      { kind: 'portal', id: 'truckBook', label: '북트럭 위 책', to: 's5', x: 40.5, y: 56.5, w: 7, h: 10, note: "북트럭 맨 위 칸의 제목 없는 책. '분실물' 쪽지가 꽂혀 있다." },
      {
        kind: 'zoom', id: 'sciSwitch', label: '벽 스위치', x: 3, y: 41, w: 7, h: 12,
        zoom: { style: 'note', title: '벽 스위치', lines: ['스위치가 내려가 있다.', '다시 올려도 불은 들어오지 않는다.'] },
      },
    ],
  },

  // ---------------------------------------------------------- 4층
  {
    id: 'lang', floor: '4F', name: '어문학실 열람 책상', map: { x: 560, y: 300 },
    desc: '800 서가 앞 열람 책상. 칸막이 너머 스탠드는 꺼져 있고, 빈 의자 앞에 휴대폰과 펼친 시집이 남아 있다.',
    image: 'assets/places/lang.jpg',
    art: [
      { t: 'bg', top: 0.03, bottom: 0.1 },
      { t: 'shelf', x: 0, y: 6, w: 40, h: 60, rows: 5, tone: 0.18, seed: 51 },
      { t: 'sign', x: 14, y: 1.5, w: 12, h: 4.5, text: '800', tone: 0.5 },
      { t: 'shelf', x: 80, y: 8, w: 20, h: 58, rows: 5, tone: 0.16, seed: 52 },
      { t: 'floor', y: 66, far: 0.06, near: 0.14, vx: 50 },
      { t: 'desk', x: 14, y: 62, w: 66, h: 22, tone: 0.34 },
      { t: 'partition', x: 46.5, y: 46, w: 2.2, h: 16, tone: 0.28 },
      { t: 'lamp', x: 55, y: 62, s: 14, dir: -1, on: false },
      { t: 'chair', x: 25, y: 90, s: 20, face: 1 },
      { t: 'book', x: 41, y: 61, w: 6, open: true },
      { t: 'glow', x: 21, y: 61, r: 12, a: 0.2, sy: 0.6 },
      { t: 'phone', x: 20, y: 60.5, s: 4, rot: 90, on: false },
      { t: 'dark', a: 0.55 },
    ],
    objects: [
      {
        kind: 'zoom', id: 'lamp', label: '꺼진 스탠드', x: 49.5, y: 47, w: 9, h: 16,
        zoom: { style: 'note', title: '꺼진 스탠드', lines: ['칸막이 너머 책상 스탠드. 스위치가 내려가 있다.', "벽 안내판: '어문학실 이용 시간 09:00~20:00'"] },
      },
      { kind: 'portal', id: 'phone', label: '책상 위 휴대폰', to: 's5', x: 17, y: 55, w: 6.5, h: 10, note: '엎어진 휴대폰. 화면은 꺼져 있다. 의자에는 아직 온기가 남은 것 같다.' },
    ],
  },

  // ---------------------------------------------------------- 5층
  {
    id: 'grad', floor: '5F', name: '대학원열람실', map: { x: 122, y: 236 },
    desc: '대학원열람실. 07번 좌석에 논문 초안 뭉치가 쌓여 있다. 다른 책상에는 스티커가 붙은 텀블러 하나.',
    image: 'assets/places/grad.jpg',
    art: [
      { t: 'bg', top: 0.03, bottom: 0.1 },
      { t: 'rect', x: 0, y: 0, w: 100, h: 66, tone: 0.08 },
      { t: 'floor', y: 66, far: 0.06, near: 0.14, vx: 50 },
      { t: 'desk', x: 4, y: 62, w: 92, h: 22, tone: 0.34 },
      { t: 'partition', x: 4, y: 40, w: 92, h: 22, tone: 0.18 },
      { t: 'partition', x: 34.5, y: 40, w: 1.6, h: 22, tone: 0.32 },
      { t: 'partition', x: 64.5, y: 40, w: 1.6, h: 22, tone: 0.32 },
      { t: 'plate', x: 19, y: 46, s: 5, text: '07' },
      { t: 'plate', x: 50, y: 46, s: 5, text: '08' },
      { t: 'plate', x: 80, y: 46, s: 5, text: '09' },
      { t: 'lamp', x: 30, y: 62, s: 12, dir: -1 },
      { t: 'glow', x: 21, y: 60, r: 14, a: 0.25, sy: 0.6 },
      { t: 'papers', x: 21, y: 59.5, w: 9, rot: 4 },
      { t: 'tumbler', x: 77, y: 62, s: 9 },
      { t: 'chair', x: 20, y: 92, s: 18, face: 1 },
      { t: 'chair', x: 78, y: 92, s: 18, face: 1 },
      { t: 'dark', a: 0.55 },
    ],
    objects: [
      {
        kind: 'zoom', id: 'draft', label: '07번 좌석 논문 초안', x: 13, y: 51, w: 16, h: 13,
        zoom: {
          style: 'paper', title: '대학원열람실 07번 좌석 · 논문 초안',
          lines: ['**대학도서관 자동화 40년**', '— 문헌정보·사학과 석사과정 (초안)', '', '…국내 대학 도서관 최초로 자동화 시스템을 구축했다.', '__1985. 3. 4. 첫 출입 기록 85-0001 — 퇴실 기록 없음?__', '→ B1 참고자료서고 원본 확인할 것'],
        },
      },
      { kind: 'portal', id: 'tumbler', label: '스티커 텀블러', to: 's6', x: 73.5, y: 49, w: 8, h: 14, note: "텀블러에 '加油!' 스티커가 붙어 있다. 아직 따뜻하다." },
    ],
  },
  {
    id: 'reading3', floor: '5F', name: '제3열람실', map: { x: 150, y: 318 },
    desc: '제3열람실. 23시 타이머 소등 이후 그대로다. 035번 좌석에 가방 하나가 남아 있다.',
    image: 'assets/places/reading3.jpg',
    art: [
      { t: 'bg', top: 0.03, bottom: 0.1 },
      { t: 'rect', x: 0, y: 0, w: 100, h: 66, tone: 0.08 },
      { t: 'tube', x: 30, y: 4, w: 16 },
      { t: 'tube', x: 70, y: 4, w: 16 },
      { t: 'floor', y: 66, far: 0.06, near: 0.14, vx: 50 },
      { t: 'desk', x: 2, y: 62, w: 96, h: 22, tone: 0.32 },
      { t: 'partition', x: 2, y: 42, w: 96, h: 20, tone: 0.17 },
      { t: 'partition', x: 25, y: 42, w: 1.4, h: 20, tone: 0.3 },
      { t: 'partition', x: 49, y: 42, w: 1.4, h: 20, tone: 0.3 },
      { t: 'partition', x: 73, y: 42, w: 1.4, h: 20, tone: 0.3 },
      { t: 'plate', x: 14, y: 48, s: 4.6, text: '033' },
      { t: 'plate', x: 37, y: 48, s: 4.6, text: '034' },
      { t: 'plate', x: 61, y: 48, s: 4.6, text: '035' },
      { t: 'plate', x: 85, y: 48, s: 4.6, text: '036' },
      { t: 'glow', x: 61, y: 60, r: 16, a: 0.25, sy: 0.6 },
      { t: 'bag', x: 61, y: 62, s: 14, charm: true },
      { t: 'chair', x: 37, y: 92, s: 18, face: 1 },
      { t: 'chair', x: 61, y: 92, s: 18, face: 1 },
      { t: 'dark', a: 0.55 },
    ],
    objects: [
      {
        kind: 'zoom', id: 'bag035', label: '035번 좌석 가방', x: 54, y: 46, w: 14, h: 18,
        zoom: { style: 'note', title: '제3열람실 035번 좌석', lines: ['좌석 번호판: 035', '백팩에 감귤 모양 키링이 달려 있다.', '안에는 건축 설계 스케치북과 제주행 항공권 영수증.'] },
      },
    ],
  },
  {
    id: 'stackDoor', floor: '5F', name: '서고 문', map: { x: 478, y: 330 },
    desc: '5층 서고 문은 잠겨 있다. 좁은 유리창 너머로 불빛이 새어 나온다.',
    image: 'assets/places/stackDoor.jpg',
    art: [
      { t: 'bg', top: 0.03, bottom: 0.1 },
      { t: 'rect', x: 0, y: 0, w: 100, h: 84, tone: 0.07 },
      { t: 'sign', x: 24, y: 8, w: 16, h: 6, text: '서고', tone: 0.5 },
      { t: 'door', x: 22, y: 18, w: 20, h: 66, tone: 0.2, bar: false },
      { t: 'rect', x: 27, y: 25, w: 10, h: 27, tone: 0.78 },
      { t: 'shelf', clip: [27, 25, 10, 27], x: 24, y: 24, w: 16, h: 30, rows: 4, tone: 0.55, seed: 61 },
      { t: 'person', who: 1, clip: [27, 25, 10, 27], x: 30, y: 52, h: 22, pose: 'sitFloor', face: 1 },
      { t: 'glow', x: 32, y: 38, r: 20, a: 0.24 },
      { t: 'rect', x: 40.5, y: 52, w: 1.2, h: 4, tone: 0.6 },
      { t: 'floor', y: 84, far: 0.06, near: 0.13, vx: 40 },
      { t: 'exit', x: 90, y: 10, s: 3 },
      { t: 'dark', a: 0.55 },
    ],
    objects: [
      {
        kind: 'zoom', id: 'stackWindow', label: '유리창', x: 27, y: 25, w: 10, h: 27,
        zoom: { style: 'note', title: '서고 문 유리창', lines: ['불이 켜진 서고 안, 무선 이어폰을 낀 사람이 서가에 기대 잠들어 있다.', '책이 되지는 않았다. 문은 바깥에서 잠겨 있다.'] },
      },
      {
        kind: 'zoom', id: 'stackKeyhole', label: '자물쇠', x: 38.5, y: 48, w: 6, h: 11,
        zoom: { style: 'note', title: '서고 문 자물쇠', lines: ['열쇠로만 열리는 자물쇠다.', '경비원의 열쇠 꾸러미가 있어야 한다.'] },
      },
    ],
  },

  // ---------------------------------------------------------- B1
  {
    id: 'refStacks', floor: 'B1', name: '참고자료서고', map: { x: 237, y: 160 },
    desc: 'B1 참고자료서고. 통로 불은 꺼져 있고, 옆 통로만 환하다. 바닥에 책 한 권이 펼쳐져 있다.',
    image: 'assets/places/refStacks.jpg',
    art: [
      { t: 'bg', top: 0.02, bottom: 0.08 },
      { t: 'aisle', vx: 50, vy: 42, half: 62, top: -12, bottom: 96, depth: 7, rows: 6, tone: 0.2, lit: 0, lights: 'off', seed: 71 },
      { t: 'glow', x: 100, y: 46, r: 48, a: 0.2 },
      { t: 'switch', x: 7, y: 50, s: 6, down: true },
      { t: 'rect', x: 23.5, y: 34, w: 1.8, h: 9, tone: 0.72 },
      { t: 'glow', x: 24.4, y: 38.5, r: 7, a: 0.3 },
      { t: 'person', who: 4, x: 87, y: 94, h: 44, pose: 'sitFloor', face: -1, light: 0.95 },
      { t: 'glow', x: 48, y: 86, r: 16, a: 0.22, sy: 0.45 },
      { t: 'book', x: 48, y: 86, w: 8, rot: -6, open: true },
      { t: 'dark', a: 0.4 },
    ],
    objects: [
      { kind: 'portal', id: 'openBook', label: '펼쳐진 책', to: 's7', x: 40, y: 80, w: 16, h: 13, note: '통로 바닥에 펼쳐진 책. 펼친 면에 트렌치코트 단추 하나가 끼어 있다.' },
      { kind: 'final', id: 'oldBook', label: '제목 없는 낡은 책', to: 'epilogue', x: 20.5, y: 31, w: 8, h: 15 },
      {
        kind: 'zoom', id: 'sleeper', label: '옆 통로에 잠든 사람', x: 70, y: 62, w: 27, h: 33,
        zoom: { style: 'note', title: '불 켜진 옆 통로', lines: ['후드티를 입은 사람이 서가에 기대 잠들어 있다. 숨소리가 고르다.', '가슴의 명찰은 팔에 가려 읽을 수 없다.', '불 켜진 곳에 있었기에, 책이 되지 않았다.'] },
      },
    ],
  },
];
