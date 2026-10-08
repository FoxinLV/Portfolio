import { useMemo, useState } from 'react';
import { ErrorState, Loader } from '../components/Feedback';
import { Filters } from '../components/Filters';
import { Icon } from '../components/Icon';
import { ProjectCard } from '../components/ProjectCard';
import { usePortfolio } from '../context/PortfolioContext';
import { EMPTY_FILTERS, type ProjectFilters } from '../types/project';
import { shortDate } from '../utils/dates';
import { applyFilters, groupByYear, statistics } from '../utils/projects';
import { downloadProjectsPdf, type ProjectPdfProgress } from '../utils/projectsPdf';

type ProjectsView = 'list' | 'grid' | 'timeline';

function projectCountLabel(count: number) {
  const modulo100 = count % 100;
  const modulo10 = count % 10;
  const noun = modulo100 >= 11 && modulo100 <= 14 ? 'проектов' : modulo10 === 1 ? 'проект' : modulo10 >= 2 && modulo10 <= 4 ? 'проекта' : 'проектов';
  return `${count} ${noun}`;
}

export function ProjectsPage() {
  const { projects, projectsLoading, projectsError, retryProjects, career, profile } = usePortfolio();
  const [filters, setFilters] = useState<ProjectFilters>(EMPTY_FILTERS);
  const [mobileFilters, setMobileFilters] = useState(false);
  const [view, setView] = useState<ProjectsView>('list');
  const [pdfMode, setPdfMode] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(() => new Set());
  const [pdfProgress, setPdfProgress] = useState<ProjectPdfProgress | null>(null);
  const [pdfError, setPdfError] = useState('');
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
  const selected = projects.filter((project) => selectedProjects.has(project.id));
  const toggleProject = (projectId: string) => setSelectedProjects((current) => {
    const next = new Set(current);
    if (next.has(projectId)) next.delete(projectId); else next.add(projectId);
    return next;
  });
  const selectFiltered = () => setSelectedProjects((current) => new Set([...current, ...filtered.map((project) => project.id)]));
  const closePdfMode = () => { setPdfMode(false); setSelectedProjects(new Set()); setPdfError(''); setPdfProgress(null); };
  const exportPdf = async () => {
    if (!selected.length || pdfProgress) return;
    setPdfError('');
    setPdfProgress({ message: 'Подотавливаем данные', value: 4 });
    try {
      await downloadProjectsPdf({ projects: selected, career, profile, onProgress: setPdfProgress });
      await new Promise((resolve) => window.setTimeout(resolve, 650));
      setPdfProgress(null);
    } catch (error) {
      console.error(error);
      setPdfProgress(null);
      setPdfError('Не удалось сформировать PDF. Проверьте доступ к изображениям и попробуйте ещё раз.');
    }
  };

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
        <button className={`project-pdf-mode-button ${pdfMode ? 'active' : ''}`} type="button" aria-pressed={pdfMode} onClick={() => pdfMode ? closePdfMode() : setPdfMode(true)}><Icon name="download" />PDF-каталог</button>
        <div className="view-switcher" aria-label="Вид проектов">
          <ViewButton active={view === 'list'} icon="list" label="Список" onClick={() => setView('list')} />
          <ViewButton active={view === 'grid'} icon="projects" label="Сетка" onClick={() => setView('grid')} />
          <ViewButton active={view === 'timeline'} icon="timeline" label="Таймлайн" onClick={() => setView('timeline')} />
        </div>
        <button className="filter-button" aria-expanded={mobileFilters} aria-controls="projects-filters" onClick={() => setMobileFilters((open) => !open)}><Icon name="filter" />{mobileFilters ? 'Скрыть фильтры' : 'Фильтры'}{Object.values(filters).filter(Boolean).length > 0 && <span>{Object.values(filters).filter(Boolean).length}</span>}</button>
      </div>
    </div>

    {pdfMode && <section className="project-pdf-toolbar" aria-label="Экспорт выбранных проектов в PDF">
      <div><span className="project-pdf-toolbar-icon"><Icon name="file" /></span><div><strong>Проекты для PDF</strong><small>{selected.length ? `Выбрано: ${selected.length}` : 'Отметьте проекты в списке'}</small></div></div>
      <div className="project-pdf-toolbar-actions">
        <button type="button" onClick={selectFiltered} disabled={!filtered.length || Boolean(pdfProgress)}>Выбрать показанные ({filtered.length})</button>
        <button type="button" onClick={() => setSelectedProjects(new Set())} disabled={!selected.length || Boolean(pdfProgress)}>Очистить</button>
        <button type="button" onClick={closePdfMode} disabled={Boolean(pdfProgress)}>Отмена</button>
        <button className="button button--primary" type="button" onClick={exportPdf} disabled={!selected.length || Boolean(pdfProgress)} aria-busy={pdfProgress ? true : undefined}><Icon name="download" />Скачать PDF</button>
      </div>
      {pdfError && <p role="alert">{pdfError}</p>}
    </section>}

    <div className="projects-layout">
      <section className={`timeline timeline--${view}`} aria-live="polite">
        {projectsLoading && <Loader />}
        {!projectsLoading && projectsError && <ErrorState title="Не удалось загрузить проекты" message={projectsError === 'Адрес Object Storage не настроен' ? 'Укажите VITE_STORAGE_BASE_URL в файле .env и попробуйте снова.' : 'Проверьте подключение к интернету или попробуйте обновить страницу.'} onRetry={retryProjects} />}
        {!projectsLoading && !projectsError && filtered.length === 0 && <div className="state-card"><span className="state-code">0</span><h2>Проекты не найдены</h2><p>Попробуйте изменить параметры поиска или сбросить фильтры.</p><button className="button button--primary" onClick={reset}>Сбросить фильтры</button></div>}
        {!projectsLoading && !projectsError && Object.entries(grouped).sort(([a], [b]) => Number(b) - Number(a)).map(([year, yearProjects]) =>
          <section className="timeline-year" key={year} aria-labelledby={`year-${year}`}><h2 id={`year-${year}`}>{year}</h2><div className="timeline-items">{yearProjects.map((project) => <div className={`timeline-item ${pdfMode ? 'timeline-item--selectable' : ''} ${selectedProjects.has(project.id) ? 'timeline-item--selected' : ''}`} key={project.id}><div className="timeline-date"><span>{shortDate(project.date)}</span><i /></div>{pdfMode && <button className="project-pdf-select" type="button" aria-label={`${selectedProjects.has(project.id) ? 'Убрать' : 'Добавить'} проект «${project.title}» ${selectedProjects.has(project.id) ? 'из' : 'в'} PDF`} aria-pressed={selectedProjects.has(project.id)} onClick={() => toggleProject(project.id)}><Icon name={selectedProjects.has(project.id) ? 'close' : 'file'} /><span>{selectedProjects.has(project.id) ? 'Выбран' : 'В PDF'}</span></button>}<ProjectCard project={project} /></div>)}</div></section>)}
      </section>
      <Filters projects={projects} companies={careerFilters.companies} filters={filters} setFilters={setFilters} mobileOpen={mobileFilters} closeMobile={() => setMobileFilters(false)} />
    </div>
    {pdfProgress && <div className="project-pdf-progress-backdrop" role="presentation">
      <section className="project-pdf-progress-dialog" role="dialog" aria-modal="true" aria-labelledby="project-pdf-progress-title" aria-describedby="project-pdf-progress-message">
        <span className="project-pdf-progress-icon"><Icon name={pdfProgress.value === 100 ? 'check' : 'file'} /></span>
        <div className="project-pdf-progress-heading"><div><p>PDF-каталог</p><h2 id="project-pdf-progress-title">{pdfProgress.value === 100 ? 'Каталог готов' : 'Формируем каталог'}</h2></div><strong>{pdfProgress.value}%</strong></div>
        <p id="project-pdf-progress-message" aria-live="polite">{pdfProgress.message}</p>
        <div className="project-pdf-progress-track" role="progressbar" aria-label="Ход формирования PDF" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pdfProgress.value}><i style={{ width: `${pdfProgress.value}%` }} /></div>
        <small>{projectCountLabel(selected.length)} • окно закроется автоматически</small>
      </section>
    </div>}
  </div>;
}

function Stat({ icon, value, label }: { icon: string; value: string; label: string }) {
  return <div className="stat"><span className="stat-icon"><Icon name={icon} /></span><div><strong>{value}</strong><span>{label}</span></div></div>;
}

function ViewButton({ active, icon, label, onClick }: { active: boolean; icon: string; label: string; onClick: () => void }) {
  return <button className={active ? 'active' : ''} onClick={onClick} aria-pressed={active}><Icon name={icon} />{label}</button>;
}
