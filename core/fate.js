// =========================================================
// fate.js — 운명 판정과 3명 규칙
// =========================================================

// 한 사람의 기록(이름·경위·원인)이 모두 맞는지
export function isRight(person, guess) {
  return Boolean(guess) && guess.name === person.name && guess.fate === person.answer.fate && guess.cause === person.answer.cause;
}

// 이름·경위·원인이 다 채워졌는지(정답 여부와 상관없이)
export function isFilled(guess) {
  return Boolean(guess && guess.name && guess.fate && guess.cause);
}

// 3명 규칙: 새로 확정할 사진 번호를 묶음 단위로 돌려준다
//  - 맞았지만 아직 확정되지 않은 사람이 3명 이상 모이면 그중 3명을 확정
//  - 미확정 인원이 3명 미만으로 남으면, 남은 사람이 모두 맞았을 때 함께 확정
//  → 확정 인원은 0·3·6·9·10명 중 하나가 된다
export function applyThreeRule(people, guesses, confirmed) {
  const done = new Set(confirmed);
  const batches = [];
  for (;;) {
    const pending = people.filter((p) => !done.has(p.photo));
    const right = pending.filter((p) => isRight(p, guesses[p.photo]));
    let batch = [];
    if (pending.length >= 3 && right.length >= 3) batch = right.slice(0, 3);
    else if (pending.length > 0 && pending.length < 3 && right.length === pending.length) batch = right;
    if (!batch.length) break;
    for (const p of batch) done.add(p.photo);
    batches.push(batch.map((p) => p.photo));
  }
  return batches;
}

// 확정 인원으로 엔딩을 고른다(min이 큰 것부터 적혀 있어야 한다)
export function pickEnding(endings, count) {
  return endings.find((e) => count >= e.min) || endings[endings.length - 1];
}

// 엔딩 순위(좋은 엔딩일수록 작은 숫자)
export function endingRank(endings, id) {
  const i = endings.findIndex((e) => e.id === id);
  return i === -1 ? 99 : i;
}
