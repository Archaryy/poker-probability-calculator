import { simulate } from './simulate.js';

self.onmessage = e => {
    const { key, hero, board, opps, runs, range } = e.data;
    self.postMessage({ key, result: simulate(hero, board, opps, runs, range) });
};