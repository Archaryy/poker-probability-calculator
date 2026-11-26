import { $ } from './dom.js';

// On phones (640px and narrower) the page is split into four tabs.
export const phone = window.matchMedia('(max-width: 640px)');

const app = $('app');
const buttons = document.querySelectorAll('.tabbar button');

export function setTab(name) {
  app.dataset.tab = name;
  buttons.forEach(b => b.setAttribute('aria-current', String(b.dataset.tab === name)));
  window.scrollTo(0, 0);
}

buttons.forEach(b => b.addEventListener('click', () => setTab(b.dataset.tab)));