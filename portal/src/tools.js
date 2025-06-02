import { snip, unsnip } from 'js-snip';

export function initSnip({ selector, button, lines = 7 }) {
  const paragraph = document.querySelector(selector);
  if (paragraph) {
    snip(paragraph, { lines: lines, mode: 'js', midWord: false }, (state) => {
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

export function parseContentSize(value) {
  const regex = /^\d+(\.\d+)?\s*(bytes|kb|mb|gb|tb|b)$/i;
  if (typeof value !== 'string' || !regex.test(value)) return null;

  const [, , unit] = value.toLowerCase().match(/(\d+(\.\d+)?)(?:\s*)(bytes|kb|mb|gb|tb|b)/);
  const number = parseFloat(value);

  const unitMultipliers = {
    bytes: 1,
    b: 1,
    kb: 1024,
    mb: 1024 ** 2,
    gb: 1024 ** 3,
    tb: 1024 ** 4,
  };

  return number * (unitMultipliers[unit] || 0);
}

export function isLargerThan(value, threshold, thresholdUnit = 'mb') {
  const sizeInBytes = parseContentSize(value);
  const unitMultipliers = {
    bytes: 1,
    b: 1,
    kb: 1024,
    mb: 1024 ** 2,
    gb: 1024 ** 3,
    tb: 1024 ** 4,
  };

  const thresholdInBytes = threshold * (unitMultipliers[thresholdUnit.toLowerCase()] || 1);
  return sizeInBytes !== null && sizeInBytes > thresholdInBytes;
}
