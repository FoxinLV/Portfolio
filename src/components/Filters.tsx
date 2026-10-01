import type { Project, ProjectFilters } from '../types/project';
import { projectYear } from '../utils/dates';
import { uniqueBy } from '../utils/projects';
import { Icon } from './Icon';

interface Props { projects: Project[]; filters: ProjectFilters; setFilters: (value: ProjectFilters) => void; mobileOpen: boolean; closeMobile: () => void }

export function Filters({ projects, filters, setFilters, mobileOpen, closeMobile }: Props) {
  const years = [...new Set(projects.map((project) => projectYear(project.date)))].sort((a, b) => b - a);
  const types = uniqueBy(projects.map((project) => project.type), (item) => item.id).sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  const directions = uniqueBy(projects.map((project) => project.direction), (item) => item.id).sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  const technologies = [...new Set(projects.flatMap((project) => project.technologies))].sort((a, b) => a.localeCompare(b, 'ru'));
  const update = (key: keyof ProjectFilters, value: string) => setFilters({ ...filters, [key]: value });
  const active = Object.values(filters).some(Boolean);
  return <>
    {mobileOpen && <button className="filter-backdrop" onClick={closeMobile} aria-label="Закрыть фильтры" />}
    <aside className={`filters-panel ${mobileOpen ? 'filters-panel--open' : ''}`} aria-label="Фильтры проектов">
      <div className="filter-mobile-title"><strong>Фильтры</strong><button onClick={closeMobile} aria-label="Закрыть фильтры"><Icon name="close" /></button></div>
      <label className="search-field"><span>Поиск</span><div><Icon name="search"/><input value={filters.query} onChange={(event) => update('query', event.target.value)} placeholder="Название или технология" /></div></label>
      <Select label="Год" value={filters.year} onChange={(value) => update('year', value)} options={years.map(String)} names={years.map(String)} all="Все годы" />
      <Select label="Тип системы" value={filters.type} onChange={(value) => update('type', value)} options={types.map((item) => item.id)} names={types.map((item) => item.name)} all="Все типы" />
      <Select label="Технология" value={filters.technology} onChange={(value) => update('technology', value)} options={technologies} names={technologies} all="Все технологии" />
      <Select label="Направление" value={filters.direction} onChange={(value) => update('direction', value)} options={directions.map((item) => item.id)} names={directions.map((item) => item.name)} all="Все направления" />
      <button className="reset-button" disabled={!active} onClick={() => setFilters({ query: '', year: '', type: '', technology: '', direction: '' })}>Сбросить фильтры</button>
      <button className="button button--primary apply-mobile" onClick={closeMobile}>Показать проекты</button>
    </aside>
  </>;
}

function Select({ label, value, onChange, options, names, all }: { label: string; value: string; onChange: (value: string) => void; options: string[]; names: string[]; all: string }) {
  return <label className="select-field"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}><option value="">{all}</option>{options.map((option, index) => <option key={option} value={option}>{names[index]}</option>)}</select></label>;
}
