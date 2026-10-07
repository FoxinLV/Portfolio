import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { loadProjects } from '../services/projects.service';
import { loadProfile } from '../services/profile.service';
import { loadCareer } from '../services/career.service';
import type { Career } from '../types/career';
import type { Project } from '../types/project';
import type { Profile } from '../types/profile';

interface PortfolioState {
  projects: Project[];
  profile: Profile | null;
  career: Career | null;
  projectsLoading: boolean;
  profileLoading: boolean;
  careerLoading: boolean;
  projectsError: string;
  profileError: string;
  careerError: string;
  retryProjects: () => void;
  retryProfile: () => void;
  retryCareer: () => void;
}

const PortfolioContext = createContext<PortfolioState | null>(null);

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [career, setCareer] = useState<Career | null>(null);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [careerLoading, setCareerLoading] = useState(true);
  const [projectsError, setProjectsError] = useState('');
  const [profileError, setProfileError] = useState('');
  const [careerError, setCareerError] = useState('');

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

  const retryCareer = useCallback(() => {
    setCareerLoading(true); setCareerError('');
    loadCareer().then(setCareer).catch((error: unknown) => setCareerError(error instanceof Error ? error.message : 'Неизвестная ошибка'))
      .finally(() => setCareerLoading(false));
  }, []);

  useEffect(() => { retryProjects(); retryProfile(); retryCareer(); }, [retryProjects, retryProfile, retryCareer]);
  return <PortfolioContext.Provider value={{ projects, profile, career, projectsLoading, profileLoading, careerLoading, projectsError, profileError, careerError, retryProjects, retryProfile, retryCareer }}>{children}</PortfolioContext.Provider>;
}

export function usePortfolio() {
  const value = useContext(PortfolioContext);
  if (!value) throw new Error('usePortfolio должен использоваться внутри PortfolioProvider');
  return value;
}
