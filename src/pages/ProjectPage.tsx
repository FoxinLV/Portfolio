import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ErrorState, Loader } from '../components/Feedback';
import { Gallery } from '../components/Gallery';
import { Icon } from '../components/Icon';
import { SmartImage } from '../components/SmartImage';
import { usePortfolio } from '../context/PortfolioContext';
import type { ProjectTechnology } from '../types/project';
import { longDate } from '../utils/dates';
import { technologyValue } from '../utils/projectTechnology';
import { projectAssetUrl } from '../utils/storageUrl';

export function ProjectPage() {
  const { projectId } = useParams();
  const { projects, projectsLoading, projectsError, retryProjects } = usePortfolio();
  const project = projects.find((item) => item.id === projectId);

  useEffect(() => {
    document.title = project ? `${project.title} — Виталий Лифанов` : 'Проект — Виталий Лифанов';
    return () => { document.title = 'Виталий Лифанов — Проекты'; };
  }, [project]);

  if (projectsLoading) return <div className="page detail-page"><Loader cards={2} /></div>;
  if (projectsError) return <div className="page detail-page"><ErrorState title="Не удалось загрузить проект" message="Данные проекта сейчас недоступны." onRetry={retryProjects} /></div>;
  if (!project) return <div className="page detail-page"><div className="state-card"><span className="state-code">404</span><h1>Проект не найден</h1><p>Возможно, он был скрыт или удалён.</p><Link className="button button--primary" to="/projects">К проектам</Link></div></div>;

  const cover = project.cover ? projectAssetUrl(project.storagePath, project.cover) : '';
  const images = [...(cover ? [cover] : []), ...(project.gallery?.map((path) => projectAssetUrl(project.storagePath, path)) ?? [])]
    .filter((image, index, list) => list.indexOf(image) === index);
  const primaryFile = project.files?.[0];

  return <article className="page detail-page">
    <div className="detail-topbar">
      <Link className="back-link" to="/projects"><Icon name="back" />Назад к проектам</Link>
      <ShareButton title={project.title} />
    </div>

    <div className="detail-heading-grid">
      <header className="detail-hero">
        <div className="detail-meta"><span>{project.type.name}</span><i /><span>{project.direction.name}</span></div>
        <div className="detail-title-row"><span className="detail-title-icon"><Icon name="projects" /></span><div><h1>{project.title}</h1><time dateTime={project.date}>{longDate(project.date)}</time></div></div>
        <p>{project.shortDescription}</p>
        <div className="detail-tech-strip">{project.technologies.map((technology, index) => <TechnologyChip key={`${technologyValue(technology).name}-${index}`} technology={technologyValue(technology)} storagePath={project.storagePath} />)}</div>
      </header>

      <aside className="project-info-card">
        <h2>О проекте</h2>
        <InfoRow icon="projects" label="Тип системы" value={project.type.name} />
        <InfoRow icon="compass" label="Направление" value={project.direction.name} />
        <InfoRow icon="calendar" label="Дата" value={longDate(project.date)} />
      </aside>
    </div>

    <div className="detail-showcase-grid">
      <div className="project-gallery">{images.length
        ? <Gallery images={images} title={project.title} featured />
        : <div className="project-gallery-empty"><Icon name="image" /><span>Изображения проекта пока не добавлены</span></div>}
      </div>
      <aside className="project-side-stack">
        <section className="project-tech-card">
          <h2>Ключевые технологии</h2>
          <div className="project-tech-grid">{project.technologies.map((technology, index) => <TechnologyChip key={`${technologyValue(technology).name}-${index}`} technology={technologyValue(technology)} storagePath={project.storagePath} />)}</div>
        </section>
        {primaryFile && <section className="project-download-card">
          <a href={projectAssetUrl(project.storagePath, primaryFile.path)} download><Icon name="download" /><span>Скачать проект</span><Icon name="arrow" /></a>
          <small>{primaryFile.description || primaryFile.type || primaryFile.name}</small>
        </section>}
      </aside>
    </div>

    {(project.tasks?.length || project.features?.length || project.results?.length) && <section className="project-outcomes-grid">
      {project.tasks?.length ? <ContentCard title="Основные задачи" icon="compass"><NumberedList items={project.tasks} /></ContentCard> : null}
      {project.features?.length ? <ContentCard title="Функциональные возможности" icon="gear"><CheckList items={project.features} /></ContentCard> : null}
      {project.results?.length ? <ContentCard title="Результаты" icon="chart"><CheckList items={project.results} /></ContentCard> : null}
    </section>}

    {(project.description || project.role) && <section className="project-story-grid">
      {project.description && <ContentCard title="О проекте" icon="file"><div className="prose">{project.description.split(/\n\n+/).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></ContentCard>}
      {project.role && <ContentCard title="Моя роль" icon="user"><p className="role-text">{project.role}</p></ContentCard>}
    </section>}

    {((project.files?.length ?? 0) > 1 || project.links?.length) && <section className="project-resources-grid">
      {(project.files?.length ?? 0) > 1 && <ContentCard title="Файлы проекта" icon="download"><div className="files-list">{project.files?.slice(1).map((file) => <a key={file.path} href={projectAssetUrl(project.storagePath, file.path)} download><Icon name="download" /><span><strong>{file.name}</strong><small>{file.description || file.type || 'Файл проекта'}</small></span><b>Скачать</b></a>)}</div></ContentCard>}
      {project.links?.length ? <ContentCard title="Ссылки" icon="link"><div className="external-links">{project.links.map((link) => <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"><Icon name="link" />{link.title}<Icon name="external" /></a>)}</div></ContentCard> : null}
    </section>}
  </article>;
}

function TechnologyChip({ technology, storagePath }: { technology: ProjectTechnology; storagePath: string }) {
  const icon = technology.icon
    ? (/^https?:\/\//i.test(technology.icon) ? technology.icon : projectAssetUrl(storagePath, technology.icon))
    : '';
  const content = <>{icon && <SmartImage className="project-tech-icon" src={icon} alt="" />}<span>{technology.name}</span></>;
  return technology.url
    ? <a className="project-tech-chip" href={technology.url} target="_blank" rel="noopener noreferrer">{content}</a>
    : <span className="project-tech-chip">{content}</span>;
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return <div className="project-info-row"><span><Icon name={icon} /></span><div><small>{label}</small><strong>{value}</strong></div></div>;
}

function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    if (navigator.share) await navigator.share({ title, url: window.location.href });
    else { await navigator.clipboard.writeText(window.location.href); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }
  };
  return <button className="share-button" onClick={() => void share()}><Icon name="share" />{copied ? 'Ссылка скопирована' : 'Поделиться'}</button>;
}

function ContentCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return <article className="project-content-card"><h2><Icon name={icon} />{title}</h2>{children}</article>;
}

function NumberedList({ items }: { items: string[] }) {
  return <ol className="numbered-list">{items.map((item, index) => <li key={item}><span>{String(index + 1).padStart(2, '0')}</span><p>{item}</p></li>)}</ol>;
}

function CheckList({ items }: { items: string[] }) {
  return <ul className="check-list">{items.map((item) => <li key={item}><span>✓</span>{item}</li>)}</ul>;
}
