import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import bundledTechnologyCatalog from '../../technology-catalog.s3.json';
import { loadProjects } from '../services/projects.service';
import { loadProfile } from '../services/profile.service';
import { loadCareer } from '../services/career.service';
import { loadEducation } from '../services/education.service';
import { loadTechnologyCatalog } from '../services/technologies.service';
import type { Career } from '../types/career';
import type { Education } from '../types/education';
import type { Project } from '../types/project';
import type { Profile } from '../types/profile';
import type { TechnologyCatalog } from '../types/technology';

interface PortfolioState {
  projects: Project[];
  profile: Profile | null;
  career: Career | null;
  education: Education | null;
  technologyCatalog: TechnologyCatalog | null;
  projectsLoading: boolean;
  profileLoading: boolean;
  careerLoading: boolean;
  educationLoading: boolean;
  projectsError: string;
  profileError: string;
  careerError: string;
  educationError: string;
  retryProjects: () => void;
  retryProfile: () => void;
  retryCareer: () => void;
  retryEducation: () => void;
}

const PortfolioContext = createContext<PortfolioState | null>(null);

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [career, setCareer] = useState<Career | null>(null);
  const [education, setEducation] = useState<Education | null>(null);
  const [technologyCatalog, setTechnologyCatalog] = useState<TechnologyCatalog | null>(bundledTechnologyCatalog as TechnologyCatalog);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [careerLoading, setCareerLoading] = useState(true);
  const [educationLoading, setEducationLoading] = useState(true);
  const [projectsError, setProjectsError] = useState('');
  const [profileError, setProfileError] = useState('');
  const [careerError, setCareerError] = useState('');
  const [educationError, setEducationError] = useState('');

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

  const retryEducation = useCallback(() => {
    setEducationLoading(true); setEducationError('');
    loadEducation().then(setEducation).catch((error: unknown) => setEducationError(error instanceof Error ? error.message : 'Неизвестная ошибка'))
      .finally(() => setEducationLoading(false));
  }, []);

  useEffect(() => {
    retryProjects(); retryProfile(); retryCareer(); retryEducation();
    loadTechnologyCatalog().then(setTechnologyCatalog).catch((error: unknown) => {
      if (import.meta.env.DEV) console.warn('Справочник технологий недоступен, используется резервный вывод.', error);
    });
  }, [retryProjects, retryProfile, retryCareer, retryEducation]);
  return <PortfolioContext.Provider value={{ projects, profile, career, education, technologyCatalog, projectsLoading, profileLoading, careerLoading, educationLoading, projectsError, profileError, careerError, educationError, retryProjects, retryProfile, retryCareer, retryEducation }}>{children}</PortfolioContext.Provider>;
}

export function usePortfolio() {
  const value = useContext(PortfolioContext);
  if (!value) throw new Error('usePortfolio должен использоваться внутри PortfolioProvider');
  return value;
}
