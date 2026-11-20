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