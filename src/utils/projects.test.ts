import { describe, expect, it } from 'vitest';
import type { Project } from '../types/project';
import { applyFilters, groupByYear, statistics } from './projects';

const make = (id: string, date: string, technology: string): Project => ({ schemaVersion: 1, id, status: 'published', title: id, shortDescription: 'Тест', date, type: { id: 'web', name: 'Веб-системы' }, direction: { id: 'studio', name: 'Studio' }, technologies: [technology], cover: 'cover.webp', storagePath: `portfolio/projects/${id}` });
const projects = [make('alpha', '2026-09-01', 'React'), make('beta', '2025-01-01', 'Python')];

describe('project utils', () => {
  it('combines filters with AND', () => expect(applyFilters(projects, { query: 'react', year: '2026', type: 'web', technology: 'React', direction: 'studio' })).toHaveLength(1));
  it('groups projects by year', () => expect(Object.keys(groupByYear(projects))).toEqual(['2025', '2026']));
  it('calculates portfolio statistics', () => expect(statistics(projects)).toEqual({ projects: 2, types: 1, technologies: 2, period: '2025–2026' }));
});
