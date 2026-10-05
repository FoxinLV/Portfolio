import { Link } from 'react-router-dom';
import type { Project } from '../types/project';
import { projectAssetUrl } from '../utils/storageUrl';
import { Icon } from './Icon';
import { SmartImage } from './SmartImage';
import { technologyName, technologyValue } from '../utils/projectTechnology';

const typeClass = (id: string) => `type-dot type-dot--${id.replace(/[^a-z0-9-]/g, '')}`;

export function ProjectCard({ project }: { project: Project }) {
  const file = project.files?.[0];
  return <article className="project-card">
    <Link to={`/projects/${project.id}`} className="project-cover" aria-label={`Открыть проект ${project.title}`}>
      <SmartImage src={projectAssetUrl(project.storagePath, project.cover)} alt={`Обложка проекта «${project.title}»`} loading="lazy" />
      <span className="direction-badge">{project.direction.name}</span>
    </Link>
    <div className="project-card-body">
      <div className="project-type"><span className={typeClass(project.type.id)} />{project.type.name}</div>
      <h3><Link to={`/projects/${project.id}`}>{project.title}</Link></h3>
      <p>{project.shortDescription}</p>
      <div className="technology-list">{project.technologies.slice(0, 5).map((technology, index) => {
        const item = technologyValue(technology);
        const icon = item.icon ? (/^https?:\/\//i.test(item.icon) ? item.icon : projectAssetUrl(project.storagePath, item.icon)) : '';
        return <span key={`${technologyName(technology)}-${index}`}>{icon && <SmartImage className="card-tech-icon" src={icon} alt="" />}{item.name}</span>;
      })}{project.technologies.length > 5 && <span>+{project.technologies.length - 5}</span>}</div>
      <div className="project-card-footer">
        {file ? <a className="file-link" href={projectAssetUrl(project.storagePath, file.path)} download onClick={(event) => event.stopPropagation()}><Icon name="download" />{file.name}</a> : <span />}
        <Link className="round-arrow" to={`/projects/${project.id}`} aria-label={`Подробнее о проекте ${project.title}`}><Icon name="arrow" /></Link>
      </div>
    </div>
  </article>;
}
