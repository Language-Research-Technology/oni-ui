import { ui } from '@/configuration';
import type { EntityType } from '@/services/api';

const unitMultipliers = {
  bytes: 1,
  b: 1,
  kb: 1024,
  mb: 1024 ** 2,
  gb: 1024 ** 3,
  tb: 1024 ** 4,
};

export const formatFileSize = (bytes: number, locales = 'en') => {
  if (!bytes || bytes === 0) {
    return 'N/A';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const threshold = 1024;

  if (bytes < threshold) return `${bytes} B`;

  const i = Math.floor(Math.log(bytes) / Math.log(threshold));
  const value = bytes / threshold ** i;

  const formatter = new Intl.NumberFormat(locales, { maximumFractionDigits: 2 });

  return `${formatter.format(value)} ${units[i]}`;
};

export const formatEncodingFormat = (formats: string[] | string | undefined) => {
  if (typeof formats === 'string') {
    return formats;
  }

  if (!formats || formats.length === 0) {
    return 'N/A';
  }

  return formats.filter((f) => typeof f === 'string').join(', ');
};

export const shortenText = (input: string, { minLength = 0, maxLength = 24 } = {}) => {
  if (!input) {
    return input;
  }

  if (input.length <= minLength) {
    return input; // Don't shorten if it's too short
  }

  return input.length > maxLength ? `${input.slice(0, maxLength)}...` : input;
};

export const parseContentSize = (value: string | number) => {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value; // Already in bytes
  }

  const regex = /^(\d+(?:\.\d+)?)(\s*)(bytes|b|kb|mb|gb|tb)$/i;

  if (typeof value !== 'string') {
    return null;
  }

  const match = value.trim().match(regex);
  if (!match) {
    return null;
  }

  if (!match[1] || !match[3]) {
    return null;
  }

  const number = parseFloat(match[1]);
  const unit = match[3].toLowerCase();

  return number * (unitMultipliers[unit as keyof typeof unitMultipliers] || 1);
};

export const getEntityUrl = (entity: EntityType) => {
  const { entityType } = entity;

  switch (entityType) {
    case 'http://pcdm.org/models#Collection':
      return `/collection?id=${entity.id}`;
    case 'http://pcdm.org/models#Object':
      return `/object?id=${entity.id}`;
    case 'http://schema.org/MediaObject':
      return `/file?id=${entity.fileId}`;
    default:
      throw new Error(`Unknown entitytype ${entityType}`);
  }
};

// NOTE: This assumes the array is never empty from a type perspective
export const first = <T>(arr: T | T[]) => {
  if (!Array.isArray(arr)) {
    return arr;
  }

  return arr[0] as T;
};

const textReplacements = ui.textReplacements;

export const startCase = (str: string) => {
  if (typeof str !== 'string' || !str) {
    return '';
  }

  let words = str;

  for (const [pattern, replacement] of Object.entries(textReplacements)) {
    const regex = new RegExp(pattern, 'g');
    words = words.replace(regex, replacement);
  }

  words = words
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[^a-zA-Z0-9]+/)
    .filter((word) => word.length > 0)
    .map((word) => {
      // NOTE: Don't change the case of words that are in the replacements list
      if (Object.values(textReplacements).includes(word)) {
        return word;
      }

      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');

  return words;
};

export const formatDuration = (seconds: number) => {
  if (seconds < 0) {
    return '0s';
  }

  const units = [
    { label: 'd', value: 86400 },
    { label: 'h', value: 3600 },
    { label: 'm', value: 60 },
    { label: 's', value: 1 },
  ];

  const parts: string[] = [];
  let remaining = Math.floor(seconds);

  for (const unit of units) {
    if (remaining >= unit.value) {
      const count = Math.floor(remaining / unit.value);
      parts.push(`${count}${unit.label}`);
      remaining %= unit.value;
    }
  }

  return parts.length > 0 ? parts.join(' ') : '0s';
};
