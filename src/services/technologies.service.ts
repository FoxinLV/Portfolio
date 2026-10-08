import { STORAGE_CONFIG } from '../config/environment';
import type { TechnologyCatalog } from '../types/technology';
import { getJson } from './storage.service';

const isText = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

export function isValidTechnologyCatalog(value: unknown): value is TechnologyCatalog {
  if (!value || typeof value !== 'object') return false;
  const catalog = value as Record<string, unknown>;
  if (catalog.schemaVersion !== 1 || !Array.isArray(catalog.categories) || !Array.isArray(catalog.technologies)) return false;
  const categoryIds = new Set(catalog.categories.flatMap((item) => item && typeof item === 'object' && isText((item as Record<string, unknown>).id)
    ? [String((item as Record<string, unknown>).id)] : []));
  const technologyIds = new Set<string>();
  const technologyNames = new Set<string>();
  return categoryIds.size === catalog.categories.length && catalog.categories.every((item) => Boolean(item && typeof item === 'object' &&
    isText((item as Record<string, unknown>).id) && isText((item as Record<string, unknown>).name) &&
    Number.isFinite((item as Record<string, unknown>).order))) &&
    catalog.technologies.every((item) => {
      if (!item || typeof item !== 'object') return false;
      const technology = item as Record<string, unknown>;
      const id = String(technology.id || '');
      const name = String(technology.name || '').trim().toLocaleLowerCase('ru-RU');
      if (!isText(technology.id) || !isText(technology.name) || !isText(technology.icon) || !isText(technology.category) ||
          !categoryIds.has(String(technology.category)) || !Number.isFinite(technology.order) || technologyIds.has(id) || technologyNames.has(name)) return false;
      technologyIds.add(id);
      technologyNames.add(name);
      return true;
    });
}

export async function loadTechnologyCatalog(): Promise<TechnologyCatalog> {
  const catalog = await getJson<unknown>(STORAGE_CONFIG.technologiesPath);
  if (!isValidTechnologyCatalog(catalog)) throw new Error('Некорректный technologies.json');
  return catalog;
}
