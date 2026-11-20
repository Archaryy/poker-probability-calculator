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

// play monte carlo simulation
function simulate(hero, board, opponents, runs) {
    const known = [...hero, ...board];
    const deck = [];
    for (let id = 0; id < 52; id++) {
        if (!known.includes(id)) deck.push(id);
    }

    const boardNeeded = 5 -board.length;
    const needed = boardNeeded + 2 * opponents;

    let wins = 0;
    let ties = 0;
    let share = 0;

    for (let run = 0; run < runs; run++) {
        //shuffle needed cards
        for (let i = 0; i < needed; i++) {
            const j = i + Math.floor(Math.random() * (deck.length - i));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        const fullBoard = [...board, ...deck.slice(0, boardNeeded)];
        const heroScore = bestScore([...hero, ...fullBoard]);

        let best = -1;
        let tiedWith = 0;
        for (let o = 0; o < opponents; o++) {
            const start = boardNeeded + o * 2;
            const score = bestScore([deck[start], deck[start + 1], ...fullBoard]);
            if (score > best) { best = score; tiedWith = 1; }
            else if (score === best) { tiedWith++; }
        }

        if (heroScore > best) { wins++; share +=1; }
        else if (heroScore === best) { ties++; share+=1 / (tiedWith + 1); }
    }
    return { win: wins / runs, tie: ties/ runs, equity: share / runs };
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
function runSimulation(hero, board) {
  const key = [hero.join(), board.slice().sort((a, b) => a - b).join(), settings.opps].join('|');
  if (key !== lastKey) {
    lastResult = simulate(hero, board, settings.opps, RUNS);
    lastKey = key;
  }
  return lastResult;
}

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