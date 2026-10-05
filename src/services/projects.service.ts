import { STORAGE_CONFIG } from '../config/environment';
import type { Project } from '../types/project';
import { isTechnology } from '../utils/projectTechnology';
import { getJson, listObjects } from './storage.service';

const isText = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

export function isValidProject(value: unknown): value is Omit<Project, 'storagePath'> {
  if (!value || typeof value !== 'object') return false;
  const p = value as Record<string, unknown>;
  const classifier = (item: unknown) => Boolean(item && typeof item === 'object' &&
    isText((item as Record<string, unknown>).id) && isText((item as Record<string, unknown>).name));
  return typeof p.schemaVersion === 'number' && isText(p.id) && ['draft', 'published', 'archived'].includes(String(p.status)) &&
    isText(p.title) && isText(p.shortDescription) && /^\d{4}-\d{2}-\d{2}$/.test(String(p.date)) &&
    !Number.isNaN(Date.parse(`${p.date}T00:00:00Z`)) && classifier(p.type) && classifier(p.direction) &&
    Array.isArray(p.technologies) && p.technologies.every(isTechnology) &&
    (p.cover === undefined || typeof p.cover === 'string');
}

export async function loadProjects(): Promise<Project[]> {
  const keys = (await listObjects(`${STORAGE_CONFIG.projectsPrefix}/`))
    .filter((key) => /\/projects\/[^/]+\/project\.json$/.test(key));
  const results = await Promise.allSettled(keys.map(async (key) => {
    const data = await getJson<unknown>(key);
    if (!isValidProject(data)) throw new Error(`Некорректный project.json: ${key}`);
    return { ...data, storagePath: key.replace(/\/project\.json$/, '') } as Project;
  }));
  const projects = results.flatMap((result) => {
    if (result.status === 'fulfilled') return [result.value];
    if (import.meta.env.DEV) console.warn(result.reason);
    return [];
  });
  return projects.filter((project) => project.status === 'published')
    .sort((a, b) => b.date.localeCompare(a.date));
}
