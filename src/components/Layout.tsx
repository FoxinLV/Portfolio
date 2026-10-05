import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { usePortfolio } from '../context/PortfolioContext';
import { portfolioAssetUrl } from '../utils/storageUrl';
import { Icon } from './Icon';
import { SmartImage } from './SmartImage';

const navItems = [{ to: '/about', label: 'Обо мне', icon: 'user' }, { to: '/projects', label: 'Проекты', icon: 'projects' }];

function Contact({ type, value }: { type: string; value?: string }) {
  if (!value) return null;
  const href = type === 'email' ? `mailto:${value}` : value.startsWith('http') ? value : type === 'telegram' ? `https://t.me/${value.replace('@', '')}` : value;
  const icon = type === 'email' ? 'mail' : type;
  return <a className="social-link" href={href} target={type === 'email' ? undefined : '_blank'} rel="noopener noreferrer" aria-label={type}><Icon name={icon} /></a>;
}

export function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { profile } = usePortfolio();
  useEffect(() => { document.body.style.overflow = menuOpen ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [menuOpen]);
  const avatar = profile?.avatar ? portfolioAssetUrl(profile.avatar) : '';
  return <div className="app-shell">
    <button className="mobile-menu-button" onClick={() => setMenuOpen(true)} aria-label="Открыть меню"><Icon name="menu" /></button>
    {menuOpen && <button className="menu-backdrop" onClick={() => setMenuOpen(false)} aria-label="Закрыть меню" />}
    <aside className={`sidebar ${menuOpen ? 'sidebar--open' : ''}`}>
      <button className="sidebar-close" onClick={() => setMenuOpen(false)} aria-label="Закрыть меню"><Icon name="close" /></button>
      <div className="brand">
        {avatar && <SmartImage src={avatar} alt={profile?.name ?? 'Виталий Лифанов'} className="avatar" />}
        <div><strong>{profile?.name ?? 'Виталий Лифанов'}</strong><span>Портфолио проектов</span></div>
      </div>
      <nav className="main-nav" aria-label="Основная навигация">{navItems.map((item) =>
        <NavLink key={item.to} to={item.to} onClick={() => setMenuOpen(false)}><Icon name={item.icon} />{item.label}</NavLink>)}</nav>
      <div className="sidebar-footer">
        <p>Связь</p>
        <div className="socials">
          <Contact type="telegram" value={profile?.contacts.telegram} />
          <Contact type="github" value={profile?.contacts.github} />
          <Contact type="email" value={profile?.contacts.email} />
          {!profile && <><span className="social-placeholder"><Icon name="telegram" /></span><span className="social-placeholder"><Icon name="github" /></span><span className="social-placeholder"><Icon name="mail" /></span></>}
        </div>
        <small>© {new Date().getFullYear()} · Сделано с вниманием к деталям</small>
      </div>
    </aside>
    <main className="main-content"><Outlet /></main>
  </div>;
}
