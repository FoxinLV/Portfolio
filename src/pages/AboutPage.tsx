import { useEffect } from 'react';
import { ErrorState, Loader } from '../components/Feedback';
import { Icon } from '../components/Icon';
import { SmartImage } from '../components/SmartImage';
import { usePortfolio } from '../context/PortfolioContext';
import { portfolioAssetUrl } from '../utils/storageUrl';

const workIcons = ['compass', 'database', 'chart', 'users'];

function technologyItems(items: string[]) {
  return items.flatMap((item) => item.endsWith(':')
    ? []
    : item.split(',').map((technology) => technology.trim()).filter(Boolean));
}

function approachSummary(value?: string) {
  if (!value) return 'Сначала разбираюсь в задаче, затем проектирую архитектуру, создаю продукт и довожу его до стабильной эксплуатации.';
  return value.split(/\n\s*\n/).slice(0, 2).join(' ');
}

export function AboutPage() {
  const { profile, profileLoading, profileError, retryProfile, projects } = usePortfolio();

  useEffect(() => {
    document.title = 'Обо мне — Виталий Лифанов';
    return () => { document.title = 'Виталий Лифанов — Проекты'; };
  }, []);

  if (profileLoading) return <div className="page about-page"><Loader cards={2} /></div>;
  if (profileError || !profile) return <div className="page about-page"><ErrorState title="Не удалось загрузить профиль" message={profileError === 'Адрес Object Storage не настроен' ? 'Укажите адрес Object Storage в переменной VITE_STORAGE_BASE_URL.' : 'Проверьте подключение и повторите попытку.'} onRetry={retryProfile} /></div>;

  const technologies = technologyItems(profile.technologies);
  const projectCount = projects.length ? `${projects.length}+` : '10+';

  return <div className="page about-page">
    <header className="about-hero">
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

      <div className="about-photo-wrap">
        {profile.avatar
          ? <SmartImage src={portfolioAssetUrl(profile.avatar)} alt={profile.name} className="about-photo" />
          : <div className="about-photo avatar--letters">VL</div>}
        <span className="about-location"><Icon name="pin" /> Москва, РФ</span>
        <span className="availability"><i /> <span><strong>Открыт к интересным проектам</strong><small>Веб-разработка • Аналитика • Интеграции</small></span></span>
      </div>
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
          <div className="stack-cloud">{technologies.map((item) => <span key={item}>{item}</span>)}</div>
        </article>

        <article className="approach-card">
          <div className="approach-grid" aria-hidden="true" />
          <p className="section-kicker section-kicker--dark">Подход к проектам</p>
          <h2>От идеи — к работающему решению</h2>
          <p>{approachSummary(profile.approach)}</p>
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
    contacts.email && { label: 'Email', href: `mailto:${contacts.email}`, icon: 'mail' }
  ].filter(Boolean) as { label: string; href: string; icon: string; primary?: boolean }[];

  return <div className="contact-buttons">{items.map((item) => <a className={item.primary ? 'contact-primary' : ''} key={item.label} href={item.href} target={item.icon === 'mail' ? undefined : '_blank'} rel="noopener noreferrer"><Icon name={item.icon} /><span>{item.label}</span><Icon name="arrow" /></a>)}</div>;
}
