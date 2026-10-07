import { describe, expect, it } from 'vitest';
import { isValidEducation } from './education.service';

const document = {
  schemaVersion: 1,
  status: 'published',
  updatedAt: '2026-10-07T12:00:00.000Z',
  headline: 'Образование и развитие',
  summary: 'Профессиональная подготовка.',
  education: [{
    id: 'university', status: 'published', level: 'Высшее', institution: 'Университет', faculty: 'ИТ',
    specialization: 'Информационные системы', graduationYear: 2020, image: 'education/items/university/image.webp',
    attachments: [{ name: 'diploma.pdf', path: 'education/items/university/files/diploma.pdf' }]
  }],
  courses: [{ id: 'course', status: 'published', title: 'Архитектура', organization: 'Учебный центр', specialization: 'Системы', completionYear: 2025, attachments: [] }]
};

describe('education data contract', () => {
  it('accepts valid education and courses', () => expect(isValidEducation(document)).toBe(true));

  it('rejects media paths belonging to another item', () => {
    const invalid = structuredClone(document);
    invalid.education[0].attachments[0].path = 'education/items/another/files/diploma.pdf';
    expect(isValidEducation(invalid)).toBe(false);
  });
});
