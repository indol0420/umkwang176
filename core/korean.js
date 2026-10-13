// =========================================================
// korean.js — 이름 뒤에 붙는 조사(은/는, 이/가 등) 처리
// =========================================================

// 숫자를 읽었을 때 받침이 있는 숫자: 영·일·삼·육·칠·팔
const DIGIT_FINAL = '013678';

// 마지막 글자에 받침이 있는지 확인한다
export function hasFinal(word) {
  const text = String(word).trim();
  if (!text) return false;
  const ch = text[text.length - 1];
  const code = ch.charCodeAt(0);
  if (code >= 0xac00 && code <= 0xd7a3) return (code - 0xac00) % 28 !== 0; // 한글 음절
  if (/[0-9]/.test(ch)) return DIGIT_FINAL.includes(ch);
  if (/[a-z]/i.test(ch)) return 'lmnr'.includes(ch.toLowerCase()); // 영문은 대략
  return false;
}

// 조사를 붙인다. 예: josa('윤서경', '은/는') → '윤서경은'
export function josa(word, pair) {
  const [withFinal, withoutFinal] = pair.split('/');
  return `${word}${hasFinal(word) ? withFinal : withoutFinal}`;
}
