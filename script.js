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

// Build the 52 buttons: one row per suit, 13 cards per row.
const deckDiv = document.getElementById('deck');
for (let suit = 0; suit < 4; suit++) {
  const row = document.createElement('div');
  row.className = 'deck-row';
  for (let rank = 0; rank < 13; rank++) {
    const id = rank * 4 + suit;
    const button = document.createElement('button');
    button.className = 'pick' + (isRed(id) ? ' red' : '');
    button.textContent = cardText(id);
    button.dataset.id = id;                       // remember which card this button is
    button.addEventListener('click', () => pickCard(id));
    row.appendChild(button);
  }
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

function render() {
    slotButtons.forEach((button, i) => {
        const id = slots[i];
        button.textContent = id === null ? '?' : cardText(id);
        button.classList.toggle('filled', id !== null);
        button.classList.toggle('red', id !== null && isRed(id));
        button.classList.toggle('active', i === target);
    });
    document.querySelectorAll('.pick').forEach(button => {
        button.classList.toggle('used', slots.includes(Number(button.dataset.id)));
    });
    onChange();
}

render();

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
    const boardNeeded = 5 - board.length;
    
}

