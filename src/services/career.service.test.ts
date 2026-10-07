import { describe, expect, it } from 'vitest';
import { isValidCareer } from './career.service';

const career = {
  schemaVersion: 1,
  status: 'published',
  updatedAt: '2026-10-07T12:00:00.000Z',
  headline: 'Карьера в разработке',
  summary: '',
  settings: { defaultView: 'timeline', showParallelWork: true, showExperienceSummary: true },
  organizations: [{ id: 'acme', status: 'published', name: 'Acme', kind: 'company' }],
  engagements: [{
    id: 'acme-developer', status: 'published', organizationId: 'acme', title: 'Разработчик', employmentType: 'full-time',
    startDate: '2024-01-01', endDate: null, datePrecision: 'month', summary: ''
  }],
  projectAssignments: [{ id: 'acme-portfolio', status: 'published', engagementId: 'acme-developer', projectId: 'portfolio' }]
};

describe('career data contract', () => {
  it('accepts a published career document with draftable descriptions', () => {
    expect(isValidCareer(career)).toBe(true);
  });

  it('rejects malformed IDs and dates', () => {
    expect(isValidCareer({ ...career, organizations: [{ ...career.organizations[0], id: '../acme' }] })).toBe(false);
    expect(isValidCareer({ ...career, engagements: [{ ...career.engagements[0], startDate: 'January 2024' }] })).toBe(false);
  });
});
