//   rank = which of the 13 ranks (0 = Two ... 12 = Ace)
//   suit = which of the 4 suits  (0 = spades, 1 = hearts, 2 = diamonds, 3 = clubs)
//   id   = rank * 4 + suit
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const SUITS = ['♠', '♥', '♦', '♣'];

function cardText(id) {
  return RANKS[id >> 2] + SUITS[id & 3];   // id >> 2 means "divide by 4"; id & 3 means "remainder after dividing by 4"
}
function isRed(id) {
  const suit = id & 3;
  return suit === 1 || suit === 2;         // hearts and diamonds
}

// Build the deck: one row per suit with a big symbol on the left, then 13 small cards.
const deckDiv = document.getElementById('deck');
for (let suit = 0; suit < 4; suit++) {
  const row = document.createElement('div');
  row.className = 'suit-row';

  const glyph = document.createElement('div');
  glyph.className = 'suit-glyph ' + 'shdc'[suit];
  glyph.textContent = SUITS[suit];

  const ranks = document.createElement('div');
  ranks.className = 'ranks';
  for (let rank = 0; rank < 13; rank++) {
    const id = rank * 4 + suit;
    const button = document.createElement('button');
    button.className = 'pick ' + 'shdc'[suit];
    button.innerHTML = '<span class="r">' + RANKS[rank] + '</span><span class="g">' + SUITS[suit] + '</span>';
    button.setAttribute('aria-label', cardText(id));
    button.dataset.id = id;
    button.addEventListener('click', () => pickCard(id));
    ranks.appendChild(button);
  }
  row.appendChild(glyph);
  row.appendChild(ranks);
  deckDiv.appendChild(row);
}

const slots = [null, null, null, null, null, null, null];
let target = 0;
let onChange = function () {};

const slotButtons = document.querySelectorAll('.slot');
slotButtons.forEach((button, i) => {
button.addEventListener('click', () => {
    target = i;
    render();
});
});

function pickCard(id) {
    const where = slots.indexOf(id);
    if (where !== -1) {
        slots[where] = null;
        target = where;
    } else {
        slots[target] = id;
        const nextEmpty = slots.indexOf(null);
        if (nextEmpty !== -1) target = nextEmpty;
    }
    render();
}

const SLOT_NAMES = ['Hole 1', 'Hole 2', 'Flop 1', 'Flop 2', 'Flop 3', 'Turn', 'River'];

// Where the little suit symbols go on a number card.
// [column, row]: columns 0-2 left to right, rows 0-6 top to bottom.
const LAYOUT = {
  2: [[1, 0], [1, 6]],
  3: [[1, 0], [1, 3], [1, 6]],
  4: [[0, 0], [2, 0], [0, 6], [2, 6]],
  5: [[0, 0], [2, 0], [1, 3], [0, 6], [2, 6]],
  6: [[0, 0], [2, 0], [0, 3], [2, 3], [0, 6], [2, 6]],
  7: [[0, 0], [2, 0], [1, 1.5], [0, 3], [2, 3], [0, 6], [2, 6]],
  8: [[0, 0], [2, 0], [1, 1.5], [0, 3], [2, 3], [1, 4.5], [0, 6], [2, 6]],
  9: [[0, 0], [2, 0], [0, 2], [2, 2], [1, 3], [0, 4], [2, 4], [0, 6], [2, 6]],
  10: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2], [0, 4], [2, 4], [1, 5], [0, 6], [2, 6]]
};

// Draws the inside of one card as HTML.
function cardFace(id) {
  const rank = id >> 2;
  const suit = SUITS[id & 3];
  const label = RANKS[rank];
  const corner = '<b' + (label === '10' ? ' class="ten"' : '') + '>' + label + '</b><i>' + suit + '</i>';
  let html = '<span class="ci tl">' + corner + '</span><span class="ci br">' + corner + '</span>';

  if (rank === 12) {                       // Ace: one big symbol
    html += '<span class="ace">' + suit + '</span>';
  } else if (rank >= 9) {                  // Jack, Queen, King: a framed letter
    html += '<span class="royal"><i>' + suit + '</i><b>' + label + '</b><i class="flip">' + suit + '</i></span>';
  } else {                                 // 2 to 10: the right number of symbols
    let pips = '';
    for (const [col, row] of LAYOUT[rank + 2]) {
      const flip = row > 3 ? ' flip' : '';  // the bottom half is upside down, like a real card
      pips += '<span class="pip' + flip + '" style="left:' + (col * 50) + '%;top:' + (row / 6 * 100) + '%">' + suit + '</span>';
    }
    html += '<span class="pips">' + pips + '</span>';
  }
  return html;
}

const shown = [null, null, null, null, null, null, null];   // what each slot showed last time
const streetTag = document.getElementById('street');
const assignLabel = document.getElementById('assign');
const STREETS = { 0: 'Preflop', 3: 'Flop', 4: 'Turn', 5: 'River' };

// render() makes the screen match the data in `slots`.
function render() {
  slotButtons.forEach((button, i) => {
    const id = slots[i];
    button.classList.toggle('filled', id !== null);
    button.classList.toggle('active', i === target);
    'shdc'.split('').forEach(letter => button.classList.remove(letter));
    if (id === null) {
      button.innerHTML = '<span class="plus">+</span><span class="slot-name">' + SLOT_NAMES[i] + '</span>';
      button.setAttribute('aria-label', SLOT_NAMES[i] + ', empty');
    } else {
      button.classList.add('shdc'[id & 3]);                 // s, h, d or c sets the colour
      button.innerHTML = cardFace(id);
      button.setAttribute('aria-label', SLOT_NAMES[i] + ', ' + cardText(id));
      if (shown[i] !== id) {                                 // a new card: play the deal animation
        button.classList.remove('deal');
        void button.offsetWidth;                             // lets the browser restart the animation
        button.classList.add('deal');
      }
    }
    shown[i] = id;
  });

  document.querySelectorAll('.pick').forEach(button => {
    const where = slots.indexOf(Number(button.dataset.id));
    button.classList.toggle('used', where !== -1);
    button.classList.toggle('hole', where !== -1 && where < 2);
    button.classList.toggle('board', where >= 2);
  });

  const boardCount = slots.slice(2).filter(c => c !== null).length;
  streetTag.textContent = STREETS[boardCount] || boardCount + ' of 3 flop cards';
  assignLabel.textContent = 'Filling: ' + SLOT_NAMES[target];
  onChange();
}
// Draw the first time once the whole page has loaded.
window.addEventListener('load', render);

const potInput = document.getElementById('pot');
const betInput = document.getElementById('bet');
const oddsText = document.getElementById('odds');

function getPot() { return Number(potInput.value) || 0; }
function getBet() { return Number(betInput.value) || 0; }

// break even formula
function requiredEquity(pot, bet) {
    return bet / (pot + 2 * bet);
}

function showOdds() {
    const pot = getPot();
    const bet = getBet();
    if(bet > 0) {
        const percent = (requiredEquity(pot, bet) * 100).toFixed(1);
        oddsText.textContent = 'You must win at least ' + percent + '% of the time to break even.';
    } else {
        oddsText.textContent = 'No bet to call. Checking is free.';
    }
    onChange();
}

potInput.addEventListener('input', showOdds);
betInput.addEventListener('input', showOdds);
showOdds();

// turn 5 cards into a number, better hand bigger number
// 0 -> high card, 1 -> pair, 2 -> two pair, 3 -> threes, 4 -> straight, 5 -> flush, 6 -> full house, 7 -> fours, 8 -> straight flush
function score5(cards) {
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
function combinations(list, k) {
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
function bestScore(cards) {
    const n = cards.length;
    if (!comboCache[n]) comboCache[n] = combinations([...Array(n).keys()], 5);
    let best = -1;
    for (const picks of comboCache[n]) {
        const score = score5(picks.map(i => cards[i]));
        if (score > best) best = score;
    }
    return best;
}

function card(text) {
  return '23456789TJQKA'.indexOf(text[0]) * 4 + 'shdc'.indexOf(text[1]);
}

const settings = { opps: 1 };      // how many opponents
const RUNS = 6000;                 // how many deals each simulation plays out
const updaters = [];               // each function in here draws one part of the screen
const app = document.getElementById('app');

// ---- number formatting ----
function money(x, decimals = 0) {
  return '$' + Math.abs(x).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
function signed(x) { return (x >= 0 ? '+' : '\u2212') + money(x, 2); }
function pct(p) { return (p * 100).toFixed(1) + '%'; }

// ---- simulation, with a memory so we only re-run it when the cards change ----
let lastKey = '';
let lastResult = null;

// ---- gather everything the screen needs into one object, then let each updater draw ----
function calculate() {
  const hero = slots.slice(0, 2).filter(c => c !== null);
  const board = slots.slice(2).filter(c => c !== null);
  const pot = getPot();
  const bet = getBet();
  const view = { hero, board, pot, bet, needed: bet > 0 ? requiredEquity(pot, bet) : 0, result: null, message: '' };

  if (hero.length < 2) {
    view.message = 'Choose two hole cards to see the odds.';
  } else if (board.length === 1 || board.length === 2) {
    view.message = 'The flop needs three cards. Add ' + (3 - board.length) + ' more, or clear the board.';
  } else {
    view.result = runSimulation(hero, board);
  }
  updaters.forEach(draw => draw(view));
}
onChange = calculate;   // render() calls this every time something changes

// ---- updater 1: the big verdict ----
const vTag = document.getElementById('v-tag');
const vSub = document.getElementById('v-sub');
const vEv = document.getElementById('v-ev');

function drawVerdict(view) {
  let tone = 'pending';
  let tag = 'Pick your hand';
  let sub = view.message;
  let ev = '\u2014';

  if (view.result) {
    const equity = view.result.equity;
    const edge = equity - view.needed;
    const profit = equity * (view.pot + 2 * view.bet) - view.bet;   // average profit from calling
    if (view.bet === 0) {
      tone = 'free'; tag = 'FREE CHECK'; sub = 'Nothing to call. See the next card at no cost.'; ev = signed(0);
    } else if (equity >= view.needed) {
      tone = 'plus'; tag = '+EV CALL'; sub = 'Profitable. You beat break-even by ' + (edge * 100).toFixed(1) + ' points.'; ev = signed(profit);
    } else {
      tone = 'minus'; tag = '\u2212EV FOLD'; sub = 'Unprofitable. You are ' + (-edge * 100).toFixed(1) + ' points short of break-even.'; ev = signed(profit);
    }
  }
  app.dataset.tone = tone;     
  vTag.textContent = tag;
  vSub.textContent = sub;
  vEv.textContent = ev;
}
updaters.push(drawVerdict);

// ---- the opponent buttons ----
const segmentPainters = [];
function paintSegments() { segmentPainters.forEach(paint => paint()); }
function wireSegment(id, key) {
  const buttons = document.querySelectorAll('#' + id + ' button');
  function paint() {
    buttons.forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.v) === settings[key])));
  }
  segmentPainters.push(paint);
  buttons.forEach(b => b.addEventListener('click', () => {
    settings[key] = Number(b.dataset.v);
    paint();
    calculate();
  }));
  paint();
}
wireSegment('seg-opps', 'opps');

// The gauge is an SVG half circle. polar() turns "how far along" (0 to 1) into x and y.
function polar(p, radius) {
  return [120 - radius * Math.cos(Math.PI * p), 118 - radius * Math.sin(Math.PI * p)];
}
// arcPath() draws the curved part between two positions.
function arcPath(from, to, radius) {
  if (to - from < 0.002) return '';
  const a = polar(from, radius);
  const b = polar(to, radius);
  return 'M' + a[0].toFixed(2) + ' ' + a[1].toFixed(2) + ' A' + radius + ' ' + radius + ' 0 0 1 ' + b[0].toFixed(2) + ' ' + b[1].toFixed(2);
}

const zoneLose = document.getElementById('z-lose');
const zoneWin = document.getElementById('z-win');
const tick = document.getElementById('tick');
const needle = document.getElementById('needle');
const eqBig = document.getElementById('eq-big');
const needBig = document.getElementById('need-big');

function drawGauge(view) {
  const need = Math.min(Math.max(view.needed, 0), 1);
  zoneLose.setAttribute('d', arcPath(0, need, 90));      // red zone: below what you need
  zoneWin.setAttribute('d', arcPath(need, 1, 90));       // green zone: above it
  const inner = polar(need, 78);
  const outer = polar(need, 102);
  tick.setAttribute('x1', inner[0]); tick.setAttribute('y1', inner[1]);
  tick.setAttribute('x2', outer[0]); tick.setAttribute('y2', outer[1]);
  needBig.textContent = view.bet > 0 ? pct(view.needed) : '0%';

  if (view.result) {
    eqBig.textContent = pct(view.result.equity);
    needle.style.transform = 'rotate(' + (view.result.equity * 180 - 90).toFixed(1) + 'deg)';   // -90 = far left, +90 = far right
  } else {
    eqBig.textContent = '\u2014';
    needle.style.transform = 'rotate(-90deg)';
  }
}
updaters.push(drawGauge);

const el = {
  win: document.getElementById('sb-win'), tie: document.getElementById('sb-tie'), lose: document.getElementById('sb-lose'),
  winText: document.getElementById('sl-win'), tieText: document.getElementById('sl-tie'), loseText: document.getElementById('sl-lose'),
  odds: document.getElementById('t-odds'), oddsSub: document.getElementById('t-odds-s'),
  req: document.getElementById('t-req'), edge: document.getElementById('t-edge'),
  method: document.getElementById('t-method'), methodSub: document.getElementById('t-method-s'),
  potHint: document.getElementById('pot-hint'), betHint: document.getElementById('bet-hint')
};

function drawStats(view) {
  const { pot, bet, result } = view;

  // numbers that only depend on the money
  el.odds.textContent = bet > 0 ? ((pot + bet) / bet).toFixed(1) + ' : 1' : 'No bet';
  el.oddsSub.textContent = bet > 0 ? 'Win ' + money(pot + bet) + ' for ' + money(bet) : 'Checking costs nothing';
  el.req.textContent = bet > 0 ? pct(view.needed) : '0.0%';
  el.potHint.textContent = 'After call: ' + money(pot + 2 * bet);
  el.betHint.textContent = pot > 0 ? Math.round(bet / pot * 100) + '% of pot' : '';

  // numbers that need the simulation
  if (!result) {
    el.win.style.width = '0'; el.tie.style.width = '0'; el.lose.style.width = '100%';
    el.winText.textContent = el.tieText.textContent = el.loseText.textContent = '\u2014';
    el.edge.textContent = '\u2014'; el.method.textContent = '\u2014'; el.methodSub.textContent = '\u00a0';
    return;
  }
  const lose = Math.max(0, 1 - result.win - result.tie);
  el.win.style.width = result.win * 100 + '%';
  el.tie.style.width = result.tie * 100 + '%';
  el.lose.style.width = lose * 100 + '%';
  el.winText.textContent = pct(result.win);
  el.tieText.textContent = pct(result.tie);
  el.loseText.textContent = pct(lose);

  const edge = result.equity - view.needed;
  el.edge.textContent = (edge >= 0 ? '+' : '\u2212') + Math.abs(edge * 100).toFixed(1) + ' pts';
  const margin = 1.96 * Math.sqrt(result.equity * (1 - result.equity) / RUNS) * 100;   // how far off the estimate could be
  el.method.textContent = 'Simulated';
  el.methodSub.textContent = RUNS.toLocaleString('en-US') + ' deals, \u00b1' + margin.toFixed(1) + ' pts';
}
updaters.push(drawStats);

settings.range = 1;      // 1 = any hand, 0.5 = best half of hands, and so on

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
const RANGE_STEPS = [1, 0.5, 0.25, 0.1];
const CLASS_PCT = {};       // "how good is this hand" as a percentage, for AKs, 72o and so on
const RANGE_COMBOS = {};    // for each range, the list of allowed two-card hands
(function buildRanges() {
  const kinds = [];
  for (let high = 12; high >= 0; high--) {
    for (let low = high; low >= 0; low--) {
      if (high === low) kinds.push({ high, low, suited: 0, count: 6 });
      else {
        kinds.push({ high, low, suited: 1, count: 4 });
        kinds.push({ high, low, suited: 0, count: 12 });
      }
    }
  }
  kinds.forEach(k => { k.score = chen(k.high, k.low, k.suited) * 1000 + k.high * 20 + k.low + (k.suited ? 0.5 : 0); });
  kinds.sort((a, b) => b.score - a.score);                 // best hands first

  let running = 0;
  kinds.forEach(k => {
    running += k.count;
    k.cumulative = running;
    CLASS_PCT[k.high * 26 + k.low * 2 + k.suited] = running / 1326 * 100;
  });

  for (const fraction of RANGE_STEPS) {
    const limit = Math.max(fraction * 1326, kinds[0].count);
    const allowed = new Set();
    kinds.forEach(k => { if (k.cumulative <= limit || k === kinds[0]) allowed.add(k.high * 26 + k.low * 2 + k.suited); });
    const list = [];
    for (let a = 0; a < 52; a++) {
      for (let b = a + 1; b < 52; b++) {
        const ra = a >> 2, rb = b >> 2;
        const high = Math.max(ra, rb), low = Math.min(ra, rb);
        const suited = (a & 3) === (b & 3) ? 1 : 0;
        if (allowed.has(high * 26 + low * 2 + suited)) list.push(a, b);
      }
    }
    RANGE_COMBOS[fraction] = list;
  }
})();

// ---- the new simulate(): opponents now draw their hands from the chosen range ----
function simulate(hero, board, opponents, runs, range) {
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

// ---- runSimulation now also remembers the range ----
function runSimulation(hero, board) {
  const key = [hero.join(), board.slice().sort((a, b) => a - b).join(), settings.opps, settings.range].join('|');
  if (key !== lastKey) {
    lastResult = simulate(hero, board, settings.opps, RUNS, settings.range);
    lastKey = key;
  }
  return lastResult;
}
wireSegment('seg-range', 'range');

const RANK_NAME = ['Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Jack', 'Queen', 'King', 'Ace'];
const RANK_PLURAL = ['Twos', 'Threes', 'Fours', 'Fives', 'Sixes', 'Sevens', 'Eights', 'Nines', 'Tens', 'Jacks', 'Queens', 'Kings', 'Aces'];

// turns a score from bestScore back into words.
function describe(score) {
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
function nameHand(cards) {
  if (cards.length >= 5) {
    return describe(bestScore(cards));
  }
  const ranks = cards.map(c => c >> 2).sort((a, b) => b - a);
  return ranks[0] === ranks[1] ? 'Pair of  '+ RANK_PLURAL[ranks[0]] : RANK_NAME[ranks[0]] + ' high';
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
function countOuts(hero, board) {
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

const holeName = document.getElementById('hole-name');
const holeMeta = document.getElementById('hole-meta');
const holeChip = document.getElementById('hole-chip');
const madeHand = document.getElementById('made');
const madeSub = document.getElementById('made-s');
const outsChip = document.getElementById('outs');

function drawHand(view) {
  const { hero, board } = view;
  if (hero.length > 2) {
    holeName.textContent = hero.length ? 'Pick one more card' : 'Pick two cards';
    holeMeta.textContent = 'Tap a card in the deck to fill the glowing slot.';
    holeChip.hidden = true;
    madeHand.textContent = '\u2014'; madeSub.textContent = '';
    outsChip.textContent = 'Outs \u2014'; outsChip.className = 'chip dim';
    return;
  }
// name the two cards, e.g. "Ace-King suited"
  const ra = hero[0] >> 2, rb = hero[1] >> 2;
  const high = Math.max(ra, rb), low = Math.min(ra, rb);
  const suited = (hero[0] & 3) === (hero[1] & 3) ? 1 : 0;
  holeName.textContent = high === low ? 'Pocket ' + RANK_PLURAL[high] : RANK_NAME[high] + '-' + RANK_NAME[low] + (suited ? ' suited' : ' offsuit');
  const top = CLASS_PCT[high * 26 + low * 2 + suited];
  holeMeta.textContent = top <= 10 ? 'A premium starting hand.' : top <= 30 ? 'A solid starting hand.' : top <= 55 ? 'A playable, marginal hand.' : 'A weak starting hand.';
  holeChip.hidden = false;
  holeChip.textContent = 'Top ' + (top < 10 ? top.toFixed(1) : Math.round(top)) + '% of hands';

  // the best hand you hold right now
  madeHand.textContent = nameHand([...hero, ...board]);
  madeSub.textContent = ['Preflop', '', '', 'On the flop', 'On the turn', 'On the river'][board.length] || '';

  // outs
  const outs = countOuts (hero, board);
    if (outs === null) {
      outsChip.textContent = board.length === 5 ? 'Board complete' : 'Outs after the flop';
      outsChip.className = 'chip dim';
  } else if (outs === 0) {
    outsChip.textContent = '0 outs'; outsChip.className = 'chip dim';
  } else {
    const chance = board.length === 3 ? 1 - ((47 - outs) * (46 - outs)) / (47 * 46) : outs / 46;   // odds of hitting by the river / next card
    outsChip.textContent = outs + ' outs \u00b7 ~' + Math.round(chance * 100) + '% to hit' + (board.length === 3 ? ' by river' : '');
    outsChip.className = 'chip';
  } 
}
updaters.push(drawHand);

const whyList = document.getElementById('why-list');

function drawWhy(view) {
  const { pot, bet, result } = view;
  const steps = [];
  if (!result) {
    steps.push('Fill in your cards to see the working here.');
  } else if (bet <= 0) {
    steps.push('There is no bet to call, so checking costs nothing and there is nothing to work out.');
  } else {
    const equity = result.equity;
    const profit = equity * (pot + 2 * bet) - bet;
    steps.push('You pay <b>' + money(bet) + '</b> to call. If you win you collect the pot (' + money(pot) + ') plus their bet (' + money(bet) + '), which is <b>' + money(pot + bet) + '</b>.');
    steps.push('After you call, the pot is ' + money(pot + 2 * bet) + '. Your ' + money(bet) + ' is <b>' + pct(view.needed) + '</b> of it, so you must win at least ' + pct(view.needed) + ' of the time just to break even.');
    steps.push('We dealt out the rest of the hand ' + RUNS.toLocaleString('en-US') + ' times. You won ' + pct(result.win) + ' and tied ' + pct(result.tie) + ', so your win chance is <b>' + pct(equity) + '</b>.');
    const sum = equity.toFixed(3) + ' \u00d7 ' + money(pot + 2 * bet) + ' \u2212 ' + money(bet) + ' = <b>' + signed(profit) + '</b>';
    steps.push(equity >= view.needed
    ? pct(equity) + ' is more than ' + pct(view.needed) + ', so calling makes money on average: ' + sum + '. That is a <b>+EV call</b>.'
    : pct(equity) + ' is less than ' + pct(view.needed) + ', so calling loses money on average: ' + sum + '. That is a <b>\u2212EV fold</b>.');
  }
  whyList.innerHTML = steps.map(s => '<li>' + s + '</li>').join('');
}
updaters.push(drawWhy);
const $ = id => document.getElementById(id);

const TOUR = [
  { sel: '#panel-hole', title: 'Your two cards', text: 'Start here. Tap a slot, then tap a card in the deck. "Random hand" deals two for you so you can see how it works.' },
  { sel: '#panel-board', title: 'The board', text: 'Add the shared cards as they come out: three for the flop, then the turn, then the river. Leave slots empty for cards not dealt yet.' },
  { sel: '#panel-deck', title: 'The deck', text: 'Tap any card to place it in the glowing slot. A green dot marks your cards and an amber dot marks the board. Tap a marked card to take it back.' },
  { sel: '#panel-pot', title: 'Pot and bet', text: 'Type the pot as it was before the bet you face, then the bet you must call. The 1/3, 1/2 and Pot buttons size the bet for you.' },
  { sel: '#verdict-box', title: 'The verdict', text: 'Green +EV CALL means calling makes money over many repeats. Red \u2212EV FOLD means it loses money. Yellow means there is nothing to call.' },
  { sel: '#gauge-card', title: 'The gauge', text: 'The needle is your win chance. The white mark is the chance you need to break even. A needle past the mark, in the green, is a call.' },
  { sel: '#opp-set', title: 'Opponents', text: 'More opponents lower your chances. Tighter hands mean they only play strong cards. When someone bets big, try Top 25% or Top 10%.' },
  { sel: '#why', title: 'See the working', text: 'Open "Why this verdict?" any time. It walks through the maths in plain words using your own numbers.' }
];
let tourIndex = 0;
let tourOpen = false;
let tourReturnFocus = null;

// Put the glowing frame exactly over the thing we are talking about.
function placeFrame() {
  if (!tourOpen) return;
  const rect = document.querySelector(TOUR[tourIndex].sel).getBoundingClientRect();
  const frame = $('tour-hole');
  frame.style.left = rect.left - 8 + 'px';
  frame.style.top = rect.top - 8 + 'px';
  frame.style.width = rect.width + 16 + 'px';
  frame.style.height = rect.height + 16 + 'px';
}

function showTourStep(i) {
  tourIndex = Math.max(0, Math.min(TOUR.length - 1, i));
  const step = TOUR[tourIndex];
  const target = document.querySelector(step.sel);
  if (step.sel === '#why') $('why').open = true;
  $('tour-count').textContent = 'Step ' + (tourIndex + 1) + ' of ' + TOUR.length;
  $('tour-title').textContent = step.title;
  $('tour-text').textContent = step.text;
  $('tour-back').disabled = tourIndex === 0;
  $('tour-next').textContent = tourIndex === TOUR.length - 1 ? 'Finish' : 'Next';
  $('tour-dots').innerHTML = TOUR.map((_, k) => '<i class="' + (k === tourIndex ? 'on' : '') + '"></i>').join('');

  if (window.innerWidth > 960 && target.closest('.result')) {
    // wide screens: the decision column is pinned, so scroll inside it
    const column = $('decision');
    column.scrollTop = Math.max(0, target.getBoundingClientRect().top - column.getBoundingClientRect().top + column.scrollTop - 6);
  } else {
    const top = Math.max(0, target.getBoundingClientRect().top + window.pageYOffset - 70);
    const far = Math.abs(top - window.pageYOffset) > 900;
    window.scrollTo({ top: top, behavior: far ? 'auto' : 'smooth' });
  }
  placeFrame();
  $('tour-next').focus({ preventScroll: true });
}

function startTour() {
  tourReturnFocus = document.activeElement;
  tourOpen = true;
  $('tour').hidden = false;
  $('tour-hint').hidden = true;
  rememberTour();
  showTourStep(0);
}
function endTour() {
  tourOpen = false;
  $('tour').hidden = true;
  if (tourReturnFocus && tourReturnFocus.focus) tourReturnFocus.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Remember that the visitor has seen the tour, so we do not nag them.
function rememberTour() { try { localStorage.setItem('poker-tour-seen', '1'); } catch (e) {} }

$('btn-tour').addEventListener('click', startTour);
$('hint-go').addEventListener('click', startTour);
$('hint-no').addEventListener('click', () => { $('tour-hint').hidden = true; rememberTour(); });
$('tour-skip').addEventListener('click', endTour);
$('tour-back').addEventListener('click', () => showTourStep(tourIndex - 1));
$('tour-next').addEventListener('click', () => { if (tourIndex >= TOUR.length - 1) endTour(); else showTourStep(tourIndex + 1); });
window.addEventListener('scroll', () => { if (tourOpen) requestAnimationFrame(placeFrame); }, { passive: true });
window.addEventListener('resize', placeFrame);
$('decision').addEventListener('scroll', () => { if (tourOpen) requestAnimationFrame(placeFrame); }, { passive: true });
document.addEventListener('keydown', e => {
  if (!tourOpen) return;
  if (e.key === 'Escape') endTour();
  else if (e.key === 'ArrowRight') $('tour-next').click();
  else if (e.key === 'ArrowLeft' && tourIndex > 0) showTourStep(tourIndex - 1);
});

// Show the "New here?" banner only if they have not seen the tour.
let seenTour = false;
try { seenTour = localStorage.getItem('poker-tour-seen') === '1'; } catch (e) {}
$('tour-hint').hidden = seenTour;

const dock = document.getElementById('dock');
const dockTag = document.getElementById('dock-tag');
const dockSub = document.getElementById('dock-sub');

function drawDock(view) {
  dock.dataset.tone = app.dataset.tone;
  dockTag.textContent = vTag.textContent;
  dockSub.textContent = view.result 
  ? 'Win chance ' + pct(view.result.equity) + (view.bet > 0 ? '\u00b7 need ' + pct(view.needed) : '')
  : '\u00a0';
}
updaters.push(drawDock);
dock.addEventListener('click', () => $('decision').scrollIntoView({behavior: 'smooth', block: 'start'}));