import { STORAGE_CONFIG } from '../config/environment';
import type { Career, CareerEngagement, CareerOrganization, CareerProjectAssignment } from '../types/career';
import { getJson } from './storage.service';

const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const isObject = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === 'object');
const isString = (value: unknown): value is string => typeof value === 'string';
const isText = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const isStatus = (value: unknown) => ['draft', 'published', 'archived'].includes(String(value));

function isOrganization(value: unknown): value is CareerOrganization {
  if (!isObject(value)) return false;
  return isText(value.id) && idPattern.test(value.id) && isStatus(value.status) && isText(value.name) && isText(value.kind);
}

function isEngagement(value: unknown): value is CareerEngagement {
  if (!isObject(value)) return false;
  return isText(value.id) && idPattern.test(value.id) && isStatus(value.status) && isText(value.organizationId) &&
    isText(value.title) && isText(value.employmentType) && isText(value.startDate) && datePattern.test(value.startDate) &&
    (value.endDate === null || (isText(value.endDate) && datePattern.test(value.endDate))) &&
    ['day', 'month', 'year'].includes(String(value.datePrecision)) && isString(value.summary);
}

function isAssignment(value: unknown): value is CareerProjectAssignment {
  if (!isObject(value)) return false;
  return isText(value.id) && idPattern.test(value.id) && isStatus(value.status) && isText(value.engagementId) && isText(value.projectId);
}

export function isValidCareer(value: unknown): value is Career {
  if (!isObject(value)) return false;
  return value.schemaVersion === 1 && isStatus(value.status) && isText(value.updatedAt) && isText(value.headline) &&
    isString(value.summary) && isObject(value.settings) && Array.isArray(value.organizations) && value.organizations.every(isOrganization) &&
    Array.isArray(value.engagements) && value.engagements.every(isEngagement) && Array.isArray(value.projectAssignments) && value.projectAssignments.every(isAssignment);
}

export async function loadCareer(): Promise<Career | null> {
  try {
    const data = await getJson<unknown>(STORAGE_CONFIG.careerPath);
    if (!isValidCareer(data)) throw new Error('Некорректный career.json');
    if (data.status !== 'published') return null;
    const organizations = data.organizations.filter((item) => item.status === 'published');
    const organizationIds = new Set(organizations.map((item) => item.id));
    const engagements = data.engagements.filter((item) => item.status === 'published' && organizationIds.has(item.organizationId));
    const engagementIds = new Set(engagements.map((item) => item.id));
    const projectAssignments = data.projectAssignments.filter((item) => item.status === 'published' && engagementIds.has(item.engagementId));
    return { ...data, organizations, engagements, projectAssignments };
  } catch (error) {
    if (error instanceof Error && /HTTP 404/.test(error.message)) return null;
    throw error;
  }
}
