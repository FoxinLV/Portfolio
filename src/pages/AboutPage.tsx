import { useEffect } from 'react';
import { ErrorState, Loader } from '../components/Feedback';
import { Icon } from '../components/Icon';
import { SmartImage } from '../components/SmartImage';
import { usePortfolio } from '../context/PortfolioContext';
import { portfolioAssetUrl } from '../utils/storageUrl';

export function AboutPage() {
  const { profile, profileLoading, profileError, retryProfile, projects } = usePortfolio();
  useEffect(() => { document.title = 'Обо мне — Виталий Лифанов'; return () => { document.title = 'Виталий Лифанов — Проекты'; }; }, []);
  if (profileLoading) return <div className="page about-page"><Loader cards={2} /></div>;
  if (profileError || !profile) return <div className="page about-page"><ErrorState title="Не удалось загрузить профиль" message={profileError === 'Адрес Object Storage не настроен' ? 'Укажите адрес Object Storage в переменной VITE_STORAGE_BASE_URL.' : 'Проверьте подключение и повторите попытку.'} onRetry={retryProfile} /></div>;
  return <div className="page about-page">
    <header className="about-hero"><div className="about-copy"><p className="eyebrow">Обо мне</p><h1>{profile.name}</h1><h2>{profile.position}</h2><p>{profile.description}</p><ContactButtons contacts={profile.contacts} /></div><div className="about-photo-wrap">{profile.avatar ? <SmartImage src={portfolioAssetUrl(profile.avatar)} alt={profile.name} className="about-photo" /> : <div className="about-photo avatar--letters">VL</div>}<span className="availability">Открыт к интересным проектам</span></div></header>
    <section className="about-intro"><p className="eyebrow eyebrow--dark">Обо мне</p><div><h2>Создаю системы полного цикла</h2><p>{profile.about || 'От анализа задачи и проектирования архитектуры до реализации, инфраструктуры и аналитики. Соединяю техническую глубину с пониманием бизнес-задачи.'}</p></div></section>
    <section className="specializations"><p className="eyebrow eyebrow--dark">Направления работы</p><div className="specialization-grid">{profile.specializations.map((item, index) => <article key={item.id}><span>{String(index + 1).padStart(2, '0')}</span><h3>{item.title}</h3><p>{item.description}</p></article>)}</div></section>
    <section className="stack-section"><div><p className="eyebrow">Технологический стек</p><h2>Инструменты, с которыми я работаю</h2></div><div className="stack-cloud">{profile.technologies.map((item) => <span key={item}>{item}</span>)}</div></section>
    <section className="about-bottom"><div><p className="eyebrow eyebrow--dark">Подход к проектам</p><h2>От идеи — к работающему решению</h2><p>{profile.approach || 'Сначала разбираюсь в задаче и ограничениях, затем проектирую понятную архитектуру, создаю продукт и довожу его до стабильной эксплуатации.'}</p></div><div className="about-numbers"><div><strong>{projects.length || '—'}</strong><span>проектов в портфолио</span></div><div><strong>{new Set(projects.flatMap((p) => p.technologies)).size || '—'}</strong><span>технологий</span></div></div></section>
  </div>;
}

function ContactButtons({ contacts }: { contacts: { telegram?: string; github?: string; email?: string } }) {
  const items = [
    contacts.telegram && { label: 'Telegram', href: contacts.telegram.startsWith('http') ? contacts.telegram : `https://t.me/${contacts.telegram.replace('@', '')}`, icon: 'telegram' },
    contacts.github && { label: 'GitHub', href: contacts.github, icon: 'github' },
    contacts.email && { label: 'Email', href: `mailto:${contacts.email}`, icon: 'mail' }
  ].filter(Boolean) as { label: string; href: string; icon: string }[];
  return <div className="contact-buttons">{items.map((item) => <a key={item.label} href={item.href} target={item.icon === 'mail' ? undefined : '_blank'} rel="noopener noreferrer"><Icon name={item.icon} />{item.label}</a>)}</div>;
}
