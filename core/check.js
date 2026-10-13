// =========================================================
// check.js — 테마 data 점검(개발 모드 ?dev 에서만 실행)
// 새 건물 data를 만들다 생긴 실수를 콘솔에 알려 준다.
// =========================================================

// 잘못된 연결(없는 장면 id, 없는 사진 번호, 정답 오타 등)을 찾는다
export function checkTheme(theme) {
  const problems = [];
  const photos = new Set(theme.people.map((p) => p.photo));
  const names = new Set(theme.people.map((p) => p.name));
  const scenes = new Set(theme.scenes.map((s) => s.id));
  const places = new Set(theme.places.map((p) => p.id));
  const floors = new Set(theme.floors.map((f) => f.id));
  const locks = new Set(theme.locks.map((l) => l.id));
  const causes = new Set([...names, ...theme.phenomena]);

  for (const p of theme.people) {
    if (!theme.fates.includes(p.answer.fate)) problems.push(`사진 #${p.photo} 정답 경위가 목록에 없음: ${p.answer.fate}`);
    if (!causes.has(p.answer.cause)) problems.push(`사진 #${p.photo} 정답 원인이 목록에 없음: ${p.answer.cause}`);
  }
  for (const s of theme.scenes) {
    if (!floors.has(s.floor)) problems.push(`장면 ${s.id}: 층 ${s.floor} 없음`);
    if ((s.lines || []).length > 5) problems.push(`장면 ${s.id}: 암전 대사가 5줄을 넘음`);
    for (const ph of s.people) if (!photos.has(ph)) problems.push(`장면 ${s.id}: 사진 #${ph} 없음`);
    for (const e of s.entry || []) if (!places.has(e)) problems.push(`장면 ${s.id}: 입구 장소 ${e} 없음`);
    for (const sp of s.spots) {
      if (sp.kind === 'person' && !photos.has(sp.photo)) problems.push(`장면 ${s.id}: 클릭 영역의 사진 #${sp.photo} 없음`);
      if (sp.kind === 'portal' && !scenes.has(sp.to)) problems.push(`장면 ${s.id}: 이어지는 장면 ${sp.to} 없음`);
    }
  }
  for (const p of theme.places) {
    if (!floors.has(p.floor)) problems.push(`장소 ${p.id}: 층 ${p.floor} 없음`);
    if (p.lock && !locks.has(p.lock)) problems.push(`장소 ${p.id}: 자물쇠 ${p.lock} 없음`);
    for (const o of p.objects) {
      if (o.kind === 'portal' && !scenes.has(o.to)) problems.push(`장소 ${p.id}: 장면 ${o.to} 없음`);
      if (o.kind === 'lock' && !locks.has(o.lock)) problems.push(`장소 ${p.id}: 자물쇠 ${o.lock} 없음`);
    }
  }
  for (const f of theme.floors) if (f.lock && !locks.has(f.lock)) problems.push(`층 ${f.id}: 자물쇠 ${f.lock} 없음`);
  if (!places.has(theme.startPlace)) problems.push(`시작 장소 ${theme.startPlace} 없음`);
  if (!scenes.has(theme.finalScene)) problems.push(`마지막 장면 ${theme.finalScene} 없음`);

  if (problems.length) console.warn(`[data 점검] 문제 ${problems.length}개\n- ${problems.join('\n- ')}`);
  else console.info('[data 점검] 문제 없음 ✓');
  return problems;
}
