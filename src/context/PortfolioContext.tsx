import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { loadProjects } from '../services/projects.service';
import { loadProfile } from '../services/profile.service';
import type { Project } from '../types/project';
import type { Profile } from '../types/profile';

interface PortfolioState {
  projects: Project[];
  profile: Profile | null;
  projectsLoading: boolean;
  profileLoading: boolean;
  projectsError: string;
  profileError: string;
  retryProjects: () => void;
  retryProfile: () => void;
}

const PortfolioContext = createContext<PortfolioState | null>(null);

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [projectsError, setProjectsError] = useState('');
  const [profileError, setProfileError] = useState('');

  const retryProjects = useCallback(() => {
    setProjectsLoading(true); setProjectsError('');
    loadProjects().then(setProjects).catch((error: unknown) => setProjectsError(error instanceof Error ? error.message : 'Неизвестная ошибка'))
      .finally(() => setProjectsLoading(false));
  }, []);
  const retryProfile = useCallback(() => {
    setProfileLoading(true); setProfileError('');
    loadProfile().then(setProfile).catch((error: unknown) => setProfileError(error instanceof Error ? error.message : 'Неизвестная ошибка'))
      .finally(() => setProfileLoading(false));
  }, []);

  useEffect(() => { retryProjects(); retryProfile(); }, [retryProjects, retryProfile]);
  return <PortfolioContext.Provider value={{ projects, profile, projectsLoading, profileLoading, projectsError, profileError, retryProjects, retryProfile }}>{children}</PortfolioContext.Provider>;
}

export function usePortfolio() {
  const value = useContext(PortfolioContext);
  if (!value) throw new Error('usePortfolio должен использоваться внутри PortfolioProvider');
  return value;
}
