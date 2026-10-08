import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ErrorState, Loader } from '../components/Feedback';
import { Icon } from '../components/Icon';
import { ResumeDownloadButton } from '../components/ResumeDownloadButton';
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
  const [view, setView] = useState<'timeline' | 'organizations' | 'gantt'>('timeline');

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
  const organizations = [...career.organizations].sort((first, second) => {
    const firstRoles = engagements.filter((item) => item.organizationId === first.id);
    const secondRoles = engagements.filter((item) => item.organizationId === second.id);
    const firstActive = firstRoles.some((item) => !item.endDate);
    const secondActive = secondRoles.some((item) => !item.endDate);
    if (firstActive !== secondActive) return secondActive ? 1 : -1;
    const newestStart = (items: CareerEngagement[]) => items.reduce(
      (latest, item) => item.startDate > latest ? item.startDate : latest,
      '',
    );
    const latestEnd = (items: CareerEngagement[]) => items.reduce(
      (latest, item) => item.endDate && item.endDate > latest ? item.endDate : latest,
      '',
    );
    const byDate = firstActive && secondActive
      ? newestStart(secondRoles).localeCompare(newestStart(firstRoles))
      : latestEnd(secondRoles).localeCompare(latestEnd(firstRoles))
        || newestStart(secondRoles).localeCompare(newestStart(firstRoles));
    return byDate || (first.order ?? 0) - (second.order ?? 0) || first.name.localeCompare(second.name, 'ru');
  });
  const organizationMap = new Map(organizations.map((item) => [item.id, item]));
  const assignmentMap = new Map<string, CareerProjectAssignment[]>();
  for (const assignment of career.projectAssignments) assignmentMap.set(assignment.engagementId, [...(assignmentMap.get(assignment.engagementId) ?? []), assignment]);
  const linkedProjects = new Set(career.projectAssignments.filter((item) => projectMap.has(item.projectId)).map((item) => item.projectId));
  const activeCount = engagements.filter((item) => !item.endDate).length;
  const experience = durationLabel(monthsInUnion(engagements));
  const activeView = view;

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
        <CareerStat value={String(organizations.length)} label="организаций" />
        <CareerStat value={String(engagements.length)} label="должностей и ролей" />
        <CareerStat value={String(linkedProjects.size)} label="связанных проектов" />
        {career.settings.showParallelWork && activeCount > 1 && <CareerStat value={String(activeCount)} label="активные роли сейчас" />}
      </div>
    </header>

    <main className="career-content">
      <nav className="career-view-switch" aria-label="Вид карьерной истории">
        <div><strong>Как показать опыт</strong><span>Выберите удобную группировку</span></div>
        <div role="group"><button type="button" className={activeView === 'timeline' ? 'active' : ''} aria-pressed={activeView === 'timeline'} onClick={() => setView('timeline')}><Icon name="career" /><span><strong>По должностям</strong><small>От новых к старым</small></span></button><button type="button" className={activeView === 'organizations' ? 'active' : ''} aria-pressed={activeView === 'organizations'} onClick={() => setView('organizations')}><Icon name="projects" /><span><strong>По компаниям</strong><small>Все роли вместе</small></span></button><button type="button" className={activeView === 'gantt' ? 'active' : ''} aria-pressed={activeView === 'gantt'} onClick={() => setView('gantt')}><Icon name="chart" /><span><strong>Диаграмма Ганта</strong><small>Карьера во времени</small></span></button></div>
      </nav>

      {activeView === 'gantt' && <section className="career-section career-gantt-section">
        <div className="career-section-heading"><p className="eyebrow eyebrow--dark">Диаграмма Ганта</p><h2>Карьера во времени</h2><p>Продолжительность должностей и пересечения параллельной работы на одной временной шкале. Нажмите на строку, чтобы открыть подробности роли.</p></div>
        <CareerGantt engagements={engagements} organizationMap={organizationMap} />
      </section>}

      {activeView === 'timeline' && <section className="career-section">
        <div className="career-section-heading"><p className="eyebrow eyebrow--dark">Хронология</p><h2>Профессиональный путь</h2><p>Параллельные роли показаны независимо, а общий стаж не суммирует пересекающиеся периоды дважды.</p></div>
        <div className="career-timeline">{engagements.map((engagement) => <EngagementCard key={engagement.id} engagement={engagement} organization={organizationMap.get(engagement.organizationId)} assignments={assignmentMap.get(engagement.id) ?? []} projectMap={projectMap} selected={selected === engagement.id} />)}</div>
      </section>}

      {activeView === 'organizations' && <section className="career-section career-organizations">
        <div className="career-section-heading"><p className="eyebrow eyebrow--dark">Компании</p><h2>Опыт по компаниям</h2><p>Должности, общий период и реализованные проекты собраны в одном месте.</p></div>
        <div className="organization-grid">{organizations.map((organization) => <OrganizationCard key={organization.id} organization={organization} engagements={engagements.filter((item) => item.organizationId === organization.id)} assignmentMap={assignmentMap} />)}</div>
      </section>}

      <section className="career-resume-panel"><div><p className="eyebrow">Резюме</p><h2>Полная версия профессионального опыта</h2><p>PDF автоматически собирается из актуальных разделов «Обо мне», «Карьера» и «Образование».</p></div><ResumeActions career={career} /></section>
    </main>
  </div>;
}

function CareerStat({ value, label }: { value: string; label: string }) {
  return <div><strong>{value}</strong><span>{label}</span></div>;
}

function ResumeActions({ career }: { career: NonNullable<ReturnType<typeof usePortfolio>['career']> }) {
  const pdf = career.resume?.pdf;
  const hh = career.resume?.hh;
  return <div className="career-actions">
    <ResumeDownloadButton />
    {pdf?.enabled && pdf.path && <a className="career-action-secondary" href={portfolioAssetUrl(pdf.path)} download={pdf.fileName}><Icon name="file" />{pdf.label || 'Готовое PDF-резюме'}</a>}
    {hh?.enabled && /^https:\/\/(?:[a-z0-9-]+\.)*hh\.ru\//i.test(hh.url) && <a className="career-action-secondary" href={hh.url} target="_blank" rel="noopener noreferrer">{hh.label || 'Резюме на hh.ru'}<Icon name="external" /></a>}
  </div>;
}

const ganttGroupDefinitions = [
  { id: 'management', title: 'Руководство и управление', description: 'Стратегия, организация, команда', icon: 'users' },
  { id: 'development', title: 'Аналитика и разработка', description: 'Веб-сервисы, автоматизация, данные', icon: 'code' },
  { id: 'aviation', title: 'Беспилотная авиация', description: 'Эксплуатация БВС, полёты, техническое сопровождение', icon: 'rocket' },
  { id: 'early', title: 'Ранние проекты', description: 'Разработка, автоматизация, специализированные решения', icon: 'career' }
] as const;

type GanttGroupId = typeof ganttGroupDefinitions[number]['id'];

function ganttGroupFor(engagement: CareerEngagement, organization?: CareerOrganization): GanttGroupId {
  const source = [engagement.title, engagement.summary, organization?.name, organization?.industry?.name, ...(engagement.technologies || []), ...(engagement.skills || [])]
    .filter(Boolean).join(' ').toLocaleLowerCase('ru-RU');
  const words = new Set(source.replace(/[^\p{L}\p{N}]+/gu, ' ').split(/\s+/).filter(Boolean));
  if (['учредитель', 'руководитель', 'директор', 'начальник', 'управляющий'].some((word) => words.has(word))) return 'management';
  if (['бпла', 'бвс', 'бас', 'беспилотный', 'беспилотных', 'авиация', 'авиационный', 'пилот', 'дрон'].some((word) => words.has(word))) return 'aviation';
  if (engagement.endDate && monthIndex(engagement.endDate) < monthIndex('2023-07-01')) return 'early';
  return 'development';
}

function CareerGantt({ engagements, organizationMap }: { engagements: CareerEngagement[]; organizationMap: Map<string, CareerOrganization> }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const ganttSignature = engagements.map((item) => `${item.id}:${item.startDate}:${item.endDate || 'now'}`).join('|');

  useEffect(() => {
    const scroll = scrollRef.current;
    if (!scroll) return;
    const frame = requestAnimationFrame(() => { scroll.scrollLeft = scroll.scrollWidth - scroll.clientWidth; });
    return () => cancelAnimationFrame(frame);
  }, [ganttSignature]);

  if (!engagements.length) return null;
  const now = new Date();
  const currentMonth = now.getFullYear() * 12 + now.getMonth();
  const start = Math.min(...engagements.map((item) => monthIndex(item.startDate)));
  const previousByNext = new Map<string, string>();
  engagements.forEach((next) => {
    const explicitPrevious = next.transitionFrom?.engagementId && engagements.find((item) => item.id === next.transitionFrom?.engagementId);
    const previous = explicitPrevious || engagements.find((item) => item.id !== next.id && item.organizationId === next.organizationId && item.endDate && monthIndex(item.endDate) === monthIndex(next.startDate));
    if (previous) previousByNext.set(next.id, previous.id);
  });
  const transitionEndByRole = new Map<string, number>();
  previousByNext.forEach((previousId, nextId) => {
    const next = engagements.find((item) => item.id === nextId);
    if (next) transitionEndByRole.set(previousId, monthIndex(next.startDate));
  });
  const connectedRoleIds = new Set<string>([...previousByNext.keys(), ...previousByNext.values()]);
  const visualRoleEnd = (item: CareerEngagement) => transitionEndByRole.get(item.id) ?? (item.endDate ? monthIndex(item.endDate) + 1 : currentMonth + 1);
  const end = Math.max(...engagements.map(visualRoleEnd));
  const total = Math.max(1, end - start);
  const firstYear = Math.floor(start / 12);
  const lastYear = Math.floor((end - 1) / 12);
  const years = Array.from({ length: lastYear - firstYear + 1 }, (_, index) => {
    const year = firstYear + index;
    const segmentStart = Math.max(start, year * 12);
    const segmentEnd = Math.min(end, (year + 1) * 12);
    return {
      year,
      left: ((segmentStart - start) / total) * 100,
      width: ((segmentEnd - segmentStart) / total) * 100
    };
  });
  const ganttWidth = 300 + years.length * 220;
  const groupByEngagement = new Map(engagements.map((item) => [item.id, ganttGroupFor(item, organizationMap.get(item.organizationId))]));
  for (let pass = 0; pass < engagements.length; pass += 1) {
    previousByNext.forEach((previousId, nextId) => {
      const previousGroup = groupByEngagement.get(previousId);
      if (previousGroup) groupByEngagement.set(nextId, previousGroup);
    });
  }
  const groups = ganttGroupDefinitions.map((definition) => {
    const laneEnds: number[] = [];
    const laneByEngagement = new Map<string, number>();
    const items = engagements
      .filter((engagement) => groupByEngagement.get(engagement.id) === definition.id)
      .sort((first, second) => first.startDate.localeCompare(second.startDate))
      .map((engagement, colorIndex) => {
        const roleStart = monthIndex(engagement.startDate);
        const roleEnd = visualRoleEnd(engagement);
        const previousLane = laneByEngagement.get(previousByNext.get(engagement.id) || '');
        let lane = previousLane !== undefined && roleStart >= laneEnds[previousLane] ? previousLane : laneEnds.findIndex((laneEnd) => roleStart >= laneEnd);
        if (lane === -1) { lane = laneEnds.length; laneEnds.push(roleEnd); } else laneEnds[lane] = roleEnd;
        laneByEngagement.set(engagement.id, lane);
        return { engagement, roleStart, roleEnd, lane, colorIndex, connected: previousByNext.has(engagement.id), inChain: connectedRoleIds.has(engagement.id) };
      });
    return { ...definition, items, laneCount: Math.max(1, laneEnds.length) };
  }).filter((group) => group.items.length > 0);

  return <div className="career-gantt-shell">
    <div className="career-gantt-scroll" ref={scrollRef} tabIndex={0} aria-label="Диаграмма карьерных периодов. На узком экране прокручивается по горизонтали.">
      <div className="career-gantt" style={{ minWidth: `${ganttWidth}px` }}>
        <div className="career-gantt-header"><span aria-hidden="true" /><div className="career-gantt-scale">{years.map((item) => <span key={item.year} style={{ left: `${item.left}%`, width: `${item.width}%` }}>{item.year}</span>)}</div></div>
        <div className="career-gantt-groups">{groups.map((group) => <section className={`career-gantt-group career-gantt-group--${group.id}`} key={group.id}>
          <header><span><Icon name={group.icon} /></span><div><h3>{group.title}</h3><p>{group.description}</p></div></header>
          <div className="career-gantt-track" style={{ '--gantt-lanes': group.laneCount } as React.CSSProperties}>
            {years.map((item, index) => <i aria-hidden="true" className={index % 2 ? 'career-gantt-year career-gantt-year--alternate' : 'career-gantt-year'} key={item.year} style={{ left: `${item.left}%`, width: `${item.width}%` }} />)}
            {group.items.map(({ engagement, roleStart, roleEnd, lane, colorIndex, connected, inChain }) => {
              const organization = organizationMap.get(engagement.organizationId);
              const left = ((roleStart - start) / total) * 100;
              const right = ((end - roleEnd) / total) * 100;
              const width = Math.max(1.4, ((roleEnd - roleStart) / total) * 100);
              const anchorRight = left > 50;
              return <Link
                className={`career-gantt-card ${inChain ? 'career-gantt-card--chain' : ''} ${connected ? 'career-gantt-card--connected' : ''}`}
                to={`/career?engagement=${encodeURIComponent(engagement.id)}`}
                key={engagement.id}
                title={`${organization?.name || engagement.organizationId} — ${engagement.title}. ${periodLabel(engagement)} · ${durationLabel(monthsInUnion([engagement]))}`}
                style={{ '--gantt-left': anchorRight ? 'auto' : `${left}%`, '--gantt-right': anchorRight ? `${right}%` : 'auto', '--gantt-width': `${width}%`, '--gantt-lane': lane, '--career-accent': engagement.accentColor || `var(--gantt-color-${(colorIndex % 5) + 1})` } as React.CSSProperties}
              >
                <strong>{organization?.name || engagement.organizationId}</strong>
                <span>{engagement.title}</span>
                <small>{periodLabel(engagement)} · {durationLabel(monthsInUnion([engagement]))}</small>
                <Icon name="arrow" />
              </Link>;
            })}
          </div>
        </section>)}</div>
      </div>
    </div>
    <p className="career-gantt-hint"><Icon name="timeline" />На узком экране диаграмму можно прокручивать по горизонтали</p>
  </div>;
}

function EngagementCard({ engagement, organization, assignments, projectMap, selected }: { engagement: CareerEngagement; organization?: CareerOrganization; assignments: CareerProjectAssignment[]; projectMap: Map<string, Project>; selected: boolean }) {
  const months = monthsInUnion([engagement]);
  const [expanded, setExpanded] = useState(selected);
  const detailsId = `career-details-${engagement.id}`;
  const hasDetails = Boolean(
    engagement.transitionFrom || engagement.responsibilities?.length || engagement.activities?.length ||
    engagement.achievements?.length || engagement.technologies?.length || engagement.skills?.length ||
    assignments.length || engagement.keyFacts?.length
  );

  useEffect(() => {
    if (selected) setExpanded(true);
  }, [selected]);

  return <article id={`career-${engagement.id}`} className={`engagement-card ${selected ? 'engagement-card--selected' : ''}`} tabIndex={-1} style={{ '--career-accent': engagement.accentColor || '#1768f2' } as React.CSSProperties}>
    <div className="engagement-rail"><i /><span /></div>
    <div className="engagement-main">
      <div className="engagement-head"><OrganizationMark organization={organization} /><div><p>{organization?.name || engagement.organizationId}</p><h3>{engagement.title}</h3><div className="engagement-period"><Icon name="calendar" /><span>{periodLabel(engagement)}</span><i aria-hidden="true" /><strong>{durationLabel(months)}</strong></div></div><b>{employmentNames[engagement.employmentType] || engagement.employmentType}</b></div>
      <p className="engagement-summary">{engagement.summary}</p>
      {hasDetails && <button className="engagement-toggle" type="button" aria-expanded={expanded} aria-controls={detailsId} onClick={() => setExpanded((value) => !value)}><span>{expanded ? 'Скрыть подробности' : 'Показать всю информацию'}</span><Icon name="arrow" /></button>}
      {hasDetails && expanded && <div className="engagement-details" id={detailsId}>
        {engagement.transitionFrom && <div className="position-transition"><Icon name="arrow" /><div><strong>{engagement.transitionFrom.title}</strong><span>{dateLabel(engagement.transitionFrom.date, engagement.datePrecision)}</span>{engagement.transitionFrom.description && <p>{engagement.transitionFrom.description}</p>}</div></div>}
        <div className="engagement-columns">
          <CareerList title="Обязанности" items={engagement.responsibilities} />
          <CareerList title="Что делал" items={engagement.activities} />
          <CareerList title="Результаты" items={engagement.achievements} />
        </div>
        {Boolean(engagement.technologies?.length || engagement.skills?.length) && <div className="career-tags">{[...(engagement.technologies ?? []), ...(engagement.skills ?? [])].filter((item, index, list) => list.indexOf(item) === index).map((item) => <span key={item}>{item}</span>)}</div>}
        {assignments.length > 0 && <div className="career-projects"><h4>Проекты в этой роли</h4><div>{assignments.map((assignment) => { const project = projectMap.get(assignment.projectId); return project ? <CareerProject key={assignment.id} assignment={assignment} project={project} /> : null; })}</div></div>}
        {engagement.keyFacts?.length ? <div className="career-key-facts">{engagement.keyFacts.map((fact) => <div key={`${fact.label}-${fact.value}`}><span>{fact.label}</span><strong>{fact.value}</strong></div>)}</div> : null}
      </div>}
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
    {organization.description && <p className="organization-description">{organization.description}</p>}
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
