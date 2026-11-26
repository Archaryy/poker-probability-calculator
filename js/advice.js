// A rough "how much should I bet" estimate. It only looks at your win chance, the pot and
// the number of opponents. It does not know stack sizes, position or how a player acts.
const SIZES = [
  { label: '1/3 pot', f: 1 / 3 },
  { label: '1/2 pot', f: 1 / 2 },
  { label: '3/4 pot', f: 3 / 4 },
  { label: 'Pot', f: 1 }
];

export function adviseBet({ equity, opps, pot, bet }) {
  const facing = bet > 0;                                   // true when you are answering a bet
  if (facing && equity < bet / (pot + 2 * bet)) return null;   // calling already loses money: no bet advice
  const base = facing ? pot + 2 * bet : pot;                // the pot as it will stand after you call
  if (base <= 0) return null;

  // How far above a fair share you are: 0 = a fair share, 1 = certain to win.
  const fair = 1 / (opps + 1);
  const strength = (equity - fair) / (1 - fair);

  let pick = strength >= 0.6 ? 2 : strength >= 0.3 ? 1 : strength >= 0.08 ? 0 : -1;
  if (facing && strength < 0.5) pick = -1;                  // only raise a bet with a strong hand

  if (pick === -1) {
    return facing
      ? { kind: 'call', headline: 'Just call. Not strong enough to raise.', options: [] }
      : { kind: 'check', headline: 'Check. Not strong enough to bet for value.', options: [] };
  }

  const options = SIZES.map(s => {
    const amount = Math.max(1, Math.round(facing ? bet + s.f * base : s.f * pot));
    const theyNeed = (amount - bet) / (pot + 2 * amount);   // chance they need to win to call this
    return { label: s.label, amount, theyNeed };
  });
  const best = options[pick];
  return {
    kind: facing ? 'raise' : 'bet',
    headline: (facing ? 'Raise to about $' : 'Bet about $') + best.amount + ' (' + best.label + ')',
    options,
    pick
  };
}