import { $ } from './dom.js';
import { RANKS, SUITS, RANK_NAME, RANK_PLURAL, cardText, card } from './cards.js';
import { nameHand, countOuts } from './evaluator.js';
import { CLASS_PCT } from './ranges.js';
import { simulate, RUNS } from './simulate.js';
import { requiredEquity, money, signed, pct } from './odds.js';
import './tour.js';
import { phone, setTab } from './tabs.js'
import { adviseBet  } from '../advice.js';
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
    button.type = "button";
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

const settings = { opps: 1 };      // how many opponents
              // how many deals each simulation plays out
const updaters = [];               // each function in here draws one part of the screen
const app = document.getElementById('app');

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
    if (!view.result) { view.busy = true; view.message = 'Running the simulation…'; }
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

// ---- updater: how much to bet (an estimate) ----
const adviceBox = $('advice');
const adviceHead = $('advice-head');
const adviceOpts = $('advice-opts');
function drawAdvice(view) {
  const advice = view.result
    ? adviseBet({ equity: view.result.equity, opps: settings.opps, pot: view.pot, bet: view.bet })
    : null;
  if (!advice) { adviceBox.hidden = true; return; }
  adviceBox.hidden = false;
  adviceHead.textContent = advice.headline;
  adviceOpts.innerHTML = advice.options.map((o, i) =>
    '<div class="advice-opt"' + (i === advice.pick ? ' data-pick="true"' : '') + '>' +
    '<span>' + o.label + '</span><b>' + money(o.amount) + '</b><span>needs ' + Math.round(o.theyNeed * 100) + '%</span></div>'
  ).join('');
}
updaters.push(drawAdvice);

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
// opponents: a - / number / + stepper, 1 to 9 (a full table of 10 has 9 opponents)
const oppsInput = $('opps-n');
const rangeInput = $('range-n');
function clampInt(value, low, high, fallback) {
  const n = Math.round(Number(value));
  return Number.isFinite(n) ? Math.min(high, Math.max(low, n)) : fallback;
}
function setOpps(n) { settings.opps = clampInt(n, 1, 9, settings.opps); paintSegments(); calculate(); }
function setRangePct(p) { settings.range = clampInt(p, 5, 100, Math.round(settings.range * 100)) / 100; paintSegments(); calculate(); }
segmentPainters.push(() => {
  if (document.activeElement !== oppsInput) oppsInput.value = settings.opps;
  if (document.activeElement !== rangeInput) rangeInput.value = Math.round(settings.range * 100);
});
$('opps-minus').addEventListener('click', () => setOpps(settings.opps - 1));
$('opps-plus').addEventListener('click', () => setOpps(settings.opps + 1));
oppsInput.addEventListener('change', () => setOpps(oppsInput.value));
rangeInput.addEventListener('change', () => setRangePct(rangeInput.value));
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

// ---- runSimulation now also remembers the range ----
let worker = null;
try { worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' }); } catch (e) { worker = null; }
let pendingKey = '';

function runSimulation(hero, board) {
  const key = [hero.join(), board.slice().sort((a, b) => a - b).join(), settings.opps, settings.range].join('|');
  if (key === lastKey) return lastResult;                      // already worked out
  if (!worker) {                                               // no worker: run it here
    lastResult = simulate(hero, board, settings.opps, RUNS, settings.range);
    lastKey = key;
    return lastResult;
  }
  if (key !== pendingKey) {                                    // ask the worker once per change
    pendingKey = key;
    worker.postMessage({ key, hero, board, opps: settings.opps, runs: RUNS, range: settings.range });
  }
  return null;                                                 // the answer arrives later
}

if (worker) {
  worker.onmessage = e => {
    if (e.data.key !== pendingKey) return;                     // an old answer: ignore it
    lastKey = e.data.key;
    lastResult = e.data.result;
    pendingKey = '';
    calculate();
  };
  worker.onerror = () => { worker = null; pendingKey = ''; calculate(); };
}
wireSegment('seg-range', 'range');

const holeName = document.getElementById('hole-name');
const holeMeta = document.getElementById('hole-meta');
const holeChip = document.getElementById('hole-chip');
const madeHand = document.getElementById('made');
const madeSub = document.getElementById('made-s');
const outsChip = document.getElementById('outs');

function drawHand(view) {
  const { hero, board } = view;
  if (hero.length < 2) {
    holeName.textContent = hero.length === 1 ? 'Pick one more card' : 'Pick two cards';
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

const dock = document.getElementById('dock');
const dockTag = document.getElementById('dock-tag');
const dockSub = document.getElementById('dock-sub');

function drawDock(view) {
  dock.dataset.tone = app.dataset.tone;
  dockTag.textContent = vTag.textContent;
  dockSub.textContent = view.result 
  ? 'Win chance ' + pct(view.result.equity) + (view.bet > 0 ? ' \u00b7 need ' + pct(view.needed) : '')
  : '\u00a0';
}
updaters.push(drawDock);

const mini = $('mini');
const miniCards = mini.querySelectorAll('.mini-card');
function drawMini() {
  const spoken = [];
  miniCards.forEach((el, i) => {
    const id = slots[i];
    el.className = 'mini-card' + (id === null ? ' empty' : ' ' + 'shdc'[id & 3]);
    el.innerHTML = id === null ? '' : '<b>' + RANKS[id >> 2] + '</b><i>' + SUITS[id & 3] + '</i>';
    if (id !== null) spoken.push(cardText(id));
  });
  mini.setAttribute('aria-label', (spoken.length ? 'Your cards: ' + spoken.join(', ') : 'No cards picked') + '. Tap to edit.');
}
updaters.push(drawMini);
mini.addEventListener('click', () => setTab('hand'));

dock.addEventListener('click', () => {
  if (phone.matches) setTab('odds');
  else $('decision').scrollIntoView({behavior: 'smooth', block: 'start'});
});

// ---- bet size shortcuts and sliders ----
const potSlider = $('sl-pot');
const betSlider = $('sl-bet');
function syncMoney() {
  potSlider.value = Math.min(getPot(), Number(potSlider.max));
  betSlider.value = Math.min(getBet(), Number(betSlider.max));
  showOdds();
}
potSlider.addEventListener('input', () => { potInput.value = potSlider.value; showOdds(); });
betSlider.addEventListener('input', () => { betInput.value = betSlider.value; showOdds(); });
potInput.addEventListener('input', syncMoney);
betInput.addEventListener('input', syncMoney);
document.querySelectorAll('[data-frac]').forEach(button => {
  button.addEventListener('click', () => {
    betInput.value = Math.round(getPot() * Number(button.dataset.frac));
    syncMoney();
  });
});

// ---- helpers for dealing random cards ----
function usedCards() { return slots.filter(c => c !== null); }
function randomCards(count, avoid) {
  const out = [];
  while (out.length < count) {
    const c = Math.floor(Math.random() * 52);
    if (!avoid.includes(c) && !out.includes(c)) out.push(c);
  }
  return out;
}
function nextEmptySlot(from) {
  for (let k = 1; k <= 7; k++) {
    const i = (from + k) % 7;
    if (slots[i] === null) return i;
  }
  return from;
}

// ---- buttons ----
$('btn-random').addEventListener('click', () => {
  const taken = usedCards().filter(c => c !== slots[0] && c !== slots[1]);
  [slots[0], slots[1]] = randomCards(2, taken);
  target = nextEmptySlot(1);
  render();
});
$('btn-clear-hole').addEventListener('click', () => { slots[0] = slots[1] = null; target = 0; render(); });
$('btn-clear-board').addEventListener('click', () => {
  for (let i = 2; i < 7; i++) slots[i] = null;
  target = slots[0] === null ? 0 : slots[1] === null ? 1 : 2;
  render();
});
$('btn-next').addEventListener('click', () => {
  const have = slots.slice(2).filter(c => c !== null).length;
  const want = have === 0 ? 3 : have < 5 ? 1 : 0;          // flop, then turn, then river
  if (!want) return;
  const dealt = randomCards(want, usedCards());
  for (let i = 2; i < 7 && dealt.length; i++) if (slots[i] === null) slots[i] = dealt.shift();
  target = nextEmptySlot(target);
  render();
});
$('btn-colors').addEventListener('click', function () {
  const on = document.body.classList.toggle('four-color');
  this.setAttribute('aria-pressed', String(on));
});

function loadHand(hand) {
  slots.fill(null);
  hand.hole.split(' ').forEach((text, i) => { slots[i] = card(text.replace('10', 'T')); });
  if (hand.board) hand.board.split(' ').forEach((text, i) => { slots[2 + i] = card(text.replace('10', 'T')); });
  potInput.value = hand.pot;
  betInput.value = hand.bet;
  settings.opps = hand.opps;
  settings.range = hand.range;
  paintSegments();
  target = nextEmptySlot(6);
  syncMoney();
  render();
}
const EXAMPLES = [
  { name: 'Nut flush draw', hole: 'As 5s', board: 'Ks 9s 2d', pot: 120, bet: 80, opps: 1, range: 1 },
  { name: 'Open-ended straight draw', hole: '9h 8h', board: '7d 6c 2s', pot: 100, bet: 50, opps: 1, range: 1 },
  { name: 'Top pair, good kicker', hole: 'Ad Qc', board: 'As 8h 3d', pot: 160, bet: 80, opps: 1, range: 0.5 },
  { name: 'Gutshot, big bet', hole: 'Jc Tc', board: 'Ad Qs 4h', pot: 100, bet: 120, opps: 1, range: 0.1 },
  { name: 'Set on a wet board', hole: '7d 7c', board: '7s 9h 10h', pot: 200, bet: 150, opps: 2, range: 0.5 },
  { name: 'Pocket aces preflop', hole: 'As Ah', board: '', pot: 45, bet: 30, opps: 1, range: 1 }
];
EXAMPLES.forEach(hand => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn sm';
  button.textContent = hand.name;
  button.addEventListener('click', () => loadHand(hand));
  $('scen').appendChild(button);
});
$('btn-reset').addEventListener('click', () => {
  slots.fill(null);
  target = 0;
  potInput.value = 150;
  betInput.value = 50;
  settings.opps = 1;
  settings.range = 1;
  paintSegments();
  syncMoney();
  render();
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js'));
}