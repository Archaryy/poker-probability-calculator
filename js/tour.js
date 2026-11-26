import { $ } from './dom.js';
import { phone, setTab } from './tabs.js';

const TAB_FOR = {
  '#panel-hole': 'hand', '#panel-board': 'hand', '#panel-deck': 'hand',
  '#panel-pot': 'bet', '#opp-set': 'bet',
  '#verdict-box': 'odds', '#gauge-card': 'odds', '#why': 'odds'
};

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
  if (phone.matches && TAB_FOR[step.sel]) setTab(TAB_FOR[step.sel]);
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