import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { usePortfolio } from '../context/PortfolioContext';
import { longDate } from '../utils/dates';
import { projectAssetUrl } from '../utils/storageUrl';
import { ErrorState, Loader } from '../components/Feedback';
import { Gallery } from '../components/Gallery';
import { Icon } from '../components/Icon';
import { SmartImage } from '../components/SmartImage';

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
  const images = project.gallery?.map((path) => projectAssetUrl(project.storagePath, path)) ?? [];
  return <article className="page detail-page">
    <Link className="back-link" to="/projects"><Icon name="back" />Назад к проектам</Link>
    <header className="detail-hero">
      <div className="detail-meta"><span>{project.type.name}</span><i /> <span>{project.direction.name}</span></div>
      <h1>{project.title}</h1><time dateTime={project.date}>{longDate(project.date)}</time><p>{project.shortDescription}</p>
    </header>
    <SmartImage className="detail-cover" src={projectAssetUrl(project.storagePath, project.cover)} alt={`Обложка проекта «${project.title}»`} />
    <div className="detail-columns"><div className="detail-main">
      {project.description && <ContentSection title="О проекте"><div className="prose">{project.description.split(/\n\n+/).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></ContentSection>}
      {project.role && <ContentSection title="Моя роль"><p className="role-text">{project.role}</p></ContentSection>}
      {project.tasks?.length ? <ContentSection title="Основные задачи"><NumberedList items={project.tasks} /></ContentSection> : null}
      {project.features?.length ? <ContentSection title="Функциональные возможности"><CheckList items={project.features} /></ContentSection> : null}
      {images.length ? <ContentSection title="Галерея"><Gallery images={images} title={project.title} /></ContentSection> : null}
      {project.results?.length ? <ContentSection title="Результаты"><CheckList items={project.results} /></ContentSection> : null}
      {project.files?.length ? <ContentSection title="Файлы проекта"><div className="files-list">{project.files.map((file) => <a key={file.path} href={projectAssetUrl(project.storagePath, file.path)} download><Icon name="download" /><span><strong>{file.name}</strong><small>{file.description || file.type || 'Файл проекта'}</small></span><b>Скачать</b></a>)}</div></ContentSection> : null}
      {project.links?.length ? <ContentSection title="Ссылки"><div className="external-links">{project.links.map((link) => <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"><Icon name="link" />{link.title}<Icon name="external" /></a>)}</div></ContentSection> : null}
    </div><aside className="detail-aside"><div><span>Тип системы</span><strong>{project.type.name}</strong></div><div><span>Направление</span><strong>{project.direction.name}</strong></div><div><span>Дата</span><strong>{longDate(project.date)}</strong></div><div><span>Технологии</span><div className="technology-list">{project.technologies.map((item) => <span key={item}>{item}</span>)}</div></div></aside></div>
  </article>;
}

function ContentSection({ title, children }: { title: string; children: React.ReactNode }) { return <section className="content-section"><p className="eyebrow eyebrow--dark">{title}</p>{children}</section>; }
function NumberedList({ items }: { items: string[] }) { return <ol className="numbered-list">{items.map((item, index) => <li key={item}><span>{String(index + 1).padStart(2, '0')}</span><p>{item}</p></li>)}</ol>; }
function CheckList({ items }: { items: string[] }) { return <ul className="check-list">{items.map((item) => <li key={item}><span>✓</span>{item}</li>)}</ul>; }
