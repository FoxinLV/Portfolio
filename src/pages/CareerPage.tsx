import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ErrorState, Loader } from '../components/Feedback';
import { Icon } from '../components/Icon';
import { SmartImage } from '../components/SmartImage';
import { usePortfolio } from '../context/PortfolioContext';
import type { CareerEngagement, CareerOrganization, CareerProjectAssignment } from '../types/career';
import type { Project } from '../types/project';
import { portfolioAssetUrl, projectAssetUrl } from '../utils/storageUrl';

const employmentNames: Record<string, string> = {
  'full-time': 'Полная занятость', 'part-time': 'Частичная занятость', contract: 'Контракт', freelance: 'Фриланс',
  'self-employed': 'Собственный проект', internship: 'Стажировка', volunteer: 'Волонтёрство', 'project-based': 'Проектная работа', other: 'Другое'
};

function monthIndex(value: string) {
  const [year, month] = value.split('-').map(Number);
  return year * 12 + month - 1;
}

function monthsInUnion(items: CareerEngagement[]) {
  const now = new Date();
  const current = now.getFullYear() * 12 + now.getMonth();
  const ranges = items.map((item) => [monthIndex(item.startDate), item.endDate ? monthIndex(item.endDate) : current] as [number, number])
    .sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const range of ranges) {
    const last = merged.at(-1);
    if (!last || range[0] > last[1] + 1) merged.push([...range]);
    else last[1] = Math.max(last[1], range[1]);
  }
  return merged.reduce((sum, [start, end]) => sum + Math.max(1, end - start + 1), 0);
}

function durationLabel(months: number) {
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts = [];
  if (years) parts.push(`${years} ${years % 10 === 1 && years % 100 !== 11 ? 'год' : [2, 3, 4].includes(years % 10) && ![12, 13, 14].includes(years % 100) ? 'года' : 'лет'}`);
  if (rest) parts.push(`${rest} ${rest === 1 ? 'месяц' : [2, 3, 4].includes(rest) ? 'месяца' : 'месяцев'}`);
  return parts.join(' ') || 'менее месяца';
}

function dateLabel(value: string, _precision: CareerEngagement['datePrecision']) {
  const date = new Date(`${value}T00:00:00Z`);
  return new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date);
}

function periodLabel(item: CareerEngagement) {
  return `${dateLabel(item.startDate, item.datePrecision)} — ${item.endDate ? dateLabel(item.endDate, item.datePrecision) : 'настоящее время'}`;
}

export function CareerPage() {
  const { career, careerLoading, careerError, retryCareer, projects } = usePortfolio();
  const [searchParams] = useSearchParams();
  const selected = searchParams.get('engagement');
  const [view, setView] = useState<'timeline' | 'organizations' | null>(null);

  useEffect(() => {
    document.title = 'Карьера — Виталий Лифанов';
    return () => { document.title = 'Виталий Лифанов — Проекты'; };
  }, []);

  useEffect(() => {
    if (!selected || careerLoading) return;
    if (view !== 'timeline') { setView('timeline'); return; }
    const target = document.getElementById(`career-${selected}`);
    if (target) { target.scrollIntoView({ block: 'center' }); target.focus({ preventScroll: true }); }
  }, [selected, careerLoading, view]);

  const projectMap = useMemo(() => new Map(projects.map((project) => [project.id, project])), [projects]);

  if (careerLoading) return <div className="page career-page"><div className="career-loading"><Loader cards={3} /></div></div>;
  if (careerError) return <div className="page career-page"><div className="career-state"><ErrorState title="Не удалось загрузить карьеру" message="Карьерные данные сейчас недоступны." onRetry={retryCareer} /></div></div>;
  if (!career) return <div className="page career-page"><div className="career-state state-card"><span className="state-code">…</span><h1>Карьерная история готовится</h1><p>Пока можно посмотреть реализованные проекты.</p><Link className="button button--primary" to="/projects">К проектам</Link></div></div>;

  const engagements = [...career.engagements].sort((a, b) => b.startDate.localeCompare(a.startDate) || (b.order ?? 0) - (a.order ?? 0));
  const organizationMap = new Map(career.organizations.map((item) => [item.id, item]));
  const assignmentMap = new Map<string, CareerProjectAssignment[]>();
  for (const assignment of career.projectAssignments) assignmentMap.set(assignment.engagementId, [...(assignmentMap.get(assignment.engagementId) ?? []), assignment]);
  const linkedProjects = new Set(career.projectAssignments.filter((item) => projectMap.has(item.projectId)).map((item) => item.projectId));
  const activeCount = engagements.filter((item) => !item.endDate).length;
  const experience = durationLabel(monthsInUnion(engagements));
  const activeView = view ?? career.settings.defaultView;

  return <div className="page career-page">
    <header className="career-hero">
      <div className="career-hero-grid" aria-hidden="true" />
      <div className="career-hero-copy">
        <p className="eyebrow">Профессиональный путь</p>
        <h1>Карьера</h1>
        <h2>{career.headline}</h2>
        <p>{career.summary}</p>
        <ResumeActions career={career} />
      </div>
      <div className="career-stats">
        {career.settings.showExperienceSummary && <CareerStat value={experience} label="календарного опыта" />}
        <CareerStat value={String(career.organizations.length)} label="организаций" />
        <CareerStat value={String(engagements.length)} label="должностей и ролей" />
        <CareerStat value={String(linkedProjects.size)} label="связанных проектов" />
        {career.settings.showParallelWork && activeCount > 1 && <CareerStat value={String(activeCount)} label="активные роли сейчас" />}
      </div>
    </header>

    <main className="career-content">
      <nav className="career-view-switch" aria-label="Вид карьерной истории">
        <div><strong>Как показать опыт</strong><span>Выберите удобную группировку</span></div>
        <div role="group"><button type="button" className={activeView === 'timeline' ? 'active' : ''} aria-pressed={activeView === 'timeline'} onClick={() => setView('timeline')}><Icon name="career" /><span><strong>По должностям</strong><small>От новых к старым</small></span></button><button type="button" className={activeView === 'organizations' ? 'active' : ''} aria-pressed={activeView === 'organizations'} onClick={() => setView('organizations')}><Icon name="projects" /><span><strong>По компаниям</strong><small>Все роли вместе</small></span></button></div>
      </nav>

      {activeView === 'timeline' && <section className="career-section">
        <div className="career-section-heading"><p className="eyebrow eyebrow--dark">Хронология</p><h2>Профессиональный путь</h2><p>Параллельные роли показаны независимо, а общий стаж не суммирует пересекающиеся периоды дважды.</p></div>
        <div className="career-timeline">{engagements.map((engagement) => <EngagementCard key={engagement.id} engagement={engagement} organization={organizationMap.get(engagement.organizationId)} assignments={assignmentMap.get(engagement.id) ?? []} projectMap={projectMap} selected={selected === engagement.id} />)}</div>
      </section>}

      {activeView === 'organizations' && <section className="career-section career-organizations">
        <div className="career-section-heading"><p className="eyebrow eyebrow--dark">Компании</p><h2>Опыт по компаниям</h2><p>Должности, общий период и реализованные проекты собраны в одном месте.</p></div>
        <div className="organization-grid">{career.organizations.map((organization) => <OrganizationCard key={organization.id} organization={organization} engagements={engagements.filter((item) => item.organizationId === organization.id)} assignmentMap={assignmentMap} />)}</div>
      </section>}

      {(career.resume?.pdf?.enabled || career.resume?.hh?.enabled) && <section className="career-resume-panel"><div><p className="eyebrow">Резюме</p><h2>Полная версия профессионального опыта</h2><p>Актуальный PDF и профиль на hh.ru управляются через локальную систему портфолио.</p></div><ResumeActions career={career} /></section>}
    </main>
  </div>;
}

function CareerStat({ value, label }: { value: string; label: string }) {
  return <div><strong>{value}</strong><span>{label}</span></div>;
}

function ResumeActions({ career }: { career: NonNullable<ReturnType<typeof usePortfolio>['career']> }) {
  const pdf = career.resume?.pdf;
  const hh = career.resume?.hh;
  if (!pdf?.enabled && !hh?.enabled) return null;
  return <div className="career-actions">
    {pdf?.enabled && pdf.path && <a className="button button--primary" href={portfolioAssetUrl(pdf.path)} download={pdf.fileName}><Icon name="download" />{pdf.label || 'Скачать PDF-резюме'}</a>}
    {hh?.enabled && /^https:\/\/(?:[a-z0-9-]+\.)*hh\.ru\//i.test(hh.url) && <a className="career-action-secondary" href={hh.url} target="_blank" rel="noopener noreferrer">{hh.label || 'Резюме на hh.ru'}<Icon name="external" /></a>}
  </div>;
}

function EngagementCard({ engagement, organization, assignments, projectMap, selected }: { engagement: CareerEngagement; organization?: CareerOrganization; assignments: CareerProjectAssignment[]; projectMap: Map<string, Project>; selected: boolean }) {
  const months = monthsInUnion([engagement]);
  return <article id={`career-${engagement.id}`} className={`engagement-card ${selected ? 'engagement-card--selected' : ''}`} tabIndex={-1} style={{ '--career-accent': engagement.accentColor || '#1768f2' } as React.CSSProperties}>
    <div className="engagement-rail"><i /><span /></div>
    <div className="engagement-main">
      {engagement.transitionFrom && <div className="position-transition"><Icon name="arrow" /><div><strong>{engagement.transitionFrom.title}</strong><span>{dateLabel(engagement.transitionFrom.date, engagement.datePrecision)}</span>{engagement.transitionFrom.description && <p>{engagement.transitionFrom.description}</p>}</div></div>}
      <div className="engagement-head"><OrganizationMark organization={organization} /><div><p>{organization?.name || engagement.organizationId}</p><h3>{engagement.title}</h3><div className="engagement-period"><Icon name="calendar" /><span>{periodLabel(engagement)}</span><i aria-hidden="true" /><strong>{durationLabel(months)}</strong></div></div><b>{employmentNames[engagement.employmentType] || engagement.employmentType}</b></div>
      <p className="engagement-summary">{engagement.summary}</p>
      <div className="engagement-columns">
        <CareerList title="Обязанности" items={engagement.responsibilities} />
        <CareerList title="Что делал" items={engagement.activities} />
        <CareerList title="Результаты" items={engagement.achievements} />
      </div>
      {Boolean(engagement.technologies?.length || engagement.skills?.length) && <div className="career-tags">{[...(engagement.technologies ?? []), ...(engagement.skills ?? [])].filter((item, index, list) => list.indexOf(item) === index).map((item) => <span key={item}>{item}</span>)}</div>}
      {assignments.length > 0 && <div className="career-projects"><h4>Проекты в этой роли</h4><div>{assignments.map((assignment) => { const project = projectMap.get(assignment.projectId); return project ? <CareerProject key={assignment.id} assignment={assignment} project={project} /> : null; })}</div></div>}
      {engagement.keyFacts?.length ? <div className="career-key-facts">{engagement.keyFacts.map((fact) => <div key={`${fact.label}-${fact.value}`}><span>{fact.label}</span><strong>{fact.value}</strong></div>)}</div> : null}
    </div>
  </article>;
}

function CareerList({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null;
  return <section><h4>{title}</h4><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul></section>;
}

function CareerProject({ assignment, project }: { assignment: CareerProjectAssignment; project: Project }) {
  const cover = project.cover ? projectAssetUrl(project.storagePath, project.cover) : '';
  return <Link className="career-project-card" to={`/projects/${project.id}`}>
    {cover ? <SmartImage src={cover} alt="" /> : <span className="career-project-placeholder"><Icon name="projects" /></span>}
    <span><strong>{project.title}</strong><small>{assignment.role || project.type.name}</small>{assignment.contribution && <em>{assignment.contribution}</em>}</span><Icon name="arrow" />
  </Link>;
}

function OrganizationCard({ organization, engagements, assignmentMap }: { organization: CareerOrganization; engagements: CareerEngagement[]; assignmentMap: Map<string, CareerProjectAssignment[]> }) {
  const projectCount = new Set(engagements.flatMap((item) => (assignmentMap.get(item.id) ?? []).map((assignment) => assignment.projectId))).size;
  return <article className="organization-card">
    <div className="organization-head"><OrganizationMark organization={organization} /><div><h3>{organization.name}</h3><span>{organization.industry?.name || organization.kind}</span></div></div>
    {organization.description && <p>{organization.description}</p>}
    <div className={`organization-summary ${projectCount ? '' : 'organization-summary--without-projects'}`}><strong>{durationLabel(monthsInUnion(engagements))}</strong><span>в компании</span><strong>{engagements.length}</strong><span>должностей</span>{projectCount > 0 && <><strong>{projectCount}</strong><span>проектов</span></>}</div>
    {engagements.length > 0 && <div className="organization-roles"><h4>Должности</h4>{[...engagements].sort((a, b) => b.startDate.localeCompare(a.startDate)).map((engagement) => <Link key={engagement.id} to={`/career?engagement=${encodeURIComponent(engagement.id)}`}><span><strong>{engagement.title}</strong><small>{periodLabel(engagement)}</small></span>{engagement.transitionFrom && <em>Переход</em>}<Icon name="arrow" /></Link>)}</div>}
    {organization.facts?.length ? <div className="organization-facts">{organization.facts.map((fact) => <span key={fact.label}><small>{fact.label}</small>{fact.value}</span>)}</div> : null}
    <div className="organization-meta">{organization.location && <span><Icon name="pin" />{organization.location}</span>}{organization.website && <a href={organization.website} target="_blank" rel="noopener noreferrer">Сайт компании<Icon name="external" /></a>}</div>
  </article>;
}

function OrganizationMark({ organization }: { organization?: CareerOrganization }) {
  const logo = organization?.logo ? portfolioAssetUrl(organization.logo) : '';
  return <span className="organization-mark">{logo ? <SmartImage src={logo} alt="" /> : (organization?.shortName || organization?.name || '?').slice(0, 2).toLocaleUpperCase()}</span>;
}
