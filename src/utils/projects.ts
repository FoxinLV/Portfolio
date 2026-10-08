import type { Project, ProjectFilters } from '../types/project';
import { projectYear } from './dates';
import { technologyName } from './projectTechnology';

export function applyFilters(projects: Project[], filters: ProjectFilters, projectCompanies: ReadonlyMap<string, readonly string[]> = new Map()) {
  const query = filters.query.trim().toLocaleLowerCase('ru-RU');
  return projects.filter((project) => {
    const haystack = [project.title, project.shortDescription, project.description ?? '', project.type.name,
      project.direction.name, ...project.technologies.map(technologyName)].join(' ').toLocaleLowerCase('ru-RU');
    return (!query || haystack.includes(query)) &&
      (!filters.year || String(projectYear(project.date)) === filters.year) &&
      (!filters.type || project.type.id === filters.type) &&
      (!filters.technology || project.technologies.some((technology) => technologyName(technology) === filters.technology)) &&
      (!filters.direction || project.direction.id === filters.direction) &&
      (!filters.company || projectCompanies.get(project.id)?.includes(filters.company));
  });
}

export const uniqueBy = <T,>(values: T[], key: (value: T) => string) =>
  [...new Map(values.map((value) => [key(value), value])).values()];

export function groupByYear(projects: Project[]) {
  return projects.reduce<Record<string, Project[]>>((groups, project) => {
    const year = String(projectYear(project.date));
    (groups[year] ??= []).push(project);
    return groups;
  }, {});
}

export function statistics(projects: Project[]) {
  const years = projects.map((project) => projectYear(project.date));
  return {
    projects: projects.length,
    types: new Set(projects.map((project) => project.type.id)).size,
    technologies: new Set(projects.flatMap((project) => project.technologies.map(technologyName))).size,
    period: years.length ? `${Math.min(...years)}${Math.min(...years) === Math.max(...years) ? '' : `–${Math.max(...years)}`}` : '—'
  };
}
