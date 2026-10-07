import { STORAGE_CONFIG } from '../config/environment';
import type { CourseEntry, Education, EducationEntry } from '../types/education';
import { getJson } from './storage.service';

const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const isObject = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === 'object');
const isText = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const isStatus = (value: unknown) => ['draft', 'published', 'archived'].includes(String(value));
const isYear = (value: unknown) => Number.isInteger(value) && Number(value) >= 1900 && Number(value) <= 2200;
const hasSafeMedia = (value: Record<string, unknown>) => {
  if (!Array.isArray(value.attachments) || !isText(value.id)) return false;
  const prefix = `education/items/${value.id}/`;
  const safePath = (path: unknown) => typeof path === 'string' && path.startsWith(prefix) && !path.includes('..') && !path.includes('\\');
  if (value.image !== undefined && value.image !== '' && !safePath(value.image)) return false;
  return value.attachments.every((file) => isObject(file) && isText(file.name) && safePath(file.path));
};

function isEducationEntry(value: unknown): value is EducationEntry {
  if (!isObject(value)) return false;
  return isText(value.id) && idPattern.test(value.id) && isStatus(value.status) && isText(value.level) &&
    isText(value.institution) && isText(value.faculty) && isText(value.specialization) && isYear(value.graduationYear) && hasSafeMedia(value);
}

function isCourseEntry(value: unknown): value is CourseEntry {
  if (!isObject(value)) return false;
  return isText(value.id) && idPattern.test(value.id) && isStatus(value.status) && isText(value.title) &&
    isText(value.organization) && isText(value.specialization) && isYear(value.completionYear) && hasSafeMedia(value);
}

export function isValidEducation(value: unknown): value is Education {
  if (!isObject(value)) return false;
  return value.schemaVersion === 1 && isStatus(value.status) && isText(value.updatedAt) && isText(value.headline) &&
    typeof value.summary === 'string' && Array.isArray(value.education) && value.education.every(isEducationEntry) &&
    Array.isArray(value.courses) && value.courses.every(isCourseEntry);
}

export async function loadEducation(): Promise<Education | null> {
  try {
    const data = await getJson<unknown>(STORAGE_CONFIG.educationPath);
    if (!isValidEducation(data)) throw new Error('Некорректный education.json');
    if (data.status !== 'published') return null;
    return {
      ...data,
      education: data.education.filter((item) => item.status === 'published'),
      courses: data.courses.filter((item) => item.status === 'published')
    };
  } catch (error) {
    if (error instanceof Error && /HTTP 404/.test(error.message)) return null;
    throw error;
  }
}
