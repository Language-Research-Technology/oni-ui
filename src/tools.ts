import type { EntityType } from './services/api';

const unitMultipliers = {
  bytes: 1,
  b: 1,
  kb: 1024,
  mb: 1024 ** 2,
  gb: 1024 ** 3,
  tb: 1024 ** 4,
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
  const { recordType } = entity;

  const id = encodeURIComponent(entity.id);

  switch (recordType) {
    case 'RepositoryCollection':
      return `/collection?id=${id}`;
    case 'RepositoryObject':
      return `/object?id=${id}`;
    default:
      throw new Error(`Unknown recordType ${recordType}`);
  }
};
