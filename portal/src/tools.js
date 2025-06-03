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
  if (typeof value === 'number' && !isNaN(value)) {
    return value; // Already in bytes
  }

  const regex = /^(\d+(?:\.\d+)?)(\s*)(bytes|b|kb|mb|gb|tb)$/i;

  if (typeof value !== 'string') return null;
  const match = value.trim().match(regex);
  if (!match) return null;

  const number = parseFloat(match[1]);
  const unit = match[3].toLowerCase();

  const unitMultipliers = {
    b: 1,
    bytes: 1,
    kb: 1024,
    mb: 1024 ** 2,
    gb: 1024 ** 3,
    tb: 1024 ** 4,
  };

  return number * (unitMultipliers[unit] || 1);
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
  console.log(sizeInBytes, threshold, thresholdUnit);
  const thresholdInBytes = threshold * (unitMultipliers[thresholdUnit.toLowerCase()] || 1);
  return sizeInBytes !== null && sizeInBytes > thresholdInBytes;
}
