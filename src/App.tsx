import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AboutPage } from './pages/AboutPage';
import { ProjectPage } from './pages/ProjectPage';
import { ProjectsPage } from './pages/ProjectsPage';

export function App() {
  return <Routes><Route element={<Layout />}><Route index element={<Navigate to="/projects" replace />} /><Route path="projects" element={<ProjectsPage />} /><Route path="projects/:projectId" element={<ProjectPage />} /><Route path="about" element={<AboutPage />} /><Route path="*" element={<Navigate to="/projects" replace />} /></Route></Routes>;
}
