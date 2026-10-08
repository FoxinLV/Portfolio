import { describe, expect, it } from 'vitest';
import type { Project } from '../types/project';
import { buildProjectsPdfDefinition } from './projectsPdf';

function project(overrides: Partial<Project> = {}): Project {
  return {
    schemaVersion: 1,
    id: 'project-1',
    status: 'published',
    title: 'Тестовый проект',
    shortDescription: 'Краткое описание',
    description: 'Полное описание',
    date: '2026-09-01',
    type: { id: 'web', name: 'Веб-сервис' },
    direction: { id: 'automation', name: 'Автоматизация' },
    technologies: [{ name: 'React', icon: 'icons/react.svg' }],
    tasks: ['Задача'],
    features: ['Возможность'],
    results: ['Результат'],
    storagePath: 'projects/project-1',
    ...overrides
  };
}

describe('project PDF definition', () => {
  it('includes the selected project details and correct singular project label', () => {
    const definition = buildProjectsPdfDefinition(
      { projects: [project()], career: null, profile: null },
      new Map([['project-1', { gallery: [], technologyIcons: new Map() }]])
    );
    const documentText = JSON.stringify(definition.content);

    expect(documentText).toContain('1 проект');
    expect(documentText).toContain('Тестовый проект');
    expect(documentText).toContain('Полное описание');
    expect(documentText).toContain('React');
    expect(documentText).toContain('Задача');
    expect(documentText).toContain('Возможность');
    expect(documentText).toContain('Результат');
  });
});
