import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ErrorState, Loader } from '../components/Feedback';
import { Icon } from '../components/Icon';
import { SmartImage } from '../components/SmartImage';
import { usePortfolio } from '../context/PortfolioContext';
import type { Project, ProjectTechnology } from '../types/project';
import { groupByYear } from '../utils/projects';
import { technologyIconUrl, technologyValue } from '../utils/projectTechnology';

const uniqueNames = (values: string[]) => [...new Map(values.map((value) => {
  const name = value.trim();
  return [name.toLocaleLowerCase('ru-RU'), name];
})).values()];

const sortProjects = (projects: Project[]) => [...projects]
  .sort((first, second) => Date.parse(second.date) - Date.parse(first.date));

type ChronologyTechnology = ProjectTechnology & { storagePath: string };

const uniqueTechnologies = (projects: Project[]) => {
  const technologies = new Map<string, ChronologyTechnology>();
  projects.forEach((project) => project.technologies.forEach((technology) => {
    const value = technologyValue(technology);
    const key = value.name.trim().toLocaleLowerCase('ru-RU');
    const current = technologies.get(key);
    if (!current || (!current.icon && value.icon)) technologies.set(key, { ...value, name: value.name.trim(), storagePath: project.storagePath });
  }));
  return [...technologies.values()];
};

export function ChronologyPage() {
  const { projects, projectsLoading, projectsError, retryProjects } = usePortfolio();
  const years = useMemo(() => Object.entries(groupByYear(projects))
    .sort(([first], [second]) => Number(second) - Number(first))
    .map(([year, yearProjects]) => ({
      year,
      projects: sortProjects(yearProjects),
      types: uniqueNames(yearProjects.map((project) => project.type.name)),
      technologies: uniqueTechnologies(yearProjects)
    })), [projects]);

  useEffect(() => {
    document.title = 'Хронология проектов — Виталий Лифанов';
    return () => { document.title = 'Виталий Лифанов — Проекты'; };
  }, []);

  const technologyCount = uniqueTechnologies(projects).length;
  const period = years.length > 1 ? `${years.at(-1)?.year} — ${years[0]?.year}` : years[0]?.year || '—';

  return <div className="page chronology-page">
    <header className="chronology-hero">
      <div className="chronology-hero-grid" aria-hidden="true" />
      <div className="chronology-hero-copy">
        <p className="eyebrow">Портфолио во времени</p>
        <h1>Хронология<br /><span>проектов</span><i>.</i></h1>
        <p>Профессиональный путь через реализованные системы, направления и технологии — от первых проектов к актуальным.</p>
        <div className="chronology-hero-actions">
          <a className="button button--primary" href="#chronology-content">Смотреть по годам <Icon name="arrow" /></a>
          <Link to="/projects">Все проекты <Icon name="external" /></Link>
        </div>
      </div>
      {years.length > 0 && <div className="chronology-year-cloud" aria-hidden="true">
        <span className="chronology-year-line" />
        {years.slice(0, 4).map((item, index) => <div key={item.year} style={{ '--year-index': index } as React.CSSProperties}>
          <i /><strong>{item.year}</strong><small>{item.projects.length} проект{item.projects.length === 1 ? '' : item.projects.length < 5 ? 'а' : 'ов'}</small>
        </div>)}
      </div>}
      <div className="chronology-hero-stats">
        <article><Icon name="projects" /><div><strong>{projectsLoading ? '—' : projects.length}</strong><span>проектов в портфолио</span></div></article>
        <article><Icon name="timeline" /><div><strong>{projectsLoading ? '—' : years.length}</strong><span>активных лет</span></div></article>
        <article><Icon name="gear" /><div><strong>{projectsLoading ? '—' : technologyCount}</strong><span>технологий</span></div></article>
        <article><Icon name="calendar" /><div><strong>{projectsLoading ? '—' : period}</strong><span>период проектов</span></div></article>
      </div>
    </header>

    <section className="chronology-content" id="chronology-content" aria-live="polite">
      {projectsLoading && <Loader cards={3} />}
      {!projectsLoading && projectsError && <ErrorState title="Не удалось загрузить хронологию" message="Данные проектов сейчас недоступны." onRetry={retryProjects} />}
      {!projectsLoading && !projectsError && years.length === 0 && <div className="state-card"><span className="state-code">0</span><h2>Проекты пока не добавлены</h2></div>}
      {!projectsLoading && !projectsError && years.length > 0 && <div className="chronology-table">
        <div className="chronology-table-head" aria-hidden="true">
          <span>Год</span><span>Проекты</span><span>Типы систем</span><span>Ключевые технологии</span>
        </div>
        {years.map((item) => <article className="chronology-row" key={item.year}>
          <h2>{item.year}</h2>
          <div className="chronology-cell chronology-projects" data-label="Проекты">
            {item.projects.map((project) => <Link key={project.id} to={`/projects/${project.id}`}><span>{project.title}</span><Icon name="arrow" /></Link>)}
          </div>
          <div className="chronology-cell" data-label="Типы систем">
            <div className="chronology-tags chronology-tags--types">{item.types.map((type) => <span key={type}>{type}</span>)}</div>
          </div>
          <div className="chronology-cell" data-label="Ключевые технологии">
            <div className="chronology-tags">{item.technologies.map((technology) => <span key={technology.name}>{technology.icon && <SmartImage className="chronology-tech-icon" src={technologyIconUrl(technology.icon, technology.storagePath)} alt="" />}{technology.name}</span>)}</div>
          </div>
        </article>)}
      </div>}
    </section>
  </div>;
}
