import { RANK_NAME, RANK_PLURAL } from './cards.js';

// turn 5 cards into a number, better hand bigger number
// 0 -> high card, 1 -> pair, 2 -> two pair, 3 -> threes, 4 -> straight, 5 -> flush, 6 -> full house, 7 -> fours, 8 -> straight flush
export function score5(cards) {
    const ranks = cards.map(c => c >> 2).sort((a, b) => b - a);
    const flush = cards.every(c => (c & 3) === (cards[0] & 3));

    // count how many of each rank
    const counts = {};
    ranks.forEach(r => {
        counts[r] = (counts[r] || 0) + 1
    });
    const groups = Object.keys(counts).map(r => [counts[r], Number(r)]).sort((a, b) => b[0] - a[0] || b[1] - a[1]);

    // straight
    let straightHigh = -1;
    if (groups.length === 5) {
        if (ranks[0] - ranks[4] === 4) straightHigh = ranks[0];
        else if (ranks[0] === 12 && ranks[1] === 3) straightHigh = 3;
    }

    let category;
    if (straightHigh >= 0 && flush) category = 8;
    else if (groups[0][0] === 4) category = 7;
    else if (groups[0][0] === 3 && groups[1][0] === 2) category = 6;
    else if (flush) category = 5;
    else if (straightHigh >= 0) category = 4;
    else if (groups[0][0] === 3) category = 3;
    else if (groups[0][0] === 2 && groups[1][0] === 2) category = 2;
    else if (groups[0][0] === 2) category = 1;
    else category = 0;

    // tie breakers
    const tiebreak = straightHigh >=0 ? [straightHigh] : groups.map(g => g[1]);
    let score = category;
    for (let i = 0; i < 5; i++) {
        score = score * 16 + (tiebreak[i] || 0);
    }
    return score;
}

// finding best 5 of 7 cards
export function combinations(list, k) {
    const out = [];
    function choose(start, chosen) {
        if (chosen.length === k) {
            out.push(chosen.slice()); return;
        }
        for (let i = start; i < list.length; i++) {
            chosen.push(list[i]);
            choose(i + 1, chosen);
            chosen.pop();
        }
    }
    choose(0, []);
    return out;
}

//texas holdem
const comboCache = {};
export function bestScore(cards) {
    const n = cards.length;
    if (!comboCache[n]) comboCache[n] = combinations([...Array(n).keys()], 5);
    let best = -1;
    for (const picks of comboCache[n]) {
        const score = score5(picks.map(i => cards[i]));
        if (score > best) best = score;
    }
    return best;
}

// turns a score from bestScore back into words.
export function describe(score) {
  const category = score >> 20;
  const a = (score >> 16) & 15;
  const b = (score >> 12) & 15;
  switch (category) {
    case 0: return RANK_NAME[a] + ' high';
    case 1: return 'Pair of ' + RANK_PLURAL[a];
    case 2: return 'Two pair, ' + RANK_PLURAL[a] + ' and ' + RANK_PLURAL[b];
    case 3: return 'Three ' + RANK_PLURAL[a];
    case 4: return 'Straight, ' + RANK_NAME[a].toLowerCase() + ' high';
    case 5: return 'Flush, ' + RANK_NAME[a].toLowerCase() + ' high';
    case 6: return RANK_PLURAL[a] + ' full of ' + RANK_PLURAL[b];
    case 7: return 'Four ' + RANK_PLURAL[a];
    default: return a === 12 ? 'Royal flush' : 'Straight flush, ' + RANK_NAME[a].toLowerCase() + ' high';
  }
}

// fewer than 5 cards cannot use bestScore, directly name hand
export function nameHand(cards) {
  if (cards.length >= 5) {
    return describe(bestScore(cards));
  }
  const ranks = cards.map(c => c >> 2).sort((a, b) => b - a);
  return ranks[0] === ranks[1] ? 'Pair of '+ RANK_PLURAL[ranks[0]] : RANK_NAME[ranks[0]] + ' high';
}

function categoryOf(cards) {
  if (cards.length >= 5) return bestScore(cards) >> 20;
  const counts = {};
  cards.forEach(c => { counts[c >> 2] = (counts[c >> 2] || 0) + 1; });
  const sizes = Object.values(counts).sort((a, b) => b - a);
  if (sizes[0] === 4) return 7;
  if (sizes[0] === 3) return 3;
  if (sizes[0] === 2 && sizes[1] === 2) return 2;
  if (sizes[0] === 2) return 1;
  return 0;
}

// out -> card that make hand a better one
export function countOuts(hero, board) {
  if (board.length < 3 || board.length > 4) return null;
  const known = [...hero, ...board];
  const now = categoryOf(known);
  let outs = 0;
  for (let c = 0; c < 52; c++) {
    if (known.includes(c)) continue;
    const later = categoryOf([...known, c]);
    const boardAlone = categoryOf([...board, c]);
    if (later > now && later > boardAlone) outs++;
  }
  return outs;
}