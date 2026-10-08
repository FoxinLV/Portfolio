import { useMemo, useState } from 'react';
import { ErrorState, Loader } from '../components/Feedback';
import { Filters } from '../components/Filters';
import { Icon } from '../components/Icon';
import { ProjectCard } from '../components/ProjectCard';
import { usePortfolio } from '../context/PortfolioContext';
import { EMPTY_FILTERS, type ProjectFilters } from '../types/project';
import { shortDate } from '../utils/dates';
import { applyFilters, groupByYear, statistics } from '../utils/projects';

type ProjectsView = 'list' | 'grid' | 'timeline';

export function ProjectsPage() {
  const { projects, projectsLoading, projectsError, retryProjects, career } = usePortfolio();
  const [filters, setFilters] = useState<ProjectFilters>(EMPTY_FILTERS);
  const [mobileFilters, setMobileFilters] = useState(false);
  const [view, setView] = useState<ProjectsView>('list');
  const careerFilters = useMemo(() => {
    const projectCompanies = new Map<string, string[]>();
    const companyProjects = new Map<string, Set<string>>();
    const engagementMap = new Map(career?.engagements.map((item) => [item.id, item]) ?? []);
    for (const assignment of career?.projectAssignments ?? []) {
      const companyId = engagementMap.get(assignment.engagementId)?.organizationId;
      if (!companyId) continue;
      const projectCompanyIds = projectCompanies.get(assignment.projectId) ?? [];
      if (!projectCompanyIds.includes(companyId)) projectCompanyIds.push(companyId);
      projectCompanies.set(assignment.projectId, projectCompanyIds);
      const companyProjectIds = companyProjects.get(companyId) ?? new Set<string>();
      companyProjectIds.add(assignment.projectId);
      companyProjects.set(companyId, companyProjectIds);
    }
    const projectIds = new Set(projects.map((project) => project.id));
    const companies = (career?.organizations ?? []).flatMap((organization) => {
      const linked = [...(companyProjects.get(organization.id) ?? [])].filter((projectId) => projectIds.has(projectId));
      if (!linked.length) return [];
      const roles = career?.engagements.filter((item) => item.organizationId === organization.id) ?? [];
      return [{ id: organization.id, name: organization.name, projects: linked.length, active: roles.some((item) => !item.endDate), latest: roles.reduce((date, item) => item.startDate > date ? item.startDate : date, '') }];
    }).sort((first, second) => Number(second.active) - Number(first.active) || second.latest.localeCompare(first.latest) || first.name.localeCompare(second.name, 'ru'));
    return { projectCompanies, companies };
  }, [career, projects]);
  const filtered = useMemo(() => applyFilters(projects, filters, careerFilters.projectCompanies), [projects, filters, careerFilters]);
  const grouped = useMemo(() => groupByYear(filtered), [filtered]);
  const stats = useMemo(() => statistics(projects), [projects]);
  const reset = () => setFilters(EMPTY_FILTERS);

  return <div className="page projects-page">
    <header className="projects-hero">
      <div className="hero-grid" aria-hidden="true" />
      <div className="hero-orb" aria-hidden="true" />
      <div className="hero-copy"><p className="eyebrow">Портфолио</p><h1>Проекты</h1><p>Реализованные проекты, системы и задачи<br className="desktop-only" /> в хронологическом порядке.<br />От внутренних инструментов до production-решений.</p></div>
      <div className="stats-row">
        <Stat icon="folder" value={projectsLoading ? '—' : String(stats.projects)} label="проектов" />
        <Stat icon="cube" value={projectsLoading ? '—' : String(stats.types)} label="типов систем" />
        <Stat icon="code" value={projectsLoading ? '—' : `${stats.technologies}${stats.technologies ? '+' : ''}`} label="технологий" />
        <Stat icon="calendar" value={projectsLoading ? '—' : stats.period} label="период реализации" />
      </div>
    </header>

    <div className="page-toolbar">
      <div><p className="eyebrow eyebrow--dark">Хронология</p><h2>Все проекты</h2></div>
      <div className="projects-toolbar-actions">
        <div className="view-switcher" aria-label="Вид проектов">
          <ViewButton active={view === 'list'} icon="list" label="Список" onClick={() => setView('list')} />
          <ViewButton active={view === 'grid'} icon="projects" label="Сетка" onClick={() => setView('grid')} />
          <ViewButton active={view === 'timeline'} icon="timeline" label="Таймлайн" onClick={() => setView('timeline')} />
        </div>
        <button className="filter-button" aria-expanded={mobileFilters} aria-controls="projects-filters" onClick={() => setMobileFilters((open) => !open)}><Icon name="filter" />{mobileFilters ? 'Скрыть фильтры' : 'Фильтры'}{Object.values(filters).filter(Boolean).length > 0 && <span>{Object.values(filters).filter(Boolean).length}</span>}</button>
      </div>
    </div>

    <div className="projects-layout">
      <section className={`timeline timeline--${view}`} aria-live="polite">
        {projectsLoading && <Loader />}
        {!projectsLoading && projectsError && <ErrorState title="Не удалось загрузить проекты" message={projectsError === 'Адрес Object Storage не настроен' ? 'Укажите VITE_STORAGE_BASE_URL в файле .env и попробуйте снова.' : 'Проверьте подключение к интернету или попробуйте обновить страницу.'} onRetry={retryProjects} />}
        {!projectsLoading && !projectsError && filtered.length === 0 && <div className="state-card"><span className="state-code">0</span><h2>Проекты не найдены</h2><p>Попробуйте изменить параметры поиска или сбросить фильтры.</p><button className="button button--primary" onClick={reset}>Сбросить фильтры</button></div>}
        {!projectsLoading && !projectsError && Object.entries(grouped).sort(([a], [b]) => Number(b) - Number(a)).map(([year, yearProjects]) =>
          <section className="timeline-year" key={year} aria-labelledby={`year-${year}`}><h2 id={`year-${year}`}>{year}</h2><div className="timeline-items">{yearProjects.map((project) => <div className="timeline-item" key={project.id}><div className="timeline-date"><span>{shortDate(project.date)}</span><i /></div><ProjectCard project={project} /></div>)}</div></section>)}
      </section>
      <Filters projects={projects} companies={careerFilters.companies} filters={filters} setFilters={setFilters} mobileOpen={mobileFilters} closeMobile={() => setMobileFilters(false)} />
    </div>
  </div>;
}

function Stat({ icon, value, label }: { icon: string; value: string; label: string }) {
  return <div className="stat"><span className="stat-icon"><Icon name={icon} /></span><div><strong>{value}</strong><span>{label}</span></div></div>;
}

function ViewButton({ active, icon, label, onClick }: { active: boolean; icon: string; label: string; onClick: () => void }) {
  return <button className={active ? 'active' : ''} onClick={onClick} aria-pressed={active}><Icon name={icon} />{label}</button>;
}
