import { snip, unsnip } from 'js-snip';

export const initSnip = ({ selector, button, lines = 7 }: { selector: string; button?: string; lines?: number }) => {
  const paragraph = document.querySelector(selector);
  if (!paragraph) {
    return;
  }

  snip(paragraph as HTMLElement, { lines: lines, mode: 'js', midWord: false }, (state) => {
    if (button && !state.hasEllipsis) {
      const btn = document.querySelector(button) as HTMLElement;
      if (btn) {
        btn.style.display = 'none';
      }
    }
  });
};

export const toggleSnip = (selector: string) => {
  const paragraph = document.querySelector(selector) as HTMLElement;
  unsnip(paragraph);

  return true;
};
