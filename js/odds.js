export function requiredEquity(pot, bet) {
    return bet / (pot + 2 * bet);
}
// ---- number formatting ----
export function money(x, decimals = 0) {
  return '$' + Math.abs(x).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
export function signed(x) { return (x >= 0 ? '+' : '\u2212') + money(x, 2); }
export function pct(p) { return (p * 100).toFixed(1) + '%'; }