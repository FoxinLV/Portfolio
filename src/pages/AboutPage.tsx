import { useEffect } from 'react';
import { ErrorState, Loader } from '../components/Feedback';
import { Icon } from '../components/Icon';
import { SmartImage } from '../components/SmartImage';
import { EXTERNAL_LINKS } from '../config/externalLinks';
import { usePortfolio } from '../context/PortfolioContext';
import type { TechnologyGroup, TechnologyItem } from '../types/profile';
import type { TechnologyCatalog } from '../types/technology';
import { portfolioAssetUrl } from '../utils/storageUrl';

const workIcons = ['compass', 'database', 'chart', 'users'];

function technologyGroups(items: string[] | TechnologyGroup[], catalog: TechnologyCatalog | null): TechnologyGroup[] {
  if (catalog?.technologies.length) return [...catalog.categories]
    .sort((first, second) => first.order - second.order)
    .map((category) => ({
      category: category.name,
      items: catalog.technologies.filter((item) => item.category === category.id)
        .sort((first, second) => first.order - second.order || first.name.localeCompare(second.name, 'ru'))
    })).filter((group) => group.items.length);
  if (items.length === 0) return [];
  if (typeof items[0] !== 'string') return items as TechnologyGroup[];

  const groups: TechnologyGroup[] = [];
  for (const value of items as string[]) {
    if (value.trim().endsWith(':')) {
      groups.push({ category: value.trim().replace(/:$/, ''), items: [] });
      continue;
    }
    if (groups.length === 0) groups.push({ category: 'Технологии', items: [] });
    groups.at(-1)?.items.push(...value.split(',').map((item) => item.trim()).filter(Boolean));
  }
  return groups;
}

function technologyValue(item: string | TechnologyItem): TechnologyItem {
  return typeof item === 'string' ? { name: item } : item;
}

function technologyIconUrl(icon: string) {
  return /^https?:\/\//i.test(icon) ? icon : portfolioAssetUrl(icon);
}

function approachItems(value?: string) {
  const source = value || 'Сначала задача — потом технология.\nСначала разбираюсь в задаче, затем проектирую архитектуру, создаю продукт и довожу его до стабильной эксплуатации.';
  return source.split(/\n\s*\n/).map((block) => {
    const [heading, ...description] = block.split('\n').map((line) => line.trim()).filter(Boolean);
    return { title: heading.replace(/\.$/, ''), description: description.join(' ') };
  }).filter((item) => item.title);
}

export function AboutPage() {
  const { profile, profileLoading, profileError, retryProfile, projects, technologyCatalog } = usePortfolio();

  useEffect(() => {
    document.title = 'Обо мне — Виталий Лифанов';
    return () => { document.title = 'Виталий Лифанов — Проекты'; };
  }, []);

  if (profileLoading) return <div className="page about-page"><Loader cards={2} /></div>;
  if (profileError || !profile) return <div className="page about-page"><ErrorState title="Не удалось загрузить профиль" message={profileError === 'Адрес Object Storage не настроен' ? 'Укажите адрес Object Storage в переменной VITE_STORAGE_BASE_URL.' : 'Проверьте подключение и повторите попытку.'} onRetry={retryProfile} /></div>;

  const technologies = technologyGroups(profile.technologies, technologyCatalog);
  const projectCount = projects.length;
  const principles = approachItems(profile.approach);

  return <div className="page about-page">
    <header className={`about-hero ${profile.avatar ? '' : 'about-hero--without-photo'}`}>
      <div className="about-hero-glow" aria-hidden="true" />
      <div className="about-copy">
        <p className="about-kicker"><span /> Обо мне</p>
        <h1>{profile.name}<i>.</i></h1>
        <h2>{profile.position}</h2>
        <p className="about-description">{profile.description}</p>
        <ContactButtons contacts={profile.contacts} />

        <div className="about-highlights">
          <article><Icon name="layers" /><div><strong>{projectCount}</strong><span>Реализованных<br />проектов</span></div></article>
          <article><Icon name="gear" /><div><strong>Полный<br />цикл разработки</strong><span>от идеи до внедрения</span></div></article>
          <article><Icon name="chart" /><div><strong>Аналитика<br />и данные</strong><span>BI, базы данных</span></div></article>
          <article><Icon name="cloud" /><div><strong>Современные<br />технологии</strong><span>от веба до инфраструктуры</span></div></article>
        </div>
      </div>

      {profile.avatar && <div className="about-photo-wrap">
        <SmartImage src={portfolioAssetUrl(profile.avatar)} alt={profile.name} className="about-photo" />
        <span className="about-location"><Icon name="pin" /> Москва, РФ</span>
        <span className="availability"><i /> <span><strong>Открыт к интересным проектам</strong><small>Веб-разработка • Аналитика • Интеграции</small></span></span>
      </div>}
    </header>

    <main className="about-content">
      <section className="about-overview">
        <div className="about-intro">
          <p className="section-kicker">Направления работы</p>
          <h2>Создаю системы полного цикла</h2>
          <p>{profile.about?.split(/\n\s*\n/)[0] || 'Создаю законченные рабочие системы: от анализа задачи и проектирования архитектуры до запуска и развития продукта.'}</p>
        </div>

        <div className="work-grid">
          {profile.specializations.slice(0, 4).map((item, index) => <article key={item.id}>
            <span><Icon name={workIcons[index]} /></span>
            <div><h3>{item.title}</h3><p>{item.description}</p></div>
          </article>)}
        </div>
      </section>

      <section className="about-details">
        <article className="stack-card">
          <p className="section-kicker">Технологический стек</p>
          <h2>Инструменты, с которыми я работаю</h2>
          <div className="technology-groups">{technologies.map((group) => <section className="technology-group" key={group.category}>
            <h3>{group.category}</h3>
            <div className="technology-items">{group.items.map((source, index) => {
              const item = technologyValue(source);
              const content = <>{item.icon && <SmartImage className="technology-icon" src={technologyIconUrl(item.icon)} alt="" />}<span>{item.name}</span></>;
              return item.url
                ? <a className="technology-chip" href={item.url} target="_blank" rel="noopener noreferrer" key={`${item.name}-${index}`}>{content}</a>
                : <span className="technology-chip" key={`${item.name}-${index}`}>{content}</span>;
            })}</div>
          </section>)}</div>
        </article>

        <article className="approach-card">
          <div className="approach-grid" aria-hidden="true" />
          <p className="section-kicker section-kicker--dark">Подход к проектам</p>
          <h2>От идеи — к работающему решению</h2>
          <div className="approach-principles">
            {principles.map((item, index) => <article key={`${item.title}-${index}`}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <div><h3>{item.title}</h3>{item.description && <p>{item.description}</p>}</div>
            </article>)}
          </div>
          <div className="process-flow">
            {[['idea', 'Идея'], ['file', 'Анализ'], ['layers', 'Проектирование'], ['code', 'Разработка'], ['rocket', 'Запуск'], ['chart', 'Развитие']].map(([icon, label], index, list) => <div className="process-step" key={label}>
              <span><Icon name={icon} /></span><small>{label}</small>{index < list.length - 1 && <i>→</i>}
            </div>)}
          </div>
        </article>
      </section>
    </main>
  </div>;
}

function ContactButtons({ contacts }: { contacts: { telegram?: string; github?: string; email?: string } }) {
  const items = [
    contacts.telegram && { label: 'Telegram', href: contacts.telegram.startsWith('http') ? contacts.telegram : `https://t.me/${contacts.telegram.replace('@', '')}`, icon: 'telegram', primary: true },
    contacts.github && { label: 'GitHub', href: contacts.github, icon: 'github' },
    { label: 'Steam', href: EXTERNAL_LINKS.steam, icon: 'steam' },
    contacts.email && { label: 'Email', href: `mailto:${contacts.email}`, icon: 'mail' }
  ].filter(Boolean) as { label: string; href: string; icon: string; primary?: boolean }[];

  return <div className="contact-buttons">{items.map((item) => <a className={item.primary ? 'contact-primary' : ''} key={item.label} href={item.href} target={item.icon === 'mail' ? undefined : '_blank'} rel="noopener noreferrer"><Icon name={item.icon} /><span>{item.label}</span><Icon name="arrow" /></a>)}</div>;
}
