import type { ProjectTechnology } from '../types/project';
import { portfolioAssetUrl, projectAssetUrl } from './storageUrl';

export const technologyValue = (technology: string | ProjectTechnology): ProjectTechnology =>
  typeof technology === 'string' ? { name: technology } : technology;

export const technologyName = (technology: string | ProjectTechnology) =>
  technologyValue(technology).name;

export const technologyIconUrl = (icon: string, storagePath: string) => {
  if (/^https?:\/\//i.test(icon)) return icon;
  if (icon.startsWith('./')) return projectAssetUrl(storagePath, icon.slice(2));
  return portfolioAssetUrl(icon);
};

export const isTechnology = (value: unknown): value is string | ProjectTechnology => {
  if (typeof value === 'string') return value.trim().length > 0;
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return typeof item.name === 'string' && item.name.trim().length > 0 &&
    (item.icon === undefined || typeof item.icon === 'string') &&
    (item.url === undefined || typeof item.url === 'string');
};
