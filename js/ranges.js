// ---- ranking every starting hand (the Chen formula) ----
function chen(high, low, suited) {
  const points = r => r === 12 ? 10 : r === 11 ? 8 : r === 10 ? 7 : r === 9 ? 6 : (r + 2) / 2;
  let score;
  if (high === low) {
    score = Math.max(5, points(high) * 2);                 // pairs are worth double
  } else {
    score = points(high);
    if (suited) score += 2;
    const gap = high - low - 1;                            // cards missing between the two
    score -= gap === 0 ? 0 : gap === 1 ? 1 : gap === 2 ? 2 : gap === 3 ? 4 : 5;
    if (gap <= 1 && high < 10) score += 1;                 // small connectors can make straights
  }
  return Math.ceil(score);
}
// There are 169 kinds of starting hand and 1,326 actual combinations of two cards.
export const CLASS_PCT = {};       // "how good is this hand" as a percentage, for AKs, 72o and so on
const KINDS = [];                  // all 169 kinds, best first
(function buildKinds() {
  for (let high = 12; high >= 0; high--) {
    for (let low = high; low >= 0; low--) {
      if (high === low) KINDS.push({ high, low, suited: 0, count: 6 });
      else {
        KINDS.push({ high, low, suited: 1, count: 4 });
        KINDS.push({ high, low, suited: 0, count: 12 });
      }
    }
  }
  KINDS.forEach(k => { k.score = chen(k.high, k.low, k.suited) * 1000 + k.high * 20 + k.low + (k.suited ? 0.5 : 0); });
  KINDS.sort((a, b) => b.score - a.score);                 // best hands first

  let running = 0;
  KINDS.forEach(k => {
    running += k.count;
    k.cumulative = running;
    CLASS_PCT[k.high * 26 + k.low * 2 + k.suited] = running / 1326 * 100;
  });
})();

// The allowed two-card hands for "the best X of all hands", X from 0.05 (5%) to 1 (any hand).
// Each value is worked out once and then remembered.
const rangeCache = {};
export function getRange(fraction) {
  const f = Math.min(1, Math.max(0.05, Math.round(fraction * 100) / 100));
  if (rangeCache[f]) return rangeCache[f];
  const limit = Math.max(f * 1326, KINDS[0].count);
  const allowed = new Set();
  KINDS.forEach(k => { if (k.cumulative <= limit || k === KINDS[0]) allowed.add(k.high * 26 + k.low * 2 + k.suited); });
  const list = [];
  for (let a = 0; a < 52; a++) {
    for (let b = a + 1; b < 52; b++) {
      const ra = a >> 2, rb = b >> 2;
      const high = Math.max(ra, rb), low = Math.min(ra, rb);
      const suited = (a & 3) === (b & 3) ? 1 : 0;
      if (allowed.has(high * 26 + low * 2 + suited)) list.push(a, b);
    }
  }
  rangeCache[f] = list;
  return list;
}