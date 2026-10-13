// =========================================================
// scenes.js — 멈춘 순간(장면) 7개 + 진엔딩 에필로그
// 책갈피를 꽂으면: 암전 대사(lines) → 정지 장면(art 또는 사진) 순서로 보인다.
//
// 장면 하나의 구성
//  id, no(발견 순서), time(화면 표시), sort(시간순 정렬값), floor, where(장소 이름)
//  map    : 안내도에 표시할 위치(층 지도 좌표)
//  entry  : 현재 시점에서 이 장면으로 들어가는 탐색 지점(막힘 방지 힌트용)
//  people : 이 장면에 나오는 사진 번호
//  lines  : 암전 대사 { who(말하는 사람 표시), text, cue(효과음) }  — 5줄 이하
//  image  : 실제 사진 경로(없으면 art 임시 그림을 그린다)
//  art    : 임시 그림 목록(core/art.js 참고). 좌표는 모두 퍼센트
//  vanish : 종잇장처럼 흩어지는 사람 영역 { x, y, w, h, dir, amount, seed }
//  spots  : 클릭 영역(퍼센트)
//           person — 사진 번호(photo). 클릭하면 기록부 사진 페이지
//           zoom   — 확대해서 보는 물건(zoom 내용)
//           portal — 책갈피를 꽂아 이전 순간으로(to: 장면 id)
//           note   — 명부 밖 인물 설명
// 대사 안의 {name} 은 플레이어가 입력한 이름으로 바뀐다
// =========================================================

export const scenes = [
  // ---------------------------------------------------------- 장면 1
  {
    id: 's1', no: 1, time: '23:59', sort: 2359.5, floor: '1F', where: '1층 안내데스크·IC 게이트',
    map: { x: 398, y: 236 }, entry: ['desk'], people: [3],
    image: 'assets/scenes/s1.jpg',
    lines: [
      { who: '무전', text: '사서님! 비상구 열었심더! 퍼뜩 오이소!', cue: 'tick' },
      { who: '여자', text: '먼저 가세요. 이 친구 퇴실 처리만 하고요.' },
      { who: '게이트 안내음', text: '관리자 수동 퇴실 처리 완료. — {name}', cue: 'key' },
      { who: '여자', text: '명부랑 사진은 뽑아 뒀어. 일어나면… 모두 내보내 줘.' },
      { text: '(딸깍)', cue: 'click' },
    ],
    art: [
      { t: 'bg', top: 0.03, bottom: 0.11 },
      { t: 'rect', x: 84, y: 10, w: 16, h: 56, tone: 0.14 },
      { t: 'line', pts: [[92, 10], [92, 66]], lw: 0.6, tone: 0.24 },
      { t: 'glow', x: 92, y: 36, r: 26, a: 0.08 },
      { t: 'clock', x: 30, y: 17, s: 6 },
      { t: 'tube', x: 22, y: 3, w: 14 },
      { t: 'tube', x: 52, y: 3, w: 14 },
      { t: 'tube', x: 78, y: 3, w: 14 },
      { t: 'floor', y: 64, far: 0.07, near: 0.17, vx: 60 },
      { t: 'gate', x: 74, y: 55, w: 22, h: 24, n: 3 },
      { t: 'rect', x: 66.5, y: 56, w: 3, h: 24, tone: 0.3 },
      { t: 'screen', x: 63.5, y: 44, w: 9, h: 11, on: true, stand: false, glow: 0.35 },
      { t: 'person', who: 3, x: 55, y: 92, h: 60, pose: 'reach', face: 1 },
      { t: 'counter', x: 3, y: 53, w: 37, h: 25 },
      { t: 'person', who: 'me', x: 15, y: 76, h: 50, pose: 'slump', face: 1, back: true, clipY: 54.5, light: 1.1 },
      { t: 'screen', x: 6, y: 41, w: 9, h: 9, on: true, glow: 0.15, standH: 3 },
      { t: 'papers', x: 28, y: 52, w: 5, rot: 8 },
      { t: 'bookmark', x: 32, y: 51, s: 3.5, rot: 70 },
      { t: 'radio', x: 37, y: 51, s: 7 },
      { t: 'glow', x: 68, y: 49, r: 30, a: 0.18 },
      { t: 'dark', a: 0.55 },
    ],
    vanish: [{ x: 46, y: 30, w: 18, h: 62, dir: 'up', amount: 0.3, seed: 31 }],
    spots: [
      { kind: 'person', photo: 3, x: 46, y: 30, w: 17, h: 62 },
      {
        kind: 'zoom', id: 'badge', label: '사원증', x: 52.5, y: 49.5, w: 6, h: 8,
        zoom: { style: 'card', title: '사원증', head: '동의대학교 중앙도서관', lines: ['학술지원팀 사서', '사번 0417'] },
      },
      {
        kind: 'zoom', id: 'terminal', label: '게이트 단말기', x: 62.5, y: 42.5, w: 11, h: 14,
        zoom: { style: 'screen', title: '게이트 관리 단말기', lines: ['LIB-85 수동 퇴실 처리', '이용자  {name} (근로학생)', '처리 시각  23:59', '처리자  관리자'] },
      },
      { kind: 'portal', id: 'radio', label: '예비 무전기', to: 's2', x: 34.5, y: 42.5, w: 6, h: 12, note: "경비실 예비 무전기. '경비' 스티커가 붙어 있다. 아직 무전이 연결된 채다." },
    ],
  },

  // ---------------------------------------------------------- 장면 2
  {
    id: 's2', no: 2, time: '23:59', sort: 2359.0, floor: '1F', where: '1층 석당콜라보라운지 비상구',
    map: { x: 54, y: 392 }, entry: ['exit'], people: [10, 6, 9],
    image: 'assets/scenes/s2.jpg',
    lines: [
      { who: '남자', text: '아지매, 학생! 퍼뜩 나가이소! 뒤돌아보지 마이소!' },
      { who: '여자', text: '기사님은 어짤라고요! 같이 가씨요!' },
      { who: '여자', text: 'Anh Junho vẫn chưa quay lại!' },
      { who: '남자', text: '내는 그 학생 기다릴께예. 가이소.' },
      { text: '(딸깍)', cue: 'click' },
    ],
    art: [
      { t: 'bg', top: 0.03, bottom: 0.1 },
      { t: 'rect', x: 0, y: 0, w: 100, h: 72, tone: 0.07 },
      { t: 'floor', y: 72, far: 0.06, near: 0.15, vx: 57 },
      { t: 'sofa', x: 1, y: 84, w: 18, h: 15, tone: 0.18 },
      { t: 'table', x: 25, y: 74, s: 12, tone: 0.22 },
      { t: 'door', x: 50, y: 20, w: 14, h: 58, open: true, outside: 0.34, tone: 0.24 },
      { t: 'exit', x: 57, y: 12, s: 4 },
      { t: 'cart', x: 34, y: 90, s: 24 },
      { t: 'person', who: 10, x: 46, y: 92, h: 62, pose: 'push', face: 1, props: ['keys', 'radio'] },
      { t: 'person', who: 6, x: 75, y: 92, h: 56, pose: 'pull', face: 1 },
      { t: 'person', who: 9, x: 59, y: 93, h: 54, pose: 'lookback', face: -1, props: ['phone'], phoneLit: true },
      { t: 'glow', x: 57, y: 50, r: 34, a: 0.12 },
      { t: 'dark', x: 70, y: 50, r: 85, a: 0.65 },
    ],
    vanish: [{ x: 37, y: 28, w: 19, h: 64, dir: 'left', amount: 0.3, seed: 102 }],
    spots: [
      { kind: 'person', photo: 10, x: 37, y: 28, w: 18, h: 64 },
      { kind: 'person', photo: 9, x: 53, y: 41, w: 12, h: 52 },
      { kind: 'person', photo: 6, x: 67, y: 36, w: 15, h: 56 },
      {
        kind: 'zoom', id: 'maiPhone', label: '휴대폰 화면', x: 52.5, y: 58.5, w: 5, h: 8,
        zoom: { style: 'phone', title: '휴대폰 화면', head: '문자 메시지 · 20:31', lines: ['[중앙도서관] 그룹스터디룸 3 예약 확정', '21:00~23:00', '확인번호 3105'] },
      },
      {
        kind: 'zoom', id: 'guardTag', label: '명찰', x: 47, y: 43.5, w: 5.5, h: 7,
        zoom: { style: 'card', title: '제복 명찰', head: '시설관리', lines: ['경비'], plain: true },
      },
      { kind: 'portal', id: 'jacket', label: '과잠', to: 's3', x: 55, y: 46, w: 8, h: 12, note: "몸에 비해 큰 과잠. 등판에 '경찰행정학과', 소매에 '23'이 새겨져 있다. 주인은 따로 있는 것 같다." },
    ],
  },

  // ---------------------------------------------------------- 장면 3
  {
    id: 's3', no: 3, time: '23:55', sort: 2355, floor: '2F', where: '2층 북카페 유학생코너',
    map: { x: 467, y: 352 }, entry: ['bookcafe'], people: [7],
    image: 'assets/scenes/s3.jpg',
    lines: [
      { who: '남자', text: '가방 여 있네. 외국인등록증도 있고… 됐다.' },
      { who: '남자', text: '은서야, 니 어디고… 전화 좀 받아라.' },
      { who: '방송', text: '열람 시간이… 종료되었습니다…' },
      { text: "(천장 센서 '틱')", cue: 'tick' },
    ],
    art: [
      { t: 'bg', top: 0.03, bottom: 0.1 },
      { t: 'shelf', x: 30, y: 16, w: 42, h: 58, rows: 5, tone: 0.24, seed: 33 },
      { t: 'sign', x: 41, y: 8, w: 20, h: 6, text: '유학생코너', tone: 0.5 },
      { t: 'shelf', x: 76, y: 22, w: 24, h: 52, rows: 4, tone: 0.16, seed: 34 },
      { t: 'tube', x: 50, y: 2, w: 16 },
      { t: 'floor', y: 74, far: 0.07, near: 0.16, vx: 50 },
      { t: 'table', x: 17, y: 66, s: 20, tone: 0.34 },
      { t: 'chair', x: 7, y: 90, s: 18, face: 1 },
      { t: 'book', x: 17, y: 64.5, w: 5, rot: -12, tone: 0.62 },
      { t: 'table', x: 86, y: 74, s: 16, tone: 0.3 },
      { t: 'papers', x: 86, y: 72.5, w: 6, rot: -10 },
      { t: 'exit', x: 90, y: 12, s: 3.5 },
      { t: 'person', who: 7, x: 52, y: 92, h: 62, pose: 'phone', face: 1, props: ['phone', 'bag'], phoneLit: true },
      { t: 'glow', x: 52, y: 60, r: 40, a: 0.1 },
      { t: 'dark', a: 0.55 },
    ],
    vanish: [{ x: 42, y: 30, w: 18, h: 62, dir: 'up', amount: 0.32, seed: 73 }],
    spots: [
      { kind: 'person', photo: 7, x: 42, y: 30, w: 18, h: 62 },
      {
        kind: 'zoom', id: 'idCard', label: '휴대폰 케이스', x: 52.3, y: 33.5, w: 5, h: 8.5,
        zoom: { style: 'card', title: '케이스에 꽂힌 학생증', head: '동의대학교 학생증', lines: ['학번 2023······', '(이름과 학과는 손가락에 가려 보이지 않는다)'] },
      },
      {
        kind: 'zoom', id: 'grammarBook', label: '테이블 위 책', x: 13, y: 60, w: 9, h: 8,
        zoom: { style: 'spine', title: '테이블 위 책', call: ['713.7', 'ㅎ16ㅎ'], lines: ['『한국어 문법 연습』', '대출 반납일 도장: 2주 뒤'] },
      },
    ],
  },

  // ---------------------------------------------------------- 장면 4
  {
    id: 's4', no: 4, time: '23:30', sort: 2330, floor: '3F', where: '3층 자연기술과학실 500 서가',
    map: { x: 540, y: 118 }, entry: ['sci'], people: [8, 6, 10],
    image: 'assets/scenes/s4.jpg',
    lines: [
      { who: '남자', text: '아지매, 다 했으면 불 끄고 나오이소. 내 북트럭 밀고 갈께예.' },
      { who: '여자', text: '아따, 근디 기사님. 아까 주운 책이 영 이상허요잉.' },
      { who: '속삭임', text: '어멍… 나 무섭수다. 불 꺼지민 사름이 엇어져마씸…' },
      { text: '(딸깍)', cue: 'click' },
      { who: '여자', text: '워메, 거그 누가 있었당께!' },
    ],
    art: [
      { t: 'bg', top: 0.03, bottom: 0.1 },
      { t: 'aisle', clip: [50, 0, 50, 100], vx: 76, vy: 44, half: 30, top: -8, bottom: 90, depth: 6, rows: 6, tone: 0.2, lit: 0.05, seed: 45 },
      { t: 'rect', x: 0, y: 0, w: 50, h: 70, tone: 0.08 },
      { t: 'rect', x: 49, y: 0, w: 1.5, h: 90, tone: 0.3 },
      { t: 'sign', x: 30, y: 12, w: 14, h: 6, text: '500', tone: 0.55 },
      { t: 'floor', clip: [0, 0, 50, 100], y: 70, far: 0.07, near: 0.16, vx: 30 },
      { t: 'switch', x: 6, y: 47, s: 5 },
      { t: 'exit', x: 22, y: 8, s: 3 },
      { t: 'person', who: 10, x: 34, y: 92, h: 62, pose: 'truck', face: 1, props: ['radio'] },
      { t: 'truck', x: 47, y: 92, s: 30, books: 1, glow: true },
      { t: 'person', who: 6, x: 17, y: 90, h: 58, pose: 'reach', face: -1 },
      { t: 'person', who: 8, x: 79, y: 88, h: 58, pose: 'crouch', face: -1, props: ['phone', 'book'], phoneLit: true },
      { t: 'dark', a: 0.5 },
    ],
    vanish: [{ x: 70, y: 44, w: 17, h: 45, dir: 'up', amount: 0.32, seed: 84 }],
    spots: [
      { kind: 'person', photo: 8, x: 70, y: 44, w: 17, h: 45 },
      { kind: 'person', photo: 6, x: 4, y: 32, w: 18, h: 59 },
      { kind: 'person', photo: 10, x: 25, y: 29, w: 13, h: 64 },
      {
        kind: 'zoom', id: 'archBook', label: '쥐고 있는 책', x: 72.5, y: 62, w: 6.5, h: 8,
        zoom: { style: 'spine', title: '쥐고 있는 책', call: ['540', 'ㄱ47ㄱ'], lines: ['『건축 구조의 이해』'] },
      },
      {
        kind: 'zoom', id: 'mandarinCase', label: '휴대폰', x: 73.5, y: 46.5, w: 6, h: 8.5,
        zoom: { style: 'phone', title: '휴대폰', head: '통화 중 · 03:12', lines: ['어멍'], case: '감귤 모양 휴대폰 케이스' },
      },
      { kind: 'portal', id: 'truckBook', label: '북트럭 위 책', to: 's5', x: 40.5, y: 56.5, w: 7, h: 10, note: "북트럭 맨 위 칸, 제목 없는 책 한 권. 4층에서 '분실물'로 수거된 책이다." },
    ],
  },

  // ---------------------------------------------------------- 장면 5
  {
    id: 's5', no: 5, time: '23:20', sort: 2320, floor: '4F', where: '4층 어문학실',
    map: { x: 560, y: 300 }, entry: ['lang', 'sci'], people: [5, 10, 8],
    image: 'assets/scenes/s5.jpg',
    lines: [
      { who: '잠꼬대', text: '…으응, 쪼까만 더 잘랑께… 스터디 아홉 시제…' },
      { who: '남자', text: '누가 스탠드를 켜 놓고 갔노. 자료실 문 닫은 지가 언젠데.' },
      { text: '(딸깍)', cue: 'click' },
      { who: '숨죽인 목소리', text: '…사름이 책이 되어부런.' },
    ],
    art: [
      { t: 'bg', top: 0.03, bottom: 0.1 },
      { t: 'shelf', x: 0, y: 6, w: 40, h: 60, rows: 5, tone: 0.2, seed: 51 },
      { t: 'sign', x: 14, y: 1.5, w: 12, h: 4.5, text: '800', tone: 0.5 },
      { t: 'shelf', x: 80, y: 8, w: 20, h: 58, rows: 5, tone: 0.18, seed: 52 },
      { t: 'floor', y: 66, far: 0.07, near: 0.15, vx: 50 },
      { t: 'truck', x: 88, y: 82, s: 26, books: 0 },
      { t: 'person', who: 8, x: 77, y: 70, h: 38, pose: 'phone', face: -1, light: 0.7 },
      { t: 'person', who: 10, x: 66, y: 90, h: 62, pose: 'lamp', face: -1, props: ['flashlight', 'keys'], beam: [0.7, 0.28] },
      { t: 'desk', x: 14, y: 62, w: 66, h: 22, tone: 0.36 },
      { t: 'partition', x: 46.5, y: 46, w: 2.2, h: 16, tone: 0.3 },
      { t: 'lamp', x: 55, y: 62, s: 14, dir: -1, on: false },
      { t: 'chair', x: 25, y: 90, s: 20, face: 1 },
      { t: 'person', who: 5, x: 28, y: 84, h: 52, pose: 'slump', face: 1, light: 1.2 },
      { t: 'book', x: 41, y: 61, w: 6, open: true },
      { t: 'phone', x: 20, y: 60.5, s: 4, rot: 90, on: true },
      { t: 'dark', a: 0.5 },
    ],
    vanish: [{ x: 22, y: 48, w: 22, h: 36, dir: 'up', amount: 0.3, seed: 55 }],
    spots: [
      { kind: 'person', photo: 5, x: 22, y: 48, w: 21, h: 36 },
      { kind: 'person', photo: 10, x: 56, y: 28, w: 16, h: 62 },
      { kind: 'person', photo: 8, x: 72.5, y: 43, w: 9.5, h: 27 },
      {
        kind: 'zoom', id: 'poems', label: '펼친 시집', x: 37, y: 57, w: 8, h: 7,
        zoom: { style: 'spine', title: '펼친 시집', call: ['811.7', 'ㅅ29ㅅ'], lines: ['시집 『새벽 열람실』'] },
      },
      {
        kind: 'zoom', id: 'eunseoPhone', label: '책상 위 휴대폰', x: 17, y: 55, w: 6.5, h: 10,
        zoom: { style: 'phone', title: '책상 위 휴대폰', head: '잠금 화면 · 23:20', lines: ['부재중 전화 7', '— 준호'] },
      },
    ],
  },

  // ---------------------------------------------------------- 장면 6
  {
    id: 's6', no: 6, time: '23:10', sort: 2310, floor: '5F', where: '5층 서고 입구',
    map: { x: 478, y: 330 }, entry: ['grad'], people: [1, 10],
    image: 'assets/scenes/s6.jpg',
    lines: [
      { who: '안쪽, 여자', text: '就是这本……终于找到了。' },
      { who: '바깥, 남자', text: '서고 문 잠급니더. 안에 아무도 없지예?' },
      { text: '( … )' },
      { text: '(철컥)', cue: 'clunk' },
    ],
    art: [
      { t: 'bg', top: 0.03, bottom: 0.1 },
      { t: 'rect', x: 0, y: 0, w: 100, h: 84, tone: 0.07 },
      { t: 'sign', x: 24, y: 8, w: 16, h: 6, text: '서고', tone: 0.5 },
      { t: 'door', x: 22, y: 18, w: 20, h: 66, tone: 0.2, bar: false },
      { t: 'rect', x: 27, y: 25, w: 10, h: 27, tone: 0.78 },
      { t: 'shelf', clip: [27, 25, 10, 27], x: 24, y: 24, w: 16, h: 30, rows: 4, tone: 0.55, seed: 61 },
      { t: 'person', who: 1, clip: [27, 25, 10, 27], x: 32, y: 54, h: 24, pose: 'read', face: -1, back: true, props: ['openbook'] },
      { t: 'glow', x: 32, y: 38, r: 20, a: 0.22 },
      { t: 'rect', x: 40.5, y: 52, w: 1.2, h: 4, tone: 0.6 },
      { t: 'floor', y: 84, far: 0.07, near: 0.14, vx: 40 },
      { t: 'truck', x: 74, y: 92, s: 28, books: 0 },
      { t: 'person', who: 10, x: 52, y: 92, h: 62, pose: 'key', face: -1, props: ['keys'] },
      { t: 'exit', x: 90, y: 10, s: 3 },
      { t: 'dark', a: 0.55 },
    ],
    vanish: [],
    spots: [
      { kind: 'person', photo: 1, x: 27, y: 25, w: 10, h: 27 },
      { kind: 'person', photo: 10, x: 43, y: 29, w: 17, h: 63 },
      {
        kind: 'zoom', id: 'csBook', label: '펼친 책', x: 29.5, y: 40, w: 6, h: 7,
        zoom: { style: 'spine', title: '유리창 너머 펼친 책', call: ['004', 'ㅇ52ㅇ'], lines: ['『운영체제 원리』'] },
      },
      {
        kind: 'zoom', id: 'stackLock', label: '서고 문', x: 22, y: 56, w: 18, h: 27,
        zoom: { style: 'note', title: '서고 문', lines: ['바깥에서 열쇠가 돌아가는 중이다.', '좁은 유리창 너머 서고 안은 환하다.', '무선 이어폰을 낀 사람이 등을 돌린 채 책을 펼치고 있다.'] },
      },
    ],
  },

  // ---------------------------------------------------------- 장면 7
  {
    id: 's7', no: 7, time: '22:47', sort: 2247, floor: 'B1', where: 'B1 참고자료서고',
    map: { x: 237, y: 160 }, entry: ['refStacks'], people: [2, 4, 3],
    image: 'assets/scenes/s7.jpg',
    lines: [
      { who: '여자', text: '찾았어요. 1985년 3월 4일, 이용자 번호 85-0001… 퇴실 기록이 없어요.' },
      { who: '여자', text: '희수 씨, 그 책 덮어요. 여기 원래 열람 금지예요.' },
      { who: '남자', text: '선배, 잠깐만예. 통로 불 좀 켤게예—' },
      { text: '(딸깍 — 오히려 꺼진다)', cue: 'click' },
      { who: '여자', text: '도윤아, 불!' },
    ],
    art: [
      { t: 'bg', top: 0.02, bottom: 0.08 },
      { t: 'aisle', vx: 50, vy: 42, half: 62, top: -12, bottom: 96, depth: 7, rows: 6, tone: 0.2, lit: 0, lights: 'off', seed: 71 },
      { t: 'glow', x: 100, y: 46, r: 48, a: 0.16 },
      { t: 'switch', x: 7, y: 50, s: 6, down: true },
      { t: 'person', who: 3, x: 72, y: 86, h: 54, pose: 'stop', face: -1, light: 0.85 },
      { t: 'person', who: 4, x: 18, y: 94, h: 60, pose: 'reach', face: -1 },
      { t: 'person', who: 2, x: 48, y: 92, h: 62, pose: 'read', face: 1, props: ['openbook', 'draft'] },
      { t: 'bookmark', x: 55, y: 66, s: 4.5, rot: 35 },
      { t: 'dark', a: 0.45 },
    ],
    vanish: [{ x: 39, y: 30, w: 18, h: 62, dir: 'up', amount: 0.3, seed: 22 }],
    spots: [
      { kind: 'person', photo: 2, x: 39, y: 30, w: 18, h: 62 },
      { kind: 'person', photo: 4, x: 9, y: 33, w: 17, h: 61 },
      { kind: 'person', photo: 3, x: 63, y: 36, w: 17, h: 50 },
      {
        kind: 'zoom', id: 'workTag', label: '가슴 명찰', x: 13, y: 47.5, w: 6, h: 7.5,
        zoom: { style: 'card', title: '가슴 명찰', head: '중앙도서관', lines: ['근로학생 · 문헌정보학과'], plain: true },
      },
      {
        kind: 'zoom', id: 'draftCover', label: '논문 초안', x: 41.5, y: 47.5, w: 6, h: 10,
        zoom: { style: 'paper', title: '겨드랑이에 낀 논문 초안', lines: ['**대학도서관 자동화 40년**', '— 문헌정보·사학과 석사과정 (초안)', '', '(표지에 이름은 적혀 있지 않다)'] },
      },
    ],
  },

  // ---------------------------------------------------------- 에필로그
  {
    id: 'epilogue', no: 8, epilogue: true, time: '1985.03.04 09:00', sort: 0, floor: '1F', where: '1층 출입 게이트',
    map: { x: 398, y: 236 }, entry: ['refStacks'], people: [],
    image: 'assets/scenes/epilogue.jpg',
    lines: [
      { who: '옛 방송', text: '도서관자동화시스템 가동 첫날입니다. 출입증을 단말기에 대 주십시오.' },
      { who: '젊은 목소리', text: '제가 첫 번째네요. 퇴실은… 나중에 찍으면 되죠?' },
    ],
    art: [
      { t: 'bg', top: 0.62, bottom: 0.5 },
      { t: 'window', x: 62, y: 8, w: 34, h: 50, sky: 0.86 },
      { t: 'glow', x: 78, y: 32, r: 50, a: 0.25 },
      { t: 'sign', x: 14, y: 8, w: 40, h: 7, text: '도서관자동화시스템 가동', tone: 0.82 },
      { t: 'floor', y: 76, far: 0.52, near: 0.62, vx: 45 },
      { t: 'rect', x: 31.5, y: 54, w: 5, h: 24, tone: 0.5 },
      { t: 'screen', x: 28, y: 41, w: 12, h: 13, on: true, stand: false, glow: 0.15 },
      { t: 'gate', x: 44, y: 56, w: 22, h: 22, n: 2 },
      { t: 'person', who: 'first', x: 50, y: 93, h: 62, pose: 'card', face: -1, props: ['card', 'books'] },
      { t: 'bookmark', x: 53, y: 62, s: 4, rot: 10 },
    ],
    vanish: [],
    spots: [
      {
        kind: 'note', id: 'first', label: '85-0001', tag: '85-0001', x: 40, y: 30, w: 17, h: 63,
        zoom: { style: 'note', title: '이용자 번호 85-0001', lines: ['1985년 3월 4일 09:00, 도서관자동화시스템의 첫 번째 입실자.', '손에 놋쇠 책갈피를 쥐고 있다. 당신이 가진 것과 같은 책갈피다.'] },
      },
    ],
  },
];
