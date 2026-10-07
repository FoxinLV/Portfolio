import { useEffect } from 'react';
import { ErrorState, Loader } from '../components/Feedback';
import { Icon } from '../components/Icon';
import { SmartImage } from '../components/SmartImage';
import { usePortfolio } from '../context/PortfolioContext';
import type { CourseEntry, EducationAttachment, EducationEntry } from '../types/education';
import { portfolioAssetUrl } from '../utils/storageUrl';

function fileSize(size?: number) {
  if (!size) return '';
  return size < 1024 * 1024 ? `${Math.ceil(size / 1024)} КБ` : `${(size / 1024 / 1024).toFixed(1)} МБ`;
}

function Attachments({ items }: { items: EducationAttachment[] }) {
  if (!items.length) return null;
  return <div className="education-files" aria-label="Документы">
    {items.map((file) => <a href={portfolioAssetUrl(file.path)} download={file.name} key={file.path}>
      <span><Icon name="file" /></span><div><strong>{file.name}</strong>{file.size ? <small>{fileSize(file.size)}</small> : null}</div><Icon name="download" />
    </a>)}
  </div>;
}

function EducationCard({ item }: { item: EducationEntry }) {
  return <article className={`education-card ${item.featured ? 'education-card--featured' : ''}`}>
    <div className="education-card-year"><span>{item.graduationYear}</span><small>год окончания</small></div>
    <div className="education-card-body">
      <p className="education-type">{item.level}</p>
      <h3>{item.institution}</h3>
      <dl><div><dt>Факультет</dt><dd>{item.faculty}</dd></div><div><dt>Специализация</dt><dd>{item.specialization}</dd></div></dl>
      {item.description && <p className="education-description">{item.description}</p>}
      <Attachments items={item.attachments} />
    </div>
    {item.image && <SmartImage className="education-card-image" src={portfolioAssetUrl(item.image)} alt={`Документ: ${item.institution}`} />}
  </article>;
}

function CourseCard({ item }: { item: CourseEntry }) {
  return <article className={`course-card ${item.image ? 'course-card--with-image' : 'course-card--without-image'} ${item.featured ? 'course-card--featured' : ''}`}>
    {item.image && <SmartImage className="course-card-image" src={portfolioAssetUrl(item.image)} alt={`Сертификат: ${item.title}`} />}
    <div className="course-card-body">
      <div className="course-card-meta"><span>{item.completionYear}</span><small>Курс / повышение квалификации</small></div>
      <h3>{item.title}</h3>
      <p className="course-organization">{item.organization}</p>
      <div className="course-specialization"><span>Специализация</span><strong>{item.specialization}</strong></div>
      {item.description && <p className="education-description">{item.description}</p>}
      <div className="course-actions">
        {item.credentialUrl && <a href={item.credentialUrl} target="_blank" rel="noopener noreferrer">Проверить сертификат <Icon name="external" /></a>}
      </div>
      <Attachments items={item.attachments} />
    </div>
  </article>;
}

export function EducationPage() {
  const { education, educationLoading, educationError, retryEducation } = usePortfolio();

  useEffect(() => {
    document.title = 'Образование — Виталий Лифанов';
    return () => { document.title = 'Виталий Лифанов — Проекты'; };
  }, []);

  if (educationLoading) return <div className="page education-page"><div className="education-content"><Loader cards={3} /></div></div>;
  if (educationError) return <div className="page education-page"><div className="education-content"><ErrorState title="Не удалось загрузить образование" message="Данные об образовании сейчас недоступны." onRetry={retryEducation} /></div></div>;
  if (!education) return <div className="page education-page"><div className="education-empty"><Icon name="education" /><h1>Раздел готовится</h1><p>Информация об образовании и курсах появится после публикации.</p></div></div>;

  const entries = [...education.education].sort((a, b) => b.graduationYear - a.graduationYear || (a.order ?? 0) - (b.order ?? 0));
  const courses = [...education.courses].sort((a, b) => b.completionYear - a.completionYear || (a.order ?? 0) - (b.order ?? 0));

  return <div className="page education-page">
    <header className="education-hero">
      <div><p className="eyebrow">Профессиональная база</p><h1>Образование<span>.</span></h1><h2>{education.headline}</h2><p>{education.summary}</p></div>
      <div className="education-hero-stats"><article><strong>{entries.length}</strong><span>уровней образования</span></article><article><strong>{courses.length}</strong><span>курсов и программ</span></article></div>
    </header>
    <main className="education-content">
      {entries.length > 0 && <section className="education-section"><div className="education-section-heading"><p className="section-kicker">Основное образование</p><h2>Академическая подготовка</h2><p>Учебные заведения, факультеты и полученные специализации.</p></div><div className="education-list">{entries.map((item) => <EducationCard item={item} key={item.id} />)}</div></section>}
      {courses.length > 0 && <section className="education-section"><div className="education-section-heading"><p className="section-kicker">Непрерывное развитие</p><h2>Курсы и повышение квалификации</h2><p>Дополнительные программы, подтверждающие актуальные знания и навыки.</p></div><div className="course-grid">{courses.map((item) => <CourseCard item={item} key={item.id} />)}</div></section>}
    </main>
  </div>;
}
