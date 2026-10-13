// =========================================================
// buildings.js — 첫 화면에 나오는 건물 5곳과 사이트 정보
// 건물을 열려면 open 값 하나만 true 로 바꾸고, 그 건물의 테마 폴더(path)를 만들면 된다.
// =========================================================

// 사이트 정보(하단 크레딧)
export const site = {
  title: '엄광로 176',
  subtitle: '동의대학교 방탈출 시리즈',
  tagline: '건물 다섯 곳, 각자 멈춰 버린 밤',
  team: '팀명', // ← 우리 팀 이름으로 바꾸세요
  course: '웹기획및개발',
  year: '2026',
};

// 건물 목록(왼쪽부터 이 순서로 스카이라인을 이룬다)
//  id     : 테마 data의 id와 같은 이름(저장 기록을 찾을 때 쓴다)
//  open   : true 면 열린 건물(창문에 불), false 면 잠긴 건물(검은 실루엣)
//  path   : 테마 시작 페이지
//  image  : 건물 사진(없으면 shape 모양으로 실루엣을 그린다)
//  shape  : 실루엣 모양 form(tower / hall / library / twin / stack), tall(그림 높이 배율)  [임시]
export const buildings = [
  {
    id: 'main',
    name: '대학 본관',
    open: false,
    shape: { form: 'tower', tall: 1.15 },
  },
  {
    id: 'sudeok',
    name: '수덕전',
    open: false,
    shape: { form: 'hall', tall: 0.8 },
  },
  {
    id: 'library',
    name: '중앙도서관',
    open: true,
    path: 'themes/library/index.html',
    title: '미퇴실자',
    intro: '폐관 후 새벽, 게이트는 아직 열 명이 퇴실하지 않았다고 말한다.',
    minutes: 30,
    people: 10,
    image: 'assets/buildings/library.jpg',
    shape: { form: 'library', tall: 1.0 },
  },
  {
    id: 'dorm',
    name: '행복기숙사',
    open: false,
    shape: { form: 'twin', tall: 1.22 },
  },
  {
    id: 'intl',
    name: '국제관',
    open: false,
    shape: { form: 'stack', tall: 0.9 },
  },
];
