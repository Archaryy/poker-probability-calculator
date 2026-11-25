import { bestScore } from './evaluator.js';
import { RANGE_COMBOS } from './ranges.js';
export const RUNS = 6000; 

export function simulate(hero, board, opponents, runs, range) {
  const dead = new Set([...hero, ...board]);
  const everything = RANGE_COMBOS[range];
  const combos = [];
  for (let i = 0; i < everything.length; i += 2) {
    if (!dead.has(everything[i]) && !dead.has(everything[i + 1])) combos.push([everything[i], everything[i + 1]]);
  }
  const boardNeeded = 5 - board.length;

  let played = 0, wins = 0, ties = 0, share = 0;
  for (let run = 0; run < runs; run++) {
    const used = new Set(dead);
    const hands = [];
    for (let o = 0; o < opponents; o++) {
      let hand = null;
      for (let tries = 0; tries < 60 && !hand; tries++) {
        const pick = combos[Math.floor(Math.random() * combos.length)];
        if (!used.has(pick[0]) && !used.has(pick[1])) hand = pick;
      }
      if (!hand) break;
      used.add(hand[0]); used.add(hand[1]); hands.push(hand);
    }
    if (hands.length < opponents) continue;        // could not deal this one, skip it

    const fullBoard = [...board];
    while (fullBoard.length < 5) {
      const c = Math.floor(Math.random() * 52);
      if (!used.has(c)) { used.add(c); fullBoard.push(c); }
    }
    const heroScore = bestScore([...hero, ...fullBoard]);
    let best = -1, tiedWith = 0;
    for (const hand of hands) {
      const score = bestScore([...hand, ...fullBoard]);
      if (score > best) { best = score; tiedWith = 1; }
      else if (score === best) { tiedWith++; }
    }
    played++;
    if (heroScore > best) { wins++; share += 1; }
    else if (heroScore === best) { ties++; share += 1 / (tiedWith + 1); }
  }
  return { win: wins / played, tie: ties / played, equity: share / played };
}