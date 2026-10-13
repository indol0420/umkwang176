# 엄광로 176 — 동의대학교 방탈출 시리즈

건물 다섯 곳, 각자 멈춰 버린 밤. 첫 번째 테마는 **중앙도서관 편 『미퇴실자』**(약 30분)입니다.
HTML · CSS · 바닐라 JavaScript(ES 모듈)만 사용했고, 프레임워크·빌드 도구·외부 라이브러리는 없습니다.

---

## 1. 실행 방법

**VS Code Live Server**

1. VS Code에서 이 폴더(`umkwang176`)를 엽니다.
2. 확장 프로그램 **Live Server**를 설치합니다.
3. `index.html`을 오른쪽 클릭 → **Open with Live Server**.

**GitHub Pages**

1. 이 폴더 내용을 저장소에 올립니다(`index.html`이 저장소 맨 위에 오도록).
2. 저장소 **Settings → Pages → Branch: main / (root)** 로 저장합니다.
3. 잠시 뒤 표시되는 주소로 접속합니다.

> 파일을 더블클릭해서 여는 방식(`file://`)은 브라우저 보안 정책 때문에 ES 모듈이 막혀 실행되지 않습니다.

**개발 모드** — 주소 끝에 `?dev` 를 붙이면(예: `themes/library/index.html?dev`)

- 그림 위 클릭 영역이 점선으로 보이고, 그림을 누르면 그 자리의 **퍼센트 좌표**가 표시·복사됩니다.
- 콘솔에 `[data 점검]` 결과가 나옵니다(없는 장면 id, 정답 오타 등).
- 콘솔에서 `game.state` 로 진행 상황을 볼 수 있습니다.

---

## 2. 폴더 구조

```
index.html              첫 화면(건물 다섯 곳 스카이라인)
data/buildings.js       건물 목록, 열림/잠김(open), 팀명·과목명
assets/buildings/       건물 사진(선택)

core/                   모든 테마가 함께 쓰는 엔진
  game.js               게임 본체: 저장·화면 전환·3명 규칙 호출·힌트·엔딩
  explore.js            층 안내도 화면, 장소 화면(물건 클릭)
  scene.js              책갈피 장면: 암전 대사 → 정지 장면
  logbook.js            이용자 기록부: 명부·사진(운명 입력)·장면·안내도
  fate.js               운명 판정, 3명 규칙, 엔딩 고르기
  lock.js               숫자 자물쇠 키패드
  gate.js               정문 IC 게이트(퇴실 처리)
  ending.js             엔딩 연출
  map.js                층별 안내도 SVG
  render.js             그림 표시(사진 또는 임시 그림 → 디더링, 클릭 영역)
  dither.js             Atkinson 디더링(1비트 흑백 점묘)
  art.js                사진이 없을 때 그리는 임시 그림
  scatter.js            '종잇장처럼 흩어지는' 효과
  zoom.js               물건 확대 보기(사원증, 휴대폰, 청구기호, 문서)
  home.js               첫 화면
  storage.js            localStorage 저장(테마별)
  korean.js             은/는 등 조사 자동 처리
  sound.js              효과음(Web Audio로 합성, 파일 없음)
  ui.js · util.js       창·알림·타자 효과, 작은 도구 함수
  check.js              data 점검(개발 모드)
  css/                  base.css(공통) · home.css(첫 화면) · game.css(게임)
  fonts/                갈무리 픽셀 글꼴(SIL OFL 1.1)

themes/library/         중앙도서관 편 『미퇴실자』
  index.html            테마 시작 페이지(core + data를 불러온다)
  data/theme.js         테마 설정: 문구, 운명 선택지, 게이트, 엔딩, 도움말
  data/people.js        명부 10명(정답 포함)
  data/scenes.js        장면 7개 + 에필로그(대사, 임시 그림, 클릭 영역)
  data/places.js        탐색 지점 11곳
  data/locks.js         자물쇠 4개
  data/maps.js          층별 안내도(B1~5층)
  assets/scenes/        장면 사진
  assets/faces/         CCTV 얼굴 사진
  assets/places/        탐색 지점 사진(선택)
```

---

## 3. 장면 이미지를 실제 사진으로 바꾸기

1. 정해진 이름으로 사진을 넣습니다. **파일이 있으면 자동으로 사진을 디더링해서 쓰고, 없으면 임시 그림을 그립니다.**

   | 종류 | 경로 | 규격 |
   | --- | --- | --- |
   | 장면 | `themes/library/assets/scenes/s1.jpg` … `s7.jpg`, `epilogue.jpg` | 가로 16:9 |
   | CCTV 얼굴 | `themes/library/assets/faces/1.jpg` … `10.jpg` (번호 = 사진 번호) | 정사각, 정면 상반신 |
   | 탐색 지점(선택) | `themes/library/assets/places/desk.jpg` 등 (`places.js`의 id), `study3-open.jpg` | 가로 16:9 |
   | 건물 카드(선택) | `assets/buildings/library.jpg` | 세로가 조금 긴 사진 |

2. `?dev` 로 열고 장면을 띄운 뒤, 인물·물건이 있는 곳을 눌러 좌표를 확인합니다.
3. `data/scenes.js` 의 `spots`(클릭 영역)와 `vanish`(흩어지는 사람 영역)의 `x, y, w, h` 를 사진에 맞게 고칩니다. 값은 **그림 크기에 대한 퍼센트(0~100)** 입니다.
4. 촬영 팁: 인물은 밝게, 배경은 어둡게 찍어야 디더링 후에도 형태가 살아납니다. 흩어지는 효과는 코드가 넣으므로 정지 포즈만 잡으면 됩니다.

> 사진을 넣기 전까지 브라우저 콘솔에 사진 파일의 404 오류가 보이는 것은 정상입니다.

---

## 4. 새 건물 테마 추가하기

1. `themes/library` 폴더를 통째로 복사해 이름을 바꿉니다(예: `themes/dorm`).
2. `data/theme.js` 의 `id`, `building`, `title`, 문구를 바꿉니다. **`id` 는 `data/buildings.js` 의 건물 id 와 같아야** 저장 기록과 첫 화면 진행 표시가 연결됩니다.
3. `people.js`(명부·정답), `scenes.js`, `places.js`, `locks.js`, `maps.js` 내용을 새 건물에 맞게 채웁니다. 정답의 경위·원인은 `theme.js` 의 `fates`·`phenomena`·이름과 글자가 똑같아야 합니다.
4. `data/buildings.js` 에서 그 건물을 `open: true` 로 바꾸고 `path`, `title`, `intro`, `minutes`, `people` 을 적습니다.
5. `?dev` 로 열어 콘솔의 `[data 점검]` 이 **문제 없음** 인지 확인합니다.

core 폴더는 고칠 필요가 없습니다.

---

## 5. 발표용: 기능별 코드 위치

| 기능 | 파일 · 함수 |
| --- | --- |
| 3명 규칙(3명씩 확정, 3명 미만 남으면 함께 확정) | `core/fate.js` `applyThreeRule()` |
| 운명 입력 → 확정 → 카운터 감소 | `core/game.js` `setGuess()` |
| 책갈피 장면(암전 대사 타자 효과 → 정지 장면) | `core/scene.js` `playScene()`, `blackout()` |
| Atkinson 디더링 | `core/dither.js` `atkinson()` |
| 종잇장처럼 흩어지는 효과 | `core/scatter.js` `erode()`, `SheetLayer` |
| 사진이 없을 때 임시 그림(사람·서가·책 등) | `core/art.js` `drawArt()`, `drawBust()` |
| 이름 받침에 따라 은/는 | `core/korean.js` `josa()` |
| 숫자 자물쇠 | `core/lock.js` `openKeypad()` |
| 막힘 방지 힌트(5분) | `core/game.js` `hintTarget()` |
| 테마별 저장 / 처음부터 다시 하기 | `core/storage.js`, `core/game.js` `reset()` |
| 엔딩 고르기(10·6·0명 기준) | `core/fate.js` `pickEnding()` |

**저장 구조** — `localStorage` 의 `umkwang176:library` 에 테마별로 저장됩니다. '처음부터 다시 하기'는 이 키 하나만 지우므로 다른 건물 기록은 남습니다. 소리·힌트 설정은 `umkwang176:settings`.

---

## 6. [임시]로 남긴 것 · 팀 확인 필요

- 장면·얼굴·장소·건물 그림은 모두 **임시 그림**입니다(실제 사진으로 교체 예정).
- 홍보영상 캡처와 공간 메모가 비어 있어, 실제 내부 모습(좌석 형태·칸막이·서가 색·조명)은 반영하지 못했습니다. 층별 배치는 첨부한 안내도를 따랐습니다.
- 대학 본관·수덕전·행복기숙사·국제관 실루엣은 실제 건물 모양이 아닌 임시 모양입니다.
- 팀명(`data/buildings.js` 의 `team`), 학과명(건축학과·경영학과·컴퓨터공학과), 사투리·외국어 대사 감수가 필요합니다.

---

## 7. 정답(검수용 · 스포일러)

- 자물쇠: ① 3105 ② 7137 ③ 0417 ④ 0304
- 명부 정답: `themes/library/data/people.js` 의 `answer`

## 글꼴

갈무리(Galmuri11, Galmuri14) — © Lee Minseo, SIL Open Font License 1.1. 라이선스 전문은 `core/fonts/OFL.md`.
