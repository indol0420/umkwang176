// =========================================================
// people.js — 이용자 명부 10명 (정답 포함 · 스포일러 주의)
// photo : IC 게이트 CCTV 사진 번호(입실 순서)
// seat  : 배정 좌석. null 이면 [훼손], '—' 이면 좌석 없음(직원)
// look  : 사진이 없을 때 그리는 임시 그림의 외형
// answer: 정답 운명(경위·원인) — fates·causes 목록의 글자와 똑같이 적는다
// =========================================================
export const people = [
  {
    photo: 1, time: '09:00', sec: 12,
    name: '천위', original: '陈雨',
    role: '유학생(대학원 석사)', dept: '컴퓨터공학과', from: '중국 칭다오', seat: null,
    desc: '포니테일, 무선 이어폰, 노트북',
    look: { hair: 'pony', hairTone: 0.1, top: 'shirt', topTone: 0.72, bottom: 0.28, extras: ['earbuds'] },
    answer: { fate: '서고에 갇혔다', cause: '박만수' },
  },
  {
    photo: 2, time: '10:20', sec: 47,
    name: '서희수',
    role: '대학원생(석사)', dept: '대학원 문헌정보·사학과', from: '경기 수원', seat: '대학원열람실 07번',
    desc: '묶은 긴 머리, 트렌치코트, 논문 초안',
    look: { hair: 'tied', hairTone: 0.14, top: 'coat', topTone: 0.66, bottom: 0.3 },
    answer: { fate: '책 속으로 사라졌다', cause: '최도윤' },
  },
  {
    photo: 3, time: '13:00', sec: 5,
    name: '윤서경',
    role: '사서', dept: '학술지원팀', from: '서울', seat: '—',
    desc: '단발, 안경, 회색 카디건, 사원증',
    look: { hair: 'bob', hairTone: 0.12, glasses: true, top: 'cardigan', topTone: 0.56, bottom: 0.26, extras: ['badge'] },
    answer: { fate: '책 속으로 사라졌다', cause: '자동 소등' },
  },
  {
    photo: 4, time: '13:05', sec: 33,
    name: '최도윤',
    role: '근로학생(2학년)', dept: '문헌정보학과', from: '경남 김해', seat: '—',
    desc: "후드티, '근로학생' 명찰",
    look: { hair: 'short', hairTone: 0.1, top: 'hoodie', topTone: 0.5, bottom: 0.24, extras: ['nametag'] },
    answer: { fate: '아직 도서관 안에 있다', cause: '해당 없음' },
  },
  {
    photo: 5, time: '15:40', sec: 21,
    name: '양은서',
    role: '학부생(3학년)', dept: '국어국문학과', from: '광주', seat: null,
    desc: '니트 조끼, 짧은 머리',
    look: { hair: 'crop', hairTone: 0.12, top: 'knit', topTone: 0.42, shirt: 0.88, bottom: 0.3 },
    answer: { fate: '책 속으로 사라졌다', cause: '박만수' },
  },
  {
    photo: 6, time: '17:50', sec: 9,
    name: '조순임',
    role: '미화원', dept: '환경미화', from: '전남 목포', seat: '—',
    desc: '미화 조끼, 두건, 고무장갑, 청소 카트',
    look: { hat: 'scarf', top: 'vest', topTone: 0.46, shirt: 0.62, bottom: 0.3, extras: ['gloves'] },
    answer: { fate: '비상구로 탈출했다', cause: '박만수' },
  },
  {
    photo: 7, time: '18:30', sec: 54,
    name: '하준호',
    role: '학부생(4학년)', dept: '경찰행정학과', from: '부산 사하', seat: null,
    desc: '짧은 머리, 반팔 티, 휴대폰 케이스에 학생증',
    look: { hair: 'buzz', top: 'tee', topTone: 0.86, bottom: 0.26 },
    answer: { fate: '책 속으로 사라졌다', cause: '자동 소등' },
  },
  {
    photo: 8, time: '19:20', sec: 38,
    name: '고한결',
    role: '학부생(2학년)', dept: '건축학과', from: '제주', seat: '제3열람실 035번',
    desc: '비니, 감귤 키링 가방, 감귤 휴대폰 케이스',
    look: { hat: 'beanie', top: 'shirt', topTone: 0.38, bottom: 0.22 },
    answer: { fate: '책 속으로 사라졌다', cause: '조순임' },
  },
  {
    photo: 9, time: '20:55', sec: 16,
    name: '응우옌 티 마이', original: 'Nguyễn Thị Mai',
    role: '유학생(학부 3학년)', dept: '경영학과', from: '베트남 다낭', seat: null,
    desc: '긴 머리, 큰 경찰행정학과 과잠',
    look: { hair: 'long', hairTone: 0.1, top: 'jacket', topTone: 0.28, bottom: 0.34 },
    answer: { fate: '비상구로 탈출했다', cause: '박만수' },
  },
  {
    photo: 10, time: '21:50', sec: 3,
    name: '박만수',
    role: '경비원', dept: '시설관리', from: '부산 영도', seat: '—',
    desc: '경비 제복과 모자, 손전등, 열쇠 꾸러미',
    look: { hat: 'cap', hair: 'short', top: 'uniform', topTone: 0.32, bottom: 0.2, skin: 0.8, extras: ['nametag'] },
    answer: { fate: '책 속으로 사라졌다', cause: '자동 소등' },
  },
];

// 명부에 없는 인물의 임시 그림 외형(주인공, 1985년의 첫 입실자)
export const extraLooks = {
  me: { hair: 'short', hairTone: 0.12, top: 'shirt', topTone: 0.48, bottom: 0.24 },
  first: { hair: 'short', hairTone: 0.08, top: 'coat', topTone: 0.18, bottom: 0.12, skin: 0.9 },
};
