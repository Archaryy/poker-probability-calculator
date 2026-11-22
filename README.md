# Cardcraft Studio

Texas Hold'em win odds, pot odds and call-or-fold in one glance.

**Live demo:** https://archaryy.github.io/poker-probability-calculator/

![Screenshot](docs/screenshot.png)

## What it does
- Pick your hole cards and the board, then set the pot and the bet you face
- Simulates 6,000 deals against 1 to 5 opponents with a chosen hand range
- Shows win chance, break-even chance, expected value and a call or fold verdict
- Installs on your phone and works offline

## How the maths works
Break-even chance = bet / (pot + 2 x bet).
Expected value = win chance x (pot + 2 x bet) - bet.
Win chance counts a tie as half a win and comes from a Monte Carlo simulation (error up to about 1.3 points at 6,000 runs).

## Run locally
    npx serve .

## Limits
Opponent ranges use the Chen formula, an approximation and not solver output. This is a learning tool, not advice for real-money play.

## License
MIT
