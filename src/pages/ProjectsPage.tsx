import { useMemo, useState } from 'react';
import { EMPTY_FILTERS, type ProjectFilters } from '../types/project';
import { usePortfolio } from '../context/PortfolioContext';
import { applyFilters, groupByYear, statistics } from '../utils/projects';
import { shortDate } from '../utils/dates';
import { Filters } from '../components/Filters';
import { Icon } from '../components/Icon';
import { ProjectCard } from '../components/ProjectCard';
import { ErrorState, Loader } from '../components/Feedback';

export function ProjectsPage() {
  const { projects, projectsLoading, projectsError, retryProjects } = usePortfolio();
  const [filters, setFilters] = useState<ProjectFilters>(EMPTY_FILTERS);
  const [mobileFilters, setMobileFilters] = useState(false);
  const filtered = useMemo(() => applyFilters(projects, filters), [projects, filters]);
  const grouped = useMemo(() => groupByYear(filtered), [filtered]);
  const stats = useMemo(() => statistics(projects), [projects]);
  const reset = () => setFilters(EMPTY_FILTERS);

  return <div className="page projects-page">
    <header className="projects-hero">
      <div className="hero-grid" aria-hidden="true" />
      <div className="hero-orb" aria-hidden="true" />
      <div className="hero-copy"><p className="eyebrow">Портфолио</p><h1>Проекты</h1><p>Реализованные проекты, системы и задачи<br className="desktop-only" /> в хронологическом порядке.<br />От внутренних инструментов до production-решений.</p></div>
      <div className="stats-row">
        <Stat value={projectsLoading ? '—' : String(stats.projects)} label="проектов" />
        <Stat value={projectsLoading ? '—' : String(stats.types)} label="типов систем" />
        <Stat value={projectsLoading ? '—' : String(stats.technologies)} label="технологий" />
        <Stat value={projectsLoading ? '—' : stats.period} label="период реализации" />
      </div>
    </header>
    <div className="page-toolbar"><div><p className="eyebrow eyebrow--dark">Хронология</p><h2>Все проекты</h2></div><button className="filter-button" onClick={() => setMobileFilters(true)}><Icon name="filter" />Фильтры{Object.values(filters).filter(Boolean).length > 0 && <span>{Object.values(filters).filter(Boolean).length}</span>}</button></div>
    <div className="projects-layout">
      <section className="timeline" aria-live="polite">
        {projectsLoading && <Loader />}
        {!projectsLoading && projectsError && <ErrorState title="Не удалось загрузить проекты" message={projectsError === 'Адрес Object Storage не настроен' ? 'Укажите VITE_STORAGE_BASE_URL в файле .env и попробуйте снова.' : 'Проверьте подключение к интернету или попробуйте обновить страницу.'} onRetry={retryProjects} />}
        {!projectsLoading && !projectsError && filtered.length === 0 && <div className="state-card"><span className="state-code">0</span><h2>Проекты не найдены</h2><p>Попробуйте изменить параметры поиска или сбросить фильтры.</p><button className="button button--primary" onClick={reset}>Сбросить фильтры</button></div>}
        {!projectsLoading && !projectsError && Object.entries(grouped).sort(([a], [b]) => Number(b) - Number(a)).map(([year, yearProjects]) =>
          <section className="timeline-year" key={year} aria-labelledby={`year-${year}`}><h2 id={`year-${year}`}>{year}</h2><div className="timeline-items">{yearProjects.map((project) => <div className="timeline-item" key={project.id}><div className="timeline-date"><span>{shortDate(project.date)}</span><i /></div><ProjectCard project={project} /></div>)}</div></section>)}
      </section>
      <Filters projects={projects} filters={filters} setFilters={setFilters} mobileOpen={mobileFilters} closeMobile={() => setMobileFilters(false)} />
    </div>
  </div>;
}

function Stat({ value, label }: { value: string; label: string }) { return <div className="stat"><strong>{value}</strong><span>{label}</span></div>; }
