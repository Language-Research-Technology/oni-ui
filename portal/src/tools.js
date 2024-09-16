import {snip, unsnip} from "js-snip";

export function initSnip({selector, button, lines = 7}) {
  const paragraph = document.querySelector(selector);
  if (paragraph) {
    snip(paragraph, {lines: lines, mode: 'js', midWord: false}, function (state) {
      if (!state.hasEllipsis) {
        const btn = document.querySelector(button);
        if (btn) {
          btn.style.display = 'none';
        }
      }
    });
  }
}

export function toggleSnip(selector) {
  const paragraph = document.querySelector(selector);
  unsnip(paragraph);
  return true;
}
